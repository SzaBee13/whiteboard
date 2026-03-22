import { useEffect, useState, useCallback } from 'react'
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
  const [loadError, setLoadError] = useState<string | null>(null)

  const withTimeout = async <T,>(promise: PromiseLike<T>, ms: number): Promise<T> => {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out. Please try again.')), ms)
      }),
    ])
  }

  const loadWhiteboard = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    if (!supabase) {
      setLoadError('Supabase is not configured.')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('whiteboards')
          .select('*')
          .eq('id', id)
          .single(),
        10000,
      )

      if (error || !data) {
        console.error('Error loading whiteboard:', error)
        setLoadError(error?.message || 'Whiteboard not found.')
        setWhiteboard(null)
        return
      }

      setWhiteboard(data)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load whiteboard.')
      setWhiteboard(null)
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    if (!session || !id) {
      navigate('/login')
      return
    }

    loadWhiteboard()
  }, [id, session, navigate, loadWhiteboard])

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

  if (loadError) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-6 text-center shadow-lg">
          <p className="mb-4 text-red-700">{loadError}</p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => loadWhiteboard()}
              className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/whiteboard')}
              className="rounded bg-gray-600 px-4 py-2 font-semibold text-white hover:bg-gray-700"
            >
              Back
            </button>
          </div>
        </div>
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
