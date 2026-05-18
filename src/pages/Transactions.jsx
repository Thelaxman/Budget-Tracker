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

function formatTime(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

export default function Transactions() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [filterCat, setFilterCat] = useState('all')
  const [sortBy, setSortBy] = useState('date-desc')
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)

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
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ user_id: user.id, ...form, amount: parseFloat(form.amount) }])
      .select()
    if (error) return
    setTransactions(prev => [data[0], ...prev])
    setForm({ description: '', amount: '', type: 'spending', cat: 'Groceries', date: today() })
    setShowForm(false)
  }

  async function deleteTransaction(id) {
    setDeleting(id)
    await supabase.from('transactions').delete().eq('id', id)
    setTransactions(prev => prev.filter(t => t.id !== id))
    setDeleting(null)
  }

  let filtered = [...transactions]
  if (search) filtered = filtered.filter(t => t.description.toLowerCase().includes(search.toLowerCase()) || t.cat.toLowerCase().includes(search.toLowerCase()))
  if (filterType !== 'all') filtered = filtered.filter(t => t.type === filterType)
  if (filterCat !== 'all') filtered = filtered.filter(t => t.cat === filterCat)
  if (sortBy === 'date-desc') filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
  else if (sortBy === 'date-asc') filtered.sort((a, b) => new Date(a.date) - new Date(b.date))
  else if (sortBy === 'amount-desc') filtered.sort((a, b) => b.amount - a.amount)
  else filtered.sort((a, b) => a.amount - b.amount)

  const allCats = [...new Set(transactions.map(t => t.cat))].sort()

  // Summary totals
  const income   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const spending = transactions.filter(t => t.type === 'spending').reduce((s, t) => s + Number(t.amount), 0)
  const savings  = transactions.filter(t => t.type === 'savings').reduce((s, t) => s + Number(t.amount), 0)
  const invest   = transactions.filter(t => t.type === 'investment').reduce((s, t) => s + Number(t.amount), 0)

  const inputCls = "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all"

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
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold px-4 py-2.5 rounded-full hover:opacity-80 transition-opacity"
          >
            <span className="text-base leading-none">+</span>
            Add transaction
          </button>
        </div>

        {/* Summary row */}
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

        {/* Add form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <form onSubmit={addTransaction}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">New transaction</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Description</label>
                    <input type="text" value={form.description} onChange={e => updateForm('description', e.target.value)}
                      placeholder="e.g. Whole Foods" required className={inputCls + ' w-full'} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Amount ($)</label>
                    <input type="number" value={form.amount} onChange={e => updateForm('amount', e.target.value)}
                      placeholder="0.00" min="0" step="0.01" required className={inputCls + ' w-full'} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Date</label>
                    <input type="date" value={form.date} onChange={e => updateForm('date', e.target.value)} className={inputCls + ' w-full'} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Type</label>
                    <select value={form.type} onChange={e => updateForm('type', e.target.value)} className={inputCls + ' w-full'}>
                      <option value="spending">Spending</option>
                      <option value="savings">Savings</option>
                      <option value="investment">Investment</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Category</label>
                    <select value={form.cat} onChange={e => updateForm('cat', e.target.value)} className={inputCls + ' w-full'}>
                      {(CATS[form.type] || []).map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-4 justify-end">
                  <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-400 hover:text-gray-600 px-4 py-2">Cancel</button>
                  <button type="submit" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold px-5 py-2 rounded-full hover:opacity-80 transition-opacity">Add</button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">⌕</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search transactions..."
              className="w-full pl-8 pr-4 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl outline-none focus:border-blue-400 transition-all"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border transition-all ${
              showFilters
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400'
            }`}
          >
            ⊟ Filter {filterType !== 'all' || filterCat !== 'all' ? '·' : ''}
          </button>

          {/* Sort */}
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
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex flex-wrap gap-3">
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
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <div className="col-span-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</div>
              <div className="col-span-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Description</div>
              <div className="col-span-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Category</div>
              <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Amount</div>
            </div>

            {/* Rows */}
            <AnimatePresence>
              {filtered.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: i < 20 ? i * 0.02 : 0 }}
                  className="grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group items-center"
                >
                  {/* Date */}
                  <div className="col-span-3">
                    <div className="text-sm text-gray-800 dark:text-gray-200">{formatDate(t.date)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{formatTime(t.date)}</div>
                  </div>

                  {/* Description */}
                  <div className="col-span-4 flex items-center gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${TYPE_DOT[t.type]}`} />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{t.description}</span>
                  </div>

                  {/* Category */}
                  <div className="col-span-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{t.cat}</span>
                  </div>

                  {/* Amount + delete */}
                  <div className="col-span-2 flex items-center justify-end gap-3">
                    <span className={`text-sm font-semibold tabular-nums ${TYPE_COLOR[t.type]}`}>
                      {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                    </span>
                    <button
                      onClick={() => deleteTransaction(t.id)}
                      disabled={deleting === t.id}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-xs w-5 h-5 flex items-center justify-center"
                    >
                      {deleting === t.id ? '…' : '✕'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Layout>
  )
}