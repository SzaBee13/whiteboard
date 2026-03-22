import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { Whiteboard } from '../types'
import ProfileSettings from '../components/ProfileSettings'

export default function Dashboard() {
  const { session, loading: authLoading, signOut } = useAuth()
  const navigate = useNavigate()
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([])
  const [title, setTitle] = useState('')
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

  const loadWhiteboards = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    if (!session) {
      setLoading(false)
      return
    }

    if (!supabase) {
      setWhiteboards([])
      setLoadError('Supabase is not configured.')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('whiteboards')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false }),
        10000,
      )

      if (error) {
        console.error('Failed to load whiteboards:', error)
        setLoadError(error.message || 'Failed to load whiteboards.')
        setWhiteboards([])
      } else {
        setWhiteboards(data || [])
      }
    } catch (err) {
      console.error('Exception loading whiteboards:', err)
      setLoadError(err instanceof Error ? err.message : 'Failed to load whiteboards.')
      setWhiteboards([])
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (authLoading) return

    if (!session) {
      navigate('/login')
      return
    }

    loadWhiteboards()
  }, [session, authLoading, navigate, loadWhiteboards])

  const handleCreateWhiteboard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !session || !title.trim()) return

    const { data, error } = await supabase
      .from('whiteboards')
      .insert([
        {
          title: title.trim(),
          user_id: session.user.id,
          is_public: false,
        },
      ])
      .select()
      .single()

    if (!error && data) {
      setTitle('')
      navigate(`/whiteboard/${data.id}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!supabase) return

    await supabase.from('drawing_strokes').delete().eq('whiteboard_id', id)
    await supabase.from('whiteboards').delete().eq('id', id)

    loadWhiteboards()
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-500 to-purple-600">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white">My Whiteboards</h1>
          <button
            onClick={handleSignOut}
            className="rounded bg-red-500 px-6 py-2 font-semibold text-white hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>

        {/* Profile Settings */}
        <div className="mb-8">
          <ProfileSettings />
        </div>

        <div className="mb-8 rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-bold text-gray-800">Create New Whiteboard</h2>
          <form onSubmit={handleCreateWhiteboard} className="flex gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter whiteboard title..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              required
            />
            <button
              type="submit"
              className="rounded-lg bg-blue-500 px-6 py-2 font-semibold text-white hover:bg-blue-600"
            >
              Create
            </button>
          </form>
        </div>

        {loadError && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <p>{loadError}</p>
            <button
              onClick={() => loadWhiteboards()}
              className="rounded bg-red-600 px-3 py-1 text-sm font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {whiteboards.map((board) => (
            <div
              key={board.id}
              className="flex flex-col rounded-lg bg-white p-6 shadow-lg transition hover:shadow-xl"
            >
              <h3 className="mb-2 text-lg font-bold text-gray-800">{board.title}</h3>
              <p className="mb-4 flex-1 text-sm text-gray-600">
                Created {new Date(board.created_at).toLocaleDateString()}
              </p>
              <div className="flex gap-2">
                <Link
                  to={`/whiteboard/${board.id}`}
                  className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-center font-semibold text-white hover:bg-blue-600"
                >
                  Open
                </Link>
                <button
                  onClick={() => handleDelete(board.id)}
                  className="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {whiteboards.length === 0 && (
          <div className="rounded-lg bg-white p-12 text-center shadow-lg">
            <p className="text-lg text-gray-600">No whiteboards yet. Create one to get started!</p>
          </div>
        )}
      </div>
    </div>
  )
}
