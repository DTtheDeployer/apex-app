import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    let response = NextResponse.json({ success: true })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return []
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data.session || !data.user) {
      return NextResponse.json({ error: 'No session created' }, { status: 400 })
    }

    return response
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}