"""Background tasks for document processing."""

import asyncio
import logging

logger = logging.getLogger(__name__)


def process_document_task(document_id: str, job_id: str) -> None:
    """
    Process a document through the SkepticGen workflow.

    In production, this would be a Celery task decorated with @celery_app.task.
    For the dev version, it runs as a simple background function stub.

    Usage with Celery (production):
        from app.workers.celery_app import celery_app

        @celery_app.task(bind=True, max_retries=3)
        def process_document_task(self, document_id: str, job_id: str):
            ...
    """
    logger.info(f"[STUB] Document processing queued: doc={document_id}, job={job_id}")
    logger.info(
        "In production, this would invoke WorkflowController.process_document() "
        "via Celery worker with async DB session."
    )
    # The actual async processing would be:
    # async def _run():
    #     async with async_session_factory() as db:
    #         await WorkflowController.process_document(db, UUID(document_id), UUID(job_id))
    # asyncio.run(_run())
