import { createClient } from '@/lib/supabase/server'
import BillingClient from './BillingClient'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  const supabase = createClient()
  const userId = 'a040d19d-f40e-44f7-9b90-dead9d9bcfeb'

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', userId).single()

  return <BillingClient profile={profile} />
}