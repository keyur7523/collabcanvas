import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SnapState {
  snapEnabled: boolean;
  gridSize: number;
  toggleSnap: () => void;
  setSnapEnabled: (enabled: boolean) => void;
  setGridSize: (size: number) => void;
}

export const useSnapStore = create<SnapState>()(
  persist(
    (set) => ({
      snapEnabled: false,
      gridSize: 20, // Match grid background spacing
      toggleSnap: () => set((state) => ({ snapEnabled: !state.snapEnabled })),
      setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),
      setGridSize: (size) => set({ gridSize: size }),
    }),
    {
      name: 'collabcanvas-snap-settings',
    }
  )
);

/**
 * Utility function to snap a value to the nearest grid point
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap a position (x, y) to the grid
 */
export function snapPosition(
  x: number,
  y: number,
  gridSize: number
): { x: number; y: number } {
  return {
    x: snapToGrid(x, gridSize),
    y: snapToGrid(y, gridSize),
  };
}
