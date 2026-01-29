from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import re

from database import get_db
from models.user import User
from models.board import Board, BoardMember
from models.comment import Comment, CommentMention
from dependencies import get_current_user

router = APIRouter(prefix="/api/boards", tags=["comments"])


# Pydantic models
class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[str] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None


class CommentUpdate(BaseModel):
    content: Optional[str] = None
    resolved: Optional[bool] = None


class AuthorResponse(BaseModel):
    id: str
    name: str
    avatar_url: Optional[str]

    class Config:
        from_attributes = True


class CommentResponse(BaseModel):
    id: str
    board_id: str
    parent_id: Optional[str]
    author: AuthorResponse
    content: str
    position_x: Optional[float]
    position_y: Optional[float]
    resolved: bool
    resolved_by: Optional[str]
    resolved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    replies: list["CommentResponse"] = []
    mentions: list[str] = []

    class Config:
        from_attributes = True


# Helper to check board access
async def get_board_with_access(board_id: str, user: User, db: AsyncSession) -> Board:
    result = await db.execute(
        select(Board)
        .options(selectinload(Board.members))
        .where(Board.id == board_id, Board.deleted_at.is_(None))
    )
    board = result.scalar_one_or_none()

    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    is_owner = board.owner_id == user.id
    is_member = any(m.user_id == user.id for m in board.members)

    if not is_owner and not is_member and not board.is_public:
        raise HTTPException(status_code=403, detail="You don't have access to this board")

    return board


def extract_mentions(content: str) -> list[str]:
    """Extract @mentions from content."""
    # Match @username patterns
    pattern = r'@(\w+)'
    return re.findall(pattern, content)


def build_comment_response(comment: Comment) -> CommentResponse:
    return CommentResponse(
        id=str(comment.id),
        board_id=str(comment.board_id),
        parent_id=str(comment.parent_id) if comment.parent_id else None,
        author=AuthorResponse(
            id=str(comment.author.id),
            name=comment.author.name,
            avatar_url=comment.author.avatar_url,
        ),
        content=comment.content,
        position_x=comment.position_x,
        position_y=comment.position_y,
        resolved=comment.resolved,
        resolved_by=str(comment.resolved_by) if comment.resolved_by else None,
        resolved_at=comment.resolved_at,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        replies=[build_comment_response(r) for r in comment.replies],
        mentions=[str(m.user_id) for m in comment.mentions],
    )


@router.get("/{board_id}/comments", response_model=list[CommentResponse])
async def list_comments(
    board_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all root comments for a board (with nested replies)."""
    await get_board_with_access(board_id, user, db)

    result = await db.execute(
        select(Comment)
        .options(
            selectinload(Comment.author),
            selectinload(Comment.mentions),
            selectinload(Comment.replies).selectinload(Comment.author),
            selectinload(Comment.replies).selectinload(Comment.mentions),
        )
        .where(Comment.board_id == board_id, Comment.parent_id.is_(None))
        .order_by(Comment.created_at.desc())
    )
    comments = result.scalars().all()

    return [build_comment_response(c) for c in comments]


@router.post("/{board_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    board_id: str,
    data: CommentCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new comment or reply."""
    board = await get_board_with_access(board_id, user, db)

    # Validate parent exists if provided
    if data.parent_id:
        result = await db.execute(
            select(Comment).where(Comment.id == data.parent_id, Comment.board_id == board_id)
        )
        parent = result.scalar_one_or_none()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent comment not found")

    comment = Comment(
        board_id=board.id,
        parent_id=data.parent_id if data.parent_id else None,
        author_id=user.id,
        content=data.content,
        position_x=data.position_x if not data.parent_id else None,
        position_y=data.position_y if not data.parent_id else None,
    )
    db.add(comment)
    await db.flush()

    # Process mentions
    mentioned_names = extract_mentions(data.content)
    if mentioned_names:
        # Find users by name who are members of this board
        for name in mentioned_names:
            result = await db.execute(
                select(User)
                .join(BoardMember, BoardMember.user_id == User.id)
                .where(
                    BoardMember.board_id == board_id,
                    User.name.ilike(f"%{name}%"),
                )
            )
            mentioned_user = result.scalar_one_or_none()
            if mentioned_user:
                mention = CommentMention(comment_id=comment.id, user_id=mentioned_user.id)
                db.add(mention)

    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(Comment)
        .options(
            selectinload(Comment.author),
            selectinload(Comment.mentions),
            selectinload(Comment.replies),
        )
        .where(Comment.id == comment.id)
    )
    comment = result.scalar_one()

    return build_comment_response(comment)


@router.patch("/comments/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: str,
    data: CommentUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a comment's content or resolve status."""
    result = await db.execute(
        select(Comment)
        .options(
            selectinload(Comment.author),
            selectinload(Comment.mentions),
            selectinload(Comment.replies).selectinload(Comment.author),
            selectinload(Comment.replies).selectinload(Comment.mentions),
        )
        .where(Comment.id == comment_id)
    )
    comment = result.scalar_one_or_none()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Check board access
    await get_board_with_access(str(comment.board_id), user, db)

    # Only author can edit content
    if data.content is not None:
        if comment.author_id != user.id:
            raise HTTPException(status_code=403, detail="Only the author can edit this comment")
        comment.content = data.content

    # Anyone with access can resolve/unresolve
    if data.resolved is not None:
        if data.resolved and not comment.resolved:
            comment.resolved = True
            comment.resolved_by = user.id
            comment.resolved_at = datetime.utcnow()
        elif not data.resolved and comment.resolved:
            comment.resolved = False
            comment.resolved_by = None
            comment.resolved_at = None

    comment.updated_at = datetime.utcnow()
    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(Comment)
        .options(
            selectinload(Comment.author),
            selectinload(Comment.mentions),
            selectinload(Comment.replies).selectinload(Comment.author),
            selectinload(Comment.replies).selectinload(Comment.mentions),
        )
        .where(Comment.id == comment_id)
    )
    comment = result.scalar_one()

    return build_comment_response(comment)


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a comment."""
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Check board access and ownership
    board = await get_board_with_access(str(comment.board_id), user, db)

    # Only author or board owner can delete
    if comment.author_id != user.id and board.owner_id != user.id:
        raise HTTPException(status_code=403, detail="You can't delete this comment")

    await db.delete(comment)
    await db.commit()
