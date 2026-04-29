"""Auth API router — register and login endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.db.session import get_db
from app.repos.user_repo import UserRepo
from app.controllers.profile_controller import PatientProfileController
from app.schemas.user import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse, UserUpdateRequest, PushTokenRequest

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
