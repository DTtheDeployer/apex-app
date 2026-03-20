'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, CreditCard, CheckCircle } from 'lucide-react'
import type { Profile } from '@/types'

interface Props {
  profile: Profile | null
}

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price: 0,
    features: ['1 trading pair (BTC)', 'Paper trading only', 'Basic dashboard'],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 49,
    features: ['Up to 7 trading pairs', 'Live trading enabled', 'Discord & Telegram alerts', 'Full trade history'],
  },
  {
    key: 'elite',
    name: 'Elite',
    price: 149,
    features: ['All 100+ Hyperliquid pairs', 'Live trading enabled', 'All notification channels', 'Priority support'],
  },
]

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active:   { label: 'Active',    className: 'badge-green' },
  past_due: { label: 'Past due',  className: 'badge-red' },
  canceled: { label: 'Cancelled', className: 'badge-subtle' },
  inactive: { label: 'Inactive',  className: 'badge-subtle' },
}

export default function BillingClient({ profile }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const currentPlan = profile?.plan ?? 'starter'
  const subStatus   = profile?.subscription_status ?? 'inactive'
  const periodEnd   = profile?.subscription_period_end
    ? new Date(profile.subscription_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  async function upgrade(planKey: string) {
    setLoading(planKey)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      })
      const json = await res.json() as { url?: string; error?: string }
      if (!res.ok || !json.url) throw new Error(json.error ?? 'Failed to create checkout session')
      router.push(json.url)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setLoading(null)
    }
  }

  async function manageSubscription() {
    setLoading('portal')
    setError('')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const json = await res.json() as { url?: string; error?: string }
      if (!res.ok || !json.url) throw new Error(json.error ?? 'Failed to open billing portal')
      router.push(json.url)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setLoading(null)
    }
  }

  const statusInfo = STATUS_LABEL[subStatus] ?? STATUS_LABEL.inactive

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted text-sm mt-0.5">Manage your subscription and billing details</p>
      </div>

      {error && (
        <div className="card border-red/20 bg-red/5 mb-6 text-red text-sm">{error}</div>
      )}

      {/* Current plan summary */}
      <section className="card mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted uppercase tracking-wider font-medium mb-1">Current plan</p>
            <div className="flex items-center gap-3">
              <p className="text-xl font-bold capitalize">{currentPlan}</p>
              <span className={statusInfo.className}>{statusInfo.label}</span>
            </div>
            {periodEnd && (
              <p className="text-xs text-subtle mt-1">
                {subStatus === 'canceled' ? 'Access until' : 'Renews'} {periodEnd}
              </p>
            )}
          </div>
          {currentPlan !== 'starter' && (
            <button
              onClick={manageSubscription}
              disabled={loading === 'portal'}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              {loading === 'portal' ? 'Loading…' : 'Manage subscription'}
            </button>
          )}
        </div>
      </section>

      {/* Plan cards */}
      <div className="grid gap-4">
        {PLANS.map(plan => {
          const isCurrent = plan.key === currentPlan
          const currentPrice = PLANS.find(p => p.key === currentPlan)?.price ?? 0
          const isUpgrade = plan.price > currentPrice
          const isStarter = plan.key === 'starter'

          return (
            <div
              key={plan.key}
              className={`card flex items-start justify-between gap-4 ${isCurrent ? 'border-green/30' : ''}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className={`w-4 h-4 ${isCurrent ? 'text-green' : 'text-subtle'}`} />
                  <p className="font-semibold text-sm">{plan.name}</p>
                  {isCurrent && <span className="badge-green">Current</span>}
                  <p className="ml-auto text-sm font-bold">
                    {plan.price === 0 ? 'Free' : `$${plan.price}/mo`}
                  </p>
                </div>
                <ul className="space-y-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted">
                      <CheckCircle className="w-3.5 h-3.5 text-green/60 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              {!isCurrent && !isStarter && isUpgrade && (
                <button
                  onClick={() => upgrade(plan.key)}
                  disabled={loading === plan.key}
                  className="btn-primary flex-shrink-0 disabled:opacity-50"
                >
                  {loading === plan.key ? 'Loading…' : 'Upgrade'}
                </button>
              )}
              {!isCurrent && !isUpgrade && currentPlan !== 'starter' && (
                <button
                  onClick={manageSubscription}
                  disabled={loading === 'portal'}
                  className="btn-secondary flex-shrink-0 disabled:opacity-50 text-sm"
                >
                  {loading === 'portal' ? 'Loading…' : 'Downgrade'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
