import { useMemo } from 'react';
import { Circle, Group } from 'react-konva';
import { useThemeStore } from '@/stores/themeStore';

interface GridProps {
  width: number;
  height: number;
  stageX: number;
  stageY: number;
  scale: number;
}

// Grid configuration
const DOT_SPACING = 20; // Base spacing between dots in pixels
const DOT_RADIUS = 1.5; // Radius of each dot
const DOT_COLOR_LIGHT = '#d1d5db'; // Light mode gray
const DOT_COLOR_DARK = '#3f3f46'; // Dark mode gray

export function Grid({ width, height, stageX, stageY, scale }: GridProps) {
  const theme = useThemeStore((state) => state.theme);

  const isDark = theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const dotColor = isDark ? DOT_COLOR_DARK : DOT_COLOR_LIGHT;

  const dots = useMemo(() => {
    const result: { x: number; y: number }[] = [];

    // Calculate the visible area in canvas coordinates
    const startX = Math.floor(-stageX / scale / DOT_SPACING) * DOT_SPACING - DOT_SPACING;
    const startY = Math.floor(-stageY / scale / DOT_SPACING) * DOT_SPACING - DOT_SPACING;
    const endX = Math.ceil((width - stageX) / scale / DOT_SPACING) * DOT_SPACING + DOT_SPACING;
    const endY = Math.ceil((height - stageY) / scale / DOT_SPACING) * DOT_SPACING + DOT_SPACING;

    // Generate dots only for visible area
    for (let x = startX; x <= endX; x += DOT_SPACING) {
      for (let y = startY; y <= endY; y += DOT_SPACING) {
        result.push({ x, y });
      }
    }

    return result;
  }, [width, height, stageX, stageY, scale]);

  // Adjust dot size based on zoom level for consistent visual appearance
  const adjustedRadius = Math.max(DOT_RADIUS / scale, 0.5);

  return (
    <Group listening={false}>
      {dots.map((dot, index) => (
        <Circle
          key={index}
          x={dot.x}
          y={dot.y}
          radius={adjustedRadius}
          fill={dotColor}
          perfectDrawEnabled={false}
          shadowForStrokeEnabled={false}
          hitStrokeWidth={0}
          listening={false}
        />
      ))}
    </Group>
  );
}
