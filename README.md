# CollabCanvas

Real-time collaborative design board — A Figma-inspired canvas for your portfolio.

## Quick Start with Claude Code

```bash
# Clone or copy this project folder
cd collabcanvas-project

# Start Claude Code
claude

# Tell Claude to begin:
> Read CLAUDE.md and docs/phases/phase-1.md, then implement Phase 1
```

## Project Structure

```
collabcanvas-project/
├── CLAUDE.md              # Main instructions for Claude Code
├── .cursorrules           # Rules for consistent code generation
├── docs/
│   ├── PRD.md             # Product requirements
│   ├── architecture.md    # System diagrams
│   ├── database-schema.sql
│   ├── api-contracts.md   # REST API specs
│   ├── design-system.md   # Colors, typography, components
│   └── phases/
│       ├── phase-1.md     # Foundation
│       ├── phase-2.md     # Core Canvas
│       ├── phase-3.md     # Real-time Collaboration
│       └── phase-4-8.md   # Auth, Boards, Polish, Deploy
├── client/                # Frontend (created in Phase 1)
└── server/                # Backend (created in Phase 1)
```

## Implementation Phases

| Phase | Days | Focus |
|-------|------|-------|
| 1 | 1-3 | Scaffolding + basic canvas |
| 2 | 4-6 | All shape tools + properties |
| 3 | 7-10 | Yjs sync + live cursors |
| 4 | 11-13 | OAuth (Google + GitHub) |
| 5 | 14-15 | Dashboard + board CRUD |
| 6 | 16-18 | Comments + sharing |
| 7 | 19-21 | Animations + performance |
| 8 | 22-23 | Deploy to Vercel + Render |

## Tech Stack

**Frontend:** React 19, TypeScript, Vite, TailwindCSS v4, Konva.js, Yjs, Zustand, Framer Motion

**Backend:** Python 3.12, FastAPI, pycrdt-websocket, PostgreSQL, Redis

**Deployment:** Vercel (frontend), Render (backend, no Docker)

## Key Commands

```bash
# Frontend
cd client
npm run dev      # Start dev server at localhost:5173

# Backend
cd server
source venv/bin/activate
uvicorn main:app --reload  # Start at localhost:8000
```

## Tips for Claude Code

1. **Always read the phase doc first** — Each phase has specific tasks and code examples

2. **Use the design system** — Colors and components are pre-defined in `docs/design-system.md`

3. **Follow the tech stack exactly** — Don't substitute libraries

4. **Test incrementally** — Each phase has a "Test It" section with verification steps

5. **Ask for clarification** — If something is unclear, the docs have the answers

## License

MIT — Built for portfolio demonstration purposes.
