interface PnlBadgeProps {
  value: number | null | undefined
  format?: 'dollar' | 'percent'
  size?: 'sm' | 'md'
}

export default function PnlBadge({ value, format = 'dollar', size = 'sm' }: PnlBadgeProps) {
  if (value == null) return <span className="pnl-neutral inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-mono font-medium">—</span>

  const abs = Math.abs(value)
  let display: string
  if (format === 'percent') {
    display = `${abs.toFixed(1)}%`
  } else {
    display = abs >= 1000 ? `$${(abs / 1000).toFixed(1)}k` : `$${abs.toFixed(2)}`
  }

  const sign = value >= 0 ? '+' : '-'
  const cls = value > 0 ? 'pnl-positive' : value < 0 ? 'pnl-negative' : 'pnl-neutral'
  const sizeClass = size === 'md' ? 'px-3 py-1 text-xl' : 'px-1.5 py-0.5 text-xs'

  return (
    <span className={`${cls} inline-flex items-center rounded-md ${sizeClass} font-mono font-semibold`}>
      {sign}{display}
    </span>
  )
}
