import { Rect } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { RectangleShape } from '@/types/shapes';

interface Props extends RectangleShape {
  isSelected: boolean;
  onSelect: (e: KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (updates: Partial<RectangleShape>) => void;
  draggable: boolean;
}

export function Rectangle({
  id,
  x,
  y,
  width,
  height,
  fill,
  fillOpacity,
  stroke,
  strokeWidth,
  cornerRadius,
  rotation,
  visible,
  draggable,
  onSelect,
  onChange,
}: Props) {
  return (
    <Rect
      id={id}
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      opacity={fillOpacity}
      stroke={stroke}
      strokeWidth={strokeWidth}
      cornerRadius={cornerRadius}
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
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
          rotation: node.rotation(),
        });
      }}
    />
  );
}
