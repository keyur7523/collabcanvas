# Phase 2: Core Canvas (Days 4-6)

## Goal
Full shape toolkit + properties panel + layer management.

## Deliverable
Complete local canvas editor with all tools.

---

## Tasks

### 2.1 Shape Type Definitions

**src/types/shapes.ts**
```typescript
export type ShapeType = 
  | 'rectangle' 
  | 'ellipse' 
  | 'line' 
  | 'arrow' 
  | 'text' 
  | 'freehand' 
  | 'star' 
  | 'polygon';

export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  rotation: number;
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  strokeOpacity: number;
  locked: boolean;
  visible: boolean;
  groupId?: string;
}

export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  width: number;
  height: number;
  cornerRadius: number;
}

export interface EllipseShape extends BaseShape {
  type: 'ellipse';
  radiusX: number;
  radiusY: number;
}

export interface LineShape extends BaseShape {
  type: 'line';
  points: number[];  // [x1, y1, x2, y2]
}

export interface ArrowShape extends BaseShape {
  type: 'arrow';
  points: number[];
  pointerLength: number;
  pointerWidth: number;
}

export interface TextShape extends BaseShape {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  width: number;
}

export interface FreehandShape extends BaseShape {
  type: 'freehand';
  points: number[];  // [x1, y1, x2, y2, ...]
  tension: number;
}

export interface StarShape extends BaseShape {
  type: 'star';
  numPoints: number;
  innerRadius: number;
  outerRadius: number;
}

export interface PolygonShape extends BaseShape {
  type: 'polygon';
  sides: number;
  radius: number;
}

export type Shape = 
  | RectangleShape 
  | EllipseShape 
  | LineShape 
  | ArrowShape 
  | TextShape 
  | FreehandShape 
  | StarShape 
  | PolygonShape;
```

### 2.2 Shape Renderer Component

**src/components/canvas/shapes/ShapeRenderer.tsx**
```typescript
import { Shape } from '@/types/shapes';
import { Rectangle } from './Rectangle';
import { Ellipse } from './Ellipse';
import { Line } from './Line';
import { Arrow } from './Arrow';
import { Text } from './Text';
import { Freehand } from './Freehand';
import { Star } from './Star';
import { Polygon } from './Polygon';

interface Props {
  shape: Shape;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<Shape>) => void;
}

export function ShapeRenderer({ shape, isSelected, onSelect, onChange }: Props) {
  const props = {
    ...shape,
    draggable: !shape.locked,
    onClick: onSelect,
    onDragEnd: (e) => onChange({ x: e.target.x(), y: e.target.y() }),
  };

  switch (shape.type) {
    case 'rectangle': return <Rectangle {...props} />;
    case 'ellipse': return <Ellipse {...props} />;
    case 'line': return <Line {...props} />;
    case 'arrow': return <Arrow {...props} />;
    case 'text': return <Text {...props} />;
    case 'freehand': return <Freehand {...props} />;
    case 'star': return <Star {...props} />;
    case 'polygon': return <Polygon {...props} />;
  }
}
```

### 2.3 Implement Each Shape

**Ellipse.tsx**
```typescript
import { Ellipse as KonvaEllipse } from 'react-konva';

export function Ellipse({ radiusX, radiusY, ...props }) {
  return <KonvaEllipse radiusX={radiusX} radiusY={radiusY} {...props} />;
}
```

**Line.tsx**
```typescript
import { Line as KonvaLine } from 'react-konva';

export function Line({ points, ...props }) {
  return <KonvaLine points={points} {...props} />;
}
```

**Arrow.tsx**
```typescript
import { Arrow as KonvaArrow } from 'react-konva';

export function Arrow({ points, pointerLength, pointerWidth, ...props }) {
  return (
    <KonvaArrow 
      points={points} 
      pointerLength={pointerLength || 10}
      pointerWidth={pointerWidth || 10}
      {...props} 
    />
  );
}
```

**Text.tsx** (with double-click to edit)
```typescript
import { Text as KonvaText } from 'react-konva';
import { useState, useRef } from 'react';

export function Text({ text, fontSize, fontFamily, onDoubleClick, ...props }) {
  return (
    <KonvaText
      text={text}
      fontSize={fontSize}
      fontFamily={fontFamily}
      onDblClick={onDoubleClick}
      {...props}
    />
  );
}

// Handle editing with HTML textarea overlay
```

**Freehand.tsx** (smooth line)
```typescript
import { Line } from 'react-konva';

export function Freehand({ points, tension, ...props }) {
  return (
    <Line 
      points={points}
      tension={tension || 0.5}
      lineCap="round"
      lineJoin="round"
      {...props} 
    />
  );
}
```

**Star.tsx**
```typescript
import { Star as KonvaStar } from 'react-konva';

export function Star({ numPoints, innerRadius, outerRadius, ...props }) {
  return (
    <KonvaStar
      numPoints={numPoints}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      {...props}
    />
  );
}
```

**Polygon.tsx**
```typescript
import { RegularPolygon } from 'react-konva';

export function Polygon({ sides, radius, ...props }) {
  return <RegularPolygon sides={sides} radius={radius} {...props} />;
}
```

### 2.4 Tool Store

**src/stores/toolStore.ts**
```typescript
import { create } from 'zustand';

type Tool = 'select' | 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'text' | 'freehand' | 'star' | 'polygon';

interface ToolState {
  activeTool: Tool;
  setTool: (tool: Tool) => void;
  
  // Shape defaults
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  setFillColor: (color: string) => void;
  setStrokeColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
}

export const useToolStore = create<ToolState>((set) => ({
  activeTool: 'select',
  setTool: (tool) => set({ activeTool: tool }),
  
  fillColor: '#6366f1',
  strokeColor: '#4f46e5',
  strokeWidth: 2,
  setFillColor: (color) => set({ fillColor: color }),
  setStrokeColor: (color) => set({ strokeColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
}));
```

### 2.5 Toolbar Component

**src/components/toolbar/Toolbar.tsx**
```typescript
import { 
  MousePointer2, Square, Circle, Minus, MoveRight, 
  Type, Pencil, Star, Hexagon 
} from 'lucide-react';
import { useToolStore } from '@/stores/toolStore';
import { ToolButton } from './ToolButton';

const tools = [
  { id: 'select', icon: MousePointer2, shortcut: 'V' },
  { id: 'rectangle', icon: Square, shortcut: 'R' },
  { id: 'ellipse', icon: Circle, shortcut: 'O' },
  { id: 'line', icon: Minus, shortcut: 'L' },
  { id: 'arrow', icon: MoveRight, shortcut: 'A' },
  { id: 'text', icon: Type, shortcut: 'T' },
  { id: 'freehand', icon: Pencil, shortcut: 'P' },
  { id: 'star', icon: Star, shortcut: null },
  { id: 'polygon', icon: Hexagon, shortcut: null },
] as const;

export function Toolbar() {
  const { activeTool, setTool } = useToolStore();
  
  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 bg-surface border border-border rounded-lg p-1 flex flex-col gap-1">
      {tools.map(({ id, icon: Icon, shortcut }) => (
        <ToolButton
          key={id}
          icon={<Icon size={18} />}
          isActive={activeTool === id}
          onClick={() => setTool(id)}
          tooltip={`${id} ${shortcut ? `(${shortcut})` : ''}`}
        />
      ))}
    </div>
  );
}
```

### 2.6 Keyboard Shortcuts

**src/hooks/useKeyboardShortcuts.ts**
```typescript
import { useHotkeys } from 'react-hotkeys-hook';
import { useToolStore } from '@/stores/toolStore';
import { useCanvasStore } from '@/stores/canvasStore';

export function useKeyboardShortcuts() {
  const { setTool } = useToolStore();
  const { undo, redo, deleteSelected, selectAll, deselectAll } = useCanvasStore();
  
  // Tool shortcuts
  useHotkeys('v', () => setTool('select'));
  useHotkeys('r', () => setTool('rectangle'));
  useHotkeys('o', () => setTool('ellipse'));
  useHotkeys('l', () => setTool('line'));
  useHotkeys('a', () => setTool('arrow'));
  useHotkeys('t', () => setTool('text'));
  useHotkeys('p', () => setTool('freehand'));
  
  // Actions
  useHotkeys('mod+z', () => undo());
  useHotkeys('mod+shift+z', () => redo());
  useHotkeys('delete, backspace', () => deleteSelected());
  useHotkeys('mod+a', (e) => { e.preventDefault(); selectAll(); });
  useHotkeys('escape', () => deselectAll());
  useHotkeys('mod+d', (e) => { e.preventDefault(); duplicateSelected(); });
  useHotkeys('mod+g', (e) => { e.preventDefault(); groupSelected(); });
  useHotkeys('mod+shift+g', (e) => { e.preventDefault(); ungroupSelected(); });
  
  // Layer ordering
  useHotkeys('mod+]', () => bringForward());
  useHotkeys('mod+[', () => sendBackward());
  useHotkeys('mod+shift+]', () => bringToFront());
  useHotkeys('mod+shift+[', () => sendToBack());
}
```

### 2.7 Properties Panel

**src/components/panels/PropertiesPanel.tsx**
```typescript
import { useCanvasStore } from '@/stores/canvasStore';
import { Input } from '@/components/ui/Input';
import { ColorPicker } from './ColorPicker';

export function PropertiesPanel() {
  const { selectedIds, shapes, updateShape } = useCanvasStore();
  
  if (selectedIds.length === 0) {
    return (
      <div className="p-4 text-text-secondary">
        Select a shape to edit properties
      </div>
    );
  }
  
  if (selectedIds.length > 1) {
    return (
      <div className="p-4">
        <p className="text-text-secondary mb-4">
          {selectedIds.length} objects selected
        </p>
        {/* Show common properties only */}
      </div>
    );
  }
  
  const shape = shapes.find(s => s.id === selectedIds[0]);
  if (!shape) return null;
  
  return (
    <div className="p-4 space-y-4">
      <Section title="Position">
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="X"
            type="number"
            value={shape.x}
            onChange={(e) => updateShape(shape.id, { x: +e.target.value })}
          />
          <Input
            label="Y"
            type="number"
            value={shape.y}
            onChange={(e) => updateShape(shape.id, { y: +e.target.value })}
          />
        </div>
      </Section>
      
      <Section title="Size">
        <div className="grid grid-cols-2 gap-2">
          <Input label="W" type="number" value={shape.width} onChange={...} />
          <Input label="H" type="number" value={shape.height} onChange={...} />
        </div>
      </Section>
      
      <Section title="Appearance">
        <ColorPicker
          label="Fill"
          color={shape.fill}
          opacity={shape.fillOpacity}
          onChange={(fill, fillOpacity) => updateShape(shape.id, { fill, fillOpacity })}
        />
        <ColorPicker
          label="Stroke"
          color={shape.stroke}
          opacity={shape.strokeOpacity}
          onChange={(stroke, strokeOpacity) => updateShape(shape.id, { stroke, strokeOpacity })}
        />
        <Input
          label="Stroke Width"
          type="number"
          value={shape.strokeWidth}
          onChange={(e) => updateShape(shape.id, { strokeWidth: +e.target.value })}
        />
      </Section>
      
      <Section title="Rotation">
        <Input
          type="number"
          value={shape.rotation}
          onChange={(e) => updateShape(shape.id, { rotation: +e.target.value })}
          suffix="°"
        />
      </Section>
    </div>
  );
}
```

### 2.8 Layers Panel

**src/components/panels/LayersPanel.tsx**
```typescript
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Eye, EyeOff, Lock, Unlock } from 'lucide-react';

export function LayersPanel() {
  const { shapes, layerOrder, reorderLayers, updateShape, selectedIds, setSelectedIds } = useCanvasStore();
  
  // layerOrder is array of shape IDs from bottom to top
  // Reverse for display (top layer first)
  const displayOrder = [...layerOrder].reverse();
  
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const newOrder = [...displayOrder];
    const [removed] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, removed);
    
    reorderLayers(newOrder.reverse());
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border">
        <h3 className="font-medium">Layers</h3>
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="layers">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex-1 overflow-auto"
            >
              {displayOrder.map((id, index) => {
                const shape = shapes.find(s => s.id === id);
                if (!shape) return null;
                
                return (
                  <Draggable key={id} draggableId={id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 border-b border-border-muted cursor-pointer',
                          selectedIds.includes(id) && 'bg-accent-muted',
                          snapshot.isDragging && 'bg-surface-hover'
                        )}
                        onClick={() => setSelectedIds([id])}
                      >
                        <ShapeIcon type={shape.type} size={16} />
                        <span className="flex-1 truncate text-sm">
                          {shape.type} {shape.id.slice(0, 4)}
                        </span>
                        <button onClick={(e) => {
                          e.stopPropagation();
                          updateShape(id, { visible: !shape.visible });
                        }}>
                          {shape.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button onClick={(e) => {
                          e.stopPropagation();
                          updateShape(id, { locked: !shape.locked });
                        }}>
                          {shape.locked ? <Lock size={14} /> : <Unlock size={14} />}
                        </button>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
```

### 2.9 Canvas Store with Layer Management

**src/stores/canvasStore.ts**
```typescript
import { create } from 'zustand';
import { Shape } from '@/types/shapes';

interface CanvasState {
  shapes: Shape[];
  layerOrder: string[];  // Shape IDs bottom to top
  selectedIds: string[];
  
  // CRUD
  addShape: (shape: Shape) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
  deleteSelected: () => void;
  
  // Selection
  setSelectedIds: (ids: string[]) => void;
  selectAll: () => void;
  deselectAll: () => void;
  
  // Layer ordering
  reorderLayers: (newOrder: string[]) => void;
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  
  // Grouping
  groupSelected: () => void;
  ungroupSelected: () => void;
  
  // History (local, before Yjs)
  history: Shape[][];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  shapes: [],
  layerOrder: [],
  selectedIds: [],
  history: [[]],
  historyIndex: 0,
  
  addShape: (shape) => {
    set((state) => ({
      shapes: [...state.shapes, shape],
      layerOrder: [...state.layerOrder, shape.id],
    }));
    get().pushHistory();
  },
  
  // ... implement all methods
  
  bringForward: () => {
    const { selectedIds, layerOrder } = get();
    if (selectedIds.length !== 1) return;
    
    const id = selectedIds[0];
    const index = layerOrder.indexOf(id);
    if (index === layerOrder.length - 1) return;  // Already at top
    
    const newOrder = [...layerOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    set({ layerOrder: newOrder });
  },
  
  // ... etc
}));
```

---

## Checklist

- [ ] All shape types defined with TypeScript interfaces
- [ ] ShapeRenderer component switches on shape type
- [ ] Each shape component (Rectangle, Ellipse, Line, Arrow, Text, Freehand, Star, Polygon)
- [ ] Tool store with active tool + default colors
- [ ] Toolbar with all tool buttons
- [ ] Keyboard shortcuts for all tools
- [ ] Properties panel with position, size, appearance
- [ ] Color picker component
- [ ] Layers panel with drag-drop reorder
- [ ] Visibility toggle (eye icon)
- [ ] Lock toggle
- [ ] Layer ordering shortcuts (Cmd+], etc.)
- [ ] Grouping works (visual only, no nested Konva groups needed)
- [ ] Local undo/redo (before Yjs integration)

## Test It

1. All tools create their respective shapes
2. Properties panel updates shape in real-time
3. Layers panel shows all shapes
4. Drag layers to reorder
5. Cmd+] brings forward, Cmd+[ sends backward
6. Cmd+Z undoes, Cmd+Shift+Z redoes
7. Eye icon hides shape
8. Lock icon prevents dragging
