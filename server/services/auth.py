from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
from authlib.integrations.httpx_client import AsyncOAuth2Client
import httpx

from config import settings

# JWT Token functions
def create_access_token(user_id: str) -> str:
    """Create a JWT access token."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": user_id,
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(user_id: str) -> str:
    """Create a JWT refresh token."""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    payload = {
        "sub": user_id,
        "exp": expire,
        "type": "refresh",
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def verify_token(token: str, token_type: str = "access") -> Optional[str]:
    """Verify a JWT token and return the user_id if valid."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        if payload.get("type") != token_type:
            return None
        return payload.get("sub")
    except JWTError:
        return None


# Google OAuth
async def get_google_auth_url(redirect_uri: str) -> str:
    """Get the Google OAuth authorization URL."""
    client = AsyncOAuth2Client(
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        redirect_uri=redirect_uri,
        scope="openid email profile",
    )
    url, _ = client.create_authorization_url("https://accounts.google.com/o/oauth2/v2/auth")
    return url


async def get_google_user(code: str, redirect_uri: str) -> dict:
    """Exchange Google OAuth code for user info."""
    client = AsyncOAuth2Client(
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        redirect_uri=redirect_uri,
    )

    token = await client.fetch_token(
        "https://oauth2.googleapis.com/token",
        code=code,
    )

    # Get user info
    async with httpx.AsyncClient() as http_client:
        response = await http_client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {token['access_token']}"},
        )
        return response.json()


# GitHub OAuth
async def get_github_auth_url(redirect_uri: str) -> str:
    """Get the GitHub OAuth authorization URL."""
    client = AsyncOAuth2Client(
        client_id=settings.github_client_id,
        client_secret=settings.github_client_secret,
        redirect_uri=redirect_uri,
        scope="user:email",
    )
    url, _ = client.create_authorization_url("https://github.com/login/oauth/authorize")
    return url


async def get_github_user(code: str, redirect_uri: str) -> dict:
    """Exchange GitHub OAuth code for user info."""
    client = AsyncOAuth2Client(
        client_id=settings.github_client_id,
        client_secret=settings.github_client_secret,
        redirect_uri=redirect_uri,
    )

    token = await client.fetch_token(
        "https://github.com/login/oauth/access_token",
        code=code,
    )

    async with httpx.AsyncClient() as http_client:
        # Get user profile
        response = await http_client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {token['access_token']}",
                "Accept": "application/json",
            },
        )
        user_data = response.json()

        # Get user email if not public
        if not user_data.get("email"):
            email_response = await http_client.get(
                "https://api.github.com/user/emails",
                headers={
                    "Authorization": f"Bearer {token['access_token']}",
                    "Accept": "application/json",
                },
            )
            emails = email_response.json()
            primary_email = next(
                (e["email"] for e in emails if e.get("primary")),
                emails[0]["email"] if emails else None,
            )
            user_data["email"] = primary_email

        return user_data
