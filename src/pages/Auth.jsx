import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSignIn(e) {
    e.preventDefault()
    setError(''); setMessage(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
    else navigate('/onboarding')
  }

  async function handleSignUp(e) {
    e.preventDefault()
    setError(''); setMessage(''); 
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) setError(error.message)
    else setMessage('Check your email to confirm your account!')
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/onboarding` }
    })
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-500 to-teal-400 flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="text-white font-semibold text-base">Budget Tracker</span>
        </Link>

        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-white leading-tight mb-6">
              Take control of<br />your finances today
            </h2>
            <p className="text-blue-100 text-base leading-relaxed mb-10">
              Track spending, set goals, and build better money habits — all in one beautiful dashboard.
            </p>
          </motion.div>

          {/* Feature pills */}
          <div className="flex flex-col gap-3">
            {[
              '📊 Visual spending insights',
              '🎯 Goal tracking & milestones',
              '🔁 Recurring expense manager',
              '📬 Bi-weekly email reports',
            ].map((f, i) => (
              <motion.div
                key={f}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3"
              >
                <span className="text-sm text-white font-medium">{f}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-blue-100 text-sm">© 2026 budget.cloudgeekpro.com</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-semibold text-gray-900">Budget Tracker</span>
          </Link>

          {/* Tab toggle */}
          <div className="flex bg-gray-100 rounded-full p-1 mb-8">
            {['login', 'signup'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setMessage('') }}
                className={`flex-1 py-2 text-sm font-medium rounded-full transition-all ${
                  tab === t
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: tab === 'login' ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: tab === 'login' ? 10 : -10 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {tab === 'login' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="text-sm text-gray-400 mb-8">
                {tab === 'login'
                  ? 'Sign in to access your dashboard'
                  : 'Start tracking your finances for free'}
              </p>

              {/* Error / success */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-5 font-medium"
                >
                  {error}
                </motion.div>
              )}
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded-xl mb-5 font-medium"
                >
                  {message}
                </motion.div>
              )}

              <form onSubmit={tab === 'login' ? handleSignIn : handleSignUp}>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                {tab === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-4"
                  >
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                      Confirm password
                    </label>
                    <input
                      type="password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-900 text-white font-semibold py-3.5 rounded-full text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 mt-2 mb-4"
                >
                  {loading ? 'Please wait...' : tab === 'login' ? 'Sign in' : 'Create account'}
                </button>
              </form>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-100"></div>
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-100"></div>
              </div>

              <button
                onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-full py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
                </svg>
                Continue with Google
              </button>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}