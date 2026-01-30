import type { KonvaEventObject } from 'konva/lib/Node';
import type { Shape } from '@/types/shapes';
import { Rectangle } from './Rectangle';
import { Ellipse } from './Ellipse';
import { Line } from './Line';
import { Arrow } from './Arrow';
import { Text } from './Text';
import { Freehand } from './Freehand';
import { Star } from './Star';
import { Polygon } from './Polygon';

interface Props {
  shape: Shape;
  isSelected: boolean;
  onSelect: (e: KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (updates: Partial<Shape>) => void;
  onTextEdit?: () => void;
  draggable: boolean;
  snapEnabled?: boolean;
  gridSize?: number;
}

// Snap utility function
function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function ShapeRenderer({
  shape,
  isSelected,
  onSelect,
  onChange,
  onTextEdit,
  draggable,
  snapEnabled = false,
  gridSize = 20,
}: Props) {
  // Wrap onChange to apply snap if enabled
  const handleChange = (updates: Partial<Shape>) => {
    if (snapEnabled && gridSize > 0) {
      const snappedUpdates = { ...updates };
      if ('x' in snappedUpdates && typeof snappedUpdates.x === 'number') {
        snappedUpdates.x = snapToGrid(snappedUpdates.x, gridSize);
      }
      if ('y' in snappedUpdates && typeof snappedUpdates.y === 'number') {
        snappedUpdates.y = snapToGrid(snappedUpdates.y, gridSize);
      }
      onChange(snappedUpdates);
    } else {
      onChange(updates);
    }
  };

  const commonProps = {
    isSelected,
    onSelect,
    draggable,
    snapEnabled,
    gridSize,
  };

  switch (shape.type) {
    case 'rectangle':
      return (
        <Rectangle
          {...shape}
          {...commonProps}
          onChange={handleChange}
        />
      );
    case 'ellipse':
      return (
        <Ellipse
          {...shape}
          {...commonProps}
          onChange={handleChange}
        />
      );
    case 'line':
      return (
        <Line
          {...shape}
          {...commonProps}
          onChange={handleChange}
        />
      );
    case 'arrow':
      return (
        <Arrow
          {...shape}
          {...commonProps}
          onChange={handleChange}
        />
      );
    case 'text':
      return (
        <Text
          {...shape}
          {...commonProps}
          onChange={handleChange}
          onDoubleClick={onTextEdit || (() => {})}
        />
      );
    case 'freehand':
      return (
        <Freehand
          {...shape}
          {...commonProps}
          onChange={handleChange}
        />
      );
    case 'star':
      return (
        <Star
          {...shape}
          {...commonProps}
          onChange={handleChange}
        />
      );
    case 'polygon':
      return (
        <Polygon
          {...shape}
          {...commonProps}
          onChange={handleChange}
        />
      );
    default:
      return null;
  }
}
