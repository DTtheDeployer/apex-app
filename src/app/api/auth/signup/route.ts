import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: Request) {
  // Rate limit: 5 signups per IP per 15 minutes
  const key = getRateLimitKey(request, 'signup')
  const { limited, resetIn } = rateLimit(key, { maxRequests: 5, windowMs: 15 * 60_000 })
  if (limited) {
    return NextResponse.json(
      { error: 'Too many signup attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(resetIn / 1000)) } }
    )
  }

  const { email, password } = await request.json()
  const supabase = createClient()

  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Send welcome email (non-blocking)
  sendWelcomeEmail(email)

  return NextResponse.json({ success: true })
}
