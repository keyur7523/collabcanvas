from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional

from database import get_db
from models.user import User
from models.board import Board, BoardMember
from models.invite import BoardInvite
from dependencies import get_current_user
from config import settings

router = APIRouter(prefix="/api", tags=["sharing"])


# Pydantic models
class InviteCreate(BaseModel):
    role: str = "editor"  # 'editor' or 'viewer'
    expires_in_days: Optional[int] = 7
    max_uses: Optional[int] = None


class InviteResponse(BaseModel):
    id: str
    invite_url: str
    role: str
    expires_at: Optional[datetime]
    max_uses: Optional[int]
    use_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class MemberResponse(BaseModel):
    user_id: str
    name: str
    email: str
    avatar_url: Optional[str]
    role: str
    invited_at: datetime

    class Config:
        from_attributes = True


class MemberUpdate(BaseModel):
    role: str  # 'editor' or 'viewer'


# Helper to check owner access
async def get_board_as_owner(board_id: str, user: User, db: AsyncSession) -> Board:
    result = await db.execute(
        select(Board)
        .options(selectinload(Board.members).selectinload(BoardMember.user))
        .where(Board.id == board_id, Board.deleted_at.is_(None))
    )
    board = result.scalar_one_or_none()

    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    if board.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only the owner can manage sharing")

    return board


# Invite endpoints
@router.post("/boards/{board_id}/invite", response_model=InviteResponse, status_code=status.HTTP_201_CREATED)
async def create_invite(
    board_id: str,
    data: InviteCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate an invite link for a board."""
    board = await get_board_as_owner(board_id, user, db)

    if data.role not in ("editor", "viewer"):
        raise HTTPException(status_code=400, detail="Role must be 'editor' or 'viewer'")

    expires_at = None
    if data.expires_in_days:
        expires_at = datetime.utcnow() + timedelta(days=data.expires_in_days)

    invite = BoardInvite(
        board_id=board.id,
        role=data.role,
        created_by=user.id,
        expires_at=expires_at,
        max_uses=data.max_uses,
    )
    db.add(invite)
    await db.commit()
    await db.refresh(invite)

    invite_url = f"{settings.frontend_url}/invite/{invite.id}"

    return InviteResponse(
        id=str(invite.id),
        invite_url=invite_url,
        role=invite.role,
        expires_at=invite.expires_at,
        max_uses=invite.max_uses,
        use_count=invite.use_count,
        created_at=invite.created_at,
    )


@router.post("/invites/{invite_id}/accept")
async def accept_invite(
    invite_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Accept an invite and join the board."""
    result = await db.execute(
        select(BoardInvite)
        .options(selectinload(BoardInvite.board))
        .where(BoardInvite.id == invite_id)
    )
    invite = result.scalar_one_or_none()

    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")

    # Check if expired
    if invite.expires_at and invite.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="This invite has expired")

    # Check max uses
    if invite.max_uses and invite.use_count >= invite.max_uses:
        raise HTTPException(status_code=400, detail="This invite has reached its maximum uses")

    # Check if board still exists
    if invite.board.deleted_at:
        raise HTTPException(status_code=404, detail="Board no longer exists")

    # Check if already a member
    result = await db.execute(
        select(BoardMember).where(
            BoardMember.board_id == invite.board_id,
            BoardMember.user_id == user.id,
        )
    )
    existing = result.scalar_one_or_none()

    # Capture board_id before any potential rollback (to avoid lazy loading issues)
    board_id_str = str(invite.board_id)

    if existing:
        return {"message": "You are already a member of this board", "board_id": board_id_str}

    # Add as member
    member = BoardMember(
        board_id=invite.board_id,
        user_id=user.id,
        role=invite.role,
    )
    db.add(member)

    # Increment use count
    invite.use_count += 1

    try:
        await db.commit()
    except IntegrityError:
        # Race condition - user was added between check and insert
        await db.rollback()
        return {"message": "You are already a member of this board", "board_id": board_id_str}

    return {"message": "Successfully joined the board", "board_id": board_id_str}


# Member management endpoints
@router.get("/boards/{board_id}/members", response_model=list[MemberResponse])
async def list_members(
    board_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all members of a board."""
    result = await db.execute(
        select(Board)
        .options(selectinload(Board.members).selectinload(BoardMember.user))
        .where(Board.id == board_id, Board.deleted_at.is_(None))
    )
    board = result.scalar_one_or_none()

    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    # Check access
    is_owner = board.owner_id == user.id
    is_member = any(m.user_id == user.id for m in board.members)

    if not is_owner and not is_member:
        raise HTTPException(status_code=403, detail="You don't have access to this board")

    return [
        MemberResponse(
            user_id=str(m.user_id),
            name=m.user.name,
            email=m.user.email,
            avatar_url=m.user.avatar_url,
            role=m.role,
            invited_at=m.invited_at,
        )
        for m in board.members
    ]


@router.patch("/boards/{board_id}/members/{user_id}", response_model=MemberResponse)
async def update_member_role(
    board_id: str,
    user_id: str,
    data: MemberUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change a member's role."""
    board = await get_board_as_owner(board_id, user, db)

    if data.role not in ("editor", "viewer"):
        raise HTTPException(status_code=400, detail="Role must be 'editor' or 'viewer'")

    # Can't change owner's role
    if str(board.owner_id) == user_id:
        raise HTTPException(status_code=400, detail="Cannot change the owner's role")

    result = await db.execute(
        select(BoardMember)
        .options(selectinload(BoardMember.user))
        .where(BoardMember.board_id == board_id, BoardMember.user_id == user_id)
    )
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    member.role = data.role
    await db.commit()
    await db.refresh(member)

    return MemberResponse(
        user_id=str(member.user_id),
        name=member.user.name,
        email=member.user.email,
        avatar_url=member.user.avatar_url,
        role=member.role,
        invited_at=member.invited_at,
    )


@router.delete("/boards/{board_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    board_id: str,
    user_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a member from the board."""
    board = await get_board_as_owner(board_id, user, db)

    # Can't remove owner
    if str(board.owner_id) == user_id:
        raise HTTPException(status_code=400, detail="Cannot remove the owner")

    result = await db.execute(
        select(BoardMember).where(
            BoardMember.board_id == board_id,
            BoardMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    await db.delete(member)
    await db.commit()
