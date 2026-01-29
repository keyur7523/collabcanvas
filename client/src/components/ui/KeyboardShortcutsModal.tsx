import { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { Search } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: Shortcut[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Tools',
    shortcuts: [
      { keys: ['V'], description: 'Select tool' },
      { keys: ['R'], description: 'Rectangle tool' },
      { keys: ['O'], description: 'Ellipse tool' },
      { keys: ['L'], description: 'Line tool' },
      { keys: ['A'], description: 'Arrow tool' },
      { keys: ['T'], description: 'Text tool' },
      { keys: ['P'], description: 'Pen/Freehand tool' },
    ],
  },
  {
    title: 'Edit',
    shortcuts: [
      { keys: ['⌘', 'Z'], description: 'Undo' },
      { keys: ['⌘', '⇧', 'Z'], description: 'Redo' },
      { keys: ['⌫'], description: 'Delete selected' },
      { keys: ['Esc'], description: 'Deselect / Cancel' },
    ],
  },
  {
    title: 'View',
    shortcuts: [
      { keys: ['Scroll'], description: 'Zoom in/out' },
      { keys: ['⌘', 'K'], description: 'Command palette' },
      { keys: ['?'], description: 'Keyboard shortcuts' },
    ],
  },
  {
    title: 'Selection',
    shortcuts: [
      { keys: ['⇧', 'Click'], description: 'Multi-select' },
      { keys: ['⌘', 'Click'], description: 'Toggle selection' },
    ],
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: Props) {
  const [search, setSearch] = useState('');

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return SHORTCUT_GROUPS;

    const query = search.toLowerCase();
    return SHORTCUT_GROUPS.map((group) => ({
      ...group,
      shortcuts: group.shortcuts.filter(
        (s) =>
          s.description.toLowerCase().includes(query) ||
          s.keys.some((k) => k.toLowerCase().includes(query))
      ),
    })).filter((group) => group.shortcuts.length > 0);
  }, [search]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" size="md">
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-canvas border border-border rounded-md text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Shortcut groups */}
        <div className="space-y-4 max-h-96 overflow-auto">
          {filteredGroups.map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {group.title}
              </h4>
              <div className="space-y-1">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-surface-hover"
                  >
                    <span className="text-sm text-text-secondary">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <kbd
                          key={i}
                          className="px-2 py-0.5 text-xs font-medium bg-surface border border-border rounded text-text"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
