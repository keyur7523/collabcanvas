import { useState, useCallback } from 'react';
import { generateId } from '@/lib/utils';
import type { Shape } from '@/types/shapes';

// Offset for pasted shapes (so they don't overlap exactly)
const PASTE_OFFSET = 20;

interface ClipboardState {
  shapes: Shape[];
  isCut: boolean;
}

interface UseClipboardOptions {
  shapes: Shape[];
  selectedIds: string[];
  addShape: (shape: Shape) => void;
  deleteShapes: (ids: string[]) => void;
  setSelectedIds: (ids: string[]) => void;
}

export function useClipboard({
  shapes,
  selectedIds,
  addShape,
  deleteShapes,
  setSelectedIds,
}: UseClipboardOptions) {
  const [clipboard, setClipboard] = useState<ClipboardState | null>(null);
  const [pasteCount, setPasteCount] = useState(0);

  /**
   * Copy selected shapes to clipboard
   */
  const copy = useCallback(() => {
    if (selectedIds.length === 0) return false;

    const selectedShapes = shapes.filter((s) => selectedIds.includes(s.id));
    if (selectedShapes.length === 0) return false;

    // Deep clone the shapes
    const clonedShapes = JSON.parse(JSON.stringify(selectedShapes)) as Shape[];

    setClipboard({
      shapes: clonedShapes,
      isCut: false,
    });
    setPasteCount(0);

    return true;
  }, [shapes, selectedIds]);

  /**
   * Cut selected shapes (copy + mark for deletion on paste)
   */
  const cut = useCallback(() => {
    if (selectedIds.length === 0) return false;

    const selectedShapes = shapes.filter((s) => selectedIds.includes(s.id));
    if (selectedShapes.length === 0) return false;

    // Deep clone the shapes
    const clonedShapes = JSON.parse(JSON.stringify(selectedShapes)) as Shape[];

    setClipboard({
      shapes: clonedShapes,
      isCut: true,
    });
    setPasteCount(0);

    // Delete original shapes immediately
    deleteShapes(selectedIds);
    setSelectedIds([]);

    return true;
  }, [shapes, selectedIds, deleteShapes, setSelectedIds]);

  /**
   * Paste shapes from clipboard
   */
  const paste = useCallback(() => {
    if (!clipboard || clipboard.shapes.length === 0) return false;

    // Calculate offset based on paste count
    const offset = PASTE_OFFSET * (pasteCount + 1);

    // Create new shapes with new IDs and offset positions
    const newShapeIds: string[] = [];

    clipboard.shapes.forEach((shape) => {
      const newShape: Shape = {
        ...shape,
        id: generateId(),
        x: shape.x + offset,
        y: shape.y + offset,
      };

      addShape(newShape);
      newShapeIds.push(newShape.id);
    });

    // Select the newly pasted shapes
    setSelectedIds(newShapeIds);

    // Increment paste count for next paste offset
    setPasteCount((prev) => prev + 1);

    // If it was a cut operation, clear clipboard after first paste
    if (clipboard.isCut) {
      setClipboard(null);
      setPasteCount(0);
    }

    return true;
  }, [clipboard, pasteCount, addShape, setSelectedIds]);

  /**
   * Duplicate selected shapes (copy + paste in one action)
   */
  const duplicate = useCallback(() => {
    if (selectedIds.length === 0) return false;

    const selectedShapes = shapes.filter((s) => selectedIds.includes(s.id));
    if (selectedShapes.length === 0) return false;

    const newShapeIds: string[] = [];

    selectedShapes.forEach((shape) => {
      const newShape: Shape = {
        ...JSON.parse(JSON.stringify(shape)),
        id: generateId(),
        x: shape.x + PASTE_OFFSET,
        y: shape.y + PASTE_OFFSET,
      };

      addShape(newShape);
      newShapeIds.push(newShape.id);
    });

    // Select the duplicated shapes
    setSelectedIds(newShapeIds);

    return true;
  }, [shapes, selectedIds, addShape, setSelectedIds]);

  /**
   * Check if clipboard has content
   */
  const hasClipboardContent = clipboard !== null && clipboard.shapes.length > 0;

  /**
   * Check if there are selected shapes
   */
  const hasSelection = selectedIds.length > 0;

  return {
    copy,
    cut,
    paste,
    duplicate,
    hasClipboardContent,
    hasSelection,
  };
}
