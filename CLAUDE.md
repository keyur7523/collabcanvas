# CollabCanvas — Real-Time Collaborative Design Board

> **For Figma Job Application** — Demonstrates collaboration systems, real-time sync, frontend performance, and full-stack ownership.

## Quick Context

This is a Figma-inspired collaborative canvas where multiple users can simultaneously create, edit, and comment on designs. Built with React + TypeScript (Vite) frontend and Python + FastAPI backend.

**Live Demo Target:** `collabcanvas.vercel.app` (frontend) + `collabcanvas-api.onrender.com` (backend)

## Tech Stack (MUST USE EXACTLY)

### Frontend
- React 19 + TypeScript (strict mode)
- Vite 6
- TailwindCSS v4 (with @theme CSS variables)
- Konva.js + react-konva (canvas rendering)
- Yjs + y-websocket (CRDT sync)
- Zustand (client state)
- @tanstack/react-query (server state)
- Framer Motion (animations)
- Lucide React (icons)
- Sonner (toasts)
- React Router v7
- react-hotkeys-hook

### Backend
- Python 3.12
- FastAPI + Uvicorn
- pycrdt + pycrdt-websocket (Yjs-compatible CRDT server)
- SQLAlchemy 2 + asyncpg (PostgreSQL)
- Alembic (migrations)
- Redis (presence + pub/sub)
- Authlib + PyJWT (OAuth + tokens)

### Deployment (NO DOCKER)
- Vercel (frontend)
- Render native Python (backend)
- Render PostgreSQL
- Render Redis

## Implementation Order

Work through these phases IN ORDER. Each phase builds on the previous.

1. **Phase 1:** Foundation — Project scaffolding + basic canvas
2. **Phase 2:** Core Canvas — All shape tools + properties panel
3. **Phase 3:** Real-Time Collaboration — Yjs integration + cursors
4. **Phase 4:** Authentication — OAuth (Google + GitHub)
5. **Phase 5:** Board Management — Dashboard + CRUD
6. **Phase 6:** Advanced Collaboration — Comments + sharing
7. **Phase 7:** Polish — Animations + optimizations
8. **Phase 8:** Deployment — Vercel + Render

## Key Files to Read

Before implementing each phase, read the corresponding spec:

- `docs/PRD.md` — Full product requirements
- `docs/phases/phase-X.md` — Detailed tasks for each phase
- `docs/architecture.md` — System diagrams
- `docs/database-schema.sql` — PostgreSQL schema
- `docs/api-contracts.md` — REST API specs
- `docs/design-system.md` — Colors, typography, components

## Critical Implementation Notes

### Yjs Data Model
```typescript
// All shapes stored in Y.Map
const yShapes = ydoc.getMap<YShape>('shapes');
// Layer order in Y.Array
const yLayers = ydoc.getArray<string>('layers');
```

### Konva Layer Strategy (Performance Critical)
```tsx
<Stage>
  <Layer listening={false}>{/* Grid - never updates */}</Layer>
  <Layer>{/* Shapes - updates on edit */}</Layer>
  <Layer>{/* Selection handles - updates on select */}</Layer>
  <Layer listening={false}>{/* Cursors - 60fps updates */}</Layer>
</Stage>
```

### WebSocket Auth
Token passed via query param: `wss://api/ws/board/{boardId}?token={jwt}`

### No Docker
Render uses native Python buildpacks. Just `requirements.txt` + `uvicorn main:app`.

## Commands

### Frontend (client/)
```bash
npm install
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint
```

### Backend (server/)
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload  # Start dev server
alembic upgrade head       # Run migrations
```

## Success Criteria

- [ ] 60fps canvas with 500+ shapes
- [ ] <100ms sync latency
- [ ] <3s initial load
- [ ] Two browsers can collaboratively edit in real-time
- [ ] OAuth login works
- [ ] Comments with @mentions
- [ ] Deployed and accessible publicly
