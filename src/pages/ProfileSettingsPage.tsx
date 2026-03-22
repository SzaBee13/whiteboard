import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/

export default function ProfileSettingsPage() {
  const { session, userProfile, loading: authLoading, updateProfile } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bio, setBio] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!session) {
      navigate('/login')
    }
  }, [authLoading, navigate, session])

  useEffect(() => {
    if (!userProfile) return

    setDisplayName(userProfile.display_name)
    setUsername(userProfile.username)
    setAvatarUrl(userProfile.avatar_url ?? '')
    setBio(userProfile.bio ?? '')
  }, [userProfile])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const normalizedUsername = username.trim().toLowerCase()
    const trimmedDisplayName = displayName.trim()

    if (!trimmedDisplayName) {
      setError('Display name is required.')
      return
    }

    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      setError('Username must be 3-30 chars and use only lowercase letters, numbers, or _.')
      return
    }

    if (bio.length > 280) {
      setError('Bio cannot exceed 280 characters.')
      return
    }

    setIsSaving(true)

    try {
      await updateProfile({
        display_name: trimmedDisplayName,
        username: normalizedUsername,
        avatar_url: avatarUrl.trim() || null,
        bio: bio.trim(),
      })
      setSuccess('Profile updated successfully.')
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Failed to update profile.'
      if (message.toLowerCase().includes('duplicate') || message.toLowerCase().includes('unique')) {
        setError('That username is already taken. Try another one.')
      } else {
        setError(message)
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || !session) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-500 to-purple-600">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white">Profile Settings</h1>
          <Link
            to="/whiteboard"
            className="rounded bg-white/20 px-4 py-2 font-semibold text-white hover:bg-white/30"
          >
            Back to Boards
          </Link>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value.toLowerCase())}
                placeholder="your_username"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                maxLength={30}
                required
              />
              <p className="mt-1 text-xs text-gray-500">Used for private whiteboard invites.</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="How your name appears"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                maxLength={50}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Profile Picture URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="https://example.com/me.jpg"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={4}
                maxLength={280}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="Tell people a little about yourself"
              />
              <p className="mt-1 text-xs text-gray-500">{bio.length}/280</p>
            </div>

            {error && <p className="rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</p>}
            {success && <p className="rounded-lg bg-green-100 p-3 text-sm text-green-700">{success}</p>}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
