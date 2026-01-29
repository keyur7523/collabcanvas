-- CollabCanvas Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('google', 'github')),
    provider_id VARCHAR(255) NOT NULL,
    cursor_color VARCHAR(7) NOT NULL,  -- Hex color like #FF6B6B
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(provider, provider_id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider, provider_id);

-- ============================================
-- BOARDS
-- ============================================
CREATE TABLE boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL DEFAULT 'Untitled',
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thumbnail_url TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,  -- Soft delete
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_boards_owner ON boards(owner_id);
CREATE INDEX idx_boards_deleted ON boards(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- BOARD MEMBERS (Access Control)
-- ============================================
CREATE TABLE board_members (
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (board_id, user_id)
);

CREATE INDEX idx_board_members_user ON board_members(user_id);

-- ============================================
-- BOARD STATE (Yjs Document Snapshots)
-- ============================================
CREATE TABLE board_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    yjs_state BYTEA NOT NULL,  -- Full Yjs document encoded
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(board_id, version)
);

CREATE INDEX idx_board_states_board ON board_states(board_id);

-- ============================================
-- BOARD UPDATES (Incremental Yjs Updates)
-- ============================================
CREATE TABLE board_updates (
    id BIGSERIAL PRIMARY KEY,
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    update_data BYTEA NOT NULL,  -- Yjs update binary
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_board_updates_board ON board_updates(board_id);
CREATE INDEX idx_board_updates_created ON board_updates(board_id, created_at);

-- ============================================
-- COMMENTS
-- ============================================
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,  -- NULL = root comment
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    position_x FLOAT,  -- Canvas X coordinate (NULL for replies)
    position_y FLOAT,  -- Canvas Y coordinate (NULL for replies)
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_board ON comments(board_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comments_author ON comments(author_id);

-- ============================================
-- COMMENT MENTIONS
-- ============================================
CREATE TABLE comment_mentions (
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX idx_comment_mentions_user ON comment_mentions(user_id);

-- ============================================
-- BOARD INVITES
-- ============================================
CREATE TABLE board_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
    created_by UUID NOT NULL REFERENCES users(id),
    expires_at TIMESTAMPTZ,
    max_uses INTEGER,
    use_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_board_invites_board ON board_invites(board_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_boards_updated_at
    BEFORE UPDATE ON boards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CURSOR COLORS (Reference)
-- ============================================
-- These colors are assigned to users on creation
-- Stored in code, not DB, but documented here:
--
-- #EF4444 (red)
-- #F97316 (orange)
-- #F59E0B (amber)
-- #10B981 (emerald)
-- #06B6D4 (cyan)
-- #3B82F6 (blue)
-- #8B5CF6 (violet)
-- #EC4899 (pink)
