# Phase 1: Foundation (Days 1-3)

## Goal
Project scaffolding + basic canvas with rectangle tool working.

## Deliverable
A canvas where you can draw, select, and move rectangles.

---

## Tasks

### 1.1 Frontend Setup

```bash
# Create Vite project
npm create vite@latest client -- --template react-ts
cd client
npm install

# Install dependencies
npm install react-router-dom@7 zustand @tanstack/react-query framer-motion lucide-react sonner react-hotkeys-hook konva react-konva yjs y-websocket clsx tailwind-merge

# Install dev dependencies  
npm install -D tailwindcss@next @tailwindcss/vite postcss autoprefixer
```

**Configure TailwindCSS v4:**

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --color-bg: #09090b;
  --color-surface: #18181b;
  --color-surface-hover: #27272a;
  --color-elevated: #1f1f23;
  --color-canvas: #0c0c0e;
  --color-border: #27272a;
  --color-border-muted: #1f1f23;
  --color-border-focus: #6366f1;
  --color-text: #fafafa;
  --color-text-secondary: #a1a1aa;
  --color-text-muted: #52525b;
  --color-accent: #6366f1;
  --color-accent-hover: #4f46e5;
  --color-accent-muted: rgba(99, 102, 241, 0.15);
  --color-success: #22c55e;
  --color-error: #ef4444;
  --color-warning: #f59e0b;
  --color-info: #06b6d4;
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-full: 9999px;
}

body {
  @apply bg-bg text-text;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### 1.2 Create Base UI Components

Create these files in `src/components/ui/`:

**Button.tsx**
- Props: variant (primary/secondary/ghost/danger), size (sm/md/lg), leftIcon, rightIcon, isLoading, disabled
- Use `motion.button` with `whileTap={{ scale: 0.98 }}`

**Input.tsx**
- Props: label, error, leftIcon, rightIcon
- Height h-10, proper focus ring

**Card.tsx**
- Props: variant (default/elevated), padding, hoverable
- Subcomponents: CardHeader, CardTitle, CardContent

**Modal.tsx**
- Backdrop with AnimatePresence
- ScaleIn animation for content
- Close on Escape, close on backdrop click

**Skeleton.tsx**
- Base skeleton with pulse animation
- SkeletonText, SkeletonCard variants

**Create `src/lib/utils.ts`:**
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 1.3 Create Konva Canvas

**src/components/canvas/Canvas.tsx**
```typescript
import { Stage, Layer, Rect, Transformer } from 'react-konva';
import { useRef, useState } from 'react';

interface Shape {
  id: string;
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export function Canvas() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'rectangle'>('select');
  
  // Implement:
  // 1. Pan with mouse drag on empty space
  // 2. Zoom with scroll wheel
  // 3. Click to select shape
  // 4. Drag to move shape
  // 5. Click-drag to create rectangle (when tool='rectangle')
  
  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        {/* Grid background */}
      </Layer>
      <Layer>
        {shapes.map(shape => (
          <Rect
            key={shape.id}
            {...shape}
            draggable
            onClick={() => setSelectedId(shape.id)}
          />
        ))}
      </Layer>
      <Layer>
        {/* Transformer for selected shape */}
      </Layer>
    </Stage>
  );
}
```

### 1.4 Implement Pan & Zoom

```typescript
// Infinite canvas with pan and zoom
const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
const [stageScale, setStageScale] = useState(1);

// Zoom with scroll wheel
const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
  e.evt.preventDefault();
  const stage = e.target.getStage();
  const oldScale = stage.scaleX();
  const pointer = stage.getPointerPosition();
  
  const scaleBy = 1.1;
  const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
  
  // Clamp scale
  const clampedScale = Math.max(0.1, Math.min(5, newScale));
  
  setStageScale(clampedScale);
  // Adjust position to zoom towards pointer
};

// Pan with middle mouse or space+drag
```

### 1.5 Rectangle Tool

```typescript
const [isDrawing, setIsDrawing] = useState(false);
const [newShape, setNewShape] = useState<Partial<Shape> | null>(null);

const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
  if (tool !== 'rectangle') return;
  
  const pos = e.target.getStage()?.getPointerPosition();
  if (!pos) return;
  
  setIsDrawing(true);
  setNewShape({
    id: crypto.randomUUID(),
    type: 'rectangle',
    x: pos.x,
    y: pos.y,
    width: 0,
    height: 0,
    fill: '#6366f1',
    stroke: '#4f46e5',
    strokeWidth: 2,
  });
};

const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
  if (!isDrawing || !newShape) return;
  
  const pos = e.target.getStage()?.getPointerPosition();
  if (!pos) return;
  
  setNewShape({
    ...newShape,
    width: pos.x - newShape.x!,
    height: pos.y - newShape.y!,
  });
};

const handleMouseUp = () => {
  if (!isDrawing || !newShape) return;
  
  setIsDrawing(false);
  if (Math.abs(newShape.width!) > 5 && Math.abs(newShape.height!) > 5) {
    setShapes([...shapes, newShape as Shape]);
  }
  setNewShape(null);
  setTool('select');  // Switch back to select
};
```

### 1.6 Setup Routing

**src/App.tsx**
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/board/:boardId" element={<BoardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Backend Tasks

### 1.7 Backend Setup

```bash
mkdir server && cd server
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install fastapi uvicorn sqlalchemy[asyncio] asyncpg alembic python-dotenv pydantic-settings

pip freeze > requirements.txt
```

**server/main.py**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CollabCanvas API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

**server/config.py**
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://localhost/collabcanvas"
    redis_url: str = "redis://localhost:6379"
    secret_key: str = "dev-secret-key"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### 1.8 Database Setup

**server/database.py**
```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

from config import settings

engine = create_async_engine(settings.database_url)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
```

**server/models/user.py**
```python
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    avatar_url = Column(String)
    provider = Column(String(20), nullable=False)
    provider_id = Column(String(255), nullable=False)
    cursor_color = Column(String(7), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active_at = Column(DateTime, default=datetime.utcnow)
```

**server/models/board.py**
```python
class Board(Base):
    __tablename__ = "boards"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, default="Untitled")
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    is_public = Column(Boolean, default=False)
    deleted_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### 1.9 Initialize Alembic

```bash
alembic init migrations
# Edit alembic.ini and migrations/env.py to use async
alembic revision --autogenerate -m "initial"
alembic upgrade head
```

---

## Checklist

- [ ] Vite + React + TypeScript project created
- [ ] TailwindCSS v4 configured with design tokens
- [ ] Base UI components: Button, Input, Card, Modal, Skeleton
- [ ] Konva Stage renders with pan/zoom
- [ ] Rectangle tool: click-drag to create
- [ ] Select tool: click to select, drag to move
- [ ] Transformer handles on selected shape
- [ ] FastAPI project with health endpoint
- [ ] PostgreSQL models for User, Board
- [ ] Alembic migrations working

## Test It

1. `cd client && npm run dev` — Opens at localhost:5173
2. Canvas fills viewport with dark background
3. Press R, click-drag to create rectangle
4. Press V, click rectangle to select (shows handles)
5. Drag rectangle to move it
6. Scroll to zoom, middle-drag to pan
7. `cd server && uvicorn main:app --reload` — API at localhost:8000
8. `curl localhost:8000/health` returns `{"status": "healthy"}`
