const TIER_CONFIG = {
  high:    { dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'High'    },
  partial: { dot: 'bg-amber-400',   text: 'text-amber-400',   label: 'Partial' },
  low:     { dot: 'bg-red-400',     text: 'text-red-400',     label: 'Low'     },
}

function MiniConfidenceBar({ score }) {
  const pct = Math.round((score ?? 0) * 100)
  const color = pct >= 75 ? 'bg-emerald-400' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-navy-400 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-400 w-8">{pct}%</span>
    </div>
  )
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return new Date(iso).toLocaleDateString()
}

export default function QueryLogTable({ entries }) {
  if (!entries?.length) {
    return (
      <div className="text-center py-12 text-slate-600 text-sm">
        No queries yet. Ask Your Senior something in the Chat tab.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-navy-400">
            {['Question', 'Confidence', 'Tier', 'Sources', 'When'].map(h => (
              <th key={h} className="px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => {
            const tier = TIER_CONFIG[entry.confidence_tier] ?? TIER_CONFIG.low
            return (
              <tr key={entry.query_id}
                  className="border-b border-navy-400 hover:bg-navy-600 transition-colors">
                {/* Question */}
                <td className="px-4 py-3 max-w-xs">
                  <p className="text-slate-300 text-sm truncate" title={entry.question}>
                    {entry.question}
                  </p>
                </td>

                {/* Confidence bar */}
                <td className="px-4 py-3">
                  <MiniConfidenceBar score={entry.confidence_score} />
                </td>

                {/* Tier */}
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1.5 text-xs ${tier.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${tier.dot}`} />
                    {tier.label}
                  </span>
                </td>

                {/* Chunks retrieved */}
                <td className="px-4 py-3 text-center">
                  <span className="text-gold-500 font-mono text-sm">
                    {entry.chunks_retrieved}
                  </span>
                </td>

                {/* Time */}
                <td className="px-4 py-3">
                  <span className="text-slate-500 text-xs whitespace-nowrap">
                    {timeAgo(entry.timestamp)}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
