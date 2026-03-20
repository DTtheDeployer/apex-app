import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ADMIN USE ONLY — bot-facing route, authenticated via x-bot-secret header
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Bot loads positions on startup
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-bot-secret')

  if (!secret || secret !== process.env.BOT_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = request.nextUrl.searchParams.get('user_id')
  if (!userId) {
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('paper_positions')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ positions: data || [] })
}

// POST - Bot saves a new position
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-bot-secret')

  if (!secret || secret !== process.env.BOT_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const position = await request.json()

    const { error } = await supabase
      .from('paper_positions')
      .upsert({
        id: position.id,
        user_id: position.user_id,
        symbol: position.symbol,
        side: position.side,
        entry_price: position.entry_price,
        size: position.size,
        leverage: position.leverage,
        stop_loss: position.stop_loss,
        take_profit: position.take_profit,
        entry_time: position.entry_time,
        regime: position.regime,
        macro: position.macro,
        strategy: position.strategy,
        explanation: position.explanation,
      }, { onConflict: 'id' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

// DELETE - Bot removes a closed position
export async function DELETE(request: NextRequest) {
  const secret = request.headers.get('x-bot-secret')

  if (!secret || secret !== process.env.BOT_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { symbol, user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    const { error } = await supabase
      .from('paper_positions')
      .delete()
      .eq('user_id', user_id)
      .eq('symbol', symbol)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
