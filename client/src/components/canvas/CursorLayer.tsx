import { Layer } from 'react-konva';
import { RemoteCursor } from './RemoteCursor';
import type { RemoteState } from '@/hooks/useAwareness';

interface Props {
  remoteStates: Map<number, RemoteState>;
}

export function CursorLayer({ remoteStates }: Props) {
  // Convert Map entries to array, filtering for those with cursors
  // Use the Map key (clientId) as a stable React key
  const cursorsWithIds = Array.from(remoteStates.entries())
    .filter(([, state]) => state.cursor !== null)
    .map(([clientId, state]) => ({
      clientId,
      state,
    }));

  return (
    <Layer listening={false} perfectDrawEnabled={false}>
      {cursorsWithIds.map(({ clientId, state }) => (
        <RemoteCursor
          key={clientId}
          x={state.cursor!.x}
          y={state.cursor!.y}
          color={state.user.color}
          name={state.user.name}
        />
      ))}
    </Layer>
  );
}