'use client'
// src/components/dashboard/DashboardClient.tsx
import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Activity, Zap, Shield, AlertTriangle } from 'lucide-react'
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

function pct(n: number | null | undefined) {
  if (n == null) return '—'
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
}

export default function DashboardClient({ profile, config, trades, heartbeat, equityHistory, stats }: Props) {
  const botOnline = heartbeat
    ? (Date.now() - new Date(heartbeat.created_at).getTime()) < 2 * 3600 * 1000
    : false

  const chartData = equityHistory.map(e => ({
    time: new Date(e.snapshot_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
    equity: e.equity,
  }))

  // Use pnl_today from heartbeat (includes unrealized) or fall back to stats
  const todayPnl = heartbeat?.pnl_today ?? stats?.pnl_today ?? 0
  const unrealizedPnl = (heartbeat as any)?.unrealized_pnl ?? 0
  const totalPnl = stats?.total_pnl ?? 0
  const winRate = stats?.win_rate_pct ?? 0
  const totalTrades = stats?.total_trades ?? 0

  // Calculate unrealized P&L from open trades if not in heartbeat
  const openTrades = trades.filter(t => !t.closed_at)
  const tradesUnrealizedPnl = openTrades.reduce((sum, t) => sum + ((t as any).unrealized_pnl ?? 0), 0)
  const displayUnrealizedPnl = unrealizedPnl || tradesUnrealizedPnl

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted text-sm mt-0.5">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Bot status */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium
            ${botOnline
              ? 'bg-green/5 border-green/20 text-green'
              : 'bg-white/5 border-white/10 text-muted'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${botOnline ? 'bg-green animate-pulse' : 'bg-subtle'}`} />
            {botOnline ? 'Bot live' : 'Bot offline'}
          </div>
          {config?.testnet && (
            <span className="badge-gold">Testnet</span>
          )}
        </div>
      </div>

      {/* Setup prompt if not configured */}
      {!config?.hl_wallet_address && (
        <div className="card border-gold/20 bg-gold/5 mb-6 flex items-center gap-4">
          <AlertTriangle className="w-5 h-5 text-gold flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gold">Complete your setup</p>
            <p className="text-xs text-muted mt-0.5">Add your Hyperliquid API wallet to start trading.</p>
          </div>
          <a href="/settings" className="btn-secondary text-sm">Configure →</a>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Today's P&L"
          value={fmtSigned(todayPnl)}
          sub={displayUnrealizedPnl !== 0 ? `${fmtSigned(displayUnrealizedPnl)} unrealized` : undefined}
          positive={todayPnl >= 0}
          icon={todayPnl >= 0 ? TrendingUp : TrendingDown}
          iconColor={todayPnl >= 0 ? 'text-green' : 'text-red'}
        />
        <StatCard
          label="Total P&L"
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
          label="Total Trades"
          value={String(totalTrades)}
          sub={config?.testnet ? 'Testnet mode' : 'Live'}
          icon={Activity}
          iconColor="text-muted"
        />
      </div>

      {/* Chart + Market status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Equity chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted uppercase tracking-wider font-medium">Portfolio Value</p>
              <p className="text-2xl font-bold mt-0.5">
                {heartbeat ? fmt(heartbeat.equity) : '—'}
              </p>
            </div>
            {displayUnrealizedPnl !== 0 && (
              <div className={`text-sm font-medium ${displayUnrealizedPnl >= 0 ? 'text-green' : 'text-red'}`}>
                {fmtSigned(displayUnrealizedPnl)} unrealized
              </div>
            )}
          </div>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00d084" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#00d084" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fill: '#6b7a99', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7a99', fontSize: 10 }} axisLine={false} tickLine={false} width={60}
                  tickFormatter={v => `$${(v/1000).toFixed(1)}k`} />
                <Tooltip
                  contentStyle={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#9ba3b8' }}
                  itemStyle={{ color: '#00d084' }}
                  formatter={(v: number) => [`$${v.toFixed(2)}`, 'Equity']}
                />
                <Area type="monotone" dataKey="equity" stroke="#00d084" strokeWidth={2}
                  fill="url(#equityGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-subtle text-sm">
              Equity history will appear here once the bot starts running.
            </div>
          )}
        </div>

        {/* Market intelligence */}
        <div className="card">
          <p className="text-xs text-muted uppercase tracking-wider font-medium mb-4">Market Intelligence</p>
          {heartbeat ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-subtle mb-1">Regime</p>
                <p className={`text-sm font-semibold ${REGIME_COLOUR[heartbeat.regime] ?? 'text-muted'}`}>
                  {heartbeat.regime?.replace('_', ' ') ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-subtle mb-1">Macro</p>
                <span className={MACRO_COLOUR[heartbeat.macro_context] ?? 'badge-subtle'}>
                  {heartbeat.macro_context ?? 'NONE'}
                </span>
              </div>
              <div className="pt-3 border-t border-white/[0.06] grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-subtle">Trades today</p>
                  <p className="text-lg font-bold mt-0.5">{heartbeat.trades_today}</p>
                </div>
                <div>
                  <p className="text-xs text-subtle">Open</p>
                  <p className="text-lg font-bold mt-0.5">{heartbeat.open_positions}</p>
                </div>
                <div>
                  <p className="text-xs text-subtle">P&L today</p>
                  <p className={`text-lg font-bold mt-0.5 ${(heartbeat.pnl_today ?? 0) >= 0 ? 'text-green' : 'text-red'}`}>
                    {fmtSigned(heartbeat.pnl_today)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-subtle">Cycles</p>
                  <p className="text-lg font-bold mt-0.5">{heartbeat.cycles_today}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-subtle text-sm py-10">
              Waiting for bot data…
            </div>
          )}
        </div>
      </div>

      {/* Recent trades */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold">Recent Trades</p>
          <a href="/dashboard/trades" className="text-xs text-green hover:underline">View all</a>
        </div>
        {trades.length === 0 ? (
          <div className="py-12 text-center text-subtle text-sm">
            No trades yet. Paper trading will begin on the next bot cycle.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-subtle uppercase tracking-wider border-b border-white/[0.06]">
                  <th className="text-left py-2 pr-4 font-medium">Symbol</th>
                  <th className="text-left py-2 pr-4 font-medium">Side</th>
                  <th className="text-left py-2 pr-4 font-medium">Entry</th>
                  <th className="text-left py-2 pr-4 font-medium">Current</th>
                  <th className="text-left py-2 pr-4 font-medium">P&L</th>
                  <th className="text-left py-2 pr-4 font-medium">Regime</th>
                  <th className="text-left py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {trades.map(t => {
                  const unrealized = (t as any).unrealized_pnl
                  const currentPrice = (t as any).current_price
                  const isOpen = !t.closed_at
                  const pnlValue = isOpen ? unrealized : t.pnl
                  const pnlDisplay = pnlValue != null ? pnlValue : null
                  
                  return (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 pr-4 font-medium font-mono text-xs">{t.symbol}-PERP</td>
                      <td className="py-2.5 pr-4">
                        <span className={t.side === 'LONG' ? 'text-green text-xs font-semibold' : 'text-red text-xs font-semibold'}>
                          {t.side}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-muted">
                        ${t.entry_price?.toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-muted">
                        {currentPrice ? `$${currentPrice.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs">
                        {pnlDisplay != null ? (
                          <span className={pnlDisplay >= 0 ? 'text-green' : 'text-red'}>
                            {fmtSigned(pnlDisplay)}
                          </span>
                        ) : <span className="text-subtle">—</span>}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="text-xs text-subtle">{t.regime?.replace('_', ' ') ?? '—'}</span>
                      </td>
                      <td className="py-2.5">
                        {t.closed_at ? (
                          <span className={t.pnl && t.pnl >= 0 ? 'badge-green' : 'badge-red'}>
                            {t.close_reason ?? 'Closed'}
                          </span>
                        ) : (
                          <span className="badge-blue">Open</span>
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
    <div className="card flex items-start justify-between gap-2">
      <div>
        <p className="text-xs text-muted uppercase tracking-wider font-medium mb-2">{label}</p>
        <p className={`text-xl font-bold ${positive === true ? 'text-green' : positive === false ? 'text-red' : ''}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-subtle mt-1">{sub}</p>}
      </div>
      <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 ${iconColor}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
  )
}
