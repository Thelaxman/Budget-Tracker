import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!

function nextDueDate(freq: string, from: string): string {
  const d = new Date(from)
  if (freq === 'monthly')  d.setMonth(d.getMonth() + 1)
  if (freq === 'weekly')   d.setDate(d.getDate() + 7)
  if (freq === 'biweekly') d.setDate(d.getDate() + 14)
  if (freq === 'yearly')   d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

function mapCategory(cat: string): string {
  const map: Record<string, string> = {
    Subscription: 'Bills',
    Rent:         'Rent',
    Utilities:    'Utilities',
    Phone:        'Bills',
    Gym:          'Health',
    Insurance:    'Bills',
    Loan:         'Bills',
    Other:        'Miscellaneous',
  }
  return map[cat] || 'Bills'
}

Deno.serve(async () => {
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

    const today     = new Date().toISOString().slice(0, 10)
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const cutoff = threeDaysAgo.toISOString().slice(0, 10)

    // Get all recurring expenses that are overdue by 3+ days
    const { data: overdueItems, error: fetchError } = await sb
      .from('recurring')
      .select('*')
      .lte('due', cutoff)

    if (fetchError) throw fetchError
    if (!overdueItems || overdueItems.length === 0) {
      return new Response(JSON.stringify({ success: true, processed: 0, message: 'No overdue items' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let autoLogged = 0
    let skipped    = 0

    for (const item of overdueItems) {
      // Check if a transaction was already manually logged for this item
      // within 3 days before or after the due date
      const rangeStart = new Date(item.due)
      rangeStart.setDate(rangeStart.getDate() - 3)
      const rangeEnd = new Date(item.due)
      rangeEnd.setDate(rangeEnd.getDate() + 3)

      const { data: existing } = await sb
        .from('transactions')
        .select('id')
        .eq('user_id', item.user_id)
        .eq('description', item.name)
        .eq('type', 'spending')
        .gte('date', rangeStart.toISOString().slice(0, 10))
        .lte('date', rangeEnd.toISOString().slice(0, 10))
        .limit(1)

      if (existing && existing.length > 0) {
        // Already logged manually — just update the due date
        await sb.from('recurring').update({ due: nextDueDate(item.freq, item.due) }).eq('id', item.id)
        skipped++
        continue
      }

      // Auto-create the transaction
      const { error: txError } = await sb.from('transactions').insert([{
        user_id:     item.user_id,
        description: item.name,
        amount:      item.amount,
        type:        'spending',
        cat:         mapCategory(item.cat),
        date:        item.due, // use the due date as the transaction date
      }])

      if (txError) {
        console.error(`Failed to log transaction for ${item.name}:`, txError)
        continue
      }

      // Update next due date
      await sb.from('recurring').update({ due: nextDueDate(item.freq, item.due) }).eq('id', item.id)
      autoLogged++
    }

    return new Response(
      JSON.stringify({ success: true, autoLogged, skipped, total: overdueItems.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})