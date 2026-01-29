import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Trash2 } from 'lucide-react';
import type { Board } from '@/api/boards';

interface Props {
  board: Board | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (boardId: string) => Promise<void>;
}

export function DeleteBoardModal({ board, isOpen, onClose, onDelete }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!board) return;

    setIsLoading(true);
    try {
      await onDelete(board.id);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Board">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-error/10 rounded-full flex items-center justify-center shrink-0">
            <Trash2 size={20} className="text-error" />
          </div>
          <div>
            <p className="text-text">
              Are you sure you want to delete <strong>{board?.name}</strong>?
            </p>
            <p className="text-text-secondary text-sm mt-1">
              This action cannot be undone. All collaborators will lose access.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-error hover:bg-error/90"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
