"""Auth API router — register, login, and password reset endpoints."""

import logging
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.rate_limit import limiter
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.db.session import get_db
from app.repos.password_reset_repo import PasswordResetRepo
from app.repos.refresh_token_repo import RefreshTokenRepo
from app.repos.user_repo import UserRepo
from app.controllers.profile_controller import PatientProfileController
from app.schemas.user import (
    LogoutRequest,
    MessageResponse,
    PasswordResetConfirmRequest,
    PasswordResetRequest,
    PasswordResetVerifyRequest,
    PushTokenRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
    UserUpdateRequest,
)
from app.utils.email_service import EmailConfigurationError, send_password_reset_otp

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def register(request: Request, data: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    existing = await UserRepo.get_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    hashed = hash_password(data.password)
    user = await UserRepo.create(db, email=data.email, full_name=data.full_name, hashed_password=hashed)
    await PatientProfileController.ensure_default_profile(db, user.id, user.full_name)

    return UserResponse(id=str(user.id), email=user.email, full_name=user.full_name)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, data: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return a short-lived access token plus a long-lived refresh token."""
    user = await UserRepo.get_by_email(db, data.email)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    await RefreshTokenRepo.ensure_table()
    token = create_access_token(data={"sub": str(user.id)})
    refresh_token, _ = await RefreshTokenRepo.issue(db, user.id)
    await db.commit()
    return TokenResponse(access_token=token, refresh_token=refresh_token)


@router.post("/token/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """Exchange a valid refresh token for a new access token, rotating the refresh token.

    Lets a client resume a session indefinitely (until the refresh token
    expires or is revoked) without asking for a password again — this is
    what makes biometric login "lifetime" rather than tied to the 30-minute
    access token.
    """
    await RefreshTokenRepo.ensure_table()
    row = await RefreshTokenRepo.get_active(db, data.refresh_token)
    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    await RefreshTokenRepo.revoke(db, row)
    new_refresh_token, _ = await RefreshTokenRepo.issue(db, row.user_id)
    new_access_token = create_access_token(data={"sub": str(row.user_id)})
    await db.commit()
    return TokenResponse(access_token=new_access_token, refresh_token=new_refresh_token)


@router.post("/logout", response_model=MessageResponse)
async def logout(data: LogoutRequest, db: AsyncSession = Depends(get_db)):
    """Revoke a refresh token server-side (e.g. on manual logout or disabling biometric login)."""
    if data.refresh_token:
        await RefreshTokenRepo.ensure_table()
        await RefreshTokenRepo.revoke_raw(db, data.refresh_token)
        await db.commit()
    return MessageResponse(detail="Logged out")


@router.post("/password-reset/request", response_model=MessageResponse)
@limiter.limit("5/minute")
async def request_password_reset(request: Request, data: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    """Create a password reset OTP and email it to the user, if the account exists.

    Always responds with the same generic message regardless of whether the
    account exists, to avoid leaking which emails are registered.
    """
    generic_response = MessageResponse(
        detail="If an account exists for that email, a password reset code has been sent."
    )

    email = str(data.email).strip().lower()
    user = await UserRepo.get_by_email(db, email)
    if not user:
        return generic_response

    otp_length = max(settings.PASSWORD_RESET_OTP_LENGTH, 4)
    otp = "".join(secrets.choice("0123456789") for _ in range(otp_length))
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.PASSWORD_RESET_OTP_EXPIRE_MINUTES
    )

    await PasswordResetRepo.ensure_table()
    await PasswordResetRepo.create(
        db,
        user_id=user.id,
        email=email,
        otp_hash=hash_password(otp),
        expires_at=expires_at,
    )
    await db.commit()

    try:
        await send_password_reset_otp(email, otp)
    except EmailConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except Exception:
        logger.error("Could not send password reset email", exc_info=True)
        return generic_response

    return generic_response


@router.post("/password-reset/confirm", response_model=MessageResponse)
async def confirm_password_reset(data: PasswordResetConfirmRequest, db: AsyncSession = Depends(get_db)):
    """Validate a password reset OTP and set a new password."""
    email = str(data.email).strip().lower()
    user = await UserRepo.get_by_email(db, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with that email",
        )

    await PasswordResetRepo.ensure_table()
    reset_otp = await PasswordResetRepo.get_latest_active(db, user.id, email)
    if not reset_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset code is invalid or expired",
        )

    if reset_otp.attempts >= settings.PASSWORD_RESET_MAX_ATTEMPTS:
        reset_otp.used_at = datetime.now(timezone.utc)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many incorrect attempts. Request a new code.",
        )

    if not verify_password(data.otp.strip(), reset_otp.otp_hash):
        reset_otp.attempts += 1
        remaining = settings.PASSWORD_RESET_MAX_ATTEMPTS - reset_otp.attempts
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid reset code. {max(remaining, 0)} attempts remaining.",
        )

    reset_otp.used_at = datetime.now(timezone.utc)
    await UserRepo.update(db, user, hashed_password=hash_password(data.new_password))

    return MessageResponse(detail="Password updated successfully")


@router.post("/password-reset/verify", response_model=MessageResponse)
async def verify_password_reset_code(data: PasswordResetVerifyRequest, db: AsyncSession = Depends(get_db)):
    """Validate a password reset OTP before showing the new password form."""
    email = str(data.email).strip().lower()
    user = await UserRepo.get_by_email(db, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with that email",
        )

    await PasswordResetRepo.ensure_table()
    reset_otp = await PasswordResetRepo.get_latest_active(db, user.id, email)
    if not reset_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset code is invalid or expired",
        )

    if reset_otp.attempts >= settings.PASSWORD_RESET_MAX_ATTEMPTS:
        reset_otp.used_at = datetime.now(timezone.utc)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many incorrect attempts. Request a new code.",
        )

    if not verify_password(data.otp.strip(), reset_otp.otp_hash):
        reset_otp.attempts += 1
        remaining = settings.PASSWORD_RESET_MAX_ATTEMPTS - reset_otp.attempts
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid reset code. {max(remaining, 0)} attempts remaining.",
        )

    return MessageResponse(detail="Reset code verified")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    """Get current authenticated user profile."""
    return UserResponse(id=str(current_user.id), email=current_user.email, full_name=current_user.full_name)


@router.put("/me", response_model=UserResponse)
async def update_me(data: UserUpdateRequest, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    """Update current user profile."""
    updated_user = await UserRepo.update(db, current_user, full_name=data.full_name)
    await db.commit()
    return UserResponse(id=str(updated_user.id), email=updated_user.email, full_name=updated_user.full_name)

@router.post("/push-token")
async def update_push_token(data: PushTokenRequest, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    """Register device push token for notifications."""
    from app.utils.notification_service import register_push_token
    await register_push_token(current_user, data.token)
    await db.commit()
    return {"status": "ok"}
