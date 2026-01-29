import { api } from './client';

export interface Board {
  id: string;
  name: string;
  owner_id: string;
  thumbnail_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface BoardMember {
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
}

export interface BoardDetail extends Board {
  members: BoardMember[];
}

export interface CreateBoardData {
  name?: string;
}

export interface UpdateBoardData {
  name?: string;
  is_public?: boolean;
}

export async function listBoards(): Promise<Board[]> {
  return api.get<Board[]>('/api/boards');
}

export async function createBoard(data: CreateBoardData = {}): Promise<Board> {
  return api.post<Board>('/api/boards', data);
}

export async function getBoard(boardId: string): Promise<BoardDetail> {
  return api.get<BoardDetail>(`/api/boards/${boardId}`);
}

export async function updateBoard(boardId: string, data: UpdateBoardData): Promise<Board> {
  return api.patch<Board>(`/api/boards/${boardId}`, data);
}

export async function deleteBoard(boardId: string): Promise<void> {
  await api.delete(`/api/boards/${boardId}`);
}

export async function duplicateBoard(boardId: string): Promise<Board> {
  return api.post<Board>(`/api/boards/${boardId}/duplicate`);
}
