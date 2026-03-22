"""Async SQLAlchemy engine and session factory."""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.core.config import settings


def _normalize_database_url(url: str) -> str:
    """Normalize DATABASE_URL for SQLAlchemy async engine.

    - Prefer psycopg async driver on PostgreSQL for serverless compatibility.
    """
    normalized = url
    if normalized.startswith("postgresql+asyncpg://"):
        # Keep asyncpg if explicitly requested, or swap if troubleshooting
        pass 
    elif normalized.startswith("postgresql://"):
        normalized = normalized.replace("postgresql://", "postgresql+asyncpg://", 1)

    # Ensure SSL is handled correctly for Neon/Vercel
    if "sslmode=" not in normalized and "ssl=require" not in normalized:
        separator = "&" if "?" in normalized else "?"
        normalized += f"{separator}ssl=require"

    return normalized


database_url = _normalize_database_url(settings.DATABASE_URL)

connect_args = {}
if database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_async_engine(
    database_url,
    echo=settings.DEBUG,
    future=True,
    connect_args=connect_args,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db():
    """Create all tables (for development with SQLite)."""
    from app.db.base import Base
    # Import all models so they register on Base.metadata
    import app.models.user  # noqa
    import app.models.document  # noqa
    import app.models.job  # noqa
    import app.models.doctor  # noqa
    import app.models.facility  # noqa
    import app.models.prescription  # noqa
    import app.models.medication  # noqa
    import app.models.workflow  # noqa
    import app.models.medication_reminder  # noqa
    import app.models.medication_dose_event  # noqa
    import app.models.medication_insight_snapshot  # noqa

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # Migrate existing tables — add new columns safely
        # PostgreSQL supports ADD COLUMN IF NOT EXISTS
        from sqlalchemy import text

        migration_statements = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token_updated_at TIMESTAMP",
        ]
        for stmt in migration_statements:
            try:
                await conn.execute(text(stmt))
            except Exception:
                pass  # Column already exists or DB doesn't support IF NOT EXISTS


async def get_db():
    """FastAPI dependency that yields a DB session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

