import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Users, UserCheck, Circle, Eye, Crown, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { listMembers, type BoardMember } from '@/api/sharing';
import type { RemoteState } from '@/hooks/useAwareness';

interface PresencePanelProps {
  remoteStates: Map<number, RemoteState>;
  currentUserId?: string;
  onFollowUser?: (userId: string | null) => void;
  followingUserId?: string | null;
}

export function PresencePanel({ 
  remoteStates, 
  currentUserId,
  onFollowUser,
  followingUserId 
}: PresencePanelProps) {
  const { boardId } = useParams<{ boardId: string }>();
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  // Get set of online user IDs from awareness
  const onlineUserIds = new Set<string>();
  remoteStates.forEach((state) => {
    if (state.user?.id) {
      onlineUserIds.add(state.user.id);
    }
  });
  // Add current user as online
  if (currentUserId) {
    onlineUserIds.add(currentUserId);
  }

  // Fetch all board members
  const fetchMembers = useCallback(async () => {
    if (!boardId) return;
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
    fetchMembers();
  }, [fetchMembers]);

  // Get online users with their awareness state (for cursor info, selection)
  const getOnlineState = (userId: string): RemoteState | null => {
    for (const [, state] of remoteStates) {
      if (state.user?.id === userId) {
        return state;
      }
    }
    return null;
  };

  // Sort: online users first, then by role
  const sortedMembers = [...members].sort((a, b) => {
    const aOnline = onlineUserIds.has(a.user_id);
    const bOnline = onlineUserIds.has(b.user_id);
    if (aOnline !== bOnline) return bOnline ? 1 : -1;
    
    // Then by role: owner > editor > viewer
    const roleOrder = { owner: 0, editor: 1, viewer: 2 };
    return (roleOrder[a.role as keyof typeof roleOrder] || 2) - 
           (roleOrder[b.role as keyof typeof roleOrder] || 2);
  });

  const onlineCount = members.filter(m => onlineUserIds.has(m.user_id)).length;

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-surface-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users size={16} className="text-text-secondary" />
          <span className="text-sm font-medium text-text">Collaborators</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-success font-medium">
            {onlineCount} online
          </span>
          <span className="text-xs text-text-muted">
            / {members.length} total
          </span>
        </div>
      </button>

      {/* Member list */}
      {isExpanded && (
        <div className="border-t border-border max-h-64 overflow-auto">
          {isLoading ? (
            <div className="p-3 text-sm text-text-muted text-center">
              Loading...
            </div>
          ) : members.length === 0 ? (
            <div className="p-3 text-sm text-text-muted text-center">
              No collaborators yet
            </div>
          ) : (
            <div className="divide-y divide-border-muted">
              {sortedMembers.map((member) => {
                const isOnline = onlineUserIds.has(member.user_id);
                const isCurrentUser = member.user_id === currentUserId;
                const onlineState = getOnlineState(member.user_id);
                const isFollowing = followingUserId === member.user_id;
                const isSelecting = onlineState?.selection && onlineState.selection.length > 0;

                return (
                  <div
                    key={member.user_id}
                    className={cn(
                      'flex items-center gap-3 p-3 transition-colors',
                      isFollowing && 'bg-accent/5',
                      !isCurrentUser && isOnline && onFollowUser && 'cursor-pointer hover:bg-surface-hover'
                    )}
                    onClick={() => {
                      if (!isCurrentUser && isOnline && onFollowUser) {
                        onFollowUser(isFollowing ? null : member.user_id);
                      }
                    }}
                  >
                    {/* Avatar with online indicator */}
                    <div className="relative">
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
                      {/* Online/offline indicator */}
                      <Circle
                        size={10}
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 stroke-surface',
                          isOnline ? 'fill-success text-success' : 'fill-text-muted text-text-muted'
                        )}
                        strokeWidth={2}
                      />
                    </div>

                    {/* User info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          'text-sm font-medium truncate',
                          isOnline ? 'text-text' : 'text-text-muted'
                        )}>
                          {member.name}
                          {isCurrentUser && (
                            <span className="text-text-muted font-normal"> (you)</span>
                          )}
                        </span>
                        {/* Role badge */}
                        {member.role === 'owner' && (
                          <Crown size={12} className="text-warning shrink-0" />
                        )}
                      </div>
                      
                      {/* Status line */}
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        {isOnline ? (
                          <>
                            {isSelecting ? (
                              <>
                                <Pencil size={10} className="text-accent" />
                                <span className="text-accent">Editing</span>
                              </>
                            ) : onlineState?.cursor ? (
                              <>
                                <Eye size={10} />
                                <span>Viewing</span>
                              </>
                            ) : (
                              <span>Online</span>
                            )}
                          </>
                        ) : (
                          <span>Offline</span>
                        )}
                        
                        {/* Role */}
                        <span className="text-text-muted">
                          · {member.role}
                        </span>
                      </div>
                    </div>

                    {/* Follow indicator */}
                    {isFollowing && (
                      <div className="shrink-0">
                        <UserCheck size={16} className="text-accent" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Following banner */}
      {followingUserId && (
        <div className="border-t border-border p-2 bg-accent/5">
          <button
            onClick={() => onFollowUser?.(null)}
            className="w-full text-xs text-accent hover:text-accent/80 text-center"
          >
            Following {members.find(m => m.user_id === followingUserId)?.name} · Click to stop
          </button>
        </div>
      )}
    </div>
  );
}