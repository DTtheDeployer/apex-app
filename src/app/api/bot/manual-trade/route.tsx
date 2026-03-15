import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      symbol,
      side,
      size,
      leverage,
      entry_price,
      stop_loss,
      take_profit,
    } = body

    // Validate inputs
    if (!user_id || !symbol || !side || !size || !entry_price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (size < 10 || size > 10000) {
      return NextResponse.json({ error: 'Position size must be between $10 and $10,000' }, { status: 400 })
    }

    if (leverage < 1 || leverage > 10) {
      return NextResponse.json({ error: 'Leverage must be between 1x and 10x' }, { status: 400 })
    }

    // Check if user already has a position in this asset
    const { data: existingPositions } = await supabase
      .from('trades')
      .select('id')
      .eq('user_id', user_id)
      .eq('symbol', symbol)
      .is('closed_at', null)

    if (existingPositions && existingPositions.length > 0) {
      return NextResponse.json({ error: `Already have an open position in ${symbol}` }, { status: 400 })
    }

    // Check total open positions
    const { data: allPositions } = await supabase
      .from('trades')
      .select('id')
      .eq('user_id', user_id)
      .is('closed_at', null)

    if (allPositions && allPositions.length >= 3) {
      return NextResponse.json({ error: 'Maximum 3 positions allowed' }, { status: 400 })
    }

    const tradeId = uuidv4()
    const now = new Date().toISOString()

    // Insert the manual trade
    const { error: insertError } = await supabase
      .from('trades')
      .insert({
        id: tradeId,
        user_id,
        symbol,
        side,
        entry_price,
        size,
        leverage,
        stop_loss,
        take_profit,
        strategy: 'MANUAL',
        explanation: `Manual ${side} trade placed via dashboard`,
        regime: 'UNKNOWN',
        macro_context: 'NONE',
        paper: true,
        current_price: entry_price,
        unrealized_pnl: 0,
        unrealized_pnl_pct: 0,
        created_at: now,
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create trade' }, { status: 500 })
    }

    // Also save to positions table for bot sync
    const { error: positionError } = await supabase
      .from('positions')
      .insert({
        id: tradeId,
        user_id,
        symbol,
        side,
        entry_price,
        size,
        leverage,
        stop_loss,
        take_profit,
        entry_time: now,
        regime: 'UNKNOWN',
        macro: 'NONE',
        strategy: 'MANUAL',
        explanation: `Manual ${side} trade placed via dashboard`,
      })

    if (positionError) {
      console.error('Position insert error:', positionError)
      // Don't fail - the trade is already in trades table
    }

    return NextResponse.json({ 
      ok: true, 
      trade_id: tradeId,
      message: `${side} ${symbol} position opened at $${entry_price.toLocaleString()}`
    })

  } catch (error) {
    console.error('Manual trade error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}