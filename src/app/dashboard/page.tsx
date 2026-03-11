'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/login')
      } else {
        setUser(user)
        setLoading(false)
      }
    })
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A896', fontSize: '18px' }}>
      Loading...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', color: '#E8EEF4', padding: '40px' }}>
      <h1 style={{ color: '#00A896', fontSize: '28px', marginBottom: '16px' }}>APEX Dashboard</h1>
      <p style={{ color: '#8899aa' }}>Logged in as: {user?.email}</p>
      <p style={{ color: '#8899aa', marginTop: '8px' }}>Dashboard coming soon...</p>
    </div>
  )
}
