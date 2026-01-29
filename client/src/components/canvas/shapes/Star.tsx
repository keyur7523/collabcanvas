import { Star as KonvaStar } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { StarShape } from '@/types/shapes';

interface Props extends StarShape {
  isSelected: boolean;
  onSelect: (e: KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (updates: Partial<StarShape>) => void;
  draggable: boolean;
}

export function Star({
  id,
  x,
  y,
  numPoints,
  innerRadius,
  outerRadius,
  fill,
  fillOpacity,
  stroke,
  strokeWidth,
  rotation,
  visible,
  draggable,
  onSelect,
  onChange,
}: Props) {
  return (
    <KonvaStar
      id={id}
      x={x}
      y={y}
      numPoints={numPoints}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      fill={fill}
      opacity={fillOpacity}
      stroke={stroke}
      strokeWidth={strokeWidth}
      rotation={rotation}
      visible={visible}
      draggable={draggable}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onChange({ x: e.target.x(), y: e.target.y() });
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        const avgScale = (scaleX + scaleY) / 2;
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x(),
          y: node.y(),
          innerRadius: Math.max(5, innerRadius * avgScale),
          outerRadius: Math.max(10, outerRadius * avgScale),
          rotation: node.rotation(),
        });
      }}
    />
  );
}
