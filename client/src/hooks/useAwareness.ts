import { useEffect, useState, useCallback, useRef } from 'react';
import { useCanvasContext } from '@/components/canvas/CanvasProvider';

export interface UserInfo {
  id: string;
  name: string;
  color: string;
  avatar?: string;
}

export interface RemoteState {
  user: UserInfo;
  cursor: { x: number; y: number } | null;
  selection: string[];
}

export function useAwareness(localUser: UserInfo) {
  const { awareness } = useCanvasContext();
  const [remoteStates, setRemoteStates] = useState<Map<number, RemoteState>>(
    new Map()
  );
  const throttleRef = useRef<number | null>(null);

  // Set local user info on mount
  useEffect(() => {
    awareness.setLocalStateField('user', localUser);
    awareness.setLocalStateField('cursor', null);
    awareness.setLocalStateField('selection', []);

    return () => {
      awareness.setLocalState(null);
    };
  }, [awareness, localUser]);

  // Listen for awareness changes
  useEffect(() => {
    const handleChange = () => {
      const states = new Map<number, RemoteState>();
      awareness.getStates().forEach((state, clientId) => {
        if (clientId !== awareness.clientID && state?.user) {
          states.set(clientId, state as RemoteState);
        }
      });
      setRemoteStates(states);
    };

    awareness.on('change', handleChange);
    handleChange(); // Initial sync

    return () => {
      awareness.off('change', handleChange);
    };
  }, [awareness]);

  // Throttled cursor update (60fps = ~16ms, we use 50ms for network)
  const updateCursor = useCallback(
    (x: number, y: number) => {
      if (throttleRef.current) return;

      throttleRef.current = window.setTimeout(() => {
        awareness.setLocalStateField('cursor', { x, y });
        throttleRef.current = null;
      }, 50);
    },
    [awareness]
  );

  const clearCursor = useCallback(() => {
    if (throttleRef.current) {
      clearTimeout(throttleRef.current);
      throttleRef.current = null;
    }
    awareness.setLocalStateField('cursor', null);
  }, [awareness]);

  const updateSelection = useCallback(
    (ids: string[]) => {
      awareness.setLocalStateField('selection', ids);
    },
    [awareness]
  );

  return {
    remoteStates,
    updateCursor,
    clearCursor,
    updateSelection,
  };
}
