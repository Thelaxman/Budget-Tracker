import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import Chart from 'chart.js/auto'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const CAT_COLORS = ['#1a6ef5','#0d9e8a','#c47b0a','#e53e3e','#7c3aed','#0891b2','#059669','#dc2626']

function fmt(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function Reports() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [recurring, setRecurring] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [curMonth, setCurMonth] = useState(new Date().getMonth())
  const [curYear, setCurYear] = useState(new Date().getFullYear())
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState(false)
  const trendRef = useRef(null)
  const trendChart = useRef(null)
  const catRef = useRef(null)
  const catChart = useRef(null)

  async function loadData(uid) {
    const [tx, rec, g] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', uid).order('date', { ascending: false }),
      supabase.from('recurring').select('*').eq('user_id', uid),
      supabase.from('goals').select('*').eq('user_id', uid),
    ])
    setTransactions(tx.data || [])
    setRecurring(rec.data || [])
    setGoals(g.data || [])
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/auth'); return }
      setUser(user)
      setEmail(user.email || '')
      loadData(user.id)
    })
  }, [navigate])

  function getReportTx() {
    let from, to = new Date()
    if (period === 'biweekly') { from = new Date(); from.setDate(from.getDate() - 14) }
    else if (period === 'month') { from = new Date(curYear, curMonth, 1); to = new Date(curYear, curMonth + 1, 0) }
    else if (period === 'custom' && fromDate && toDate) { from = new Date(fromDate); to = new Date(toDate) }
    else { from = new Date(curYear, curMonth, 1); to = new Date(curYear, curMonth + 1, 0) }
    return transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00')
      return d >= from && d <= to
    })
  }

  const reportTx = getReportTx()
  const income   = reportTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const spending = reportTx.filter(t => t.type === 'spending').reduce((s, t) => s + Number(t.amount), 0)
  const savings  = reportTx.filter(t => t.type === 'savings').reduce((s, t) => s + Number(t.amount), 0)
  const invest   = reportTx.filter(t => t.type === 'investment').reduce((s, t) => s + Number(t.amount), 0)
  const balance  = +(income - spending - savings - invest).toFixed(2)

  const catMap = {}
  reportTx.filter(t => t.type === 'spending').forEach(t => {
    catMap[t.cat] = (catMap[t.cat] || 0) + Number(t.amount)
  })
  const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1])

  const recurTotal = recurring.reduce((s, r) => {
    const m = r.freq === 'yearly' ? r.amount / 12 : r.freq === 'weekly' ? r.amount * 4.33 : r.freq === 'biweekly' ? r.amount * 2.17 : r.amount
    return s + m
  }, 0)

  // 6-month trend
  const now = new Date()
  const months6 = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months6.push({ m: d.getMonth(), y: d.getFullYear(), label: MONTHS_SHORT[d.getMonth()] })
  }
  const m6spending = months6.map(({ m, y }) =>
    transactions.filter(t => { const d = new Date(t.date + 'T00:00:00'); return d.getMonth() === m && d.getFullYear() === y && t.type === 'spending' })
      .reduce((s, t) => s + Number(t.amount), 0)
  )
  const m6income = months6.map(({ m, y }) =>
    transactions.filter(t => { const d = new Date(t.date + 'T00:00:00'); return d.getMonth() === m && d.getFullYear() === y && t.type === 'income' })
      .reduce((s, t) => s + Number(t.amount), 0)
  )

  useEffect(() => {
    if (loading) return
    if (trendChart.current) trendChart.current.destroy()
    if (trendRef.current) {
      trendChart.current = new Chart(trendRef.current, {
        type: 'line',
        data: {
          labels: months6.map(m => m.label),
          datasets: [
            { label: 'Spending', data: m6spending.map(v => +v.toFixed(2)), borderColor: '#e53e3e', backgroundColor: 'rgba(229,62,62,0.08)', borderWidth: 2, pointBackgroundColor: '#e53e3e', pointRadius: 4, tension: 0.4, fill: true },
            { label: 'Income',   data: m6income.map(v => +v.toFixed(2)),   borderColor: '#1a6ef5', backgroundColor: 'rgba(26,110,245,0.05)',  borderWidth: 2, pointBackgroundColor: '#1a6ef5', pointRadius: 4, tension: 0.4, fill: false },
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { font: { size: 11 }, color: '#94a3b8', boxWidth: 10 } } },
          scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
            y: { ticks: { color: '#94a3b8', callback: v => '$' + v }, grid: { color: 'rgba(0,0,0,0.04)' } }
          }
        }
      })
    }
    if (catChart.current) catChart.current.destroy()
    if (catRef.current && topCats.length) {
      catChart.current = new Chart(catRef.current, {
        type: 'doughnut',
        data: {
          labels: topCats.map(([c]) => c),
          datasets: [{ data: topCats.map(([, v]) => +v.toFixed(2)), backgroundColor: CAT_COLORS.slice(0, topCats.length), borderWidth: 0, hoverOffset: 4 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '65%',
          plugins: { legend: { position: 'right', labels: { font: { size: 11 }, color: '#94a3b8', boxWidth: 10 } } }
        }
      })
    }
    return () => { trendChart.current?.destroy(); catChart.current?.destroy() }
  }, [loading, months6, m6income, m6spending, topCats])

  function getPeriodLabel() {
    if (period === 'biweekly') return 'Last 2 weeks'
    if (period === 'month') return `${MONTHS[curMonth]} ${curYear}`
    if (period === 'custom' && fromDate && toDate) return `${fromDate} → ${toDate}`
    return 'Custom range'
  }

  function generateReport() {
    return `BUDGET REPORT — ${getPeriodLabel().toUpperCase()}
Generated: ${new Date().toLocaleDateString()}

SUMMARY
-------
Income:      ${fmt(income)}
Spending:    ${fmt(spending)}
Savings:     ${fmt(savings)}
Investments: ${fmt(invest)}
Balance:     ${fmt(balance)}

SPENDING BY CATEGORY
--------------------
${topCats.length ? topCats.map(([c, v]) => `${c.padEnd(22)} ${fmt(v)}`).join('\n') : 'No spending data'}

RECURRING EXPENSES
------------------
Est. monthly total: ${fmt(recurTotal)}
${recurring.slice(0, 6).map(r => `${r.name.padEnd(22)} ${fmt(r.amount)} (${r.freq})`).join('\n') || 'None'}

GOALS
-----
${goals.length ? goals.map(g => `${g.name.padEnd(22)} ${Math.min(100, Math.round(g.saved / g.target * 100))}% of ${fmt(g.target)}`).join('\n') : 'No goals set'}

---
budget.cloudgeekpro.com`
  }

  function copyReport() {
    navigator.clipboard.writeText(generateReport()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function emailReport() {
    if (!email) return
    const subject = encodeURIComponent(`Budget Report — ${getPeriodLabel()}`)
    const body = encodeURIComponent(generateReport())
    window.open(`mailto:${email}?subject=${subject}&body=${body}`)
  }

  const savingsRate = income > 0 ? Math.round(((savings + invest) / income) * 100) : 0
  const spendRate   = income > 0 ? Math.round((spending / income) * 100) : 0

  return (
    <Layout user={user}>
      <div className="p-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-400 mt-0.5">Financial summary & insights</p>
        </div>

        {/* Period selector */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Report period</div>
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { id: 'biweekly', label: 'Last 2 weeks' },
              { id: 'month', label: 'This month' },
              { id: 'custom', label: 'Custom range' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`text-sm font-medium px-4 py-2 rounded-full transition-all ${
                  period === p.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {period === 'month' && (
            <div className="flex gap-3">
              <select
                value={curMonth}
                onChange={e => setCurMonth(+e.target.value)}
                className="text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 appearance-none"
              >
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select
                value={curYear}
                onChange={e => setCurYear(+e.target.value)}
                className="text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 appearance-none"
              >
                {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
          )}

          {period === 'custom' && (
            <div className="flex gap-3 flex-wrap">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">From</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                  className="text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">To</label>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                  className="text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400" />
              </div>
            </div>
          )}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Income', value: fmt(income), color: 'text-blue-500', bg: 'bg-blue-50', icon: '↑' },
            { label: 'Spending', value: fmt(spending), color: 'text-red-500', bg: 'bg-red-50', icon: '↓' },
            { label: 'Savings', value: fmt(savings + invest), color: 'text-teal-500', bg: 'bg-teal-50', icon: '🐖' },
            { label: 'Balance', value: fmt(balance), color: balance >= 0 ? 'text-green-500' : 'text-red-500', bg: balance >= 0 ? 'bg-green-50' : 'bg-red-50', icon: '◎' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
            >
              <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center text-sm mb-2`}>{s.icon}</div>
              <div className="text-xs text-gray-400 mb-1">{s.label}</div>
              <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Health indicators */}
        {income > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Financial health</div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-gray-700">Spending rate</span>
                  <span className={`font-semibold ${spendRate > 80 ? 'text-red-500' : spendRate > 60 ? 'text-amber-500' : 'text-green-500'}`}>
                    {spendRate}% of income
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(spendRate, 100)}%` }}
                    transition={{ duration: 0.8 }}
                    className={`h-full rounded-full ${spendRate > 80 ? 'bg-red-400' : spendRate > 60 ? 'bg-amber-400' : 'bg-green-400'}`}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {spendRate > 80 ? '⚠️ High spending — consider cutting back' : spendRate > 60 ? '👀 Moderate — room to improve' : '✅ Healthy spending rate'}
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-gray-700">Savings rate</span>
                  <span className={`font-semibold ${savingsRate >= 20 ? 'text-green-500' : savingsRate >= 10 ? 'text-amber-500' : 'text-red-500'}`}>
                    {savingsRate}% of income
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(savingsRate, 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className={`h-full rounded-full ${savingsRate >= 20 ? 'bg-green-400' : savingsRate >= 10 ? 'bg-amber-400' : 'bg-red-400'}`}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {savingsRate >= 20 ? '🎉 Excellent! You\'re saving well' : savingsRate >= 10 ? '👍 Good — aim for 20%+' : '💡 Try to save at least 10% of income'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">6-month trend</div>
            <div className="relative h-48">
              <canvas ref={trendRef}></canvas>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Spending breakdown</div>
            {topCats.length ? (
              <div className="relative h-48">
                <canvas ref={catRef}></canvas>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No spending data</div>
            )}
          </div>
        </div>

        {/* Email report */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Email report</div>
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 min-w-48 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <button
              onClick={copyReport}
              className="flex items-center gap-2 text-sm font-medium bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-200 transition-colors"
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
            <button
              onClick={emailReport}
              className="flex items-center gap-2 text-sm font-semibold bg-gray-900 text-white px-4 py-2.5 rounded-xl hover:bg-gray-700 transition-colors"
            >
              ✉ Open in mail
            </button>
          </div>

          {/* Report preview */}
          <div className="bg-gray-50 rounded-xl p-4 font-mono text-xs text-gray-500 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
            {generateReport()}
          </div>
        </div>

      </div>
    </Layout>
  )
}