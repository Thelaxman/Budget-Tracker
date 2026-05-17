import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import Chart from 'chart.js/auto'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const CAT_COLORS = ['#1a6ef5','#0d9e8a','#c47b0a','#e53e3e','#7c3aed','#0891b2','#059669','#dc2626']

function fmt(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [curMonth, setCurMonth] = useState(new Date().getMonth())
  const [curYear, setCurYear] = useState(new Date().getFullYear())
  const [obData, setObData] = useState(null)
  const donutRef = useRef(null)
  const barRef = useRef(null)
  const donutChart = useRef(null)
  const barChart = useRef(null)

  async function loadTransactions(uid) {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', uid)
      .order('date', { ascending: false })
    setTransactions(data || [])
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/auth'); return }
      setUser(user)
      const saved = localStorage.getItem(`ob_data_${user.id}`)
      if (saved) setObData(JSON.parse(saved))
      loadTransactions(user.id)
    })
  }, [navigate])

  const monthTx = transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00')
    return d.getMonth() === curMonth && d.getFullYear() === curYear
  })

  const income   = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const spending = monthTx.filter(t => t.type === 'spending').reduce((s, t) => s + Number(t.amount), 0)
  const savings  = monthTx.filter(t => t.type === 'savings').reduce((s, t) => s + Number(t.amount), 0)
  const invest   = monthTx.filter(t => t.type === 'investment').reduce((s, t) => s + Number(t.amount), 0)
  const balance  = +(income - spending - savings - invest).toFixed(2)

  const prevMonth = curMonth === 0 ? 11 : curMonth - 1
  const prevYear  = curMonth === 0 ? curYear - 1 : curYear
  const prevTx    = transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00')
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear
  })
  const prevSpending = prevTx.filter(t => t.type === 'spending').reduce((s, t) => s + Number(t.amount), 0)
  const spendDelta   = prevSpending > 0 ? Math.round(((spending - prevSpending) / prevSpending) * 100) : null

  const catMap = {}
  monthTx.filter(t => t.type === 'spending').forEach(t => {
    catMap[t.cat] = (catMap[t.cat] || 0) + Number(t.amount)
  })
  const catLabels = Object.keys(catMap)
  const catVals   = catLabels.map(c => +catMap[c].toFixed(2))

  const recent = [...monthTx].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)

  // Charts
  useEffect(() => {
    if (loading) return
    if (donutChart.current) donutChart.current.destroy()
    if (donutRef.current) {
      donutChart.current = new Chart(donutRef.current, {
        type: 'doughnut',
        data: {
          labels: catLabels.length ? catLabels : ['No data'],
          datasets: [{
            data: catVals.length ? catVals : [1],
            backgroundColor: catVals.length ? CAT_COLORS.slice(0, catLabels.length) : ['#f1f5f9'],
            borderWidth: 0,
            hoverOffset: 4,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '68%',
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${fmt(ctx.parsed)}` } }
          }
        }
      })
    }
    if (barChart.current) barChart.current.destroy()
    if (barRef.current) {
      barChart.current = new Chart(barRef.current, {
        type: 'bar',
        data: {
          labels: ['This month'],
          datasets: [
            { label: 'Income',     data: [+income.toFixed(2)],   backgroundColor: '#1a6ef5', borderRadius: 6 },
            { label: 'Spending',   data: [+spending.toFixed(2)], backgroundColor: '#e53e3e', borderRadius: 6 },
            { label: 'Savings',    data: [+savings.toFixed(2)],  backgroundColor: '#0d9e8a', borderRadius: 6 },
            { label: 'Investment', data: [+invest.toFixed(2)],   backgroundColor: '#c47b0a', borderRadius: 6 },
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { font: { size: 11 }, color: '#94a3b8', boxWidth: 10, borderRadius: 2 } } },
          scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
            y: { ticks: { color: '#94a3b8', callback: v => '$' + v }, grid: { color: 'rgba(0,0,0,0.04)' } }
          }
        }
      })
    }
    return () => {
      donutChart.current?.destroy()
      barChart.current?.destroy()
    }
  }, [loading, catLabels, catVals, income, invest, savings, spending])

  const metrics = [
    { label: 'Income',      value: fmt(income),   color: 'text-blue-500',  bg: 'bg-blue-50',  icon: '↑', delta: null },
    { label: 'Spending',    value: fmt(spending),  color: 'text-red-500',   bg: 'bg-red-50',   icon: '↓', delta: spendDelta },
    { label: 'Savings',     value: fmt(savings),   color: 'text-teal-500',  bg: 'bg-teal-50',  icon: '🐖', delta: null },
    { label: 'Investments', value: fmt(invest),    color: 'text-amber-500', bg: 'bg-amber-50', icon: '📈', delta: null },
    { label: 'Balance',     value: fmt(balance),   color: balance >= 0 ? 'text-green-500' : 'text-red-500', bg: balance >= 0 ? 'bg-green-50' : 'bg-red-50', icon: '◎', delta: null },
  ]

  if (loading) return (
    <Layout user={user}>
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    </Layout>
  )

  return (
    <Layout user={user}>
      <div className="p-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {obData?.name ? `Hey, ${obData.name} 👋` : 'Dashboard'}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{MONTHS[curMonth]} {curYear}</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={curMonth}
              onChange={e => setCurMonth(+e.target.value)}
              className="text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400"
            >
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select
              value={curYear}
              onChange={e => setCurYear(+e.target.value)}
              className="text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400"
            >
              {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Onboarding surplus banner */}
        {obData && obData.surplus !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-500 to-teal-400 rounded-2xl p-4 mb-6 flex items-center justify-between"
          >
            <div>
              <div className="text-white font-semibold text-sm">Monthly surplus from your plan</div>
              <div className="text-blue-100 text-xs mt-0.5">Based on your onboarding setup</div>
            </div>
            <div className="text-white font-bold text-xl">{fmt(obData.surplus)}</div>
          </motion.div>
        )}

        {/* Metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
            >
              <div className={`w-8 h-8 ${m.bg} rounded-lg flex items-center justify-center text-sm mb-3`}>
                {m.icon}
              </div>
              <div className="text-xs font-medium text-gray-400 mb-1">{m.label}</div>
              <div className={`text-lg font-bold ${m.color}`}>{m.value}</div>
              {m.delta !== null && (
                <div className={`text-xs font-medium mt-1 ${m.delta > 0 ? 'text-red-400' : 'text-green-500'}`}>
                  {m.delta > 0 ? '↑' : '↓'} {Math.abs(m.delta)}% vs last month
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Spending by category
            </div>
            <div className="relative h-48">
              <canvas ref={donutRef}></canvas>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {catLabels.map((l, i) => (
                <span key={l} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-2 h-2 rounded-sm inline-block" style={{ background: CAT_COLORS[i] }}></span>
                  {l}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Monthly overview
            </div>
            <div className="relative h-48">
              <canvas ref={barRef}></canvas>
            </div>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Recent transactions
            </div>
            <button
              onClick={() => navigate('/transactions')}
              className="text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors"
            >
              View all →
            </button>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No transactions this month.{' '}
              <button onClick={() => navigate('/transactions')} className="text-blue-500 hover:underline">
                Add one →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recent.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${
                      t.type === 'income' ? 'bg-green-50 text-green-500' :
                      t.type === 'savings' ? 'bg-blue-50 text-blue-500' :
                      t.type === 'investment' ? 'bg-amber-50 text-amber-500' :
                      'bg-red-50 text-red-500'
                    }`}>
                      {t.type === 'income' ? '↑' : t.type === 'savings' ? '🐖' : t.type === 'investment' ? '📈' : '↓'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{t.description}</div>
                      <div className="text-xs text-gray-400">{t.cat} · {t.date}</div>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${
                    t.type === 'income' ? 'text-green-500' :
                    t.type === 'savings' ? 'text-blue-500' :
                    t.type === 'investment' ? 'text-amber-500' :
                    'text-red-500'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Layout>
  )
}