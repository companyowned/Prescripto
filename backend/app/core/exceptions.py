"""Custom exception classes and global exception handlers."""

import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.cors import get_allowed_origins

logger = logging.getLogger(__name__)


def _cors_headers_for(request: Request) -> dict[str, str]:
    """Echo CORS headers for the request's Origin.

    Needed because ServerErrorMiddleware (which dispatches the catch-all
    Exception handler below) sits outside CORSMiddleware in the Starlette
    stack, so responses from this handler would otherwise never get
    Access-Control-Allow-Origin and browsers report a CORS failure instead
    of the real 500.
    """
    origin = request.headers.get("origin")
    if origin and origin in get_allowed_origins():
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Vary": "Origin",
        }
    return {}


class AppException(Exception):
    """Base application exception."""

    def __init__(self, detail: str, status_code: int = 400):
        self.detail = detail
        self.status_code = status_code


class NotFoundError(AppException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(detail=detail, status_code=404)


class UnauthorizedError(AppException):
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(detail=detail, status_code=401)


class BadRequestError(AppException):
    def __init__(self, detail: str = "Bad request"):
        super().__init__(detail=detail, status_code=400)


class ForbiddenError(AppException):
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(detail=detail, status_code=403)


class ProcessingError(AppException):
    def __init__(self, detail: str = "Processing failed"):
        super().__init__(detail=detail, status_code=500)


def register_exception_handlers(app: FastAPI) -> None:
    """Register global exception handlers on the FastAPI app."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
            headers=_cors_headers_for(request),
        )
