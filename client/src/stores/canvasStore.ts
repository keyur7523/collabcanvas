import { create } from 'zustand';
import type { Shape } from '@/types/shapes';

interface CanvasState {
  shapes: Shape[];
  layerOrder: string[]; // Shape IDs bottom to top
  selectedIds: string[];

  // Viewport
  stagePos: { x: number; y: number };
  stageScale: number;
  setStagePos: (pos: { x: number; y: number }) => void;
  setStageScale: (scale: number) => void;

  // CRUD
  addShape: (shape: Shape) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
  deleteSelected: () => void;
  setShapes: (shapes: Shape[]) => void;

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

  // History (local, before Yjs)
  history: { shapes: Shape[]; layerOrder: string[] }[];
  historyIndex: number;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  shapes: [],
  layerOrder: [],
  selectedIds: [],

  stagePos: { x: 0, y: 0 },
  stageScale: 1,
  setStagePos: (pos) => set({ stagePos: pos }),
  setStageScale: (scale) => set({ stageScale: scale }),

  history: [{ shapes: [], layerOrder: [] }],
  historyIndex: 0,

  pushHistory: () => {
    const { shapes, layerOrder, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      shapes: JSON.parse(JSON.stringify(shapes)),
      layerOrder: [...layerOrder]
    });
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  addShape: (shape) => {
    set((state) => ({
      shapes: [...state.shapes, shape],
      layerOrder: [...state.layerOrder, shape.id],
    }));
    get().pushHistory();
  },

  updateShape: (id, updates) => {
    set((state) => ({
      shapes: state.shapes.map((s) =>
        s.id === id ? ({ ...s, ...updates } as Shape) : s
      ),
    }));
  },

  deleteShape: (id) => {
    set((state) => ({
      shapes: state.shapes.filter((s) => s.id !== id),
      layerOrder: state.layerOrder.filter((lid) => lid !== id),
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
    }));
    get().pushHistory();
  },

  deleteSelected: () => {
    const { selectedIds } = get();
    set((state) => ({
      shapes: state.shapes.filter((s) => !selectedIds.includes(s.id)),
      layerOrder: state.layerOrder.filter((id) => !selectedIds.includes(id)),
      selectedIds: [],
    }));
    get().pushHistory();
  },

  setShapes: (shapes) => set({ shapes }),

  setSelectedIds: (ids) => set({ selectedIds: ids }),

  selectAll: () => {
    set((state) => ({
      selectedIds: state.shapes.filter((s) => !s.locked).map((s) => s.id),
    }));
  },

  deselectAll: () => set({ selectedIds: [] }),

  reorderLayers: (newOrder) => {
    set({ layerOrder: newOrder });
    get().pushHistory();
  },

  bringForward: () => {
    const { selectedIds, layerOrder } = get();
    if (selectedIds.length !== 1) return;

    const id = selectedIds[0];
    const index = layerOrder.indexOf(id);
    if (index === layerOrder.length - 1) return;

    const newOrder = [...layerOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    set({ layerOrder: newOrder });
  },

  sendBackward: () => {
    const { selectedIds, layerOrder } = get();
    if (selectedIds.length !== 1) return;

    const id = selectedIds[0];
    const index = layerOrder.indexOf(id);
    if (index === 0) return;

    const newOrder = [...layerOrder];
    [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    set({ layerOrder: newOrder });
  },

  bringToFront: () => {
    const { selectedIds, layerOrder } = get();
    if (selectedIds.length !== 1) return;

    const id = selectedIds[0];
    const newOrder = layerOrder.filter((lid) => lid !== id);
    newOrder.push(id);
    set({ layerOrder: newOrder });
  },

  sendToBack: () => {
    const { selectedIds, layerOrder } = get();
    if (selectedIds.length !== 1) return;

    const id = selectedIds[0];
    const newOrder = layerOrder.filter((lid) => lid !== id);
    newOrder.unshift(id);
    set({ layerOrder: newOrder });
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const { shapes, layerOrder } = history[newIndex];
      set({
        shapes: JSON.parse(JSON.stringify(shapes)),
        layerOrder: [...layerOrder],
        historyIndex: newIndex
      });
    }
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const { shapes, layerOrder } = history[newIndex];
      set({
        shapes: JSON.parse(JSON.stringify(shapes)),
        layerOrder: [...layerOrder],
        historyIndex: newIndex
      });
    }
  },
}));
