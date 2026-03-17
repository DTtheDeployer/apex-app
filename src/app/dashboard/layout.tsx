import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  console.log('LAYOUT DEBUG', { hasUser: !!user, error: error?.message })
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar profile={profile} />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">{children}</main>
    </div>
  )
}
