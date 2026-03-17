import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createSessionClient } from '@/lib/supabase/server'

// ADMIN USE ONLY — service role needed for bot GET/PATCH (x-bot-secret) and dashboard POST (session-verified writes)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Request bot to close a position (dashboard-facing)
export async function POST(request: NextRequest) {
  try {
    const sessionClient = createSessionClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { trade_id, symbol } = body

    if (!trade_id && !symbol) {
      return NextResponse.json({ error: 'Missing trade_id or symbol' }, { status: 400 })
    }

    // Insert a close request that the bot will pick up
    const { error } = await supabase
      .from('bot_commands')
      .insert({
        user_id: user.id,
        command: 'CLOSE_POSITION',
        payload: { trade_id, symbol },
        status: 'pending',
        created_at: new Date().toISOString(),
      })

    if (error) {
      // If table doesn't exist, create it
      if (error.code === '42P01') {
        return NextResponse.json({ 
          error: 'bot_commands table not found. Run the migration first.',
          migration: `
CREATE TABLE bot_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  command text NOT NULL,
  payload jsonb DEFAULT '{}',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);
          `
        }, { status: 500 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Close request sent to bot' })
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

// GET - Bot checks for pending commands
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('user_id')
  const secret = request.headers.get('x-bot-secret')

  if (secret !== process.env.BOT_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!userId) {
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
  }

  // Get pending commands
  const { data, error } = await supabase
    .from('bot_commands')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ commands: data || [] })
}

// PATCH - Bot marks command as processed
export async function PATCH(request: NextRequest) {
  const secret = request.headers.get('x-bot-secret')

  if (secret !== process.env.BOT_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { command_id, status } = body

    const { error } = await supabase
      .from('bot_commands')
      .update({ 
        status: status || 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', command_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
