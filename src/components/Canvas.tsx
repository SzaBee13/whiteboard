import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { DrawingStroke } from '../types'

interface CanvasProps {
  whiteboardId: string
  userId: string
}

export default function Canvas({ whiteboardId, userId }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#000000')
  const [size, setSize] = useState(3)

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
          drawStroke(stroke)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [whiteboardId])

  const loadInitialStrokes = async () => {
    if (!supabase) return

    const { data } = await supabase
      .from('drawing_strokes')
      .select('*')
      .eq('whiteboard_id', whiteboardId)
      .order('timestamp', { ascending: true })

    if (data) {
      data.forEach((stroke) => {
        drawStroke(stroke)
      })
    }
  }

  const drawStroke = (stroke: DrawingStroke) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = stroke.color
    ctx.beginPath()
    ctx.arc(stroke.x, stroke.y, stroke.size, 0, Math.PI * 2)
    ctx.fill()
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDrawing(true)
    handleDraw(e)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return
    handleDraw(e)
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDrawing(true)
    handleTouchDraw(e)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDrawing) return
    handleTouchDraw(e)
  }

  const handleTouchEnd = () => {
    setIsDrawing(false)
  }

  const handleDraw = async (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    await saveStroke({ x, y })
  }

  const handleTouchDraw = async (e: React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    await saveStroke({ x, y })
  }

  const saveStroke = async (position: { x: number; y: number }) => {
    if (!supabase) return

    const stroke: DrawingStroke = {
      id: crypto.randomUUID(),
      whiteboard_id: whiteboardId,
      user_id: userId,
      x: position.x,
      y: position.y,
      color,
      size,
      timestamp: Date.now(),
    }

    // Draw locally immediately
    drawStroke(stroke)

    // Save to database
    const { error } = await supabase.from('drawing_strokes').insert([stroke])
    if (error) {
      console.error('Error saving stroke:', error)
    }
  }

  const clearCanvas = async () => {
    const canvas = canvasRef.current
    if (!canvas || !supabase) return

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    const { error } = await supabase
      .from('drawing_strokes')
      .delete()
      .eq('whiteboard_id', whiteboardId)
    
    if (error) {
      console.error('Error clearing canvas:', error)
    }
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-gray-50">
      <div className="flex items-center justify-between bg-white p-4 shadow">
        <h1 className="text-2xl font-bold text-gray-800">Collaborative Whiteboard</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Color:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-8 w-12 cursor-pointer rounded border border-gray-300"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Brush Size:</label>
            <input
              type="range"
              min="1"
              max="20"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-32"
            />
            <span className="text-sm text-gray-600">{size}px</span>
          </div>

          <button
            onClick={clearCanvas}
            className="rounded bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600"
          >
            Clear
          </button>
        </div>
      </div>

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
        className="flex-1 cursor-crosshair bg-white"
      />
    </div>
  )
}
