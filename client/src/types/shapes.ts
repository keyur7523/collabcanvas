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
  points: number[]; // [x1, y1, x2, y2]
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
  points: number[]; // [x1, y1, x2, y2, ...]
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

// Default shape properties
export const DEFAULT_SHAPE_PROPS = {
  rotation: 0,
  fill: '#6366f1',
  fillOpacity: 1,
  stroke: '#4f46e5',
  strokeWidth: 2,
  strokeOpacity: 1,
  locked: false,
  visible: true,
} as const;
