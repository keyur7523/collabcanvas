import { useEffect, useState, useCallback } from 'react';
import { useCanvasContext } from '@/components/canvas/CanvasProvider';
import type { Shape } from '@/types/shapes';

export function useYjsShapes() {
  const { yShapes, yLayers } = useCanvasContext();
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [layerOrder, setLayerOrder] = useState<string[]>([]);

  useEffect(() => {
    const syncShapes = () => {
      const arr: Shape[] = [];
      yShapes.forEach((shape, id) => {
        arr.push({ ...shape, id });
      });
      setShapes(arr);
    };

    const syncLayers = () => {
      setLayerOrder(yLayers.toArray());
    };

    // Initial sync
    syncShapes();
    syncLayers();

    // Observe changes
    yShapes.observe(syncShapes);
    yLayers.observe(syncLayers);

    return () => {
      yShapes.unobserve(syncShapes);
      yLayers.unobserve(syncLayers);
    };
  }, [yShapes, yLayers]);

  const addShape = useCallback(
    (shape: Shape) => {
      yShapes.set(shape.id, shape);
      yLayers.push([shape.id]);
    },
    [yShapes, yLayers]
  );

  const updateShape = useCallback(
    (id: string, updates: Partial<Shape>) => {
      const existing = yShapes.get(id);
      if (existing) {
        yShapes.set(id, { ...existing, ...updates } as Shape);
      }
    },
    [yShapes]
  );

  const deleteShape = useCallback(
    (id: string) => {
      yShapes.delete(id);
      const arr = yLayers.toArray();
      const idx = arr.indexOf(id);
      if (idx !== -1) {
        yLayers.delete(idx, 1);
      }
    },
    [yShapes, yLayers]
  );

  const deleteShapes = useCallback(
    (ids: string[]) => {
      ids.forEach((id) => {
        yShapes.delete(id);
        const arr = yLayers.toArray();
        const idx = arr.indexOf(id);
        if (idx !== -1) {
          yLayers.delete(idx, 1);
        }
      });
    },
    [yShapes, yLayers]
  );

  const reorderLayers = useCallback(
    (newOrder: string[]) => {
      // Clear and repopulate
      while (yLayers.length > 0) {
        yLayers.delete(0, 1);
      }
      yLayers.push(newOrder);
    },
    [yLayers]
  );

  return {
    shapes,
    layerOrder,
    addShape,
    updateShape,
    deleteShape,
    deleteShapes,
    reorderLayers,
  };
}
