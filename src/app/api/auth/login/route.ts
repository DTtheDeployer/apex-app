import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Use plain supabase-js client (not SSR) to sign in
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.session) {
      return NextResponse.json({ error: error?.message || 'No session' }, { status: 401 })
    }

    const { access_token, refresh_token } = data.session
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0]

    const response = NextResponse.json({ success: true })

    // Set the cookies the same way @supabase/ssr middleware expects them
    response.cookies.set(`sb-${projectRef}-auth-token`, JSON.stringify([access_token, refresh_token]), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
