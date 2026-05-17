import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const CATEGORIES = ['Subscription','Rent','Utilities','Phone','Gym','Insurance','Loan','Other']

const CAT_ICONS = {
  Subscription: '📺', Rent: '🏠', Utilities: '⚡', Phone: '📱',
  Gym: '🏋️', Insurance: '🛡️', Loan: '💳', Other: '🔁',
}

const CAT_COLORS = {
  Subscription: 'bg-purple-50 dark:bg-purple-900/20 text-purple-500',
  Rent:         'bg-blue-50 dark:bg-blue-900/20 text-blue-500',
  Utilities:    'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500',
  Phone:        'bg-teal-50 dark:bg-teal-900/20 text-teal-500',
  Gym:          'bg-green-50 dark:bg-green-900/20 text-green-500',
  Insurance:    'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500',
  Loan:         'bg-red-50 dark:bg-red-900/20 text-red-500',
  Other:        'bg-gray-100 dark:bg-gray-800 text-gray-500',
}

function fmt(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function toMonthly(r) {
  if (r.freq === 'yearly')   return r.amount / 12
  if (r.freq === 'weekly')   return r.amount * 4.33
  if (r.freq === 'biweekly') return r.amount * 2.17
  return r.amount
}

function today() { return new Date().toISOString().slice(0, 10) }

export default function Recurring() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [filterCat, setFilterCat] = useState('all')
  const [form, setForm] = useState({ name: '', amount: '', cat: 'Subscription', freq: 'monthly', due: today() })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/auth'); return }
      setUser(user)
      loadItems(user.id)
    })
  }, [])

  async function loadItems(uid) {
    const { data } = await supabase.from('recurring').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  async function addItem(e) {
    e.preventDefault()
    if (!form.name || !form.amount) return
    const { data, error } = await supabase.from('recurring').insert([{ user_id: user.id, ...form, amount: parseFloat(form.amount) }]).select()
    if (error) return
    setItems(prev => [data[0], ...prev])
    setForm({ name: '', amount: '', cat: 'Subscription', freq: 'monthly', due: today() })
    setShowForm(false)
  }

  async function deleteItem(id) {
    setDeleting(id)
    await supabase.from('recurring').delete().eq('id', id)
    setItems(prev => prev.filter(r => r.id !== id))
    setDeleting(null)
  }

  const filtered = filterCat === 'all' ? items : items.filter(r => r.cat === filterCat)
  const monthlyTotal = items.reduce((s, r) => s + toMonthly(r), 0)
  const yearlyTotal  = monthlyTotal * 12

  function daysUntil(due) {
    const diff = Math.ceil((new Date(due) - new Date()) / (1000 * 60 * 60 * 24))
    if (diff < 0)  return { label: 'Overdue', color: 'text-red-500 bg-red-50 dark:bg-red-900/20' }
    if (diff === 0) return { label: 'Due today', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' }
    if (diff <= 7)  return { label: `${diff}d`, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' }
    return { label: `${diff}d`, color: 'text-gray-400 bg-gray-100 dark:bg-gray-800' }
  }

  const inputCls = "w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all placeholder-gray-400 dark:placeholder-gray-600"

  return (
    <Layout user={user}>
      <div className="p-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Recurring</h1>
            <p className="text-sm text-gray-400 mt-0.5">{items.length} expenses · {fmt(monthlyTotal)}/mo</p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold px-4 py-2.5 rounded-full hover:opacity-80 transition-opacity"
          >
            <span className="text-lg leading-none">+</span>
            Add recurring
          </button>
        </div>

        {/* Summary cards */}
        {items.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Monthly total', value: fmt(monthlyTotal), color: 'text-red-500', span: 'col-span-2 md:col-span-1' },
              { label: 'Yearly total',  value: fmt(yearlyTotal),  color: 'text-gray-800 dark:text-white', span: '' },
              { label: 'Active',        value: items.length,      color: 'text-gray-800 dark:text-white', span: '' },
              { label: 'Daily cost',    value: fmt(monthlyTotal / 30), color: 'text-gray-800 dark:text-white', span: '' },
            ].map(s => (
              <div key={s.label} className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm ${s.span}`}>
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
              <form onSubmit={addItem} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">New recurring expense</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div><label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Name</label>
                    <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Netflix" required className={inputCls} />
                  </div>
                  <div><label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Amount ($)</label>
                    <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" min="0" step="0.01" required className={inputCls} />
                  </div>
                  <div><label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Category</label>
                    <select value={form.cat} onChange={e => setForm(f => ({ ...f, cat: e.target.value }))} className={inputCls}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Frequency</label>
                    <select value={form.freq} onChange={e => setForm(f => ({ ...f, freq: e.target.value }))} className={inputCls}>
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div><label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Next due</label>
                    <input type="date" value={form.due} onChange={e => setForm(f => ({ ...f, due: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <div className="flex gap-3 mt-4 justify-end">
                  <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-400 hover:text-gray-600 px-4 py-2 transition-colors">Cancel</button>
                  <button type="submit" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold px-5 py-2 rounded-full hover:opacity-80 transition-opacity">Add expense</button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter pills */}
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {['all', ...CATEGORIES].map(c => (
              <button
                key={c}
                onClick={() => setFilterCat(c)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                  filterCat === c
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400'
                }`}
              >
                {c === 'all' ? 'All' : c}
              </button>
            ))}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔁</div>
            <div className="text-gray-500 dark:text-gray-400 font-medium mb-1">No recurring expenses</div>
            <div className="text-gray-400 text-sm">Add subscriptions, rent, and bills to track them</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence>
              {filtered.map((r, i) => {
                const due = daysUntil(r.due)
                const monthly = toMonthly(r)
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm group hover:border-gray-200 dark:hover:border-gray-700 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${CAT_COLORS[r.cat]}`}>
                          {CAT_ICONS[r.cat]}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{r.name}</div>
                          <div className="text-xs text-gray-400">{r.cat}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteItem(r.id)}
                        disabled={deleting === r.id}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-xs"
                      >
                        {deleting === r.id ? '...' : '✕'}
                      </button>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{fmt(r.amount)}</div>
                        <div className="text-xs text-gray-400 capitalize">{r.freq}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-semibold px-2 py-1 rounded-full ${due.color}`}>{due.label}</div>
                        {r.freq !== 'monthly' && (
                          <div className="text-xs text-gray-400 mt-1">{fmt(monthly)}/mo</div>
                        )}
                      </div>
                    </div>
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