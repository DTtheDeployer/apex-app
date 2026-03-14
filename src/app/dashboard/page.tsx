export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const supabase = createClient()

  // For personal dev - use a hardcoded user ID or fetch without auth
  // You can get your user ID from Supabase dashboard > Authentication > Users
  const userId = 'a040d19d-f40e-44f7-9b90-dead9d9bcfeb' // Your user ID from Supabase

  const [
    { data: profile },
    { data: config },
    { data: trades },
    { data: heartbeat },
    { data: equityHistory },
    { data: stats },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('bot_configs').select('*').eq('user_id', userId).single(),
    supabase.from('trades').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(10),
    supabase.from('bot_heartbeats').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('equity_snapshots').select('*').eq('user_id', userId)
      .order('snapshot_at', { ascending: true }).limit(90),
    supabase.from('user_stats').select('*').eq('user_id', userId).single(),
  ])

  return (
    <DashboardClient
      profile={profile}
      config={config}
      trades={trades ?? []}
      heartbeat={heartbeat}
      equityHistory={equityHistory ?? []}
      stats={stats}
    />
  )
}