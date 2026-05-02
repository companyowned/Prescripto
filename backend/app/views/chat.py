"""Chat assistant API router."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.chat_controller import ChatController
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["Chat Assistant"])


@router.post("", response_model=ChatResponse)
async def chat(
    data: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Answer questions about the current user's saved prescription records."""
    return await ChatController.send_message(db, current_user, data)
