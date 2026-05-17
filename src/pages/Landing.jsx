import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const features = [
  {
    icon: '💰',
    title: 'Track every dollar',
    desc: 'Log income, spending, savings and investments in one place. Know exactly where your money goes.',
  },
  {
    icon: '📊',
    title: 'Spending insights',
    desc: 'Visual charts and trends show your habits over time. Spot patterns and cut what you don\'t need.',
  },
  {
    icon: '🎯',
    title: 'Set & hit goals',
    desc: 'Create savings and investment goals with progress tracking. Stay motivated with visual milestones.',
  },
  {
    icon: '🔁',
    title: 'Recurring expenses',
    desc: 'Track subscriptions, rent, and bills automatically. Never lose track of your fixed monthly costs.',
  },
  {
    icon: '📬',
    title: 'Bi-weekly reports',
    desc: 'Get a clean summary of your finances emailed to you every two weeks. Stay on top effortlessly.',
  },
  {
    icon: '🔒',
    title: 'Private & secure',
    desc: 'Your data is yours. Hosted on AWS with Supabase row-level security. No ads, no selling your data.',
  },
]

const stats = [
  { value: '100%', label: 'Free to use' },
  { value: '$0', label: 'Hidden fees' },
  { value: '6', label: 'Months of insights' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
}

export default function Landing() {
  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            Free • No credit card required
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6"
          >
            Take control of{' '}
            <span className="bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent">
              your money
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Budget Tracker helps you understand where your money goes, build better habits,
            and reach your financial goals — all in one beautiful dashboard.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link
              to="/auth"
              className="bg-gray-900 text-white px-8 py-3.5 rounded-full font-medium text-sm hover:bg-gray-700 transition-colors"
            >
              Start tracking for free →
            </Link>
            <a
              href="#features"
              className="border border-gray-200 text-gray-600 px-8 py-3.5 rounded-full font-medium text-sm hover:border-gray-400 transition-colors"
            >
              See how it works
            </a>
          </motion.div>
        </div>

        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="max-w-4xl mx-auto mt-16"
        >
          <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-100 p-6 shadow-xl shadow-gray-100">
            {/* Mock dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Income', value: '$5,200', color: 'text-blue-500', bg: 'bg-blue-50' },
                { label: 'Spending', value: '$2,840', color: 'text-red-500', bg: 'bg-red-50' },
                { label: 'Savings', value: '$1,200', color: 'text-teal-500', bg: 'bg-teal-50' },
                { label: 'Balance', value: '$1,160', color: 'text-green-500', bg: 'bg-green-50' },
              ].map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                  className="bg-white rounded-xl border border-gray-100 p-4"
                >
                  <div className={`w-7 h-7 ${card.bg} rounded-lg mb-2`}></div>
                  <div className="text-xs text-gray-400 font-medium mb-1">{card.label}</div>
                  <div className={`text-lg font-bold ${card.color}`}>{card.value}</div>
                </motion.div>
              ))}
            </div>
            {/* Mock chart bars -->*/}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Monthly overview</div>
              <div className="flex items-end gap-2 h-24">
                {[60, 85, 45, 70, 55, 90, 65, 80, 50, 75, 88, 62].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 0.6 + i * 0.04, duration: 0.4 }}
                    className={`flex-1 rounded-t-md ${i % 2 === 0 ? 'bg-blue-100' : 'bg-teal-100'}`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => (
                  <span key={m} className="text-xs text-gray-300 flex-1 text-center">{m}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-gray-100 bg-gray-50">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-8 text-center">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="text-3xl font-bold text-gray-900 mb-1">{s.value}</div>
              <div className="text-sm text-gray-400">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to budget smarter
            </h2>
            <p className="text-gray-400 text-base max-w-xl mx-auto">
              No bloat, no complexity. Just the tools that actually help you manage money better.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-gray-200 hover:shadow-md transition-all"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center bg-gradient-to-br from-blue-500 to-teal-400 rounded-3xl p-12"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to take control?
          </h2>
          <p className="text-blue-100 mb-8 text-base">
            Join thousands of people who track smarter, spend less, and save more.
          </p>
          <Link
            to="/auth"
            className="inline-block bg-white text-blue-600 font-semibold px-8 py-3.5 rounded-full text-sm hover:bg-blue-50 transition-colors"
          >
            Get started for free →
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}