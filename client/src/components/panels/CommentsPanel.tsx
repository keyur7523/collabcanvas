import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { MessageSquare, Send, Check, Trash2, CornerDownRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { formatDistanceToNow } from '@/lib/utils';
import {
  listComments,
  createComment,
  updateComment,
  deleteComment,
  type Comment,
} from '@/api/comments';

export function CommentsPanel() {
  const { boardId } = useParams<{ boardId: string }>();
  const { user, accessToken } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const fetchComments = useCallback(async () => {
    // Guard: Don't fetch if no boardId or no auth token
    if (!boardId) {
      setError('No board selected');
      setIsLoading(false);
      return;
    }
    
    if (!accessToken) {
      setError('Please log in to view comments');
      setIsLoading(false);
      return;
    }

    setError(null);
    try {
      const data = await listComments(boardId);
      setComments(data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      const message = err instanceof Error ? err.message : 'Failed to load comments';
      setError(message);
      
      // Don't show toast for auth errors - the error state handles it
      if (!message.includes('401') && !message.includes('unauthorized')) {
        toast.error('Failed to load comments');
      }
    } finally {
      setIsLoading(false);
    }
  }, [boardId, accessToken]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleCreateComment = async () => {
    if (!boardId || !newComment.trim() || isSubmitting) return;
    
    if (!accessToken) {
      toast.error('Please log in to comment');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const comment = await createComment(boardId, { content: newComment.trim() });
      setComments((prev) => [comment, ...prev]);
      setNewComment('');
      setError(null); // Clear any previous errors on success
    } catch (err) {
      console.error('Failed to create comment:', err);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!boardId || !replyText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const reply = await createComment(boardId, {
        content: replyText.trim(),
        parent_id: parentId,
      });
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c
        )
      );
      setReplyingTo(null);
      setReplyText('');
    } catch (err) {
      console.error('Failed to create reply:', err);
      toast.error('Failed to add reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (comment: Comment) => {
    try {
      const updated = await updateComment(comment.id, { resolved: !comment.resolved });
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? { ...c, ...updated } : c))
      );
    } catch (err) {
      console.error('Failed to resolve comment:', err);
      toast.error('Failed to update comment');
    }
  };

  const handleDelete = async (commentId: string, parentId?: string) => {
    try {
      await deleteComment(commentId);
      if (parentId) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: c.replies.filter((r) => r.id !== commentId) }
              : c
          )
        );
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
      toast.success('Comment deleted');
    } catch (err) {
      console.error('Failed to delete comment:', err);
      toast.error('Failed to delete comment');
    }
  };

  // Error state
  if (error) {
    return (
      <div className="p-4 text-center">
        <AlertCircle size={32} className="mx-auto text-error mb-2" />
        <p className="text-sm text-error mb-2">{error}</p>
        <Button size="sm" variant="ghost" onClick={fetchComments}>
          Try again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center text-text-secondary">
        Loading comments...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* New comment input */}
      <div className="p-3 border-b border-border">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateComment()}
            className="flex-1 px-3 py-2 text-sm bg-canvas border border-border rounded-md text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <Button size="sm" onClick={handleCreateComment} disabled={!newComment.trim() || isSubmitting}>
            <Send size={14} />
          </Button>
        </div>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-auto p-3 space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={32} className="mx-auto text-text-muted mb-2" />
            <p className="text-sm text-text-secondary">No comments yet</p>
            <p className="text-xs text-text-muted mt-1">
              Be the first to add a comment
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              currentUserId={user?.id}
              replyingTo={replyingTo}
              replyText={replyText}
              isSubmitting={isSubmitting}
              onReplyingToChange={setReplyingTo}
              onReplyTextChange={setReplyText}
              onReply={handleReply}
              onResolve={handleResolve}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface CommentThreadProps {
  comment: Comment;
  currentUserId?: string;
  replyingTo: string | null;
  replyText: string;
  isSubmitting: boolean;
  onReplyingToChange: (id: string | null) => void;
  onReplyTextChange: (text: string) => void;
  onReply: (parentId: string) => void;
  onResolve: (comment: Comment) => void;
  onDelete: (commentId: string, parentId?: string) => void;
}

function CommentThread({
  comment,
  currentUserId,
  replyingTo,
  replyText,
  isSubmitting,
  onReplyingToChange,
  onReplyTextChange,
  onReply,
  onResolve,
  onDelete,
}: CommentThreadProps) {
  const isOwner = comment.author.id === currentUserId;

  return (
    <div className={`rounded-lg border ${comment.resolved ? 'border-success/30 bg-success/5' : 'border-border'}`}>
      {/* Main comment */}
      <div className="p-3">
        <div className="flex items-start gap-2">
          {comment.author.avatar_url ? (
            <img
              src={comment.author.avatar_url}
              alt={comment.author.name}
              className="w-7 h-7 rounded-full shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent shrink-0">
              {comment.author.name[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text truncate">
                {comment.author.name}
              </span>
              <span className="text-xs text-text-muted">
                {formatDistanceToNow(new Date(comment.created_at))}
              </span>
            </div>
            <p className="text-sm text-text-secondary mt-1 break-words">
              {comment.content}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => onReplyingToChange(replyingTo === comment.id ? null : comment.id)}
                className="text-xs text-text-muted hover:text-text"
              >
                Reply
              </button>
              <button
                onClick={() => onResolve(comment)}
                className={`text-xs flex items-center gap-1 ${
                  comment.resolved ? 'text-success' : 'text-text-muted hover:text-text'
                }`}
              >
                <Check size={12} />
                {comment.resolved ? 'Resolved' : 'Resolve'}
              </button>
              {isOwner && (
                <button
                  onClick={() => onDelete(comment.id)}
                  className="text-xs text-text-muted hover:text-error"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="border-t border-border pl-6 space-y-0">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="p-3 border-b border-border last:border-b-0">
              <div className="flex items-start gap-2">
                <CornerDownRight size={12} className="text-text-muted mt-1 shrink-0" />
                {reply.author.avatar_url ? (
                  <img
                    src={reply.author.avatar_url}
                    alt={reply.author.name}
                    className="w-5 h-5 rounded-full shrink-0"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-medium text-accent shrink-0">
                    {reply.author.name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text truncate">
                      {reply.author.name}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {formatDistanceToNow(new Date(reply.created_at))}
                    </span>
                    {reply.author.id === currentUserId && (
                      <button
                        onClick={() => onDelete(reply.id, comment.id)}
                        className="text-text-muted hover:text-error ml-auto"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5 break-words">
                    {reply.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply input */}
      {replyingTo === comment.id && (
        <div className="p-3 border-t border-border bg-surface-hover/50">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => onReplyTextChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onReply(comment.id)}
              autoFocus
              className="flex-1 px-2 py-1.5 text-sm bg-canvas border border-border rounded-md text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <Button size="sm" onClick={() => onReply(comment.id)} disabled={!replyText.trim() || isSubmitting}>
              <Send size={12} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}