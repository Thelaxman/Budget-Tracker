import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const CATS = {
  spending:   ['Groceries','Food & Dining','Shopping','Transport','Entertainment','Health','Utilities','Bills','Miscellaneous','Other'],
  savings:    ['Emergency Fund','Savings Account','Vacation Fund','Other'],
  investment: ['Stocks','ETF','Crypto','Real Estate','Bonds','Other'],
  income:     ['Salary','Freelance','Bonus','Dividends','Rental','Other'],
}

const TYPE_COLOR = {
  spending:   'text-red-500',
  savings:    'text-blue-500',
  investment: 'text-amber-500',
  income:     'text-green-500',
}

const TYPE_DOT = {
  spending:   'bg-red-400',
  savings:    'bg-blue-400',
  investment: 'bg-amber-400',
  income:     'bg-green-400',
}

function fmt(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function today() { return new Date().toISOString().slice(0, 10) }

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

export default function Transactions() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPanel, setShowPanel] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [filterCat, setFilterCat] = useState('all')
  const [sortBy, setSortBy] = useState('date-desc')
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    description: '', amount: '', type: 'spending', cat: 'Groceries', date: today()
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/auth'); return }
      setUser(user)
      loadTransactions(user.id)
    })
  }, [])

  async function loadTransactions(uid) {
    const { data } = await supabase
      .from('transactions').select('*').eq('user_id', uid).order('date', { ascending: false })
    setTransactions(data || [])
    setLoading(false)
  }

  function updateForm(key, val) {
    setForm(f => {
      const next = { ...f, [key]: val }
      if (key === 'type') next.cat = CATS[val][0]
      return next
    })
  }

  async function addTransaction(e) {
    e.preventDefault()
    if (!form.description || !form.amount) return
    setSubmitting(true)
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ user_id: user.id, ...form, amount: parseFloat(form.amount) }])
      .select()
    setSubmitting(false)
    if (error) return
    setTransactions(prev => [data[0], ...prev])
    setForm({ description: '', amount: '', type: 'spending', cat: 'Groceries', date: today() })
    setShowPanel(false)
  }

  async function deleteTransaction(id) {
    setDeleting(id)
    await supabase.from('transactions').delete().eq('id', id)
    setTransactions(prev => prev.filter(t => t.id !== id))
    setDeleting(null)
  }

  let filtered = [...transactions]
  if (search) filtered = filtered.filter(t =>
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    t.cat.toLowerCase().includes(search.toLowerCase())
  )
  if (filterType !== 'all') filtered = filtered.filter(t => t.type === filterType)
  if (filterCat !== 'all') filtered = filtered.filter(t => t.cat === filterCat)
  if (sortBy === 'date-desc') filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
  else if (sortBy === 'date-asc') filtered.sort((a, b) => new Date(a.date) - new Date(b.date))
  else if (sortBy === 'amount-desc') filtered.sort((a, b) => b.amount - a.amount)
  else filtered.sort((a, b) => a.amount - b.amount)

  const allCats = [...new Set(transactions.map(t => t.cat))].sort()

  const income   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const spending = transactions.filter(t => t.type === 'spending').reduce((s, t) => s + Number(t.amount), 0)
  const savings  = transactions.filter(t => t.type === 'savings').reduce((s, t) => s + Number(t.amount), 0)
  const invest   = transactions.filter(t => t.type === 'investment').reduce((s, t) => s + Number(t.amount), 0)

  const inputCls = "w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all"

  return (
    <Layout user={user}>
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Transactions</h1>
            <p className="text-sm text-gray-400 mt-1">{filtered.length} transactions</p>
          </div>
          <button
            onClick={() => setShowPanel(true)}
            className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold px-4 py-2.5 rounded-full hover:opacity-80 transition-opacity"
          >
            <span className="text-base leading-none">+</span>
            Add transaction
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Income',      value: fmt(income),   color: 'text-green-500' },
            { label: 'Spending',    value: fmt(spending),  color: 'text-red-500' },
            { label: 'Savings',     value: fmt(savings),   color: 'text-blue-500' },
            { label: 'Investments', value: fmt(invest),    color: 'text-amber-500' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{s.label}</div>
              <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">⌕</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search transactions..."
              className="w-full pl-8 pr-4 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl outline-none focus:border-blue-400 transition-all" />
          </div>
          <button onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border transition-all ${
              showFilters
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
            ⊟ Filter
          </button>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl px-3 py-2 outline-none focus:border-blue-400 appearance-none">
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="amount-desc">Highest amount</option>
            <option value="amount-asc">Lowest amount</option>
          </select>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex flex-wrap gap-4">
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Type</div>
                  <div className="flex gap-2 flex-wrap">
                    {['all','spending','savings','investment','income'].map(t => (
                      <button key={t} onClick={() => setFilterType(t)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all capitalize ${
                          filterType === t ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}>{t === 'all' ? 'All' : t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Category</div>
                  <div className="flex gap-2 flex-wrap">
                    {['all', ...allCats].map(c => (
                      <button key={c} onClick={() => setFilterCat(c)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                          filterCat === c ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}>{c === 'all' ? 'All categories' : c}</button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">💸</div>
            <div className="text-gray-500 dark:text-gray-400 font-medium mb-1">No transactions found</div>
            <div className="text-gray-400 text-sm">Add your first transaction to get started</div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <div className="col-span-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</div>
              <div className="col-span-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Description</div>
              <div className="col-span-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Category</div>
              <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Amount</div>
            </div>
            <AnimatePresence>
              {filtered.map((t, i) => (
                <motion.div key={t.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: i < 20 ? i * 0.02 : 0 }}
                  className="grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group items-center"
                >
                  <div className="col-span-3">
                    <div className="text-sm text-gray-800 dark:text-gray-200">{formatDate(t.date)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{formatDay(t.date)}</div>
                  </div>
                  <div className="col-span-4 flex items-center gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${TYPE_DOT[t.type]}`} />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{t.description}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{t.cat}</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-3">
                    <span className={`text-sm font-semibold tabular-nums ${TYPE_COLOR[t.type]}`}>
                      {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                    </span>
                    <button onClick={() => deleteTransaction(t.id)} disabled={deleting === t.id}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-xs w-5 h-5 flex items-center justify-center">
                      {deleting === t.id ? '…' : '✕'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Side panel overlay */}
      <AnimatePresence>
        {showPanel && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPanel(false)}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(15,15,20,0.4)', backdropFilter: 'blur(4px)' }}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl flex flex-col"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Add transaction</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Log a new income, expense or transfer</p>
                </div>
                <button onClick={() => setShowPanel(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 transition-all text-sm">
                  ✕
                </button>
              </div>

              {/* Panel body */}
              <form onSubmit={addTransaction} autoComplete="off" className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                {/* Type selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['spending','income','savings','investment'].map(t => (
                      <button key={t} type="button" onClick={() => updateForm('type', t)}
                        className={`py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                          form.type === t
                            ? t === 'spending' ? 'bg-red-50 dark:bg-red-900/20 text-red-500 border-2 border-red-200 dark:border-red-800'
                            : t === 'income' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 border-2 border-green-200 dark:border-green-800'
                            : t === 'savings' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-2 border-blue-200 dark:border-blue-800'
                            : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-2 border-amber-200 dark:border-amber-800'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-2 border-transparent'
                        }`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Description</label>
                  <input type="text" value={form.description} onChange={e => updateForm('description', e.target.value)}
                    placeholder="e.g. Whole Foods" required autoComplete="off" className={inputCls} />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                    <input type="number" value={form.amount} onChange={e => updateForm('amount', e.target.value)}
                      placeholder="0.00" min="0" step="0.01" required autoComplete="off"
                      className={inputCls + ' pl-7'} />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Category</label>
                  <select value={form.cat} onChange={e => updateForm('cat', e.target.value)} className={inputCls}>
                    {(CATS[form.type] || []).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Date</label>
                  <input type="date" value={form.date} onChange={e => updateForm('date', e.target.value)} className={inputCls} />
                </div>

              </form>

              {/* Panel footer */}
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                <button type="button" onClick={() => setShowPanel(false)}
                  className="flex-1 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  Cancel
                </button>
                <button onClick={addTransaction} disabled={submitting}
                  className="flex-1 py-2.5 text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full hover:opacity-80 transition-opacity disabled:opacity-50">
                  {submitting ? 'Adding...' : 'Add transaction'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Layout>
  )
}