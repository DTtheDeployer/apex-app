import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limit: 10 login attempts per IP per 15 minutes
  const key = getRateLimitKey(request, 'login')
  const { limited, resetIn } = rateLimit(key, { maxRequests: 10, windowMs: 15 * 60_000 })
  if (limited) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(resetIn / 1000)) } }
    )
  }

  const { email, password } = await request.json()

  const response = NextResponse.json({ success: true })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return response
}
