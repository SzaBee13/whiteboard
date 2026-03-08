import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | 'discord' | null>(null)
  const { signIn, signInWithProvider, session } = useAuth()
  const navigate = useNavigate()

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      navigate('/whiteboard')
    }
  }, [session, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
      // Navigation will happen automatically via useEffect when session updates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github' | 'discord') => {
    setError('')
    setOauthLoading(provider)
    try {
      await signInWithProvider(provider)
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to sign in with ${provider}`)
      setOauthLoading(null)
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-linear-to-br from-blue-500 to-purple-600">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">Whiteboard</h1>

        <div className="mb-6 space-y-2">
          <button
            type="button"
            onClick={() => handleOAuthSignIn('google')}
            disabled={oauthLoading !== null || loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <img src="/google/google-color.svg" alt="Google" className="h-5 w-5" />
            {oauthLoading === 'google' ? 'Connecting...' : 'Continue with Google'}
          </button>
          <button
            type="button"
            onClick={() => handleOAuthSignIn('github')}
            disabled={oauthLoading !== null || loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            <img src="/github/GitHub_Invertocat_White.svg" alt="GitHub" className="h-5 w-5" />
            {oauthLoading === 'github' ? 'Connecting...' : 'Continue with GitHub'}
          </button>
          <button
            type="button"
            onClick={() => handleOAuthSignIn('discord')}
            disabled={oauthLoading !== null || loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#5865F2] px-4 py-2 font-semibold text-white hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <img src="/discord/Discord-Symbol-White.svg" alt="Discord" className="h-5 w-5" />
            {oauthLoading === 'discord' ? 'Connecting...' : 'Continue with Discord'}
          </button>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">or</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {error && <div className="rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-blue-500 hover:text-blue-600">
            Sign up
          </Link>
        </p>
              <p className="mt-3 text-center">
                <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
                  ← Back to Home
                </Link>
              </p>
      </div>
    </div>
  )
}
