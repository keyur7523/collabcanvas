# CollabCanvas

A real-time collaborative design canvas built with React, TypeScript, and Python. Multiple users can simultaneously create, edit, and collaborate on designs with live cursor tracking, real-time synchronization, and conflict-free editing powered by CRDTs.

## Features

### Canvas & Drawing Tools
- **Shape Tools**: Rectangle, Ellipse, Line, Arrow, Star, Polygon
- **Text Tool**: Add and edit text with font customization
- **Freehand Drawing**: Smooth pen tool for sketching
- **Color Picker**: Fill and stroke color selection
- **Snap to Grid**: Toggle-able 20px grid snapping for precise alignment

### Selection & Transform
- **Multi-select**: Shift+click or drag selection box
- **Transform Handles**: Resize and rotate shapes
- **Alignment Tools**: Align left/center/right, top/middle/bottom
- **Distribution**: Evenly distribute 3+ shapes horizontally or vertically
- **Layer Ordering**: Bring to front, send to back

### Collaboration
- **Real-time Sync**: Changes sync instantly across all connected users
- **Live Cursors**: See other users' cursor positions with name labels
- **Remote Selections**: View what shapes others have selected
- **Presence Indicators**: See who's online in real-time
- **CRDT-based**: Conflict-free concurrent editing using Yjs

### Canvas Controls
- **Pan & Zoom**: Scroll wheel zoom, middle-click/space drag to pan
- **Zoom Controls**: +/- buttons, percentage display, fit-to-content, reset
- **Keyboard Shortcuts**: Full keyboard navigation support
- **Grid Background**: Subtle dot grid with dark mode support

### Organization
- **Shape Locking**: Lock shapes to prevent accidental edits
- **Copy/Cut/Paste**: Standard clipboard operations with offset pasting
- **Duplicate**: Quick duplication with Ctrl/Cmd+D
- **Undo/Redo**: Full history with Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z
- **Context Menu**: Right-click menu with all common actions

### Export
- **PNG Export**: High-resolution raster export with 2x pixel ratio
- **SVG Export**: Vector export for design tools

### Board Management
- **Dashboard**: View and manage all your boards
- **Editable Names**: Click board name to rename inline
- **Sharing**: Invite collaborators with view/edit permissions
- **Public/Private**: Control board visibility

### Authentication
- **OAuth Integration**: Sign in with Google or GitHub
- **JWT Tokens**: Secure API authentication
- **Role-based Access**: Owner, Editor, Viewer permissions

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| TypeScript | Type safety |
| Vite 6 | Build tool & dev server |
| TailwindCSS v4 | Styling with CSS variables |
| Konva.js | Canvas rendering via react-konva |
| Yjs | CRDT for real-time sync |
| y-websocket | WebSocket provider for Yjs |
| Zustand | Client state management |
| React Router v7 | Client-side routing |
| Framer Motion | Animations |
| Lucide React | Icons |
| Sonner | Toast notifications |

### Backend
| Technology | Purpose |
|------------|---------|
| Python 3.12 | Runtime |
| FastAPI | REST API framework |
| Uvicorn | ASGI server |
| pycrdt | Python CRDT implementation |
| pycrdt-websocket | Yjs-compatible WebSocket server |
| SQLAlchemy 2 | ORM with async support |
| asyncpg | PostgreSQL async driver |
| Alembic | Database migrations |
| Redis | Presence & pub/sub |
| Authlib | OAuth client |
| PyJWT | Token generation & validation |

### Database
- **PostgreSQL**: Primary data store for users, boards, memberships
- **Redis**: Real-time presence, session caching

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.12+
- PostgreSQL 14+
- Redis 6+

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/collabcanvas.git
cd collabcanvas
```

2. **Set up the backend**
```bash
cd server

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and OAuth keys

# Run database migrations
alembic upgrade head

# Start the server
uvicorn main:app --reload --port 8000
```

3. **Set up the frontend**
```bash
cd client

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local if needed (defaults work for local development)

# Start the dev server
npm run dev
```

4. **Open the application**
```
Frontend: http://localhost:5173
Backend API: http://localhost:8000
API Docs: http://localhost:8000/docs
```

## Environment Variables

### Backend (`server/.env`)
```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/collabcanvas
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Frontend (`client/.env.local`)
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
```

## Project Structure

```
collabcanvas/
├── client/                     # React frontend
│   ├── src/
│   │   ├── api/               # API client functions
│   │   ├── components/
│   │   │   ├── canvas/        # Canvas components
│   │   │   │   ├── CollabCanvas.tsx
│   │   │   │   ├── Grid.tsx
│   │   │   │   ├── ZoomControls.tsx
│   │   │   │   ├── AlignmentToolbar.tsx
│   │   │   │   ├── ContextMenu.tsx
│   │   │   │   ├── CursorLayer.tsx
│   │   │   │   ├── RemoteSelections.tsx
│   │   │   │   └── shapes/    # Shape renderers
│   │   │   ├── toolbar/       # Drawing toolbar
│   │   │   ├── panels/        # Side panels
│   │   │   ├── export/        # Export functionality
│   │   │   ├── sharing/       # Share modal
│   │   │   └── ui/            # Reusable UI components
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useYjsShapes.ts
│   │   │   ├── useYjsUndoRedo.ts
│   │   │   ├── useAwareness.ts
│   │   │   ├── useClipboard.ts
│   │   │   └── useAlignment.ts
│   │   ├── stores/            # Zustand stores
│   │   ├── types/             # TypeScript types
│   │   ├── lib/               # Utilities
│   │   └── pages/             # Route pages
│   └── package.json
│
├── server/                     # Python backend
│   ├── main.py                # FastAPI app entry
│   ├── config.py              # Configuration
│   ├── database.py            # DB connection
│   ├── dependencies.py        # Dependency injection
│   ├── models/                # SQLAlchemy models
│   ├── routes/                # API routes
│   │   ├── auth.py
│   │   ├── boards.py
│   │   └── sharing.py
│   ├── services/              # Business logic
│   ├── websocket/             # Yjs WebSocket server
│   ├── migrations/            # Alembic migrations
│   └── requirements.txt
│
└── docs/                       # Documentation
    ├── PRD.md
    ├── architecture.md
    ├── database-schema.sql
    ├── api-contracts.md
    └── design-system.md
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `V` | Select tool |
| `R` | Rectangle tool |
| `O` | Ellipse tool |
| `L` | Line tool |
| `A` | Arrow tool |
| `T` | Text tool |
| `P` | Pen/freehand tool |
| `G` | Toggle snap to grid |
| `Delete` / `Backspace` | Delete selected |
| `Ctrl/Cmd + C` | Copy |
| `Ctrl/Cmd + X` | Cut |
| `Ctrl/Cmd + V` | Paste |
| `Ctrl/Cmd + D` | Duplicate |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + ]` | Bring to front |
| `Ctrl/Cmd + [` | Send to back |
| `Ctrl/Cmd + Shift + L` | Lock/unlock shape |
| `Ctrl/Cmd + +` | Zoom in |
| `Ctrl/Cmd + -` | Zoom out |
| `Ctrl/Cmd + 0` | Reset zoom |
| `Ctrl/Cmd + 1` | Fit to content |
| `Escape` | Deselect / Cancel |

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| GET | `/api/auth/github` | Initiate GitHub OAuth |
| GET | `/api/auth/github/callback` | GitHub OAuth callback |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |

### Boards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards` | List user's boards |
| POST | `/api/boards` | Create new board |
| GET | `/api/boards/:id` | Get board details |
| PATCH | `/api/boards/:id` | Update board (rename, etc.) |
| DELETE | `/api/boards/:id` | Delete board |

### Sharing
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/boards/:id/invite` | Create invite link |
| POST | `/api/boards/:id/join` | Join via invite |
| GET | `/api/boards/:id/members` | List board members |
| PATCH | `/api/boards/:id/members/:userId` | Update member role |
| DELETE | `/api/boards/:id/members/:userId` | Remove member |

### WebSocket
| Endpoint | Description |
|----------|-------------|
| `ws://host/ws/:boardId` | Yjs document sync |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           Clients                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Browser 1  │  │  Browser 2  │  │  Browser 3  │              │
│  │  (React)    │  │  (React)    │  │  (React)    │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          │    WebSocket (Yjs sync)         │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              pycrdt-websocket (Yjs Server)              │    │
│  │         Handles CRDT sync, awareness, presence          │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    REST API Routes                      │    │
│  │         /auth, /boards, /sharing, /comments             │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │PostgreSQL│   │  Redis   │   │  OAuth   │
    │  (Data)  │   │(Presence)│   │Providers │
    └──────────┘   └──────────┘   └──────────┘
```

## Development

### Running Tests
```bash
# Frontend
cd client
npm run test

# Backend
cd server
pytest
```

### Linting
```bash
# Frontend
cd client
npm run lint

# Backend
cd server
ruff check .
```

### Building for Production
```bash
# Frontend
cd client
npm run build

# Output in client/dist/
```

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set the root directory to `client`
3. Add environment variables in Vercel dashboard
4. Deploy

### Backend (Render)
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the root directory to `server`
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables
7. Deploy

### Database (Render)
1. Create a PostgreSQL database on Render
2. Copy the connection string to your backend environment

### Redis (Render)
1. Create a Redis instance on Render
2. Copy the connection URL to your backend environment

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- [Konva.js](https://konvajs.org/) for canvas rendering
- [Yjs](https://yjs.dev/) for CRDT-based real-time collaboration
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
- [TailwindCSS](https://tailwindcss.com/) for styling
