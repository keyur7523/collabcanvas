import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Board } from '@/api/boards';

interface Props {
  board: Board | null;
  isOpen: boolean;
  onClose: () => void;
  onRename: (boardId: string, name: string) => Promise<void>;
}

export function RenameBoardModal({ board, isOpen, onClose, onRename }: Props) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (board) {
      setName(board.name);
    }
  }, [board]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!board || !name.trim()) return;

    setIsLoading(true);
    try {
      await onRename(board.id, name.trim());
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rename Board">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Board Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter board name"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim() || isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
