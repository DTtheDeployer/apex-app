'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Activity, Shield, AlertTriangle, RefreshCw, Zap, Target, Clock } from 'lucide-react'
import type { Profile, BotConfig, Trade, BotHeartbeat, EquitySnapshot, UserStats } from '@/types'

interface Props {
  profile: Profile | null
  config: BotConfig | null
  trades: Trade[]
  heartbeat: BotHeartbeat | null
  equityHistory: EquitySnapshot[]
  stats: UserStats | null
}

const REGIME_COLOUR: Record<string, string> = {
  TRENDING_UP:   'text-green',
  TRENDING_DOWN: 'text-red',
  RANGING:       'text-blue',
  VOLATILE:      'text-gold',
}

const MACRO_COLOUR: Record<string, string> = {
  NONE:     'badge-subtle',
  CAUTION:  'badge-gold',
  FREEZE:   'badge-red',
  REACTIVE: 'badge-green',
}

function fmt(n: number | null | undefined, prefix = '$') {
  if (n == null) return '—'
  const abs = Math.abs(n)
  const s = abs >= 1000 ? `${prefix}${(abs / 1000).toFixed(1)}k` : `${prefix}${abs.toFixed(2)}`
  return n < 0 ? `−${s.replace(prefix, '')}` : s
}

function fmtSigned(n: number | null | undefined, prefix = '$') {
  if (n == null) return '—'
  const abs = Math.abs(n)
  const s = abs >= 1000 ? `${(abs / 1000).toFixed(1)}k` : abs.toFixed(2)
  return n >= 0 ? `+${prefix}${s}` : `-${prefix}${s}`
}

function fmtPct(n: number | null | undefined) {
  if (n == null) return ''
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
}

function timeSince(date: string | Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${minutes % 60}m`
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h`
}

export default function DashboardClient({ profile, config, trades, heartbeat, equityHistory, stats }: Props) {
  const router = useRouter()
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [now, setNow] = useState(Date.now())

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRefreshing(true)
      router.refresh()
      setLastRefresh(new Date())
      setTimeout(() => setIsRefreshing(false), 500)
    }, 30000)

    return () => clearInterval(interval)
  }, [router])

  // Update "time in trade" every second
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setLastRefresh(new Date())
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const botOnline = heartbeat
    ? (Date.now() - new Date(heartbeat.created_at).getTime()) < 2 * 3600 * 1000
    : false

  const chartData = equityHistory.map(e => ({
    time: new Date(e.snapshot_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
    equity: e.equity,
  }))

  const todayPnl = heartbeat?.pnl_today ?? stats?.pnl_today ?? 0
  const unrealizedPnl = (heartbeat as any)?.unrealized_pnl ?? 0
  const totalPnl = stats?.total_pnl ?? 0
  const winRate = stats?.win_rate_pct ?? 0
  const totalTrades = stats?.total_trades ?? 0

  // Get open positions
  const openTrades = trades.filter(t => !t.closed_at)
  const closedTrades = trades.filter(t => t.closed_at)
  const tradesUnrealizedPnl = openTrades.reduce((sum, t) => sum + ((t as any).unrealized_pnl ?? 0), 0)
  const displayUnrealizedPnl = unrealizedPnl || tradesUnrealizedPnl

  const hasOpenPositions = openTrades.length > 0

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
          <p className="text-muted text-xs sm:text-sm mt-0.5">
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={handleManualRefresh}
            className="flex items-center gap-1 px-2 py-1 text-xs text-muted hover:text-white transition-colors"
            title={`Last updated: ${lastRefresh.toLocaleTimeString()}`}
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </button>
          <div className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border text-xs sm:text-sm font-medium
            ${botOnline
              ? 'bg-green/5 border-green/20 text-green'
              : 'bg-white/5 border-white/10 text-muted'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${botOnline ? 'bg-green animate-pulse' : 'bg-subtle'}`} />
            {botOnline ? 'Live' : 'Offline'}
          </div>
          {config?.testnet && (
            <span className="badge-gold text-xs">Test</span>
          )}
        </div>
      </div>

      {/* Setup prompt */}
      {!config?.hl_wallet_address && (
        <div className="card border-gold/20 bg-gold/5 mb-4 flex items-center gap-3 p-3 sm:p-4">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-gold flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gold">Complete setup</p>
            <p className="text-xs text-muted mt-0.5 truncate">Add your Hyperliquid API wallet</p>
          </div>
          <a href="/settings" className="btn-secondary text-xs whitespace-nowrap">Setup →</a>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* LIVE POSITIONS - Most prominent section */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className={`mb-4 sm:mb-6 rounded-xl border-2 ${hasOpenPositions ? 'border-green/30 bg-green/[0.03]' : 'border-white/10 bg-white/[0.02]'}`}>
        <div className="p-3 sm:p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasOpenPositions ? (
                <div className="w-2 h-2 rounded-full bg-green animate-pulse" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-subtle" />
              )}
              <span className="text-sm font-semibold">
                {hasOpenPositions ? `${openTrades.length} Active Position${openTrades.length > 1 ? 's' : ''}` : 'No Active Positions'}
              </span>
            </div>
            {hasOpenPositions && (
              <div className={`text-sm font-bold ${displayUnrealizedPnl >= 0 ? 'text-green' : 'text-red'}`}>
                {fmtSigned(displayUnrealizedPnl)}
              </div>
            )}
          </div>
        </div>

        {hasOpenPositions ? (
          <div className="divide-y divide-white/10">
            {openTrades.map(t => {
              const unrealized = (t as any).unrealized_pnl ?? 0
              const unrealizedPct = (t as any).unrealized_pnl_pct ?? 0
              const currentPrice = (t as any).current_price
              const isLong = t.side === 'LONG'
              const isProfit = unrealized >= 0
              
              // Calculate distance to SL/TP as percentage
              const slDistance = t.stop_loss ? ((t.entry_price - t.stop_loss) / t.entry_price * 100) : null
              const tpDistance = t.take_profit ? ((t.take_profit - t.entry_price) / t.entry_price * 100) : null
              
              return (
                <div key={t.id} className="p-3 sm:p-4">
                  {/* Position header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`px-2 py-1 rounded text-xs font-bold ${isLong ? 'bg-green/20 text-green' : 'bg-red/20 text-red'}`}>
                        {t.side}
                      </div>
                      <span className="font-bold text-sm sm:text-base">{t.symbol}</span>
                      <span className="text-xs text-muted">{t.leverage}x</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted">
                      <Clock className="w-3 h-3" />
                      {timeSince(t.created_at)}
                    </div>
                  </div>

                  {/* P&L display - big and prominent */}
                  <div className={`text-center py-3 sm:py-4 rounded-lg mb-3 ${isProfit ? 'bg-green/10' : 'bg-red/10'}`}>
                    <div className={`text-2xl sm:text-3xl font-bold ${isProfit ? 'text-green' : 'text-red'}`}>
                      {fmtSigned(unrealized)}
                    </div>
                    <div className={`text-sm ${isProfit ? 'text-green/70' : 'text-red/70'}`}>
                      {fmtPct(unrealizedPct)}
                    </div>
                  </div>

                  {/* Price info */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-muted text-xs mb-1">Entry</div>
                      <div className="font-mono font-medium">${t.entry_price?.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-muted text-xs mb-1">Current</div>
                      <div className={`font-mono font-medium ${isProfit ? 'text-green' : 'text-red'}`}>
                        ${currentPrice?.toLocaleString() ?? '—'}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-muted text-xs mb-1">Size</div>
                      <div className="font-mono font-medium">${t.size?.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* SL/TP bar */}
                  {(t.stop_loss || t.take_profit) && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <div className="flex items-center gap-1 text-red">
                          <Target className="w-3 h-3" />
                          SL: ${t.stop_loss?.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1 text-green">
                          TP: ${t.take_profit?.toLocaleString()}
                          <Target className="w-3 h-3" />
                        </div>
                      </div>
                      {/* Visual progress bar showing position between SL and TP */}
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-red/30" />
                        <div className="absolute right-0 top-0 bottom-0 w-1/4 bg-green/30" />
                        {currentPrice && t.stop_loss && t.take_profit && (
                          <div 
                            className={`absolute top-0 bottom-0 w-2 rounded-full ${isProfit ? 'bg-green' : 'bg-red'}`}
                            style={{
                              left: `${Math.min(100, Math.max(0, ((currentPrice - t.stop_loss) / (t.take_profit - t.stop_loss)) * 100))}%`,
                              transform: 'translateX(-50%)'
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-6 sm:p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-muted" />
            </div>
            <p className="text-sm text-muted">Bot is scanning for opportunities</p>
            <p className="text-xs text-subtle mt-1">Regime: {heartbeat?.regime?.replace('_', ' ') ?? 'Unknown'}</p>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* STATS ROW */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <MiniStat label="Today" value={fmtSigned(todayPnl)} positive={todayPnl >= 0} />
        <MiniStat label="Total" value={fmtSigned(totalPnl)} positive={totalPnl >= 0} />
        <MiniStat label="Win %" value={totalTrades > 0 ? `${winRate.toFixed(0)}%` : '—'} />
        <MiniStat label="Trades" value={String(totalTrades)} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* PORTFOLIO CHART + MARKET INTELLIGENCE */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {/* Equity chart */}
        <div className="card p-3 sm:p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-muted uppercase tracking-wider font-medium">Portfolio</p>
              <p className="text-lg sm:text-2xl font-bold mt-0.5">
                {heartbeat ? fmt(heartbeat.equity) : '—'}
              </p>
            </div>
          </div>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d084" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#00d084" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fill: '#6b7a99', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7a99', fontSize: 9 }} axisLine={false} tickLine={false} width={50}
                  tickFormatter={v => `$${(v/1000).toFixed(1)}k`} />
                <Area type="monotone" dataKey="equity" stroke="#00d084" strokeWidth={2}
                  fill="url(#equityGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-20 flex items-center justify-center text-subtle text-xs">
              Chart appears once bot starts
            </div>
          )}
        </div>

        {/* Market intelligence */}
        <div className="card p-3 sm:p-4">
          <p className="text-xs text-muted uppercase tracking-wider font-medium mb-3">Market</p>
          {heartbeat ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-subtle">Regime</span>
                <span className={`text-xs font-semibold ${REGIME_COLOUR[heartbeat.regime] ?? 'text-muted'}`}>
                  {heartbeat.regime?.replace('_', ' ') ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-subtle">Macro</span>
                <span className={`text-xs ${MACRO_COLOUR[heartbeat.macro_context] ?? 'badge-subtle'}`}>
                  {heartbeat.macro_context ?? 'NONE'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-subtle">Cycles</span>
                <span className="text-xs font-medium">{heartbeat.cycles_today}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-subtle">Trades today</span>
                <span className="text-xs font-medium">{heartbeat.trades_today}</span>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-subtle text-xs py-4">
              Waiting for bot…
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* RECENT CLOSED TRADES */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="card p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs sm:text-sm font-semibold">Recent Closed</p>
          <a href="/dashboard/trades" className="text-xs text-green hover:underline">View all</a>
        </div>
        {closedTrades.length === 0 ? (
          <div className="py-6 text-center text-subtle text-xs">
            No closed trades yet
          </div>
        ) : (
          <div className="space-y-2">
            {closedTrades.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${t.side === 'LONG' ? 'text-green' : 'text-red'}`}>
                    {t.side}
                  </span>
                  <span className="text-sm font-medium">{t.symbol}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${(t.pnl ?? 0) >= 0 ? 'text-green' : 'text-red'}`}>
                    {fmtSigned(t.pnl)}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${(t.pnl ?? 0) >= 0 ? 'bg-green/10 text-green' : 'bg-red/10 text-red'}`}>
                    {t.close_reason}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MiniStat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="bg-white/5 rounded-lg p-2 sm:p-3 text-center">
      <p className="text-xs text-muted mb-0.5">{label}</p>
      <p className={`text-sm sm:text-base font-bold ${positive === true ? 'text-green' : positive === false ? 'text-red' : ''}`}>
        {value}
      </p>
    </div>
  )
}
