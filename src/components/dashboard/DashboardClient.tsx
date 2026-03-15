'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, RefreshCw, Zap, Clock } from 'lucide-react'
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
  TRENDING_UP: 'text-green',
  TRENDING_DOWN: 'text-red',
  RANGING: 'text-blue',
  VOLATILE: 'text-gold',
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

export default function DashboardClient({ profile, config, trades, heartbeat, equityHistory, stats }: Props) {
  const router = useRouter()
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsRefreshing(true)
      router.refresh()
      setLastRefresh(new Date())
      setTimeout(() => setIsRefreshing(false), 500)
    }, 30000)
    return () => clearInterval(interval)
  }, [router])

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

  const todayPnl = heartbeat?.pnl_today ?? 0
  const totalPnl = stats?.total_pnl ?? 0
  const winRate = stats?.win_rate_pct ?? 0
  const totalTrades = stats?.total_trades ?? 0

  const openTrades = trades.filter(t => !t.closed_at)
  const closedTrades = trades.filter(t => t.closed_at)
  const unrealizedPnl = openTrades.reduce((sum, t) => sum + ((t as any).unrealized_pnl ?? 0), 0)

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
        <button onClick={handleManualRefresh} className="p-1.5 text-muted hover:text-white">
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Quick Stats Row */}
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

      {/* Active Positions */}
      <div className={`rounded-lg border mb-4 ${openTrades.length > 0 ? 'border-green/30 bg-green/[0.02]' : 'border-white/10 bg-surface'}`}>
        <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {openTrades.length > 0 && <span className="w-2 h-2 rounded-full bg-green animate-pulse" />}
            <span className="text-xs font-medium">
              {openTrades.length > 0 ? `${openTrades.length} Open` : 'No Positions'}
            </span>
          </div>
          {openTrades.length > 0 && (
            <span className={`text-xs font-bold ${unrealizedPnl >= 0 ? 'text-green' : 'text-red'}`}>
              {fmtSigned(unrealizedPnl)}
            </span>
          )}
        </div>

        {openTrades.length > 0 ? (
          <div className="divide-y divide-white/5">
            {openTrades.map(t => {
              const pnl = (t as any).unrealized_pnl ?? 0
              const pnlPct = (t as any).unrealized_pnl_pct ?? 0
              const current = (t as any).current_price
              const isProfit = pnl >= 0

              return (
                <div key={t.id} className="px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.side === 'LONG' ? 'bg-green/20 text-green' : 'bg-red/20 text-red'}`}>
                        {t.side}
                      </span>
                      <span className="text-sm font-medium">{t.symbol}</span>
                      <span className="text-[10px] text-muted">{t.leverage}x</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted">
                      <Clock className="w-3 h-3" />
                      {timeSince(t.created_at)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted">
                      <span>${t.entry_price?.toLocaleString()}</span>
                      <span className="mx-1">→</span>
                      <span className={current ? (isProfit ? 'text-green' : 'text-red') : ''}>
                        {current ? `$${current.toLocaleString()}` : '—'}
                      </span>
                    </div>
                    <div className={`text-sm font-bold ${isProfit ? 'text-green' : 'text-red'}`}>
                      {fmtSigned(pnl)}
                      <span className="text-[10px] ml-1 opacity-70">{pnlPct ? `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%` : ''}</span>
                    </div>
                  </div>
                  {/* Compact SL/TP */}
                  {(t.stop_loss || t.take_profit) && (
                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      <span className="text-red">SL ${t.stop_loss?.toFixed(2)}</span>
                      <div className="flex-1 mx-2 h-1 bg-white/10 rounded-full relative">
                        {current && t.stop_loss && t.take_profit && (
                          <div
                            className={`absolute top-0 h-1 w-1 rounded-full ${isProfit ? 'bg-green' : 'bg-red'}`}
                            style={{ left: `${Math.min(100, Math.max(0, ((current - t.stop_loss) / (t.take_profit - t.stop_loss)) * 100))}%` }}
                          />
                        )}
                      </div>
                      <span className="text-green">TP ${t.take_profit?.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="px-3 py-6 text-center">
            <Zap className="w-5 h-5 text-muted mx-auto mb-1" />
            <p className="text-xs text-muted">Scanning for opportunities</p>
            <p className="text-[10px] text-subtle">{heartbeat?.regime?.replace('_', ' ') ?? '—'}</p>
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

      {/* Market + Recent */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-surface rounded-lg p-3">
          <p className="text-[10px] text-muted uppercase mb-2">Market</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Regime</span>
              <span className={REGIME_COLOUR[heartbeat?.regime ?? ''] ?? 'text-muted'}>{heartbeat?.regime?.replace('_', ' ') ?? '—'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Macro</span>
              <span>{heartbeat?.macro_context ?? 'NONE'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Cycles</span>
              <span>{heartbeat?.cycles_today ?? 0}</span>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-lg p-3">
          <p className="text-[10px] text-muted uppercase mb-2">Stats</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Total trades</span>
              <span>{totalTrades}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Wins</span>
              <span className="text-green">{stats?.wins ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Losses</span>
              <span className="text-red">{stats?.losses ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Closed Trades */}
      {closedTrades.length > 0 && (
        <div className="bg-surface rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-muted uppercase">Recent Closed</p>
            <a href="/dashboard/trades" className="text-[10px] text-green">View all</a>
          </div>
          <div className="space-y-1">
            {closedTrades.slice(0, 3).map(t => (
              <div key={t.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold ${t.side === 'LONG' ? 'text-green' : 'text-red'}`}>{t.side}</span>
                  <span className="text-xs">{t.symbol}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${(t.pnl ?? 0) >= 0 ? 'text-green' : 'text-red'}`}>{fmtSigned(t.pnl)}</span>
                  <span className={`text-[10px] px-1 rounded ${(t.pnl ?? 0) >= 0 ? 'bg-green/10 text-green' : 'bg-red/10 text-red'}`}>{t.close_reason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
