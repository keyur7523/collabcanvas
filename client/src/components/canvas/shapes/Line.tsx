import { Line as KonvaLine } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { LineShape } from '@/types/shapes';

interface Props extends LineShape {
  isSelected: boolean;
  onSelect: (e: KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (updates: Partial<LineShape>) => void;
  draggable: boolean;
}

export function Line({
  id,
  x,
  y,
  points,
  stroke,
  strokeWidth,
  strokeOpacity,
  rotation,
  visible,
  draggable,
  onSelect,
  onChange,
}: Props) {
  return (
    <KonvaLine
      id={id}
      x={x}
      y={y}
      points={points}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={strokeOpacity}
      rotation={rotation}
      visible={visible}
      draggable={draggable}
      hitStrokeWidth={Math.max(strokeWidth, 10)}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onChange({ x: e.target.x(), y: e.target.y() });
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        onChange({
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
        });
      }}
    />
  );
}
