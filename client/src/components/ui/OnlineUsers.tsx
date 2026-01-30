import { useCanvasContext } from '@/components/canvas/CanvasProvider';
import { useEffect, useState } from 'react';

interface OnlineUser {
  id: string;
  name: string;
  color: string;
  avatar?: string;
}

export function OnlineUsers() {
  const { awareness } = useCanvasContext();
  const [users, setUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    const updateUsers = () => {
      const states = awareness.getStates();
      const onlineUsers: OnlineUser[] = [];
      const seenIds = new Set<string>();
    
      states.forEach((state, clientId) => {
        // Skip if no user info or if it's the local client
        if (!state?.user || clientId === awareness.clientID) return;
        
        // Skip duplicates (same user might have multiple connections)
        const user = state.user as OnlineUser;
        if (seenIds.has(user.id)) return;
        seenIds.add(user.id);
        
        onlineUsers.push(user);
      });
    
      setUsers(onlineUsers);
    };

    awareness.on('change', updateUsers);
    updateUsers();

    return () => {
      awareness.off('change', updateUsers);
    };
  }, [awareness]);

  if (users.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex -space-x-2">
        {users.slice(0, 5).map((user) => (
          <div
            key={user.id}  
            className="relative group"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-full border-2 border-surface"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full border-2 border-surface flex items-center justify-center text-white text-xs font-medium"
                style={{ backgroundColor: user.color }}
              >
                {user.name[0]}
              </div>
            )}
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-elevated border border-border rounded text-xs text-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {user.name}
            </div>
          </div>
        ))}
      </div>
      {users.length > 5 && (
        <span className="text-xs text-text-muted ml-1">
          +{users.length - 5}
        </span>
      )}
      <span className="text-xs text-text-muted ml-2">
        {users.length} online
      </span>
    </div>
  );
}