import { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableBoardNameProps {
  name: string;
  onSave: (newName: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function EditableBoardName({
  name,
  onSave,
  isLoading = false,
  className,
}: EditableBoardNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update edit value when name prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(name);
    }
  }, [name, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = useCallback(() => {
    setEditValue(name);
    setIsEditing(true);
  }, [name]);

  const cancelEditing = useCallback(() => {
    setEditValue(name);
    setIsEditing(false);
  }, [name]);

  const saveChanges = useCallback(async () => {
    const trimmedValue = editValue.trim();

    // Don't save if empty or unchanged
    if (!trimmedValue || trimmedValue === name) {
      cancelEditing();
      return;
    }

    setIsSaving(true);
    try {
      await onSave(trimmedValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save board name:', error);
      // Keep editing mode open on error
    } finally {
      setIsSaving(false);
    }
  }, [editValue, name, onSave, cancelEditing]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveChanges();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditing();
      }
    },
    [saveChanges, cancelEditing]
  );

  const handleBlur = useCallback(() => {
    // Small delay to allow button clicks to register
    setTimeout(() => {
      if (isEditing && !isSaving) {
        saveChanges();
      }
    }, 150);
  }, [isEditing, isSaving, saveChanges]);

  if (isLoading) {
    return (
      <div className={cn('h-6 w-32 bg-surface-hover rounded animate-pulse', className)} />
    );
  }

  if (isEditing) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={isSaving}
          className={cn(
            'px-2 py-0.5 text-sm font-medium bg-surface border border-accent rounded',
            'focus:outline-none focus:ring-2 focus:ring-accent/50',
            'min-w-[150px] max-w-[300px]',
            isSaving && 'opacity-50'
          )}
          maxLength={100}
          placeholder="Board name"
        />

        {/* Save button */}
        <button
          onClick={saveChanges}
          disabled={isSaving || !editValue.trim()}
          className={cn(
            'p-1 rounded transition-colors',
            'text-success hover:bg-success/10',
            (isSaving || !editValue.trim()) && 'opacity-50 cursor-not-allowed'
          )}
          title="Save (Enter)"
        >
          <Check size={14} />
        </button>

        {/* Cancel button */}
        <button
          onClick={cancelEditing}
          disabled={isSaving}
          className={cn(
            'p-1 rounded transition-colors',
            'text-text-secondary hover:bg-surface-hover',
            isSaving && 'opacity-50 cursor-not-allowed'
          )}
          title="Cancel (Escape)"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startEditing}
      className={cn(
        'group flex items-center gap-1.5 px-1 py-0.5 rounded transition-colors',
        'hover:bg-surface-hover',
        className
      )}
      title="Click to rename"
    >
      <span className="text-text font-medium truncate max-w-[200px]">
        {name}
      </span>
      <Pencil
        size={12}
        className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      />
    </button>
  );
}
