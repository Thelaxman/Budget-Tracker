import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'

const features = [
  { headline: 'Know where\nevery dollar\ngoes.', sub: 'Log income, spending, savings and investments in seconds. Your full financial picture, always in view.' },
  { headline: 'Never miss\na bill again.', sub: 'Track every subscription, rent and recurring expense. Payments log automatically when due.' },
  { headline: 'Set goals.\nHit them.', sub: 'Create savings and investment targets. Watch your progress grow with every dollar you add.' },
  { headline: 'Reports that\nactually help.', sub: 'Bi-weekly summaries land in your inbox. Spending trends, savings rate and financial health at a glance.' },
]

function FeatureSection({ section, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const { dark } = useTheme()
  const isLeft = index % 2 === 0
  const tp = dark ? '#eef0f4' : '#1a1a2e'
  const ts = dark ? '#8892a4' : '#4a4a6a'

  return (
    <section ref={ref} style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 80, maxWidth: 860, width: '100%', flexDirection: isLeft ? 'row' : 'row-reverse' }}>
        <motion.div initial={{ opacity: 0, x: isLeft ? -40 : 40 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.7 }} style={{ flex: 1, maxWidth: 360 }}>
          <h2 style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', color: tp, marginBottom: 16, whiteSpace: 'pre-line' }}>{section.headline}</h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: ts }}>{section.sub}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.6, delay: 0.1 }} style={{ flexShrink: 0, width: 160, height: 160, borderRadius: '50%', background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)', border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72, fontWeight: 900, color: dark ? 'rgba(255,255,255,0.06)' : 'rgba(26,26,46,0.08)', letterSpacing: '-0.04em' }}>
          0{index + 1}
        </motion.div>
      </div>
    </section>
  )
}

export default function Landing() {
  const { dark, setDark } = useTheme()

  const bg = dark
    ? 'linear-gradient(160deg,#16131f 0%,#1a1728 40%,#1c1830 100%)'
    : 'linear-gradient(160deg,#e8e4f8 0%,#f0eeff 40%,#e4dff8 100%)'
  const tp = dark ? '#eef0f4' : '#1a1a2e'
  const ts = dark ? '#8892a4' : '#4a4a6a'
  const navBg = dark ? 'rgba(22,19,31,0.85)' : 'rgba(232,228,248,0.75)'
  const glassBg = dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)'
  const glassBorder = dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)'

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', transition: 'background 0.3s' }}>

      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: navBg, backdropFilter: 'blur(16px)', borderBottom: `0.5px solid ${glassBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: tp, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: dark ? '#1a1a2e' : '#fff', fontWeight: 800, fontSize: 10 }}>BT</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: tp }}>Budget Tracker</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setDark(d => !d)} style={{ width: 32, height: 32, borderRadius: 8, background: glassBg, border: `0.5px solid ${glassBorder}`, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {dark ? '☀️' : '🌙'}
          </button>
          <Link to="/auth" style={{ fontSize: 13, fontWeight: 500, color: ts, textDecoration: 'none' }}>Sign in</Link>
          <Link to="/auth" style={{ background: tp, color: dark ? '#1a1a2e' : '#fff', padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Get started</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ paddingTop: 100, paddingBottom: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', overflow: 'hidden' }}>

        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: glassBg, border: `0.5px solid ${glassBorder}`, borderRadius: 999, padding: '6px 16px', fontSize: 12, fontWeight: 600, color: '#6366f1', marginBottom: 24 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
          Free · No credit card required
        </motion.div>

        {/* Headline */}
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          style={{ fontSize: 'clamp(48px,7vw,88px)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.04em', color: tp, marginBottom: 20, padding: '0 24px' }}>
          BUDGET<br />
          <span style={{ WebkitTextStroke: `3px ${tp}`, color: 'transparent' }}>SMARTER.</span><br />
          LIVE BETTER.
        </motion.h1>

        {/* Sub */}
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          style={{ fontSize: 16, lineHeight: 1.7, color: ts, maxWidth: 420, margin: '0 auto 32px', padding: '0 24px' }}>
          Track spending, set goals, and build better money habits — all in one beautiful dashboard.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
          <Link to="/auth" style={{ background: tp, color: dark ? '#1a1a2e' : '#fff', padding: '13px 32px', borderRadius: 999, fontSize: 15, fontWeight: 700, textDecoration: 'none', letterSpacing: '-0.01em' }}>
            Start for free →
          </Link>
          <a href="#features" style={{ background: glassBg, color: tp, padding: '13px 32px', borderRadius: 999, fontSize: 15, fontWeight: 600, textDecoration: 'none', border: `0.5px solid ${glassBorder}` }}>
            See how it works
          </a>
        </motion.div>

        {/* Device mockups */}
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.4 }}
          style={{ position: 'relative', width: '88%', maxWidth: 680, margin: '0 auto', paddingBottom: 80, paddingRight: 60 }}>
          {/* Laptop */}
          <img src="/455shots_so.png" alt="Budget Tracker on MacBook"
            style={{ width: '100%', height: 'auto', display: 'block', filter: 'drop-shadow(0 24px 48px rgba(99,102,241,0.2))' }} />
          {/* Phone — hard positioned relative to laptop container */}
          <img src="/991shots_so.png" alt="Budget Tracker on iPhone"
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '30%',
              height: 'auto',
              filter: 'drop-shadow(0 20px 40px rgba(99,102,241,0.4))',
            }} />
        </motion.div>
      </section>

      {/* STATS */}
      <section style={{ padding: '48px', display: 'flex', justifyContent: 'center', gap: 56, flexWrap: 'wrap', borderTop: `0.5px solid ${glassBorder}`, borderBottom: `0.5px solid ${glassBorder}`, background: glassBg, marginTop: 40 }}>
        {[{ value: '100%', label: 'Free to use' }, { value: '$0', label: 'Hidden fees' }, { value: '6mo', label: 'Of insights' }, { value: '∞', label: 'Transactions' }].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-0.03em', color: tp, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: ts, marginTop: 4, fontWeight: 500 }}>{s.label}</div>
          </motion.div>
        ))}
      </section>

      {/* FEATURES */}
      <div id="features">
        {features.map((section, i) => <FeatureSection key={i} section={section} index={i} />)}
      </div>

      {/* FINAL CTA */}
      <section style={{ padding: '100px 48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <h2 style={{ fontSize: 'clamp(36px,5.5vw,68px)', fontWeight: 900, letterSpacing: '-0.04em', color: tp, lineHeight: 1.05, marginBottom: 16 }}>
            TAKE CONTROL<br />
            <span style={{ WebkitTextStroke: `2.5px ${tp}`, color: 'transparent' }}>OF YOUR MONEY.</span>
          </h2>
          <p style={{ fontSize: 16, color: ts, marginBottom: 32, maxWidth: 360, margin: '0 auto 32px' }}>
            Free forever. No credit card. Start tracking in 60 seconds.
          </p>
          <Link to="/auth" style={{ display: 'inline-block', background: tp, color: dark ? '#1a1a2e' : '#fff', padding: '15px 40px', borderRadius: 999, fontSize: 15, fontWeight: 700, textDecoration: 'none', letterSpacing: '-0.01em' }}>
            Get started for free →
          </Link>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `0.5px solid ${glassBorder}`, padding: '20px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: tp, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: dark ? '#1a1a2e' : '#fff', fontWeight: 800, fontSize: 8 }}>BT</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: ts }}>Budget Tracker</span>
        </div>
        <span style={{ fontSize: 12, color: ts }}>© 2026 budget.cloudgeekpro.com</span>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacy', 'Terms'].map(l => <a key={l} href="#" style={{ fontSize: 12, color: ts, textDecoration: 'none' }}>{l}</a>)}
        </div>
      </footer>
    </div>
  )
}