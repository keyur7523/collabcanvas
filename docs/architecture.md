# Architecture Documentation

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                         │
│  │ User A  │  │ User B  │  │ User C  │                         │
│  └────┬────┘  └────┬────┘  └────┬────┘                         │
│       │            │            │                               │
│  ┌────▼────────────▼────────────▼────┐                         │
│  │     React + Konva + Yjs + Zustand │                         │
│  │         (Vite + TypeScript)       │                         │
│  └────────────────┬──────────────────┘                         │
└───────────────────┼─────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │ WebSocket    REST API │
        │ (Yjs Sync)   (CRUD)   │
        ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SERVER                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   FastAPI Application                     │  │
│  ├────────────┬─────────────┬───────────────────────────────┤  │
│  │ Auth       │ Boards      │ Collaboration                 │  │
│  │ (OAuth)    │ (CRUD)      │ (pycrdt-websocket)            │  │
│  └─────┬──────┴──────┬──────┴──────┬────────────────────────┘  │
│        │             │             │                            │
│  ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐                     │
│  │PostgreSQL │ │  Redis    │ │  File     │                     │
│  │(Users,    │ │(Pub/Sub,  │ │ Store     │                     │
│  │ Boards)   │ │ Presence) │ │(Yjs State)│                     │
│  └───────────┘ └───────────┘ └───────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

## Real-Time Collaboration Flow

```
User A draws rectangle
        │
        ▼
┌───────────────────┐
│ Konva Stage Event │
│ (onDragEnd, etc)  │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Update Y.Map      │
│ yShapes.set(id,   │
│   shapeData)      │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Yjs Encodes Delta │
│ (Binary Update)   │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐     ┌───────────────────┐
│ WebSocket Send    │────▶│ pycrdt Server     │
│ (y-websocket)     │     │ (Room Manager)    │
└───────────────────┘     └────────┬──────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
              ┌──────────┐  ┌──────────┐  ┌──────────┐
              │ User B   │  │ User C   │  │ Persist  │
              │ (Merge)  │  │ (Merge)  │  │ to DB    │
              └──────────┘  └──────────┘  └──────────┘
```

## Yjs Document Structure

```typescript
const ydoc = new Y.Doc();

// Shapes - Y.Map<shapeId, ShapeData>
const yShapes = ydoc.getMap('shapes');

// Layer order - Y.Array<shapeId> (bottom to top)
const yLayers = ydoc.getArray('layers');

// Undo Manager - tracks local changes only
const undoManager = new Y.UndoManager([yShapes, yLayers], {
  trackedOrigins: new Set([clientId]),
  captureTimeout: 500
});
```

## Awareness Protocol

```typescript
// Each client broadcasts their state
interface AwarenessState {
  user: {
    id: string;
    name: string;
    color: string;    // Assigned cursor color
    avatar?: string;
  };
  cursor: {
    x: number;
    y: number;
  } | null;
  selection: string[];  // Selected shape IDs
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

// Update frequencies:
// - Cursor: 50ms (throttled for 60fps feel)
// - Selection: 200ms
// - Viewport: 200ms
```

## Konva Layer Strategy

```tsx
// Performance-critical: Separate layers by update frequency

<Stage width={width} height={height}>
  {/* Layer 1: Grid - NEVER updates after initial render */}
  <Layer listening={false} perfectDrawEnabled={false}>
    <Grid />
  </Layer>
  
  {/* Layer 2: Shapes - Updates on user edits */}
  <Layer>
    {visibleShapes.map(shape => (
      <ShapeRenderer key={shape.id} shape={shape} />
    ))}
  </Layer>
  
  {/* Layer 3: Selection - Updates when selection changes */}
  <Layer>
    <SelectionBox />
    <TransformHandles />
    <RemoteSelections />
  </Layer>
  
  {/* Layer 4: Cursors - Updates at 60fps */}
  <Layer listening={false} perfectDrawEnabled={false}>
    {remoteCursors.map(cursor => (
      <RemoteCursor key={cursor.id} {...cursor} />
    ))}
  </Layer>
</Stage>
```

## Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Browser │     │ Frontend│     │ Backend │     │ Google  │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ Click Login   │               │               │
     │──────────────>│               │               │
     │               │               │               │
     │               │ POST /auth/google             │
     │               │──────────────>│               │
     │               │               │               │
     │               │ { redirect_url }              │
     │               │<──────────────│               │
     │               │               │               │
     │ Redirect to Google            │               │
     │<──────────────│               │               │
     │               │               │               │
     │ User signs in                 │               │
     │──────────────────────────────────────────────>│
     │               │               │               │
     │ Callback with code            │               │
     │<──────────────────────────────────────────────│
     │               │               │               │
     │ GET /auth/google/callback?code=xxx            │
     │──────────────────────────────>│               │
     │               │               │               │
     │               │               │ Exchange code │
     │               │               │──────────────>│
     │               │               │               │
     │               │               │ User info     │
     │               │               │<──────────────│
     │               │               │               │
     │ Set-Cookie + Redirect to /dashboard           │
     │<──────────────────────────────│               │
```

## WebSocket Authentication

```python
# WebSocket connection with JWT in query param
# wss://api.example.com/ws/board/{board_id}?token={jwt}

@app.websocket("/ws/board/{board_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    board_id: str,
    token: str = Query(...)
):
    # Verify JWT
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload["sub"]
    except jwt.InvalidTokenError:
        await websocket.close(code=4001, reason="Invalid token")
        return
    
    # Verify board access
    if not await can_access_board(user_id, board_id):
        await websocket.close(code=4003, reason="Access denied")
        return
    
    # Accept and handle connection
    await websocket.accept()
    await collaboration_service.handle_connection(websocket, board_id, user_id)
```

## Redis Data Structures

```
# Presence (with TTL for auto-cleanup)
HSET presence:{board_id}:{user_id} name "Keyur" color "#FF6B6B" ...
EXPIRE presence:{board_id}:{user_id} 30

# Active connections per board
SADD board:{board_id}:connections {user_id}

# Pub/Sub for horizontal scaling
PUBLISH board:{board_id} {binary_yjs_update}
SUBSCRIBE board:{board_id}
```

## Horizontal Scaling Architecture

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐         ┌────▼────┐         ┌────▼────┐
    │ Server 1│         │ Server 2│         │ Server 3│
    │ (FastAPI│         │ (FastAPI│         │ (FastAPI│
    │  +pycrdt)│         │  +pycrdt)│         │  +pycrdt)│
    └────┬────┘         └────┬────┘         └────┬────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                    ┌────────▼────────┐
                    │     Redis       │
                    │   (Pub/Sub)     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    └─────────────────┘

Each server:
1. Maintains local WebSocket connections
2. Subscribes to Redis channel for board
3. Publishes Yjs updates to Redis
4. Receives updates from other servers via Redis
5. Broadcasts to local connections
```

## File Structure

```
collabcanvas/
├── client/                    # Frontend (Vercel)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # Base components
│   │   │   ├── canvas/       # Konva components
│   │   │   ├── toolbar/      # Tool buttons
│   │   │   ├── panels/       # Side panels
│   │   │   └── collaboration/# Cursors, comments
│   │   ├── hooks/            # Custom hooks
│   │   ├── stores/           # Zustand stores
│   │   ├── services/         # API + WebSocket
│   │   ├── lib/              # Utilities
│   │   ├── types/            # TypeScript types
│   │   └── pages/            # Route pages
│   └── ...config files
│
├── server/                    # Backend (Render)
│   ├── routers/              # API endpoints
│   ├── services/             # Business logic
│   ├── models/               # SQLAlchemy models
│   ├── schemas/              # Pydantic schemas
│   ├── websocket/            # pycrdt handlers
│   ├── migrations/           # Alembic
│   └── main.py               # FastAPI app
│
└── docs/                      # Documentation
    ├── PRD.md
    ├── architecture.md
    ├── database-schema.sql
    ├── api-contracts.md
    └── phases/
```
