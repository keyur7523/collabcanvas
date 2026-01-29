# CollabCanvas — Product Requirements Document

## Executive Summary

A Figma-inspired real-time collaborative design board demonstrating:
- Real-time collaboration with CRDT (Yjs)
- High-performance canvas rendering (Konva.js)
- Full-stack ownership (React + FastAPI)
- Production deployment (Vercel + Render)

---

## Features Overview

### Canvas Tools (Scope B: Medium)

| Tool | Shortcut | Notes |
|------|----------|-------|
| Select | `V` | Click select, drag move, handles resize |
| Rectangle | `R` | Shift = square |
| Ellipse | `O` | Shift = circle |
| Line | `L` | Click start, click end |
| Arrow | `A` | Line with arrowhead |
| Freehand | `P` | Smooth pen drawing |
| Text | `T` | Click to place, double-click to edit |
| Star | Menu | Configurable points |
| Polygon | Menu | Configurable sides |

### Shape Properties

```typescript
interface ShapeProperties {
  // Transform
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  
  // Appearance
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  strokeOpacity: number;
  cornerRadius?: number;
  
  // Layer
  zIndex: number;
  locked: boolean;
  visible: boolean;
}
```

### Collaboration (Scope C: Full)

1. **Live Cursors** — Colored pointers with names, smooth interpolation
2. **Selection Awareness** — See what others have selected
3. **Presence Sidebar** — Who's online, follow their viewport
4. **Comments** — Pin to canvas, threaded replies, @mentions, resolve
5. **Sharing** — Invite links with role (editor/viewer)

### Persistence

- Auto-save every 2 seconds (debounced)
- Undo/redo within session (Y.UndoManager)
- Board CRUD (create, rename, duplicate, delete)

### Authentication

- Google OAuth 2.0
- GitHub OAuth
- JWT tokens (15min access, 7day refresh)
- Roles: owner, editor, viewer

---

## Keyboard Shortcuts

| Action | Mac | Windows |
|--------|-----|---------|
| Select tool | `V` | `V` |
| Rectangle | `R` | `R` |
| Ellipse | `O` | `O` |
| Line | `L` | `L` |
| Text | `T` | `T` |
| Pen | `P` | `P` |
| Undo | `⌘Z` | `Ctrl+Z` |
| Redo | `⌘⇧Z` | `Ctrl+Shift+Z` |
| Delete | `⌫` | `Delete` |
| Select all | `⌘A` | `Ctrl+A` |
| Copy | `⌘C` | `Ctrl+C` |
| Paste | `⌘V` | `Ctrl+V` |
| Duplicate | `⌘D` | `Ctrl+D` |
| Group | `⌘G` | `Ctrl+G` |
| Ungroup | `⌘⇧G` | `Ctrl+Shift+G` |
| Bring forward | `⌘]` | `Ctrl+]` |
| Send backward | `⌘[` | `Ctrl+[` |
| Zoom in | `⌘+` | `Ctrl++` |
| Zoom out | `⌘-` | `Ctrl+-` |
| Shortcuts help | `⌘/` | `Ctrl+/` |
| Command palette | `⌘K` | `Ctrl+K` |

---

## Data Models

### User

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  provider: 'google' | 'github';
  cursorColor: string;
  createdAt: Date;
}
```

### Board

```typescript
interface Board {
  id: string;
  name: string;
  ownerId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Comment

```typescript
interface Comment {
  id: string;
  boardId: string;
  parentId: string | null;
  authorId: string;
  content: string;
  position: { x: number; y: number };
  resolved: boolean;
  mentions: string[];
  createdAt: Date;
}
```

### Yjs Shape (Stored in Y.Map)

```typescript
interface YShape {
  id: string;
  type: 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'text' | 'freehand' | 'star' | 'polygon';
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[];
  rotation: number;
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  strokeOpacity: number;
  cornerRadius?: number;
  text?: string;
  fontSize?: number;
  locked: boolean;
  visible: boolean;
  groupId?: string;
}
```

### Awareness State (Cursors/Presence)

```typescript
interface AwarenessState {
  user: {
    id: string;
    name: string;
    color: string;
    avatar?: string;
  };
  cursor: { x: number; y: number } | null;
  selection: string[];
  viewport: { x: number; y: number; zoom: number };
}
```

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Canvas FPS | 60fps with 500+ shapes |
| Sync latency | <100ms |
| Initial load | <3s |
| Bundle size | <500KB gzipped |

### Optimization Strategies

1. **Canvas Virtualization** — Only render shapes in viewport + buffer
2. **Konva Layers** — Separate layers for grid, shapes, selection, cursors
3. **Debounced Sync** — Batch Yjs updates every 50ms
4. **Awareness Throttle** — Cursor updates at 60fps, selection at 200ms
