import { api } from './client';

export type MemberRole = 'owner' | 'editor' | 'viewer';

export interface BoardMember {
  id?: string; // For compatibility with ShareModal
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: MemberRole;
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
  role?: MemberRole;
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
  const members = await api.get<BoardMember[]>(`/api/boards/${boardId}/members`);
  // Add id field for compatibility (use user_id as id)
  return members.map(m => ({ ...m, id: m.user_id }));
}

export async function updateMemberRole(memberId: string, role: MemberRole): Promise<void> {
  // Note: This function takes memberId which is actually user_id
  // The boardId needs to be passed from context - for now this is a placeholder
  // The actual call should be: /api/boards/{boardId}/members/{userId}
  console.warn('updateMemberRole called with memberId:', memberId, 'role:', role);
}

export async function updateMemberRoleOnBoard(boardId: string, userId: string, role: MemberRole): Promise<BoardMember> {
  return api.patch<BoardMember>(`/api/boards/${boardId}/members/${userId}`, { role });
}

export async function removeMember(memberId: string): Promise<void> {
  // Note: Similar to updateMemberRole - needs boardId from context
  console.warn('removeMember called with memberId:', memberId);
}

export async function removeMemberFromBoard(boardId: string, userId: string): Promise<void> {
  await api.delete(`/api/boards/${boardId}/members/${userId}`);
}
