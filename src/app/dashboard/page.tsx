import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {}
        },
      },
    }
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
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