import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import type { Shape } from '@/types/shapes';

/**
 * Dynamic WebSocket URL - uses wss:// for https:// pages
 */
function getWsUrl(): string {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    const url = new URL(apiUrl);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}/ws`;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

const WS_URL = getWsUrl();

export interface CollabSession {
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  yShapes: Y.Map<Shape>;
  yLayers: Y.Array<string>;
  awareness: WebsocketProvider['awareness'];
  destroy: () => void;
}

export function createCollabSession(boardId: string, token?: string): CollabSession {
  const ydoc = new Y.Doc();

  // Pass JWT token via params for authentication
  const provider = new WebsocketProvider(WS_URL, boardId, ydoc, {
    params: token ? { token } : {},
  });

  const yShapes = ydoc.getMap<Shape>('shapes');
  const yLayers = ydoc.getArray<string>('layers');
  const awareness = provider.awareness;

  const destroy = () => {
    provider.disconnect();
    ydoc.destroy();
  };

  return { ydoc, provider, yShapes, yLayers, awareness, destroy };
}
