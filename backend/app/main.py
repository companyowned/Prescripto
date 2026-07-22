"""Prescripto FastAPI application entry point."""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware


from app.core.config import settings
from app.core.rate_limit import limiter


def _get_allowed_origins() -> list[str]:
    """Build CORS origin list from ALLOWED_ORIGINS env var (comma-separated).

    Falls back to localhost addresses for local development only; raises in
    production so a misconfigured deploy fails fast instead of silently
    rejecting every request from the real app.
    """
    raw = os.environ.get("ALLOWED_ORIGINS", "")
    if raw:
        return [o.strip() for o in raw.split(",") if o.strip()]
    if not settings.DEBUG:
        raise ValueError(
            "ALLOWED_ORIGINS is required in production. "
            "Set it to a comma-separated list of allowed origins."
        )
    return [
        "http://localhost:8081",
        "http://localhost:8082",
        "http://localhost:19006",
        "http://localhost:3000",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:8082",
    ]

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
from app.views.profile_links import router as profile_links_router


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
    import app.models.profile_link_request  # noqa
    import app.models.refresh_token  # noqa

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
        allow_origins=_get_allowed_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Rate limiting (best-effort brute-force protection on auth endpoints)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

    # Exception handlers
    register_exception_handlers(app)

    @app.get("/api/v1", tags=["Health"], summary="API v1 base (connectivity check)")
    async def api_v1_root():
        return {"status": "ok", "service": settings.APP_NAME}

    # Routers
    app.include_router(health_router)
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(documents_router, prefix="/api/v1")
    app.include_router(prescriptions_router, prefix="/api/v1")
    app.include_router(profiles_router, prefix="/api/v1")
    app.include_router(medication_reminders_router, prefix="/api/v1")
    app.include_router(medication_dose_events_router, prefix="/api/v1")
    app.include_router(medication_insights_router, prefix="/api/v1")
    app.include_router(profile_links_router, prefix="/api/v1")

    return app


app = create_app()
