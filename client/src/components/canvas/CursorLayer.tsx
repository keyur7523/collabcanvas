import { Layer } from 'react-konva';
import { RemoteCursor } from './RemoteCursor';
import type { RemoteState } from '@/hooks/useAwareness';

interface Props {
  remoteStates: Map<number, RemoteState>;
}

export function CursorLayer({ remoteStates }: Props) {
  const cursors = Array.from(remoteStates.values()).filter(
    (state) => state.cursor !== null
  );

  return (
    <Layer listening={false} perfectDrawEnabled={false}>
      {cursors.map((state, index) => (
        <RemoteCursor
          key={index}
          x={state.cursor!.x}
          y={state.cursor!.y}
          color={state.user.color}
          name={state.user.name}
        />
      ))}
    </Layer>
  );
}
