import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Copy, Check, UserMinus, Crown, Pencil, Eye } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import {
  createInvite,
  listMembers,
  updateMemberRole,
  removeMember,
  type BoardMember,
} from '@/api/sharing';

interface Props {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
  isOwner: boolean;
}

export function ShareModal({ boardId, isOpen, onClose, isOwner }: Props) {
  const { user } = useAuthStore();
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      const data = await listMembers(boardId);
      setMembers(data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
      setInviteLink(null);
      setCopied(false);
    }
  }, [isOpen, fetchMembers]);

  const handleCreateInvite = async () => {
    setIsCreatingInvite(true);
    try {
      const invite = await createInvite(boardId, { role: inviteRole });
      setInviteLink(invite.invite_url);
    } catch (error) {
      console.error('Failed to create invite:', error);
      toast.error('Failed to create invite link');
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateMemberRole(boardId, userId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, role: newRole } : m))
      );
      toast.success('Role updated');
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error('Failed to update role');
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from this board?`)) return;
    try {
      await removeMember(boardId, userId);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
      toast.success('Member removed');
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error('Failed to remove member');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Board" size="md">
      <div className="space-y-6">
        {/* Invite link section (owner only) */}
        {isOwner && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-text">Invite People</h4>

            {!inviteLink ? (
              <div className="flex gap-2">
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                  className="px-3 py-2 text-sm bg-canvas border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="editor">Can edit</option>
                  <option value="viewer">Can view</option>
                </select>
                <Button onClick={handleCreateInvite} disabled={isCreatingInvite}>
                  {isCreatingInvite ? 'Creating...' : 'Create Link'}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm bg-canvas border border-border rounded-md text-text-secondary"
                />
                <Button onClick={handleCopyLink} variant={copied ? 'ghost' : 'primary'}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Members list */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-text">
            Members ({members.length})
          </h4>

          {isLoading ? (
            <div className="text-sm text-text-secondary">Loading...</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-auto">
              {members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-hover"
                >
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-medium text-accent">
                      {member.name[0]}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text truncate">
                        {member.name}
                        {member.user_id === user?.id && (
                          <span className="text-text-muted"> (you)</span>
                        )}
                      </span>
                      {member.role === 'owner' && (
                        <Crown size={12} className="text-warning shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-text-muted truncate">
                      {member.email}
                    </p>
                  </div>

                  {/* Role indicator/selector */}
                  {member.role === 'owner' ? (
                    <span className="text-xs text-text-muted px-2 py-1 bg-surface rounded">
                      Owner
                    </span>
                  ) : isOwner ? (
                    <div className="flex items-center gap-1">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                        className="text-xs px-2 py-1 bg-surface border border-border rounded text-text focus:outline-none"
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(member.user_id, member.name)}
                        className="p-1 text-text-muted hover:text-error rounded"
                        title="Remove member"
                      >
                        <UserMinus size={14} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-text-muted px-2 py-1 bg-surface rounded flex items-center gap-1">
                      {member.role === 'editor' ? (
                        <>
                          <Pencil size={10} /> Editor
                        </>
                      ) : (
                        <>
                          <Eye size={10} /> Viewer
                        </>
                      )}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
