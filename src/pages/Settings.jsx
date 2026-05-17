import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const GOAL_OPTIONS = [
  { id: 'save',   icon: '🐖', label: 'Save money',     sub: 'Build up savings consistently' },
  { id: 'debt',   icon: '📉', label: 'Pay off debt',   sub: 'Reduce loans & credit cards' },
  { id: 'invest', icon: '📈', label: 'Build wealth',   sub: 'Grow investments long-term' },
  { id: 'track',  icon: '👁️', label: 'Track spending', sub: 'Know where my money goes' },
]

const STYLE_OPTIONS = [
  { id: 'zerobased', icon: '🧮', label: 'Zero-based budgeting', sub: 'Assign every dollar a job.' },
  { id: 'envelope',  icon: '✉️', label: 'Envelope budgeting',   sub: 'Allocate fixed amounts per category.' },
  { id: 'tracking',  icon: '👀', label: 'Just tracking',        sub: 'No rules, just visibility.' },
]

const EXPENSES = [
  { id: 'rent',      icon: '🏠', label: 'Rent / Mortgage', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' },
  { id: 'grocery',   icon: '🛒', label: 'Groceries',       color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-500' },
  { id: 'transport', icon: '🚗', label: 'Transport',        color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' },
  { id: 'subs',      icon: '📺', label: 'Subscriptions',   color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-500' },
  { id: 'other',     icon: '•••',label: 'Other',            color: 'bg-red-50 dark:bg-red-900/20 text-red-500' },
]

function fmt(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function Settings() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [profile, setProfile] = useState({ name: '', email: '' })
  const [plan, setPlan] = useState({
    goal: 'save', income: '', payFreq: 'monthly',
    expenses: { rent: '', grocery: '', transport: '', subs: '', other: '' },
    style: 'zerobased',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/auth'); return }
      setUser(user)
      setProfile({ name: '', email: user.email || '' })

      const saved = localStorage.getItem(`ob_data_${user.id}`)
      if (saved) {
        const d = JSON.parse(saved)
        setProfile(p => ({ ...p, name: d.name || '' }))
        setPlan({
          goal:     d.goal     || 'save',
          income:   d.income   || '',
          payFreq:  d.payFreq  || 'monthly',
          expenses: d.expenses || { rent: '', grocery: '', transport: '', subs: '', other: '' },
          style:    d.style    || 'zerobased',
        })
      }
      setLoading(false)
    })
  }, [])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  function saveAll() {
    setSaving(true)
    const totalExp = Object.values(plan.expenses).reduce((s, v) => s + (parseFloat(v) || 0), 0)
    const surplus  = (parseFloat(plan.income) || 0) - totalExp
    localStorage.setItem(`ob_data_${user.id}`, JSON.stringify({ ...plan, name: profile.name, totalExp, surplus }))
    localStorage.setItem(`ob_done_${user.id}`, '1')
    setTimeout(() => { setSaving(false); showToast('✓ Settings saved') }, 400)
  }

  const totalExp = Object.values(plan.expenses).reduce((s, v) => s + (parseFloat(v) || 0), 0)
  const surplus  = (parseFloat(plan.income) || 0) - totalExp

  const inputCls = "w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all placeholder-gray-400 dark:placeholder-gray-600"

  if (loading) return (
    <Layout user={user}>
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    </Layout>
  )

  return (
    <Layout user={user}>
      <div className="p-6 max-w-2xl mx-auto">

        {/* Toast */}
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium px-5 py-2.5 rounded-full shadow-lg z-50 whitespace-nowrap">
            {toast}
          </motion.div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Profile & Settings</h1>
            <p className="text-sm text-gray-400 mt-0.5">Update your profile and financial plan</p>
          </div>
          <button
            onClick={saveAll}
            disabled={saving}
            className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>

        {/* Profile */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm mb-4">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">{profile.name ? profile.name[0].toUpperCase() : user?.email?.[0].toUpperCase()}</span>
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">{profile.name || 'Your name'}</div>
              <div className="text-sm text-gray-400">{profile.email}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">First name</label>
              <input type="text" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Your name" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Email</label>
              <input type="email" value={profile.email} disabled className={inputCls + ' opacity-50 cursor-not-allowed'} />
            </div>
          </div>
        </div>

        {/* Income */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm mb-4">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">💰 Income</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Monthly income ($)</label>
              <input type="number" value={plan.income} onChange={e => setPlan(p => ({ ...p, income: e.target.value }))} placeholder="e.g. 5000" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Pay frequency</label>
              <select value={plan.payFreq} onChange={e => setPlan(p => ({ ...p, payFreq: e.target.value }))} className={inputCls}>
                <option value="monthly">Monthly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm mb-4">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">🏠 Monthly expenses</div>
          <div className="flex flex-col gap-3">
            {EXPENSES.map(exp => (
              <div key={exp.id} className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${exp.color}`}>{exp.icon}</div>
                <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">{exp.label}</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    value={plan.expenses[exp.id]}
                    onChange={e => setPlan(p => ({ ...p, expenses: { ...p.expenses, [exp.id]: e.target.value } }))}
                    placeholder="0"
                    className="w-28 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl pl-7 pr-3 py-2 text-sm text-right outline-none focus:border-blue-400 transition-all"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Surplus */}
          {plan.income && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`mt-4 rounded-xl px-4 py-3 flex justify-between items-center ${surplus >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly surplus</span>
              <span className={`text-sm font-bold ${surplus >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                {fmt(surplus)}
              </span>
            </motion.div>
          )}
        </div>

        {/* Goal */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm mb-4">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">🎯 Main goal</div>
          <div className="grid grid-cols-2 gap-3">
            {GOAL_OPTIONS.map(g => (
              <button key={g.id} onClick={() => setPlan(p => ({ ...p, goal: g.id }))}
                className={`text-left p-4 rounded-2xl border-2 transition-all ${
                  plan.goal === g.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-600'
                }`}>
                <div className="text-2xl mb-2">{g.icon}</div>
                <div className={`text-sm font-semibold mb-0.5 ${plan.goal === g.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>{g.label}</div>
                <div className="text-xs text-gray-400">{g.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Budget style */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm mb-4">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">📊 Budget style</div>
          <div className="flex flex-col gap-3">
            {STYLE_OPTIONS.map(s => (
              <button key={s.id} onClick={() => setPlan(p => ({ ...p, style: s.id }))}
                className={`text-left flex items-start gap-4 p-4 rounded-2xl border-2 transition-all ${
                  plan.style === s.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-600'
                }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${plan.style === s.id ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700'}`}>
                  {s.icon}
                </div>
                <div>
                  <div className={`text-sm font-semibold mb-1 ${plan.style === s.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>{s.label}</div>
                  <div className="text-xs text-gray-400">{s.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-100 dark:border-red-900/30 p-5 shadow-sm mb-4">
          <div className="text-sm font-semibold text-red-500 mb-4">⚠️ Danger zone</div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Sign out</div>
                <div className="text-xs text-gray-400">Sign out of your account on this device</div>
              </div>
              <button onClick={async () => { await supabase.auth.signOut(); navigate('/') }}
                className="text-sm font-medium text-red-500 border border-red-200 dark:border-red-900/50 px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                Sign out
              </button>
            </div>
            <div className="h-px bg-gray-100 dark:bg-gray-800" />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Reset plan</div>
                <div className="text-xs text-gray-400">Clear your onboarding data and start fresh</div>
              </div>
              <button onClick={() => {
                localStorage.removeItem(`ob_data_${user.id}`)
                localStorage.removeItem(`ob_done_${user.id}`)
                showToast('Plan reset — redirecting to onboarding')
                setTimeout(() => navigate('/onboarding'), 1500)
              }}
                className="text-sm font-medium text-red-500 border border-red-200 dark:border-red-900/50 px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                Reset plan
              </button>
            </div>
          </div>
        </div>

        {/* Save button bottom */}
        <button onClick={saveAll} disabled={saving}
          className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold py-3.5 rounded-full text-sm hover:opacity-80 transition-opacity disabled:opacity-50">
          {saving ? 'Saving...' : 'Save all changes'}
        </button>

      </div>
    </Layout>
  )
}