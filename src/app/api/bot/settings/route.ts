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

  // Fetch from bot_configs
  const { data: configData, error: configError } = await supabase
    .from('bot_configs')
    .select('strategy_mode, risk_level, max_positions, assets, testnet')
    .eq('user_id', userId)
    .single()

  // Fetch enabled status from bot_settings
  const { data: settingsData } = await supabase
    .from('bot_settings')
    .select('enabled')
    .eq('user_id', userId)
    .single()

  if (configError) {
    return NextResponse.json({ error: configError.message }, { status: 500 })
  }

  const riskMap: Record<string, number> = {
    low: 0.02,
    medium: 0.04,
    high: 0.06,
  }

  return NextResponse.json({
    strategy_mode: configData.strategy_mode || 'balanced',
    risk_per_trade: riskMap[configData.risk_level] || 0.04,
    max_positions: configData.max_positions || 3,
    assets: configData.assets || ['BTC', 'ETH', 'SOL', 'ARB', 'DOGE'],
    testnet: configData.testnet ?? true,
    enabled: settingsData?.enabled ?? true,
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

// PATCH - Toggle auto-trading on/off
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, enabled } = body

    if (!user_id || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Missing user_id or enabled' }, { status: 400 })
    }

    const { error } = await supabase
      .from('bot_settings')
      .update({ enabled })
      .eq('user_id', user_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, enabled })
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}