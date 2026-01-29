import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CanvasProvider, useCanvasContext } from '@/components/canvas/CanvasProvider';
import { CollabCanvas } from '@/components/canvas/CollabCanvas';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { PropertiesPanel, LayersPanel, CommentsPanel } from '@/components/panels';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';
import { OnlineUsers } from '@/components/ui/OnlineUsers';
import { ShareModal } from '@/components/sharing/ShareModal';
import { KeyboardShortcutsModal } from '@/components/ui/KeyboardShortcutsModal';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { Layers, Settings, ChevronLeft, ChevronRight, LogOut, Home, Share2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useYjsUndoRedo } from '@/hooks/useYjsUndoRedo';
import type { UserInfo } from '@/hooks/useAwareness';

type PanelTab = 'properties' | 'layers' | 'comments';

// Get user info for awareness from auth store
function useCurrentUser(): UserInfo {
  const { user } = useAuthStore();
  if (!user) {
    throw new Error('User must be authenticated');
  }
  return {
    id: user.id,
    name: user.name,
    color: user.cursor_color,
  };
}

function BoardContent({ user }: { user: UserInfo }) {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { isConnected, isSynced } = useCanvasContext();
  const { user: authUser, logout } = useAuthStore();
  const { undo, redo } = useYjsUndoRedo();
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<PanelTab>('properties');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Global keyboard shortcuts for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      // ? for keyboard shortcuts
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowShortcuts(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenShortcuts = useCallback(() => {
    setShowCommandPalette(false);
    setShowShortcuts(true);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-canvas flex flex-col">
      {/* Header */}
      <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 hover:bg-surface-hover rounded-md text-text-secondary hover:text-text transition-colors"
            title="Back to Dashboard"
          >
            <Home size={20} />
          </button>
          <h1 className="text-lg font-semibold text-text">CollabCanvas</h1>
          <span className="text-sm text-text-secondary">
            Board: {boardId?.slice(0, 8)}...
          </span>
          <ConnectionStatus isConnected={isConnected} isSynced={isSynced} />
        </div>

        {/* Online users */}
        <div className="flex items-center gap-4">
          <OnlineUsers />
        </div>

        <div className="flex items-center gap-3 relative">
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Share button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium"
          >
            <Share2 size={16} />
            Share
          </button>

          {/* User menu */}
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 hover:bg-surface-hover rounded-lg px-2 py-1 transition-colors"
          >
            {authUser?.avatar_url ? (
              <img
                src={authUser.avatar_url}
                alt={user.name}
                className="w-7 h-7 rounded-full"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
                style={{ backgroundColor: user.color }}
              >
                {user.name[0]}
              </div>
            )}
            <span className="text-sm text-text-secondary">{user.name}</span>
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg py-1 z-20 min-w-40">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium text-text">{user.name}</p>
                  <p className="text-xs text-text-muted">{authUser?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Canvas */}
        <main className="flex-1 relative">
          <CollabCanvas user={user} />

          {/* Toolbar */}
          <Toolbar />
        </main>

        {/* Right Panel */}
        <aside
          className={cn(
            'bg-surface border-l border-border transition-all duration-200 flex flex-col shrink-0',
            isPanelOpen ? 'w-72' : 'w-0'
          )}
        >
          {isPanelOpen && (
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
                  <Settings size={14} />
                  Props
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
                  Layers
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
                  Chat
                </button>
              </div>

              {/* Panel content */}
              <div className="flex-1 overflow-hidden">
                {activeTab === 'properties' && <PropertiesPanel />}
                {activeTab === 'layers' && <LayersPanel />}
                {activeTab === 'comments' && <CommentsPanel />}
              </div>
            </>
          )}
        </aside>

        {/* Panel toggle */}
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-0 bg-surface border border-border rounded-l-md p-1.5 text-text-secondary hover:text-text z-10"
          style={{ right: isPanelOpen ? '288px' : '0' }}
        >
          {isPanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Share Modal */}
      {boardId && (
        <ShareModal
          boardId={boardId}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          isOwner={true} // TODO: Check actual ownership
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onOpenShortcuts={handleOpenShortcuts}
        onUndo={undo}
        onRedo={redo}
      />
    </div>
  );
}

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const user = useCurrentUser();

  if (!boardId) {
    return <div className="p-8 text-text">Board not found</div>;
  }

  return (
    <CanvasProvider boardId={boardId}>
      <BoardContent user={user} />
    </CanvasProvider>
  );
}
