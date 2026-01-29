import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MousePointer2,
  Square,
  Circle,
  Minus,
  MoveRight,
  Type,
  Pencil,
  Home,
  Plus,
  Undo2,
  Redo2,
  Keyboard,
} from 'lucide-react';
import { useToolStore } from '@/stores/toolStore';

interface Command {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  category: 'tools' | 'navigation' | 'actions';
  action: () => void;
  keywords?: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenShortcuts: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function CommandPalette({ isOpen, onClose, onOpenShortcuts, onUndo, onRedo }: Props) {
  const navigate = useNavigate();
  const { setTool } = useToolStore();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = useMemo(
    () => [
      // Tools
      {
        id: 'tool-select',
        title: 'Select Tool',
        subtitle: 'V',
        icon: <MousePointer2 size={16} />,
        category: 'tools',
        action: () => setTool('select'),
        keywords: ['pointer', 'cursor'],
      },
      {
        id: 'tool-rectangle',
        title: 'Rectangle Tool',
        subtitle: 'R',
        icon: <Square size={16} />,
        category: 'tools',
        action: () => setTool('rectangle'),
        keywords: ['shape', 'box'],
      },
      {
        id: 'tool-ellipse',
        title: 'Ellipse Tool',
        subtitle: 'O',
        icon: <Circle size={16} />,
        category: 'tools',
        action: () => setTool('ellipse'),
        keywords: ['circle', 'oval', 'shape'],
      },
      {
        id: 'tool-line',
        title: 'Line Tool',
        subtitle: 'L',
        icon: <Minus size={16} />,
        category: 'tools',
        action: () => setTool('line'),
      },
      {
        id: 'tool-arrow',
        title: 'Arrow Tool',
        subtitle: 'A',
        icon: <MoveRight size={16} />,
        category: 'tools',
        action: () => setTool('arrow'),
        keywords: ['pointer'],
      },
      {
        id: 'tool-text',
        title: 'Text Tool',
        subtitle: 'T',
        icon: <Type size={16} />,
        category: 'tools',
        action: () => setTool('text'),
        keywords: ['font', 'typography'],
      },
      {
        id: 'tool-freehand',
        title: 'Pen Tool',
        subtitle: 'P',
        icon: <Pencil size={16} />,
        category: 'tools',
        action: () => setTool('freehand'),
        keywords: ['draw', 'freehand', 'brush'],
      },
      // Navigation
      {
        id: 'nav-dashboard',
        title: 'Go to Dashboard',
        icon: <Home size={16} />,
        category: 'navigation',
        action: () => navigate('/'),
        keywords: ['home', 'boards'],
      },
      {
        id: 'nav-new-board',
        title: 'Create New Board',
        icon: <Plus size={16} />,
        category: 'navigation',
        action: () => {
          const boardId = crypto.randomUUID();
          navigate(`/board/${boardId}`);
        },
        keywords: ['add', 'create'],
      },
      // Actions
      {
        id: 'action-undo',
        title: 'Undo',
        subtitle: '⌘Z',
        icon: <Undo2 size={16} />,
        category: 'actions',
        action: () => onUndo?.(),
      },
      {
        id: 'action-redo',
        title: 'Redo',
        subtitle: '⌘⇧Z',
        icon: <Redo2 size={16} />,
        category: 'actions',
        action: () => onRedo?.(),
      },
      {
        id: 'action-shortcuts',
        title: 'Keyboard Shortcuts',
        subtitle: '?',
        icon: <Keyboard size={16} />,
        category: 'actions',
        action: onOpenShortcuts,
        keywords: ['help', 'keys'],
      },
    ],
    [setTool, navigate, onUndo, onRedo, onOpenShortcuts]
  );

  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;

    const query = search.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(query) ||
        cmd.subtitle?.toLowerCase().includes(query) ||
        cmd.keywords?.some((k) => k.toLowerCase().includes(query))
    );
  }, [commands, search]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const executeCommand = useCallback(
    (command: Command) => {
      command.action();
      onClose();
    },
    [onClose]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, executeCommand, onClose]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: { [key: string]: Command[] } = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  const categoryLabels: { [key: string]: string } = {
    tools: 'Tools',
    navigation: 'Navigation',
    actions: 'Actions',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search size={18} className="text-text-muted" />
              <input
                type="text"
                placeholder="Type a command or search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="flex-1 bg-transparent text-text placeholder:text-text-muted focus:outline-none"
              />
              <kbd className="px-2 py-0.5 text-xs font-medium bg-canvas border border-border rounded text-text-muted">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-auto p-2">
              {filteredCommands.length === 0 ? (
                <div className="py-8 text-center text-text-muted">
                  No commands found
                </div>
              ) : (
                Object.entries(groupedCommands).map(([category, cmds]) => (
                  <div key={category} className="mb-2 last:mb-0">
                    <div className="px-2 py-1 text-xs font-medium text-text-muted uppercase tracking-wider">
                      {categoryLabels[category]}
                    </div>
                    {cmds.map((cmd) => {
                      const globalIndex = filteredCommands.indexOf(cmd);
                      const isSelected = globalIndex === selectedIndex;

                      return (
                        <button
                          key={cmd.id}
                          onClick={() => executeCommand(cmd)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                            isSelected
                              ? 'bg-accent/10 text-accent'
                              : 'text-text hover:bg-surface-hover'
                          }`}
                        >
                          <span className={isSelected ? 'text-accent' : 'text-text-secondary'}>
                            {cmd.icon}
                          </span>
                          <span className="flex-1 text-left">{cmd.title}</span>
                          {cmd.subtitle && (
                            <kbd className="px-2 py-0.5 text-xs font-medium bg-canvas border border-border rounded text-text-muted">
                              {cmd.subtitle}
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
