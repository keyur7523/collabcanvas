import { Arrow as KonvaArrow } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { ArrowShape } from '@/types/shapes';

interface Props extends ArrowShape {
  isSelected: boolean;
  onSelect: (e: KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (updates: Partial<ArrowShape>) => void;
  draggable: boolean;
}

export function Arrow({
  id,
  x,
  y,
  points,
  stroke,
  strokeWidth,
  strokeOpacity,
  pointerLength,
  pointerWidth,
  rotation,
  visible,
  draggable,
  onSelect,
  onChange,
}: Props) {
  return (
    <KonvaArrow
      id={id}
      x={x}
      y={y}
      points={points}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={strokeOpacity}
      pointerLength={pointerLength || 10}
      pointerWidth={pointerWidth || 10}
      fill={stroke}
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
