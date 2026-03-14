import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const userId = 'a040d19d-f40e-44f7-9b90-dead9d9bcfeb'

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', userId).single()

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar profile={profile} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}