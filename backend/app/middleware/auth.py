"""API key authentication middleware — swap this class for OAuth in one place."""

from fastapi import status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.config import get_settings

# Paths that bypass API key auth: public docs and health probe.
_OPEN_PATHS = frozenset({"/health", "/docs", "/redoc", "/openapi.json", "/"})


class APIKeyMiddleware(BaseHTTPMiddleware):
    """
    Checks every request for a valid X-API-Key header.
    Swap this class out for an OAuth middleware in one place to upgrade auth.
    """

    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS" or request.url.path in _OPEN_PATHS:
            return await call_next(request)

        api_key = request.headers.get("X-API-Key", "")
        expected = get_settings().your_senior_api_key

        if not api_key or api_key != expected:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "detail": "Invalid or missing API key.",
                    "hint": "Pass your key in the X-API-Key request header.",
                    "app": "Your Senior",
                },
            )

        return await call_next(request)
