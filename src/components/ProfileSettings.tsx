import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function ProfileSettings() {
  const { userProfile, updateProfile } = useAuth()
  const [displayName, setDisplayName] = useState(userProfile?.display_name || '')
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || '')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!displayName.trim()) return

    setIsSaving(true)
    try {
      await updateProfile({
        display_name: displayName.trim(),
        avatar_url: avatarUrl.trim() || null,
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setDisplayName(userProfile?.display_name || '')
    setAvatarUrl(userProfile?.avatar_url || '')
    setIsEditing(false)
  }

  if (!userProfile) return null

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Profile</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Edit
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white"
          style={{ backgroundColor: userProfile.avatar_color }}
        >
          {userProfile.avatar_url ? (
            <img
              src={userProfile.avatar_url}
              alt={userProfile.display_name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            userProfile.display_name.charAt(0).toUpperCase()
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Your display name"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avatar URL (optional)
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !displayName.trim()}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-900">
                {userProfile.display_name}
              </p>
              {userProfile.avatar_url && (
                <p className="text-sm text-gray-500 truncate max-w-xs">
                  {userProfile.avatar_url}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
