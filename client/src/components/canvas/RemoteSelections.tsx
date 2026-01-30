import type { ReactElement } from 'react';
import { Rect, Group, Text } from 'react-konva';
import type { RemoteState } from '@/hooks/useAwareness';
import type { Shape, RectangleShape, EllipseShape } from '@/types/shapes';

interface Props {
  remoteStates: Map<number, RemoteState>;
  shapes: Shape[];
}

/**
 * Renders colored selection borders around shapes that remote users have selected.
 * This provides visual feedback about who is working on what.
 */
export function RemoteSelections({ remoteStates, shapes }: Props) {
  // Build a map of shapeId -> users selecting it
  const shapeSelections = new Map<string, { user: RemoteState['user']; clientId: number }[]>();
  
  remoteStates.forEach((state, clientId) => {
    if (state.selection && state.selection.length > 0) {
      state.selection.forEach((shapeId) => {
        const existing = shapeSelections.get(shapeId) || [];
        existing.push({ user: state.user, clientId });
        shapeSelections.set(shapeId, existing);
      });
    }
  });

  // Get bounds for different shape types
  const getShapeBounds = (shape: Shape): { x: number; y: number; width: number; height: number } | null => {
    switch (shape.type) {
      case 'rectangle':
        const rect = shape as RectangleShape;
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      
      case 'ellipse':
        const ellipse = shape as EllipseShape;
        return {
          x: ellipse.x - ellipse.radiusX,
          y: ellipse.y - ellipse.radiusY,
          width: ellipse.radiusX * 2,
          height: ellipse.radiusY * 2,
        };
      
      case 'text':
        // Text shapes - approximate bounds
        return { x: shape.x, y: shape.y, width: 100, height: 30 };
      
      case 'star':
      case 'polygon':
        // For star/polygon, use outer radius as approximate bounds
        const radius = 'outerRadius' in shape ? shape.outerRadius : ('radius' in shape ? shape.radius : 50);
        return {
          x: shape.x - radius,
          y: shape.y - radius,
          width: radius * 2,
          height: radius * 2,
        };
      
      case 'line':
      case 'arrow':
      case 'freehand':
        // For line-based shapes, calculate bounding box from points
        if ('points' in shape && shape.points.length >= 4) {
          const xs = shape.points.filter((_, i) => i % 2 === 0);
          const ys = shape.points.filter((_, i) => i % 2 === 1);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          return {
            x: shape.x + minX,
            y: shape.y + minY,
            width: maxX - minX || 20,
            height: maxY - minY || 20,
          };
        }
        return null;
      
      default:
        return null;
    }
  };

  const selections: ReactElement[] = [];

  shapeSelections.forEach((users, shapeId) => {
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape || !shape.visible) return;

    const bounds = getShapeBounds(shape);
    if (!bounds) return;

    // Use the first user's color for the selection
    const primaryUser = users[0];
    const padding = 4;
    const labelHeight = 16;

    selections.push(
      <Group key={`selection-${shapeId}`}>
        {/* Selection border */}
        <Rect
          x={bounds.x - padding}
          y={bounds.y - padding}
          width={bounds.width + padding * 2}
          height={bounds.height + padding * 2}
          stroke={primaryUser.user.color}
          strokeWidth={2}
          dash={[5, 5]}
          cornerRadius={4}
          listening={false}
        />
        
        {/* User label */}
        <Group x={bounds.x - padding} y={bounds.y - padding - labelHeight - 2}>
          <Rect
            fill={primaryUser.user.color}
            cornerRadius={3}
            width={primaryUser.user.name.length * 6 + 8}
            height={labelHeight}
          />
          <Text
            text={users.length > 1 ? `${primaryUser.user.name} +${users.length - 1}` : primaryUser.user.name}
            fill="#ffffff"
            fontSize={10}
            fontFamily="Inter, sans-serif"
            x={4}
            y={3}
          />
        </Group>
      </Group>
    );
  });

  return <>{selections}</>;
}