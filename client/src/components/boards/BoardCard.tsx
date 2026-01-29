import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MoreHorizontal, Pencil, Copy, Trash2, Globe, Lock } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';
import type { Board } from '@/api/boards';

interface Props {
  board: Board;
  onRename: (board: Board) => void;
  onDuplicate: (board: Board) => void;
  onDelete: (board: Board) => void;
}

export function BoardCard({ board, onRename, onDuplicate, onDelete }: Props) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleClick = () => {
    navigate(`/board/${board.id}`);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleAction = (action: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    action();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-surface border border-border rounded-xl overflow-hidden cursor-pointer hover:border-accent/50 transition-colors"
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-canvas relative">
        {board.thumbnail_url ? (
          <img
            src={board.thumbnail_url}
            alt={board.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="grid grid-cols-3 gap-1 p-4 opacity-20">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="w-4 h-4 bg-text rounded-sm"
                  style={{ opacity: Math.random() * 0.5 + 0.3 }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Menu button */}
        <button
          onClick={handleMenuClick}
          className="absolute top-2 right-2 p-1.5 bg-surface/90 backdrop-blur-sm border border-border rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface"
        >
          <MoreHorizontal size={16} className="text-text" />
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
              }}
            />
            <div className="absolute top-10 right-2 bg-surface border border-border rounded-lg shadow-lg py-1 z-20 min-w-36">
              <button
                onClick={handleAction(() => onRename(board))}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-surface-hover"
              >
                <Pencil size={14} />
                Rename
              </button>
              <button
                onClick={handleAction(() => onDuplicate(board))}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-surface-hover"
              >
                <Copy size={14} />
                Duplicate
              </button>
              <hr className="my-1 border-border" />
              <button
                onClick={handleAction(() => onDelete(board))}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error/10"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-text truncate">{board.name}</h3>
          <span title={board.is_public ? 'Public' : 'Private'}>
            {board.is_public ? (
              <Globe size={14} className="text-text-muted shrink-0 mt-1" />
            ) : (
              <Lock size={14} className="text-text-muted shrink-0 mt-1" />
            )}
          </span>
        </div>
        <p className="text-xs text-text-muted mt-1">
          Edited {formatDistanceToNow(new Date(board.updated_at))}
        </p>
      </div>
    </motion.div>
  );
}
