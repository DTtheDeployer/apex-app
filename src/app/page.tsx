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
        className="rounded-lg flex items-center justify-center font-extrabold"
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
    <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-teal/80 mb-6">
      {children}
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-white antialiased overflow-x-hidden">
      {/* Nav */}
      <nav className="relative z-50 border-b border-white/[0.04]">
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
              href="/signup"
              className="text-sm font-medium px-5 py-2 rounded-md transition-all hover:brightness-110"
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
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(0,168,150,0.04) 0%, transparent 70%)' }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          <SectionLabel>Live on Hyperliquid</SectionLabel>

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

          <p className="text-lg md:text-xl text-white/40 max-w-xl mx-auto mb-10 leading-relaxed">
            Most trading bots are black boxes. APEX shows you the reasoning behind every entry and exit in plain English. Configure your strategy, set your risk, and understand every move.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/signup"
              className="w-full sm:w-auto font-semibold px-8 py-3.5 rounded-lg transition-all hover:brightness-110 text-base"
              style={{ background: 'linear-gradient(135deg, #00A896, #00BFA6)', color: '#fff' }}
            >
              Start paper trading free
            </Link>
            <a
              href="#transparency"
              className="w-full sm:w-auto border border-white/10 text-white/60 font-medium px-8 py-3.5 rounded-lg hover:text-white hover:border-white/20 transition-colors"
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
            className="rounded-xl p-6"
            style={{ background: 'rgba(15,31,58,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold">APEX</span>
                <span className="flex items-center gap-1.5 text-xs bg-teal/10 text-teal px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-teal rounded-full animate-pulse" />
                  Live
                </span>
              </div>
              <div className="text-[11px] text-white/40 bg-white/5 px-3 py-1.5 rounded">
                Aggressive &middot; 6% risk &middot; <span className="text-white/25">Updated 4s ago</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Equity', value: '$10,042.80', sub: '', color: 'text-white' },
                { label: 'Today P&L', value: '+$127.40', sub: '+1.27%', color: 'text-teal' },
                { label: 'Total P&L', value: '+$892.50', sub: '30d', color: 'text-teal' },
                { label: 'Win Rate', value: '67.3%', sub: '142 trades', color: 'text-white' },
              ].map((s) => (
                <div key={s.label} className="bg-white/[0.03] rounded-lg p-3 text-center">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">{s.label}</p>
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  {s.sub && <p className="text-[10px] text-white/20 mt-0.5">{s.sub}</p>}
                </div>
              ))}
            </div>

            {/* Signal Radar */}
            <div className="bg-white/[0.02] rounded-lg p-4 mb-4 border border-white/[0.04]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Signal Radar</p>
                <div className="flex items-center gap-4 text-[9px] text-white/20">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white/20" />Cold</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />Warm</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-teal" />Hot</span>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { name: 'BTC', pct: '82%', hot: 'teal', price: '$84,210' },
                  { name: 'ETH', pct: '45%', hot: 'yellow', price: '$3,142' },
                  { name: 'SOL', pct: '71%', hot: 'teal', price: '$168.40' },
                  { name: 'ARB', pct: '28%', hot: 'red', price: '$1.24' },
                  { name: 'DOGE', pct: '63%', hot: 'yellow', price: '$0.182' },
                ].map((a) => {
                  const isHot = a.hot === 'teal'
                  const bg = isHot ? 'bg-teal/[0.06] border-teal/20' : a.hot === 'yellow' ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white/[0.02] border-white/[0.04]'
                  const txt = isHot ? 'text-teal' : a.hot === 'yellow' ? 'text-yellow-500/80' : 'text-white/25'
                  return (
                    <div key={a.name} className={`rounded-md border p-2 text-center ${bg}`} style={isHot ? { boxShadow: '0 0 12px rgba(0,168,150,0.08)' } : undefined}>
                      <p className="text-xs font-bold mb-1">{a.name}</p>
                      <p className={`text-sm font-bold mb-0.5 ${txt}`}>{a.pct}</p>
                      <p className="text-[9px] text-white/20">{a.price}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Open position */}
            <div className="rounded-lg p-4 border border-white/[0.06]" style={{ background: 'rgba(15,31,58,0.4)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-teal rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-white/60">1 Open Position</span>
                </div>
                <span className="text-teal font-bold">+$84.20</span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold bg-teal/15 text-teal px-2 py-0.5 rounded">LONG</span>
                <span className="font-medium">BTC</span>
                <span className="text-xs text-white/35">10x</span>
                <span className="text-[10px] text-white/20 ml-auto">Opened 2h 14m ago</span>
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
              <div className="rounded-md p-3 border-l-2 border-teal/40" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Why this trade</p>
                <p className="text-xs text-white/45 leading-relaxed">
                  Strong uptrend detected. RSI at 58 shows momentum without being overbought.
                  Price above 20-EMA ($83,100) and 50-EMA ($81,400).
                  MACD positive, confirming bullish momentum. <span className="text-teal/70">72% confidence.</span>
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
          style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(8,18,32,1) 15%, rgba(8,18,32,1) 85%, transparent 100%)' }}
        />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel>Why APEX</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              The transparency difference
            </h2>
            <p className="text-lg text-white/45 max-w-2xl mx-auto">
              Other bots trade and hope you trust them. APEX shows you exactly what it&apos;s thinking before, during, and after every trade.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div
              className="rounded-xl p-8 border border-white/[0.04]"
              style={{ background: 'rgba(15,31,58,0.25)' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="text-sm text-white/20 font-medium uppercase tracking-wider">Others</span>
              </div>
              <ul className="space-y-4">
                {[
                  'Trade happens. No explanation.',
                  '"AI-powered" with zero insight into decisions',
                  'Position closed. Why? Who knows.',
                  'Settings are guesswork',
                  'When it loses, you learn nothing',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-white/30">
                    <span className="text-red-400 mt-0.5 shrink-0">&#10005;</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="rounded-xl p-8 border border-teal/15"
              style={{ background: 'rgba(0,168,150,0.03)' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center text-xs font-extrabold"
                  style={{ background: 'linear-gradient(135deg, #00A896, #00D4AA)', color: '#0A1628' }}
                >
                  A
                </div>
                <span className="text-sm font-bold">APEX</span>
              </div>
              <ul className="space-y-4 text-sm">
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

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: '6 AI Strategies', desc: 'Momentum, Dip Hunter, Breakout, Scalp, Swing, and the Adaptive hybrid. Each auto-adapts to market regime with multi-timeframe confirmation.' },
              { title: 'Active Position Manager', desc: 'Regime-reactive exits, trailing stops, time stops, partial scale-outs, and correlation guard. Not a static bot — it actively manages every trade.' },
              { title: 'Dynamic Risk Engine', desc: 'Half-Kelly position sizing, consecutive loss reducer, funding rate awareness, and daily circuit breaker. Your risk is always controlled.' },
              { title: 'Trade Explainer', desc: 'Every entry and exit comes with plain-English reasoning, target prices, R:R ratio, regime context, and expected hold time.' },
              { title: 'Signal Radar', desc: 'See how close each asset is to triggering. Cold, warm, and hot signals with real-time strength percentage and direction.' },
              { title: 'Live Notifications', desc: 'Discord and Telegram alerts on every trade open, close, regime flip, and circuit breaker. Never miss a move.' },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-lg p-6 border border-white/[0.04] hover:border-white/[0.08] transition-colors"
                style={{ background: 'rgba(15,31,58,0.25)' }}
              >
                <h3 className="text-base font-semibold mb-2">{f.title}</h3>
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
          style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(8,18,32,1) 15%, rgba(8,18,32,1) 85%, transparent 100%)' }}
        />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <SectionLabel>Intelligence</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Six strategies. One intelligent system.
            </h2>
            <p className="text-lg text-white/45 max-w-2xl mx-auto">
              APEX detects the market regime and adapts its approach. Each strategy is gated by 4h multi-timeframe confirmation, volume analysis, and funding rate awareness.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { color: 'bg-purple-500', name: 'APEX Adaptive', regime: 'ALL', winRate: '—', avgReturn: '—', desc: 'The flagship hybrid. Automatically switches between trend, mean reversion, and breakout based on live regime detection.' },
              { color: 'bg-teal', name: 'Momentum Rider', regime: 'TRENDING', winRate: '71%', avgReturn: '+2.4%', desc: 'Rides strong trends with RSI + MACD confirmation. Wider stops, lets winners run with trailing exits.' },
              { color: 'bg-blue-500', name: 'Dip Hunter', regime: 'RANGING', winRate: '63%', avgReturn: '+1.2%', desc: 'Buys deep oversold, sells deep overbought at Bollinger extremes. Precision entries in ranging markets.' },
              { color: 'bg-yellow-500', name: 'Breakout Blitz', regime: 'VOLATILE', winRate: '58%', avgReturn: '+3.1%', desc: 'Catches confirmed range breakouts with volume confirmation. Hard-rejects low-volume fakes.' },
              { color: 'bg-red-500', name: 'Scalp Sniper', regime: 'RANGING', winRate: '62%', avgReturn: '+0.8%', desc: 'Quick precision trades at extreme levels. Tight stops, fast exits. Only fires in confirmed ranging markets.' },
              { color: 'bg-amber-500', name: 'Swing King', regime: 'TRENDING', winRate: '65%', avgReturn: '+4.2%', desc: 'Patient multi-day entries with wide stops. Maximum conviction only. Holds through noise for big moves.' },
            ].map((s) => (
              <div
                key={s.name}
                className="rounded-lg p-6 border border-white/[0.04]"
                style={{ background: 'rgba(15,31,58,0.25)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${s.color}`} />
                    <h3 className="text-lg font-bold">{s.name}</h3>
                  </div>
                  <span className="text-[10px] text-white/25 bg-white/[0.03] px-2 py-1 rounded font-medium tracking-wider">
                    {s.regime}
                  </span>
                </div>
                <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/[0.04] text-xs">
                  <span className="text-white/25">Win rate <span className="text-white/60 font-medium">{s.winRate}</span></span>
                  <span className="text-white/25">Avg return <span className="text-teal/70 font-medium">{s.avgReturn}</span></span>
                </div>
              </div>
            ))}
          </div>

          <div
            className="mt-8 rounded-lg p-8 border border-white/[0.04]"
            style={{ background: 'rgba(15,31,58,0.25)' }}
          >
            <h3 className="text-sm font-semibold text-white/50 mb-8 text-center uppercase tracking-wider">Regime Detection</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-10 h-10 rounded-lg bg-teal/[0.06] text-teal flex items-center justify-center text-lg mx-auto mb-3">&#8599;</div>
                <p className="text-sm font-bold text-teal mb-1">TRENDING</p>
                <p className="text-xs text-white/35">Momentum + Pullback</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-lg bg-blue-500/[0.06] text-blue-400 flex items-center justify-center text-lg mx-auto mb-3">&#8596;</div>
                <p className="text-sm font-bold text-blue-400 mb-1">RANGING</p>
                <p className="text-xs text-white/35">Mean Reversion</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/[0.06] text-yellow-400 flex items-center justify-center text-lg mx-auto mb-3">&#9889;</div>
                <p className="text-sm font-bold text-yellow-400 mb-1">VOLATILE</p>
                <p className="text-xs text-white/35">Breakout</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
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
          style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(8,18,32,1) 15%, rgba(8,18,32,1) 85%, transparent 100%)' }}
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
              className="rounded-xl p-8 border border-white/[0.04]"
              style={{ background: 'rgba(15,31,58,0.25)' }}
            >
              <h3 className="text-xl font-bold mb-1">Starter</h3>
              <p className="text-white/35 text-sm mb-5">Paper trading</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-white/35 ml-1">/forever</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Full paper trading', 'All 6 strategies', 'BTC + ETH', 'Live dashboard', 'Trade explainer', 'Signal radar'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/55">
                    <span className="text-teal">&#10003;</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block text-center py-3 rounded-lg font-medium bg-white/[0.04] text-white/70 hover:bg-white/[0.06] border border-white/[0.06] transition-colors"
              >
                Start free
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-xl p-8 border border-teal/20 relative" style={{ background: 'rgba(0,168,150,0.03)' }}>
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
                {['Live order execution', 'All 6 strategies', 'BTC, ETH + 5 more pairs', 'Active Position Manager', 'Dynamic risk sizing', 'Discord/Telegram alerts'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/60">
                    <span className="text-teal">&#10003;</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block text-center py-3 rounded-lg font-semibold transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #00A896, #00BFA6)', color: '#fff' }}
              >
                Start Pro
              </Link>
            </div>

            {/* Elite */}
            <div
              className="rounded-xl p-8 border border-white/[0.04]"
              style={{ background: 'rgba(15,31,58,0.25)' }}
            >
              <h3 className="text-xl font-bold mb-1">Elite</h3>
              <p className="text-white/35 text-sm mb-5">Full access</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$149</span>
                <span className="text-white/35 ml-1">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Everything in Pro', 'All 100+ HL pairs', 'Custom strategy weights', 'Funding rate intelligence', 'Priority support', 'Early features'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/55">
                    <span className="text-teal">&#10003;</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block text-center py-3 rounded-lg font-medium bg-white/[0.04] text-white/70 hover:bg-white/[0.06] border border-white/[0.06] transition-colors"
              >
                Go Elite
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Credibility stats */}
      <section className="py-16 px-6 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-12 text-center">
          {[
            { val: '142', label: 'Trades executed (30d)' },
            { val: '67.3%', label: 'Win rate' },
            { val: '+8.9%', label: 'Monthly return' },
            { val: '<50ms', label: 'Avg execution' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-white/80 font-mono">{s.val}</p>
              <p className="text-xs text-white/25 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28 px-6">
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Ready to see the difference?
            </h2>
            <p className="text-lg text-white/40 mb-10">
              Paper trade free. See exactly why every trade happens. Upgrade to live trading when you&apos;re confident.
            </p>
            <Link
              href="/signup"
              className="inline-block font-semibold px-10 py-3.5 rounded-lg transition-all hover:brightness-110 text-base"
              style={{ background: 'linear-gradient(135deg, #00A896, #00BFA6)', color: '#fff' }}
            >
              Start paper trading free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-12 px-6">
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
