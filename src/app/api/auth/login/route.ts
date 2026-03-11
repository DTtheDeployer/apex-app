import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const { email, password } = await request.json()
  const cookieStore = cookies()
  const cookiesToSet: { name: string; value: string; options: any }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(incoming) {
          incoming.forEach(c => cookiesToSet.push(c))
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, { ...options, httpOnly: true, sameSite: 'lax', path: '/' })
  })

  return response
}
