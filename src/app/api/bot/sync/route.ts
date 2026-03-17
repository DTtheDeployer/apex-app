import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ADMIN USE ONLY — bot-facing route, authenticated via x-bot-secret header
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Simple auth check - verify bot secret
const BOT_API_SECRET = process.env.BOT_API_SECRET || ''

export async function POST(request: NextRequest) {
  try {
    // Check bot secret
    const botSecret = request.headers.get('x-bot-secret')
    if (BOT_API_SECRET && botSecret !== BOT_API_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, user_id, ...data } = body

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    switch (type) {
      case 'heartbeat':
        return handleHeartbeat(user_id, data)
      case 'trade_signal':
        return handleTradeSignal(user_id, data)
      case 'trade_close':
        return handleTradeClose(user_id, data)
      default:
        return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Bot sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleHeartbeat(userId: string, data: any) {
  const {
    equity,
    open_positions,
    regime,
    macro_context,
    cycles_today,
    trades_today,
    pnl_today,
    unrealized_pnl,
    positions,
    signal_radar,
  } = data

  // Upsert heartbeat record
  const { error: heartbeatError } = await supabase
    .from('bot_heartbeats')
    .upsert({
      user_id: userId,
      equity,
      open_positions,
      regime,
      macro_context,
      cycles_today,
      trades_today,
      pnl_today,
      unrealized_pnl: unrealized_pnl ?? 0,
      positions: positions ?? [],
      signal_radar: signal_radar ?? [],
      created_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id'
    })

  if (heartbeatError) {
    console.error('Heartbeat error:', heartbeatError)
    return NextResponse.json({ error: 'Failed to save heartbeat' }, { status: 500 })
  }

  // Also save equity snapshot for chart
  const { error: snapshotError } = await supabase
    .from('equity_snapshots')
    .insert({
      user_id: userId,
      equity,
      snapshot_at: new Date().toISOString(),
    })

  if (snapshotError) {
    console.error('Snapshot error:', snapshotError)
  }

  // Update live P&L for open trades if positions data is provided
  if (positions && Array.isArray(positions)) {
    for (const pos of positions) {
      await supabase
        .from('trades')
        .update({
          current_price: pos.current_price,
          unrealized_pnl: pos.unrealized_pnl,
          unrealized_pnl_pct: pos.pnl_pct,
        })
        .eq('user_id', userId)
        .eq('symbol', pos.symbol)
        .is('closed_at', null)
    }
  }

  // Update user stats with today's P&L
  await supabase
    .from('user_stats')
    .upsert({
      user_id: userId,
      pnl_today: pnl_today ?? 0,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id'
    })

  return NextResponse.json({ ok: true })
}

async function handleTradeSignal(userId: string, data: any) {
  const {
    id,
    symbol,
    side,
    entry_price,
    size,
    leverage,
    stop_loss,
    take_profit,
    confidence,
    net_score,
    regime,
    macro_context,
    strategy,      // ✅ Added
    explanation,   // ✅ Added
    paper,
    timestamp,
  } = data

  const { error } = await supabase
    .from('trades')
    .insert({
      id,
      user_id: userId,
      symbol,
      side,
      entry_price,
      size,
      leverage,
      stop_loss,
      take_profit,
      confidence,
      net_score,
      regime,
      macro_context,
      strategy,      // ✅ Added - save strategy on open
      explanation,   // ✅ Added - save explanation on open
      paper,
      current_price: entry_price,
      unrealized_pnl: 0,
      unrealized_pnl_pct: 0,
      created_at: timestamp || new Date().toISOString(),
    })

  if (error) {
    console.error('Trade signal error:', error)
    return NextResponse.json({ error: 'Failed to save trade' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

async function handleTradeClose(userId: string, data: any) {
  const {
    signal_id,
    exit_price,
    pnl,
    pnl_pct,
    close_reason,
    held_minutes,
    strategy,      // ✅ Added - extract strategy from close data
    explanation,   // ✅ Added - extract explanation (close reason text)
    timestamp,
  } = data

  // Build update object - only include strategy if provided
  const updateData: any = {
    exit_price,
    pnl,
    pnl_pct,
    close_reason,
    held_minutes,
    unrealized_pnl: null,
    unrealized_pnl_pct: null,
    current_price: exit_price,
    closed_at: timestamp || new Date().toISOString(),
  }

  // Only update strategy if it was provided (don't overwrite with null)
  if (strategy) {
    updateData.strategy = strategy
  }

  const { error } = await supabase
    .from('trades')
    .update(updateData)
    .eq('id', signal_id)

  if (error) {
    console.error('Trade close error:', error)
    return NextResponse.json({ error: 'Failed to close trade' }, { status: 500 })
  }

  // Recalculate user stats
  const { data: trades } = await supabase
    .from('trades')
    .select('pnl, strategy')
    .eq('user_id', userId)
    .not('closed_at', 'is', null)

  if (trades) {
    const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0)
    const wins = trades.filter(t => (t.pnl || 0) > 0).length
    const losses = trades.filter(t => (t.pnl || 0) < 0).length
    const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0

    await supabase
      .from('user_stats')
      .upsert({
        user_id: userId,
        total_pnl: totalPnl,
        total_trades: trades.length,
        wins,
        losses,
        win_rate_pct: winRate,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })
  }

  return NextResponse.json({ ok: true })
}