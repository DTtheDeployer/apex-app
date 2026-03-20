'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Zap, Shield, Settings, BarChart3, ArrowRight } from 'lucide-react'

interface Props {
  onComplete: () => void
}

const STEPS = [
  {
    icon: Zap,
    color: 'text-green',
    bg: 'bg-green/10 border-green/20',
    title: 'Welcome to APEX',
    subtitle: 'Your AI-powered trading copilot on Hyperliquid',
    body: 'APEX runs 6 adaptive strategies that automatically respond to market conditions. You start with paper trading — no real money, no setup required.',
    tip: 'Paper trading uses a $10,000 virtual balance so you can see how the bot performs before going live.',
  },
  {
    icon: BarChart3,
    color: 'text-blue',
    bg: 'bg-blue/10 border-blue/20',
    title: 'Your Dashboard',
    subtitle: 'Everything in one place',
    body: 'Your dashboard shows live equity, open positions, trade history, and signal radar. The bot sends heartbeats every 60 seconds so you always know it\'s running.',
    tip: 'Check the status indicator in the top-right — green means the bot is active and trading.',
  },
  {
    icon: Shield,
    color: 'text-teal',
    bg: 'bg-teal/10 border-teal/20',
    title: 'Non-Custodial Security',
    subtitle: 'Your keys, your funds',
    body: 'When you\'re ready for live trading, you\'ll connect a Hyperliquid API sub-wallet. APEX can only place trades — withdrawal is architecturally impossible via API keys.',
    tip: 'Generate a sub-wallet at app.hyperliquid.xyz/API. Never share your main wallet key.',
  },
  {
    icon: Settings,
    color: 'text-gold',
    bg: 'bg-gold/10 border-gold/20',
    title: 'Configure & Go Live',
    subtitle: 'You\'re in control',
    body: 'Head to Settings to choose your trading pairs, set leverage, configure risk limits, and connect notifications. When everything looks good, flip the switch to start live trading.',
    tip: 'Start with low leverage (2-3x) and a small position size until you\'re comfortable with the bot\'s behavior.',
  },
]

export default function OnboardingModal({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const router = useRouter()
  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  function handleNext() {
    if (isLast) {
      onComplete()
    } else {
      setStep(s => s + 1)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-surface border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === step ? 'w-8 bg-green' : i < step ? 'w-4 bg-green/40' : 'w-4 bg-white/10'
                }`}
              />
            ))}
          </div>
          <button
            onClick={onComplete}
            className="text-subtle hover:text-muted transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 ${current.bg}`}>
            <Icon className={`w-6 h-6 ${current.color}`} />
          </div>

          <h2 className="text-xl font-bold text-white mb-1">{current.title}</h2>
          <p className="text-muted text-sm mb-4">{current.subtitle}</p>
          <p className="text-sm text-muted/80 leading-relaxed mb-5">{current.body}</p>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3">
            <p className="text-xs text-muted leading-relaxed">
              <strong className="text-green">Tip:</strong> {current.tip}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-6">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            className={`text-sm text-muted hover:text-white transition-colors ${step === 0 ? 'invisible' : ''}`}
          >
            Back
          </button>
          <div className="flex gap-3">
            {isLast && (
              <button
                onClick={() => {
                  onComplete()
                  router.push('/settings')
                }}
                className="px-5 py-2.5 bg-white/5 border border-white/10 text-white text-sm font-medium rounded-lg hover:border-white/20 transition-all flex items-center gap-2"
              >
                <Settings className="w-3.5 h-3.5" />
                Go to Settings
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-5 py-2.5 bg-gradient-to-r from-teal to-green text-white text-sm font-semibold rounded-lg shadow-lg hover:shadow-green/25 transition-all flex items-center gap-2"
            >
              {isLast ? 'Start Trading' : 'Next'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
