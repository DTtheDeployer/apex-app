import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'APEX - Transparent Perpetuals Trading for Hyperliquid',
  description: 'See exactly why every trade happens. AI-powered trading bot with full transparency, configurable strategies, and non-custodial execution on Hyperliquid.',
}

function ApexLogo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 32 : 40
  const fs = size === 'sm' ? 16 : 20
  const ts = size === 'sm' ? 16 : 20
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="rounded-[10px] flex items-center justify-center font-extrabold"
        style={{
          width: s, height: s, fontSize: fs,
          background: 'linear-gradient(135deg, #00A896, #00D4AA)',
          color: '#0A1628',
        }}
      >
        A
      </div>
      <span className="font-bold tracking-tight text-white" style={{ fontSize: ts }}>
        APEX
      </span>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-teal bg-teal/10 px-4 py-1.5 rounded-full mb-6 border border-teal/20">
      {children}
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-white antialiased overflow-x-hidden">
      {/* Subtle grid overlay */}
      <div
        className="fixed inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Nav */}
      <nav className="relative z-50 border-b border-white/5 backdrop-blur-md bg-bg/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <ApexLogo size="sm" />
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#transparency" className="hover:text-white transition-colors">Transparency</a>
            <a href="#strategies" className="hover:text-white transition-colors">Strategies</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors">
              Log in
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium px-5 py-2 rounded-lg transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #00A896, #00D4AA)', color: '#0A1628' }}
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-32 px-6">
        {/* Hero glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(0,168,150,0.07) 0%, transparent 70%)' }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          <SectionLabel>
            <span className="w-2 h-2 bg-teal rounded-full animate-pulse" />
            Live on Hyperliquid
          </SectionLabel>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.08] mb-6">
            Know exactly{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #00A896, #00D4AA)' }}
            >
              why
            </span>
            <br />every trade happens
          </h1>

          <p className="text-lg md:text-xl text-white/45 max-w-2xl mx-auto mb-10 leading-relaxed">
            Most trading bots are black boxes. APEX shows you the reasoning behind every entry and exit in plain English. Configure your strategy, set your risk, and understand every move.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto font-semibold px-8 py-4 rounded-xl transition-all hover:brightness-110 hover:scale-[1.02] text-lg"
              style={{ background: 'linear-gradient(135deg, #00A896, #00BFA6)', color: '#fff', boxShadow: '0 4px 24px rgba(0,168,150,0.25)' }}
            >
              Start paper trading free
            </Link>
            <a
              href="#transparency"
              className="w-full sm:w-auto border border-white/15 text-white font-medium px-8 py-4 rounded-xl hover:bg-white/5 transition-colors"
            >
              See how it works
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/35">
            <span className="flex items-center gap-2">
              <span className="text-teal">&#10003;</span> Non-custodial
            </span>
            <span className="flex items-center gap-2">
              <span className="text-teal">&#10003;</span> Longs and shorts
            </span>
            <span className="flex items-center gap-2">
              <span className="text-teal">&#10003;</span> Cancel anytime
            </span>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="max-w-5xl mx-auto mt-20">
          <div
            className="rounded-2xl p-6 shadow-2xl shadow-black/40"
            style={{ background: 'rgba(15,31,58,0.6)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold">APEX</span>
                <span className="flex items-center gap-1.5 text-xs bg-teal/10 text-teal px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-teal rounded-full animate-pulse" />
                  Live
                </span>
              </div>
              <div className="text-xs bg-teal/10 text-teal border border-teal/20 px-3 py-1.5 rounded-lg">
                Aggressive &middot; 6% risk
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Equity', value: '$10.0k', color: 'text-white' },
                { label: 'Today', value: '+$127.40', color: 'text-teal' },
                { label: 'Total', value: '+$892.50', color: 'text-teal' },
                { label: 'Win%', value: '67%', color: 'text-white' },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-white/35 uppercase tracking-wider">{s.label}</p>
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Signal Radar */}
            <div className="bg-white/[0.03] rounded-lg p-4 mb-4 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-white/35 uppercase tracking-wider font-medium">Signal Radar</p>
                <div className="flex items-center gap-3 text-[9px] text-white/25">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Cold</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" />Warm</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal" />Hot</span>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { name: 'BTC', pct: '82%', hot: 'teal' },
                  { name: 'ETH', pct: '45%', hot: 'yellow' },
                  { name: 'SOL', pct: '71%', hot: 'teal' },
                  { name: 'ARB', pct: '28%', hot: 'red' },
                  { name: 'DOGE', pct: '63%', hot: 'yellow' },
                ].map((a) => {
                  const bg = a.hot === 'teal' ? 'bg-teal/10 border-teal/25' : a.hot === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/25' : 'bg-white/5 border-white/10'
                  const dot = a.hot === 'teal' ? 'bg-teal' : a.hot === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                  const txt = a.hot === 'teal' ? 'text-teal' : a.hot === 'yellow' ? 'text-yellow-500' : 'text-white/35'
                  return (
                    <div key={a.name} className={`rounded-lg border p-2 text-center ${bg}`}>
                      <p className="text-xs font-bold mb-1">{a.name}</p>
                      <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${dot}`} />
                      <p className={`text-sm font-bold ${txt}`}>{a.pct}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Open position */}
            <div className="rounded-lg p-4 border border-teal/15" style={{ background: 'rgba(0,168,150,0.04)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-teal rounded-full animate-pulse" />
                  <span className="text-xs font-medium">1 Open Position</span>
                </div>
                <span className="text-teal font-bold">+$84.20</span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold bg-teal/15 text-teal px-2 py-0.5 rounded">LONG</span>
                <span className="font-medium">BTC</span>
                <span className="text-xs text-white/35">10x</span>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-[9px] text-white/35 mb-1">
                  <span className="text-red-400">SL $82,100</span>
                  <span className="text-teal">68% to TP</span>
                  <span className="text-teal">TP $86,500</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/15" />
                  <div className="absolute left-1/2 top-0 bottom-0 w-[34%] bg-teal rounded-full" />
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <p className="text-[10px] text-blue-400 mb-1">Why this trade?</p>
                <p className="text-xs text-white/50 leading-relaxed">
                  Strong uptrend detected. RSI at 58 shows momentum without being overbought.
                  Price ($84,200) is above both the 20-period ($83,100) and 50-period ($81,400) moving averages.
                  MACD is positive, confirming bullish momentum. Entering LONG with 72% confidence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transparency */}
      <section id="transparency" className="relative py-32 px-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(10,22,40,0) 0%, rgba(8,18,32,1) 15%, rgba(8,18,32,1) 85%, rgba(10,22,40,0) 100%)' }}
        />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel>Transparency</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              The transparency difference
            </h2>
            <p className="text-lg text-white/45 max-w-2xl mx-auto">
              Other bots trade and hope you trust them. APEX shows you exactly what it&apos;s thinking before, during, and after every trade.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div
              className="rounded-2xl p-8 border border-white/8"
              style={{ background: 'rgba(15,31,58,0.4)' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl opacity-60">&#128230;</span>
                <h3 className="text-xl font-bold">Other trading bots</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Trade happens. No explanation.',
                  '"AI-powered" with zero insight into decisions',
                  'Position closed. Why? Who knows.',
                  'Settings are guesswork',
                  'When it loses, you learn nothing',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-white/40">
                    <span className="text-red-400 mt-0.5 shrink-0">&#10005;</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="rounded-2xl p-8 border border-teal/20"
              style={{ background: 'rgba(0,168,150,0.04)' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-extrabold"
                  style={{ background: 'linear-gradient(135deg, #00A896, #00D4AA)', color: '#0A1628' }}
                >
                  A
                </div>
                <h3 className="text-xl font-bold">APEX</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Every trade includes plain-English reasoning',
                  'See RSI, MACD, MAs — the actual indicators',
                  'Know if it closed via TP, SL, or manual override',
                  'Signal Radar shows how close each asset is to triggering',
                  'Learn from wins and losses with full explanations',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-white/70">
                    <span className="text-teal mt-0.5 shrink-0">&#10003;</span>
                    {t}
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
            <SectionLabel>Features</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Full control. Full visibility.
            </h2>
            <p className="text-lg text-white/45 max-w-2xl mx-auto">
              Configure exactly how APEX trades and see exactly what it&apos;s doing at all times.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: '&#9881;', title: 'Strategy Modes', desc: 'Conservative, Balanced, or Aggressive. Each adjusts RSI thresholds, entry criteria, and minimum confidence levels.' },
              { icon: '&#128200;', title: 'Risk Control', desc: 'Set 2%, 4%, or 6% risk per trade. Position sizing automatically adjusts to your equity and stop distance.' },
              { icon: '&#127919;', title: 'Signal Radar', desc: 'See how close each asset is to triggering a trade. Red (cold), Yellow (warming), Green (hot and ready).' },
              { icon: '&#128172;', title: 'Trade Explainer', desc: 'Every entry and exit comes with a plain-English explanation of the indicators and reasoning.' },
              { icon: '&#128200;', title: 'SL/TP Progress', desc: 'Visual progress bar shows exactly how close each position is to stop loss or take profit.' },
              { icon: '&#9995;', title: 'Manual Override', desc: 'Close any position instantly from the dashboard. You are always in control.' },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl p-6 border border-white/[0.06] hover:border-teal/20 transition-all group"
                style={{ background: 'rgba(15,31,58,0.35)' }}
              >
                <span className="text-3xl mb-4 block" dangerouslySetInnerHTML={{ __html: f.icon }} />
                <h3 className="text-lg font-bold mb-2 group-hover:text-teal transition-colors">{f.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategies */}
      <section id="strategies" className="relative py-32 px-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(10,22,40,0) 0%, rgba(8,18,32,1) 15%, rgba(8,18,32,1) 85%, rgba(10,22,40,0) 100%)' }}
        />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel>Intelligence</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Four strategies. One consensus.
            </h2>
            <p className="text-lg text-white/45 max-w-2xl mx-auto">
              APEX detects the market regime and adapts its approach. Trending, ranging, volatile — each gets a different strategy mix.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              { color: 'bg-teal', name: 'Momentum', regime: 'TRENDING', desc: 'Catches strong directional moves when RSI shows momentum without being overbought. MACD confirmation required.' },
              { color: 'bg-blue-500', name: 'Trend Pullback', regime: 'TRENDING', desc: 'Buys dips in uptrends, sells rallies in downtrends. Waits for RSI to cool before entering with the trend.' },
              { color: 'bg-purple-500', name: 'Mean Reversion', regime: 'RANGING', desc: 'Fades extremes when market is choppy. Buys oversold at lower Bollinger Band, sells overbought at upper.' },
              { color: 'bg-yellow-500', name: 'Breakout', regime: 'VOLATILE', desc: 'Catches 20-period high/low breaks with RSI confirmation. Rides momentum after range expansion.' },
            ].map((s) => (
              <div
                key={s.name}
                className="rounded-xl p-6 border border-white/[0.06]"
                style={{ background: 'rgba(15,31,58,0.35)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${s.color}`} />
                    <h3 className="text-lg font-bold">{s.name}</h3>
                  </div>
                  <span className="text-[11px] text-white/30 bg-white/5 px-2.5 py-1 rounded font-medium tracking-wide">
                    {s.regime}
                  </span>
                </div>
                <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div
            className="mt-10 rounded-xl p-8 border border-white/[0.06]"
            style={{ background: 'rgba(15,31,58,0.35)' }}
          >
            <h3 className="text-lg font-bold mb-8 text-center">Market Regime Detection</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-teal/10 text-teal flex items-center justify-center text-xl mx-auto mb-3">&#8599;</div>
                <p className="font-bold text-teal mb-1">TRENDING UP</p>
                <p className="text-xs text-white/35">Momentum + Pullback</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-xl mx-auto mb-3">&#8596;</div>
                <p className="font-bold text-blue-400 mb-1">RANGING</p>
                <p className="text-xs text-white/35">Mean Reversion</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center text-xl mx-auto mb-3">&#9889;</div>
                <p className="font-bold text-yellow-400 mb-1">VOLATILE</p>
                <p className="text-xs text-white/35">Breakout</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal/10 text-teal flex items-center justify-center text-3xl mx-auto mb-6">
            &#128274;
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Your keys. Your funds. Always.
          </h2>
          <p className="text-lg text-white/45 mb-10 leading-relaxed max-w-2xl mx-auto">
            APEX connects via a trade-only API key you generate on Hyperliquid.
            We can place trades — that&apos;s it. Withdrawals are technically impossible.
            If APEX disappeared tomorrow, your funds are completely safe.
          </p>
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { val: '0%', label: 'Withdrawal access' },
              { val: '100%', label: 'Your custody' },
              { val: '1 click', label: 'Revoke access' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-teal">{s.val}</p>
                <p className="text-sm text-white/35 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative py-32 px-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(10,22,40,0) 0%, rgba(8,18,32,1) 15%, rgba(8,18,32,1) 85%, rgba(10,22,40,0) 100%)' }}
        />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel>Pricing</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Start free. Upgrade when ready.
            </h2>
            <p className="text-lg text-white/45">
              Paper trade for as long as you need. No credit card required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Starter */}
            <div
              className="rounded-2xl p-8 border border-white/[0.06]"
              style={{ background: 'rgba(15,31,58,0.35)' }}
            >
              <h3 className="text-xl font-bold mb-1">Starter</h3>
              <p className="text-white/35 text-sm mb-5">Paper trading</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-white/35 ml-1">/forever</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Full paper trading', 'All strategies', 'BTC + ETH', 'Live dashboard', 'Trade explainer'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/55">
                    <span className="text-teal">&#10003;</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard"
                className="block text-center py-3 rounded-xl font-medium bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors"
              >
                Start free
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-2xl p-8 border border-teal/25 relative" style={{ background: 'rgba(0,168,150,0.05)' }}>
              <span className="text-xs text-teal bg-teal/10 px-3 py-1 rounded-full mb-4 inline-block border border-teal/20">
                Most popular
              </span>
              <h3 className="text-xl font-bold mb-1">Pro</h3>
              <p className="text-white/35 text-sm mb-5">Live trading</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$49</span>
                <span className="text-white/35 ml-1">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Live order execution', 'All strategies', 'BTC, ETH + 5 more pairs', 'Signal radar', 'Manual override', 'Email alerts'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/60">
                    <span className="text-teal">&#10003;</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard"
                className="block text-center py-3 rounded-xl font-semibold transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #00A896, #00BFA6)', color: '#fff' }}
              >
                Start Pro
              </Link>
            </div>

            {/* Elite */}
            <div
              className="rounded-2xl p-8 border border-white/[0.06]"
              style={{ background: 'rgba(15,31,58,0.35)' }}
            >
              <h3 className="text-xl font-bold mb-1">Elite</h3>
              <p className="text-white/35 text-sm mb-5">Full access</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$149</span>
                <span className="text-white/35 ml-1">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Everything in Pro', 'All 100+ HL pairs', 'Custom strategy weights', 'Telegram alerts', 'Priority support', 'Early features'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/55">
                    <span className="text-teal">&#10003;</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard"
                className="block text-center py-3 rounded-xl font-medium bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors"
              >
                Go Elite
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6">
        <div className="max-w-3xl mx-auto text-center relative">
          <div
            className="absolute inset-0 -top-20 -bottom-20 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(0,168,150,0.06) 0%, transparent 70%)' }}
          />
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Ready to see the difference?
            </h2>
            <p className="text-lg text-white/45 mb-10">
              Paper trade free. See exactly why every trade happens. Upgrade to live trading when you&apos;re confident.
            </p>
            <Link
              href="/dashboard"
              className="inline-block font-semibold px-10 py-4 rounded-xl transition-all hover:brightness-110 hover:scale-[1.02] text-lg"
              style={{ background: 'linear-gradient(135deg, #00A896, #00BFA6)', color: '#fff', boxShadow: '0 4px 24px rgba(0,168,150,0.25)' }}
            >
              Start paper trading free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <ApexLogo size="sm" />
            <p className="text-sm text-white/25 text-center md:text-left">
              Trading involves significant risk. Past performance does not guarantee future results.
            </p>
            <div className="flex items-center gap-6 text-sm text-white/35">
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
