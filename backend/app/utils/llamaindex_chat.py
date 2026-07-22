"""Gemini integration for the Dawini chat assistant."""

from app.core.config import settings


class LlamaIndexUnavailable(RuntimeError):
    """Raised when the LLM path cannot be used."""


_llm = None


def _get_llm():
    """Lazily construct and cache the Gemini LLM client."""
    global _llm
    if _llm is not None:
        return _llm

    try:
        from llama_index.llms.google_genai import GoogleGenAI
    except ImportError as exc:
        raise LlamaIndexUnavailable("LlamaIndex packages are not installed") from exc

    _llm = GoogleGenAI(
        model=settings.CHAT_LLM_MODEL,
        api_key=settings.GOOGLE_API_KEY,
        temperature=settings.CHAT_TEMPERATURE,
        max_tokens=settings.CHAT_MAX_OUTPUT_TOKENS,
    )
    return _llm


async def generate_llamaindex_answer(
    *,
    question: str,
    context_text: str,
    history_text: str,
) -> str:
    """Generate an answer with a single direct call to Gemini.

    Context and history are already flattened into the prompt below, so this
    calls the LLM directly rather than building a document index — a
    SummaryIndex query engine would otherwise re-chunk the context and run
    multiple synthesis round-trips to the LLM for what is really one prompt,
    which is unnecessary latency for a chat reply.
    """
    if not settings.GOOGLE_API_KEY:
        raise LlamaIndexUnavailable("GOOGLE_API_KEY is not configured")

    llm = _get_llm()

    prompt = f"""
You are Dawini, a professional medical-record assistant inside a prescription
scanning app. You communicate the way a thoughtful, board-certified clinician's
assistant would: warm, clear, concise, and confident — never robotic, never
alarmist.

You can answer two kinds of questions:
1. Questions about the user's saved Dawini records. For these, use only the provided
   user record context. If the context does not contain the answer, say so plainly
   and offer to help once more information is available.
2. General medical education questions. For these, you may give broad, safe educational
   guidance, such as what type of doctor is usually appropriate for a symptom.

Style rules:
- Answer in 2-5 sentences unless the user is asking for a list (e.g. medications, doses).
- Do not open with filler like "As an AI" or restate the question.
- Be direct and specific rather than generic when the record context supports it.

Safety rules:
- Do not diagnose, prescribe, change doses, stop medication, or replace a clinician.
- Do not claim certainty about the user's condition.
- Do not give medication dosing instructions unless they are copied from saved user records.
- For urgent symptoms, overdose, severe allergic reaction, or breathing/chest pain concerns,
  advise urgent medical care or local emergency services.
- Mention uncertainty when source data is missing or low confidence.

Language rules:
- Answer in the same language as the user's latest question.
- If the user's latest question is Arabic, answer in clear Arabic.
- If the user asks your name, say your name is Dawini.

Available user record context:
{context_text or "No saved Dawini record context was provided for this question."}

Recent conversation:
{history_text or "No prior messages in this request."}

User question:
{question}
""".strip()

    response = await llm.acomplete(prompt)
    return str(response).strip()
