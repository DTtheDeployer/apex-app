'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Activity, Shield, AlertTriangle, RefreshCw } from 'lucide-react'
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

export default function DashboardClient({ profile, config, trades, heartbeat, equityHistory, stats }: Props) {
  const router = useRouter()
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

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

  const openTrades = trades.filter(t => !t.closed_at)
  const tradesUnrealizedPnl = openTrades.reduce((sum, t) => sum + ((t as any).unrealized_pnl ?? 0), 0)
  const displayUnrealizedPnl = unrealizedPnl || tradesUnrealizedPnl

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
          <p className="text-muted text-xs sm:text-sm mt-0.5">
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
        </div>

        {/* Bot status & refresh */}
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
        <div className="card border-gold/20 bg-gold/5 mb-4 sm:mb-6 flex items-center gap-3 p-3 sm:p-4">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-gold flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gold">Complete setup</p>
            <p className="text-xs text-muted mt-0.5 truncate">Add your Hyperliquid API wallet</p>
          </div>
          <a href="/settings" className="btn-secondary text-xs whitespace-nowrap">Setup →</a>
        </div>
      )}

      {/* Stat cards - 2x2 grid on mobile */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard
          label="Today"
          value={fmtSigned(todayPnl)}
          sub={displayUnrealizedPnl !== 0 ? `${fmtSigned(displayUnrealizedPnl)} unreal.` : undefined}
          positive={todayPnl >= 0}
          icon={todayPnl >= 0 ? TrendingUp : TrendingDown}
          iconColor={todayPnl >= 0 ? 'text-green' : 'text-red'}
        />
        <StatCard
          label="Total"
          value={fmtSigned(totalPnl)}
          positive={totalPnl >= 0}
          icon={TrendingUp}
          iconColor={totalPnl >= 0 ? 'text-green' : 'text-red'}
        />
        <StatCard
          label="Win Rate"
          value={totalTrades > 0 ? `${winRate.toFixed(0)}%` : '—'}
          sub={`${stats?.wins ?? 0}W / ${stats?.losses ?? 0}L`}
          icon={Shield}
          iconColor="text-blue"
        />
        <StatCard
          label="Trades"
          value={String(totalTrades)}
          sub={config?.testnet ? 'Testnet' : 'Live'}
          icon={Activity}
          iconColor="text-muted"
        />
      </div>

      {/* Portfolio + Market Intelligence - Stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {/* Equity chart */}
        <div className="card p-3 sm:p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <p className="text-xs text-muted uppercase tracking-wider font-medium">Portfolio</p>
              <p className="text-lg sm:text-2xl font-bold mt-0.5">
                {heartbeat ? fmt(heartbeat.equity) : '—'}
              </p>
            </div>
            {displayUnrealizedPnl !== 0 && (
              <div className={`text-xs sm:text-sm font-medium ${displayUnrealizedPnl >= 0 ? 'text-green' : 'text-red'}`}>
                {fmtSigned(displayUnrealizedPnl)}
              </div>
            )}
          </div>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={120}>
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
                <Tooltip
                  contentStyle={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: '#9ba3b8' }}
                  itemStyle={{ color: '#00d084' }}
                  formatter={(v: number) => [`$${v.toFixed(2)}`, 'Equity']}
                />
                <Area type="monotone" dataKey="equity" stroke="#00d084" strokeWidth={2}
                  fill="url(#equityGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-24 sm:h-32 flex items-center justify-center text-subtle text-xs sm:text-sm">
              Chart appears once bot starts
            </div>
          )}
        </div>

        {/* Market intelligence */}
        <div className="card p-3 sm:p-4">
          <p className="text-xs text-muted uppercase tracking-wider font-medium mb-3">Market</p>
          {heartbeat ? (
            <div className="space-y-3">
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
              <div className="pt-2 border-t border-white/[0.06] grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-subtle">Today</p>
                  <p className="text-sm font-bold">{heartbeat.trades_today}</p>
                </div>
                <div>
                  <p className="text-xs text-subtle">Open</p>
                  <p className="text-sm font-bold">{heartbeat.open_positions}</p>
                </div>
                <div>
                  <p className="text-xs text-subtle">P&L</p>
                  <p className={`text-sm font-bold ${(heartbeat.pnl_today ?? 0) >= 0 ? 'text-green' : 'text-red'}`}>
                    {fmtSigned(heartbeat.pnl_today)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-subtle">Cycles</p>
                  <p className="text-sm font-bold">{heartbeat.cycles_today}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-subtle text-xs py-6">
              Waiting for bot…
            </div>
          )}
        </div>
      </div>

      {/* Recent trades - Horizontal scroll on mobile */}
      <div className="card p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs sm:text-sm font-semibold">Recent Trades</p>
          <a href="/dashboard/trades" className="text-xs text-green hover:underline">View all</a>
        </div>
        {trades.length === 0 ? (
          <div className="py-8 text-center text-subtle text-xs sm:text-sm">
            No trades yet
          </div>
        ) : (
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
            <table className="w-full text-xs sm:text-sm min-w-[500px]">
              <thead>
                <tr className="text-xs text-subtle uppercase tracking-wider border-b border-white/[0.06]">
                  <th className="text-left py-2 pr-3 font-medium">Symbol</th>
                  <th className="text-left py-2 pr-3 font-medium">Side</th>
                  <th className="text-left py-2 pr-3 font-medium">Entry</th>
                  <th className="text-left py-2 pr-3 font-medium">P&L</th>
                  <th className="text-left py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {trades.slice(0, 5).map(t => {
                  const unrealized = (t as any).unrealized_pnl
                  const isOpen = !t.closed_at
                  const pnlValue = isOpen ? unrealized : t.pnl
                  
                  return (
                    <tr key={t.id} className="hover:bg-white/[0.02]">
                      <td className="py-2 pr-3 font-medium font-mono">{t.symbol}</td>
                      <td className="py-2 pr-3">
                        <span className={t.side === 'LONG' ? 'text-green font-semibold' : 'text-red font-semibold'}>
                          {t.side}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-mono text-muted">
                        ${t.entry_price?.toLocaleString()}
                      </td>
                      <td className="py-2 pr-3 font-mono">
                        {pnlValue != null ? (
                          <span className={pnlValue >= 0 ? 'text-green' : 'text-red'}>
                            {fmtSigned(pnlValue)}
                          </span>
                        ) : <span className="text-subtle">—</span>}
                      </td>
                      <td className="py-2">
                        {t.closed_at ? (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${t.pnl && t.pnl >= 0 ? 'bg-green/10 text-green' : 'bg-red/10 text-red'}`}>
                            {t.close_reason ?? 'Closed'}
                          </span>
                        ) : (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-blue/10 text-blue">Open</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label, value, sub, positive, icon: Icon, iconColor
}: {
  label: string; value: string; sub?: string
  positive?: boolean; icon: any; iconColor: string
}) {
  return (
    <div className="card p-3 sm:p-4 flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs text-muted uppercase tracking-wider font-medium mb-1">{label}</p>
        <p className={`text-base sm:text-xl font-bold truncate ${positive === true ? 'text-green' : positive === false ? 'text-red' : ''}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-subtle mt-0.5 truncate">{sub}</p>}
      </div>
      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 ${iconColor}`}>
        <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
      </div>
    </div>
  )
}
