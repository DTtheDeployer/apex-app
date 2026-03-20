export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const userId = user.id

  const [
    { data: profile },
    { data: config },
    { data: trades },
    { data: heartbeat },
    { data: equityHistory },
    { data: stats },
    { data: botSettings },
    { data: allTrades },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('bot_configs').select('*').eq('user_id', userId).single(),
    supabase.from('trades').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(10),
    supabase.from('bot_heartbeats').select('*').eq('user_id', userId)
      .order('updated_at', { ascending: false }).limit(1).single(),
    supabase.from('equity_snapshots').select('*').eq('user_id', userId)
      .order('snapshot_at', { ascending: true }).limit(90),
    supabase.from('user_stats').select('*').eq('user_id', userId).single(),
    supabase.from('bot_configs').select('bot_enabled, strategy').eq('user_id', userId).single(),
    supabase.from('trades').select('strategy, pnl, closed_at').eq('user_id', userId).not('closed_at', 'is', null),
  ])

  // Calculate per-strategy stats
  const strategyStats: Record<string, { trades: number; wins: number; losses: number; pnl: number }> = {}
  
  if (allTrades) {
    for (const trade of allTrades) {
      const strat = trade.strategy || 'unknown'
      if (!strategyStats[strat]) {
        strategyStats[strat] = { trades: 0, wins: 0, losses: 0, pnl: 0 }
      }
      strategyStats[strat].trades++
      strategyStats[strat].pnl += trade.pnl || 0
      if ((trade.pnl || 0) > 0) {
        strategyStats[strat].wins++
      } else if ((trade.pnl || 0) < 0) {
        strategyStats[strat].losses++
      }
    }
  }

  return (
    <DashboardClient
      userId={userId}
      profile={profile}
      config={config}
      trades={trades ?? []}
      heartbeat={heartbeat}
      equityHistory={equityHistory ?? []}
      stats={stats}
      botEnabled={botSettings?.bot_enabled ?? true}
      currentStrategy={botSettings?.strategy ?? 'apex_adaptive'}
      strategyStats={strategyStats}
    />
  )
}