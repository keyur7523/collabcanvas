import { Line } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { FreehandShape } from '@/types/shapes';

interface Props extends FreehandShape {
  isSelected: boolean;
  onSelect: (e: KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (updates: Partial<FreehandShape>) => void;
  draggable: boolean;
}

export function Freehand({
  id,
  x,
  y,
  points,
  tension,
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
    <Line
      id={id}
      x={x}
      y={y}
      points={points}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={strokeOpacity}
      tension={tension || 0.5}
      lineCap="round"
      lineJoin="round"
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
