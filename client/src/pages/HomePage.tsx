import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Plus, LogOut, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import {
  BoardCard,
  BoardCardSkeleton,
  RenameBoardModal,
  DeleteBoardModal,
} from '@/components/boards';
import {
  listBoards,
  createBoard,
  updateBoard,
  deleteBoard,
  duplicateBoard,
  type Board,
} from '@/api/boards';

export function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Modal states
  const [renameBoard, setRenameBoard] = useState<Board | null>(null);
  const [deleteModalBoard, setDeleteModalBoard] = useState<Board | null>(null);

  const fetchBoards = useCallback(async () => {
    try {
      const data = await listBoards();
      setBoards(data);
    } catch (error) {
      console.error('Failed to fetch boards:', error);
      toast.error('Failed to load boards');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleCreateBoard = async () => {
    setIsCreating(true);
    try {
      const board = await createBoard({ name: 'Untitled' });
      navigate(`/board/${board.id}`);
    } catch (error) {
      console.error('Failed to create board:', error);
      toast.error('Failed to create board');
      setIsCreating(false);
    }
  };

  const handleRename = async (boardId: string, name: string) => {
    try {
      const updated = await updateBoard(boardId, { name });
      setBoards((prev) =>
        prev.map((b) => (b.id === boardId ? { ...b, name: updated.name } : b))
      );
      toast.success('Board renamed');
    } catch (error) {
      console.error('Failed to rename board:', error);
      toast.error('Failed to rename board');
      throw error;
    }
  };

  const handleDuplicate = async (board: Board) => {
    try {
      const duplicated = await duplicateBoard(board.id);
      setBoards((prev) => [duplicated, ...prev]);
      toast.success('Board duplicated');
    } catch (error) {
      console.error('Failed to duplicate board:', error);
      toast.error('Failed to duplicate board');
    }
  };

  const handleDelete = async (boardId: string) => {
    try {
      await deleteBoard(boardId);
      setBoards((prev) => prev.filter((b) => b.id !== boardId));
      toast.success('Board deleted');
    } catch (error) {
      console.error('Failed to delete board:', error);
      toast.error('Failed to delete board');
      throw error;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6">
        <h1 className="text-lg font-semibold text-text">CollabCanvas</h1>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 hover:bg-surface-hover rounded-lg px-2 py-1 transition-colors"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: user?.cursor_color || '#6366f1' }}
              >
                {user?.name?.[0] || 'U'}
              </div>
            )}
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg py-1 z-20 min-w-48">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium text-text">{user?.name}</p>
                  <p className="text-xs text-text-muted">{user?.email}</p>
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
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-text">Your Boards</h2>
            <p className="text-text-secondary mt-1">
              Create and collaborate on design boards
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={fetchBoards}
              disabled={isLoading}
              title="Refresh"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </Button>
            <Button
              leftIcon={<Plus size={18} />}
              onClick={handleCreateBoard}
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'New Board'}
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <BoardCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && boards.length === 0 && (
          <div className="bg-surface border border-border rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Plus size={32} className="text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-text mb-2">
              No boards yet
            </h3>
            <p className="text-text-secondary mb-6 max-w-sm mx-auto">
              Create your first board to start designing and collaborating with others in real-time.
            </p>
            <Button
              leftIcon={<Plus size={18} />}
              onClick={handleCreateBoard}
              disabled={isCreating}
            >
              Create Your First Board
            </Button>
          </div>
        )}

        {/* Board grid */}
        {!isLoading && boards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onRename={setRenameBoard}
                onDuplicate={handleDuplicate}
                onDelete={setDeleteModalBoard}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <RenameBoardModal
        board={renameBoard}
        isOpen={renameBoard !== null}
        onClose={() => setRenameBoard(null)}
        onRename={handleRename}
      />

      <DeleteBoardModal
        board={deleteModalBoard}
        isOpen={deleteModalBoard !== null}
        onClose={() => setDeleteModalBoard(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}
