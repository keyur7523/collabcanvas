import { api } from './client';

export interface CommentAuthor {
  id: string;
  name: string;
  avatar_url: string | null;
}

export interface Comment {
  id: string;
  board_id: string;
  parent_id: string | null;
  author: CommentAuthor;
  content: string;
  position_x: number | null;
  position_y: number | null;
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  replies: Comment[];
  mentions: string[];
}

export interface CreateCommentData {
  content: string;
  parent_id?: string;
  position_x?: number;
  position_y?: number;
}

export interface UpdateCommentData {
  content?: string;
  resolved?: boolean;
}

export async function listComments(boardId: string): Promise<Comment[]> {
  return api.get<Comment[]>(`/api/boards/${boardId}/comments`);
}

export async function createComment(boardId: string, data: CreateCommentData): Promise<Comment> {
  return api.post<Comment>(`/api/boards/${boardId}/comments`, data);
}

export async function updateComment(commentId: string, data: UpdateCommentData): Promise<Comment> {
  return api.patch<Comment>(`/api/boards/comments/${commentId}`, data);
}

export async function deleteComment(commentId: string): Promise<void> {
  await api.delete(`/api/boards/comments/${commentId}`);
}
