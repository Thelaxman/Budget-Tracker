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

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

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

function nextDueDate(freq, from = today()) {
  const d = new Date(from)
  if (freq === 'monthly')  d.setMonth(d.getMonth() + 1)
  if (freq === 'weekly')   d.setDate(d.getDate() + 7)
  if (freq === 'biweekly') d.setDate(d.getDate() + 14)
  if (freq === 'yearly')   d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

function formatDueLabel(due) {
  const d = new Date(due + 'T00:00:00')
  const now = new Date()
  const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24))
  const day = DAYS[d.getDay()]
  const mon = MONTHS_SHORT[d.getMonth()]
  const dt  = d.getDate()

  if (diff < 0)   return { date: `${mon} ${dt}`, day: 'Overdue',   badge: 'text-red-500',   dot: 'bg-red-400' }
  if (diff === 0) return { date: `${mon} ${dt}`, day: 'Today',     badge: 'text-amber-500', dot: 'bg-amber-400' }
  if (diff === 1) return { date: `${mon} ${dt}`, day: 'Tomorrow',  badge: 'text-amber-500', dot: 'bg-amber-400' }
  if (diff <= 7)  return { date: `${mon} ${dt}`, day: day,         badge: 'text-amber-500', dot: 'bg-amber-300' }
  return           { date: `${mon} ${dt}`, day: day,               badge: 'text-gray-400',  dot: 'bg-gray-200 dark:bg-gray-700' }
}

// Group items by due date
function groupByDate(items) {
  const groups = {}
  items.forEach(r => {
    if (!groups[r.due]) groups[r.due] = []
    groups[r.due].push(r)
  })
  return Object.entries(groups).sort(([a], [b]) => new Date(a) - new Date(b))
}

export default function Recurring() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [filterCat, setFilterCat] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [loggingId, setLoggingId] = useState(null)
  const [logDate, setLogDate] = useState(today())
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ name: '', amount: '', cat: 'Subscription', freq: 'monthly', due: today() })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/auth'); return }
      setUser(user)
      loadItems(user.id)
    })
  }, [])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  async function loadItems(uid) {
    const { data } = await supabase.from('recurring').select('*').eq('user_id', uid).order('due', { ascending: true })
    setItems(data || [])
    setLoading(false)
  }

  async function addItem(e) {
    e.preventDefault()
    if (!form.name || !form.amount) return
    const { data, error } = await supabase.from('recurring').insert([{ user_id: user.id, ...form, amount: parseFloat(form.amount) }]).select()
    if (error) return
    setItems(prev => [...prev, data[0]].sort((a, b) => new Date(a.due) - new Date(b.due)))
    setForm({ name: '', amount: '', cat: 'Subscription', freq: 'monthly', due: today() })
    setShowForm(false)
    showToast('Recurring expense added')
  }

  async function deleteItem(id) {
    setDeleting(id)
    await supabase.from('recurring').delete().eq('id', id)
    setItems(prev => prev.filter(r => r.id !== id))
    setDeleting(null)
    showToast('Deleted')
  }

  function startEdit(r) {
    setEditingId(r.id)
    setEditForm({ name: r.name, amount: r.amount, cat: r.cat, freq: r.freq, due: r.due })
  }

  async function saveEdit(id) {
    const { error } = await supabase.from('recurring').update({
      name: editForm.name, amount: parseFloat(editForm.amount),
      cat: editForm.cat, freq: editForm.freq, due: editForm.due,
    }).eq('id', id)
    if (error) return
    setItems(prev => prev.map(r => r.id === id ? { ...r, ...editForm, amount: parseFloat(editForm.amount) } : r).sort((a, b) => new Date(a.due) - new Date(b.due)))
    setEditingId(null)
    showToast('Changes saved')
  }

  async function logPayment(r) {
    await supabase.from('transactions').insert([{
      user_id: user.id, description: r.name, amount: r.amount,
      type: 'spending',
      cat: r.cat === 'Gym' ? 'Health' : r.cat === 'Phone' || r.cat === 'Subscription' || r.cat === 'Insurance' || r.cat === 'Loan' ? 'Bills' : r.cat === 'Utilities' ? 'Utilities' : r.cat === 'Rent' ? 'Bills' : 'Miscellaneous',
      date: logDate,
    }])
    const newDue = nextDueDate(r.freq, logDate)
    await supabase.from('recurring').update({ due: newDue }).eq('id', r.id)
    setItems(prev => prev.map(i => i.id === r.id ? { ...i, due: newDue } : i).sort((a, b) => new Date(a.due) - new Date(b.due)))
    setLoggingId(null)
    setLogDate(today())
    showToast(`✓ Payment logged · next due ${newDue}`)
  }

  const filtered = filterCat === 'all' ? items : items.filter(r => r.cat === filterCat)
  const grouped  = groupByDate(filtered)
  const monthlyTotal = items.reduce((s, r) => s + toMonthly(r), 0)
  const yearlyTotal  = monthlyTotal * 12

  const inputCls    = "w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all placeholder-gray-400 dark:placeholder-gray-600"
  const inputSmCls  = "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-blue-400 transition-all"

  return (
    <Layout user={user}>
      <div className="p-6 max-w-3xl mx-auto">

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium px-5 py-2.5 rounded-full shadow-lg z-50 whitespace-nowrap">
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Recurring</h1>
            <p className="text-sm text-gray-400 mt-0.5">{items.length} expenses · {fmt(monthlyTotal)}/mo</p>
          </div>
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold px-4 py-2.5 rounded-full hover:opacity-80 transition-opacity">
            <span className="text-lg leading-none">+</span>
            Add recurring
          </button>
        </div>

        {/* Summary cards */}
        {items.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Monthly total', value: fmt(monthlyTotal), color: 'text-red-500',                  span: 'col-span-2 md:col-span-1' },
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
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
              <form onSubmit={addItem} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">New recurring expense</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div><label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Name</label>
                    <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Netflix" required className={inputCls} /></div>
                  <div><label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Amount ($)</label>
                    <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" min="0" step="0.01" required className={inputCls} /></div>
                  <div><label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Category</label>
                    <select value={form.cat} onChange={e => setForm(f => ({ ...f, cat: e.target.value }))} className={inputCls}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                  <div><label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Frequency</label>
                    <select value={form.freq} onChange={e => setForm(f => ({ ...f, freq: e.target.value }))} className={inputCls}>
                      <option value="monthly">Monthly</option><option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option><option value="yearly">Yearly</option></select></div>
                  <div><label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Next due</label>
                    <input type="date" value={form.due} onChange={e => setForm(f => ({ ...f, due: e.target.value }))} className={inputCls} /></div>
                </div>
                <div className="flex gap-3 mt-4 justify-end">
                  <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-400 hover:text-gray-600 px-4 py-2">Cancel</button>
                  <button type="submit" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold px-5 py-2 rounded-full hover:opacity-80 transition-opacity">Add expense</button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter pills */}
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {['all', ...CATEGORIES].map(c => (
              <button key={c} onClick={() => setFilterCat(c)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                  filterCat === c
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400'
                }`}>
                {c === 'all' ? 'All' : c}
              </button>
            ))}
          </div>
        )}

        {/* Timeline */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔁</div>
            <div className="text-gray-500 dark:text-gray-400 font-medium mb-1">No recurring expenses</div>
            <div className="text-gray-400 text-sm">Add subscriptions, rent, and bills to track them</div>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map(([date, groupItems]) => {
              const label = formatDueLabel(date)
              return (
                <div key={date}>
                  {/* Date header — Luma style */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${label.dot}`} />
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-bold text-gray-900 dark:text-white">{label.date}</span>
                      <span className={`text-sm font-medium ${label.badge}`}>{label.day}</span>
                    </div>
                  </div>

                  {/* Cards for this date */}
                  <div className="ml-5 pl-4 border-l-2 border-gray-100 dark:border-gray-800 space-y-3">
                    {groupItems.map((r, i) => {
                      const isEditing = editingId === r.id
                      const isLogging = loggingId === r.id
                      const monthly   = toMonthly(r)

                      return (
                        <motion.div key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">

                          {/* Card content */}
                          <div className="flex items-center gap-4 p-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${CAT_COLORS[r.cat]}`}>
                              {CAT_ICONS[r.cat]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{r.name}</div>
                              <div className="text-xs text-gray-400 mt-0.5 capitalize">{r.cat} · {r.freq}</div>
                            </div>
                            <div className="text-right flex-shrink-0 mr-2">
                              <div className="text-base font-bold text-gray-900 dark:text-white">{fmt(r.amount)}</div>
                              {r.freq !== 'monthly' && <div className="text-xs text-gray-400">{fmt(monthly)}/mo</div>}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button onClick={() => { setLoggingId(isLogging ? null : r.id); setEditingId(null) }}
                                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors whitespace-nowrap">
                                Log payment
                              </button>
                              <button onClick={() => { isEditing ? setEditingId(null) : startEdit(r); setLoggingId(null) }}
                                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                {isEditing ? 'Cancel' : 'Edit'}
                              </button>
                              <button onClick={() => deleteItem(r.id)} disabled={deleting === r.id}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-xs">
                                {deleting === r.id ? '...' : '✕'}
                              </button>
                            </div>
                          </div>

                          {/* Log payment panel */}
                          <AnimatePresence>
                            {isLogging && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-t border-gray-100 dark:border-gray-800">
                                <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/10 flex items-center gap-3 flex-wrap">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Log <span className="text-blue-600 dark:text-blue-400 font-bold">{fmt(r.amount)}</span> on
                                  </span>
                                  <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} className={inputSmCls} />
                                  <button onClick={() => logPayment(r)}
                                    className="text-sm font-semibold bg-blue-500 text-white px-4 py-1.5 rounded-lg hover:bg-blue-600 transition-colors">
                                    Confirm
                                  </button>
                                  <button onClick={() => setLoggingId(null)} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Edit panel */}
                          <AnimatePresence>
                            {isEditing && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-t border-gray-100 dark:border-gray-800">
                                <div className="px-4 py-4 bg-gray-50 dark:bg-gray-800/50">
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                                    <div><label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
                                      <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inputSmCls + ' w-full'} /></div>
                                    <div><label className="block text-xs font-medium text-gray-400 mb-1">Amount ($)</label>
                                      <input type="number" value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} className={inputSmCls + ' w-full'} /></div>
                                    <div><label className="block text-xs font-medium text-gray-400 mb-1">Category</label>
                                      <select value={editForm.cat} onChange={e => setEditForm(f => ({ ...f, cat: e.target.value }))} className={inputSmCls + ' w-full'}>
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                                    <div><label className="block text-xs font-medium text-gray-400 mb-1">Frequency</label>
                                      <select value={editForm.freq} onChange={e => setEditForm(f => ({ ...f, freq: e.target.value }))} className={inputSmCls + ' w-full'}>
                                        <option value="monthly">Monthly</option><option value="weekly">Weekly</option>
                                        <option value="biweekly">Bi-weekly</option><option value="yearly">Yearly</option></select></div>
                                    <div><label className="block text-xs font-medium text-gray-400 mb-1">Next due</label>
                                      <input type="date" value={editForm.due} onChange={e => setEditForm(f => ({ ...f, due: e.target.value }))} className={inputSmCls + ' w-full'} /></div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={() => saveEdit(r.id)} className="text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-1.5 rounded-lg hover:opacity-80 transition-opacity">Save</button>
                                    <button onClick={() => setEditingId(null)} className="text-sm text-gray-400 hover:text-gray-600 px-3 py-1.5">Cancel</button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}