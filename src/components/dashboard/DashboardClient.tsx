'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { RefreshCw, Zap, Clock, TrendingUp, TrendingDown, Minus, Settings, AlertTriangle, X, Info, ChevronDown, ChevronUp, Power, Target, Crown, Crosshair, Trophy, BarChart3, ArrowRight, Sparkles } from 'lucide-react'
import type { Profile, BotConfig, Trade, BotHeartbeat, EquitySnapshot, UserStats } from '@/types'

interface SignalScan {
  symbol: string
  strength: number
  direction: 'LONG' | 'SHORT' | 'NEUTRAL'
  trigger: string
  rsi?: number
}

interface StrategyStats {
  trades: number
  wins: number
  losses: number
  pnl: number
}

interface Props {
  profile: Profile | null
  config: BotConfig | null
  trades: Trade[]
  heartbeat: BotHeartbeat | null
  equityHistory: EquitySnapshot[]
  stats: UserStats | null
  botEnabled?: boolean
  currentStrategy?: string
  strategyStats?: Record<string, StrategyStats>
}

const STRATEGIES = [
  { 
    id: 'apex_adaptive', 
    name: 'APEX Adaptive', 
    icon: Sparkles, 
    color: 'text-purple-400', 
    bg: 'bg-purple-500/10 border-purple-500/30',
    gradient: 'from-purple-500/20 to-indigo-500/20',
    glow: 'shadow-purple-500/20',
    desc: 'Adapts to market regime automatically',
    style: 'Hybrid',
    holdTime: 'Varies'
  },
  { 
    id: 'momentum_rider', 
    name: 'Momentum Rider', 
    icon: TrendingUp, 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    gradient: 'from-emerald-500/20 to-green-500/20',
    glow: 'shadow-emerald-500/20',
    desc: 'Ride strong trends with RSI + MACD confirmation',
    style: 'Trend',
    holdTime: 'Hours-Days'
  },
  { 
    id: 'dip_hunter', 
    name: 'Dip Hunter', 
    icon: Target, 
    color: 'text-blue-400', 
    bg: 'bg-blue-500/10 border-blue-500/30',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    glow: 'shadow-blue-500/20',
    desc: 'Buy oversold, sell overbought at Bollinger extremes',
    style: 'Mean Reversion',
    holdTime: 'Hours'
  },
  { 
    id: 'breakout_blitz', 
    name: 'Breakout Blitz', 
    icon: Zap, 
    color: 'text-yellow-400', 
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    gradient: 'from-yellow-500/20 to-orange-500/20',
    glow: 'shadow-yellow-500/20',
    desc: 'Catch range breakouts on high momentum',
    style: 'Breakout',
    holdTime: 'Hours-Days'
  },
  { 
    id: 'scalp_sniper', 
    name: 'Scalp Sniper', 
    icon: Crosshair, 
    color: 'text-red-400', 
    bg: 'bg-red-500/10 border-red-500/30',
    gradient: 'from-red-500/20 to-pink-500/20',
    glow: 'shadow-red-500/20',
    desc: 'Quick trades on micro pullbacks, tight SL/TP',
    style: 'Scalping',
    holdTime: 'Minutes-Hours'
  },
  { 
    id: 'swing_king', 
    name: 'Swing King', 
    icon: Crown, 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/10 border-amber-500/30',
    gradient: 'from-amber-500/20 to-yellow-500/20',
    glow: 'shadow-amber-500/20',
    desc: 'Larger moves, wider stops, patient entries',
    style: 'Swing',
    holdTime: 'Days-Weeks'
  },
]

const RISK_LEVELS = [
  { id: 'low', name: 'Low', pct: '2%' },
  { id: 'medium', name: 'Medium', pct: '4%' },
  { id: 'high', name: 'High', pct: '6%' },
]
// Map bot strategy names to our strategy IDs
function normalizeStrategyId(strategy: string | undefined): string {
  if (!strategy) return 'unknown'
  const s = strategy.toLowerCase()
  if (s.includes('momentum')) return 'momentum_rider'
  if (s.includes('dip') || s.includes('mean')) return 'dip_hunter'
  if (s.includes('breakout')) return 'breakout_blitz'
  if (s.includes('scalp')) return 'scalp_sniper'
  if (s.includes('swing')) return 'swing_king'
  if (s.includes('apex') || s.includes('adaptive')) return 'apex_adaptive'
  return s.replace(/_/g, ' ')
}

function getStrategyDisplay(strategy: string | undefined): { name: string; color: string; bg: string } {
  const id = normalizeStrategyId(strategy)
  const strat = STRATEGIES.find(s => s.id === id)
  if (strat) {
    return { name: strat.name, color: strat.color, bg: strat.bg }
  }
  return { name: strategy || 'Unknown', color: 'text-white/60', bg: 'bg-white/10 border-white/20' }
}

function fmt(n: number | null | undefined) {
  if (n == null) return '—'
  const abs = Math.abs(n)
  return abs >= 1000 ? `$${(abs / 1000).toFixed(1)}k` : `$${abs.toFixed(2)}`
}

function fmtSigned(n: number | null | undefined) {
  if (n == null) return '—'
  const abs = Math.abs(n)
  const s = abs >= 1000 ? `${(abs / 1000).toFixed(1)}k` : abs.toFixed(2)
  return n >= 0 ? `+$${s}` : `-$${s}`
}

function timeSince(date: string | Date) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

function getSignalColor(strength: number): string {
  if (strength >= 70) return 'bg-green'
  if (strength >= 30) return 'bg-yellow-500'
  return 'bg-red'
}

function getSignalBgColor(strength: number): string {
  if (strength >= 70) return 'bg-green/10 border-green/30'
  if (strength >= 30) return 'bg-yellow-500/10 border-yellow-500/30'
  return 'bg-white/5 border-white/10'
}

export default function DashboardClient({ 
  profile, config, trades, heartbeat, equityHistory, stats, 
  botEnabled = true, currentStrategy = 'apex_adaptive', strategyStats = {} 
}: Props) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showStrategyPicker, setShowStrategyPicker] = useState(false)
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null)
  
  const [strategy, setStrategy] = useState(currentStrategy)
  const [risk, setRisk] = useState((config as any)?.risk_level || 'medium')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [autoTrading, setAutoTrading] = useState(botEnabled)
  const [togglingAutoTrading, setTogglingAutoTrading] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsRefreshing(true)
      router.refresh()
      setTimeout(() => setIsRefreshing(false), 500)
    }, 30000)
    return () => clearInterval(interval)
  }, [router])

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const handleToggleAutoTrading = async () => {
    setTogglingAutoTrading(true)
    try {
      const newState = !autoTrading
      const res = await fetch('/api/bot/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'a040d19d-f40e-44f7-9b90-dead9d9bcfeb',
          enabled: newState,
        }),
      })
      if (res.ok) {
        setAutoTrading(newState)
      }
    } finally {
      setTogglingAutoTrading(false)
    }
  }

  const handleSelectStrategy = async (stratId: string) => {
    setSaving(true)
    try {
      const res = await fetch('/api/bot/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'a040d19d-f40e-44f7-9b90-dead9d9bcfeb',
          strategy: stratId,
        }),
      })
      if (res.ok) {
        setStrategy(stratId)
        setSaved(true)
        setTimeout(() => {
          setSaved(false)
          setShowStrategyPicker(false)
          router.refresh()
        }, 1000)
      }
    } finally {
      setSaving(false)
    }
  }

  const botOnline = heartbeat
    ? (Date.now() - new Date(heartbeat.created_at).getTime()) < 2 * 3600 * 1000
    : false

  const chartData = equityHistory.map(e => ({
    time: new Date(e.snapshot_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
    equity: e.equity,
  }))

  const todayPnl = heartbeat?.pnl_today ?? 0
  const totalPnl = stats?.total_pnl ?? 0
  const winRate = stats?.win_rate_pct ?? 0
  const totalTrades = stats?.total_trades ?? 0

  const livePositions: any[] = (heartbeat as any)?.positions ?? []
  const openTrades = livePositions.map(p => ({
    id: p.id,
    symbol: p.symbol,
    side: p.side,
    entry_price: p.entry_price,
    current_price: p.current_price,
    stop_loss: p.stop_loss,
    take_profit: p.take_profit,
    leverage: p.leverage,
    size: p.size,
    unrealized_pnl: p.unrealized_pnl,
    pnl_pct: p.pnl_pct,
    strategy: p.strategy,
    explanation: p.explanation,
    regime: p.regime,
    created_at: p.opened_at || new Date().toISOString(),
  }))
  
  const closedTrades = trades.filter(t => t.closed_at)
  const unrealizedPnl = livePositions.reduce((sum, p) => sum + (p.unrealized_pnl ?? 0), 0)
  const signalRadar: SignalScan[] = (heartbeat as any)?.signal_radar ?? []
  
  const currentStrat = STRATEGIES.find(s => s.id === strategy) || STRATEGIES[0]
  const currentRisk = RISK_LEVELS.find(r => r.id === risk) || RISK_LEVELS[1]
  const currentStratStats = strategyStats[strategy] || strategyStats[strategy?.toUpperCase()] || { trades: 0, wins: 0, losses: 0, pnl: 0 }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">APEX</h1>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium
            ${botOnline ? 'bg-green/10 text-green' : 'bg-white/10 text-muted'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${botOnline ? 'bg-green animate-pulse' : 'bg-subtle'}`} />
            {botOnline ? 'Live' : 'Offline'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleAutoTrading}
            disabled={togglingAutoTrading}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              autoTrading
                ? 'bg-green/10 text-green border border-green/30 hover:bg-green/20'
                : 'bg-red/10 text-red border border-red/30 hover:bg-red/20'
            } ${togglingAutoTrading ? 'opacity-50' : ''}`}
          >
            <Power className={`w-3 h-3 ${togglingAutoTrading ? 'animate-pulse' : ''}`} />
            {autoTrading ? 'Auto: ON' : 'Auto: OFF'}
          </button>
          <button onClick={handleManualRefresh} className="p-1.5 text-muted hover:text-white">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Auto-Trading Paused Warning */}
      {!autoTrading && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-red/10 border border-red/20 mb-4">
          <AlertTriangle className="w-4 h-4 text-red flex-shrink-0" />
          <p className="text-xs text-red">Auto-trading is paused. The bot will not open new positions.</p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          STRATEGY HERO CARD
      ═══════════════════════════════════════════════════════════════════════ */}
      <div 
        className={`relative overflow-hidden rounded-xl border mb-4 bg-gradient-to-br ${currentStrat.gradient} ${currentStrat.bg} shadow-lg ${currentStrat.glow}`}
      >
        {/* Animated glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
        
        <div className="relative p-4">
          {/* Top row: Icon, Name, Change button */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${currentStrat.bg} border`}>
                <currentStrat.icon className={`w-6 h-6 ${currentStrat.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className={`text-lg font-bold ${currentStrat.color}`}>{currentStrat.name}</h2>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-medium text-white/70">ACTIVE</span>
                </div>
                <p className="text-xs text-white/60 mt-0.5">{currentStrat.desc}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowStrategyPicker(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-medium transition-all"
            >
              Change
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Style badges */}
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-1 rounded-lg bg-white/10 text-[11px] font-medium">{currentStrat.style}</span>
            <span className="px-2 py-1 rounded-lg bg-white/10 text-[11px] font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {currentStrat.holdTime}
            </span>
            <span className="px-2 py-1 rounded-lg bg-white/10 text-[11px] font-medium">{currentRisk.pct} Risk</span>
          </div>

          {/* Performance stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-black/20 rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-white/50 uppercase mb-1">Trades</p>
              <p className="text-lg font-bold">{currentStratStats.trades}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-white/50 uppercase mb-1">Wins</p>
              <p className="text-lg font-bold text-green">{currentStratStats.wins}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-white/50 uppercase mb-1">Losses</p>
              <p className="text-lg font-bold text-red">{currentStratStats.losses}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-white/50 uppercase mb-1">P&L</p>
              <p className={`text-lg font-bold ${currentStratStats.pnl >= 0 ? 'text-green' : 'text-red'}`}>
                {fmtSigned(currentStratStats.pnl)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Picker Modal */}
      {showStrategyPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowStrategyPicker(false)} />
          <div className="relative bg-surface border border-white/10 rounded-2xl p-5 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold">Choose Strategy</h2>
                <p className="text-sm text-muted mt-1">Select a trading strategy for the bot</p>
              </div>
              <button onClick={() => setShowStrategyPicker(false)} className="p-2 text-muted hover:text-white rounded-lg hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STRATEGIES.map((s) => {
                const Icon = s.icon
                const isActive = strategy === s.id
                const sStats = strategyStats[s.id] || strategyStats[s.id?.toUpperCase()] || { trades: 0, wins: 0, losses: 0, pnl: 0 }
                const winRate = sStats.trades > 0 ? ((sStats.wins / sStats.trades) * 100).toFixed(0) : '—'
                
                return (
                  <button 
                    key={s.id} 
                    onClick={() => handleSelectStrategy(s.id)}
                    disabled={saving}
                    className={`relative p-4 rounded-xl border text-left transition-all ${
                      isActive 
                        ? `${s.bg} ring-2 ring-offset-2 ring-offset-black ${s.color.replace('text-', 'ring-')}`
                        : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                    } ${saving ? 'opacity-50' : ''}`}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-bold uppercase">Current</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${isActive ? s.bg : 'bg-white/10'}`}>
                        <Icon className={`w-5 h-5 ${isActive ? s.color : 'text-muted'}`} />
                      </div>
                      <div>
                        <h3 className={`font-bold ${isActive ? s.color : ''}`}>{s.name}</h3>
                        <p className="text-[11px] text-muted">{s.desc}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded bg-white/10 text-[10px]">{s.style}</span>
                      <span className="text-[10px] text-muted">{s.holdTime}</span>
                    </div>
                    
                    {/* Strategy stats */}
                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10">
                      <div className="text-center">
                        <p className="text-[9px] text-muted">Trades</p>
                        <p className="text-sm font-bold">{sStats.trades}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-muted">Win%</p>
                        <p className="text-sm font-bold">{winRate}{winRate !== '—' && '%'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-muted">W/L</p>
                        <p className="text-sm font-bold">
                          <span className="text-green">{sStats.wins}</span>
                          <span className="text-muted">/</span>
                          <span className="text-red">{sStats.losses}</span>
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-muted">P&L</p>
                        <p className={`text-sm font-bold ${sStats.pnl >= 0 ? 'text-green' : 'text-red'}`}>
                          {sStats.pnl !== 0 ? fmtSigned(sStats.pnl) : '—'}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {saved && (
              <div className="mt-4 p-3 rounded-lg bg-green/10 border border-green/30 text-center">
                <p className="text-green font-medium">✓ Strategy updated!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-surface rounded-lg p-2 text-center">
          <p className="text-[10px] text-muted uppercase">Equity</p>
          <p className="text-sm font-bold">{fmt(heartbeat?.equity)}</p>
        </div>
        <div className="bg-surface rounded-lg p-2 text-center">
          <p className="text-[10px] text-muted uppercase">Today</p>
          <p className={`text-sm font-bold ${todayPnl >= 0 ? 'text-green' : 'text-red'}`}>{fmtSigned(todayPnl)}</p>
        </div>
        <div className="bg-surface rounded-lg p-2 text-center">
          <p className="text-[10px] text-muted uppercase">Total</p>
          <p className={`text-sm font-bold ${totalPnl >= 0 ? 'text-green' : 'text-red'}`}>{fmtSigned(totalPnl)}</p>
        </div>
        <div className="bg-surface rounded-lg p-2 text-center">
          <p className="text-[10px] text-muted uppercase">Win%</p>
          <p className="text-sm font-bold">{totalTrades > 0 ? `${winRate.toFixed(0)}%` : '—'}</p>
        </div>
      </div>

      {/* Signal Radar */}
      <div className="bg-surface rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-muted uppercase font-medium">Signal Radar</p>
          <div className="flex items-center gap-2 text-[9px] text-muted">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red" />Cold</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" />Warm</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green" />Hot</span>
          </div>
        </div>
        
        {signalRadar.length > 0 ? (
          <div className="grid grid-cols-5 gap-2">
            {signalRadar.map((scan) => (
              <div key={scan.symbol} className={`rounded-lg border p-2 text-center transition-all ${getSignalBgColor(scan.strength)}`}>
                <p className="text-xs font-bold mb-1">{scan.symbol}</p>
                <div className="flex justify-center mb-1">
                  <div className={`w-3 h-3 rounded-full ${getSignalColor(scan.strength)} ${scan.strength >= 70 ? 'animate-pulse' : ''}`} />
                </div>
                <p className={`text-sm font-bold ${scan.strength >= 70 ? 'text-green' : scan.strength >= 30 ? 'text-yellow-500' : 'text-muted'}`}>
                  {scan.strength}%
                </p>
                <div className="flex justify-center mt-1">
                  {scan.direction === 'LONG' ? <TrendingUp className="w-3 h-3 text-green" /> : 
                   scan.direction === 'SHORT' ? <TrendingDown className="w-3 h-3 text-red" /> : 
                   <Minus className="w-3 h-3 text-muted" />}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-muted">Signal data appears when bot runs</div>
        )}
      </div>
{/* TradingView Charts */}
<div className="mb-4">
  <div className="flex items-center justify-between mb-2">
    <p className="text-[10px] text-muted uppercase font-medium">Live Charts</p>
  </div>
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
    {['BTC', 'ETH', 'SOL', 'ARB', 'DOGE'].map((symbol) => (
      <div key={symbol} className="bg-surface rounded-lg overflow-hidden">
        <div className="px-2 py-1.5 border-b border-white/10">
          <p className="text-[10px] text-muted uppercase font-medium">{symbol}</p>
        </div>
        <iframe
          src={`https://s.tradingview.com/widgetembed/?symbol=BINANCE:${symbol}USDT&interval=60&theme=dark&style=1&hide_top_toolbar=1&hide_legend=1&save_image=0&hide_volume=1&withdateranges=0`}
          width="100%"
          height="150"
          frameBorder="0"
        />
      </div>
    ))}
  </div>
</div>

{/* Active Positions */}
      {/* Active Positions */}
      <div className={`rounded-lg border mb-4 ${openTrades.length > 0 ? 'border-green/30 bg-green/[0.02]' : 'border-white/10 bg-surface'}`}>
        <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {openTrades.length > 0 && <span className="w-2 h-2 rounded-full bg-green animate-pulse" />}
            <span className="text-xs font-medium">{openTrades.length > 0 ? `${openTrades.length} Open` : 'No Positions'}</span>
          </div>
          {openTrades.length > 0 && (
            <span className={`text-xs font-bold ${unrealizedPnl >= 0 ? 'text-green' : 'text-red'}`}>{fmtSigned(unrealizedPnl)}</span>
          )}
        </div>

        {openTrades.length > 0 ? (
          <div className="divide-y divide-white/5">
            {openTrades.map(t => {
              const pnl = (t as any).unrealized_pnl ?? 0
              const current = (t as any).current_price
              const isProfit = pnl >= 0
              const explanation = (t as any).explanation
              const isExpanded = expandedTrade === t.id
              
              const entry = t.entry_price || 0
              const sl = t.stop_loss || 0
              const tp = t.take_profit || 0
              const slDist = Math.abs(entry - sl)
              const tpDist = Math.abs(tp - entry)
              
              let progress = 50
              let slPct = 0
              let tpPct = 0
              
              if (current && (slDist + tpDist) > 0) {
                if (t.side === 'LONG') {
                  const moved = current - entry
                  if (moved >= 0) {
                    tpPct = Math.min(100, (moved / tpDist) * 100)
                    progress = 50 + (tpPct / 2)
                  } else {
                    slPct = Math.min(100, (Math.abs(moved) / slDist) * 100)
                    progress = 50 - (slPct / 2)
                  }
                } else {
                  const moved = entry - current
                  if (moved >= 0) {
                    tpPct = Math.min(100, (moved / tpDist) * 100)
                    progress = 50 + (tpPct / 2)
                  } else {
                    slPct = Math.min(100, (Math.abs(moved) / slDist) * 100)
                    progress = 50 - (slPct / 2)
                  }
                }
              }

              return (
                <div key={t.id} className="px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.side === 'LONG' ? 'bg-green/20 text-green' : 'bg-red/20 text-red'}`}>{t.side}</span>
                      <span className="text-sm font-medium">{t.symbol}</span>
                      <span className="text-[10px] text-muted">{t.leverage}x</span>
                      {/* Strategy badge */}
{t.strategy && (() => {
  const stratDisplay = getStrategyDisplay(t.strategy)
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${stratDisplay.bg} ${stratDisplay.color}`}>
      {stratDisplay.name}
    </span>
  )
})()}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[10px] text-muted">
                        <Clock className="w-3 h-3" />
                        {timeSince(t.created_at)}
                      </div>
                      <button 
                        onClick={() => setExpandedTrade(isExpanded ? null : t.id)}
                        className="p-1 text-muted hover:text-white rounded"
                      >
                        <Info className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-muted">
                      ${t.entry_price?.toLocaleString()} → {current ? <span className={isProfit ? 'text-green' : 'text-red'}>${current.toLocaleString()}</span> : '—'}
                    </div>
                    <div className={`text-sm font-bold ${isProfit ? 'text-green' : 'text-red'}`}>{fmtSigned(pnl)}</div>
                  </div>

                  <div className="mb-2">
                    <div className="flex items-center justify-between text-[9px] text-muted mb-1">
                      <span className="text-red">SL ${sl.toLocaleString()}</span>
                      <span className={slPct > 0 ? 'text-red' : tpPct > 0 ? 'text-green' : 'text-muted'}>
                        {slPct > 0 ? `${slPct.toFixed(0)}% to SL` : tpPct > 0 ? `${tpPct.toFixed(0)}% to TP` : 'At entry'}
                      </span>
                      <span className="text-green">TP ${tp.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30 z-10" />
                      <div 
                        className={`absolute top-0 bottom-0 transition-all duration-300 ${progress >= 50 ? 'bg-green' : 'bg-red'}`}
                        style={{
                          left: progress >= 50 ? '50%' : `${progress}%`,
                          width: progress >= 50 ? `${progress - 50}%` : `${50 - progress}%`,
                        }}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 p-2 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-start gap-2 mb-3">
                        <Info className="w-3 h-3 text-blue mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-muted leading-relaxed">
                          {explanation || `Opened ${t.side} ${t.symbol} using ${(t as any).strategy || 'UNKNOWN'} strategy.`}
                        </div>
                      </div>
                      
                      <button
                        onClick={async () => {
                          if (confirm(`Close ${t.symbol} position now?`)) {
                            await fetch('/api/bot/close', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ trade_id: t.id, symbol: t.symbol }),
                            })
                            router.refresh()
                          }
                        }}
                        className="w-full py-1.5 rounded bg-red/20 border border-red/30 text-red text-xs font-medium hover:bg-red/30 transition-all"
                      >
                        Close Position Now
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="px-3 py-4 text-center">
            <Zap className="w-5 h-5 text-muted mx-auto mb-1" />
            <p className="text-xs text-muted">Scanning for opportunities</p>
          </div>
        )}
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="bg-surface rounded-lg p-3 mb-4">
          <p className="text-[10px] text-muted uppercase mb-2">Portfolio</p>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d084" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#00d084" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="equity" stroke="#00d084" strokeWidth={1.5} fill="url(#eq)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Closed Trades */}
      {closedTrades.length > 0 && (
        <div className="bg-surface rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-muted uppercase">Recent Closed</p>
            <a href="/dashboard/trades" className="text-[10px] text-green">View all</a>
          </div>
          <div className="space-y-1">
            {closedTrades.slice(0, 5).map(t => {
              const isExpanded = expandedTrade === t.id
              
              return (
                <div key={t.id} className="py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${t.side === 'LONG' ? 'text-green' : 'text-red'}`}>{t.side}</span>
                      <span className="text-xs">{t.symbol}</span>
                      {(t as any).strategy && (() => {
  const stratDisplay = getStrategyDisplay((t as any).strategy)
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${stratDisplay.bg} ${stratDisplay.color}`}>
      {stratDisplay.name}
    </span>
  )
})()}
                      {(t as any).strategy && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-muted">{(t as any).strategy}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${(t.pnl ?? 0) >= 0 ? 'text-green' : 'text-red'}`}>{fmtSigned(t.pnl)}</span>
                      <span className={`text-[10px] px-1 rounded ${(t.pnl ?? 0) >= 0 ? 'bg-green/10 text-green' : 'bg-red/10 text-red'}`}>{t.close_reason}</span>
                      <button 
                        onClick={() => setExpandedTrade(isExpanded ? null : t.id)}
                        className="p-1 text-muted hover:text-white rounded"
                      >
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-2 p-2 rounded-lg bg-white/5 border border-white/10 text-xs text-muted space-y-1">
                      <div className="flex justify-between"><span>Entry:</span><span className="text-white">${t.entry_price?.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Exit:</span><span className="text-white">${t.exit_price?.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Strategy:</span><span className="text-blue">{(t as any).strategy || '—'}</span></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Market + Stats */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-surface rounded-lg p-3">
          <p className="text-[10px] text-muted uppercase mb-2">Market</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Regime</span>
              <span className={
                heartbeat?.regime === 'TRENDING_UP' ? 'text-green' :
                heartbeat?.regime === 'TRENDING_DOWN' ? 'text-red' :
                heartbeat?.regime === 'VOLATILE' ? 'text-amber-400' : 'text-blue'
              }>{heartbeat?.regime?.replace('_', ' ') ?? '—'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Macro</span>
              <span>{heartbeat?.macro_context ?? 'NONE'}</span>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-lg p-3">
          <p className="text-[10px] text-muted uppercase mb-2">Stats</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Trades</span>
              <span>{totalTrades}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">W/L</span>
              <span><span className="text-green">{stats?.wins ?? 0}</span> / <span className="text-red">{stats?.losses ?? 0}</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}