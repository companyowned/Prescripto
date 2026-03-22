"""Push notification service abstraction.

Supports Expo Push Notifications in production.
Falls back to logging in dev mode.
"""

import logging
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_push_notification(
    user,
    title: str,
    body: str,
    data: Optional[dict] = None,
) -> bool:
    """
    Send a push notification to a user.

    Args:
        user: User ORM model (must have push_token attribute)
        title: Notification title
        body: Notification body text
        data: Optional payload data for deep linking

    Returns:
        True if sent successfully, False otherwise
    """
    push_token = getattr(user, "push_token", None)

    if not push_token:
        logger.debug(
            f"[NOTIFICATION] No push token for user {user.id}, skipping notification"
        )
        return False

    # Check if it looks like an Expo push token
    if not push_token.startswith("ExponentPushToken["):
        logger.warning(
            f"[NOTIFICATION] Invalid push token format for user {user.id}"
        )
        return False

    payload = {
        "to": push_token,
        "title": title,
        "body": body,
        "sound": "default",
        "priority": "high",
        "channelId": "alarms",
    }
    if data:
        payload["data"] = data

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                EXPO_PUSH_URL,
                json=payload,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                timeout=10.0,
            )

        if response.status_code == 200:
            result = response.json()
            if result.get("data", {}).get("status") == "ok":
                logger.info(
                    f"[NOTIFICATION] Sent to user {user.id}: {title}"
                )
                return True
            else:
                logger.warning(
                    f"[NOTIFICATION] Expo API error for user {user.id}: {result}"
                )
                return False
        else:
            logger.warning(
                f"[NOTIFICATION] Expo API HTTP {response.status_code} for user {user.id}"
            )
            return False

    except httpx.TimeoutException:
        logger.error(f"[NOTIFICATION] Timeout sending to user {user.id}")
        return False
    except Exception as e:
        logger.error(
            f"[NOTIFICATION] Failed to send to user {user.id}: {e}", exc_info=True
        )
        return False


async def register_push_token(user, token: str) -> None:
    """
    Save/update a user's push token.

    This should be called from an API endpoint when the mobile app
    registers its device push token.
    """
    from datetime import datetime, timezone

    user.push_token = token
    user.push_token_updated_at = datetime.now(timezone.utc)
    logger.info(f"[NOTIFICATION] Updated push token for user {user.id}")
