// src/app/api/stripe/checkout/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLANS } from '@/lib/stripe'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'

export async function POST(req: Request) {
  try {
    // Rate limit: 10 checkout attempts per IP per 15 minutes
    const key = getRateLimitKey(req, 'checkout')
    const { limited } = rateLimit(key, { maxRequests: 10, windowMs: 15 * 60_000 })
    if (limited) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { plan } = await req.json()
    const planData = PLANS[plan as keyof typeof PLANS]
    if (!planData || !planData.priceId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles').select('stripe_customer_id, email').eq('id', user.id).single()

    let customerId = profile?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email ?? user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: planData.priceId!, quantity: 1 }],
      success_url: `${appUrl}/dashboard?upgraded=true`,
      cancel_url:  `${appUrl}/settings/billing`,
      subscription_data: {
        metadata: { supabase_user_id: user.id, plan },
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    console.error('Checkout error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
