import { useEffect, useRef } from 'react';
import {
  Copy,
  Scissors,
  Clipboard,
  Trash2,
  CopyPlus,
  BringToFront,
  SendToBack,
  Lock,
  Unlock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  // Clipboard actions
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  // Layer actions
  onBringToFront: () => void;
  onSendToBack: () => void;
  // Visibility/Lock actions
  onToggleLock: () => void;
  onToggleVisibility: () => void;
  // State
  hasSelection: boolean;
  hasClipboard: boolean;
  isLocked: boolean;
  isVisible: boolean;
}

interface MenuItem {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  disabled?: boolean;
  shortcut?: string;
  danger?: boolean;
  dividerAfter?: boolean;
}

export function ContextMenu({
  x,
  y,
  isOpen,
  onClose,
  onCopy,
  onCut,
  onPaste,
  onDuplicate,
  onDelete,
  onBringToFront,
  onSendToBack,
  onToggleLock,
  onToggleVisibility,
  hasSelection,
  hasClipboard,
  isLocked,
  isVisible,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuItems: MenuItem[] = [
    {
      label: 'Copy',
      icon: Copy,
      onClick: onCopy,
      disabled: !hasSelection,
      shortcut: '⌘C',
    },
    {
      label: 'Cut',
      icon: Scissors,
      onClick: onCut,
      disabled: !hasSelection,
      shortcut: '⌘X',
    },
    {
      label: 'Paste',
      icon: Clipboard,
      onClick: onPaste,
      disabled: !hasClipboard,
      shortcut: '⌘V',
      dividerAfter: true,
    },
    {
      label: 'Duplicate',
      icon: CopyPlus,
      onClick: onDuplicate,
      disabled: !hasSelection,
      shortcut: '⌘D',
      dividerAfter: true,
    },
    {
      label: 'Bring to Front',
      icon: BringToFront,
      onClick: onBringToFront,
      disabled: !hasSelection,
      shortcut: '⌘]',
    },
    {
      label: 'Send to Back',
      icon: SendToBack,
      onClick: onSendToBack,
      disabled: !hasSelection,
      shortcut: '⌘[',
      dividerAfter: true,
    },
    {
      label: isLocked ? 'Unlock' : 'Lock',
      icon: isLocked ? Unlock : Lock,
      onClick: onToggleLock,
      disabled: !hasSelection,
    },
    {
      label: isVisible ? 'Hide' : 'Show',
      icon: isVisible ? EyeOff : Eye,
      onClick: onToggleVisibility,
      disabled: !hasSelection,
      dividerAfter: true,
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: onDelete,
      disabled: !hasSelection,
      shortcut: '⌫',
      danger: true,
    },
  ];

  // Adjust position to keep menu within viewport
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 400);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[180px] select-none"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {menuItems.map((item) => (
        <div key={item.label}>
          <button
            onClick={() => {
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
            disabled={item.disabled}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors',
              item.disabled
                ? 'text-text-muted cursor-not-allowed'
                : item.danger
                ? 'text-error hover:bg-error/10'
                : 'text-text hover:bg-surface-hover'
            )}
          >
            <item.icon size={16} className={item.disabled ? 'opacity-50' : ''} />
            <span className="flex-1 text-left">{item.label}</span>
            {item.shortcut && (
              <span className={cn('text-xs', item.disabled ? 'text-text-muted' : 'text-text-secondary')}>
                {item.shortcut}
              </span>
            )}
          </button>
          {item.dividerAfter && <div className="h-px bg-border my-1" />}
        </div>
      ))}
    </div>
  );
}
