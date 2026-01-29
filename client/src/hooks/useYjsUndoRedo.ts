import { useMemo, useState, useEffect } from 'react';
import * as Y from 'yjs';
import { useCanvasContext } from '@/components/canvas/CanvasProvider';

export function useYjsUndoRedo() {
  const { yShapes, yLayers } = useCanvasContext();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const undoManager = useMemo(() => {
    return new Y.UndoManager([yShapes, yLayers], {
      captureTimeout: 500,
    });
  }, [yShapes, yLayers]);

  useEffect(() => {
    const updateState = () => {
      setCanUndo(undoManager.canUndo());
      setCanRedo(undoManager.canRedo());
    };

    undoManager.on('stack-item-added', updateState);
    undoManager.on('stack-item-popped', updateState);
    updateState();

    return () => {
      undoManager.destroy();
    };
  }, [undoManager]);

  const undo = () => {
    if (undoManager.canUndo()) {
      undoManager.undo();
    }
  };

  const redo = () => {
    if (undoManager.canRedo()) {
      undoManager.redo();
    }
  };

  return { undo, redo, canUndo, canRedo };
}
