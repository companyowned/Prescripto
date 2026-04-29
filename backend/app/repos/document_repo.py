"""Document & Job repository — data access for Document and Job models."""

from typing import Optional
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.document import Document, DocumentStatus, FileType
from app.models.job import Job, JobStatus


class DocumentRepo:
    @staticmethod
    async def create(
        db: AsyncSession,
        user_id: UUID,
        profile_id: UUID,
        file_url: str,
        file_type: FileType,
        original_filename: Optional[str] = None,
    ) -> Document:
        doc = Document(
            user_id=user_id,
            profile_id=profile_id,
            file_url=file_url,
            file_type=file_type,
            original_filename=original_filename,
        )
        db.add(doc)
        await db.flush()
        await db.refresh(doc)
        return doc

    @staticmethod
    async def get_by_id(db: AsyncSession, doc_id: UUID) -> Optional[Document]:
        result = await db.execute(select(Document).where(Document.id == doc_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_documents(
        db: AsyncSession,
        user_id: UUID,
        profile_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Document], int]:
        filters = [Document.user_id == user_id]
        if profile_id:
            filters.append(Document.profile_id == profile_id)
        count_result = await db.execute(select(func.count()).select_from(Document).where(*filters))
        total = count_result.scalar()

        result = await db.execute(
            select(Document)
            .where(*filters)
            .order_by(Document.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all()), total

    @staticmethod
    async def update_status(db: AsyncSession, doc_id: UUID, status: DocumentStatus) -> None:
        doc = await DocumentRepo.get_by_id(db, doc_id)
        if doc:
            doc.status = status
            await db.flush()


class JobRepo:
    @staticmethod
    async def create(
        db: AsyncSession, document_id: UUID, workflow_id: Optional[str] = None
    ) -> Job:
        job = Job(document_id=document_id, workflow_id=workflow_id)
        db.add(job)
        await db.flush()
        await db.refresh(job)
        return job

    @staticmethod
    async def get_by_id(db: AsyncSession, job_id: UUID) -> Optional[Job]:
        result = await db.execute(select(Job).where(Job.id == job_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def update_status(
        db: AsyncSession,
        job_id: UUID,
        status: JobStatus,
        progress: int = 0,
        error_message: Optional[str] = None,
    ) -> None:
        from datetime import datetime, timezone

        job = await JobRepo.get_by_id(db, job_id)
        if job:
            job.status = status
            job.progress = progress
            if error_message:
                job.error_message = error_message
            if status == JobStatus.PROCESSING and not job.started_at:
                job.started_at = datetime.now(timezone.utc)
            if status in (JobStatus.DONE, JobStatus.FAILED):
                job.finished_at = datetime.now(timezone.utc)
            await db.flush()
