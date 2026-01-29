import { create } from 'zustand';

export type Tool =
  | 'select'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'text'
  | 'freehand'
  | 'star'
  | 'polygon';

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
