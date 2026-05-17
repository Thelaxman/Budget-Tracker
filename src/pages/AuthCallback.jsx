import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate('/auth'); return }
      const uid = session.user.id
      const done = localStorage.getItem(`ob_done_${uid}`)
      if (done) navigate('/dashboard')
      else navigate('/onboarding')
    })
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
      <div className="text-gray-400 text-sm">Signing you in...</div>
    </div>
  )
}