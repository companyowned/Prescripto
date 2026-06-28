"""Signed, time-limited tokens embedded in profile QR codes."""

from datetime import timedelta
from uuid import UUID

from jose import JWTError, jwt

from app.core.config import settings
from app.core.exceptions import BadRequestError

PROFILE_QR_TOKEN_TYPE = "profile_qr"
PROFILE_QR_SUBJECT = "profile_qr"
# QR should rotate; keep TTL long enough for in-clinic sharing but bounded.
PROFILE_QR_TTL_HOURS = 72


def create_profile_qr_token(profile_id: UUID) -> str:
    from datetime import datetime, timezone

    expire = datetime.now(timezone.utc) + timedelta(hours=PROFILE_QR_TTL_HOURS)
    payload = {
        "sub": PROFILE_QR_SUBJECT,
        "typ": PROFILE_QR_TOKEN_TYPE,
        "pid": str(profile_id),
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_profile_qr_token(token: str) -> UUID:
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
    except JWTError as e:
        raise BadRequestError("Invalid or expired profile QR token") from e
    if payload.get("typ") != PROFILE_QR_TOKEN_TYPE or payload.get("sub") != PROFILE_QR_SUBJECT:
        raise BadRequestError("Invalid profile QR token")
    pid = payload.get("pid")
    if not pid:
        raise BadRequestError("Invalid profile QR token")
    try:
        return UUID(pid)
    except ValueError as e:
        raise BadRequestError("Invalid profile QR token") from e
