import { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer, Rect, Transformer } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import { useCanvasStore } from '@/stores/canvasStore';
import { useToolStore } from '@/stores/toolStore';
import { ShapeRenderer } from './shapes/ShapeRenderer';
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

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentPoints, setCurrentPoints] = useState<number[]>([]);
  const [previewShape, setPreviewShape] = useState<Partial<Shape> | null>(null);

  const {
    shapes,
    layerOrder,
    selectedIds,
    stagePos,
    stageScale,
    setStagePos,
    setStageScale,
    addShape,
    updateShape,
    setSelectedIds,
    deselectAll,
  } = useCanvasStore();

  const { activeTool, fillColor, strokeColor, strokeWidth, setTool } = useToolStore();

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
    if (!transformerRef.current || !stageRef.current) return;

    const stage = stageRef.current;
    const selectedNodes = selectedIds
      .map((id) => stage.findOne(`#${id}`))
      .filter(Boolean) as Konva.Node[];

    transformerRef.current.nodes(selectedNodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedIds, shapes]);

  // Zoom with scroll wheel
  const handleWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = stageScale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scaleBy = 1.1;
      const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      const clampedScale = Math.max(0.1, Math.min(5, newScale));

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
    [stageScale, stagePos, setStageScale, setStagePos]
  );

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

  // Handle mouse down
  const handleMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (e.evt.button !== 0) return;

      const stage = stageRef.current;
      if (!stage) return;

      const pos = stage.getRelativePointerPosition();
      if (!pos) return;

      const clickedOnEmpty = e.target === e.target.getStage();

      if (activeTool === 'select') {
        if (clickedOnEmpty) {
          deselectAll();
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
    [activeTool, fillColor, strokeColor, strokeWidth, deselectAll, addShape, setSelectedIds, setTool]
  );

  // Handle mouse move
  const handleMouseMove = useCallback(
    (_e: KonvaEventObject<MouseEvent>) => {
      if (!isDrawing || !drawStart || !previewShape) return;

      const stage = stageRef.current;
      if (!stage) return;

      const pos = stage.getRelativePointerPosition();
      if (!pos) return;

      const dx = pos.x - drawStart.x;
      const dy = pos.y - drawStart.y;

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
    [isDrawing, drawStart, previewShape, activeTool, currentPoints]
  );

  // Handle mouse up
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
      addShape(previewShape as Shape);
      setTool('select');
    }

    setPreviewShape(null);
    setDrawStart(null);
    setCurrentPoints([]);
  }, [isDrawing, previewShape, addShape, setTool]);

  // Handle shape click
  const handleShapeClick = useCallback(
    (id: string, e: KonvaEventObject<MouseEvent | TouchEvent>) => {
      e.cancelBubble = true;

      if (activeTool !== 'select') return;

      const evt = e.evt as MouseEvent;
      const isMultiSelect = evt.shiftKey || evt.metaKey;

      if (isMultiSelect) {
        setSelectedIds(
          selectedIds.includes(id)
            ? selectedIds.filter((sid) => sid !== id)
            : [...selectedIds, id]
        );
      } else {
        setSelectedIds([id]);
      }
    },
    [activeTool, selectedIds, setSelectedIds]
  );

  // Get sorted shapes by layer order
  const sortedShapes = layerOrder
    .map((id) => shapes.find((s) => s.id === id))
    .filter((s): s is Shape => s !== undefined && s.visible);

  return (
    <div ref={containerRef} className="w-full h-full bg-canvas overflow-hidden">
      <Stage
        ref={stageRef}
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
        onMouseLeave={handleMouseUp}
      >
        {/* Grid Layer */}
        <Layer listening={false}>
          {/* Grid pattern would go here */}
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
            />
          ))}

          {/* Drawing preview */}
          {isDrawing && previewShape && (
            <PreviewShape shape={previewShape} />
          )}
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
      </Stage>
    </div>
  );
}

// Preview shape component for drawing
function PreviewShape({ shape }: { shape: Partial<Shape> }) {
  const commonProps = {
    opacity: 0.5,
    listening: false,
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
    default:
      return null;
  }
}
