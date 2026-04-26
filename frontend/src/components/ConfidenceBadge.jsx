const TIERS = {
  high: {
    label: 'High Confidence',
    dot:   'bg-emerald-400',
    text:  'text-emerald-400',
    bg:    'bg-emerald-400/10',
    border:'border-emerald-400/25',
  },
  partial: {
    label: 'Partial Information',
    dot:   'bg-amber-400',
    text:  'text-amber-400',
    bg:    'bg-amber-400/10',
    border:'border-amber-400/25',
  },
  low: {
    label: 'Insufficient Data',
    dot:   'bg-red-400',
    text:  'text-red-400',
    bg:    'bg-red-400/10',
    border:'border-red-400/25',
  },
}

export default function ConfidenceBadge({ tier, score }) {
  const cfg = TIERS[tier] ?? TIERS.low
  const pct = Math.round((score ?? 0) * 100)

  return (
    <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full
                      border text-xs font-medium ${cfg.bg} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      <span className={cfg.text}>{cfg.label}</span>
      <span className="text-slate-600">·</span>
      <span className={`font-mono ${cfg.text}`}>{pct}%</span>
    </span>
  )
}
