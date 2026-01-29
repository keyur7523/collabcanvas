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
}

export function ShapeRenderer({
  shape,
  isSelected,
  onSelect,
  onChange,
  onTextEdit,
  draggable,
}: Props) {
  const commonProps = {
    isSelected,
    onSelect,
    draggable,
  };

  switch (shape.type) {
    case 'rectangle':
      return (
        <Rectangle
          {...shape}
          {...commonProps}
          onChange={onChange}
        />
      );
    case 'ellipse':
      return (
        <Ellipse
          {...shape}
          {...commonProps}
          onChange={onChange}
        />
      );
    case 'line':
      return (
        <Line
          {...shape}
          {...commonProps}
          onChange={onChange}
        />
      );
    case 'arrow':
      return (
        <Arrow
          {...shape}
          {...commonProps}
          onChange={onChange}
        />
      );
    case 'text':
      return (
        <Text
          {...shape}
          {...commonProps}
          onChange={onChange}
          onDoubleClick={onTextEdit || (() => {})}
        />
      );
    case 'freehand':
      return (
        <Freehand
          {...shape}
          {...commonProps}
          onChange={onChange}
        />
      );
    case 'star':
      return (
        <Star
          {...shape}
          {...commonProps}
          onChange={onChange}
        />
      );
    case 'polygon':
      return (
        <Polygon
          {...shape}
          {...commonProps}
          onChange={onChange}
        />
      );
    default:
      return null;
  }
}
