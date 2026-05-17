import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FROM_EMAIL     = 'reports@cloudgeekpro.com'

function fmt(n: number) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

Deno.serve(async (req) => {
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

    // Get all users
    const { data: { users }, error: usersError } = await sb.auth.admin.listUsers()
    if (usersError) throw usersError

    const now = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 14)
    const fromStr = from.toISOString().slice(0, 10)
    const toStr   = now.toISOString().slice(0, 10)

    let sent = 0

    for (const user of users) {
      if (!user.email) continue

      // Fetch user's transactions for last 2 weeks
      const { data: txData } = await sb
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', fromStr)
        .lte('date', toStr)

      const { data: recData } = await sb
        .from('recurring')
        .select('*')
        .eq('user_id', user.id)

      const { data: goalData } = await sb
        .from('goals')
        .select('*')
        .eq('user_id', user.id)

      const tx    = txData    || []
      const rec   = recData   || []
      const goals = goalData  || []

      const income   = tx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
      const spending = tx.filter(t => t.type === 'spending').reduce((s, t) => s + Number(t.amount), 0)
      const savings  = tx.filter(t => t.type === 'savings').reduce((s, t) => s + Number(t.amount), 0)
      const invest   = tx.filter(t => t.type === 'investment').reduce((s, t) => s + Number(t.amount), 0)
      const balance  = +(income - spending - savings - invest).toFixed(2)

      // Category breakdown
      const catMap: Record<string, number> = {}
      tx.filter(t => t.type === 'spending').forEach(t => {
        catMap[t.cat] = (catMap[t.cat] || 0) + Number(t.amount)
      })
      const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5)

      const recurTotal = rec.reduce((s, r) => {
        const m = r.freq === 'yearly' ? r.amount / 12 : r.freq === 'weekly' ? r.amount * 4.33 : r.freq === 'biweekly' ? r.amount * 2.17 : r.amount
        return s + m
      }, 0)

      const savingsRate = income > 0 ? Math.round(((savings + invest) / income) * 100) : 0
      const spendRate   = income > 0 ? Math.round((spending / income) * 100) : 0

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Budget Report</title>
</head>
<body style="margin:0;padding:0;background:#f7f8fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a6ef5,#0d9e8a);border-radius:16px;padding:28px 32px;margin-bottom:24px;text-align:center;">
      <div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
        <span style="color:white;font-size:24px;font-weight:700;">B</span>
      </div>
      <h1 style="color:white;font-size:22px;font-weight:700;margin:0 0 4px;">Bi-Weekly Budget Report</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0;">${fromStr} → ${toStr}</p>
    </div>

    <!-- Summary cards -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
      <div style="background:white;border-radius:12px;padding:16px;border:1px solid #f0f0f0;">
        <div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Income</div>
        <div style="font-size:20px;font-weight:700;color:#1a6ef5;">${fmt(income)}</div>
      </div>
      <div style="background:white;border-radius:12px;padding:16px;border:1px solid #f0f0f0;">
        <div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Spending</div>
        <div style="font-size:20px;font-weight:700;color:#e53e3e;">${fmt(spending)}</div>
      </div>
      <div style="background:white;border-radius:12px;padding:16px;border:1px solid #f0f0f0;">
        <div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Savings</div>
        <div style="font-size:20px;font-weight:700;color:#0d9e8a;">${fmt(savings + invest)}</div>
      </div>
      <div style="background:white;border-radius:12px;padding:16px;border:1px solid #f0f0f0;">
        <div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Balance</div>
        <div style="font-size:20px;font-weight:700;color:${balance >= 0 ? '#2d9e5a' : '#e53e3e'};">${fmt(balance)}</div>
      </div>
    </div>

    <!-- Health indicators -->
    ${income > 0 ? `
    <div style="background:white;border-radius:12px;padding:20px;border:1px solid #f0f0f0;margin-bottom:24px;">
      <h2 style="font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 16px;">Financial Health</h2>
      <div style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:13px;color:#374151;font-weight:500;">Spending rate</span>
          <span style="font-size:13px;font-weight:700;color:${spendRate > 80 ? '#e53e3e' : spendRate > 60 ? '#c47b0a' : '#2d9e5a'};">${spendRate}%</span>
        </div>
        <div style="height:6px;background:#f1f5f9;border-radius:999px;overflow:hidden;">
          <div style="height:100%;width:${Math.min(spendRate, 100)}%;background:${spendRate > 80 ? '#e53e3e' : spendRate > 60 ? '#c47b0a' : '#2d9e5a'};border-radius:999px;"></div>
        </div>
        <div style="font-size:11px;color:#94a3b8;margin-top:4px;">${spendRate > 80 ? '⚠️ High spending' : spendRate > 60 ? '👀 Moderate spending' : '✅ Healthy spending rate'}</div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:13px;color:#374151;font-weight:500;">Savings rate</span>
          <span style="font-size:13px;font-weight:700;color:${savingsRate >= 20 ? '#2d9e5a' : savingsRate >= 10 ? '#c47b0a' : '#e53e3e'};">${savingsRate}%</span>
        </div>
        <div style="height:6px;background:#f1f5f9;border-radius:999px;overflow:hidden;">
          <div style="height:100%;width:${Math.min(savingsRate, 100)}%;background:${savingsRate >= 20 ? '#2d9e5a' : savingsRate >= 10 ? '#c47b0a' : '#e53e3e'};border-radius:999px;"></div>
        </div>
        <div style="font-size:11px;color:#94a3b8;margin-top:4px;">${savingsRate >= 20 ? '🎉 Excellent savings!' : savingsRate >= 10 ? '👍 Good — aim for 20%+' : '💡 Try to save at least 10%'}</div>
      </div>
    </div>` : ''}

    <!-- Top categories -->
    ${topCats.length > 0 ? `
    <div style="background:white;border-radius:12px;padding:20px;border:1px solid #f0f0f0;margin-bottom:24px;">
      <h2 style="font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 16px;">Top Spending Categories</h2>
      ${topCats.map(([cat, amt]) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f8f9fa;">
          <span style="font-size:13px;color:#374151;font-weight:500;">${cat}</span>
          <span style="font-size:13px;font-weight:700;color:#e53e3e;">${fmt(amt)}</span>
        </div>`).join('')}
    </div>` : ''}

    <!-- Recurring -->
    ${rec.length > 0 ? `
    <div style="background:white;border-radius:12px;padding:20px;border:1px solid #f0f0f0;margin-bottom:24px;">
      <h2 style="font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px;">Recurring Expenses</h2>
      <p style="font-size:12px;color:#94a3b8;margin:0 0 16px;">Est. monthly total: <strong style="color:#e53e3e;">${fmt(recurTotal)}</strong></p>
      ${rec.slice(0, 5).map(r => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f8f9fa;">
          <span style="font-size:13px;color:#374151;">${r.name} <span style="color:#94a3b8;font-size:11px;">(${r.freq})</span></span>
          <span style="font-size:13px;font-weight:600;color:#374151;">${fmt(r.amount)}</span>
        </div>`).join('')}
    </div>` : ''}

    <!-- Goals -->
    ${goals.length > 0 ? `
    <div style="background:white;border-radius:12px;padding:20px;border:1px solid #f0f0f0;margin-bottom:24px;">
      <h2 style="font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 16px;">Goals Progress</h2>
      ${goals.map(g => {
        const pct = Math.min(100, Math.round((g.saved / g.target) * 100))
        return `
        <div style="margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:13px;color:#374151;font-weight:500;">${g.name}</span>
            <span style="font-size:12px;color:#94a3b8;">${fmt(g.saved)} / ${fmt(g.target)}</span>
          </div>
          <div style="height:6px;background:#f1f5f9;border-radius:999px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:#1a6ef5;border-radius:999px;"></div>
          </div>
          <div style="font-size:11px;color:#94a3b8;margin-top:3px;">${pct}% complete</div>
        </div>`
      }).join('')}
    </div>` : ''}

    <!-- Footer -->
    <div style="text-align:center;padding:16px 0;">
      <a href="https://budget.cloudgeekpro.com" style="display:inline-block;background:#1a6ef5;color:white;font-size:13px;font-weight:600;padding:10px 24px;border-radius:999px;text-decoration:none;margin-bottom:16px;">
        View full dashboard →
      </a>
      <p style="font-size:11px;color:#94a3b8;margin:0;">
        Budget Tracker · <a href="https://budget.cloudgeekpro.com" style="color:#94a3b8;">budget.cloudgeekpro.com</a>
      </p>
      <p style="font-size:11px;color:#94a3b8;margin:4px 0 0;">You're receiving this because you have a Budget Tracker account.</p>
    </div>

  </div>
</body>
</html>`

      // Send email via Resend
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: user.email,
          subject: `Your bi-weekly budget report (${fromStr} → ${toStr})`,
          html,
        }),
      })

      if (res.ok) sent++
    }

    return new Response(JSON.stringify({ success: true, sent }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})