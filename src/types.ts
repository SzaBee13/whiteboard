export interface DrawingStroke {
  id: string
  whiteboard_id: string
  user_id: string
  x: number
  y: number
  color: string
  size: number
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
