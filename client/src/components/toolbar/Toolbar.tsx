import { useMemo, useCallback } from 'react';
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
  Undo2,
  Redo2,
  Grid3X3,
  Lock,
  Unlock,
} from 'lucide-react';
import { useToolStore, type Tool } from '@/stores/toolStore';
import { useSnapStore } from '@/stores/snapStore';
import { useYjsUndoRedo } from '@/hooks/useYjsUndoRedo';
import { useYjsShapes } from '@/hooks/useYjsShapes';
import { useCanvasContext } from '@/components/canvas/CanvasProvider';
import { ToolButton } from './ToolButton';
import { cn } from '@/lib/utils';

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
  const { activeTool, setTool, fillColor, strokeColor, setFillColor, setStrokeColor } = useToolStore();
  const { snapEnabled, toggleSnap } = useSnapStore();
  const { undo, redo, canUndo, canRedo } = useYjsUndoRedo();
  const { shapes, updateShape } = useYjsShapes();
  const { selectedIds } = useCanvasContext();

  // Calculate if selection is locked
  const isSelectionLocked = useMemo(() => {
    if (selectedIds.length === 0) return false;
    const selectedShapes = shapes.filter((s) => selectedIds.includes(s.id));
    return selectedShapes.length > 0 && selectedShapes.every((s) => s.locked);
  }, [selectedIds, shapes]);

  // Toggle lock for selected shapes
  const toggleLock = useCallback(() => {
    selectedIds.forEach((id) => {
      const shape = shapes.find((s) => s.id === id);
      if (shape) {
        updateShape(id, { locked: !shape.locked });
      }
    });
  }, [selectedIds, shapes, updateShape]);

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 bg-surface border border-border rounded-lg p-1.5 flex flex-col gap-1 shadow-lg z-10">
      {/* Tool buttons */}
      {tools.map(({ id, icon: Icon, shortcut }) => (
        <ToolButton
          key={id}
          icon={<Icon size={18} />}
          isActive={activeTool === id}
          onClick={() => setTool(id)}
          tooltip={`${id}${shortcut ? ` (${shortcut})` : ''}`}
        />
      ))}

      {/* Divider */}
      <div className="h-px bg-border my-1" />

      {/* Color pickers */}
      <div className="flex flex-col gap-2 px-1 py-1">
        {/* Fill color */}
        <div className="relative group">
          <label className="text-[10px] text-text-muted block mb-0.5 text-center">Fill</label>
          <input
            type="color"
            value={fillColor}
            onChange={(e) => setFillColor(e.target.value)}
            className="w-8 h-6 rounded cursor-pointer border border-border block mx-auto"
            title="Fill color"
          />
        </div>

        {/* Stroke color */}
        <div className="relative group">
          <label className="text-[10px] text-text-muted block mb-0.5 text-center">Stroke</label>
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="w-8 h-6 rounded cursor-pointer border border-border block mx-auto"
            title="Stroke color"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border my-1" />

      {/* Undo/Redo buttons */}
      <button
        onClick={undo}
        disabled={!canUndo}
        className={cn(
          'w-10 h-10 flex items-center justify-center rounded-md transition-colors',
          canUndo
            ? 'text-text-secondary hover:bg-surface-hover hover:text-text'
            : 'text-text-muted cursor-not-allowed opacity-50'
        )}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={18} />
      </button>

      <button
        onClick={redo}
        disabled={!canRedo}
        className={cn(
          'w-10 h-10 flex items-center justify-center rounded-md transition-colors',
          canRedo
            ? 'text-text-secondary hover:bg-surface-hover hover:text-text'
            : 'text-text-muted cursor-not-allowed opacity-50'
        )}
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo2 size={18} />
      </button>

      {/* Divider */}
      <div className="h-px bg-border my-1" />

      {/* Snap to Grid Toggle */}
      <button
        onClick={toggleSnap}
        className={cn(
          'w-10 h-10 flex items-center justify-center rounded-md transition-colors',
          snapEnabled
            ? 'bg-accent text-white'
            : 'text-text-secondary hover:bg-surface-hover hover:text-text'
        )}
        title={snapEnabled ? 'Disable snap to grid (G)' : 'Enable snap to grid (G)'}
      >
        <Grid3X3 size={18} />
      </button>

      {/* Lock/Unlock Button - only shown when shapes are selected */}
      {selectedIds.length > 0 && (
        <>
          <div className="h-px bg-border my-1" />

          <button
            onClick={toggleLock}
            className={cn(
              'w-10 h-10 flex items-center justify-center rounded-md transition-colors',
              isSelectionLocked
                ? 'bg-warning/20 text-warning'
                : 'text-text-secondary hover:bg-surface-hover hover:text-text'
            )}
            title={isSelectionLocked ? 'Unlock selected shapes (Ctrl+Shift+L)' : 'Lock selected shapes (Ctrl+Shift+L)'}
          >
            {isSelectionLocked ? <Lock size={18} /> : <Unlock size={18} />}
          </button>
        </>
      )}
    </div>
  );
}
