import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import type { Shape } from '@/types/shapes';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:1234';

export interface CollabSession {
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  yShapes: Y.Map<Shape>;
  yLayers: Y.Array<string>;
  awareness: WebsocketProvider['awareness'];
  destroy: () => void;
}

export function createCollabSession(boardId: string): CollabSession {
  const ydoc = new Y.Doc();

  const provider = new WebsocketProvider(WS_URL, boardId, ydoc);

  const yShapes = ydoc.getMap<Shape>('shapes');
  const yLayers = ydoc.getArray<string>('layers');
  const awareness = provider.awareness;

  const destroy = () => {
    provider.disconnect();
    ydoc.destroy();
  };

  return { ydoc, provider, yShapes, yLayers, awareness, destroy };
}
