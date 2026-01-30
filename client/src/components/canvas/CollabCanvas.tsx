import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { Stage, Layer, Rect, Transformer, Ellipse, Line, Arrow, Star, RegularPolygon } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import { useCanvasContext } from './CanvasProvider';
import { useYjsShapes } from '@/hooks/useYjsShapes';
import { useYjsUndoRedo } from '@/hooks/useYjsUndoRedo';
import { useAwareness, type UserInfo } from '@/hooks/useAwareness';
import { useClipboard } from '@/hooks/useClipboard';
import { useAlignment } from '@/hooks/useAlignment';
import { useToolStore } from '@/stores/toolStore';
import { useSnapStore, snapToGrid } from '@/stores/snapStore';
import { useThrottle } from '@/hooks/useThrottle';
import { ShapeRenderer } from './shapes/ShapeRenderer';
import { CursorLayer } from './CursorLayer';
import { RemoteSelections } from './RemoteSelections';
import { Grid } from './Grid';
import { ContextMenu } from './ContextMenu';
import { ZoomControls } from './ZoomControls';
import { AlignmentToolbar } from './AlignmentToolbar';
import type {
  Shape,
  RectangleShape,
  EllipseShape,
  LineShape,
  ArrowShape,
  TextShape,
  FreehandShape,
  StarShape,
  PolygonShape,
} from '@/types/shapes';
import { DEFAULT_SHAPE_PROPS } from '@/types/shapes';
import { generateId } from '@/lib/utils';

// Viewport buffer for virtualization (render shapes this far outside viewport)
const VIEWPORT_BUFFER = 200;

// Zoom constants
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.25;

interface Props {
  user: UserInfo;
  onRemoteStatesChange?: (states: Map<number, any>) => void;
  stageRef?: React.RefObject<Konva.Stage | null>;
}

export function CollabCanvas({ user, onRemoteStatesChange, stageRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const internalStageRef = useRef<Konva.Stage>(null);
  const actualStageRef = stageRef || internalStageRef;
  const transformerRef = useRef<Konva.Transformer>(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentPoints, setCurrentPoints] = useState<number[]>([]);
  const [previewShape, setPreviewShape] = useState<Partial<Shape> | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Selection from context (shared with panels)
  const { selectedIds, setSelectedIds } = useCanvasContext();

  // Yjs hooks
  const { shapes, layerOrder, addShape, updateShape, deleteShapes, reorderLayers } = useYjsShapes();
  const { undo, redo } = useYjsUndoRedo();
  const { remoteStates, updateCursor, clearCursor, updateSelection } = useAwareness(user);

  const { activeTool, fillColor, strokeColor, strokeWidth, setTool } = useToolStore();
  const { snapEnabled, gridSize, toggleSnap } = useSnapStore();

  // Throttled cursor update for performance (50ms)
  const throttledUpdateCursor = useThrottle(updateCursor, 50);

  // Clipboard functionality
  const { copy, cut, paste, duplicate, hasClipboardContent, hasSelection } = useClipboard({
    shapes,
    selectedIds,
    addShape,
    deleteShapes,
    setSelectedIds,
  });

  // Alignment functionality
  const {
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
  } = useAlignment({
    shapes,
    selectedIds,
    updateShape,
  });

  // Layer ordering helpers
  const bringToFront = useCallback(() => {
    if (selectedIds.length !== 1) return;
    const id = selectedIds[0];
    const newOrder = layerOrder.filter((lid) => lid !== id);
    newOrder.push(id);
    reorderLayers(newOrder);
  }, [selectedIds, layerOrder, reorderLayers]);

  const sendToBack = useCallback(() => {
    if (selectedIds.length !== 1) return;
    const id = selectedIds[0];
    const newOrder = layerOrder.filter((lid) => lid !== id);
    newOrder.unshift(id);
    reorderLayers(newOrder);
  }, [selectedIds, layerOrder, reorderLayers]);

  // Toggle lock/visibility helpers
  const toggleLock = useCallback(() => {
    selectedIds.forEach((id) => {
      const shape = shapes.find((s) => s.id === id);
      if (shape) {
        updateShape(id, { locked: !shape.locked });
      }
    });
  }, [selectedIds, shapes, updateShape]);

  const toggleVisibility = useCallback(() => {
    selectedIds.forEach((id) => {
      const shape = shapes.find((s) => s.id === id);
      if (shape) {
        updateShape(id, { visible: !shape.visible });
      }
    });
  }, [selectedIds, shapes, updateShape]);

  // Get selected shape state for context menu
  const selectedShape = selectedIds.length === 1 ? shapes.find((s) => s.id === selectedIds[0]) : null;
  const isSelectedLocked = selectedShape?.locked ?? false;
  const isSelectedVisible = selectedShape?.visible ?? true;

  // Context menu handler
  const handleContextMenu = useCallback((e: KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();

    // Get click position in screen coordinates
    const x = e.evt.clientX;
    const y = e.evt.clientY;

    setContextMenu({ x, y });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Zoom functions
  const zoomIn = useCallback(() => {
    setStageScale((prev) => Math.min(MAX_SCALE, prev + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setStageScale((prev) => Math.max(MIN_SCALE, prev - ZOOM_STEP));
  }, []);

  const zoomReset = useCallback(() => {
    setStageScale(1);
    setStagePos({ x: 0, y: 0 });
  }, []);

  const fitToContent = useCallback(() => {
    if (shapes.length === 0) {
      zoomReset();
      return;
    }

    // Calculate bounding box of all shapes
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    shapes.forEach((shape) => {
      const x = shape.x;
      const y = shape.y;
      const width = ('width' in shape ? (shape as RectangleShape).width : 0) || 100;
      const height = ('height' in shape ? (shape as RectangleShape).height : 0) || 100;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    // Add padding
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Calculate scale to fit content
    const scaleX = dimensions.width / contentWidth;
    const scaleY = dimensions.height / contentHeight;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.min(scaleX, scaleY)));

    // Calculate position to center content
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const newPosX = dimensions.width / 2 - centerX * newScale;
    const newPosY = dimensions.height / 2 - centerY * newScale;

    setStageScale(newScale);
    setStagePos({ x: newPosX, y: newPosY });
  }, [shapes, dimensions, zoomReset]);

  // Notify parent of remote states changes (for PresencePanel)
  useEffect(() => {
    onRemoteStatesChange?.(remoteStates);
  }, [remoteStates, onRemoteStatesChange]);

  // Sync selection to awareness
  useEffect(() => {
    updateSelection(selectedIds);
  }, [selectedIds, updateSelection]);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current || !actualStageRef.current) return;

    const stage = actualStageRef.current;
    const selectedNodes = selectedIds
      .map((id) => stage.findOne(`#${id}`))
      .filter(Boolean) as Konva.Node[];

    transformerRef.current.nodes(selectedNodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedIds, shapes]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      // Undo/Redo
      if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (isMod && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }

      // Copy
      if (isMod && e.key === 'c') {
        e.preventDefault();
        copy();
      }

      // Cut
      if (isMod && e.key === 'x') {
        e.preventDefault();
        cut();
      }

      // Paste
      if (isMod && e.key === 'v') {
        e.preventDefault();
        paste();
      }

      // Duplicate
      if (isMod && e.key === 'd') {
        e.preventDefault();
        duplicate();
      }

      // Bring to front
      if (isMod && e.key === ']' && !e.shiftKey) {
        e.preventDefault();
        bringToFront();
      }

      // Send to back
      if (isMod && e.key === '[' && !e.shiftKey) {
        e.preventDefault();
        sendToBack();
      }

      // Zoom in (Ctrl/Cmd + Plus or =)
      if (isMod && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        zoomIn();
      }

      // Zoom out (Ctrl/Cmd + Minus)
      if (isMod && e.key === '-') {
        e.preventDefault();
        zoomOut();
      }

      // Reset zoom (Ctrl/Cmd + 0)
      if (isMod && e.key === '0') {
        e.preventDefault();
        zoomReset();
      }

      // Fit to content (Ctrl/Cmd + 1)
      if (isMod && e.key === '1') {
        e.preventDefault();
        fitToContent();
      }

      // Delete (skip locked shapes)
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        e.preventDefault();
        const deletableIds = selectedIds.filter((id) => {
          const shape = shapes.find((s) => s.id === id);
          return shape && !shape.locked;
        });
        if (deletableIds.length > 0) {
          deleteShapes(deletableIds);
        }
        setSelectedIds([]);
      }

      // Lock/Unlock selected shapes (Ctrl/Cmd + Shift + L)
      if (isMod && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        toggleLock();
      }

      // Escape
      if (e.key === 'Escape') {
        setSelectedIds([]);
        setTool('select');
        closeContextMenu();
      }

      // Tool shortcuts
      if (!isMod) {
        switch (e.key.toLowerCase()) {
          case 'v': setTool('select'); break;
          case 'r': setTool('rectangle'); break;
          case 'o': setTool('ellipse'); break;
          case 'l': setTool('line'); break;
          case 'a': setTool('arrow'); break;
          case 't': setTool('text'); break;
          case 'p': setTool('freehand'); break;
          case 'g':
            e.preventDefault();
            toggleSnap();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, shapes, undo, redo, deleteShapes, setTool, setSelectedIds, copy, cut, paste, duplicate, bringToFront, sendToBack, closeContextMenu, zoomIn, zoomOut, zoomReset, fitToContent, toggleSnap, toggleLock]);

  // Zoom with scroll wheel
  const handleWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const stage = actualStageRef.current;
      if (!stage) return;

      const oldScale = stageScale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scaleBy = 1.1;
      const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

      const mousePointTo = {
        x: (pointer.x - stagePos.x) / oldScale,
        y: (pointer.y - stagePos.y) / oldScale,
      };

      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };

      setStageScale(clampedScale);
      setStagePos(newPos);
    },
    [stageScale, stagePos]
  );

  // Track mouse for cursor sharing
  const handleMouseMove = useCallback(
    (_e: KonvaEventObject<MouseEvent>) => {
      const stage = actualStageRef.current;
      if (!stage) return;

      const pos = stage.getRelativePointerPosition();
      if (pos) {
        throttledUpdateCursor(pos.x, pos.y);
      }

      // Handle drawing
      if (!isDrawing || !drawStart || !previewShape) return;

      const dx = pos!.x - drawStart.x;
      const dy = pos!.y - drawStart.y;

      if (activeTool === 'freehand') {
        setCurrentPoints((prev) => [...prev, dx, dy]);
        setPreviewShape((prev) => prev ? { ...prev, points: [...currentPoints, dx, dy] } : null);
        return;
      }

      let updates: Partial<Shape> = {};

      switch (activeTool) {
        case 'rectangle':
          updates = { width: dx, height: dy };
          break;
        case 'ellipse':
          updates = { radiusX: Math.abs(dx) / 2, radiusY: Math.abs(dy) / 2, x: drawStart.x + dx / 2, y: drawStart.y + dy / 2 };
          break;
        case 'line':
        case 'arrow':
          updates = { points: [0, 0, dx, dy] };
          break;
        case 'star':
          const starRadius = Math.sqrt(dx * dx + dy * dy);
          updates = { outerRadius: starRadius, innerRadius: starRadius / 2 };
          break;
        case 'polygon':
          const polyRadius = Math.sqrt(dx * dx + dy * dy);
          updates = { radius: polyRadius };
          break;
      }

      setPreviewShape((prev) => (prev ? { ...prev, ...updates } : null));
    },
    [isDrawing, drawStart, previewShape, activeTool, currentPoints, throttledUpdateCursor]
  );

  const handleMouseLeave = useCallback(() => {
    clearCursor();
    if (isDrawing) {
      handleMouseUp();
    }
  }, [clearCursor, isDrawing]);

  const createShapeAtPosition = (pos: { x: number; y: number }): Partial<Shape> | null => {
    const baseProps = {
      id: generateId(),
      x: pos.x,
      y: pos.y,
      ...DEFAULT_SHAPE_PROPS,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth,
    };

    switch (activeTool) {
      case 'rectangle':
        return { ...baseProps, type: 'rectangle', width: 0, height: 0, cornerRadius: 0 };
      case 'ellipse':
        return { ...baseProps, type: 'ellipse', radiusX: 0, radiusY: 0 };
      case 'line':
        return { ...baseProps, type: 'line', points: [0, 0, 0, 0] };
      case 'arrow':
        return { ...baseProps, type: 'arrow', points: [0, 0, 0, 0], pointerLength: 10, pointerWidth: 10 };
      case 'text':
        return { ...baseProps, type: 'text', text: 'Text', fontSize: 24, fontFamily: 'Inter', width: 0 };
      case 'freehand':
        return { ...baseProps, type: 'freehand', points: [0, 0], tension: 0.5 };
      case 'star':
        return { ...baseProps, type: 'star', numPoints: 5, innerRadius: 0, outerRadius: 0 };
      case 'polygon':
        return { ...baseProps, type: 'polygon', sides: 6, radius: 0 };
      default:
        return null;
    }
  };

  const handleMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (e.evt.button !== 0) return;

      const stage = actualStageRef.current;
      if (!stage) return;

      const pos = stage.getRelativePointerPosition();
      if (!pos) return;

      const clickedOnEmpty = e.target === e.target.getStage();

      if (activeTool === 'select') {
        if (clickedOnEmpty) {
          setSelectedIds([]);
        }
        return;
      }

      // Text tool - create immediately
      if (activeTool === 'text') {
        const textShape: TextShape = {
          id: generateId(),
          type: 'text',
          x: pos.x,
          y: pos.y,
          text: 'Text',
          fontSize: 24,
          fontFamily: 'Inter',
          width: 0,
          ...DEFAULT_SHAPE_PROPS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth,
        };
        addShape(textShape);
        setSelectedIds([textShape.id]);
        setTool('select');
        return;
      }

      setIsDrawing(true);
      setDrawStart(pos);

      if (activeTool === 'freehand') {
        setCurrentPoints([0, 0]);
      }

      const shape = createShapeAtPosition(pos);
      if (shape) {
        setPreviewShape(shape);
      }
    },
    [activeTool, fillColor, strokeColor, strokeWidth, addShape, setTool, setSelectedIds]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !previewShape) {
      setIsDrawing(false);
      return;
    }

    setIsDrawing(false);

    let shouldAdd = false;

    switch (previewShape.type) {
      case 'rectangle': {
        const rect = previewShape as Partial<RectangleShape>;
        if (Math.abs(rect.width || 0) > 5 && Math.abs(rect.height || 0) > 5) {
          const x = (rect.width || 0) < 0 ? (rect.x || 0) + (rect.width || 0) : rect.x || 0;
          const y = (rect.height || 0) < 0 ? (rect.y || 0) + (rect.height || 0) : rect.y || 0;
          previewShape.x = x;
          (previewShape as RectangleShape).width = Math.abs(rect.width || 0);
          previewShape.y = y;
          (previewShape as RectangleShape).height = Math.abs(rect.height || 0);
          shouldAdd = true;
        }
        break;
      }
      case 'ellipse': {
        const ellipse = previewShape as Partial<EllipseShape>;
        if ((ellipse.radiusX || 0) > 5 && (ellipse.radiusY || 0) > 5) {
          shouldAdd = true;
        }
        break;
      }
      case 'line':
      case 'arrow': {
        const line = previewShape as Partial<LineShape | ArrowShape>;
        const points = line.points || [0, 0, 0, 0];
        if (Math.abs(points[2]) > 5 || Math.abs(points[3]) > 5) {
          shouldAdd = true;
        }
        break;
      }
      case 'freehand': {
        const freehand = previewShape as Partial<FreehandShape>;
        if ((freehand.points?.length || 0) > 4) {
          shouldAdd = true;
        }
        break;
      }
      case 'star': {
        const star = previewShape as Partial<StarShape>;
        if ((star.outerRadius || 0) > 10) {
          shouldAdd = true;
        }
        break;
      }
      case 'polygon': {
        const poly = previewShape as Partial<PolygonShape>;
        if ((poly.radius || 0) > 10) {
          shouldAdd = true;
        }
        break;
      }
    }

    if (shouldAdd) {
      // Apply snap to position if enabled
      if (snapEnabled && previewShape.x !== undefined && previewShape.y !== undefined) {
        previewShape.x = snapToGrid(previewShape.x, gridSize);
        previewShape.y = snapToGrid(previewShape.y, gridSize);
      }
      addShape(previewShape as Shape);
      setTool('select');
    }

    setPreviewShape(null);
    setDrawStart(null);
    setCurrentPoints([]);
  }, [isDrawing, previewShape, addShape, setTool, snapEnabled, gridSize]);

  const handleShapeClick = useCallback(
    (id: string, e: KonvaEventObject<MouseEvent | TouchEvent>) => {
      e.cancelBubble = true;

      if (activeTool !== 'select') return;

      const evt = e.evt as MouseEvent;
      const isMultiSelect = evt.shiftKey || evt.metaKey;

      if (isMultiSelect) {
        setSelectedIds((prev: string[]) =>
          prev.includes(id) ? prev.filter((sid: string) => sid !== id) : [...prev, id]
        );
      } else {
        setSelectedIds([id]);
      }
    },
    [activeTool, setSelectedIds]
  );

  // Calculate viewport bounds for virtualization
  const viewport = useMemo(() => {
    const x = -stagePos.x / stageScale;
    const y = -stagePos.y / stageScale;
    const width = dimensions.width / stageScale;
    const height = dimensions.height / stageScale;
    return {
      left: x - VIEWPORT_BUFFER,
      right: x + width + VIEWPORT_BUFFER,
      top: y - VIEWPORT_BUFFER,
      bottom: y + height + VIEWPORT_BUFFER,
    };
  }, [stagePos, stageScale, dimensions]);

  // Calculate selection bounding box for alignment toolbar position
  const selectionBounds = useMemo(() => {
    if (selectedIds.length < 2) return null;

    const selectedShapes = shapes.filter((s) => selectedIds.includes(s.id));
    if (selectedShapes.length < 2) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedShapes.forEach((shape) => {
      let width = 100;
      let height = 100;

      if ('width' in shape && typeof shape.width === 'number') {
        width = shape.width;
      }
      if ('height' in shape && typeof shape.height === 'number') {
        height = shape.height;
      }
      if ('radiusX' in shape && typeof shape.radiusX === 'number') {
        width = shape.radiusX * 2;
      }
      if ('radiusY' in shape && typeof shape.radiusY === 'number') {
        height = shape.radiusY * 2;
      }
      if ('outerRadius' in shape && typeof shape.outerRadius === 'number') {
        width = shape.outerRadius * 2;
        height = shape.outerRadius * 2;
      }
      if ('radius' in shape && typeof shape.radius === 'number') {
        width = shape.radius * 2;
        height = shape.radius * 2;
      }

      minX = Math.min(minX, shape.x);
      minY = Math.min(minY, shape.y);
      maxX = Math.max(maxX, shape.x + width);
      maxY = Math.max(maxY, shape.y + height);
    });

    // Convert to screen coordinates
    const screenX = (minX + maxX) / 2 * stageScale + stagePos.x;
    const screenY = minY * stageScale + stagePos.y;

    return { x: screenX, y: screenY };
  }, [shapes, selectedIds, stageScale, stagePos]);

  // Get sorted and virtualized shapes (only render visible ones)
  const sortedShapes = useMemo(() => {
    return layerOrder
      .map((id) => shapes.find((s) => s.id === id))
      .filter((s): s is Shape => {
        if (!s || !s.visible) return false;

        // Always render selected shapes
        if (selectedIds.includes(s.id)) return true;

        // Get shape bounds (approximate for different shape types)
        const shapeRight = s.x + (('width' in s ? (s as RectangleShape).width : 0) || 100);
        const shapeBottom = s.y + (('height' in s ? (s as RectangleShape).height : 0) || 100);

        // Check if shape intersects viewport
        return (
          shapeRight >= viewport.left &&
          s.x <= viewport.right &&
          shapeBottom >= viewport.top &&
          s.y <= viewport.bottom
        );
      });
  }, [shapes, layerOrder, viewport, selectedIds]);

  return (
    <div ref={containerRef} className="w-full h-full bg-canvas overflow-hidden">
      <Stage
        ref={actualStageRef}
        width={dimensions.width}
        height={dimensions.height}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
      >
        {/* Grid Layer */}
        <Layer listening={false}>
          <Grid
            width={dimensions.width}
            height={dimensions.height}
            stageX={stagePos.x}
            stageY={stagePos.y}
            scale={stageScale}
          />
        </Layer>

        {/* Shapes Layer */}
        <Layer>
          {sortedShapes.map((shape) => (
            <ShapeRenderer
              key={shape.id}
              shape={shape}
              isSelected={selectedIds.includes(shape.id)}
              onSelect={(e) => handleShapeClick(shape.id, e)}
              onChange={(updates) => updateShape(shape.id, updates)}
              draggable={!shape.locked && activeTool === 'select'}
              snapEnabled={snapEnabled}
              gridSize={gridSize}
            />
          ))}

          {/* Drawing preview */}
          {isDrawing && previewShape && (
            <PreviewShape shape={previewShape} />
          )}
        </Layer>

        {/* Remote Selections Layer - shows what others are selecting */}
        <Layer listening={false}>
          <RemoteSelections remoteStates={remoteStates} shapes={shapes} />
        </Layer>

        {/* Selection Layer */}
        <Layer>
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>

        {/* Remote Cursors Layer */}
        <CursorLayer remoteStates={remoteStates} />
      </Stage>

      {/* Alignment Toolbar - shows when 2+ shapes selected */}
      {selectionBounds && (
        <AlignmentToolbar
          position={selectionBounds}
          onAlignLeft={alignLeft}
          onAlignCenterH={alignCenterH}
          onAlignRight={alignRight}
          onAlignTop={alignTop}
          onAlignCenterV={alignCenterV}
          onAlignBottom={alignBottom}
          onDistributeH={distributeH}
          onDistributeV={distributeV}
          canAlign={canAlign}
          canDistribute={canDistribute}
        />
      )}

      {/* Lock indicators for selected locked shapes */}
      {selectedIds.map((id) => {
        const shape = shapes.find((s) => s.id === id);
        if (!shape || !shape.locked) return null;

        // Calculate screen position
        const screenX = shape.x * stageScale + stagePos.x;
        const screenY = shape.y * stageScale + stagePos.y;

        return (
          <div
            key={`lock-${id}`}
            className="absolute z-30 pointer-events-none"
            style={{
              left: screenX - 12,
              top: screenY - 12,
            }}
          >
            <div className="bg-warning text-white rounded-full p-1 shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>
        );
      })}

      {/* Zoom Controls */}
      <ZoomControls
        scale={stageScale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomReset={zoomReset}
        onFitToContent={fitToContent}
        minScale={MIN_SCALE}
        maxScale={MAX_SCALE}
      />

      {/* Context Menu */}
      <ContextMenu
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        isOpen={contextMenu !== null}
        onClose={closeContextMenu}
        onCopy={copy}
        onCut={cut}
        onPaste={paste}
        onDuplicate={duplicate}
        onDelete={() => {
          deleteShapes(selectedIds);
          setSelectedIds([]);
        }}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
        onToggleLock={toggleLock}
        onToggleVisibility={toggleVisibility}
        hasSelection={hasSelection}
        hasClipboard={hasClipboardContent}
        isLocked={isSelectedLocked}
        isVisible={isSelectedVisible}
      />
    </div>
  );
}

// Preview shape component for drawing (unchanged)
function PreviewShape({ shape }: { shape: Partial<Shape> }) {
  const commonProps = {
    opacity: 0.6,
    listening: false,
    dash: [5, 5],
  };

  switch (shape.type) {
    case 'rectangle':
      return (
        <Rect
          x={shape.x}
          y={shape.y}
          width={(shape as RectangleShape).width || 0}
          height={(shape as RectangleShape).height || 0}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          {...commonProps}
        />
      );
    case 'ellipse': {
      const ellipse = shape as Partial<EllipseShape>;
      return (
        <Ellipse
          x={ellipse.x}
          y={ellipse.y}
          radiusX={ellipse.radiusX || 0}
          radiusY={ellipse.radiusY || 0}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          {...commonProps}
        />
      );
    }
    case 'line': {
      const line = shape as Partial<LineShape>;
      return (
        <Line
          x={line.x}
          y={line.y}
          points={line.points || [0, 0, 0, 0]}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          {...commonProps}
        />
      );
    }
    case 'arrow': {
      const arrow = shape as Partial<ArrowShape>;
      return (
        <Arrow
          x={arrow.x}
          y={arrow.y}
          points={arrow.points || [0, 0, 0, 0]}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          pointerLength={arrow.pointerLength || 10}
          pointerWidth={arrow.pointerWidth || 10}
          fill={shape.stroke}
          {...commonProps}
        />
      );
    }
    case 'freehand': {
      const freehand = shape as Partial<FreehandShape>;
      return (
        <Line
          x={freehand.x}
          y={freehand.y}
          points={freehand.points || [0, 0]}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          tension={freehand.tension || 0.5}
          lineCap="round"
          lineJoin="round"
          {...commonProps}
          dash={undefined}
        />
      );
    }
    case 'star': {
      const star = shape as Partial<StarShape>;
      return (
        <Star
          x={star.x}
          y={star.y}
          numPoints={star.numPoints || 5}
          innerRadius={star.innerRadius || 0}
          outerRadius={star.outerRadius || 0}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          {...commonProps}
        />
      );
    }
    case 'polygon': {
      const poly = shape as Partial<PolygonShape>;
      return (
        <RegularPolygon
          x={poly.x}
          y={poly.y}
          sides={poly.sides || 6}
          radius={poly.radius || 0}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          {...commonProps}
        />
      );
    }
    default:
      return null;
  }
}