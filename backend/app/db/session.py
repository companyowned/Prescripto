"""Async SQLAlchemy engine and session factory."""

from sqlalchemy import text, select
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
    import app.models.patient_profile  # noqa
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

        migration_statements = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token_updated_at TIMESTAMP",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS managed_by_id UUID",
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS profile_id UUID",
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS purpose VARCHAR DEFAULT 'prescription'",
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS parent_document_id UUID",
            "ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS profile_id UUID",
            "ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS linked_user_id UUID",
            "ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS sharing_level VARCHAR DEFAULT 'FULL_ACCESS'",
        ]
        for stmt in migration_statements:
            try:
                async with conn.begin_nested():
                    await conn.execute(text(stmt))
            except Exception as e:
                print(f"Migration statement ignored '{stmt}': {e}") 

        relationship_statements = [
            (
                "ALTER TABLE documents ADD CONSTRAINT fk_documents_profile_id "
                "FOREIGN KEY (profile_id) REFERENCES patient_profiles (id)"
            ),
            (
                "ALTER TABLE prescriptions ADD CONSTRAINT fk_prescriptions_profile_id "
                "FOREIGN KEY (profile_id) REFERENCES patient_profiles (id)"
            ),
            (
                "ALTER TABLE users ADD CONSTRAINT fk_users_managed_by_id "
                "FOREIGN KEY (managed_by_id) REFERENCES users (id)"
            ),
            (
                "ALTER TABLE patient_profiles ADD CONSTRAINT fk_profiles_linked_user_id "
                "FOREIGN KEY (linked_user_id) REFERENCES users (id)"
            ),
        ]
        for stmt in relationship_statements:
            try:
                async with conn.begin_nested():
                    await conn.execute(text(stmt))
            except Exception as e:
                print(f"Relationship statement ignored '{stmt}': {e}")

    async with async_session_factory() as session:
        await _backfill_profiles(session)
        await session.commit()


async def _backfill_profiles(session: AsyncSession):
    """Backfill default self profiles and profile links for legacy records."""
    from app.models.user import User
    from app.models.patient_profile import PatientProfile, RelationshipToOwner
    from app.models.document import Document
    from app.models.prescription import Prescription

    users = (await session.execute(select(User))).scalars().all()
    profile_by_user: dict = {}
    for user in users:
        default_profile = (
            await session.execute(
                select(PatientProfile).where(
                    PatientProfile.owner_user_id == user.id,
                    PatientProfile.is_default.is_(True),
                )
            )
        ).scalar_one_or_none()
        if not default_profile:
            any_profile = (
                await session.execute(
                    select(PatientProfile).where(PatientProfile.owner_user_id == user.id).limit(1)
                )
            ).scalar_one_or_none()
            if any_profile:
                any_profile.is_default = True
                default_profile = any_profile
            else:
                default_profile = PatientProfile(
                    owner_user_id=user.id,
                    full_name=user.full_name,
                    relationship_to_owner=RelationshipToOwner.SELF,
                    is_default=True,
                )
                session.add(default_profile)
                await session.flush()
        profile_by_user[user.id] = default_profile.id

    docs = (
        await session.execute(select(Document).where(Document.profile_id.is_(None)))
    ).scalars().all()
    for doc in docs:
        profile_id = profile_by_user.get(doc.user_id)
        if profile_id:
            doc.profile_id = profile_id

    prescriptions = (
        await session.execute(select(Prescription).where(Prescription.profile_id.is_(None)))
    ).scalars().all()
    for prescription in prescriptions:
        doc = await session.get(Document, prescription.document_id)
        if doc and doc.profile_id:
            prescription.profile_id = doc.profile_id


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
