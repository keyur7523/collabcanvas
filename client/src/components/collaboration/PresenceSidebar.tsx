import { useState } from 'react';
import { Users, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RemoteState } from '@/hooks/useAwareness';

interface Props {
  remoteStates: Map<number, RemoteState>;
  followingUserId: string | null;
  onFollowUser: (userId: string | null) => void;
}

export function PresenceSidebar({ remoteStates, followingUserId, onFollowUser }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const onlineUsers = Array.from(remoteStates.values());

  if (onlineUsers.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute top-4 right-4 bg-surface border border-border rounded-lg shadow-lg transition-all duration-200 z-10',
        isExpanded ? 'w-56' : 'w-auto'
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 p-2 w-full hover:bg-surface-hover rounded-lg"
      >
        <div className="relative">
          <Users size={18} className="text-text-secondary" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-success text-white text-[10px] font-medium rounded-full flex items-center justify-center">
            {onlineUsers.length}
          </span>
        </div>
        {isExpanded && (
          <span className="text-sm font-medium text-text">
            {onlineUsers.length} online
          </span>
        )}
      </button>

      {/* User list */}
      {isExpanded && (
        <div className="border-t border-border p-2 space-y-1">
          {onlineUsers.map((state, index) => {
            const isFollowing = followingUserId === state.user.id;

            return (
              <button
                key={index}
                onClick={() => onFollowUser(isFollowing ? null : state.user.id)}
                className={cn(
                  'flex items-center gap-2 w-full p-2 rounded-md transition-colors',
                  isFollowing
                    ? 'bg-accent/10 text-accent'
                    : 'hover:bg-surface-hover text-text'
                )}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
                  style={{ backgroundColor: state.user.color }}
                >
                  {state.user.name[0]}
                </div>
                <span className="text-sm truncate flex-1 text-left">
                  {state.user.name}
                </span>
                {isFollowing && (
                  <UserCheck size={14} className="shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Following indicator */}
      {followingUserId && (
        <div className="border-t border-border p-2">
          <button
            onClick={() => onFollowUser(null)}
            className="text-xs text-accent hover:text-accent/80 w-full text-center"
          >
            Stop following
          </button>
        </div>
      )}
    </div>
  );
}
