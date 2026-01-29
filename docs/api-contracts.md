# API Contracts

Base URL: `https://collabcanvas-api.onrender.com/api`

## Authentication

### POST /auth/google
Initiate Google OAuth flow.

**Response:**
```json
{
  "redirect_url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### GET /auth/google/callback
Google OAuth callback (browser redirect).

**Query Params:**
- `code`: Authorization code from Google
- `state`: CSRF state token

**Response:** Sets httpOnly cookie + redirects to frontend

### POST /auth/github
Initiate GitHub OAuth flow.

**Response:**
```json
{
  "redirect_url": "https://github.com/login/oauth/authorize?..."
}
```

### GET /auth/github/callback
GitHub OAuth callback (browser redirect).

### GET /auth/me
Get current authenticated user.

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "id": "uuid",
  "email": "keyur@example.com",
  "name": "Keyur Patel",
  "avatar": "https://...",
  "cursorColor": "#3B82F6",
  "createdAt": "2025-01-28T12:00:00Z"
}
```

### POST /auth/refresh
Refresh access token.

**Request:**
```json
{
  "refresh_token": "string"
}
```

**Response:**
```json
{
  "access_token": "string",
  "expires_in": 900
}
```

### POST /auth/logout
Logout user (clears cookies).

---

## Boards

### GET /boards
List user's boards.

**Response:**
```json
{
  "boards": [
    {
      "id": "uuid",
      "name": "My Design",
      "thumbnail": "https://...",
      "role": "owner",
      "collaboratorCount": 3,
      "updatedAt": "2025-01-28T12:00:00Z"
    }
  ]
}
```

### POST /boards
Create new board.

**Request:**
```json
{
  "name": "Untitled"  // optional
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Untitled"
}
```

### GET /boards/:id
Get board details.

**Response:**
```json
{
  "id": "uuid",
  "name": "My Design",
  "owner": {
    "id": "uuid",
    "name": "Keyur",
    "avatar": "https://..."
  },
  "members": [
    {
      "user": { "id": "uuid", "name": "Alice", "avatar": "..." },
      "role": "editor"
    }
  ],
  "isPublic": false,
  "createdAt": "2025-01-28T12:00:00Z",
  "updatedAt": "2025-01-28T12:00:00Z"
}
```

### PATCH /boards/:id
Update board.

**Request:**
```json
{
  "name": "New Name",
  "isPublic": true
}
```

### DELETE /boards/:id
Soft delete board.

### POST /boards/:id/duplicate
Duplicate board.

**Response:**
```json
{
  "id": "new-uuid",
  "name": "My Design (copy)"
}
```

---

## Board Members

### GET /boards/:id/members
List board members.

**Response:**
```json
{
  "members": [
    {
      "user": {
        "id": "uuid",
        "name": "Alice",
        "email": "alice@example.com",
        "avatar": "https://..."
      },
      "role": "editor",
      "invitedAt": "2025-01-28T12:00:00Z"
    }
  ]
}
```

### POST /boards/:id/invite
Generate invite link.

**Request:**
```json
{
  "role": "editor",
  "expiresIn": 604800  // seconds, optional
}
```

**Response:**
```json
{
  "inviteUrl": "https://collabcanvas.vercel.app/invite/abc123",
  "expiresAt": "2025-02-04T12:00:00Z"
}
```

### POST /invites/:inviteId/accept
Accept invite link.

**Response:**
```json
{
  "boardId": "uuid"
}
```

### PATCH /boards/:id/members/:userId
Update member role.

**Request:**
```json
{
  "role": "viewer"
}
```

### DELETE /boards/:id/members/:userId
Remove member from board.

---

## Comments

### GET /boards/:id/comments
List board comments.

**Query Params:**
- `resolved`: boolean (optional filter)

**Response:**
```json
{
  "comments": [
    {
      "id": "uuid",
      "author": {
        "id": "uuid",
        "name": "Keyur",
        "avatar": "https://..."
      },
      "content": "This needs more contrast",
      "position": { "x": 450, "y": 320 },
      "resolved": false,
      "replyCount": 2,
      "createdAt": "2025-01-28T12:00:00Z"
    }
  ]
}
```

### POST /boards/:id/comments
Create comment.

**Request:**
```json
{
  "content": "Looking good! @alice what do you think?",
  "position": { "x": 450, "y": 320 },
  "parentId": null,  // or comment ID for reply
  "mentions": ["alice-user-id"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "author": { ... },
  "content": "...",
  "position": { ... },
  "resolved": false,
  "createdAt": "2025-01-28T12:00:00Z"
}
```

### GET /comments/:id/replies
Get comment thread.

**Response:**
```json
{
  "comment": { ... },
  "replies": [
    {
      "id": "uuid",
      "author": { ... },
      "content": "I agree!",
      "createdAt": "..."
    }
  ]
}
```

### PATCH /comments/:id
Update comment.

**Request:**
```json
{
  "content": "Updated text",
  "resolved": true
}
```

### DELETE /comments/:id
Delete comment.

---

## WebSocket

### Connection
```
wss://collabcanvas-api.onrender.com/ws/board/{boardId}?token={jwt}
```

### Protocol
Uses standard y-websocket protocol (Yjs sync + awareness).

**Message Types (Binary):**
- `0`: Sync messages (document state)
- `1`: Awareness messages (cursors, presence)
- `2`: Auth messages

### Awareness State Format
```json
{
  "user": {
    "id": "uuid",
    "name": "Keyur",
    "color": "#3B82F6",
    "avatar": "https://..."
  },
  "cursor": { "x": 450, "y": 320 },
  "selection": ["shape-id-1", "shape-id-2"],
  "viewport": { "x": 0, "y": 0, "zoom": 1.0 }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

**Common Error Codes:**
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `VALIDATION_ERROR` (422)
- `RATE_LIMITED` (429)
- `INTERNAL_ERROR` (500)

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Auth endpoints | 10/min |
| Board CRUD | 100/min |
| Comments | 50/min |
| WebSocket connections | 10/board/user |
