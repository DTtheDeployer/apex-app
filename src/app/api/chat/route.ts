import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { message, userId } = await req.json()

    if (!message || !userId) {
      return NextResponse.json({ error: 'Missing message or userId' }, { status: 400 })
    }

    // Fetch user's trading context
    const [positionsRes, tradesRes, settingsRes, heartbeatRes] = await Promise.all([
      supabase.from('paper_positions').select('*').eq('user_id', userId),
      supabase.from('trades').select('*').eq('user_id', userId).order('closed_at', { ascending: false }).limit(10),
      supabase.from('bot_settings').select('*').eq('user_id', userId).single(),
      supabase.from('bot_heartbeats').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single(),
    ])

    const positions = positionsRes.data || []
    const recentTrades = tradesRes.data || []
    const settings = settingsRes.data
    const heartbeat = heartbeatRes.data

    // Build context for the AI
    const tradingContext = {
      openPositions: positions.map(p => ({
        symbol: p.symbol,
        side: p.side,
        entryPrice: p.entry_price,
        size: p.size,
        unrealizedPnl: p.unrealized_pnl,
        strategy: p.strategy,
      })),
      recentTrades: recentTrades.map(t => ({
        symbol: t.symbol,
        side: t.side,
        pnl: t.pnl,
        strategy: t.strategy,
        closeReason: t.close_reason,
        closedAt: t.closed_at,
      })),
      activeStrategy: settings?.strategy || 'unknown',
      botEnabled: settings?.enabled || false,
      marketRegime: heartbeat?.regime || 'unknown',
      equity: heartbeat?.equity || 0,
      signalRadar: heartbeat?.signal_radar || [],
    }

    const systemPrompt = `You are APEX AI, an intelligent trading assistant embedded in the APEX trading bot dashboard. You help traders understand their positions, strategies, and market conditions.

## Your Personality
- Concise and direct — traders want quick answers
- Use trading terminology naturally
- Be confident but never give financial advice
- Use emojis sparingly for emphasis (📈 📉 ⚠️ ✅)

## Current Trading Context
${JSON.stringify(tradingContext, null, 2)}

## What You Can Help With
1. Explain why specific trades were opened (based on strategy + regime)
2. Analyze current position risk and exposure
3. Summarize recent performance
4. Explain how strategies work (Momentum Rider, Scalp Sniper, etc.)
5. Clarify market regime and signal strength
6. Suggest what to monitor

## Rules
- Never give buy/sell recommendations or financial advice
- Always clarify you're explaining the bot's logic, not predicting markets
- If asked about future prices, politely decline
- Keep responses under 150 words unless asked for detail
- Format numbers nicely ($1,234.56, 12.5%, etc.)

## Strategy Descriptions
- **Scalp Sniper**: Quick trades on micro pullbacks, tight SL/TP, minutes to hours
- **Momentum Rider**: Rides strong trends using RSI + MACD confirmation, hours to days
- **Dip Hunter**: Mean reversion, buys oversold/sells overbought at Bollinger extremes
- **Breakout Blitz**: Catches range breakouts on high momentum
- **Swing King**: Larger moves, wider stops, patient entries over days/weeks
- **APEX Adaptive**: Hybrid that adapts to market regime automatically`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 500,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
    })

    const assistantMessage = response.choices[0]?.message?.content 
      || 'Sorry, I could not generate a response.'

    return NextResponse.json({ 
      message: assistantMessage,
      usage: {
        input_tokens: response.usage?.prompt_tokens || 0,
        output_tokens: response.usage?.completion_tokens || 0,
      }
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}