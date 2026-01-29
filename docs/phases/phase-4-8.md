# Phase 4: Authentication (Days 11-13)

## Goal
OAuth login with Google and GitHub.

## Key Tasks

### Backend
1. Install: `pip install authlib httpx python-jose`
2. Create `/api/auth/google` - Returns redirect URL to Google
3. Create `/api/auth/google/callback` - Exchanges code for tokens, creates user
4. Create `/api/auth/github` and `/api/auth/github/callback` - Same for GitHub
5. Create `/api/auth/me` - Returns current user from JWT
6. Create `/api/auth/refresh` - Refresh access token
7. JWT middleware that verifies token on protected routes

### Frontend
1. Create LoginPage with Google/GitHub buttons
2. Create AuthCallback page that handles OAuth redirect
3. Create authStore (Zustand) for user state
4. Create ProtectedRoute component
5. Add user avatar to header
6. Pass JWT token to WebSocket connection

### Environment Variables Needed
```bash
# Backend
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx

# Frontend
VITE_GOOGLE_CLIENT_ID=xxx
VITE_GITHUB_CLIENT_ID=xxx
```

---

# Phase 5: Board Management (Days 14-15)

## Goal
Dashboard with board CRUD.

## Key Tasks

### Backend
1. `GET /api/boards` - List user's boards
2. `POST /api/boards` - Create new board
3. `GET /api/boards/:id` - Get board details
4. `PATCH /api/boards/:id` - Update board name
5. `DELETE /api/boards/:id` - Soft delete board
6. `POST /api/boards/:id/duplicate` - Clone board

### Frontend
1. Create DashboardPage with board grid
2. Create BoardCard component (thumbnail, name, last edited)
3. Create NewBoardButton → creates board → navigates to it
4. Create board context menu (rename, duplicate, delete)
5. Add loading skeletons for board list
6. Add empty state when no boards

---

# Phase 6: Advanced Collaboration (Days 16-18)

## Goal
Comments, sharing, presence sidebar.

## Key Tasks

### Comments
1. `GET /api/boards/:id/comments` - List comments
2. `POST /api/boards/:id/comments` - Create comment
3. `PATCH /api/comments/:id` - Update/resolve comment
4. `DELETE /api/comments/:id` - Delete comment
5. Frontend: CommentPin component (renders on canvas)
6. Frontend: CommentsPanel with thread view
7. @mention autocomplete using board members

### Sharing
1. `POST /api/boards/:id/invite` - Generate invite link
2. `POST /api/invites/:id/accept` - Accept invite
3. `GET /api/boards/:id/members` - List members
4. `PATCH /api/boards/:id/members/:userId` - Change role
5. `DELETE /api/boards/:id/members/:userId` - Remove member
6. Frontend: ShareModal with invite link + member list

### Presence Sidebar
1. Show online users from awareness
2. Click user to follow their viewport
3. Show "Following [Name]" indicator
4. Break follow on any user interaction

---

# Phase 7: Polish & Optimization (Days 19-21)

## Goal
Production-ready quality.

## Performance Tasks

### Canvas Virtualization
```typescript
function getVisibleShapes(shapes, viewport) {
  const buffer = viewport.width * 0.5;
  return shapes.filter(shape => 
    shape.x + shape.width > viewport.x - buffer &&
    shape.x < viewport.x + viewport.width + buffer &&
    shape.y + shape.height > viewport.y - buffer &&
    shape.y < viewport.y + viewport.height + buffer
  );
}
```

### Debounced Syncing
- Throttle cursor updates to 50ms
- Debounce shape updates to 50ms
- Batch multiple changes in single Yjs transaction

### Konva Optimization
- `listening={false}` on static layers
- `perfectDrawEnabled={false}` for cursor layer
- Use `layerRef.batchDraw()` for multiple updates

## UI Polish Tasks

### Animations (Framer Motion)
1. Page transitions (fade + slide)
2. Modal open/close (scale + fade)
3. Dropdown appear (slide + fade)
4. Toast notifications (slide from bottom)
5. Skeleton pulse animation
6. Button press feedback (scale 0.98)

### Micro-interactions
1. Tool button hover effect
2. Shape hover highlight
3. Selection box animation
4. Cursor smooth lerp
5. Panel collapse/expand
6. Color picker transition

### Command Palette
- `Cmd+K` opens palette
- Search boards, tools, actions
- Keyboard navigation (up/down/enter)
- Recent items section

### Keyboard Shortcuts Modal
- `Cmd+/` or `?` opens modal
- Grouped by category
- Searchable

---

# Phase 8: Deployment (Days 22-23)

## Vercel (Frontend)

```json
// vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Deploy:**
```bash
cd client
npm run build
vercel --prod
```

**Environment Variables in Vercel Dashboard:**
- `VITE_API_URL` = https://collabcanvas-api.onrender.com
- `VITE_WS_URL` = wss://collabcanvas-api.onrender.com

## Render (Backend)

**render.yaml:**
```yaml
services:
  - type: web
    name: collabcanvas-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: collabcanvas-db
          property: connectionString
```

**No Docker needed** - Render detects Python from requirements.txt

## Final Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Render
- [ ] PostgreSQL provisioned on Render
- [ ] Redis provisioned on Render (optional for scaling)
- [ ] Environment variables configured
- [ ] Custom domain (optional)
- [ ] CORS configured for production URLs
- [ ] WebSocket working over WSS
- [ ] OAuth callbacks updated to production URLs
- [ ] Test full flow: login → create board → collaborate → logout
