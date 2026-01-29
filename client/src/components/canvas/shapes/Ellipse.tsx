import { Ellipse as KonvaEllipse } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { EllipseShape } from '@/types/shapes';

interface Props extends EllipseShape {
  isSelected: boolean;
  onSelect: (e: KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (updates: Partial<EllipseShape>) => void;
  draggable: boolean;
}

export function Ellipse({
  id,
  x,
  y,
  radiusX,
  radiusY,
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
    <KonvaEllipse
      id={id}
      x={x}
      y={y}
      radiusX={radiusX}
      radiusY={radiusY}
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
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x(),
          y: node.y(),
          radiusX: Math.max(5, (node.width() / 2) * scaleX),
          radiusY: Math.max(5, (node.height() / 2) * scaleY),
          rotation: node.rotation(),
        });
      }}
    />
  );
}
