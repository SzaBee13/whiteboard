
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Home() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading) {
      if (session) {
        navigate('/whiteboard')
      } else {
        navigate('/login')
      }
    }
  }, [session, loading, navigate])

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-linear-to-br from-blue-500 to-purple-600">
      <p className="text-2xl font-bold text-white">Loading...</p>
    </div>
  )
}

export default Home