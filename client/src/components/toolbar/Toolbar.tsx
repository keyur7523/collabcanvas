import {
  MousePointer2,
  Square,
  Circle,
  Minus,
  MoveRight,
  Type,
  Pencil,
  Star,
  Hexagon,
} from 'lucide-react';
import { useToolStore, type Tool } from '@/stores/toolStore';
import { ToolButton } from './ToolButton';

const tools: { id: Tool; icon: React.ElementType; shortcut: string | null }[] = [
  { id: 'select', icon: MousePointer2, shortcut: 'V' },
  { id: 'rectangle', icon: Square, shortcut: 'R' },
  { id: 'ellipse', icon: Circle, shortcut: 'O' },
  { id: 'line', icon: Minus, shortcut: 'L' },
  { id: 'arrow', icon: MoveRight, shortcut: 'A' },
  { id: 'text', icon: Type, shortcut: 'T' },
  { id: 'freehand', icon: Pencil, shortcut: 'P' },
  { id: 'star', icon: Star, shortcut: null },
  { id: 'polygon', icon: Hexagon, shortcut: null },
];

export function Toolbar() {
  const { activeTool, setTool } = useToolStore();

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 bg-surface border border-border rounded-lg p-1 flex flex-col gap-1 shadow-lg z-10">
      {tools.map(({ id, icon: Icon, shortcut }) => (
        <ToolButton
          key={id}
          icon={<Icon size={18} />}
          isActive={activeTool === id}
          onClick={() => setTool(id)}
          tooltip={`${id}${shortcut ? ` (${shortcut})` : ''}`}
        />
      ))}
    </div>
  );
}
