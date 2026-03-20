import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createSessionClient } from '@/lib/supabase/server'

// ADMIN USE ONLY — service role needed for bot GET (x-bot-secret) and dashboard POST/PATCH (session-verified writes)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Bot fetches current settings
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('user_id')
  const secret = request.headers.get('x-bot-secret')

  if (!secret || secret !== process.env.BOT_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!userId) {
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
  }

  const { data: configData, error: configError } = await supabase
    .from('bot_configs')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (configError) {
    return NextResponse.json({ error: configError.message }, { status: 500 })
  }

  return NextResponse.json({
    strategy: configData.strategy ?? 'apex_adaptive',
    risk_per_trade: configData.max_position_pct ?? 0.04,
    max_leverage: configData.leverage ?? 3,
    max_positions: configData.max_positions ?? 3,
    assets: configData.symbols ?? ['BTC', 'ETH', 'SOL', 'ARB', 'DOGE'],
    testnet: configData.testnet ?? true,
    enabled: configData.bot_enabled ?? true,
  })
}

// POST - Dashboard updates settings
export async function POST(request: NextRequest) {
  try {
    const sessionClient = createSessionClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { strategy } = body
    const user_id = user.id

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (strategy) updateData.strategy = strategy

    const { error: configError } = await supabase
      .from('bot_configs')
      .update(updateData)
      .eq('user_id', user_id)

    if (configError) {
      return NextResponse.json({ error: configError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

// PATCH - Toggle auto-trading on/off or update strategy/leverage
export async function PATCH(request: NextRequest) {
  try {
    const sessionClient = createSessionClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { enabled, strategy, leverage } = body
    const user_id = user.id

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (typeof enabled === 'boolean') updateData.bot_enabled = enabled
    if (strategy) updateData.strategy = strategy
    if (typeof leverage === 'number' && leverage >= 1 && leverage <= 20) updateData.leverage = leverage

    if (Object.keys(updateData).length <= 1) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { error } = await supabase
      .from('bot_configs')
      .update(updateData)
      .eq('user_id', user_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
