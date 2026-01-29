import { useHotkeys } from 'react-hotkeys-hook';
import { useToolStore } from '@/stores/toolStore';
import { useCanvasStore } from '@/stores/canvasStore';

export function useKeyboardShortcuts() {
  const { setTool } = useToolStore();
  const { undo, redo, deleteSelected, selectAll, deselectAll, bringForward, sendBackward, bringToFront, sendToBack } = useCanvasStore();

  // Tool shortcuts
  useHotkeys('v', () => setTool('select'), { preventDefault: true });
  useHotkeys('r', () => setTool('rectangle'), { preventDefault: true });
  useHotkeys('o', () => setTool('ellipse'), { preventDefault: true });
  useHotkeys('l', () => setTool('line'), { preventDefault: true });
  useHotkeys('a', () => setTool('arrow'), { preventDefault: true });
  useHotkeys('t', () => setTool('text'), { preventDefault: true });
  useHotkeys('p', () => setTool('freehand'), { preventDefault: true });

  // Actions
  useHotkeys('mod+z', (e) => {
    e.preventDefault();
    undo();
  });
  useHotkeys('mod+shift+z', (e) => {
    e.preventDefault();
    redo();
  });
  useHotkeys('delete, backspace', (e) => {
    e.preventDefault();
    deleteSelected();
  });
  useHotkeys('mod+a', (e) => {
    e.preventDefault();
    selectAll();
  });
  useHotkeys('escape', () => {
    deselectAll();
    setTool('select');
  });

  // Layer ordering
  useHotkeys('mod+]', (e) => {
    e.preventDefault();
    bringForward();
  });
  useHotkeys('mod+[', (e) => {
    e.preventDefault();
    sendBackward();
  });
  useHotkeys('mod+shift+]', (e) => {
    e.preventDefault();
    bringToFront();
  });
  useHotkeys('mod+shift+[', (e) => {
    e.preventDefault();
    sendToBack();
  });
}
