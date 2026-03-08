export type ToolType = 'pen' | 'line' | 'rectangle' | 'circle' | 'eraser'

export interface DrawingStroke {
  id: string
  whiteboard_id: string
  user_id: string
  tool: ToolType
  points: { x: number; y: number }[]
  color: string
  size: number
  filled?: boolean
  timestamp: number
}

export interface Whiteboard {
  id: string
  title: string
  user_id: string
  created_at: string
  updated_at: string
  is_public: boolean
}

export interface User {
  id: string
  email: string
  created_at: string
}

export interface UserProfile {
  id: string
  display_name: string
  avatar_url: string | null
  avatar_color: string
  created_at: string
  updated_at: string
}

export interface CursorPresence {
  user_id: string
  display_name: string
  avatar_url: string | null
  avatar_color: string
  x: number
  y: number
  last_seen: number
}
