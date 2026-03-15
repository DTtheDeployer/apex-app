import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Bot fetches current settings
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('user_id')
  const secret = request.headers.get('x-bot-secret')

  if (secret !== process.env.BOT_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!userId) {
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('bot_configs')
    .select('strategy_mode, risk_level, max_positions, assets, testnet')
    .eq('user_id', userId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Map to bot config values
  const riskMap: Record<string, number> = {
    low: 0.02,
    medium: 0.04,
    high: 0.06,
  }

  return NextResponse.json({
    strategy_mode: data.strategy_mode || 'balanced',
    risk_per_trade: riskMap[data.risk_level] || 0.04,
    max_positions: data.max_positions || 3,
    assets: data.assets || ['BTC', 'ETH', 'SOL', 'ARB', 'DOGE'],
    testnet: data.testnet ?? true,
  })
}

// POST - Dashboard updates settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, strategy_mode, risk_level } = body

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    const { error } = await supabase
      .from('bot_configs')
      .upsert({
        user_id,
        strategy_mode,
        risk_level,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
