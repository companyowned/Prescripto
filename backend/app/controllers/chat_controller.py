"""Business logic for the Dawini chat assistant."""

import logging
import re
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.medication_reminder_controller import MedicationReminderController
from app.controllers.profile_controller import PatientProfileController
from app.controllers.prescription_controller import PrescriptionController
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse, ChatSource
from app.utils.llamaindex_chat import LlamaIndexUnavailable, generate_llamaindex_answer
from app.utils.parsing import extract_follow_up_requests


logger = logging.getLogger(__name__)

SAFETY_DISCLAIMER = (
    "Dawini can explain saved prescription records and provide general medical "
    "education, but it is not a doctor and cannot diagnose, prescribe, or change "
    "treatment. For urgent symptoms or suspected overdose, contact local emergency "
    "services immediately."
)

ARABIC_SAFETY_DISCLAIMER = (
    "يمكن لدَوّيني شرح السجلات الطبية المحفوظة وتقديم معلومات طبية عامة، لكنه ليس "
    "طبيبًا ولا يستطيع التشخيص أو وصف العلاج أو تغيير الخطة العلاجية. عند الأعراض "
    "الطارئة أو الاشتباه في جرعة زائدة، تواصل مع الطوارئ فورًا."
)

URGENT_TERMS = (
    "can't breathe",
    "cannot breathe",
    "chest pain",
    "overdose",
    "suicide",
    "fainting",
    "severe allergic",
    "swollen throat",
    "anaphylaxis",
)

ARABIC_URGENT_TERMS = (
    "مش قادر اتنفس",
    "مش قادر أتنفس",
    "صعوبة في التنفس",
    "الم في الصدر",
    "ألم في الصدر",
    "جرعة زائدة",
    "انتحار",
    "اغماء",
    "إغماء",
    "حساسية شديدة",
    "تورم الحلق",
)

GREETING_TERMS = (
    "hi",
    "hello",
    "hey",
    "hiya",
    "yo",
    "howdy",
    "greetings",
    "good morning",
    "good afternoon",
    "good evening",
    "whats up",
    "sup",
)

ARABIC_GREETING_TERMS = (
    "مرحبا",
    "مرحبًا",
    "اهلا",
    "أهلا",
    "اهلين",
    "أهلين",
    "السلام عليكم",
    "صباح الخير",
    "مساء الخير",
    "هاي",
    "هلا",
)

CHANGE_TREATMENT_TERMS = (
    "stop",
    "change dose",
    "increase",
    "decrease",
    "double",
    "skip",
    "replace",
    "instead of",
)

ARABIC_CHANGE_TREATMENT_TERMS = (
    "أوقف",
    "اوقف",
    "أغير الجرعة",
    "اغير الجرعة",
    "زيادة الجرعة",
    "تقليل الجرعة",
    "ضاعف",
    "أتخطى",
    "اتخطى",
    "استبدل",
    "بدل",
)


@dataclass
class ChatContext:
    text: str
    sources: list[ChatSource]
    prescriptions_count: int
    reminders_count: int
    upcoming_count: int


class ChatController:
    @staticmethod
    async def send_message(
        db: AsyncSession,
        user: User,
        data: ChatRequest,
    ) -> ChatResponse:
        safety_disclaimer = _safety_disclaimer_for_question(data.message)

        # Greetings and urgent-safety triggers are resolved without touching the
        # database or the LLM, so they answer immediately.
        greeting_response = _greeting_response(data.message)
        if greeting_response:
            return ChatResponse(
                message=greeting_response,
                mode="fallback",
                sources=[],
                safety_disclaimer=safety_disclaimer,
            )

        urgent_response = _urgent_safety_response(data.message)
        if urgent_response:
            return ChatResponse(
                message=urgent_response,
                mode="fallback",
                sources=[
                    ChatSource(
                        type="safety",
                        title="Medical safety guardrail",
                        metadata={"matched": "urgent_symptoms"},
                    )
                ],
                safety_disclaimer=safety_disclaimer,
            )

        context = await _build_context(db, user, data)

        history_text = "\n".join(
            f"{message.role}: {message.content}" for message in data.history[-8:]
        )

        try:
            answer = await generate_llamaindex_answer(
                question=data.message,
                context_text=context.text,
                history_text=history_text,
            )
            if answer:
                return ChatResponse(
                    message=_append_treatment_caution(data.message, answer),
                    mode="llamaindex",
                    sources=_sources_for_answer(data.message, context),
                    safety_disclaimer=safety_disclaimer,
                )
        except LlamaIndexUnavailable:
            pass
        except Exception as exc:
            logger.warning("LlamaIndex chat generation failed; using fallback: %s", exc)

        return ChatResponse(
            message=_fallback_answer(data.message, context),
            mode="fallback",
            sources=context.sources,
            safety_disclaimer=safety_disclaimer,
        )


async def _build_context(db: AsyncSession, user: User, data: ChatRequest) -> ChatContext:
    sources: list[ChatSource] = []
    sections: list[str] = []

    profiles = []
    if data.include_family_profiles:
        profiles = await PatientProfileController.list_profiles(
            db, user.id, user.full_name
        )
    elif data.profile_id:
        profiles = [
            await PatientProfileController.get_profile(db, user.id, data.profile_id)
        ]

    prescriptions = []
    profile_names_by_id = {}
    if profiles:
        per_profile_limit = max(1, data.max_records)
        for profile in profiles:
            profile_names_by_id[str(profile.id)] = profile.full_name
            profile_prescriptions, _ = await PrescriptionController.get_history(
                db=db,
                user_id=user.id,
                owner_full_name=user.full_name,
                profile_id=profile.id,
                skip=0,
                limit=per_profile_limit,
                purpose=None,
            )
            prescriptions.extend(profile_prescriptions)
        prescriptions.sort(key=lambda item: item.created_at, reverse=True)
        prescriptions = prescriptions[: data.max_records]
    else:
        prescriptions, _ = await PrescriptionController.get_history(
            db=db,
            user_id=user.id,
            owner_full_name=user.full_name,
            profile_id=None,
            skip=0,
            limit=data.max_records,
            purpose=None,
        )

    if prescriptions:
        if data.include_family_profiles:
            profile_names = ", ".join(profile.full_name for profile in profiles)
            sections.append(f"Saved prescription records across family profiles: {profile_names}")
        else:
            sections.append("Saved prescription records:")

    for index, prescription in enumerate(prescriptions, start=1):
        created_at = _format_datetime(prescription.created_at)
        profile_name = (
            profile_names_by_id.get(str(prescription.profile_id))
            or "Unknown profile"
        )
        doctor = prescription.doctor.name if prescription.doctor else "Unknown doctor"
        facility = (
            prescription.facility.name if prescription.facility else "Unknown facility"
        )
        medications = [
            _format_medication(medication) for medication in (prescription.medications or [])
        ]
        follow_ups = extract_follow_up_requests(prescription.raw_output_json)
        follow_up_text = [
            f"{request.kind}: {request.name}"
            + (f" ({request.instructions})" if request.instructions else "")
            for request in follow_ups
        ]
        source_title = f"Prescription from {created_at}"
        sources.append(
            ChatSource(
                type="prescription",
                title=source_title,
                reference_id=str(prescription.id),
                metadata={
                    "profile_id": str(prescription.profile_id) if prescription.profile_id else None,
                    "profile_name": profile_name,
                    "document_id": str(prescription.document_id),
                    "confidence_score": prescription.confidence_score,
                },
            )
        )
        sections.append(
            "\n".join(
                [
                    f"[Prescription {index}] {source_title}",
                    f"Patient profile: {profile_name}",
                    f"Doctor: {doctor}",
                    f"Facility: {facility}",
                    f"Diagnosis: {prescription.diagnosis_text or 'Not recorded'}",
                    f"Medications: {'; '.join(medications) if medications else 'None recorded'}",
                    f"Follow-up requests: {'; '.join(follow_up_text) if follow_up_text else 'None recorded'}",
                    f"Confidence score: {prescription.confidence_score if prescription.confidence_score is not None else 'Not recorded'}",
                ]
            )
        )

    reminders, _ = await MedicationReminderController.list_reminders(
        db, user.id, active_only=False, skip=0, limit=25
    )
    active_reminders = [reminder for reminder in reminders if reminder.is_active]
    if reminders:
        sections.append("\nMedication reminders:")
    for reminder in reminders:
        sources.append(
            ChatSource(
                type="reminder",
                title=reminder.medication_name,
                reference_id=str(reminder.id),
                metadata={"active": reminder.is_active},
            )
        )
        sections.append(
            "\n".join(
                [
                    f"[Reminder] {reminder.medication_name}",
                    f"Dosage: {reminder.dosage or 'Not recorded'}",
                    f"Instructions: {reminder.instructions or 'Not recorded'}",
                    f"Schedule type: {reminder.schedule_type}",
                    f"Times: {', '.join(reminder.times or []) if reminder.times else 'Not recorded'}",
                    f"Active: {'yes' if reminder.is_active else 'no'}",
                ]
            )
        )

    upcoming = await MedicationReminderController.get_upcoming_doses(
        db, user.id, window_hours=24
    )
    if upcoming:
        sections.append("\nUpcoming dose events in the next 24 hours:")
    for event in upcoming[:20]:
        sources.append(
            ChatSource(
                type="dose",
                title=event.reminder.medication_name,
                reference_id=str(event.id),
                metadata={"status": event.status},
            )
        )
        sections.append(
            f"[Dose] {event.reminder.medication_name} "
            f"{event.reminder.dosage or ''} at {_format_datetime(event.scheduled_at)} "
            f"status={event.status}"
        )

    if not sections:
        sources.append(
            ChatSource(
                type="system",
                title="No saved medical records found",
            )
        )

    return ChatContext(
        text="\n\n".join(sections).strip(),
        sources=sources[:30],
        prescriptions_count=len(prescriptions),
        reminders_count=len(active_reminders),
        upcoming_count=len(upcoming),
    )


def _format_medication(medication) -> str:
    pieces = [medication.name]
    if medication.dose:
        pieces.append(medication.dose)
    if medication.frequency:
        pieces.append(medication.frequency)
    if medication.duration:
        pieces.append(f"for {medication.duration}")
    if medication.notes:
        pieces.append(f"notes: {medication.notes}")
    return " - ".join(pieces)


def _format_datetime(value: datetime | None) -> str:
    if value is None:
        return "unknown date"
    return value.strftime("%Y-%m-%d %H:%M")


def _greeting_response(question: str) -> str | None:
    """Answer plain greetings ("hi", "good morning", ...) instantly.

    Only matches when the whole message is a greeting (<=4 words after
    stripping punctuation), so a real question that happens to start with
    "hi" still reaches the full context + LLM path.
    """
    normalized = re.sub(r"[^\w\s]", "", question, flags=re.UNICODE).strip().lower()
    if not normalized or len(normalized.split()) > 4:
        return None

    is_arabic = _is_arabic_text(question)
    terms = ARABIC_GREETING_TERMS if is_arabic else GREETING_TERMS
    if not any(normalized == term or normalized.startswith(f"{term} ") for term in terms):
        return None

    if is_arabic:
        return (
            "أهلًا بك! أنا دَوّيني، مساعدك الطبي. يمكنني مساعدتك في فهم سجلاتك "
            "الطبية المحفوظة أو الإجابة عن أسئلة طبية عامة. كيف أقدر أساعدك اليوم؟"
        )
    return (
        "Hello! I'm Dawini, your medical assistant. I can help explain your saved "
        "prescription records or answer general medical questions. How can I help "
        "you today?"
    )


def _urgent_safety_response(question: str) -> str | None:
    lowered = question.lower()
    is_arabic = _is_arabic_text(question)
    urgent_terms = ARABIC_URGENT_TERMS if is_arabic else URGENT_TERMS
    if any(term in lowered for term in urgent_terms):
        if is_arabic:
            return (
                "قد يكون هذا موقفًا طارئًا. دَوّيني لا يستطيع تقييم الحالات الطارئة عبر الدردشة. "
                "يرجى التواصل مع الطوارئ فورًا أو التوجه لأقرب رعاية عاجلة. إذا كان الأمر متعلقًا "
                "بجرعة زائدة أو حساسية شديدة، لا تنتظر رد التطبيق."
            )
        return (
            "This could be urgent. Dawini cannot assess emergencies in chat. "
            "Please contact local emergency services now, or seek immediate medical care. "
            "If this involves a medication overdose or severe allergic reaction, do not wait "
            "for an app response."
        )
    return None


def _append_treatment_caution(question: str, answer: str) -> str:
    lowered = question.lower()
    is_arabic = _is_arabic_text(question)
    treatment_terms = ARABIC_CHANGE_TREATMENT_TERMS if is_arabic else CHANGE_TREATMENT_TERMS
    if any(term in lowered for term in treatment_terms):
        if is_arabic:
            return (
                f"{answer}\n\nلا تغيّر أو توقف أو تتخطى أو تعدّل أي دواء اعتمادًا على هذه "
                "الدردشة فقط. أكّد أي تغيير علاجي مع الطبيب أو الصيدلي."
            )
        return (
            f"{answer}\n\nDo not change, stop, skip, or adjust medication based only on "
            "this chat. Confirm treatment changes with your doctor or pharmacist."
        )
    return answer


def _fallback_answer(question: str, context: ChatContext) -> str:
    lowered = question.lower()
    is_arabic = _is_arabic_text(question)
    general_answer = _general_medical_fallback(lowered, is_arabic)
    if general_answer:
        return general_answer

    if _is_name_question(lowered):
        return "اسمي دَوّيني." if is_arabic else "My name is Dawini."

    if not context.text:
        if is_arabic:
            return (
                "أستطيع الإجابة عن أسئلة التثقيف الطبي العامة، ويمكنني أيضًا الإجابة عن "
                "أسئلة تخص سجلات دَوّيني المحفوظة بعد مسح أو رفع وصفة طبية. يمكنك أن تسأل مثلًا: "
                "أي طبيب أراجع عند وجود حرارة؟"
            )
        return (
            "I can answer general medical education questions, and I can also answer "
            "questions about saved Dawini records once you scan or upload a prescription. "
            "Ask something like: what kind of doctor should I see for fever?"
        )

    treatment_terms = ARABIC_CHANGE_TREATMENT_TERMS if is_arabic else CHANGE_TREATMENT_TERMS
    if any(term in lowered for term in treatment_terms):
        if is_arabic:
            return (
                "يمكنني عرض ما هو محفوظ في سجلاتك، لكن لا أستطيع أن أخبرك بتغيير أو إيقاف "
                "أو تخطي أو تعديل أي دواء. يرجى تأكيد أي تغيير علاجي مع الطبيب أو الصيدلي."
            )
        return (
            "I can show what is saved in your records, but I cannot tell you to change, stop, "
            "skip, or adjust a medication. Please confirm treatment changes with your doctor "
            "or pharmacist."
        )

    schedule_terms = (
        ("اليوم", "جدول", "تذكير", "جرعة", "موعد", "متى")
        if is_arabic
        else ("today", "schedule", "reminder", "dose", "when")
    )
    if any(term in lowered for term in schedule_terms):
        return _schedule_summary(context, is_arabic)

    medicine_terms = (
        ("دواء", "علاج", "ادوية", "أدوية", "باخد", "آخذ", "اخد")
        if is_arabic
        else ("medicine", "medication", "drug", "taking", "take")
    )
    if any(term in lowered for term in medicine_terms):
        return _record_summary(context, include_counts=False, is_arabic=is_arabic)

    diagnosis_terms = (
        ("تشخيص", "حالة", "لماذا", "ليه")
        if is_arabic
        else ("diagnosis", "condition", "why")
    )
    if any(term in lowered for term in diagnosis_terms):
        return _record_summary(context, include_counts=False, is_arabic=is_arabic)

    return _record_summary(context, include_counts=True, is_arabic=is_arabic)


def _sources_for_answer(question: str, context: ChatContext) -> list[ChatSource]:
    if context.sources and not _is_general_medical_question(question):
        return context.sources
    sources = list(context.sources[:20])
    sources.append(
        ChatSource(
            type="general_medical",
            title="General medical education",
            metadata={"scope": "not diagnosis or treatment"},
        )
    )
    return sources[:30]


def _is_general_medical_question(question: str) -> bool:
    lowered = question.lower()
    terms = (
        "what kind of doctor",
        "which doctor",
        "doctor should i",
        "specialist",
        "fever",
        "headache",
        "cough",
        "stomach",
        "rash",
        "pain",
        "symptom",
        "symptoms",
        "طبيب",
        "دكتور",
        "حرارة",
        "حمى",
        "سخونية",
        "صداع",
        "كحة",
        "سعال",
        "معدة",
        "بطن",
        "طفح",
        "ألم",
        "الم",
        "عرض",
        "أعراض",
    )
    return any(term in lowered for term in terms)


def _general_medical_fallback(lowered_question: str, is_arabic: bool) -> str | None:
    if is_arabic:
        if "حرارة" in lowered_question or "حمى" in lowered_question or "سخونية" in lowered_question:
            return (
                "عند وجود حرارة، يكون طبيب الأسرة أو الطبيب العام أو طبيب الباطنة عادةً نقطة البداية. "
                "للأطفال، راجع طبيب أطفال.\n\n"
                "اذهب للرعاية العاجلة أو الطوارئ إذا كانت الحرارة عالية جدًا، أو مستمرة عدة أيام، "
                "أو معها صعوبة تنفس، ألم صدر، تشوش، تيبس رقبة، صداع شديد، جفاف، قيء مستمر، "
                "طفح بنفسجي، تشنجات، أو ضعف شديد.\n\n"
                "هذه معلومات عامة وليست تشخيصًا."
            )
        if "طفح" in lowered_question or "حساسية" in lowered_question:
            return (
                "بالنسبة للطفح الجلدي، يمكن لطبيب الأسرة أو الطبيب العام تقييم الحالة أولًا. "
                "طبيب الجلدية هو المختص إذا كان الطفح مستمرًا أو متكررًا أو غير واضح. اطلب رعاية "
                "عاجلة إذا انتشر الطفح بسرعة، أو كان مؤلمًا، أو صاحبه حرارة، أو أثر على العين أو الفم، "
                "أو ظهر معه صعوبة تنفس أو تورم في الوجه أو الحلق."
            )
        if "صداع" in lowered_question:
            return (
                "للصداع، ابدأ عادةً بطبيب الأسرة أو الطبيب العام إذا لم تكن الأعراض شديدة. "
                "طبيب الأعصاب هو المختص للصداع المتكرر أو غير المعتاد. اطلب الطوارئ عند صداع مفاجئ "
                "وشديد جدًا، أو مع تشوش، ضعف، فقدان نظر، تيبس رقبة مع حرارة، إصابة بالرأس، أو صعوبة كلام."
            )
        if "كحة" in lowered_question or "سعال" in lowered_question:
            return (
                "للكحة، طبيب الأسرة أو الطبيب العام هو غالبًا البداية. طبيب الصدر مناسب إذا كانت الكحة "
                "مزمنة أو متكررة أو مرتبطة بالربو أو أمراض الرئة. اطلب رعاية عاجلة عند ضيق التنفس، "
                "ألم الصدر، ازرقاق الشفاه، خروج دم مع الكحة، أو حرارة عالية مع تدهور الأعراض."
            )
        if "معدة" in lowered_question or "بطن" in lowered_question or "مغص" in lowered_question:
            return (
                "لأعراض المعدة أو البطن، ابدأ بطبيب الأسرة أو الطبيب العام. طبيب الجهاز الهضمي هو "
                "المختص للمشاكل الهضمية المستمرة. اطلب رعاية عاجلة عند ألم شديد أو متزايد، دم في "
                "البراز أو القيء، قيء مستمر، إغماء، جفاف، أو ألم مع تيبس شديد بالبطن."
            )
        return None

    if "fever" in lowered_question:
        return (
            "For a fever, the usual first doctor to contact is a primary care doctor, "
            "family medicine doctor, general practitioner, or internal medicine doctor. "
            "For a child, contact a pediatrician.\n\n"
            "Consider urgent care or emergency care sooner if the fever is very high, lasts "
            "more than a few days, or comes with red flags such as trouble breathing, chest "
            "pain, confusion, stiff neck, severe headache, dehydration, persistent vomiting, "
            "a purple/non-blanching rash, seizure, or severe weakness.\n\n"
            "This is general guidance, not a diagnosis."
        )
    if "rash" in lowered_question:
        return (
            "For a rash, a primary care doctor can usually evaluate it first. A dermatologist "
            "is the specialist for ongoing, unclear, or recurring skin problems. Seek urgent "
            "care if the rash spreads quickly, is painful, appears with fever, involves the "
            "eyes or mouth, or comes with breathing trouble or facial/throat swelling."
        )
    if "headache" in lowered_question:
        return (
            "For headaches, start with a primary care doctor unless symptoms are severe. "
            "A neurologist is the specialist for recurring, unusual, or difficult headaches. "
            "Seek emergency care for a sudden worst headache, confusion, weakness, vision "
            "loss, stiff neck with fever, head injury, or trouble speaking."
        )
    if "cough" in lowered_question:
        return (
            "For cough, a primary care doctor is usually the first step. A pulmonologist is "
            "the lung specialist if cough is chronic, recurrent, or linked with asthma/COPD. "
            "Seek urgent care for shortness of breath, chest pain, blue lips, coughing blood, "
            "or high fever with worsening symptoms."
        )
    if "stomach" in lowered_question or "abdominal" in lowered_question:
        return (
            "For stomach or abdominal symptoms, start with a primary care doctor. A "
            "gastroenterologist is the specialist for ongoing digestive problems. Seek urgent "
            "care for severe or worsening pain, blood in stool or vomit, persistent vomiting, "
            "fainting, dehydration, or pain with a rigid abdomen."
        )
    return None


def _record_summary(context: ChatContext, include_counts: bool, is_arabic: bool) -> str:
    prefix = ""
    if include_counts:
        if is_arabic:
            prefix = (
                f"وجدت {context.prescriptions_count} وصفة محفوظة، و"
                f"{context.reminders_count} تذكيرًا نشطًا، و"
                f"{context.upcoming_count} جرعة قادمة خلال 24 ساعة.\n\n"
            )
        else:
            prefix = (
                f"I found {context.prescriptions_count} saved prescription record(s), "
                f"{context.reminders_count} active reminder(s), and "
                f"{context.upcoming_count} upcoming dose event(s) in the next 24 hours.\n\n"
            )
    if is_arabic:
        return (
            prefix
            + "هذا هو السياق المحفوظ الذي يمكنني استخدامه:\n\n"
            + _trim_context_for_fallback(context.text)
            + "\n\nاسأل عن دواء محدد، أو تشخيص، أو طبيب، أو منشأة، أو موعد تذكير للحصول على إجابة أدق."
        )
    return (
        prefix
        + "Here is the saved context I can use:\n\n"
        + _trim_context_for_fallback(context.text)
        + "\n\nAsk about a specific medicine, diagnosis, doctor, facility, or reminder time "
        "for a more focused answer."
    )


def _schedule_summary(context: ChatContext, is_arabic: bool) -> str:
    lines = [
        line
        for line in context.text.splitlines()
        if line.startswith("[Reminder]") or line.startswith("Times:") or line.startswith("[Dose]")
    ]
    if not lines:
        if is_arabic:
            return (
                "لا أرى مواعيد تذكير نشطة أو جرعات قادمة في السجلات المحفوظة. "
                "يمكنك إنشاء التذكيرات من نتيجة الوصفة."
            )
        return (
            "I do not see active reminder times or upcoming dose events in the saved records. "
            "You can create reminders from a prescription result."
        )
    if is_arabic:
        return "من التذكيرات والجرعات القادمة المحفوظة لديك:\n\n" + "\n".join(lines[:30])
    return "From your saved reminders and upcoming dose events:\n\n" + "\n".join(lines[:30])


def _is_arabic_text(text: str) -> bool:
    return any("\u0600" <= char <= "\u06ff" for char in text)


def _is_name_question(lowered_question: str) -> bool:
    return any(
        term in lowered_question
        for term in (
            "what is your name",
            "what's your name",
            "who are you",
            "اسمك",
            "ما اسمك",
            "انت مين",
            "أنت مين",
        )
    )


def _safety_disclaimer_for_question(question: str) -> str:
    if _is_arabic_text(question):
        return ARABIC_SAFETY_DISCLAIMER
    return SAFETY_DISCLAIMER


def _trim_context_for_fallback(text: str) -> str:
    lines = [line for line in text.splitlines() if line.strip()]
    return "\n".join(lines[:40])
