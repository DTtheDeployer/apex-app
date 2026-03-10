// src/lib/stripe.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
})

export const PLANS = {
  starter: { name: 'Starter', price: 0,   priceId: null },
  pro:     { name: 'Pro',     price: 49,  priceId: process.env.STRIPE_PRICE_PRO },
  elite:   { name: 'Elite',   price: 149, priceId: process.env.STRIPE_PRICE_ELITE },
} as const

export type Plan = keyof typeof PLANS
