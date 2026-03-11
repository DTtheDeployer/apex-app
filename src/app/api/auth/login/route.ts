import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
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

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // Log what we got back for debugging
    console.log('Login success, cookies to set:', cookiesToSet.length, cookiesToSet.map(c => c.name))

    const response = NextResponse.json({ success: true, cookieCount: cookiesToSet.length })
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, { ...options, httpOnly: true, sameSite: 'lax', path: '/' })
    })

    return response
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
