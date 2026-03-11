export const dynamic = 'force-dynamic'
// src/app/dashboard/trades/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function TradesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trades } = await supabase
    .from('trades').select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200)

  const closed = (trades ?? []).filter(t => t.closed_at)
  const wins   = closed.filter(t => t.pnl > 0).length
  const wr     = closed.length > 0 ? (wins / closed.length * 100).toFixed(1) : '—'
  const totalPnl = closed.reduce((s, t) => s + (t.pnl ?? 0), 0)

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Trade History</h1>
        <p className="text-muted text-sm mt-0.5">{trades?.length ?? 0} trades total</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total P&L', value: `${totalPnl >= 0 ? '+' : ''}$${Math.abs(totalPnl).toFixed(2)}`, color: totalPnl >= 0 ? 'text-green' : 'text-red' },
          { label: 'Win Rate', value: `${wr}%`, color: 'text-white' },
          { label: 'Closed Trades', value: String(closed.length), color: 'text-white' },
        ].map(s => (
          <div key={s.label} className="card">
            <p className="text-xs text-muted uppercase tracking-wider font-medium mb-2">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-subtle uppercase tracking-wider border-b border-white/[0.06] bg-surface2">
                {['Symbol','Side','Entry','Exit','P&L','Regime','Macro','Reason','Duration','Date'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {(trades ?? []).length === 0 ? (
                <tr><td colSpan={10} className="text-center py-16 text-subtle">No trades yet.</td></tr>
              ) : (trades ?? []).map(t => (
                <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium">{t.symbol}-PERP</td>
                  <td className="px-4 py-3">
                    <span className={t.side === 'LONG' ? 'text-green text-xs font-bold' : 'text-red text-xs font-bold'}>{t.side}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">${t.entry_price?.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {t.exit_price ? `$${t.exit_price.toLocaleString()}` : <span className="text-subtle">—</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {t.pnl != null
                      ? <span className={t.pnl >= 0 ? 'text-green' : 'text-red'}>{t.pnl >= 0 ? '+' : ''}${Math.abs(t.pnl).toFixed(2)}</span>
                      : <span className="badge-blue">Open</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{t.regime?.replace('_',' ') ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${t.macro_context === 'NONE' ? 'text-subtle' : t.macro_context === 'FREEZE' ? 'text-red' : t.macro_context === 'CAUTION' ? 'text-gold' : 'text-green'}`}>
                      {t.macro_context ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {t.close_reason
                      ? <span className={t.close_reason === 'TP' ? 'badge-green' : t.close_reason === 'SL' ? 'badge-red' : 'badge-subtle'}>{t.close_reason}</span>
                      : <span className="text-subtle text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-subtle">{t.held_minutes ? `${t.held_minutes}m` : '—'}</td>
                  <td className="px-4 py-3 text-xs text-subtle">
                    {new Date(t.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
