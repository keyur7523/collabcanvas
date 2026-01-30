import { useCallback } from 'react';
import type { Shape } from '@/types/shapes';

interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  right: number;
  bottom: number;
}

interface UseAlignmentOptions {
  shapes: Shape[];
  selectedIds: string[];
  updateShape: (id: string, updates: Partial<Shape>) => void;
}

export function useAlignment({
  shapes,
  selectedIds,
  updateShape,
}: UseAlignmentOptions) {
  /**
   * Get bounding boxes for selected shapes
   */
  const getSelectedBounds = useCallback((): BoundingBox[] => {
    return shapes
      .filter((s) => selectedIds.includes(s.id))
      .map((shape) => {
        // Get width/height based on shape type
        let width = 100;
        let height = 100;

        if ('width' in shape && typeof shape.width === 'number') {
          width = shape.width;
        }
        if ('height' in shape && typeof shape.height === 'number') {
          height = shape.height;
        }
        // For ellipses, use radius
        if ('radiusX' in shape && typeof shape.radiusX === 'number') {
          width = shape.radiusX * 2;
        }
        if ('radiusY' in shape && typeof shape.radiusY === 'number') {
          height = shape.radiusY * 2;
        }
        // For stars/polygons, use radius
        if ('outerRadius' in shape && typeof shape.outerRadius === 'number') {
          width = shape.outerRadius * 2;
          height = shape.outerRadius * 2;
        }
        if ('radius' in shape && typeof shape.radius === 'number') {
          width = shape.radius * 2;
          height = shape.radius * 2;
        }

        return {
          id: shape.id,
          x: shape.x,
          y: shape.y,
          width,
          height,
          centerX: shape.x + width / 2,
          centerY: shape.y + height / 2,
          right: shape.x + width,
          bottom: shape.y + height,
        };
      });
  }, [shapes, selectedIds]);

  /**
   * Align shapes to the left edge
   */
  const alignLeft = useCallback(() => {
    const bounds = getSelectedBounds();
    if (bounds.length < 2) return;

    const minX = Math.min(...bounds.map((b) => b.x));
    bounds.forEach((b) => {
      updateShape(b.id, { x: minX });
    });
  }, [getSelectedBounds, updateShape]);

  /**
   * Align shapes to horizontal center
   */
  const alignCenterH = useCallback(() => {
    const bounds = getSelectedBounds();
    if (bounds.length < 2) return;

    const minX = Math.min(...bounds.map((b) => b.x));
    const maxRight = Math.max(...bounds.map((b) => b.right));
    const centerX = (minX + maxRight) / 2;

    bounds.forEach((b) => {
      updateShape(b.id, { x: centerX - b.width / 2 });
    });
  }, [getSelectedBounds, updateShape]);

  /**
   * Align shapes to the right edge
   */
  const alignRight = useCallback(() => {
    const bounds = getSelectedBounds();
    if (bounds.length < 2) return;

    const maxRight = Math.max(...bounds.map((b) => b.right));
    bounds.forEach((b) => {
      updateShape(b.id, { x: maxRight - b.width });
    });
  }, [getSelectedBounds, updateShape]);

  /**
   * Align shapes to the top edge
   */
  const alignTop = useCallback(() => {
    const bounds = getSelectedBounds();
    if (bounds.length < 2) return;

    const minY = Math.min(...bounds.map((b) => b.y));
    bounds.forEach((b) => {
      updateShape(b.id, { y: minY });
    });
  }, [getSelectedBounds, updateShape]);

  /**
   * Align shapes to vertical center
   */
  const alignCenterV = useCallback(() => {
    const bounds = getSelectedBounds();
    if (bounds.length < 2) return;

    const minY = Math.min(...bounds.map((b) => b.y));
    const maxBottom = Math.max(...bounds.map((b) => b.bottom));
    const centerY = (minY + maxBottom) / 2;

    bounds.forEach((b) => {
      updateShape(b.id, { y: centerY - b.height / 2 });
    });
  }, [getSelectedBounds, updateShape]);

  /**
   * Align shapes to the bottom edge
   */
  const alignBottom = useCallback(() => {
    const bounds = getSelectedBounds();
    if (bounds.length < 2) return;

    const maxBottom = Math.max(...bounds.map((b) => b.bottom));
    bounds.forEach((b) => {
      updateShape(b.id, { y: maxBottom - b.height });
    });
  }, [getSelectedBounds, updateShape]);

  /**
   * Distribute shapes evenly horizontally
   */
  const distributeH = useCallback(() => {
    const bounds = getSelectedBounds();
    if (bounds.length < 3) return;

    // Sort by x position
    const sorted = [...bounds].sort((a, b) => a.x - b.x);

    // Calculate total width and spacing
    const totalWidth = sorted[sorted.length - 1].right - sorted[0].x;
    const shapesWidth = sorted.reduce((sum, b) => sum + b.width, 0);
    const gap = (totalWidth - shapesWidth) / (sorted.length - 1);

    // Position shapes
    let currentX = sorted[0].x;
    sorted.forEach((b, i) => {
      if (i === 0) {
        currentX += b.width + gap;
        return;
      }
      updateShape(b.id, { x: currentX });
      currentX += b.width + gap;
    });
  }, [getSelectedBounds, updateShape]);

  /**
   * Distribute shapes evenly vertically
   */
  const distributeV = useCallback(() => {
    const bounds = getSelectedBounds();
    if (bounds.length < 3) return;

    // Sort by y position
    const sorted = [...bounds].sort((a, b) => a.y - b.y);

    // Calculate total height and spacing
    const totalHeight = sorted[sorted.length - 1].bottom - sorted[0].y;
    const shapesHeight = sorted.reduce((sum, b) => sum + b.height, 0);
    const gap = (totalHeight - shapesHeight) / (sorted.length - 1);

    // Position shapes
    let currentY = sorted[0].y;
    sorted.forEach((b, i) => {
      if (i === 0) {
        currentY += b.height + gap;
        return;
      }
      updateShape(b.id, { y: currentY });
      currentY += b.height + gap;
    });
  }, [getSelectedBounds, updateShape]);

  /**
   * Check if alignment operations are available
   */
  const canAlign = selectedIds.length >= 2;
  const canDistribute = selectedIds.length >= 3;

  return {
    alignLeft,
    alignCenterH,
    alignRight,
    alignTop,
    alignCenterV,
    alignBottom,
    distributeH,
    distributeV,
    canAlign,
    canDistribute,
  };
}
