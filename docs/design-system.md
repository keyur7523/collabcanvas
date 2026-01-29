# Design System

## Philosophy

**"Refined Obsidian"** — A sophisticated dark-first design that feels premium and professional. Clean lines, subtle depth, purposeful color accents. Inspired by Figma's interface but with its own identity.

## Colors

### CSS Variables (TailwindCSS v4 @theme)

```css
@import "tailwindcss";

@theme {
  /* === BACKGROUNDS === */
  --color-bg: #09090b;                    /* zinc-950 - App background */
  --color-surface: #18181b;               /* zinc-900 - Cards, panels */
  --color-surface-hover: #27272a;         /* zinc-800 - Hover states */
  --color-elevated: #1f1f23;              /* Modals, dropdowns */
  --color-canvas: #0c0c0e;                /* Canvas background */
  
  /* === BORDERS === */
  --color-border: #27272a;                /* zinc-800 */
  --color-border-muted: #1f1f23;          /* Subtle dividers */
  --color-border-focus: #6366f1;          /* indigo-500 - Focus rings */
  
  /* === TEXT === */
  --color-text: #fafafa;                  /* zinc-50 - Primary */
  --color-text-secondary: #a1a1aa;        /* zinc-400 - Secondary */
  --color-text-muted: #52525b;            /* zinc-600 - Disabled */
  
  /* === ACCENT === */
  --color-accent: #6366f1;                /* indigo-500 */
  --color-accent-hover: #4f46e5;          /* indigo-600 */
  --color-accent-muted: rgba(99, 102, 241, 0.15);
  
  /* === SEMANTIC === */
  --color-success: #22c55e;               /* green-500 */
  --color-error: #ef4444;                 /* red-500 */
  --color-warning: #f59e0b;               /* amber-500 */
  --color-info: #06b6d4;                  /* cyan-500 */
  
  /* === CURSOR COLORS === */
  --cursor-red: #ef4444;
  --cursor-orange: #f97316;
  --cursor-amber: #f59e0b;
  --cursor-emerald: #10b981;
  --cursor-cyan: #06b6d4;
  --cursor-blue: #3b82f6;
  --cursor-violet: #8b5cf6;
  --cursor-pink: #ec4899;
  
  /* === RADIUS === */
  --radius-sm: 0.375rem;                  /* 6px */
  --radius-md: 0.5rem;                    /* 8px */
  --radius-lg: 0.75rem;                   /* 12px */
  --radius-xl: 1rem;                      /* 16px */
  --radius-full: 9999px;
  
  /* === SHADOWS === */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
  --shadow-glow: 0 0 20px rgba(99, 102, 241, 0.3);
}
```

### Cursor Color Palette (Assign to Users)

```typescript
export const CURSOR_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#F59E0B', // amber
  '#10B981', // emerald
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
] as const;

export function assignCursorColor(userId: string): string {
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}
```

## Typography

### Font Stack

```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}
```

### Type Scale

| Name | Size | Line Height | Weight | Use |
|------|------|-------------|--------|-----|
| display | 2.25rem (36px) | 2.5rem | 700 | Page titles |
| headline | 1.5rem (24px) | 2rem | 600 | Section headers |
| title | 1.125rem (18px) | 1.75rem | 600 | Card titles |
| body | 0.875rem (14px) | 1.25rem | 400 | Default text |
| caption | 0.75rem (12px) | 1rem | 500 | Labels, hints |
| overline | 0.625rem (10px) | 1rem | 600 | Uppercase labels |

## Components

### Button

```tsx
// Variants: primary, secondary, ghost, danger
// Sizes: sm (h-8), md (h-10), lg (h-12)

<Button variant="primary" size="md" leftIcon={<Plus />}>
  Create Board
</Button>

// States: default, hover, active, disabled, loading
// Use motion.button with whileTap={{ scale: 0.98 }}
```

### Input

```tsx
<Input
  label="Board Name"
  placeholder="Enter name..."
  error="Name is required"
  leftIcon={<Search />}
/>

// Height: h-10
// Border: 1px solid var(--color-border)
// Focus: ring-2 ring-accent
```

### Card

```tsx
<Card variant="default" padding="md" hoverable>
  <CardHeader>
    <CardTitle>Design Board</CardTitle>
    <CardDescription>Last edited 2h ago</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>

// Variants: default (border), elevated (shadow)
// Padding: none, sm (12px), md (16px), lg (24px)
```

### Modal

```tsx
<Modal open={isOpen} onClose={close} size="md">
  <ModalHeader>
    <ModalTitle>Share Board</ModalTitle>
  </ModalHeader>
  <ModalContent>...</ModalContent>
  <ModalFooter>
    <Button variant="ghost" onClick={close}>Cancel</Button>
    <Button variant="primary">Share</Button>
  </ModalFooter>
</Modal>

// Sizes: sm (max-w-md), md (max-w-lg), lg (max-w-2xl)
// Animation: ScaleIn (scale 0.95→1, opacity 0→1)
// Backdrop: bg-black/60 with blur
```

### Tooltip

```tsx
<Tooltip content="Select tool (V)" position="bottom">
  <ToolButton icon={<MousePointer />} />
</Tooltip>

// Delay: 300ms before show
// Background: zinc-800
// Arrow pointing to trigger
```

### Avatar

```tsx
<Avatar src={user.avatar} name={user.name} size="md" />

// Sizes: sm (24px), md (32px), lg (40px)
// Fallback: First letter of name on colored background
```

## Animation

### Framer Motion Variants

```typescript
// components/ui/Animations.tsx

export const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.15 }
};

export const slideIn = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 16 },
  transition: { duration: 0.2 }
};

export const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
};
```

### Skeleton Loading

```tsx
// Pulse animation for loading states
<Skeleton className="h-4 w-32" />
<SkeletonText lines={3} />
<SkeletonCard />

// Animation: opacity 0.5 → 0.8 → 0.5 on 1.5s loop
```

## Layout

### App Shell

```
┌─────────────────────────────────────────────────────┐
│ HEADER (h-14)                                       │
│ [Logo] [Board Name]            [Share] [Avatar ▾]  │
├─────────┬───────────────────────────────┬──────────┤
│ TOOLBAR │                               │ PANELS   │
│ (w-12)  │         CANVAS               │ (w-72)   │
│         │                               │          │
│ [V]     │   ┌─────────────────────┐    │ Props    │
│ [R]     │   │                     │    │ Layers   │
│ [O]     │   │      Shapes         │    │ Comments │
│ [L]     │   │                     │    │          │
│ [T]     │   └─────────────────────┘    │          │
│ [P]     │                               │          │
│         │         [Zoom: 100%]          │          │
└─────────┴───────────────────────────────┴──────────┘
```

### Spacing Scale

| Token | Value | Use |
|-------|-------|-----|
| 1 | 4px | Tiny gaps |
| 2 | 8px | Icon padding |
| 3 | 12px | Small padding |
| 4 | 16px | Default padding |
| 5 | 20px | Medium gaps |
| 6 | 24px | Section spacing |
| 8 | 32px | Large gaps |
| 10 | 40px | XL spacing |
| 12 | 48px | Page margins |

## Icons

Using **Lucide React** for all icons.

```tsx
import { 
  MousePointer2,  // Select tool
  Square,         // Rectangle
  Circle,         // Ellipse
  Minus,          // Line
  MoveRight,      // Arrow
  Type,           // Text
  Pencil,         // Freehand
  Star,           // Star shape
  Hexagon,        // Polygon
  Undo2,          // Undo
  Redo2,          // Redo
  Users,          // Collaborators
  MessageSquare,  // Comments
  Share2,         // Share
  Settings,       // Settings
  LogOut,         // Logout
} from 'lucide-react';
```

## Keyboard Shortcuts Display

Show in help modal (`Cmd+/`):

```tsx
<ShortcutItem>
  <span>Select tool</span>
  <Kbd>V</Kbd>
</ShortcutItem>

<ShortcutItem>
  <span>Undo</span>
  <Kbd>⌘</Kbd><Kbd>Z</Kbd>
</ShortcutItem>

// Kbd component: inline-flex, bg-surface, border, rounded-sm, px-1.5, text-xs, font-mono
```

## Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| sm | 640px | Mobile |
| md | 768px | Tablet - Hide right panel |
| lg | 1024px | Desktop - Full layout |
| xl | 1280px | Wide - More space |

### Mobile Adaptations
- Toolbar moves to bottom
- Panels become drawers/sheets
- Touch-friendly hit targets (min 44px)
