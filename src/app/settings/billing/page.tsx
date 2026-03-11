'use client'
// src/app/settings/billing/page.tsx
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Zap, Check } from 'lucide-react'
import type { Profile } from '@/types'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    desc: 'Paper trading · always free',
    features: ['Paper trading mode', 'All 4 strategies', 'BTC + ETH', 'Live dashboard', 'Regime detection'],
    cta: 'Current plan',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    desc: 'Live trading · most popular',
    features: ['Live order execution', 'All 4 strategies', 'BTC, ETH + 5 more pairs', 'Custom risk settings', 'Email + Telegram alerts', 'Macro calendar', 'Priority support'],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 149,
    desc: 'Full access · all markets',
    features: ['Everything in Pro', 'All 100+ HL pairs', 'Custom strategy weights', 'Webhook integrations', 'Backtesting engine', 'Dedicated support'],
    cta: 'Upgrade to Elite',
    highlight: false,
  },
]

export default function BillingPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  async function upgrade(planId: string) {
    setUpgrading(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (e: any) {
      alert(e.message)
    }
    setUpgrading(null)
  }

  async function manageSubscription() {
    setUpgrading('manage')
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const { url } = await res.json()
    window.location.href = url
    setUpgrading(null)
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="w-5 h-5 border-2 border-green/30 border-t-green rounded-full animate-spin" />
    </div>
  )

  const currentPlan = profile?.plan ?? 'starter'

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted text-sm mt-0.5">Manage your subscription</p>
      </div>

      {/* Current subscription status */}
      {profile?.subscription_status === 'active' && (
        <div className="card mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-green" />
              <span className="font-semibold capitalize">{currentPlan} plan</span>
              <span className="badge-green">Active</span>
            </div>
            {profile.subscription_period_end && (
              <p className="text-xs text-muted">
                Renews {new Date(profile.subscription_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
          <button onClick={manageSubscription} disabled={upgrading === 'manage'}
            className="btn-secondary text-sm">
            {upgrading === 'manage' ? 'Loading…' : 'Manage subscription'}
          </button>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map(plan => {
          const isCurrent = plan.id === currentPlan
          return (
            <div key={plan.id}
              className={`card relative flex flex-col
                ${plan.highlight ? 'border-green/30 bg-green/[0.03]' : ''}
                ${isCurrent ? 'border-white/20' : ''}`}>
              {plan.highlight && (
                <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-green to-transparent" />
              )}
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge-green text-xs px-3">Most popular</span>
                </div>
              )}

              <div className="mb-5">
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <p className="text-xs text-subtle mt-0.5">{plan.desc}</p>
              </div>

              <div className="mb-5">
                <span className="text-3xl font-black">${plan.price}</span>
                <span className="text-muted text-sm">/mo</span>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green flex-shrink-0 mt-0.5" />
                    <span className="text-muted">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={isCurrent || !!upgrading}
                onClick={() => !isCurrent && upgrade(plan.id)}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors
                  ${isCurrent
                    ? 'bg-white/5 text-subtle cursor-default'
                    : plan.highlight
                      ? 'bg-green text-bg hover:bg-green/90'
                      : 'btn-secondary'}`}>
                {isCurrent ? 'Current plan' : upgrading === plan.id ? 'Loading…' : plan.cta}
              </button>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-subtle text-center mt-6">
        All plans are non-custodial. APEX never holds your funds. Cancel anytime.
      </p>
    </div>
  )
}
