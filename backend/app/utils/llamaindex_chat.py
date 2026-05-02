"""LlamaIndex integration for the Prescripto chat assistant."""

import asyncio

from app.core.config import settings


class LlamaIndexUnavailable(RuntimeError):
    """Raised when the LlamaIndex path cannot be used."""


async def generate_llamaindex_answer(
    *,
    question: str,
    context_text: str,
    history_text: str,
) -> str:
    """Generate an answer using LlamaIndex over records and general medical guidance."""
    if not settings.GOOGLE_API_KEY:
        raise LlamaIndexUnavailable("GOOGLE_API_KEY is not configured")

    try:
        from llama_index.core import Document, Settings, SummaryIndex
        from llama_index.llms.google_genai import GoogleGenAI
    except ImportError as exc:
        raise LlamaIndexUnavailable("LlamaIndex packages are not installed") from exc

    Settings.llm = GoogleGenAI(
        model=settings.CHAT_LLM_MODEL,
        api_key=settings.GOOGLE_API_KEY,
        temperature=settings.CHAT_TEMPERATURE,
    )

    prompt = f"""
You are Prescripto Assistant, a careful medical-record assistant inside a prescription
scanning app.

You can answer two kinds of questions:
1. Questions about the user's saved Prescripto records. For these, use only the provided
   user record context. If the context does not contain the answer, say that Prescripto
   does not have enough saved information yet.
2. General medical education questions. For these, you may give broad, safe educational
   guidance, such as what type of doctor is usually appropriate for a symptom.

Safety rules:
- Do not diagnose, prescribe, change doses, stop medication, or replace a clinician.
- Do not claim certainty about the user's condition.
- Do not give medication dosing instructions unless they are copied from saved user records.
- For urgent symptoms, overdose, severe allergic reaction, or breathing/chest pain concerns,
  advise urgent medical care or local emergency services.
- Keep answers concise and practical.
- Mention uncertainty when source data is missing or low confidence.

Available user record context:
{context_text or "No saved Prescripto record context was provided for this question."}

Recent conversation:
{history_text or "No prior messages in this request."}

User question:
{question}
""".strip()

    documents = [
        Document(
            text=context_text
            or "No saved Prescripto records were provided. General medical education is allowed."
        )
    ]
    index = SummaryIndex.from_documents(documents)
    query_engine = index.as_query_engine()

    response = await asyncio.to_thread(query_engine.query, prompt)
    return str(response).strip()
