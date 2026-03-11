import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.session) {
      return NextResponse.json({ error: error?.message || 'No session' }, { status: 401 })
    }

    const { access_token, refresh_token, expires_at } = data.session
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0]
    const cookieName = `sb-${projectRef}-auth-token`

    // @supabase/ssr expects the session stored as a JSON string
    const sessionValue = JSON.stringify({
      access_token,
      refresh_token,
      expires_at,
      token_type: 'bearer',
      user: data.user,
    })

    const response = NextResponse.json({ success: true })
    response.cookies.set(cookieName, sessionValue, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    console.log('Set cookie:', cookieName, 'length:', sessionValue.length)
    return response
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
