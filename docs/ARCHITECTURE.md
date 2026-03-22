# Architecture & Implementation Guide

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│         Browser (React Frontend)                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │ AuthContext                                       │  │
│  │  • Manages user session                          │  │
│  │  • Handles login/signup/logout                   │  │
│  │  • Updates on auth state changes                 │  │
│  └────────────────┬────────────────────────────────┘  │
│                   │                                    │
│  ┌────────────────▼────────────────────────────────┐  │
│  │ Canvas Component                                 │  │
│  │  • Renders HTML5 canvas                         │  │
│  │  • Handles mouse/touch drawing                  │  │
│  │  • Subscribes to realtime updates               │  │
│  │  • Saves strokes to database                    │  │
│  └────────────────┬────────────────────────────────┘  │
│                   │ HTTP & WebSocket                  │
└───────────────────┼──────────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────────────┐
│      Supabase Backend                                │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ Auth Service                                   │ │
│  │  • User registration/login                    │ │
│  │  • Session management                         │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │ PostgreSQL Database                            │ │
│  │  • whiteboards table (metadata)               │ │
│  │  • drawing_strokes table (pixels)             │ │
│  │  • Row Level Security (RLS) policies          │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │ Realtime Engine                                │ │
│  │  • WebSocket subscriptions                    │ │
│  │  • Broadcasts new strokes to all clients      │ │
│  └────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

## Component Structure

### Authentication Flow

```
Home
  ↓ (if not logged in)
Login/Signup
  ↓ (after auth)
Dashboard (list whiteboards)
  ↓ (open whiteboard)
WhiteboardPage (open canvas)
  ↓ (with Canvas component)
Canvas (actual drawing)
```

### Data Flow

#### Drawing Process
1. User draws on canvas
2. `Canvas` component captures mouse/touch events
3. `saveStroke()` is called with coordinates
4. Stroke is drawn to local canvas immediately (optimistic update)
5. Stroke is inserted to `drawing_strokes` table via Supabase
6. Realtime subscription broadcasts stroke to all connected clients
7. Other clients receive update and draw stroke on their canvas

#### Collaboration
- Each stroke has a `timestamp` field for ordering
- Strokes include `user_id` for attribution
- All strokes are stored persistently
- When opening whiteboard, all previous strokes are loaded
- New strokes automatically sync via Realtime

## Database Schema

### Whiteboards Table
```sql
whiteboards {
  id: uuid (primary key)
  title: string
  user_id: uuid (references auth.users)
  created_at: timestamp
  updated_at: timestamp
  is_public: boolean
}
```

**Purpose**: Metadata for each whiteboard session  
**RLS**: Users can only see/modify their own whiteboards (or public ones)

### Drawing Strokes Table
```sql
drawing_strokes {
  id: uuid (primary key)
  whiteboard_id: uuid (foreign key)
  user_id: uuid (foreign key)
  x: float (canvas x coordinate)
  y: float (canvas y coordinate)
  color: string (hex color code)
  size: int (brush size in pixels)
  timestamp: bigint (milliseconds since epoch)
}
```

**Purpose**: Individual drawing operations (pixels/dots)  
**RLS**: Users can insert/delete in their whiteboards only  
**Indexes**: 
- `whiteboard_id` - for loading all strokes in a whiteboard
- `timestamp` - for ordering strokes by draw order

## Key Features Explained

### Real-time Synchronization

```typescript
// Subscribe to new strokes
const channel = supabase
  .channel(`whiteboard:${whiteboardId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    table: 'drawing_strokes',
    filter: `whiteboard_id=eq.${whiteboardId}`
  }, (payload) => {
    drawStroke(payload.new) // Draw received stroke
  })
  .subscribe()
```

How it works:
1. Supabase Realtime listens for INSERTs on `drawing_strokes`
2. When new stroke is inserted, it's broadcast to all subscribers
3. Client receives stroke and draws it
4. No polling needed - event-driven synchronization

### Row Level Security

Ensures only authorized users can access data:

```sql
-- Users can only insert strokes in their own whiteboards
CREATE POLICY "Users can insert strokes in their whiteboards"
  ON drawing_strokes FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM whiteboards
      WHERE id = drawing_strokes.whiteboard_id
      AND user_id = auth.uid())
  )
```

This prevents:
- Inserting strokes into someone else's whiteboard
- Viewing private whiteboards
- Deleting data you don't own

### Authentication Context

Global state management for auth:

```typescript
const { session, loading, signUp, signIn, signOut } = useAuth()

// session: Current user session (null if logged out)
// loading: Whether auth state is being checked
// signUp/signIn/signOut: Auth operations
```

Used in:
- `Home.tsx` - Redirect based on auth status
- `Dashboard.tsx` - Show user's whiteboards
- `WhiteboardPage.tsx` - Associate strokes with user
- Protected routes in `main.tsx`

## Canvas Implementation

### Drawing Mechanism

```typescript
const drawStroke = (stroke: DrawingStroke) => {
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = stroke.color
  ctx.beginPath()
  ctx.arc(stroke.x, stroke.y, stroke.size, 0, Math.PI * 2)
  ctx.fill()
}
```

Uses circles (arcs) to represent brush strokes. Benefits:
- Simple and fast rendering
- Smooth appearance across pixel sizes
- Treats each draw event as a dot, which connects visually

### Events Handled

- `onMouseDown/Up/Move` - Desktop drawing
- `onTouchStart/End/Move` - Mobile drawing
- Both call same `handleDraw()` logic
- Strokes only saved while `isDrawing = true`

### Local Optimistic Updates

```typescript
// Draw locally immediately
drawStroke(stroke)

// Then save to database (async)
await supabase.from('drawing_strokes').insert([stroke])
```

Benefits:
- No latency perception for user drawing
- Smooth drawing experience
- Database persistence happens in background

## Deployment Checklist

- [ ] Create Supabase project
- [ ] Run SQL schema creation
- [ ] Set environment variables
- [ ] Test authentication
- [ ] Test drawing and realtime sync
- [ ] Test with multiple browsers/tabs
- [ ] Deploy to Vercel (or preferred host)
- [ ] Enable custom domain
- [ ] Set up backups
- [ ] Monitor Supabase logs

## Performance Considerations

### Optimize for Large Whiteboards

If handling whiteboards with many strokes:

1. **Pagination**: Load strokes in batches
   ```typescript
   // Load first 1000 strokes, then load older ones on demand
   const { data } = await supabase
     .from('drawing_strokes')
     .select('*')
     .eq('whiteboard_id', id)
     .order('timestamp')
     .range(0, 999)
   ```

2. **Image Cache**: Render to offscreen canvas periodically
   - Reduces individual stroke redrawing

3. **Compression**: Store compressed image instead of individual strokes
   - Trade-off: lose editing capability

## Debugging

### Check Realtime Connection
```typescript
// In browser console
const subscription = supabase
  .channel('debug')
  .on('system', { event: 'login'}, payload => console.log('Realtime connected'))
  .subscribe()
```

### Monitor Database Queries
- Supabase Dashboard > SQL Editor
- Run: `SELECT * FROM drawing_strokes WHERE whiteboard_id = '...'`

### Check RLS Policies
- Dashboard > Authentication > Policies
- Ensure policies match your app logic

### Browser Console Errors
- Check for auth errors
- Check Supabase client initialization
- Verify environment variables loaded
