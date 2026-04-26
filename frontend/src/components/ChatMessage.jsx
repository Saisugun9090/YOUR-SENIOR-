import { useState } from 'react'
import ConfidenceBadge from './ConfidenceBadge'
import SourceCard from './SourceCard'

const TIER_BORDER = {
  high:    'border-l-emerald-400',
  partial: 'border-l-amber-400',
  low:     'border-l-red-400',
}

export default function ChatMessage({ message }) {
  const [showSources, setShowSources] = useState(false)

  /* ── User bubble ─────────────────────────────────────────── */
  if (message.role === 'user') {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[72%] bg-navy-500 border border-navy-400
                        rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-slate-200 text-sm leading-relaxed">{message.content}</p>
        </div>
      </div>
    )
  }

  /* ── Assistant bubble ────────────────────────────────────── */
  const borderClass = TIER_BORDER[message.confidence_tier] ?? 'border-l-slate-500'

  return (
    <div className="flex justify-start animate-fade-in">
      <div className="max-w-[85%] space-y-2.5">

        {/* Answer card */}
        <div className={`bg-navy-700 border border-navy-400 border-l-2
                         ${borderClass} rounded-2xl rounded-tl-sm px-4 py-3.5`}>
          <div className="mb-2.5">
            <ConfidenceBadge
              tier={message.confidence_tier}
              score={message.confidence_score}
            />
          </div>
          <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>

        {/* Sources toggle */}
        {message.sources?.length > 0 && (
          <div className="space-y-1.5 pl-1">
            <button
              onClick={() => setShowSources(v => !v)}
              className="flex items-center gap-1.5 text-xs text-gold-500
                         hover:text-gold-400 transition-colors"
            >
              <svg
                className={`w-3 h-3 transition-transform duration-200
                            ${showSources ? 'rotate-90' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                      d="M9 5l7 7-7 7" />
              </svg>
              {showSources ? 'Hide' : 'View'}{' '}
              {message.sources.length} source
              {message.sources.length !== 1 ? 's' : ''}
            </button>

            {showSources && (
              <div className="space-y-1.5 animate-fade-in">
                {message.sources.map((src, i) => (
                  <SourceCard key={src.chunk_id} source={src} index={i} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
