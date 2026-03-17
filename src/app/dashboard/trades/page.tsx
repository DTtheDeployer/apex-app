export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChevronDown, TrendingUp, Target, Zap, Crosshair, Crown, Sparkles } from 'lucide-react'

// Strategy definitions matching the dashboard
const STRATEGIES = [
  { id: 'apex_adaptive', name: 'APEX Adaptive', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  { id: 'momentum_rider', name: 'Momentum Rider', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  { id: 'dip_hunter', name: 'Dip Hunter', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  { id: 'breakout_blitz', name: 'Breakout Blitz', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  { id: 'scalp_sniper', name: 'Scalp Sniper', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
  { id: 'swing_king', name: 'Swing King', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
]

// Normalize strategy ID from various formats
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

export default async function TradesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const userId = user.id

  // Only fetch CLOSED trades (where closed_at is not null)
  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .not('closed_at', 'is', null)
    .order('closed_at', { ascending: false })
    .limit(100)

  const closedTrades = trades ?? []
  const wins = closedTrades.filter((t: any) => (t.pnl ?? 0) > 0).length
  const losses = closedTrades.filter((t: any) => (t.pnl ?? 0) < 0).length
  const winRate = closedTrades.length > 0 ? ((wins / closedTrades.length) * 100).toFixed(1) : '—'
  const totalPnl = closedTrades.reduce((sum: number, t: any) => sum + (t.pnl ?? 0), 0)
  const avgWin = wins > 0 ? closedTrades.filter((t: any) => t.pnl > 0).reduce((s: number, t: any) => s + t.pnl, 0) / wins : 0
  const avgLoss = losses > 0 ? closedTrades.filter((t: any) => t.pnl < 0).reduce((s: number, t: any) => s + t.pnl, 0) / losses : 0
  const avgDuration = closedTrades.length > 0 
    ? Math.round(closedTrades.reduce((s: number, t: any) => s + (t.held_minutes ?? 0), 0) / closedTrades.length) 
    : 0

  // Calculate stats by normalized strategy
  const strategyStatsMap: Record<string, { trades: number; pnl: number; wins: number }> = {}
  closedTrades.forEach((t: any) => {
    const stratId = normalizeStrategyId(t.strategy)
    if (!strategyStatsMap[stratId]) {
      strategyStatsMap[stratId] = { trades: 0, pnl: 0, wins: 0 }
    }
    strategyStatsMap[stratId].trades++
    strategyStatsMap[stratId].pnl += t.pnl ?? 0
    if ((t.pnl ?? 0) > 0) strategyStatsMap[stratId].wins++
  })

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Trade History</h1>
        <p className="text-muted text-sm mt-0.5">{closedTrades.length} closed trades</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-surface rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wider font-medium mb-1">Total P&L</p>
          <p className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-green' : 'text-red'}`}>
            {totalPnl >= 0 ? '+' : '-'}${Math.abs(totalPnl).toFixed(2)}
          </p>
        </div>
        <div className="bg-surface rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wider font-medium mb-1">Win Rate</p>
          <p className="text-2xl font-bold">{winRate}%</p>
          <p className="text-xs text-muted mt-0.5">
            <span className="text-green">{wins}W</span> / <span className="text-red">{losses}L</span>
          </p>
        </div>
        <div className="bg-surface rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wider font-medium mb-1">Avg Win / Loss</p>
          <p className="text-sm">
            <span className="text-green font-bold">+${avgWin.toFixed(2)}</span>
            <span className="text-muted mx-1">/</span>
            <span className="text-red font-bold">${Math.abs(avgLoss).toFixed(2)}</span>
          </p>
        </div>
        <div className="bg-surface rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wider font-medium mb-1">Avg Duration</p>
          <p className="text-2xl font-bold">
            {avgDuration >= 60 ? `${Math.floor(avgDuration / 60)}h ${avgDuration % 60}m` : `${avgDuration}m`}
          </p>
        </div>
      </div>

      {/* Strategy Breakdown - Using actual strategies */}
      <div className="bg-surface rounded-xl p-4 mb-6">
        <p className="text-xs text-muted uppercase tracking-wider font-medium mb-3">Performance by Strategy</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {STRATEGIES.map(strategy => {
            const stats = strategyStatsMap[strategy.id] || { trades: 0, pnl: 0, wins: 0 }
            const winRate = stats.trades > 0 ? ((stats.wins / stats.trades) * 100).toFixed(0) : '—'
            
            return (
              <div key={strategy.id} className={`rounded-lg p-3 border ${strategy.bg}`}>
                <p className={`text-xs font-medium ${strategy.color} mb-1`}>{strategy.name}</p>
                <p className={`text-sm font-bold ${stats.pnl >= 0 ? 'text-green' : 'text-red'}`}>
                  {stats.pnl >= 0 ? '+' : '-'}${Math.abs(stats.pnl).toFixed(2)}
                </p>
                <p className="text-[10px] text-muted">{stats.trades} trades • {winRate}{winRate !== '—' ? '%' : ''} win</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Trades List */}
      <div className="bg-surface rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-xs text-muted uppercase tracking-wider font-medium">Recent Trades</p>
        </div>
        
        {closedTrades.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <p>No closed trades yet.</p>
            <p className="text-xs mt-1">Trades will appear here once the bot closes positions.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {closedTrades.map((t: any) => {
              const isWin = (t.pnl ?? 0) > 0
              const duration = t.held_minutes ?? 0
              const durationStr = duration >= 60 
                ? `${Math.floor(duration / 60)}h ${duration % 60}m` 
                : `${duration}m`
              const stratDisplay = getStrategyDisplay(t.strategy)
              const closedDate = new Date(t.closed_at)
              
              return (
                <details key={t.id} className="group">
                  <summary className="px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors list-none">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${t.side === 'LONG' ? 'bg-green/20 text-green' : 'bg-red/20 text-red'}`}>
                          {t.side}
                        </span>
                        <span className="font-medium">{t.symbol}</span>
                        {t.strategy && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${stratDisplay.bg} ${stratDisplay.color}`}>
                            {stratDisplay.name}
                          </span>
                        )}
                        {/* Timestamp */}
                        <span className="text-[10px] text-muted hidden sm:inline">
                          {closedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} {closedDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-bold ${isWin ? 'text-green' : 'text-red'}`}>
                          {isWin ? '+' : '-'}${Math.abs(t.pnl ?? 0).toFixed(2)}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          t.close_reason === 'TP' ? 'bg-green/20 text-green' : 
                          t.close_reason === 'SL' ? 'bg-red/20 text-red' : 
                          'bg-white/10 text-muted'
                        }`}>
                          {t.close_reason || '—'}
                        </span>
                        <ChevronDown className="w-4 h-4 text-muted group-open:rotate-180 transition-transform" />
                      </div>
                    </div>
                  </summary>
                  
                  <div className="px-4 pb-4 pt-2 bg-white/[0.02]">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
                      <div>
                        <p className="text-muted">Entry</p>
                        <p className="font-mono">${t.entry_price?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted">Exit</p>
                        <p className="font-mono">${t.exit_price?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted">Duration</p>
                        <p>{durationStr}</p>
                      </div>
                      <div>
                        <p className="text-muted">Closed</p>
                        <p>{closedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    
                    {t.explanation && (
                      <div className="bg-white/5 rounded-lg p-3 mt-2">
                        <p className="text-xs text-muted mb-1">Why this trade?</p>
                        <p className="text-sm text-white/80 leading-relaxed">{t.explanation}</p>
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-3 text-[10px]">
                      {t.regime && (
                        <span className={`px-2 py-0.5 rounded ${
                          t.regime === 'TRENDING_UP' ? 'bg-green/10 text-green' :
                          t.regime === 'TRENDING_DOWN' ? 'bg-red/10 text-red' :
                          t.regime === 'VOLATILE' ? 'bg-gold/10 text-gold' :
                          'bg-blue/10 text-blue'
                        }`}>
                          {t.regime?.replace('_', ' ')}
                        </span>
                      )}
                      {t.macro_context && t.macro_context !== 'NONE' && (
                        <span className={`px-2 py-0.5 rounded ${
                          t.macro_context === 'CAUTION' ? 'bg-gold/10 text-gold' :
                          t.macro_context === 'FREEZE' ? 'bg-red/10 text-red' :
                          'bg-white/10 text-muted'
                        }`}>
                          {t.macro_context}
                        </span>
                      )}
                      {t.leverage && (
                        <span className="px-2 py-0.5 rounded bg-white/10 text-muted">
                          {t.leverage}x
                        </span>
                      )}
                    </div>
                  </div>
                </details>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}