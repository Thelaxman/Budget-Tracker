import { useRef, useEffect } from 'react'
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

function PhoneParallax({ src, dark }) {
  const phoneRef   = useRef(null)
  const sectionRef = useRef(null)

  useEffect(() => {
    const phone   = phoneRef.current
    const section = sectionRef.current
    if (!phone || !section) return

    // Try window first; fall back to the nearest scrolling ancestor
    function getScrollY() {
      return window.scrollY || window.pageYOffset || document.documentElement.scrollTop
    }

    function onScroll() {
      const scrollY  = getScrollY()
      const rect     = section.getBoundingClientRect()
      const secTop   = rect.top + scrollY          // absolute top of section
      const secH     = section.offsetHeight
      const vh       = window.innerHeight
      // progress: 0 when section top hits bottom of viewport → 1 when section bottom leaves top
      const raw      = (scrollY + vh - secTop) / (secH + vh)
      const progress = Math.min(Math.max(raw, 0), 1)
      const drift    = progress * 160              // drift 160px downward total
      phone.style.transform = `translateY(${drift}px)`
    }

    // Attach to BOTH window and document in case the scroll container differs
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('scroll', onScroll)
    }
  }, [])

  const mobileFeatures = [
    { icon: '📊', title: 'Live dashboard',    desc: 'Your income, spending and savings at a glance — updated the moment you log a transaction.' },
    { icon: '🔁', title: 'Recurring tracker', desc: 'Bills and subscriptions organised by due date. Never get caught off guard again.' },
    { icon: '🎯', title: 'Goal progress',      desc: 'Visual rings show exactly how close you are to every savings and investment target.' },
  ]

  const tp          = dark ? '#eef0f4' : '#1a1a2e'
  const ts          = dark ? '#8892a4' : '#4a4a6a'
  const glassBg     = dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)'
  const glassBorder = dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)'

  return (
    <section
      ref={sectionRef}
      style={{
        padding: '120px 64px 220px',
        display: 'flex',
        justifyContent: 'center',
        // NO overflow:hidden — that was killing the parallax
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 80, maxWidth: 1000, width: '100%' }}>

        {/* Left: text */}
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.8 }}
          style={{ flex: 1, minWidth: 280, paddingTop: 16 }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: glassBg, border: `0.5px solid ${glassBorder}`, borderRadius: 999, padding: '5px 14px', fontSize: 11, fontWeight: 700, color: '#6366f1', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
            Mobile app
          </div>
          <h2 style={{ fontSize: 'clamp(36px,4vw,58px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', color: tp, marginBottom: 16 }}>
            Your finances,<br />
            <span style={{ WebkitTextStroke: `2px ${tp}`, color: 'transparent' }}>in your pocket.</span>
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.75, color: ts, marginBottom: 40, maxWidth: 400 }}>
            Everything on desktop, beautifully adapted for mobile. Check your budget, log a transaction or review your goals — wherever you are.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, marginBottom: 40 }}>
            {mobileFeatures.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.5 }}
                style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: glassBg, border: `0.5px solid ${glassBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: tp, marginBottom: 4 }}>{f.title}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: ts }}>{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
          <Link to="/auth" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: tp, color: dark ? '#1a1a2e' : '#fff', padding: '14px 32px', borderRadius: 999, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
            Try it free →
          </Link>
        </motion.div>

        {/* Right: phone — big, parallax */}
        <div style={{ flexShrink: 0, position: 'relative', width: 340 }}>
          <div style={{ position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)', width: 440, height: 440, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
          <img
            ref={phoneRef}
            src={src}
            alt="Budget Tracker on iPhone"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              position: 'relative',
              zIndex: 1,
              willChange: 'transform',
              filter: dark
                ? 'drop-shadow(0 40px 70px rgba(99,102,241,0.45))'
                : 'drop-shadow(0 40px 70px rgba(99,102,241,0.3))',
            }}
          />
        </div>

      </div>
    </section>
  )
}

export default function Landing() {
  const { dark, setDark } = useTheme()
  const trackRef   = useRef(null)
  const imgWrapRef = useRef(null)
  const hintRef    = useRef(null)

  const bg          = dark ? 'linear-gradient(160deg,#16131f 0%,#1a1728 40%,#1c1830 100%)' : 'linear-gradient(160deg,#e8e4f8 0%,#f0eeff 40%,#e4dff8 100%)'
  const tp          = dark ? '#eef0f4' : '#1a1a2e'
  const ts          = dark ? '#8892a4' : '#4a4a6a'
  const navBg       = dark ? 'rgba(22,19,31,0.85)' : 'rgba(232,228,248,0.75)'
  const glassBg     = dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)'
  const glassBorder = dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)'

  // Desktop stretch
  useEffect(() => {
    const wrap  = imgWrapRef.current
    const track = trackRef.current
    const hint  = hintRef.current
    if (!wrap || !track) return

    const ease  = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2
    const lerp  = (a, b, t) => a + (b - a) * t
    const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)

    let vw, vh, startW, startH, startTop, startLeft

    function measure() {
      vw = window.innerWidth; vh = window.innerHeight
      startW = Math.min(780, vw * 0.88); startH = startW * 0.6
      startTop = (vh - startH) / 2; startLeft = (vw - startW) / 2
    }

    function applyInitial() {
      wrap.style.width = startW+'px'; wrap.style.height = startH+'px'
      wrap.style.top = startTop+'px'; wrap.style.left = startLeft+'px'
      wrap.style.borderRadius = '14px'
    }

    function onScroll() {
      const trackTop = track.getBoundingClientRect().top + window.scrollY
      const raw = clamp((window.scrollY - trackTop) / (track.offsetHeight - vh), 0, 1)
      const p = ease(raw)
      wrap.style.width        = lerp(startW, vw, p)+'px'
      wrap.style.height       = lerp(startH, vh, p)+'px'
      wrap.style.top          = lerp(startTop, 0, p)+'px'
      wrap.style.left         = lerp(startLeft, 0, p)+'px'
      wrap.style.borderRadius = lerp(14, 0, p)+'px'
      wrap.style.boxShadow    = `0 ${lerp(40,0,p)}px ${lerp(80,0,p)}px rgba(0,0,0,${lerp(0.5,0,p).toFixed(2)})`
      if (hint) hint.style.opacity = String(clamp(1 - raw * 8, 0, 1))
    }

    function onResize() { measure(); applyInitial(); onScroll() }
    measure(); applyInitial(); onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

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

      {/* Hero */}
      <section style={{ paddingTop: 100, paddingBottom: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: glassBg, border: `0.5px solid ${glassBorder}`, borderRadius: 999, padding: '6px 16px', fontSize: 12, fontWeight: 600, color: '#6366f1', marginBottom: 24 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
          Free · No credit card required
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          style={{ fontSize: 'clamp(48px,7vw,88px)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.04em', color: tp, marginBottom: 20, padding: '0 24px' }}>
          BUDGET<br />
          <span style={{ WebkitTextStroke: `3px ${tp}`, color: 'transparent' }}>SMARTER.</span><br />
          LIVE BETTER.
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          style={{ fontSize: 16, lineHeight: 1.7, color: ts, maxWidth: 420, margin: '0 auto 32px', padding: '0 24px' }}>
          Track spending, set goals, and build better money habits — all in one beautiful dashboard.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/auth" style={{ background: tp, color: dark ? '#1a1a2e' : '#fff', padding: '13px 32px', borderRadius: 999, fontSize: 15, fontWeight: 700, textDecoration: 'none', letterSpacing: '-0.01em' }}>Start for free →</Link>
          <a href="#features" style={{ background: glassBg, color: tp, padding: '13px 32px', borderRadius: 999, fontSize: 15, fontWeight: 600, textDecoration: 'none', border: `0.5px solid ${glassBorder}` }}>See how it works</a>
        </motion.div>
      </section>

      {/* Desktop scroll-stretch */}
      <div ref={trackRef} style={{ height: '350vh', position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
          <div ref={imgWrapRef} style={{ position: 'absolute', overflow: 'hidden', willChange: 'width,height,top,left,border-radius' }}>
            <img src="/455shots_so.png" alt="Budget Tracker desktop"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }} />
          </div>
          <div ref={hintRef} style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none', zIndex: 10 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Scroll to expand</span>
            <div style={{ width: 16, height: 16, borderRight: '2px solid rgba(255,255,255,0.3)', borderBottom: '2px solid rgba(255,255,255,0.3)', transform: 'rotate(45deg)', animation: 'bob 1.4s ease-in-out infinite' }} />
          </div>
        </div>
      </div>

      {/* Phone parallax section */}
      <PhoneParallax src="/991shots_so.png" dark={dark} />

      {/* Stats */}
      <section style={{ padding: '48px', display: 'flex', justifyContent: 'center', gap: 56, flexWrap: 'wrap', borderTop: `0.5px solid ${glassBorder}`, borderBottom: `0.5px solid ${glassBorder}`, background: glassBg }}>
        {[{ value: '100%', label: 'Free to use' }, { value: '$0', label: 'Hidden fees' }, { value: '6mo', label: 'Of insights' }, { value: '∞', label: 'Transactions' }].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-0.03em', color: tp, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: ts, marginTop: 4, fontWeight: 500 }}>{s.label}</div>
          </motion.div>
        ))}
      </section>

      {/* Features */}
      <div id="features">
        {features.map((section, i) => <FeatureSection key={i} section={section} index={i} />)}
      </div>

      {/* Final CTA */}
      <section style={{ padding: '100px 48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <h2 style={{ fontSize: 'clamp(36px,5.5vw,68px)', fontWeight: 900, letterSpacing: '-0.04em', color: tp, lineHeight: 1.05, marginBottom: 16 }}>
            TAKE CONTROL<br />
            <span style={{ WebkitTextStroke: `2.5px ${tp}`, color: 'transparent' }}>OF YOUR MONEY.</span>
          </h2>
          <p style={{ fontSize: 16, color: ts, maxWidth: 360, margin: '0 auto 32px' }}>Free forever. No credit card. Start tracking in 60 seconds.</p>
          <Link to="/auth" style={{ display: 'inline-block', background: tp, color: dark ? '#1a1a2e' : '#fff', padding: '15px 40px', borderRadius: 999, fontSize: 15, fontWeight: 700, textDecoration: 'none', letterSpacing: '-0.01em' }}>Get started for free →</Link>
        </motion.div>
      </section>

      {/* Footer */}
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

      <style>{`
        @keyframes bob {
          0%, 100% { transform: rotate(45deg) translate(0,0); }
          50%       { transform: rotate(45deg) translate(3px,3px); }
        }
      `}</style>
    </div>
  )
}
