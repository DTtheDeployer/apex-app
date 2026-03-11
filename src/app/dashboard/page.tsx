import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0A1628',
        color: '#E8EEF4',
        padding: '40px',
      }}
    >
      <h1
        style={{
          color: '#00A896',
          fontSize: '28px',
          marginBottom: '16px',
        }}
      >
        APEX Dashboard
      </h1>

      <p style={{ color: '#8899aa' }}>Logged in as: {user.email}</p>
      <p style={{ color: '#8899aa', marginTop: '8px' }}>
        Dashboard coming soon...
      </p>
    </div>
  )
}