# Phase 3: Real-Time Collaboration (Days 7-10)

## Goal
Multi-user sync with Yjs CRDT + live cursors.

## Deliverable
Two browser windows can collaboratively edit the same board in real-time.

---

## Overview

This is the most complex phase. We're replacing local state with Yjs shared state.

**Data Flow:**
1. User creates shape → Update Y.Map
2. Yjs encodes change as binary delta
3. y-websocket sends to server
4. pycrdt-websocket broadcasts to other clients
5. Other clients receive update → Yjs merges automatically
6. React re-renders from Yjs state

---

## Backend Tasks

### 3.1 Install pycrdt Dependencies

```bash
cd server
pip install pycrdt pycrdt-websocket websockets aiofiles
pip freeze > requirements.txt
```

### 3.2 Simple Yjs WebSocket Server

For pycrdt-websocket, the simplest approach is running it alongside FastAPI.

**server/collab.py**
```python
import asyncio
from pycrdt_websocket import WebsocketServer

async def start_websocket_server():
    async with WebsocketServer(host="0.0.0.0", port=1234) as server:
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(start_websocket_server())
```

Run both servers:
- FastAPI on port 8000 (REST API)
- pycrdt-websocket on port 1234 (Yjs sync)

### 3.3 Integrated Approach (Single Server)

**server/main.py**
```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pycrdt_websocket import WebsocketServer
from pycrdt import Doc
import asyncio

app = FastAPI()

# Store for Yjs rooms
rooms: dict[str, Doc] = {}

class YjsWebsocketHandler:
    def __init__(self):
        self.websocket_server = WebsocketServer()
    
    async def handle(self, websocket: WebSocket, board_id: str):
        await self.websocket_server.serve(websocket)

yjs_handler = YjsWebsocketHandler()

@app.websocket("/yjs/{board_id}")
async def yjs_websocket(websocket: WebSocket, board_id: str):
    await websocket.accept()
    try:
        await yjs_handler.handle(websocket, board_id)
    except WebSocketDisconnect:
        pass
```

---

## Frontend Tasks

### 3.4 Yjs Setup

**src/services/yjs.ts**
```typescript
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Shape } from '@/types/shapes';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:1234';

export function createCollabSession(boardId: string) {
  const ydoc = new Y.Doc();
  
  const provider = new WebsocketProvider(WS_URL, boardId, ydoc);
  
  const yShapes = ydoc.getMap<Shape>('shapes');
  const yLayers = ydoc.getArray<string>('layers');
  const awareness = provider.awareness;
  
  return { ydoc, provider, yShapes, yLayers, awareness };
}
```

### 3.5 Canvas Provider with Yjs Context

**src/components/canvas/CanvasProvider.tsx**
```typescript
import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Shape } from '@/types/shapes';

interface CanvasContextType {
  ydoc: Y.Doc;
  yShapes: Y.Map<Shape>;
  yLayers: Y.Array<string>;
  awareness: WebsocketProvider['awareness'];
  isConnected: boolean;
  isSynced: boolean;
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
  
  const { ydoc, provider, yShapes, yLayers, awareness } = useMemo(() => {
    const ydoc = new Y.Doc();
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:1234';
    
    const provider = new WebsocketProvider(wsUrl, boardId, ydoc);
    
    return {
      ydoc,
      provider,
      yShapes: ydoc.getMap<Shape>('shapes'),
      yLayers: ydoc.getArray<string>('layers'),
      awareness: provider.awareness,
    };
  }, [boardId]);
  
  useEffect(() => {
    provider.on('status', ({ status }: { status: string }) => {
      setIsConnected(status === 'connected');
    });
    
    provider.on('sync', (synced: boolean) => {
      setIsSynced(synced);
    });
    
    return () => {
      provider.disconnect();
      ydoc.destroy();
    };
  }, [provider, ydoc]);
  
  return (
    <CanvasContext.Provider value={{ ydoc, yShapes, yLayers, awareness, isConnected, isSynced }}>
      {children}
    </CanvasContext.Provider>
  );
}
```

### 3.6 useShapes Hook (Yjs-backed)

**src/hooks/useShapes.ts**
```typescript
import { useEffect, useState, useCallback } from 'react';
import { useCanvasContext } from '@/components/canvas/CanvasProvider';
import { Shape } from '@/types/shapes';

export function useShapes() {
  const { yShapes, yLayers } = useCanvasContext();
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [layerOrder, setLayerOrder] = useState<string[]>([]);
  
  useEffect(() => {
    const syncShapes = () => {
      const arr: Shape[] = [];
      yShapes.forEach((shape, id) => {
        arr.push({ ...shape, id });
      });
      setShapes(arr);
    };
    
    const syncLayers = () => {
      setLayerOrder(yLayers.toArray());
    };
    
    syncShapes();
    syncLayers();
    
    yShapes.observe(syncShapes);
    yLayers.observe(syncLayers);
    
    return () => {
      yShapes.unobserve(syncShapes);
      yLayers.unobserve(syncLayers);
    };
  }, [yShapes, yLayers]);
  
  const addShape = useCallback((shape: Shape) => {
    yShapes.set(shape.id, shape);
    yLayers.push([shape.id]);
  }, [yShapes, yLayers]);
  
  const updateShape = useCallback((id: string, updates: Partial<Shape>) => {
    const existing = yShapes.get(id);
    if (existing) {
      yShapes.set(id, { ...existing, ...updates });
    }
  }, [yShapes]);
  
  const deleteShape = useCallback((id: string) => {
    yShapes.delete(id);
    const idx = yLayers.toArray().indexOf(id);
    if (idx !== -1) yLayers.delete(idx, 1);
  }, [yShapes, yLayers]);
  
  return { shapes, layerOrder, addShape, updateShape, deleteShape };
}
```

### 3.7 useUndoRedo Hook

**src/hooks/useUndoRedo.ts**
```typescript
import { useMemo } from 'react';
import * as Y from 'yjs';
import { useCanvasContext } from '@/components/canvas/CanvasProvider';

export function useUndoRedo() {
  const { yShapes, yLayers } = useCanvasContext();
  
  const undoManager = useMemo(() => {
    return new Y.UndoManager([yShapes, yLayers], {
      captureTimeout: 500,
    });
  }, [yShapes, yLayers]);
  
  return {
    undo: () => undoManager.undo(),
    redo: () => undoManager.redo(),
    canUndo: () => undoManager.canUndo(),
    canRedo: () => undoManager.canRedo(),
  };
}
```

### 3.8 useAwareness Hook (Cursors)

**src/hooks/useAwareness.ts**
```typescript
import { useEffect, useState, useCallback } from 'react';
import { useCanvasContext } from '@/components/canvas/CanvasProvider';

interface UserInfo {
  id: string;
  name: string;
  color: string;
}

interface RemoteState {
  user: UserInfo;
  cursor: { x: number; y: number } | null;
  selection: string[];
}

export function useAwareness(localUser: UserInfo) {
  const { awareness } = useCanvasContext();
  const [remoteStates, setRemoteStates] = useState<Map<number, RemoteState>>(new Map());
  
  useEffect(() => {
    awareness.setLocalStateField('user', localUser);
    return () => awareness.setLocalState(null);
  }, [awareness, localUser]);
  
  useEffect(() => {
    const onChange = () => {
      const states = new Map<number, RemoteState>();
      awareness.getStates().forEach((state, clientId) => {
        if (clientId !== awareness.clientID && state?.user) {
          states.set(clientId, state as RemoteState);
        }
      });
      setRemoteStates(states);
    };
    
    awareness.on('change', onChange);
    onChange();
    
    return () => awareness.off('change', onChange);
  }, [awareness]);
  
  const updateCursor = useCallback((x: number, y: number) => {
    awareness.setLocalStateField('cursor', { x, y });
  }, [awareness]);
  
  const clearCursor = useCallback(() => {
    awareness.setLocalStateField('cursor', null);
  }, [awareness]);
  
  const updateSelection = useCallback((ids: string[]) => {
    awareness.setLocalStateField('selection', ids);
  }, [awareness]);
  
  return { remoteStates, updateCursor, clearCursor, updateSelection };
}
```

### 3.9 Remote Cursor Component

**src/components/canvas/RemoteCursor.tsx**
```typescript
import { Group, Path, Text, Rect } from 'react-konva';

const CURSOR_SVG = "M0,0 L0,14 L4,11 L7,18 L10,17 L7,10 L12,10 Z";

interface Props {
  x: number;
  y: number;
  color: string;
  name: string;
}

export function RemoteCursor({ x, y, color, name }: Props) {
  return (
    <Group x={x} y={y}>
      <Path data={CURSOR_SVG} fill={color} stroke="#fff" strokeWidth={1} />
      <Group y={20} x={4}>
        <Rect
          fill={color}
          cornerRadius={3}
          width={name.length * 7 + 10}
          height={18}
        />
        <Text
          text={name}
          fill="#fff"
          fontSize={11}
          fontFamily="Inter"
          x={5}
          y={3}
        />
      </Group>
    </Group>
  );
}
```

### 3.10 Cursor Layer

**src/components/canvas/CursorLayer.tsx**
```typescript
import { Layer } from 'react-konva';
import { RemoteCursor } from './RemoteCursor';
import { useAwareness } from '@/hooks/useAwareness';

interface Props {
  localUser: { id: string; name: string; color: string };
}

export function CursorLayer({ localUser }: Props) {
  const { remoteStates } = useAwareness(localUser);
  
  return (
    <Layer listening={false}>
      {Array.from(remoteStates.values())
        .filter(s => s.cursor)
        .map((state, i) => (
          <RemoteCursor
            key={i}
            x={state.cursor!.x}
            y={state.cursor!.y}
            color={state.user.color}
            name={state.user.name}
          />
        ))}
    </Layer>
  );
}
```

### 3.11 Connection Status Indicator

**src/components/ui/ConnectionStatus.tsx**
```typescript
import { useCanvasContext } from '@/components/canvas/CanvasProvider';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export function ConnectionStatus() {
  const { isConnected, isSynced } = useCanvasContext();
  
  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 text-error text-sm">
        <WifiOff size={14} />
        <span>Disconnected</span>
      </div>
    );
  }
  
  if (!isSynced) {
    return (
      <div className="flex items-center gap-2 text-warning text-sm">
        <Loader2 size={14} className="animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2 text-success text-sm">
      <Wifi size={14} />
      <span>Connected</span>
    </div>
  );
}
```

---

## Checklist

- [ ] pycrdt-websocket server running on backend
- [ ] Frontend connects via y-websocket provider
- [ ] CanvasProvider wraps board page with Yjs context
- [ ] useShapes reads from Y.Map and syncs to React state
- [ ] addShape/updateShape/deleteShape write to Yjs
- [ ] Changes sync between two browser windows
- [ ] useUndoRedo uses Y.UndoManager
- [ ] useAwareness broadcasts cursor position
- [ ] Remote cursors render on canvas
- [ ] Connection status indicator works
- [ ] Sync status indicator works

## Test It

1. Start backend: `uvicorn main:app --reload` + `python collab.py`
2. Start frontend: `npm run dev`
3. Open two browser tabs to `/board/test-123`
4. Draw rectangle in tab 1 → appears in tab 2
5. Move cursor in tab 1 → cursor visible in tab 2 with name
6. Select shape in tab 1 → show selection indicator in tab 2
7. Undo in tab 1 → only reverts tab 1's changes
8. Refresh tab 2 → shapes persist
