export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const [
    { data: profile },
    { data: config },
    { data: trades },
    { data: heartbeat },
    { data: equityHistory },
    { data: stats },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('bot_configs').select('*').eq('user_id', user.id).single(),
    supabase.from('trades').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(10),
    supabase.from('bot_heartbeats').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('equity_snapshots').select('*').eq('user_id', user.id)
      .order('snapshot_at', { ascending: true }).limit(90),
    supabase.from('user_stats').select('*').eq('user_id', user.id).single(),
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
