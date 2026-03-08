import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Canvas from '../components/Canvas'
import type { Whiteboard } from '../types'

export default function WhiteboardPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session, signOut } = useAuth()
  const [whiteboard, setWhiteboard] = useState<Whiteboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session || !id) {
      navigate('/login')
      return
    }

    loadWhiteboard()
  }, [id, session])

  const loadWhiteboard = async () => {
    if (!supabase) return

    const { data, error } = await supabase
      .from('whiteboards')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      console.error('Error loading whiteboard:', error)
      navigate('/whiteboard')
      return
    }

    setWhiteboard(data)
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Loading whiteboard...</p>
      </div>
    )
  }

  if (!session || !whiteboard) {
    return null
  }

  return (
    <div>
      <Canvas whiteboardId={whiteboard.id} userId={session.user.id} />
      <div className="fixed bottom-4 right-4 flex gap-2">
        <button
          onClick={() => navigate('/whiteboard')}
          className="rounded bg-gray-700 px-4 py-2 font-semibold text-white hover:bg-gray-800"
        >
          Back
        </button>
        <button
          onClick={handleSignOut}
          className="rounded bg-gray-700 px-4 py-2 font-semibold text-white hover:bg-gray-800"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
