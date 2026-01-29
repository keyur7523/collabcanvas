import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import type { Shape } from '@/types/shapes';
import { useAuthStore } from '@/stores/authStore';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:1234';

interface CanvasContextType {
  ydoc: Y.Doc;
  yShapes: Y.Map<Shape>;
  yLayers: Y.Array<string>;
  awareness: WebsocketProvider['awareness'];
  isConnected: boolean;
  isSynced: boolean;
  selectedIds: string[];
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
}

const CanvasContext = createContext<CanvasContextType | null>(null);

export function useCanvasContext() {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error('useCanvasContext must be within CanvasProvider');
  return ctx;
}

interface Props {
  boardId: string;
  children: ReactNode;
}

export function CanvasProvider({ boardId, children }: Props) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [selectedIds, setSelectedIdsState] = useState<string[]>([]);
  const { accessToken } = useAuthStore();

  const setSelectedIds = useCallback((idsOrFn: string[] | ((prev: string[]) => string[])) => {
    setSelectedIdsState(idsOrFn);
  }, []);

  const { ydoc, provider, yShapes, yLayers, awareness } = useMemo(() => {
    const ydoc = new Y.Doc();
    // Pass JWT token via params option so URL is constructed correctly
    // ws://host/ws/roomId?token=xxx (not ws://host/ws?token=xxx/roomId)
    const provider = new WebsocketProvider(WS_URL, boardId, ydoc, {
      params: accessToken ? { token: accessToken } : {},
    });

    return {
      ydoc,
      provider,
      yShapes: ydoc.getMap<Shape>('shapes'),
      yLayers: ydoc.getArray<string>('layers'),
      awareness: provider.awareness,
    };
  }, [boardId, accessToken]);

  useEffect(() => {
    const handleStatus = ({ status }: { status: string }) => {
      console.log('[Yjs] Connection status:', status);
      setIsConnected(status === 'connected');
    };

    const handleSync = (synced: boolean) => {
      console.log('[Yjs] Sync status:', synced);
      setIsSynced(synced);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleConnectionError = (event: any) => {
      console.error('[Yjs] Connection error:', event);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleConnectionClose = (event: any) => {
      console.log('[Yjs] Connection closed:', event);
    };

    provider.on('status', handleStatus);
    provider.on('sync', handleSync);
    provider.on('connection-error', handleConnectionError);
    provider.on('connection-close', handleConnectionClose);

    // Log initial connection attempt
    console.log('[Yjs] Connecting to:', WS_URL, 'room:', boardId);

    return () => {
      provider.off('status', handleStatus);
      provider.off('sync', handleSync);
      provider.off('connection-error', handleConnectionError);
      provider.off('connection-close', handleConnectionClose);
      provider.disconnect();
      ydoc.destroy();
    };
  }, [provider, ydoc, boardId]);

  const value = useMemo(
    () => ({
      ydoc,
      yShapes,
      yLayers,
      awareness,
      isConnected,
      isSynced,
      selectedIds,
      setSelectedIds,
    }),
    [ydoc, yShapes, yLayers, awareness, isConnected, isSynced, selectedIds, setSelectedIds]
  );

  return (
    <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>
  );
}
