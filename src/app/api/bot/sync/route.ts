// src/app/api/bot/sync/route.ts
// The trading bot POSTs to this endpoint every cycle
// Secured with BOT_API_SECRET header

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

function authorised(req: Request): boolean {
  const secret = req.headers.get('x-bot-secret')
  return secret === process.env.BOT_API_SECRET
}

// ── POST /api/bot/sync/heartbeat ─────────────────────────────────────────────
export async function POST(req: Request) {
  if (!authorised(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { type, user_id, ...data } = body

  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

  const supabase = createAdminClient()

  switch (type) {
    // ── Heartbeat (every bot cycle) ──────────────────────────────────────────
    case 'heartbeat': {
      await supabase.from('bot_heartbeats').insert({
        user_id,
        equity:         data.equity,
        open_positions: data.open_positions ?? 0,
        regime:         data.regime ?? 'UNKNOWN',
        macro_context:  data.macro_context ?? 'NONE',
        cycles_today:   data.cycles_today ?? 0,
        trades_today:   data.trades_today ?? 0,
        pnl_today:      data.pnl_today ?? 0,
      })

      // Also upsert equity snapshot (for chart)
      await supabase.from('equity_snapshots').insert({
        user_id,
        equity: data.equity,
      })

      // Clean up old heartbeats (keep 48h)
      await supabase.from('bot_heartbeats')
        .delete()
        .eq('user_id', user_id)
        .lt('created_at', new Date(Date.now() - 48 * 3600 * 1000).toISOString())

      return NextResponse.json({ ok: true })
    }

    // ── Trade signal (new position opened) ───────────────────────────────────
    case 'trade_signal': {
      const { error } = await supabase.from('trades').upsert({
        user_id,
        external_id:  data.id,
        type:         'signal',
        symbol:       data.symbol,
        side:         data.side,
        entry_price:  data.entry_price,
        size:         data.size,
        leverage:     data.leverage ?? 3,
        stop_loss:    data.stop_loss,
        take_profit:  data.take_profit,
        confidence:   data.confidence,
        net_score:    data.net_score,
        regime:       data.regime,
        macro_context:data.macro_context,
        paper:        data.paper ?? true,
        opened_at:    data.timestamp ?? new Date().toISOString(),
      }, { onConflict: 'external_id' })

      if (error) console.error('Trade insert error:', error)
      return NextResponse.json({ ok: true })
    }

    // ── Trade close ──────────────────────────────────────────────────────────
    case 'trade_close': {
      // Find the open trade by external_id of the original signal
      const { data: existing } = await supabase.from('trades')
        .select('id').eq('external_id', data.signal_id).single()

      if (existing) {
        await supabase.from('trades').update({
          exit_price:   data.exit_price,
          pnl:          data.pnl,
          pnl_pct:      data.pnl_pct,
          close_reason: data.close_reason,
          held_minutes: data.held_minutes,
          closed_at:    data.timestamp ?? new Date().toISOString(),
        }).eq('id', existing.id)
      } else {
        // Insert as complete record if we missed the open
        await supabase.from('trades').insert({
          user_id,
          external_id:  data.id,
          type:         'close',
          symbol:       data.symbol,
          side:         data.side,
          entry_price:  data.entry_price,
          exit_price:   data.exit_price,
          size:         data.size,
          pnl:          data.pnl,
          pnl_pct:      data.pnl_pct,
          close_reason: data.close_reason,
          held_minutes: data.held_minutes,
          paper:        data.paper ?? true,
          opened_at:    data.opened_at ?? new Date().toISOString(),
          closed_at:    data.timestamp ?? new Date().toISOString(),
        })
      }

      return NextResponse.json({ ok: true })
    }

    default:
      return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 })
  }
}
