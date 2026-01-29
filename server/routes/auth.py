from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import random

from config import settings
from database import get_db
from models.user import User
from dependencies import get_current_user
from services.auth import (
    create_access_token,
    create_refresh_token,
    verify_token,
    get_google_auth_url,
    get_google_user,
    get_github_auth_url,
    get_github_user,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Cursor colors for new users
CURSOR_COLORS = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
    "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
    "#BB8FCE", "#85C1E9", "#F8B500", "#00CED1",
]


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    avatar_url: str | None
    cursor_color: str

    class Config:
        from_attributes = True


class RefreshRequest(BaseModel):
    refresh_token: str


# Google OAuth
@router.get("/google")
async def google_login(redirect: bool = False):
    """Get Google OAuth URL or redirect to it."""
    redirect_uri = f"{settings.backend_url}/api/auth/google/callback"
    url = await get_google_auth_url(redirect_uri)
    if redirect:
        return RedirectResponse(url=url, status_code=302)
    return {"url": url}


@router.get("/google/callback")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    """Handle Google OAuth callback."""
    redirect_uri = f"{settings.backend_url}/api/auth/google/callback"

    try:
        google_user = await get_google_user(code, redirect_uri)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to authenticate with Google: {str(e)}",
        )

    # Find or create user
    result = await db.execute(
        select(User).where(
            User.provider == "google",
            User.provider_id == str(google_user["id"]),
        )
    )
    user = result.scalar_one_or_none()

    if not user:
        # Create new user
        user = User(
            email=google_user["email"],
            name=google_user.get("name", google_user["email"].split("@")[0]),
            avatar_url=google_user.get("picture"),
            provider="google",
            provider_id=str(google_user["id"]),
            cursor_color=random.choice(CURSOR_COLORS),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # Create tokens
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))

    # Redirect to frontend with tokens
    frontend_callback = f"{settings.frontend_url}/auth/callback"
    return RedirectResponse(
        url=f"{frontend_callback}?access_token={access_token}&refresh_token={refresh_token}"
    )


# GitHub OAuth
@router.get("/github")
async def github_login(redirect: bool = False):
    """Get GitHub OAuth URL or redirect to it."""
    redirect_uri = f"{settings.backend_url}/api/auth/github/callback"
    url = await get_github_auth_url(redirect_uri)
    if redirect:
        return RedirectResponse(url=url, status_code=302)
    return {"url": url}


@router.get("/github/callback")
async def github_callback(code: str, db: AsyncSession = Depends(get_db)):
    """Handle GitHub OAuth callback."""
    redirect_uri = f"{settings.backend_url}/api/auth/github/callback"

    try:
        github_user = await get_github_user(code, redirect_uri)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to authenticate with GitHub: {str(e)}",
        )

    if not github_user.get("email"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not get email from GitHub. Please make sure your email is public or grant email access.",
        )

    # Find or create user
    result = await db.execute(
        select(User).where(
            User.provider == "github",
            User.provider_id == str(github_user["id"]),
        )
    )
    user = result.scalar_one_or_none()

    if not user:
        # Create new user
        user = User(
            email=github_user["email"],
            name=github_user.get("name") or github_user.get("login", "User"),
            avatar_url=github_user.get("avatar_url"),
            provider="github",
            provider_id=str(github_user["id"]),
            cursor_color=random.choice(CURSOR_COLORS),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # Create tokens
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))

    # Redirect to frontend with tokens
    frontend_callback = f"{settings.frontend_url}/auth/callback"
    return RedirectResponse(
        url=f"{frontend_callback}?access_token={access_token}&refresh_token={refresh_token}"
    )


# Token endpoints
@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    """Get the current authenticated user."""
    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        cursor_color=user.cursor_color,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(request: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Refresh access token using refresh token."""
    user_id = verify_token(request.refresh_token, token_type="refresh")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    # Verify user still exists
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    # Create new tokens
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/logout")
async def logout(response: Response):
    """Logout the current user (client should clear tokens)."""
    # For stateless JWT, we just return success
    # Client is responsible for clearing tokens
    return {"message": "Logged out successfully"}
