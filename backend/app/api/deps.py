"""Backend client authentication (NFR-004: unauthenticated requests
rejected). Simple bearer-token check — swap for a stronger scheme
(OAuth2/mTLS) before any real deployment."""

from fastapi import Header, HTTPException, status

from app.config import settings


def require_api_key(authorization: str = Header(default="")) -> None:
    expected = f"Bearer {settings.backend_api_key}"
    if authorization != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )
