import { useEffect, useState, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Canvas from '../components/Canvas'
import type { Whiteboard, WhiteboardMember, UserProfile } from '../types'

type WhiteboardMemberRow = WhiteboardMember & {
  user_profiles: Pick<UserProfile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'avatar_color'>[] | null
}

export default function WhiteboardPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session, signOut } = useAuth()
  const [whiteboard, setWhiteboard] = useState<Whiteboard | null>(null)
  const [members, setMembers] = useState<WhiteboardMember[]>([])
  const [inviteUsername, setInviteUsername] = useState('')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null)
  const [savingVisibility, setSavingVisibility] = useState(false)
  const [inviting, setInviting] = useState(false)
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

  const loadMembers = useCallback(async () => {
    if (!supabase || !id) return

    const { data, error } = await supabase
      .from('whiteboard_members')
      .select('id, whiteboard_id, user_id, invited_by, created_at, user_profiles:user_id(id, username, display_name, avatar_url, avatar_color)')
      .eq('whiteboard_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading members:', error)
      return
    }

    const mappedMembers = (data as WhiteboardMemberRow[] | null)?.map((row) => ({
      id: row.id,
      whiteboard_id: row.whiteboard_id,
      user_id: row.user_id,
      invited_by: row.invited_by,
      created_at: row.created_at,
      user_profile: row.user_profiles?.[0] ?? undefined,
    }))

    setMembers(mappedMembers ?? [])
  }, [id])

  const loadWhiteboard = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    if (!supabase) {
      setLoadError('Supabase is not configured.')
      setLoading(false)
      return
    }

    if (!id) {
      setLoadError('Missing whiteboard id.')
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
  }, [id])

  useEffect(() => {
    if (!session || !id) {
      navigate('/login')
      return
    }

    void loadWhiteboard()
  }, [id, session, navigate, loadWhiteboard])

  const isOwner = Boolean(session?.user.id && whiteboard?.user_id && session.user.id === whiteboard.user_id)

  useEffect(() => {
    if (!isOwner || !whiteboard || whiteboard.is_public) {
      setMembers([])
      return
    }

    void loadMembers()
  }, [isOwner, whiteboard, loadMembers])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const updateBoardVisibility = async (isPublic: boolean) => {
    if (!supabase || !whiteboard || !isOwner) return

    setSavingVisibility(true)
    setSettingsMessage(null)
    setInviteError(null)

    const { data, error } = await supabase
      .from('whiteboards')
      .update({ is_public: isPublic })
      .eq('id', whiteboard.id)
      .select('*')
      .single()

    if (error || !data) {
      setInviteError(error?.message || 'Failed to update visibility.')
      setSavingVisibility(false)
      return
    }

    setWhiteboard(data)
    setSavingVisibility(false)
    setSettingsMessage(isPublic ? 'Board is now public to all signed-in users.' : 'Board is now private. Invite members by username.')

    if (!isPublic) {
      await loadMembers()
    }
  }

  const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!supabase || !whiteboard || !session || !isOwner) return

    const username = inviteUsername.trim().toLowerCase()

    if (!username) {
      setInviteError('Enter a username to invite.')
      return
    }

    setInviting(true)
    setInviteError(null)
    setSettingsMessage(null)

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, username, display_name, avatar_url, avatar_color')
      .eq('username', username)
      .single()

    if (profileError || !profile) {
      setInviteError('No user found with that username.')
      setInviting(false)
      return
    }

    if (profile.id === whiteboard.user_id) {
      setInviteError('You already own this whiteboard.')
      setInviting(false)
      return
    }

    const { error: inviteErrorResponse } = await supabase
      .from('whiteboard_members')
      .insert({
        whiteboard_id: whiteboard.id,
        user_id: profile.id,
        invited_by: session.user.id,
      })

    if (inviteErrorResponse) {
      if (inviteErrorResponse.message.toLowerCase().includes('duplicate')) {
        setInviteError('That user is already invited.')
      } else {
        setInviteError(inviteErrorResponse.message)
      }
      setInviting(false)
      return
    }

    setInviteUsername('')
    setInviting(false)
    setSettingsMessage(`Invited @${profile.username}.`)
    await loadMembers()
  }

  const handleRemoveInvite = async (member: WhiteboardMember) => {
    if (!supabase || !isOwner) return

    const { error } = await supabase
      .from('whiteboard_members')
      .delete()
      .eq('id', member.id)

    if (error) {
      setInviteError(error.message)
      return
    }

    setSettingsMessage(`Removed @${member.user_profile?.username ?? 'member'} from this board.`)
    await loadMembers()
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
              onClick={() => void loadWhiteboard()}
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
      <Canvas
        whiteboardId={whiteboard.id}
        userId={session.user.id}
        canManageBoard={isOwner}
      />

      {isOwner && (
        <div className="fixed left-4 top-4 z-20 w-full max-w-lg rounded-xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur">
          <h2 className="text-lg font-bold text-gray-900">Board Settings</h2>
          <p className="text-sm text-gray-600">Set board visibility and manage private invites.</p>

          <div className="mt-3 flex items-center gap-2">
            <label htmlFor="visibility" className="text-sm font-semibold text-gray-700">Visibility</label>
            <select
              id="visibility"
              value={whiteboard.is_public ? 'public' : 'private'}
              disabled={savingVisibility}
              onChange={(event) => void updateBoardVisibility(event.target.value === 'public')}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
            >
              <option value="public">Public: any signed-in user can edit</option>
              <option value="private">Private: invited usernames only</option>
            </select>
          </div>

          {!whiteboard.is_public && (
            <>
              <form onSubmit={handleInvite} className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={inviteUsername}
                  onChange={(event) => setInviteUsername(event.target.value.toLowerCase())}
                  placeholder="Type username to invite"
                  className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  maxLength={30}
                />
                <button
                  type="submit"
                  disabled={inviting}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {inviting ? 'Inviting...' : 'Invite'}
                </button>
              </form>

              <div className="mt-3 max-h-40 overflow-y-auto rounded border border-gray-200">
                {members.length === 0 && (
                  <p className="px-3 py-2 text-sm text-gray-500">No invited members yet.</p>
                )}
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between border-b border-gray-100 px-3 py-2 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.user_profile?.display_name ?? 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-500">@{member.user_profile?.username ?? 'unknown'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleRemoveInvite(member)}
                      className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {inviteError && <p className="mt-3 rounded bg-red-100 px-3 py-2 text-sm text-red-700">{inviteError}</p>}
          {settingsMessage && <p className="mt-3 rounded bg-green-100 px-3 py-2 text-sm text-green-700">{settingsMessage}</p>}
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-20 flex gap-2">
        <Link
          to="/profile"
          className="rounded bg-indigo-700 px-4 py-2 font-semibold text-white hover:bg-indigo-800"
        >
          Profile
        </Link>
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
