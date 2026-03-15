export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'

export default async function TradesPage() {
  const supabase = createAdminClient()
  const userId = 'a040d19d-f40e-44f7-9b90-dead9d9bcfeb'

  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200)

  const closed = (trades ?? []).filter((t: any) => t.closed_at)
  const wins = closed.filter((t: any) => t.pnl > 0).length
  const wr = closed.length > 0 ? (wins / closed.length * 100).toFixed(1) : '—'
  const totalPnl = closed.reduce((s: number, t: any) => s + (t.pnl ?? 0), 0)

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Trade History</h1>
        <p className="text-muted text-sm mt-0.5">{trades?.length ?? 0} trades total</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card">
          <p className="text-xs text-muted uppercase tracking-wider font-medium mb-2">Total P&L</p>
          <p className={`text-xl font-bold ${totalPnl >= 0 ? 'text-green' : 'text-red'}`}>
            {totalPnl >= 0 ? '+' : ''}${Math.abs(totalPnl).toFixed(2)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-muted uppercase tracking-wider font-medium mb-2">Win Rate</p>
          <p className="text-xl font-bold text-white">{wr}%</p>
        </div>
        <div className="card">
          <p className="text-xs text-muted uppercase tracking-wider font-medium mb-2">Closed Trades</p>
          <p className="text-xl font-bold text-white">{closed.length}</p>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-subtle uppercase tracking-wider border-b border-white/[0.06] bg-surface2">
                <th className="text-left px-4 py-3 font-medium">Symbol</th>
                <th className="text-left px-4 py-3 font-medium">Side</th>
                <th className="text-left px-4 py-3 font-medium">Entry</th>
                <th className="text-left px-4 py-3 font-medium">Exit</th>
                <th className="text-left px-4 py-3 font-medium">P&L</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {(trades ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-subtle">No trades yet.</td>
                </tr>
              ) : (
                (trades ?? []).map((t: any) => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{t.symbol}-PERP</td>
                    <td className="px-4 py-3">
                      <span className={t.side === 'LONG' ? 'text-green text-xs font-bold' : 'text-red text-xs font-bold'}>
                        {t.side}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">${t.entry_price?.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {t.exit_price ? `$${t.exit_price.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {t.pnl != null ? (
                        <span className={t.pnl >= 0 ? 'text-green' : 'text-red'}>
                          {t.pnl >= 0 ? '+' : ''}${Math.abs(t.pnl).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-blue-400">Open</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-subtle">
                      {new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}