import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'APEX - Transparent Perpetuals Trading for Hyperliquid',
  description: 'See exactly why every trade happens. AI-powered trading bot with full transparency, configurable strategies, and non-custodial execution on Hyperliquid.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white antialiased">
      <div className="fixed inset-0 opacity-30 pointer-events-none" style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px'}} />
      
      <nav className="relative z-50 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <span className="text-[#00d084]">&#9670;</span> APEX
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
              Start free
            </Link>
          </div>
        </div>
      </nav>

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
            Most trading bots are black boxes. APEX shows you the reasoning behind every entry and exit in plain English. Configure your strategy, set your risk, and understand every move.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/dashboard" className="w-full sm:w-auto bg-[#00d084] text-black font-semibold px-8 py-4 rounded-xl hover:bg-[#00b871] transition-all hover:scale-105 text-lg">
              Start paper trading free
            </Link>
            <a href="#transparency" className="w-full sm:w-auto border border-white/20 text-white font-medium px-8 py-4 rounded-xl hover:bg-white/5 transition-colors">
              See how it works
            </a>
          </div>
          
          <div className="flex items-center justify-center gap-6 text-sm text-white/40">
            <span className="flex items-center gap-2">
              <span className="text-[#00d084]">&#10003;</span> Non-custodial
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[#00d084]">&#10003;</span> Longs and shorts
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[#00d084]">&#10003;</span> Cancel anytime
            </span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-20">
          <div className="bg-[#111113] rounded-2xl border border-white/10 p-6 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold">APEX</span>
                <span className="flex items-center gap-1.5 text-xs bg-[#00d084]/10 text-[#00d084] px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-[#00d084] rounded-full animate-pulse" />
                  Live
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs bg-[#00d084]/10 text-[#00d084] border border-[#00d084]/30 px-3 py-1.5 rounded-lg">
                Aggressive - 6% risk
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Equity</p>
                <p className="text-lg font-bold text-white">$10.0k</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Today</p>
                <p className="text-lg font-bold text-[#00d084]">+$127.40</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Total</p>
                <p className="text-lg font-bold text-[#00d084]">+$892.50</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Win%</p>
                <p className="text-lg font-bold text-white">67%</p>
              </div>
            </div>

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
                <div className="rounded-lg border p-2 text-center bg-[#00d084]/10 border-[#00d084]/30">
                  <p className="text-xs font-bold mb-1">BTC</p>
                  <div className="w-3 h-3 rounded-full mx-auto mb-1 bg-[#00d084]" />
                  <p className="text-sm font-bold text-[#00d084]">82%</p>
                </div>
                <div className="rounded-lg border p-2 text-center bg-yellow-500/10 border-yellow-500/30">
                  <p className="text-xs font-bold mb-1">ETH</p>
                  <div className="w-3 h-3 rounded-full mx-auto mb-1 bg-yellow-500" />
                  <p className="text-sm font-bold text-yellow-500">45%</p>
                </div>
                <div className="rounded-lg border p-2 text-center bg-[#00d084]/10 border-[#00d084]/30">
                  <p className="text-xs font-bold mb-1">SOL</p>
                  <div className="w-3 h-3 rounded-full mx-auto mb-1 bg-[#00d084]" />
                  <p className="text-sm font-bold text-[#00d084]">71%</p>
                </div>
                <div className="rounded-lg border p-2 text-center bg-white/5 border-white/10">
                  <p className="text-xs font-bold mb-1">ARB</p>
                  <div className="w-3 h-3 rounded-full mx-auto mb-1 bg-red-500" />
                  <p className="text-sm font-bold text-white/40">28%</p>
                </div>
                <div className="rounded-lg border p-2 text-center bg-yellow-500/10 border-yellow-500/30">
                  <p className="text-xs font-bold mb-1">DOGE</p>
                  <div className="w-3 h-3 rounded-full mx-auto mb-1 bg-yellow-500" />
                  <p className="text-sm font-bold text-yellow-500">63%</p>
                </div>
              </div>
            </div>

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
              
              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <p className="text-[10px] text-blue-400 mb-1">Why this trade?</p>
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

      <section id="transparency" className="py-32 px-6 bg-[#08080a]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              The transparency difference
            </h2>
            <p className="text-xl text-white/50 max-w-2xl mx-auto">
              Other bots trade and hope you trust them. APEX shows you exactly what it is thinking before, during, and after every trade.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#111113] rounded-2xl p-8 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">&#128230;</span>
                <h3 className="text-xl font-bold">Other trading bots</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-white/50">
                  <span className="text-red-400 mt-0.5">&#10005;</span>
                  Trade happens. No explanation.
                </li>
                <li className="flex items-start gap-3 text-white/50">
                  <span className="text-red-400 mt-0.5">&#10005;</span>
                  AI-powered with zero insight into decisions
                </li>
                <li className="flex items-start gap-3 text-white/50">
                  <span className="text-red-400 mt-0.5">&#10005;</span>
                  Position closed. Why? Who knows.
                </li>
                <li className="flex items-start gap-3 text-white/50">
                  <span className="text-red-400 mt-0.5">&#10005;</span>
                  Settings are guesswork
                </li>
                <li className="flex items-start gap-3 text-white/50">
                  <span className="text-red-400 mt-0.5">&#10005;</span>
                  When it loses, you learn nothing
                </li>
              </ul>
            </div>

            <div className="bg-[#00d084]/5 rounded-2xl p-8 border border-[#00d084]/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl text-[#00d084]">&#9670;</span>
                <h3 className="text-xl font-bold">APEX</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-white/80">
                  <span className="text-[#00d084] mt-0.5">&#10003;</span>
                  Every trade includes plain-English reasoning
                </li>
                <li className="flex items-start gap-3 text-white/80">
                  <span className="text-[#00d084] mt-0.5">&#10003;</span>
                  See RSI, MACD, MAs - the actual indicators
                </li>
                <li className="flex items-start gap-3 text-white/80">
                  <span className="text-[#00d084] mt-0.5">&#10003;</span>
                  Know if it closed via TP, SL, or manual override
                </li>
                <li className="flex items-start gap-3 text-white/80">
                  <span className="text-[#00d084] mt-0.5">&#10003;</span>
                  Signal Radar shows how close each asset is to triggering
                </li>
                <li className="flex items-start gap-3 text-white/80">
                  <span className="text-[#00d084] mt-0.5">&#10003;</span>
                  Learn from wins AND losses with full explanations
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Full control. Full visibility.
            </h2>
            <p className="text-xl text-white/50 max-w-2xl mx-auto">
              Configure exactly how APEX trades and see exactly what it is doing at all times.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#111113] rounded-xl p-6 border border-white/5 hover:border-white/10 transition-colors">
              <span className="text-3xl mb-4 block">&#9881;</span>
              <h3 className="text-lg font-bold mb-2">Strategy Modes</h3>
              <p className="text-white/50 text-sm leading-relaxed">Conservative, Balanced, or Aggressive. Each adjusts RSI thresholds, entry criteria, and minimum confidence levels.</p>
            </div>
            <div className="bg-[#111113] rounded-xl p-6 border border-white/5 hover:border-white/10 transition-colors">
              <span className="text-3xl mb-4 block">&#128200;</span>
              <h3 className="text-lg font-bold mb-2">Risk Control</h3>
              <p className="text-white/50 text-sm leading-relaxed">Set 2%, 4%, or 6% risk per trade. Position sizing automatically adjusts to your equity and stop distance.</p>
            </div>
            <div className="bg-[#111113] rounded-xl p-6 border border-white/5 hover:border-white/10 transition-colors">
              <span className="text-3xl mb-4 block">&#127919;</span>
              <h3 className="text-lg font-bold mb-2">Signal Radar</h3>
              <p className="text-white/50 text-sm leading-relaxed">See how close each asset is to triggering a trade. Red (cold), Yellow (warming), Green (hot and ready).</p>
            </div>
            <div className="bg-[#111113] rounded-xl p-6 border border-white/5 hover:border-white/10 transition-colors">
              <span className="text-3xl mb-4 block">&#128172;</span>
              <h3 className="text-lg font-bold mb-2">Trade Explainer</h3>
              <p className="text-white/50 text-sm leading-relaxed">Every entry and exit comes with a plain-English explanation of the indicators and reasoning.</p>
            </div>
            <div className="bg-[#111113] rounded-xl p-6 border border-white/5 hover:border-white/10 transition-colors">
              <span className="text-3xl mb-4 block">&#128200;</span>
              <h3 className="text-lg font-bold mb-2">SL/TP Progress</h3>
              <p className="text-white/50 text-sm leading-relaxed">Visual progress bar shows exactly how close each position is to stop loss or take profit.</p>
            </div>
            <div className="bg-[#111113] rounded-xl p-6 border border-white/5 hover:border-white/10 transition-colors">
              <span className="text-3xl mb-4 block">&#9995;</span>
              <h3 className="text-lg font-bold mb-2">Manual Override</h3>
              <p className="text-white/50 text-sm leading-relaxed">Close any position instantly from the dashboard. You are always in control.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="strategies" className="py-32 px-6 bg-[#08080a]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Four strategies. One consensus.
            </h2>
            <p className="text-xl text-white/50 max-w-2xl mx-auto">
              APEX detects the market regime and adapts its approach. Trending, ranging, volatile - each gets a different strategy mix.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#111113] rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#00d084]" />
                  <h3 className="text-lg font-bold">Momentum</h3>
                </div>
                <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">TRENDING</span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">Catches strong directional moves when RSI shows momentum without being overbought. MACD confirmation required.</p>
            </div>
            <div className="bg-[#111113] rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <h3 className="text-lg font-bold">Trend Pullback</h3>
                </div>
                <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">TRENDING</span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">Buys dips in uptrends, sells rallies in downtrends. Waits for RSI to cool before entering with the trend.</p>
            </div>
            <div className="bg-[#111113] rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <h3 className="text-lg font-bold">Mean Reversion</h3>
                </div>
                <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">RANGING</span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">Fades extremes when market is choppy. Buys oversold at lower Bollinger Band, sells overbought at upper.</p>
            </div>
            <div className="bg-[#111113] rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <h3 className="text-lg font-bold">Breakout</h3>
                </div>
                <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">VOLATILE</span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">Catches 20-period high/low breaks with RSI confirmation. Rides momentum after range expansion.</p>
            </div>
          </div>

          <div className="mt-12 bg-[#111113] rounded-xl p-8 border border-white/5">
            <h3 className="text-xl font-bold mb-6 text-center">Market Regime Detection</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <span className="text-4xl block mb-3">&#128200;</span>
                <p className="font-bold text-[#00d084] mb-1">TRENDING UP</p>
                <p className="text-xs text-white/40">Momentum + Pullback</p>
              </div>
              <div className="text-center">
                <span className="text-4xl block mb-3">&#8596;</span>
                <p className="font-bold text-blue-400 mb-1">RANGING</p>
                <p className="text-xs text-white/40">Mean Reversion</p>
              </div>
              <div className="text-center">
                <span className="text-4xl block mb-3">&#9889;</span>
                <p className="font-bold text-yellow-400 mb-1">VOLATILE</p>
                <p className="text-xs text-white/40">Breakout</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-6xl mb-6 block">&#128274;</span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Your keys. Your funds. Always.
          </h2>
          <p className="text-xl text-white/50 mb-8 leading-relaxed">
            APEX connects via a trade-only API key you generate on Hyperliquid. 
            We can place trades - that is it. Withdrawals are technically impossible. 
            If APEX disappeared tomorrow, your funds are completely safe.
          </p>
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div>
              <p className="text-3xl font-bold text-[#00d084]">0%</p>
              <p className="text-sm text-white/40">Withdrawal access</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#00d084]">100%</p>
              <p className="text-sm text-white/40">Your custody</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#00d084]">1 click</p>
              <p className="text-sm text-white/40">Revoke access</p>
            </div>
          </div>
        </div>
      </section>

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
            <div className="bg-[#111113] rounded-2xl p-8 border border-white/5">
              <h3 className="text-xl font-bold mb-1">Starter</h3>
              <p className="text-white/40 text-sm mb-4">Paper trading</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-white/40">/forever</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-[#00d084]">&#10003;</span>
                  Full paper trading
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-[#00d084]">&#10003;</span>
                  All strategies
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-[#00d084]">&#10003;</span>
                  BTC + ETH
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-[#00d084]">&#10003;</span>
                  Live dashboard
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-[#00d084]">&#10003;</span>
                  Trade explainer
                </li>
              </ul>
              <Link href="/dashboard" className="block text-center py-3 rounded-xl font-medium bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors">
                Start free
              </Link>
            </div>

            <div className="bg-[#00d084]/5 rounded-2xl p-8 border border-[#00d084]/30">
              <span className="text-xs text-[#00d084] bg-[#00d084]/10 px-3 py-1 rounded-full mb-4 inline-block">
                Most popular
              </span>
              <h3 className="text-xl font-bold mb-1">Pro</h3>
              <p className="text-white/40 text-sm mb-4">Live trading</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$49</span>
                <span className="text-white/40">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-[#00d084]">&#10003;</span>
                  Live order execution
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-[#00d084]">&#10003;</span>
                  All strategies
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-[#00d084]">&#10003;</span>
                  BTC, ETH + 5 more pairs
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-[#00d084]">&#10003;</span>
                  Signal radar
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-[#00d084]">&#10003;</span>
                  Manual override
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-[#00d084]">&#10003;</span>
                  Email alerts
                </li>
              </ul>
              <Link href="/dashboard" className="block text-center py-3 rounded-xl font-medium bg-[#00d084] text-black hover:bg-[#00b871] transition-colors">
                Start Pro
              </Link>
            </div>

            <div className="bg-[#111113] rounded-2xl p-8 border border-white/5">
              <h3 className="text-xl font-bold mb-1">Elite</h3>
              <p className="text-white/40 text-sm mb-4">Full access</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$149</span>
                <span className="text-white/40">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-[#00d084]">&#10003;</span>
                  Everything in Pro
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-[#00d084]">&#10003;</span>
                  All 100+ HL pairs
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-[#00d084]">&#10003;</span>
                  Custom strategy weights
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-[#00d084]">&#10003;</span>
                  Telegram alerts
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-[#00d084]">&#10003;</span>
                  Priority support
                </li>
                <li className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-[#00d084]">&#10003;</span>
                  Early features
                </li>
              </ul>
              <Link href="/dashboard" className="block text-center py-3 rounded-xl font-medium bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-colors">
                Go Elite
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to see the difference?
          </h2>
          <p className="text-xl text-white/50 mb-10">
            Paper trade free. See exactly why every trade happens. Upgrade to live trading when you are confident.
          </p>
          <Link href="/dashboard" className="inline-block bg-[#00d084] text-black font-semibold px-10 py-4 rounded-xl hover:bg-[#00b871] transition-all hover:scale-105 text-lg">
            Start paper trading free
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 font-bold">
              <span className="text-[#00d084]">&#9670;</span> APEX
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
