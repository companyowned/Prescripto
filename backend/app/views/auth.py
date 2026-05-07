"""Auth API router — register, login, and password reset endpoints."""

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.db.session import get_db
from app.repos.password_reset_repo import PasswordResetRepo
from app.repos.user_repo import UserRepo
from app.controllers.profile_controller import PatientProfileController
from app.schemas.user import (
    MessageResponse,
    PasswordResetConfirmRequest,
    PasswordResetRequest,
    PushTokenRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
    UserUpdateRequest,
)
from app.utils.email_service import EmailConfigurationError, send_password_reset_otp

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
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
async def login(data: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return JWT token."""
    user = await UserRepo.get_by_email(db, data.email)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(access_token=token)


@router.post("/password-reset/request", response_model=MessageResponse)
async def request_password_reset(data: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    """Create a password reset OTP and email it to the user."""
    email = str(data.email).strip().lower()
    user = await UserRepo.get_by_email(db, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with that email",
        )

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
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not send reset email. Please try again later.",
        ) from exc

    return MessageResponse(detail="Password reset code sent to your email")


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
