from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import uuid

from database import get_db
from models.user import User
from models.board import Board, BoardMember
from dependencies import get_current_user

router = APIRouter(prefix="/api/boards", tags=["boards"])


# Pydantic models
class BoardCreate(BaseModel):
    name: str = "Untitled"


class BoardUpdate(BaseModel):
    name: Optional[str] = None
    is_public: Optional[bool] = None


class BoardMemberResponse(BaseModel):
    user_id: str
    name: str
    email: str
    avatar_url: Optional[str]
    role: str

    class Config:
        from_attributes = True


class BoardResponse(BaseModel):
    id: str
    name: str
    owner_id: str
    thumbnail_url: Optional[str]
    is_public: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BoardDetailResponse(BoardResponse):
    members: list[BoardMemberResponse] = []


# Helper to check board access
async def get_board_with_access(
    board_id: str,
    user: User,
    db: AsyncSession,
    require_owner: bool = False,
) -> Board:
    """Get board if user has access, raise 404/403 otherwise."""
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

    if require_owner and not is_owner:
        raise HTTPException(status_code=403, detail="Only the owner can perform this action")

    if not is_owner and not is_member and not board.is_public:
        raise HTTPException(status_code=403, detail="You don't have access to this board")

    return board


@router.get("", response_model=list[BoardResponse])
async def list_boards(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all boards the user owns or is a member of."""
    # Get boards where user is owner or member
    result = await db.execute(
        select(Board)
        .outerjoin(BoardMember, Board.id == BoardMember.board_id)
        .where(
            Board.deleted_at.is_(None),
            or_(
                Board.owner_id == user.id,
                BoardMember.user_id == user.id,
            ),
        )
        .distinct()
        .order_by(Board.updated_at.desc())
    )
    boards = result.scalars().all()

    return [
        BoardResponse(
            id=str(board.id),
            name=board.name,
            owner_id=str(board.owner_id),
            thumbnail_url=board.thumbnail_url,
            is_public=board.is_public,
            created_at=board.created_at,
            updated_at=board.updated_at,
        )
        for board in boards
    ]


@router.post("", response_model=BoardResponse, status_code=status.HTTP_201_CREATED)
async def create_board(
    data: BoardCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new board."""
    board = Board(
        name=data.name,
        owner_id=user.id,
    )
    db.add(board)
    await db.flush()  # Flush to get the board ID

    # Add owner as a member with 'owner' role
    member = BoardMember(
        board_id=board.id,
        user_id=user.id,
        role="owner",
    )
    db.add(member)

    await db.commit()
    await db.refresh(board)

    return BoardResponse(
        id=str(board.id),
        name=board.name,
        owner_id=str(board.owner_id),
        thumbnail_url=board.thumbnail_url,
        is_public=board.is_public,
        created_at=board.created_at,
        updated_at=board.updated_at,
    )


@router.get("/{board_id}", response_model=BoardDetailResponse)
async def get_board(
    board_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get board details."""
    board = await get_board_with_access(board_id, user, db)

    members = [
        BoardMemberResponse(
            user_id=str(m.user_id),
            name=m.user.name,
            email=m.user.email,
            avatar_url=m.user.avatar_url,
            role=m.role,
        )
        for m in board.members
    ]

    return BoardDetailResponse(
        id=str(board.id),
        name=board.name,
        owner_id=str(board.owner_id),
        thumbnail_url=board.thumbnail_url,
        is_public=board.is_public,
        created_at=board.created_at,
        updated_at=board.updated_at,
        members=members,
    )


@router.patch("/{board_id}", response_model=BoardResponse)
async def update_board(
    board_id: str,
    data: BoardUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update board name or visibility."""
    board = await get_board_with_access(board_id, user, db, require_owner=True)

    if data.name is not None:
        board.name = data.name
    if data.is_public is not None:
        board.is_public = data.is_public

    board.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(board)

    return BoardResponse(
        id=str(board.id),
        name=board.name,
        owner_id=str(board.owner_id),
        thumbnail_url=board.thumbnail_url,
        is_public=board.is_public,
        created_at=board.created_at,
        updated_at=board.updated_at,
    )


@router.delete("/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_board(
    board_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft delete a board."""
    board = await get_board_with_access(board_id, user, db, require_owner=True)

    board.deleted_at = datetime.utcnow()
    await db.commit()


@router.post("/{board_id}/duplicate", response_model=BoardResponse, status_code=status.HTTP_201_CREATED)
async def duplicate_board(
    board_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Duplicate a board."""
    original = await get_board_with_access(board_id, user, db)

    # Create new board
    new_board = Board(
        name=f"{original.name} (Copy)",
        owner_id=user.id,
        is_public=False,  # Duplicates are private by default
    )
    db.add(new_board)
    await db.flush()  # Flush to get the board ID

    # Add owner as member
    member = BoardMember(
        board_id=new_board.id,
        user_id=user.id,
        role="owner",
    )
    db.add(member)

    await db.commit()
    await db.refresh(new_board)

    # Note: In a full implementation, we would also copy the Yjs document data
    # This would require fetching from the Yjs server and creating a new room

    return BoardResponse(
        id=str(new_board.id),
        name=new_board.name,
        owner_id=str(new_board.owner_id),
        thumbnail_url=new_board.thumbnail_url,
        is_public=new_board.is_public,
        created_at=new_board.created_at,
        updated_at=new_board.updated_at,
    )
