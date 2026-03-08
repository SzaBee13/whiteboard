
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Home() {
  const { session, loading } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
            <span className="text-2xl">✏️</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Whiteboard</h1>
        </div>
        
        <div className="flex gap-3">
          {session ? (
            <Link
              to="/whiteboard"
              className="rounded-lg bg-white px-6 py-2.5 font-semibold text-purple-600 shadow-lg transition hover:bg-gray-100"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg border-2 border-white px-6 py-2.5 font-semibold text-white transition hover:bg-white/10"
              >
                {loading ? 'Sign In' : 'Sign In'}
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-white px-6 py-2.5 font-semibold text-purple-600 shadow-lg transition hover:bg-gray-100"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="mx-auto max-w-6xl px-8 py-20">
        <div className="text-center">
          <h2 className="mb-6 text-6xl font-extrabold leading-tight text-white">
            Collaborate in Real-Time
            <br />
            <span className="bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
              Draw Together, Anywhere
            </span>
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-xl text-white/90">
            The collaborative whiteboard that brings your team together. Draw, sketch, and brainstorm
            with real-time collaboration and powerful tools.
          </p>
          
          {!session && (
            <div className="flex justify-center gap-4">
              <Link
                to="/signup"
                className="rounded-lg bg-white px-8 py-4 text-lg font-bold text-purple-600 shadow-2xl transition hover:scale-105 hover:bg-gray-100"
              >
                Start Drawing Free →
              </Link>
              <Link
                to="/login"
                className="rounded-lg border-2 border-white px-8 py-4 text-lg font-bold text-white backdrop-blur-sm transition hover:bg-white/10"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid gap-8 md:grid-cols-3">
          {/* Feature 1 */}
          <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-md transition hover:bg-white/20">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 text-3xl">
              ⚡
            </div>
            <h3 className="mb-3 text-2xl font-bold text-white">Real-Time Sync</h3>
            <p className="text-white/80">
              See everyone's cursors and drawings appear instantly. No lag, no delays—just pure
              collaborative magic.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-md transition hover:bg-white/20">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 text-3xl">
              🎨
            </div>
            <h3 className="mb-3 text-2xl font-bold text-white">Powerful Tools</h3>
            <p className="text-white/80">
              Pen, shapes, lines, eraser—everything you need to bring your ideas to life. Full color
              palette and adjustable brush sizes.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-md transition hover:bg-white/20">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-teal-500 text-3xl">
              👥
            </div>
            <h3 className="mb-3 text-2xl font-bold text-white">See Who's There</h3>
            <p className="text-white/80">
              Watch your teammates' cursors move in real-time with their names and avatars. Know
              exactly who's working on what.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-md transition hover:bg-white/20">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 to-red-500 text-3xl">
              💾
            </div>
            <h3 className="mb-3 text-2xl font-bold text-white">Auto-Save</h3>
            <p className="text-white/80">
              Never lose your work. Every stroke is automatically saved to the cloud and synced across
              all devices.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-md transition hover:bg-white/20">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-blue-500 text-3xl">
              🌐
            </div>
            <h3 className="mb-3 text-2xl font-bold text-white">Work Anywhere</h3>
            <p className="text-white/80">
              Access your whiteboards from any device—desktop, tablet, or phone. Touch-friendly for
              tablets and iPads.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-md transition hover:bg-white/20">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 text-3xl">
              🚀
            </div>
            <h3 className="mb-3 text-2xl font-bold text-white">Lightning Fast</h3>
            <p className="text-white/80">
              Built with modern tech for blazing-fast performance. Smooth drawing experience even with
              hundreds of strokes.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        {!session && (
          <div className="mt-24 rounded-3xl bg-gradient-to-r from-white/20 to-white/10 p-12 text-center backdrop-blur-lg">
            <h3 className="mb-4 text-4xl font-bold text-white">Ready to Start Creating?</h3>
            <p className="mb-8 text-xl text-white/90">
              Join thousands of teams collaborating visually every day.
            </p>
            <Link
              to="/signup"
              className="inline-block rounded-lg bg-white px-10 py-4 text-lg font-bold text-purple-600 shadow-2xl transition hover:scale-105 hover:bg-gray-100"
            >
              Create Free Account →
            </Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 px-8 py-8 text-center text-white/60">
        <p>© 2026 Whiteboard. Built with React, Supabase, and ❤️</p>
      </footer>
    </div>
  )
}

export default Home