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

const TYPE_STYLES = {
  spending:   'bg-red-50 dark:bg-red-900/20 text-red-500',
  savings:    'bg-blue-50 dark:bg-blue-900/20 text-blue-500',
  investment: 'bg-amber-50 dark:bg-amber-900/20 text-amber-500',
  income:     'bg-green-50 dark:bg-green-900/20 text-green-500',
}

const TYPE_BADGE = {
  spending:   'bg-red-50 dark:bg-red-900/20 text-red-500',
  savings:    'bg-blue-50 dark:bg-blue-900/20 text-blue-500',
  investment: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
  income:     'bg-green-50 dark:bg-green-900/20 text-green-600',
}

function fmt(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function today() { return new Date().toISOString().slice(0, 10) }

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
      .from('transactions')
      .select('*')
      .eq('user_id', uid)
      .order('date', { ascending: false })
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
  if (filterType !== 'all') filtered = filtered.filter(t => t.type === filterType)
  if (filterCat !== 'all') filtered = filtered.filter(t => t.cat === filterCat)
  if (sortBy === 'date-desc') filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
  else if (sortBy === 'date-asc') filtered.sort((a, b) => new Date(a.date) - new Date(b.date))
  else if (sortBy === 'amount-desc') filtered.sort((a, b) => b.amount - a.amount)
  else filtered.sort((a, b) => a.amount - b.amount)

  const allCats = [...new Set(transactions.map(t => t.cat))].sort()
  const total = filtered.reduce((s, t) => s + Number(t.amount), 0)

  const inputCls = "w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all placeholder-gray-400 dark:placeholder-gray-600"

  return (
    <Layout user={user}>
      <div className="p-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Transactions</h1>
            <p className="text-sm text-gray-400 mt-0.5">{filtered.length} transactions · {fmt(total)}</p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold px-4 py-2.5 rounded-full hover:opacity-80 transition-opacity"
          >
            <span className="text-lg leading-none">+</span>
            Add transaction
          </button>
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
              <form
                onSubmit={addTransaction}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm"
              >
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">New transaction</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 md:col-span-1">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Description</label>
                    <input type="text" value={form.description} onChange={e => updateForm('description', e.target.value)} placeholder="e.g. Whole Foods" required className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Amount ($)</label>
                    <input type="number" value={form.amount} onChange={e => updateForm('amount', e.target.value)} placeholder="0.00" min="0" step="0.01" required className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Date</label>
                    <input type="date" value={form.date} onChange={e => updateForm('date', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Type</label>
                    <select value={form.type} onChange={e => updateForm('type', e.target.value)} className={inputCls}>
                      <option value="spending">Spending</option>
                      <option value="savings">Savings</option>
                      <option value="investment">Investment</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Category</label>
                    <select value={form.cat} onChange={e => updateForm('cat', e.target.value)} className={inputCls}>
                      {(CATS[form.type] || []).map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-4 justify-end">
                  <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-400 hover:text-gray-600 px-4 py-2 transition-colors">Cancel</button>
                  <button type="submit" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold px-5 py-2 rounded-full hover:opacity-80 transition-opacity">Add transaction</button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { el: 'select', value: filterType, onChange: e => setFilterType(e.target.value), opts: [['all','All types'],['spending','Spending'],['savings','Savings'],['investment','Investment'],['income','Income']] },
            { el: 'select', value: sortBy, onChange: e => setSortBy(e.target.value), opts: [['date-desc','Newest first'],['date-asc','Oldest first'],['amount-desc','Highest amount'],['amount-asc','Lowest amount']] },
          ].map((s, i) => (
            <select key={i} value={s.value} onChange={s.onChange} className="text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl px-3 py-2 outline-none focus:border-blue-400 appearance-none">
              {s.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl px-3 py-2 outline-none focus:border-blue-400 appearance-none">
            <option value="all">All categories</option>
            {allCats.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">💸</div>
            <div className="text-gray-500 dark:text-gray-400 font-medium mb-1">No transactions found</div>
            <div className="text-gray-400 text-sm">Add your first transaction to get started</div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <AnimatePresence>
              {filtered.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${TYPE_STYLES[t.type]}`}>
                    {t.type === 'income' ? '↑' : t.type === 'savings' ? '🐖' : t.type === 'investment' ? '📈' : '↓'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{t.description}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{t.cat} · {t.date}</div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full hidden sm:inline-flex ${TYPE_BADGE[t.type]}`}>
                    {t.type}
                  </span>
                  <div className={`text-sm font-bold flex-shrink-0 ${
                    t.type === 'income' ? 'text-green-500' :
                    t.type === 'savings' ? 'text-blue-500' :
                    t.type === 'investment' ? 'text-amber-500' : 'text-red-500'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                  </div>
                  <button
                    onClick={() => deleteTransaction(t.id)}
                    disabled={deleting === t.id}
                    className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0"
                  >
                    {deleting === t.id ? '...' : '✕'}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Layout>
  )
}