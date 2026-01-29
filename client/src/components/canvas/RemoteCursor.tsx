import { Group, Path, Text, Rect } from 'react-konva';

// SVG path for cursor pointer
const CURSOR_PATH = 'M0,0 L0,14 L4,11 L7,18 L10,17 L7,10 L12,10 Z';

interface Props {
  x: number;
  y: number;
  color: string;
  name: string;
}

export function RemoteCursor({ x, y, color, name }: Props) {
  const labelWidth = name.length * 7 + 12;

  return (
    <Group x={x} y={y}>
      {/* Cursor pointer */}
      <Path
        data={CURSOR_PATH}
        fill={color}
        stroke="#ffffff"
        strokeWidth={1}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={3}
        shadowOffset={{ x: 1, y: 1 }}
      />

      {/* Name label */}
      <Group y={20} x={4}>
        <Rect
          fill={color}
          cornerRadius={4}
          width={labelWidth}
          height={20}
          shadowColor="rgba(0,0,0,0.2)"
          shadowBlur={4}
          shadowOffset={{ x: 0, y: 2 }}
        />
        <Text
          text={name}
          fill="#ffffff"
          fontSize={11}
          fontFamily="Inter, sans-serif"
          fontStyle="500"
          x={6}
          y={4}
        />
      </Group>
    </Group>
  );
}
