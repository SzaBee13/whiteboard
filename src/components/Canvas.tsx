import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { DrawingStroke, ToolType, CursorPresence } from '../types'
import UserCursor from './UserCursor'
import { useAuth } from '../context/AuthContext'

interface CanvasProps {
  whiteboardId: string
  userId: string
}

export default function Canvas({ whiteboardId, userId }: CanvasProps) {
  const { userProfile } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([])
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [tool, setTool] = useState<ToolType>('pen')
  const [color, setColor] = useState('#000000')
  const [size, setSize] = useState(3)
  const [filled, setFilled] = useState(false)
  const [strokes, setStrokes] = useState<DrawingStroke[]>([])
  const [cursors, setCursors] = useState<Map<string, CursorPresence>>(new Map())

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !supabase) return

    // Load existing strokes
    loadInitialStrokes()

    // Subscribe to new strokes
    const channel = supabase
      .channel(`whiteboard:${whiteboardId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'drawing_strokes',
          filter: `whiteboard_id=eq.${whiteboardId}`,
        },
        (payload) => {
          const stroke = payload.new as DrawingStroke
          setStrokes((prev) => {
            const newStrokes = [...prev, stroke]
            redrawCanvas(newStrokes)
            return newStrokes
          })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [whiteboardId])

  // Cursor presence tracking
  useEffect(() => {
    if (!supabase || !userProfile) return

    const presenceChannel = supabase.channel(`presence:${whiteboardId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    })

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const newCursors = new Map<string, CursorPresence>()
        
        Object.entries(state).forEach(([key, presences]) => {
          const presence = (presences[0] as unknown) as CursorPresence
          if (key !== userId && presence) {
            newCursors.set(key, presence)
          }
        })
        
        setCursors(newCursors)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: userId,
            display_name: userProfile.display_name,
            avatar_url: userProfile.avatar_url,
            avatar_color: userProfile.avatar_color,
            x: 0,
            y: 0,
            last_seen: Date.now(),
          })
        }
      })

    return () => {
      presenceChannel.unsubscribe()
    }
  }, [whiteboardId, userId, userProfile])

  const updateCursorPosition = async (x: number, y: number) => {
    if (!supabase || !userProfile) return

    const channel = supabase.channel(`presence:${whiteboardId}`)
    await channel.track({
      user_id: userId,
      display_name: userProfile.display_name,
      avatar_url: userProfile.avatar_url,
      avatar_color: userProfile.avatar_color,
      x,
      y,
      last_seen: Date.now(),
    })
  }

  const loadInitialStrokes = async () => {
    if (!supabase) return

    const { data } = await supabase
      .from('drawing_strokes')
      .select('*')
      .eq('whiteboard_id', whiteboardId)
      .order('timestamp', { ascending: true })

    if (data) {
      setStrokes(data)
      redrawCanvas(data)
    }
  }

  const redrawCanvas = (strokeList: DrawingStroke[]) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    strokeList.forEach((stroke) => {
      drawStroke(ctx, stroke)
    })
  }

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: DrawingStroke) => {
    if (stroke.points.length === 0) return

    ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color
    ctx.fillStyle = stroke.color
    ctx.lineWidth = stroke.size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (stroke.tool === 'pen' || stroke.tool === 'eraser') {
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      stroke.points.forEach((point) => {
        ctx.lineTo(point.x, point.y)
      })
      ctx.stroke()
    } else if (stroke.tool === 'line' && stroke.points.length >= 2) {
      const start = stroke.points[0]
      const end = stroke.points[stroke.points.length - 1]
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
    } else if (stroke.tool === 'rectangle' && stroke.points.length >= 2) {
      const start = stroke.points[0]
      const end = stroke.points[stroke.points.length - 1]
      const width = end.x - start.x
      const height = end.y - start.y
      ctx.beginPath()
      ctx.rect(start.x, start.y, width, height)
      if (stroke.filled) {
        ctx.fill()
      }
      ctx.stroke()
    } else if (stroke.tool === 'circle' && stroke.points.length >= 2) {
      const start = stroke.points[0]
      const end = stroke.points[stroke.points.length - 1]
      const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
      ctx.beginPath()
      ctx.arc(start.x, start.y, radius, 0, Math.PI * 2)
      if (stroke.filled) {
        ctx.fill()
      }
      ctx.stroke()
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    setStartPoint({ x, y })
    setCurrentStroke([{ x, y }])
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Broadcast cursor position
    updateCursorPosition(x, y)

    if (!isDrawing) return

    if (tool === 'pen' || tool === 'eraser') {
      setCurrentStroke((prev) => [...prev, { x, y }])
      const ctx = canvas.getContext('2d')
      if (ctx) {
        redrawCanvas(strokes)
        drawStroke(ctx, {
          id: 'temp',
          whiteboard_id: whiteboardId,
          user_id: userId,
          tool,
          points: [...currentStroke, { x, y }],
          color,
          size,
          filled,
          timestamp: Date.now(),
        })
      }
    } else if (tool === 'line' || tool === 'rectangle' || tool === 'circle') {
      const ctx = canvas.getContext('2d')
      if (ctx && startPoint) {
        redrawCanvas(strokes)
        drawStroke(ctx, {
          id: 'temp',
          whiteboard_id: whiteboardId,
          user_id: userId,
          tool,
          points: [startPoint, { x, y }],
          color,
          size,
          filled,
          timestamp: Date.now(),
        })
      }
    }
  }

  const handleMouseUp = async (e: React.MouseEvent) => {
    if (!isDrawing) return
    
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    let finalPoints: { x: number; y: number }[] = []
    
    if (tool === 'pen' || tool === 'eraser') {
      finalPoints = [...currentStroke, { x, y }]
    } else if (tool === 'line' || tool === 'rectangle' || tool === 'circle') {
      finalPoints = startPoint ? [startPoint, { x, y }] : []
    }

    await saveStroke(finalPoints)
    setIsDrawing(false)
    setCurrentStroke([])
    setStartPoint(null)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    setIsDrawing(true)
    setStartPoint({ x, y })
    setCurrentStroke([{ x, y }])
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    if (tool === 'pen' || tool === 'eraser') {
      setCurrentStroke((prev) => [...prev, { x, y }])
      const ctx = canvas.getContext('2d')
      if (ctx) {
        redrawCanvas(strokes)
        drawStroke(ctx, {
          id: 'temp',
          whiteboard_id: whiteboardId,
          user_id: userId,
          tool,
          points: [...currentStroke, { x, y }],
          color,
          size,
          filled,
          timestamp: Date.now(),
        })
      }
    } else if (tool === 'line' || tool === 'rectangle' || tool === 'circle') {
      const ctx = canvas.getContext('2d')
      if (ctx && startPoint) {
        redrawCanvas(strokes)
        drawStroke(ctx, {
          id: 'temp',
          whiteboard_id: whiteboardId,
          user_id: userId,
          tool,
          points: [startPoint, { x, y }],
          color,
          size,
          filled,
          timestamp: Date.now(),
        })
      }
    }
  }

  const handleTouchEnd = async (e: React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing || !startPoint) return

    const lastPoint = currentStroke[currentStroke.length - 1] || startPoint
    let finalPoints: { x: number; y: number }[] = []
    
    if (tool === 'pen' || tool === 'eraser') {
      finalPoints = currentStroke
    } else if (tool === 'line' || tool === 'rectangle' || tool === 'circle') {
      finalPoints = [startPoint, lastPoint]
    }

    await saveStroke(finalPoints)
    setIsDrawing(false)
    setCurrentStroke([])
    setStartPoint(null)
  }

  const saveStroke = async (points: { x: number; y: number }[]) => {
    if (!supabase || points.length === 0) return

    const stroke: DrawingStroke = {
      id: crypto.randomUUID(),
      whiteboard_id: whiteboardId,
      user_id: userId,
      tool,
      points,
      color,
      size,
      filled,
      timestamp: Date.now(),
    }

    // Update local state
    const newStrokes = [...strokes, stroke]
    setStrokes(newStrokes)
    redrawCanvas(newStrokes)

    // Save to database
    const { error } = await supabase.from('drawing_strokes').insert([stroke])
    if (error) {
      console.error('Error saving stroke:', error)
    }
  }

  const clearCanvas = async () => {
    if (!supabase) return

    setStrokes([])
    redrawCanvas([])

    const { error } = await supabase
      .from('drawing_strokes')
      .delete()
      .eq('whiteboard_id', whiteboardId)
    
    if (error) {
      console.error('Error clearing canvas:', error)
    }
  }

  const undoStroke = async () => {
    if (!supabase || strokes.length === 0) return

    const lastStroke = strokes[strokes.length - 1]
    const newStrokes = strokes.slice(0, -1)
    setStrokes(newStrokes)
    redrawCanvas(newStrokes)

    const { error } = await supabase
      .from('drawing_strokes')
      .delete()
      .eq('id', lastStroke.id)
    
    if (error) {
      console.error('Error undoing stroke:', error)
    }
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-gray-50">
      <div className="flex items-center justify-between bg-white p-4 shadow">
        <h1 className="text-2xl font-bold text-gray-800">Collaborative Whiteboard</h1>
        <div className="flex items-center gap-3">
          {/* Tool Selection */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Tool:</label>
            <div className="flex gap-1 rounded border border-gray-300 p-1">
              {(['pen', 'line', 'rectangle', 'circle', 'eraser'] as ToolType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTool(t)}
                  className={`rounded px-3 py-1 text-sm font-medium transition ${
                    tool === t
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                  title={t.charAt(0).toUpperCase() + t.slice(1)}
                >
                  {t === 'pen' && '✏️'}
                  {t === 'line' && '📏'}
                  {t === 'rectangle' && '▭'}
                  {t === 'circle' && '●'}
                  {t === 'eraser' && '🧹'}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          {tool !== 'eraser' && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Color:</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-12 cursor-pointer rounded border border-gray-300"
              />
            </div>
          )}

          {/* Filled Toggle for Shapes */}
          {(tool === 'rectangle' || tool === 'circle') && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filled:</label>
              <input
                type="checkbox"
                checked={filled}
                onChange={(e) => setFilled(e.target.checked)}
                className="h-4 w-4 cursor-pointer"
              />
            </div>
          )}

          {/* Size Slider */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Size:</label>
            <input
              type="range"
              min="1"
              max="20"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-gray-600 w-8">{size}px</span>
          </div>

          {/* Actions */}
          <button
            onClick={undoStroke}
            disabled={strokes.length === 0}
            className="rounded bg-gray-500 px-3 py-2 font-semibold text-white hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            title="Undo"
          >
            ↶
          </button>
          
          <button
            onClick={clearCanvas}
            className="rounded bg-red-500 px-3 py-2 font-semibold text-white hover:bg-red-600"
            title="Clear All"
          >
            Clear
          </button>
        </div>
      </div>

      <div ref={containerRef} className="relative flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={window.innerWidth}
          height={window.innerHeight - 80}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="cursor-crosshair bg-white"
        />
        
        {/* Render other users' cursors */}
        {Array.from(cursors.values()).map((cursor) => (
          <UserCursor key={cursor.user_id} cursor={cursor} />
        ))}
      </div>
    </div>
  )
}
