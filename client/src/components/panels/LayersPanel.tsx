import { useCanvasContext } from '@/components/canvas/CanvasProvider';
import { useYjsShapes } from '@/hooks/useYjsShapes';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Square,
  Circle,
  Minus,
  MoveRight,
  Type,
  Pencil,
  Star,
  Hexagon,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ShapeType } from '@/types/shapes';

const ShapeIcon = ({ type, size = 14 }: { type: ShapeType; size?: number }) => {
  const icons: Record<ShapeType, React.ElementType> = {
    rectangle: Square,
    ellipse: Circle,
    line: Minus,
    arrow: MoveRight,
    text: Type,
    freehand: Pencil,
    star: Star,
    polygon: Hexagon,
  };
  const Icon = icons[type];
  return <Icon size={size} />;
};

export function LayersPanel() {
  const { selectedIds, setSelectedIds } = useCanvasContext();
  const { shapes, layerOrder, updateShape, reorderLayers } = useYjsShapes();

  // Display order: reverse of layerOrder (top layer first)
  const displayOrder = [...layerOrder].reverse();

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));

    if (dragIndex === dropIndex) return;

    const newDisplayOrder = [...displayOrder];
    const [removed] = newDisplayOrder.splice(dragIndex, 1);
    newDisplayOrder.splice(dropIndex, 0, removed);

    // Convert back to layerOrder (reverse)
    reorderLayers([...newDisplayOrder].reverse());
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border">
        <h3 className="font-medium text-sm">Layers</h3>
      </div>

      <div className="flex-1 overflow-auto">
        {displayOrder.length === 0 ? (
          <div className="p-4 text-sm text-text-muted text-center">
            No layers yet
          </div>
        ) : (
          displayOrder.map((id, index) => {
            const shape = shapes.find((s) => s.id === id);
            if (!shape) return null;

            const isSelected = selectedIds.includes(id);

            return (
              <div
                key={id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 border-b border-border-muted cursor-pointer',
                  'hover:bg-surface-hover transition-colors',
                  isSelected && 'bg-accent-muted'
                )}
                onClick={() => setSelectedIds([id])}
              >
                <GripVertical size={12} className="text-text-muted cursor-grab" />

                <div
                  className="w-4 h-4 rounded-sm border border-border"
                  style={{ backgroundColor: shape.fill, opacity: shape.fillOpacity }}
                />

                <ShapeIcon type={shape.type} />

                <span className="flex-1 truncate text-sm capitalize">
                  {shape.type}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateShape(id, { visible: !shape.visible });
                  }}
                  className="p-1 hover:bg-surface rounded text-text-secondary hover:text-text"
                >
                  {shape.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateShape(id, { locked: !shape.locked });
                  }}
                  className="p-1 hover:bg-surface rounded text-text-secondary hover:text-text"
                >
                  {shape.locked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
