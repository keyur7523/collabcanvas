import { RegularPolygon } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { PolygonShape } from '@/types/shapes';

interface Props extends PolygonShape {
  isSelected: boolean;
  onSelect: (e: KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (updates: Partial<PolygonShape>) => void;
  draggable: boolean;
}

export function Polygon({
  id,
  x,
  y,
  sides,
  radius,
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
    <RegularPolygon
      id={id}
      x={x}
      y={y}
      sides={sides}
      radius={radius}
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
          radius: Math.max(10, radius * avgScale),
          rotation: node.rotation(),
        });
      }}
    />
  );
}
