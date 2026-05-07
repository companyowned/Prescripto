"""Auth Pydantic schemas for request/response validation."""

from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirmRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=4, max_length=12)
    new_password: str = Field(..., min_length=6, max_length=128)


class MessageResponse(BaseModel):
    detail: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)

class PushTokenRequest(BaseModel):
    token: str
