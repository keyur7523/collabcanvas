import { Text as KonvaText } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { TextShape } from '@/types/shapes';

interface Props extends TextShape {
  isSelected: boolean;
  onSelect: (e: KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (updates: Partial<TextShape>) => void;
  onDoubleClick: () => void;
  draggable: boolean;
}

export function Text({
  id,
  x,
  y,
  text,
  fontSize,
  fontFamily,
  width,
  fill,
  fillOpacity,
  rotation,
  visible,
  draggable,
  onSelect,
  onChange,
  onDoubleClick,
}: Props) {
  return (
    <KonvaText
      id={id}
      x={x}
      y={y}
      text={text}
      fontSize={fontSize}
      fontFamily={fontFamily}
      width={width > 0 ? width : undefined}
      fill={fill}
      opacity={fillOpacity}
      rotation={rotation}
      visible={visible}
      draggable={draggable}
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={onDoubleClick}
      onDblTap={onDoubleClick}
      onDragEnd={(e) => {
        onChange({ x: e.target.x(), y: e.target.y() });
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(20, node.width() * scaleX),
          rotation: node.rotation(),
        });
      }}
    />
  );
}
