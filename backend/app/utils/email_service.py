"""Transactional email helpers."""

import asyncio
import smtplib
from email.message import EmailMessage
from email.utils import formataddr

from app.core.config import settings


class EmailConfigurationError(RuntimeError):
    """Raised when SMTP settings are incomplete."""


async def send_password_reset_otp(to_email: str, otp: str) -> None:
    """Send a password reset OTP email."""
    await asyncio.to_thread(_send_password_reset_otp_sync, to_email, otp)


def _send_password_reset_otp_sync(to_email: str, otp: str) -> None:
    from_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
    if not settings.SMTP_HOST or not from_email:
        raise EmailConfigurationError("SMTP settings are not configured")

    app_name = settings.APP_NAME
    subject = f"{app_name} password reset code"
    text_body = (
        f"Your {app_name} password reset code is {otp}.\n\n"
        f"This code expires in {settings.PASSWORD_RESET_OTP_EXPIRE_MINUTES} minutes. "
        "If you did not request it, you can ignore this email."
    )
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #111827;">
        <h2 style="color: #0f9fbd;">{app_name} password reset</h2>
        <p>Your password reset code is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">{otp}</p>
        <p>This code expires in {settings.PASSWORD_RESET_OTP_EXPIRE_MINUTES} minutes.</p>
        <p>If you did not request it, you can ignore this email.</p>
      </body>
    </html>
    """

    message = EmailMessage()
    message["From"] = formataddr((settings.SMTP_FROM_NAME, from_email))
    message["To"] = to_email
    message["Subject"] = subject
    message["Reply-To"] = from_email
    message["Auto-Submitted"] = "auto-generated"
    message["X-Auto-Response-Suppress"] = "All"
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")

    if settings.SMTP_USE_SSL:
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as smtp:
            _send_with_optional_login(smtp, message, from_email, to_email)
        return

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as smtp:
        if settings.SMTP_USE_TLS:
            smtp.starttls()
        _send_with_optional_login(smtp, message, from_email, to_email)


def _send_with_optional_login(smtp: smtplib.SMTP, message: EmailMessage, from_email: str, to_email: str) -> None:
    if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
        smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
    smtp.send_message(message, from_addr=from_email, to_addrs=[to_email])
