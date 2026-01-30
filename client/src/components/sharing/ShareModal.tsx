import { useState, useEffect, useCallback } from 'react';
import { X, Copy, Check, UserPlus, Trash2, Crown, Link2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import {
  listMembers,
  createInvite,
  updateMemberRoleOnBoard,
  removeMemberFromBoard,
  type BoardMember,
  type MemberRole,
  type BoardInvite,
} from '@/api/sharing';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
}

export function ShareModal({ isOpen, onClose, boardId }: ShareModalProps) {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteRole, setInviteRole] = useState<MemberRole>('editor');
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [currentInvite, setCurrentInvite] = useState<BoardInvite | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      const data = await listMembers(boardId);
      setMembers(data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
      toast.error('Failed to load members');
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setCurrentInvite(null);
      fetchMembers();
    }
  }, [isOpen, fetchMembers]);

  const handleCreateInvite = async () => {
    setIsCreatingInvite(true);
    try {
      const invite = await createInvite(boardId, {
        role: inviteRole,
        expires_in_days: 7,
      });
      setCurrentInvite(invite);
      toast.success('Invite link created');
    } catch (error: any) {
      console.error('Failed to create invite:', error);
      const message = error?.message || 'Failed to create invite';
      toast.error(message);
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleCopyInviteLink = async () => {
    if (!currentInvite) return;
    try {
      await navigator.clipboard.writeText(currentInvite.invite_url);
      setCopiedLink(true);
      toast.success('Invite link copied to clipboard');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleRoleChange = async (userId: string, newRole: MemberRole) => {
    try {
      await updateMemberRoleOnBoard(boardId, userId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, role: newRole } : m))
      );
      toast.success('Role updated');
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error('Failed to update role');
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from this board?`)) return;

    try {
      await removeMemberFromBoard(boardId, userId);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
      toast.success(`Removed ${memberName}`);
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error('Failed to remove member');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-text">Share Board</h2>
            <p className="text-sm text-text-muted">Invite people to collaborate</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text p-1 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-6">
          {/* Create invite link section */}
          <div>
            <label className="text-sm font-medium text-text block mb-2">
              Create invite link
            </label>
            <div className="flex gap-2 mb-3">
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                className="px-3 py-2 text-sm bg-canvas border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="viewer">Can view</option>
                <option value="editor">Can edit</option>
              </select>
              <Button
                size="sm"
                onClick={handleCreateInvite}
                disabled={isCreatingInvite}
                className="gap-1.5"
              >
                {isCreatingInvite ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <UserPlus size={14} />
                )}
                Generate Link
              </Button>
            </div>

            {/* Show generated invite link */}
            {currentInvite && (
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-canvas border border-border rounded-md text-sm text-text-secondary overflow-hidden">
                  <Link2 size={14} className="shrink-0 text-accent" />
                  <span className="truncate">{currentInvite.invite_url}</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyInviteLink}
                  className="shrink-0"
                >
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                </Button>
              </div>
            )}
            <p className="text-xs text-text-muted mt-2">
              Share this link with people you want to invite. Link expires in 7 days.
            </p>
          </div>

          {/* Members list */}
          <div>
            <label className="text-sm font-medium text-text block mb-2">
              People with access ({members.length})
            </label>
            
            {isLoading ? (
              <div className="text-sm text-text-muted text-center py-4">
                Loading members...
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-auto">
                {members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-surface-hover"
                  >
                    {/* Avatar */}
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

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-text truncate">
                          {member.name}
                        </span>
                        {member.role === 'owner' && (
                          <Crown size={12} className="text-warning shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-text-muted truncate block">
                        {member.email}
                      </span>
                    </div>

                    {/* Role selector / Actions */}
                    {member.role === 'owner' ? (
                      <span className="text-xs text-text-muted px-2 py-1 bg-surface-hover rounded">
                        Owner
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(member.user_id, e.target.value as MemberRole)
                          }
                          className="text-xs px-2 py-1 bg-canvas border border-border rounded text-text focus:outline-none"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                        </select>
                        <button
                          onClick={() => handleRemoveMember(member.user_id, member.name)}
                          className="p-1 text-text-muted hover:text-error rounded"
                          title="Remove member"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}