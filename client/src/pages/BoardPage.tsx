import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Settings,
  Share2,
  Layers,
  MessageSquare,
  SlidersHorizontal,
  Users,
  Wifi,
  WifiOff,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { CanvasProvider, useCanvasContext } from '@/components/canvas/CanvasProvider';
import { CollabCanvas } from '@/components/canvas/CollabCanvas';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { PropertiesPanel } from '@/components/panels/PropertiesPanel';
import { LayersPanel } from '@/components/panels/LayersPanel';
import { CommentsPanel } from '@/components/panels/CommentsPanel';
import { PresencePanel } from '@/components/collaboration/PresencePanel';
import { ShareModal } from '@/components/sharing/ShareModal';
import { OnlineUsers } from '@/components/ui/OnlineUsers';
import { useAuthStore } from '@/stores/authStore';
import { getBoard, type Board } from '@/api/boards';
import { cn } from '@/lib/utils';
import type { UserInfo, RemoteState } from '@/hooks/useAwareness';

type PanelTab = 'properties' | 'layers' | 'comments' | 'team';

// Generate a random color for the user
function generateUserColor(): string {
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
    '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { user, accessToken } = useAuthStore();
  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!boardId) {
      navigate('/dashboard');
      return;
    }

    if (!accessToken) {
      navigate('/login');
      return;
    }

    const fetchBoard = async () => {
      try {
        const data = await getBoard(boardId);
        setBoard(data);
      } catch (err) {
        console.error('Failed to fetch board:', err);
        setError('Board not found or access denied');
        toast.error('Failed to load board');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoard();
  }, [boardId, accessToken, navigate]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-accent" />
          <p className="text-text-secondary">Loading board...</p>
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-canvas">
        <div className="text-center">
          <p className="text-lg text-text mb-4">{error || 'Board not found'}</p>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userInfo: UserInfo = {
    id: user.id,
    name: user.name,
    color: generateUserColor(),
    avatar: user.avatar_url ?? undefined,
  };

  return (
    <CanvasProvider boardId={boardId!}>
      <BoardContent board={board} user={userInfo} />
    </CanvasProvider>
  );
}

interface BoardContentProps {
  board: Board;
  user: UserInfo;
}

function BoardContent({ board, user }: BoardContentProps) {
  const navigate = useNavigate();
  // Use isConnected and isSynced from context (not connectionStatus)
  const { isConnected, isSynced, connectionError } = useCanvasContext();
  const [activeTab, setActiveTab] = useState<PanelTab>('properties');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  
  // Presence state
  const [remoteStates, setRemoteStates] = useState<Map<number, RemoteState>>(new Map());
  const [followingUserId, setFollowingUserId] = useState<string | null>(null);

  // Callback to receive remote states from CollabCanvas
  const handleRemoteStatesChange = useCallback((states: Map<number, RemoteState>) => {
    setRemoteStates(new Map(states));
  }, []);

  // Handle following a user
  const handleFollowUser = useCallback((userId: string | null) => {
    setFollowingUserId(userId);
    if (userId) {
      toast.info(`Following user - viewport sync coming soon!`);
    }
  }, []);

  // Derive connection status from isConnected and isSynced
  const getStatusIcon = () => {
    if (connectionError) {
      return <WifiOff size={14} className="text-error" />;
    }
    if (!isConnected) {
      return <Loader2 size={14} className="animate-spin text-warning" />;
    }
    if (!isSynced) {
      return <Loader2 size={14} className="animate-spin text-warning" />;
    }
    return <Wifi size={14} className="text-success" />;
  };

  const getStatusText = () => {
    if (connectionError) {
      return 'Disconnected';
    }
    if (!isConnected) {
      return 'Connecting...';
    }
    if (!isSynced) {
      return 'Syncing...';
    }
    return 'Connected';
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-canvas flex flex-col">
      {/* Header */}
      <header className="h-12 bg-surface border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-lg font-semibold text-text hover:text-accent transition-colors"
          >
            CollabCanvas
          </button>
          <span className="text-text-muted">/</span>
          <span className="text-text font-medium truncate max-w-xs">{board.name}</span>
          
          {/* Connection status */}
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <OnlineUsers />
          
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsShareOpen(true)}
            className="gap-1.5"
          >
            <Share2 size={14} />
            Share
          </Button>

          <ThemeToggle />
          
          <Button variant="ghost" size="sm">
            <Settings size={16} />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Canvas area */}
        <main className="flex-1 relative">
          <CollabCanvas 
            user={user} 
            onRemoteStatesChange={handleRemoteStatesChange}
          />
          <Toolbar />
          
          {/* Following banner */}
          {followingUserId && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
              <div className="bg-accent text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center gap-2">
                <Users size={14} />
                Following user
                <button
                  onClick={() => setFollowingUserId(null)}
                  className="ml-2 hover:bg-white/20 rounded px-2 py-0.5"
                >
                  Stop
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Right panel */}
        <aside
          className={cn(
            'bg-surface border-l border-border flex flex-col transition-all duration-200',
            isPanelCollapsed ? 'w-12' : 'w-72'
          )}
        >
          {isPanelCollapsed ? (
            <div className="flex flex-col items-center py-2 gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPanelCollapsed(false)}
                className="w-8 h-8 p-0"
              >
                <SlidersHorizontal size={16} />
              </Button>
            </div>
          ) : (
            <>
              {/* Panel tabs */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => setActiveTab('properties')}
                  className={cn(
                    'flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1 transition-colors',
                    activeTab === 'properties'
                      ? 'text-text border-b-2 border-accent'
                      : 'text-text-secondary hover:text-text'
                  )}
                >
                  <SlidersHorizontal size={14} />
                </button>
                <button
                  onClick={() => setActiveTab('layers')}
                  className={cn(
                    'flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1 transition-colors',
                    activeTab === 'layers'
                      ? 'text-text border-b-2 border-accent'
                      : 'text-text-secondary hover:text-text'
                  )}
                >
                  <Layers size={14} />
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={cn(
                    'flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1 transition-colors',
                    activeTab === 'comments'
                      ? 'text-text border-b-2 border-accent'
                      : 'text-text-secondary hover:text-text'
                  )}
                >
                  <MessageSquare size={14} />
                </button>
                <button
                  onClick={() => setActiveTab('team')}
                  className={cn(
                    'flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1 transition-colors',
                    activeTab === 'team'
                      ? 'text-text border-b-2 border-accent'
                      : 'text-text-secondary hover:text-text'
                  )}
                >
                  <Users size={14} />
                </button>
                <button
                  onClick={() => setIsPanelCollapsed(true)}
                  className="px-2 text-text-muted hover:text-text"
                >
                  ×
                </button>
              </div>

              {/* Panel content */}
              <div className="flex-1 overflow-auto">
                {activeTab === 'properties' && <PropertiesPanel />}
                {activeTab === 'layers' && <LayersPanel />}
                {activeTab === 'comments' && <CommentsPanel />}
                {activeTab === 'team' && (
                  <div className="p-3">
                    <PresencePanel
                      remoteStates={remoteStates}
                      currentUserId={user.id}
                      onFollowUser={handleFollowUser}
                      followingUserId={followingUserId}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        boardId={board.id}
      />
    </div>
  );
}