// src/app/api/webhooks/stripe/route.ts
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'
import { sendPaymentFailedEmail } from '@/lib/email'

// Map Stripe price IDs to plan names
const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_PRICE_PRO!]:   'pro',
  [process.env.STRIPE_PRICE_ELITE!]: 'elite',
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (e: any) {
    console.error('Webhook signature failed:', e.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    // ── Subscription created / updated ──────────────────────────────────────
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id
      if (!userId) break

      const priceId = sub.items.data[0]?.price.id
      const plan    = PRICE_TO_PLAN[priceId] ?? 'starter'
      const periodEnd = new Date(sub.current_period_end * 1000).toISOString()

      await supabase.from('profiles').update({
        plan,
        stripe_subscription_id: sub.id,
        subscription_status:     sub.status,
        subscription_period_end: periodEnd,
      }).eq('id', userId)

      console.log(`✅ Subscription updated: user=${userId} plan=${plan} status=${sub.status}`)
      break
    }

    // ── Subscription deleted / cancelled ────────────────────────────────────
    case 'customer.subscription.deleted': {
      const sub    = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id
      if (!userId) break

      await supabase.from('profiles').update({
        plan: 'starter',
        stripe_subscription_id: null,
        subscription_status: 'canceled',
        subscription_period_end: null,
      }).eq('id', userId)

      console.log(`🔴 Subscription cancelled: user=${userId}`)
      break
    }

    // ── Payment succeeded ────────────────────────────────────────────────────
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const subId = invoice.subscription as string
      if (!subId) break

      const sub = await stripe.subscriptions.retrieve(subId)
      const userId = sub.metadata?.supabase_user_id
      if (!userId) break

      await supabase.from('profiles').update({
        subscription_status: 'active',
        subscription_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      }).eq('id', userId)
      break
    }

    // ── Payment failed ───────────────────────────────────────────────────────
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subId = invoice.subscription as string
      if (!subId) break

      const sub = await stripe.subscriptions.retrieve(subId)
      const userId = sub.metadata?.supabase_user_id
      if (!userId) break

      await supabase.from('profiles').update({
        subscription_status: 'past_due',
      }).eq('id', userId)

      // Send payment failed email
      const { data: failedProfile } = await supabase
        .from('profiles').select('email').eq('id', userId).single()
      if (failedProfile?.email) {
        await sendPaymentFailedEmail(failedProfile.email)
      }

      console.warn(`⚠️ Payment failed: user=${userId}`)
      break
    }

    default:
      // Unhandled event — that's fine
      break
  }

  return NextResponse.json({ received: true })
}
