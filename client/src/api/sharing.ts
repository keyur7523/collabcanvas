import { api } from './client';

export interface BoardMember {
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  invited_at: string;
}

export interface BoardInvite {
  id: string;
  invite_url: string;
  role: string;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  created_at: string;
}

export interface CreateInviteData {
  role?: string;
  expires_in_days?: number;
  max_uses?: number;
}

export async function createInvite(boardId: string, data: CreateInviteData = {}): Promise<BoardInvite> {
  return api.post<BoardInvite>(`/api/boards/${boardId}/invite`, data);
}

export async function acceptInvite(inviteId: string): Promise<{ message: string; board_id: string }> {
  return api.post(`/api/invites/${inviteId}/accept`);
}

export async function listMembers(boardId: string): Promise<BoardMember[]> {
  return api.get<BoardMember[]>(`/api/boards/${boardId}/members`);
}

export async function updateMemberRole(boardId: string, userId: string, role: string): Promise<BoardMember> {
  return api.patch<BoardMember>(`/api/boards/${boardId}/members/${userId}`, { role });
}

export async function removeMember(boardId: string, userId: string): Promise<void> {
  await api.delete(`/api/boards/${boardId}/members/${userId}`);
}
