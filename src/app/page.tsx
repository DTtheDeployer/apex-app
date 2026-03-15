import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'APEX — Transparent Perpetuals Trading for Hyperliquid',
  description: 'See exactly why every trade happens. AI-powered trading bot with full transparency, configurable strategies, and non-custodial execution on Hyperliquid.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white antialiased">
      {/* Subtle grid background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
      
      {/* Nav */}
      <nav className="relative z-50 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <span className="text-[#00d084]">◆</span> APEX
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#transparency" className="hover:text-white transition-colors">Transparency</a>
            <a href="#strategies" className="hover:text-white transition-colors">Strategies</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">Log in</Link>
            <Link href="/dashboard" className="text-sm bg-[#00d084] text-black font-medium px-4 py-2 rounded-lg hover:bg-[#00b871] transition-colors">
              Start free →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-sm text-[#00d084] bg-[#00d084]/10 px-4 py-1.5 rounded-full mb-8 border border-[#00d084]/20">
            <span className="w-2 h-2 bg-[#00d084] rounded-full animate-pulse" />
            Live on Hyperliquid
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Know exactly<br />
            <span className="text-[#00d084]">why</span> every trade happens
          </h1>
          
          <p className="text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Most trading bots are black boxes. APEX shows you the reasoning behind every entry and exit — 
            in plain English. Configure your strategy, set your risk, and understand every move.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/dashboard" className="w-full sm:w-auto bg-[#00d084] text-black font-semibold px-8 py-4 rounded-xl hover:bg-[#00b871] transition-all hover:scale-105 text-lg">
              Start paper trading free →
            </Link>
            <a href="#transparency" className="w-full sm:w-auto border border-white/20 text-white font-medium px-8 py-4 rounded-xl hover:bg-white/5 transition-colors">
              See how it works
            </a>
          </div>
          
          <div className="flex items-center justify-center gap-6 text-sm text-white/40">
            <span className="flex items-center gap-2">
              <span className="text-[#00d084]">✓</span> Non-custodial
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[#00d084]">✓</span> Longs & shorts
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[#00d084]">✓</span> Cancel anytime
            </span>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="max-w-5xl mx-auto mt-20">
          <div className="bg-[#111113] rounded-2xl border border-white/10 p-6 shadow-2xl shadow-black/50">
            {/* Mock Dashboard Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold">APEX</span>
                <span className="flex items-center gap-1.5 text-xs bg-[#00d084]/10 text-[#00d084] px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-[#00d084] rounded-full animate-pulse" />
                  Live
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs bg-[#00d084]/10 text-[#00d084] border border-[#00d084]/30 px-3 py-1.5 rounded-lg">
                <span>⚡</span> Aggressive • 6% risk
              </div>
            </div>
            
            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: 'EQUITY', value: '$10.0k', color: 'text-white' },
                { label: 'TODAY', value: '+$127.40', color: 'text-[#00d084]' },
                { label: 'TOTAL', value: '+$892.50', color: 'text-[#00d084]' },
                { label: 'WIN%', value: '67%', color: 'text-white' },
              ].map(stat => (
                <div key={stat.label} className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Signal Radar */}
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Signal Radar</p>
                <div className="flex items-center gap-3 text-[9px] text-white/30">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Cold</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" />Warm</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00d084]" />Hot</span>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { symbol: 'BTC', strength: 82, direction: 'LONG' },
                  { symbol: 'ETH', strength: 45, direction: 'SHORT' },
                  { symbol: 'SOL', strength: 71, direction: 'LONG' },
                  { symbol: 'ARB', strength: 28, direction: 'NEUTRAL' },
                  { symbol: 'DOGE', strength: 63, direction: 'SHORT' },
                ].map(asset => (
                  <div key={asset.symbol} className={`rounded-lg border p-2 text-center ${
                    asset.strength >= 70 ? 'bg-[#00d084]/10 border-[#00d084]/30' :
                    asset.strength >= 40 ? 'bg-yellow-500/10 border-yellow-500/30' :
                    'bg-white/5 border-white/10'
                  }`}>
                    <p className="text-xs font-bold mb-1">{asset.symbol}</p>
                    <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                      asset.strength >= 70 ? 'bg-[#00d084]' :
                      asset.strength >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <p className={`text-sm font-bold ${
                      asset.strength >= 70 ? 'text-[#00d084]' :
                      asset.strength >= 40 ? 'text-yellow-500' : 'text-white/40'
                    }`}>{asset.strength}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Open Position with Explainer */}
            <div className="bg-[#00d084]/5 rounded-lg border border-[#00d084]/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#00d084] rounded-full animate-pulse" />
                  <span className="text-xs font-medium">1 Open Position</span>
                </div>
                <span className="text-[#00d084] font-bold">+$84.20</span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold bg-[#00d084]/20 text-[#00d084] px-2 py-0.5 rounded">LONG</span>
                <span className="font-medium">BTC</span>
                <span className="text-xs text-white/40">10x</span>
              </div>
              
              {/* SL/TP Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-[9px] text-white/40 mb-1">
                  <span className="text-red-400">SL $82,100</span>
                  <span className="text-[#00d084]">68% to TP</span>
                  <span className="text-[#00d084]">TP $86,500</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
                  <div className="absolute left-1/2 top-0 bottom-0 w-[34%] bg-[#00d084]" />
                </div>
              </div>
              
              {/* Explainer */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <p className="text-[10px] text-blue-400 mb-1">ℹ Why this trade?</p>
                <p className="text-xs text-white/60 leading-relaxed">
                  Strong uptrend detected. RSI at 58 shows momentum without being overbought. 
                  Price ($84,200) is above both the 20-period ($83,100) and 50-period ($81,400) moving averages. 
                  MACD is positive, confirming bullish momentum. Entering LONG with 72% confidence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Transparency Difference */}
      <section id="transparency" className="py-32 px-6 bg-[#08080a]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              The transparency difference
            </h2>
            <p className="text-xl text-white/50 max-w-2xl mx-auto">
              Other bots trade and hope you trust them. APEX shows you exactly what it's thinking — before, during, and after every trade.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Black Box */}
            <div className="bg-[#111113] rounded-2xl p-8 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">📦</span>
                <h3 className="text-xl font-bold">Other trading bots</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Trade happens. No explanation.',
                  '"AI-powered" with zero insight into decisions',
                  'Position closed. Why? Who knows.',
                  'Settings are guesswork',
                  'When it loses, you learn nothing',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/50">
                    <span className="text-red-400 mt-0.5">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* APEX */}
            <div className="bg-[#00d084]/5 rounded-2xl p-8 border border-[#00d084]/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl text-[#00d084]">◆</span>
                <h3 className="text-xl font-bold">APEX</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Every trade includes plain-English reasoning',
                  'See RSI, MACD, MAs — the actual indicators',
                  'Know if it closed via TP, SL, or manual override',
                  'Signal Radar shows how close each asset is to triggering',
                  'Learn from wins AND losses with full explanations',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/80">
                    <span className="text-[#00d084] mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Full control. Full visibility.
            </h2>
            <p className="text-xl text-white/50 max-w-2xl mx-auto">
              Configure exactly how APEX trades — and see exactly what it's doing at all times.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '⚙️',
                title: 'Strategy Modes',
                description: 'Conservative, Balanced, or Aggressive. Each adjusts RSI thresholds, entry criteria, and minimum confidence levels.',
              },
              {
                icon: '📊',
                title: 'Risk Control',
                description: 'Set 2%, 4%, or 6% risk per trade. Position sizing automatically adjusts to your equity and stop distance.',
              },
              {
                icon: '🎯',
                title: 'Signal Radar',
                description: 'See how close each asset is to triggering a trade. Red (cold), Yellow (warming), Green (hot and ready).',
              },
              {
                icon: '💬',
                title: 'Trade Explainer',
                description: 'Every entry and exit comes with a plain-English explanation of the indicators and reasoning.',
              },
              {
                icon: '📈',
                title: 'SL/TP Progress',
                description: 'Visual progress bar shows exactly how close each position is to stop loss or take profit.',
              },
              {
                icon: '🖐️',
                title: 'Manual Override',
                description: 'Close any position instantly from the dashboard. You're always in control.',
              },
            ].map((feature, i) => (
              <div key={i} className="bg-[#111113] rounded-xl p-6 border border-white/5 hover:border-white/10 transition-colors">
                <span className="text-3xl mb-4 block">{feature.icon}</span>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategies */}
      <section id="strategies" className="py-32 px-6 bg-[#08080a]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Four strategies. One consensus.
            </h2>
            <p className="text-xl text-white/50 max-w-2xl mx-auto">
              APEX detects the market regime and adapts its approach. Trending, ranging, volatile — each gets a different strategy mix.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                name: 'Momentum',
                regime: 'TRENDING',
                color: 'bg-[#00d084]',
                description: 'Catches strong directional moves when RSI shows momentum without being overbought. MACD confirmation required.',
              },
              {
                name: 'Trend Pullback',
                regime: 'TRENDING',
                color: 'bg-blue-500',
                description: 'Buys dips in uptrends, sells rallies in downtrends. Waits for RSI to cool before entering with the trend.',
              },
              {
                name: 'Mean Reversion',
                regime: 'RANGING',
                color: 'bg-purple-500',
                description: 'Fades extremes when market is choppy. Buys oversold at lower Bollinger Band, sells overbought at upper.',
              },
              {
                name: 'Breakout',
                regime: 'VOLATILE',
                color: 'bg-yellow-500',
                description: 'Catches 20-period high/low breaks with RSI confirmation. Rides momentum after range expansion.',
              },
            ].map((strategy, i) => (
              <div key={i} className="bg-[#111113] rounded-xl p-6 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${strategy.color}`} />
                    <h3 className="text-lg font-bold">{strategy.name}</h3>
                  </div>
                  <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">{strategy.regime}</span>
                </div>
                <p className="text-white/50 text-sm leading-relaxed">{strategy.description}</p>
              </div>
            ))}
          </div>

          {/* Regime Detection */}
          <div className="mt-12 bg-[#111113] rounded-xl p-8 border border-white/5">
            <h3 className="text-xl font-bold mb-6 text-center">Market Regime Detection</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { regime: 'TRENDING UP', color: 'text-[#00d084]', icon: '📈', strategies: 'Momentum + Pullback' },
                { regime: 'RANGING', color: 'text-blue-400', icon: '↔️', strategies: 'Mean Reversion' },
                { regime: 'VOLATILE', color: 'text-yellow-400', icon: '⚡', strategies: 'Breakout' },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <span className="text-4xl block mb-3">{item.icon}</span>
                  <p className={`font-bold ${item.color} mb-1`}>{item.regime}</p>
                  <p className="text-xs text-white/40">{item.strategies}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Non-Custodial */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-6xl mb-6 block">🔐</span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Your keys. Your funds. Always.
          </h2>
          <p className="text-xl text-white/50 mb-8 leading-relaxed">
            APEX connects via a trade-only API key you generate on Hyperliquid. 
            We can place trades — that's it. Withdrawals are technically impossible. 
            If APEX disappeared tomorrow, your funds are completely safe.
          </p>
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            {[
              { value: '0%', label: 'Withdrawal access' },
              { value: '100%', label: 'Your custody' },
              { value: '1 click', label: 'Revoke access' },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-3xl font-bold text-[#00d084]">{stat.value}</p>
                <p className="text-sm text-white/40">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-6 bg-[#08080a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Start free. Upgrade when ready.
            </h2>
            <p className="text-xl text-white/50">
              Paper trade for as long as you need. No credit card required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Starter',
                price: '$0',
                period: 'forever',
                description: 'Paper trading',
                features: [
                  'Full paper trading',
                  'All strategies',
                  'BTC + ETH',
                  'Live dashboard',
                  'Trade explainer',
                ],
                cta: 'Start free',
                highlight: false,
              },
              {
                name: 'Pro',
                price: '$49',
                period: '/mo',
                description: 'Live trading',
                features: [
                  'Live order execution',
                  'All strategies',
                  'BTC, ETH + 5 more pairs',
                  'Signal radar',
                  'Manual override',
                  'Email alerts',
                ],
                cta: 'Start Pro',
                highlight: true,
              },
              {
                name: 'Elite',
                price: '$149',
                period: '/mo',
                description: 'Full access',
                features: [
                  'Everything in Pro',
                  'All 100+ HL pairs',
                  'Custom strategy weights',
                  'Telegram alerts',
                  'Priority support',
                  'Early features',
                ],
                cta: 'Go Elite',
                highlight: false,
              },
            ].map((plan, i) => (
              <div key={i} className={`rounded-2xl p-8 border ${
                plan.highlight 
                  ? 'bg-[#00d084]/5 border-[#00d084]/30' 
                  : 'bg-[#111113] border-white/5'
              }`}>
                {plan.highlight && (
                  <span className="text-xs text-[#00d084] bg-[#00d084]/10 px-3 py-1 rounded-full mb-4 inline-block">
                    Most popular
                  </span>
                )}
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-white/40 text-sm mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-white/40">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-white/70">
                      <span className="text-[#00d084]">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link 
                  href="/dashboard"
                  className={`block text-center py-3 rounded-xl font-medium transition-colors ${
                    plan.highlight
                      ? 'bg-[#00d084] text-black hover:bg-[#00b871]'
                      : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to see the difference?
          </h2>
          <p className="text-xl text-white/50 mb-10">
            Paper trade free. See exactly why every trade happens. Upgrade to live trading when you're confident.
          </p>
          <Link href="/dashboard" className="inline-block bg-[#00d084] text-black font-semibold px-10 py-4 rounded-xl hover:bg-[#00b871] transition-all hover:scale-105 text-lg">
            Start paper trading free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 font-bold">
              <span className="text-[#00d084]">◆</span> APEX
            </div>
            <p className="text-sm text-white/30">
              Trading involves significant risk. Past performance does not guarantee future results.
            </p>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
