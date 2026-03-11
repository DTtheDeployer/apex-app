export const dynamic = 'force-dynamic'
// src/app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch everything in parallel
  const [profileRes, configRes, tradesRes, heartbeatRes, equityRes, statsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('bot_configs').select('*').eq('user_id', user.id).single(),
    supabase.from('trades').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(20),
    supabase.from('bot_heartbeats').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('equity_snapshots').select('equity, snapshot_at').eq('user_id', user.id)
      .order('snapshot_at', { ascending: false }).limit(168), // 7 days hourly
    supabase.from('user_stats').select('*').eq('user_id', user.id).single(),
  ])

  return (
    <DashboardClient
      profile={profileRes.data}
      config={configRes.data}
      trades={tradesRes.data ?? []}
      heartbeat={heartbeatRes.data}
      equityHistory={(equityRes.data ?? []).reverse()}
      stats={statsRes.data}
    />
  )
}
