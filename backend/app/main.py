"""Prescripto FastAPI application entry point."""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.db.session import init_db
from app.views.health import router as health_router
from app.views.auth import router as auth_router
from app.views.documents import router as documents_router
from app.views.prescriptions import router as prescriptions_router
from app.views.medication_reminders import router as medication_reminders_router
from app.views.medication_dose_events import router as medication_dose_events_router
from app.views.medication_insights import router as medication_insights_router
from app.views.profiles import router as profiles_router
from app.views.chat import router as chat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run on startup: create DB tables and start background tasks (local only)."""
    # Import all models so SQLAlchemy relationships resolve
    import app.models.user  # noqa
    import app.models.document  # noqa
    import app.models.patient_profile  # noqa
    import app.models.job  # noqa
    import app.models.doctor  # noqa
    import app.models.facility  # noqa
    import app.models.prescription  # noqa
    import app.models.medication  # noqa
    import app.models.workflow  # noqa
    import app.models.medication_reminder  # noqa
    import app.models.medication_dose_event  # noqa
    import app.models.medication_insight_snapshot  # noqa
    import app.models.password_reset_otp  # noqa

    is_vercel_runtime = os.getenv("VERCEL") == "1"
    
    if is_vercel_runtime:
        # On Vercel, the environment is serverless. 
        # Background loops in lifespan will cause the deployment to hang.
        # We rely on Vercel Cron to hit /api/v1/medication-reminders/run-cron instead.
        yield
    else:
        # Local Development: Start the background scheduler
        import asyncio
        from app.workers.reminder_tasks import (
            generate_upcoming_doses, 
            mark_overdue_as_missed, 
            send_dose_reminders
        )

        async def run_scheduler():
            while True:
                try:
                    await generate_upcoming_doses(48)
                    await mark_overdue_as_missed()
                    await send_dose_reminders()
                except Exception as e:
                    import logging
                    logging.getLogger("uvicorn").error(f"Background generic scheduler error: {e}")
                await asyncio.sleep(60)

        if settings.INIT_DB_ON_STARTUP:
            await init_db()
            
        scheduler_task = asyncio.create_task(run_scheduler())
        yield
        scheduler_task.cancel()


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Medical prescription scanning and analysis API powered by SkepticGen",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:8081",
            "http://localhost:8082",
            "http://localhost:19006",
            "http://localhost:3000",
            "http://127.0.0.1:8081",
            "http://127.0.0.1:8082",
            "http://192.168.100.93:8081",
            "http://192.168.100.93:8082",
            "http://192.168.100.93:19006",
            "http://192.168.100.107:8081",
            "http://192.168.100.107:8082",
            "http://192.168.100.107:19006",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Exception handlers
    register_exception_handlers(app)

    # Routers
    app.include_router(health_router)
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(documents_router, prefix="/api/v1")
    app.include_router(prescriptions_router, prefix="/api/v1")
    app.include_router(profiles_router, prefix="/api/v1")
    app.include_router(medication_reminders_router, prefix="/api/v1")
    app.include_router(medication_dose_events_router, prefix="/api/v1")
    app.include_router(medication_insights_router, prefix="/api/v1")
    app.include_router(chat_router, prefix="/api/v1")

    return app


app = create_app()
