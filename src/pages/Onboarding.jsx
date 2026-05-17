import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TOTAL_STEPS = 6

const goals = [
  { id: 'save', icon: '🐖', label: 'Save money', sub: 'Build up savings consistently' },
  { id: 'debt', icon: '📉', label: 'Pay off debt', sub: 'Reduce loans & credit cards' },
  { id: 'invest', icon: '📈', label: 'Build wealth', sub: 'Grow investments long-term' },
  { id: 'track', icon: '👁️', label: 'Track spending', sub: 'Know where my money goes' },
]

const styles = [
  { id: 'zerobased', icon: '🧮', label: 'Zero-based budgeting', sub: 'Assign every dollar a job. Income minus expenses = $0.' },
  { id: 'envelope', icon: '✉️', label: 'Envelope budgeting', sub: 'Allocate fixed amounts to each spending category.' },
  { id: 'tracking', icon: '👀', label: 'Just tracking', sub: 'No rules, just visibility into where money goes.' },
]

const expenses = [
  { id: 'rent', icon: '🏠', label: 'Rent / Mortgage', color: 'bg-blue-50 text-blue-500' },
  { id: 'grocery', icon: '🛒', label: 'Groceries', color: 'bg-teal-50 text-teal-500' },
  { id: 'transport', icon: '🚗', label: 'Transport', color: 'bg-amber-50 text-amber-500' },
  { id: 'subs', icon: '📺', label: 'Subscriptions', color: 'bg-purple-50 text-purple-500' },
  { id: 'other', icon: '•••', label: 'Other', color: 'bg-red-50 text-red-500' },
]

const slideVariants = {
  enter: dir => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: dir => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
}

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [dir, setDir] = useState(1)
  const [data, setData] = useState({
    name: '', goal: '', income: '', payFreq: 'monthly',
    expenses: { rent: '', grocery: '', transport: '', subs: '', other: '' },
    style: 'zerobased',
  })

  function next() { setDir(1); setStep(s => Math.min(s + 1, TOTAL_STEPS)) }
  function back() { setDir(-1); setStep(s => Math.max(s - 1, 1)) }
  function set(key, val) { setData(d => ({ ...d, [key]: val })) }
  function setExp(key, val) { setData(d => ({ ...d, expenses: { ...d.expenses, [key]: val } })) }

  const totalExp = Object.values(data.expenses).reduce((s, v) => s + (parseFloat(v) || 0), 0)
  const surplus = (parseFloat(data.income) || 0) - totalExp

  async function finish() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      localStorage.setItem(`ob_done_${user.id}`, '1')
      localStorage.setItem(`ob_data_${user.id}`, JSON.stringify({ ...data, totalExp, surplus }))
    }
    navigate('/dashboard')
  }

  function skip() { finish() }

  const pct = Math.round((step / TOTAL_STEPS) * 100)

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg">

        {/* Progress */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-teal-400 rounded-full"
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <span className="text-xs font-medium text-gray-400 whitespace-nowrap">
            {step} of {TOTAL_STEPS}
          </span>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25 }}
          >

            {/* Step 1 — Name */}
            {step === 1 && (
              <div>
                <div className="text-4xl mb-4">👋</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">What's your name?</h1>
                <p className="text-gray-400 mb-8">Let's personalize your experience.</p>
                <input
                  type="text"
                  value={data.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="First name"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-base outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            )}

            {/* Step 2 — Goal */}
            {step === 2 && (
              <div>
                <div className="text-4xl mb-4">🎯</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">What's your main goal?</h1>
                <p className="text-gray-400 mb-8">Pick the one that matters most right now.</p>
                <div className="grid grid-cols-2 gap-3">
                  {goals.map(g => (
                    <button
                      key={g.id}
                      onClick={() => set('goal', g.id)}
                      className={`text-left p-4 rounded-2xl border-2 transition-all ${
                        data.goal === g.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                      }`}
                    >
                      <div className="text-2xl mb-2">{g.icon}</div>
                      <div className={`text-sm font-semibold mb-1 ${data.goal === g.id ? 'text-blue-600' : 'text-gray-800'}`}>
                        {g.label}
                      </div>
                      <div className="text-xs text-gray-400">{g.sub}</div>
                      {data.goal === g.id && (
                        <div className="mt-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center ml-auto">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 — Income */}
            {step === 3 && (
              <div>
                <div className="text-4xl mb-4">💰</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Tell us about your income</h1>
                <p className="text-gray-400 mb-8">This helps us set up your budget baseline.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                      Monthly income ($)
                    </label>
                    <input
                      type="number"
                      value={data.income}
                      onChange={e => set('income', e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                      Pay frequency
                    </label>
                    <select
                      value={data.payFreq}
                      onChange={e => set('payFreq', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all appearance-none"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 — Expenses */}
            {step === 4 && (
              <div>
                <div className="text-4xl mb-4">🏠</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Estimate your expenses</h1>
                <p className="text-gray-400 mb-8">Rough numbers are fine — update anytime.</p>
                <div className="flex flex-col gap-3">
                  {expenses.map(exp => (
                    <div key={exp.id} className="flex items-center gap-4 bg-gray-50 rounded-2xl px-4 py-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${exp.color}`}>
                        {exp.icon}
                      </div>
                      <span className="flex-1 text-sm font-medium text-gray-700">{exp.label}</span>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <input
                          type="number"
                          value={data.expenses[exp.id]}
                          onChange={e => setExp(exp.id, e.target.value)}
                          placeholder="0"
                          className="w-28 bg-white border border-gray-200 rounded-xl pl-7 pr-3 py-2 text-sm text-right outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {data.income && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`mt-4 rounded-2xl px-4 py-3 flex justify-between items-center ${surplus >= 0 ? 'bg-green-50' : 'bg-red-50'}`}
                  >
                    <span className="text-sm font-medium text-gray-600">Monthly surplus</span>
                    <span className={`text-sm font-bold ${surplus >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      ${surplus.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </motion.div>
                )}
              </div>
            )}

            {/* Step 5 — Budget style */}
            {step === 5 && (
              <div>
                <div className="text-4xl mb-4">📊</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Pick your budget style</h1>
                <p className="text-gray-400 mb-8">You can always change this later.</p>
                <div className="flex flex-col gap-3">
                  {styles.map(s => (
                    <button
                      key={s.id}
                      onClick={() => set('style', s.id)}
                      className={`text-left flex items-start gap-4 p-4 rounded-2xl border-2 transition-all ${
                        data.style === s.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                        data.style === s.id ? 'bg-blue-500 text-white' : 'bg-white'
                      }`}>
                        {s.icon}
                      </div>
                      <div>
                        <div className={`text-sm font-semibold mb-1 ${data.style === s.id ? 'text-blue-600' : 'text-gray-800'}`}>
                          {s.label}
                        </div>
                        <div className="text-xs text-gray-400 leading-relaxed">{s.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6 — Done */}
            {step === 6 && (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center mx-auto mb-6 text-3xl"
                >
                  ✓
                </motion.div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  You're all set{data.name ? `, ${data.name}` : ''}!
                </h1>
                <p className="text-gray-400 mb-8">Your personalized dashboard is ready.</p>

                {/* Summary card */}
                <div className="bg-gray-50 rounded-2xl p-5 text-left mb-8">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      { label: 'Monthly income', value: data.income ? `$${parseFloat(data.income).toLocaleString()}` : '—', color: 'text-green-600' },
                      { label: 'Est. expenses', value: `$${totalExp.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: 'text-red-500' },
                      { label: 'Monthly surplus', value: `$${surplus.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: surplus >= 0 ? 'text-blue-600' : 'text-red-500' },
                      { label: 'Budget style', value: styles.find(s => s.id === data.style)?.label || '—', color: 'text-gray-700' },
                    ].map(item => (
                      <div key={item.label} className="bg-white rounded-xl p-3">
                        <div className="text-xs text-gray-400 mb-1">{item.label}</div>
                        <div className={`font-semibold text-sm ${item.color}`}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={finish}
                  className="w-full bg-gradient-to-r from-blue-500 to-teal-400 text-white font-semibold py-4 rounded-full text-sm hover:opacity-90 transition-opacity"
                >
                  Go to my dashboard →
                </button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {step < 6 && (
          <div className="flex items-center justify-between mt-10">
            <button
              onClick={step === 1 ? skip : back}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              {step === 1 ? 'Skip setup' : '← Back'}
            </button>
            <button
              onClick={next}
              className="bg-gray-900 text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-gray-700 transition-colors"
            >
              Continue →
            </button>
          </div>
        )}

      </div>
    </div>
  )
}