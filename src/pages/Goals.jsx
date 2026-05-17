import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

function fmt(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function today() { return new Date().toISOString().slice(0, 10) }

const GOAL_TYPES = [
  { id: 'savings',    label: 'Savings',        icon: '🐖', color: 'from-blue-500 to-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/20',   text: 'text-blue-600 dark:text-blue-400',   bar: 'bg-blue-500' },
  { id: 'investment', label: 'Investment',     icon: '📈', color: 'from-teal-500 to-teal-400',   bg: 'bg-teal-50 dark:bg-teal-900/20',   text: 'text-teal-600 dark:text-teal-400',   bar: 'bg-teal-500' },
  { id: 'emergency',  label: 'Emergency Fund', icon: '🛡️', color: 'from-amber-500 to-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
  { id: 'vacation',   label: 'Vacation',       icon: '✈️', color: 'from-purple-500 to-purple-400',bg: 'bg-purple-50 dark:bg-purple-900/20',text: 'text-purple-600 dark:text-purple-400',bar: 'bg-purple-500' },
  { id: 'home',       label: 'Home',           icon: '🏠', color: 'from-green-500 to-green-400', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', bar: 'bg-green-500' },
  { id: 'other',      label: 'Other',          icon: '🎯', color: 'from-gray-500 to-gray-400',   bg: 'bg-gray-100 dark:bg-gray-800',     text: 'text-gray-600 dark:text-gray-400',   bar: 'bg-gray-500' },
]

function getType(id) {
  return GOAL_TYPES.find(t => t.id === id) || GOAL_TYPES[GOAL_TYPES.length - 1]
}

export default function Goals() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [addingTo, setAddingTo] = useState(null)
  const [addAmount, setAddAmount] = useState('')
  const [form, setForm] = useState({ name: '', target: '', saved: '', type: 'savings' })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/auth'); return }
      setUser(user)
      loadGoals(user.id)
    })
  }, [])

  async function loadGoals(uid) {
    const { data } = await supabase.from('goals').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    setGoals(data || [])
    setLoading(false)
  }

  async function addGoal(e) {
    e.preventDefault()
    if (!form.name || !form.target) return
    const { data, error } = await supabase.from('goals').insert([{
      user_id: user.id, name: form.name,
      target: parseFloat(form.target),
      saved: parseFloat(form.saved) || 0,
      type: form.type,
    }]).select()
    if (error) return
    setGoals(prev => [data[0], ...prev])
    setForm({ name: '', target: '', saved: '', type: 'savings' })
    setShowForm(false)
  }

  async function deleteGoal(id) {
    setDeleting(id)
    await supabase.from('goals').delete().eq('id', id)
    setGoals(prev => prev.filter(g => g.id !== id))
    setDeleting(null)
  }

  async function addSavings(goal) {
    const val = parseFloat(addAmount)
    if (!val) return
    const newSaved = Math.min(goal.target, +(goal.saved + val).toFixed(2))
    const { error } = await supabase.from('goals').update({ saved: newSaved }).eq('id', goal.id)
    if (error) return
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, saved: newSaved } : g))
    setAddingTo(null)
    setAddAmount('')
  }

  const totalSaved  = goals.reduce((s, g) => s + Number(g.saved), 0)
  const totalTarget = goals.reduce((s, g) => s + Number(g.target), 0)
  const completed   = goals.filter(g => g.saved >= g.target).length

  const inputCls = "w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all placeholder-gray-400 dark:placeholder-gray-600"

  return (
    <Layout user={user}>
      <div className="p-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Goals</h1>
            <p className="text-sm text-gray-400 mt-0.5">{goals.length} goals · {completed} completed</p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold px-4 py-2.5 rounded-full hover:opacity-80 transition-opacity"
          >
            <span className="text-lg leading-none">+</span>
            Add goal
          </button>
        </div>

        {/* Summary */}
        {goals.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Total saved',   value: fmt(totalSaved),  color: 'text-blue-500' },
              { label: 'Total target',  value: fmt(totalTarget), color: 'text-gray-800 dark:text-white' },
              { label: 'Completed',     value: `${completed} / ${goals.length}`, color: 'text-green-500' },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
                <div className="text-xs font-medium text-gray-400 mb-1">{s.label}</div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <form onSubmit={addGoal} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">New goal</div>

                {/* Type selector */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                  {GOAL_TYPES.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, type: t.id }))}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${
                        form.type === t.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      <span className="text-xl">{t.icon}</span>
                      <span className={`text-xs font-medium ${form.type === t.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div><label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Goal name</label>
                    <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Emergency Fund" required className={inputCls} />
                  </div>
                  <div><label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Target ($)</label>
                    <input type="number" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} placeholder="e.g. 10000" min="0" required className={inputCls} />
                  </div>
                  <div><label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Saved so far ($)</label>
                    <input type="number" value={form.saved} onChange={e => setForm(f => ({ ...f, saved: e.target.value }))} placeholder="0" min="0" className={inputCls} />
                  </div>
                </div>
                <div className="flex gap-3 mt-4 justify-end">
                  <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-400 hover:text-gray-600 px-4 py-2 transition-colors">Cancel</button>
                  <button type="submit" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold px-5 py-2 rounded-full hover:opacity-80 transition-opacity">Add goal</button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Goals list */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
        ) : goals.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🎯</div>
            <div className="text-gray-500 dark:text-gray-400 font-medium mb-1">No goals yet</div>
            <div className="text-gray-400 text-sm">Add a savings or investment goal to get started</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {goals.map((g, i) => {
                const type = getType(g.type)
                const pct  = Math.min(100, Math.round((g.saved / g.target) * 100))
                const done = g.saved >= g.target

                return (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm group hover:border-gray-200 dark:hover:border-gray-700 transition-all"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl ${type.bg} flex items-center justify-center text-2xl flex-shrink-0`}>
                          {type.icon}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{g.name}</div>
                          <div className={`text-xs font-medium ${type.text}`}>{type.label}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {done && (
                          <span className="text-xs font-semibold bg-green-50 dark:bg-green-900/20 text-green-500 px-2 py-1 rounded-full">✓ Done</span>
                        )}
                        <button
                          onClick={() => deleteGoal(g.id)}
                          disabled={deleting === g.id}
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-xs"
                        >
                          {deleting === g.id ? '...' : '✕'}
                        </button>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className={`font-semibold ${type.text}`}>{pct}% complete</span>
                        <span className="text-gray-400">{fmt(g.target - g.saved)} remaining</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.05 }}
                          className={`h-full rounded-full ${done ? 'bg-green-400' : type.bar}`}
                        />
                      </div>
                    </div>

                    {/* Amounts */}
                    <div className="flex justify-between text-sm mb-4">
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white">{fmt(g.saved)}</span>
                        <span className="text-gray-400 text-xs"> saved</span>
                      </div>
                      <div className="text-gray-400 text-xs">
                        of <span className="font-semibold text-gray-600 dark:text-gray-300">{fmt(g.target)}</span>
                      </div>
                    </div>

                    {/* Add savings */}
                    {!done && (
                      <AnimatePresence mode="wait">
                        {addingTo === g.id ? (
                          <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2">
                            <input
                              type="number" value={addAmount} onChange={e => setAddAmount(e.target.value)}
                              placeholder="Amount" min="0" autoFocus
                              className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 transition-all"
                            />
                            <button onClick={() => addSavings(g)} className={`text-white text-xs font-semibold px-3 py-2 rounded-xl bg-gradient-to-r ${type.color} hover:opacity-90 transition-opacity`}>Add</button>
                            <button onClick={() => { setAddingTo(null); setAddAmount('') }} className="text-gray-400 text-xs px-2 hover:text-gray-600">✕</button>
                          </motion.div>
                        ) : (
                          <motion.button
                            key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setAddingTo(g.id)}
                            className={`w-full text-xs font-semibold py-2 rounded-xl ${type.bg} ${type.text} hover:opacity-80 transition-opacity`}
                          >
                            + Add savings
                          </motion.button>
                        )}
                      </AnimatePresence>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Layout>
  )
}