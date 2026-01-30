import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import type { Shape } from '@/types/shapes';
import { useAuthStore } from '@/stores/authStore';

/**
 * WebSocket URL Configuration
 * 
 * IMPORTANT: The URL must point to the backend's WebSocket endpoint.
 * 
 * Format: ws://host:port/ws
 * 
 * The y-websocket library will append the room name automatically:
 * ws://host:port/ws/{boardId}?token=xxx
 * 
 * Examples:
 * - Local dev: ws://localhost:8000/ws
 * - Production: wss://api.collabcanvas.com/ws
 */
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

interface CanvasContextType {
  ydoc: Y.Doc;
  yShapes: Y.Map<Shape>;
  yLayers: Y.Array<string>;
  awareness: WebsocketProvider['awareness'];
  isConnected: boolean;
  isSynced: boolean;
  connectionError: string | null;
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
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [selectedIds, setSelectedIdsState] = useState<string[]>([]);
  const { accessToken } = useAuthStore();
  
  // Refs for StrictMode-safe connection handling
  const providerRef = useRef<WebsocketProvider | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  // Track mount count - StrictMode mounts twice, we only cleanup on real unmount
  const mountCountRef = useRef(0);

  const setSelectedIds = useCallback((idsOrFn: string[] | ((prev: string[]) => string[])) => {
    setSelectedIdsState(idsOrFn);
  }, []);

  const { ydoc, provider, yShapes, yLayers, awareness } = useMemo(() => {
    // Reuse existing connection if available (StrictMode re-render)
    if (ydocRef.current && providerRef.current) {
      console.log('[Yjs] Reusing existing connection');
      return {
        ydoc: ydocRef.current,
        provider: providerRef.current,
        yShapes: ydocRef.current.getMap<Shape>('shapes'),
        yLayers: ydocRef.current.getArray<string>('layers'),
        awareness: providerRef.current.awareness,
      };
    }
    
    const ydoc = new Y.Doc();
    
    console.log('[Yjs] Creating WebSocket provider:', {
      wsUrl: WS_URL,
      boardId,
      hasToken: !!accessToken,
    });

    const provider = new WebsocketProvider(WS_URL, boardId, ydoc, {
      params: accessToken ? { token: accessToken } : {},
      connect: true,
    });
    
    // Store in refs
    ydocRef.current = ydoc;
    providerRef.current = provider;

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
      
      // Clear error on successful connection
      if (status === 'connected') {
        setConnectionError(null);
      }
    };

    const handleSync = (synced: boolean) => {
      console.log('[Yjs] Sync status:', synced);
      setIsSynced(synced);
    };

    const handleConnectionError = (event: Event | { message?: string }) => {
      console.error('[Yjs] Connection error:', event);
      const message = (event as { message?: string })?.message || 'WebSocket connection failed';
      setConnectionError(message);
      setIsConnected(false);
    };

    const handleConnectionClose = (event: CloseEvent | null) => {
      console.log('[Yjs] Connection closed:', event);
      setIsConnected(false);
      
      // Handle specific close codes
      const code = event?.code;
      if (code === 1008) {
        setConnectionError('Authentication failed. Please log in again.');
      } else if (code === 1011) {
        setConnectionError('Server error. Please try again later.');
      }
    };

    provider.on('status', handleStatus);
    provider.on('sync', handleSync);
    provider.on('connection-error', handleConnectionError);
    provider.on('connection-close', handleConnectionClose);

    // Log connection attempt
    console.log('[Yjs] Connecting to:', WS_URL, 'room:', boardId);

    return () => {
      provider.off('status', handleStatus);
      provider.off('sync', handleSync);
      provider.off('connection-error', handleConnectionError);
      provider.off('connection-close', handleConnectionClose);
    };
  }, [provider, ydoc, boardId]);
  
  // Handle mount/unmount with StrictMode awareness
  useEffect(() => {
    mountCountRef.current += 1;
    console.log('[Yjs] Mount count:', mountCountRef.current);
    
    return () => {
      // In StrictMode, first unmount is fake (count goes 1 -> unmount -> 2)
      // Only cleanup when we're sure it's a real unmount
      // We use setTimeout to check if component remounts
      const currentMountCount = mountCountRef.current;
      
      setTimeout(() => {
        // If mount count hasn't increased, it's a real unmount
        if (mountCountRef.current === currentMountCount) {
          console.log('[Yjs] Real unmount - cleaning up');
          if (providerRef.current) {
            providerRef.current.disconnect();
            providerRef.current.destroy();
            providerRef.current = null;
          }
          if (ydocRef.current) {
            ydocRef.current.destroy();
            ydocRef.current = null;
          }
          mountCountRef.current = 0;
        } else {
          console.log('[Yjs] StrictMode re-mount detected - keeping connection');
        }
      }, 100);
    };
  }, []);

  const value = useMemo(
    () => ({
      ydoc,
      yShapes,
      yLayers,
      awareness,
      isConnected,
      isSynced,
      connectionError,
      selectedIds,
      setSelectedIds,
    }),
    [ydoc, yShapes, yLayers, awareness, isConnected, isSynced, connectionError, selectedIds, setSelectedIds]
  );

  return (
    <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>
  );
}