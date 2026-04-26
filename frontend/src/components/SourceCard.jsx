import { useState } from 'react'

const FILE_ICONS = {
  pdf:    { label: 'PDF',  color: 'text-red-400',   bg: 'bg-red-400/10'   },
  docx:   { label: 'DOC',  color: 'text-blue-400',  bg: 'bg-blue-400/10'  },
  gdoc:   { label: 'GDoc', color: 'text-green-400', bg: 'bg-green-400/10' },
  txt:    { label: 'TXT',  color: 'text-slate-400', bg: 'bg-slate-400/10' },
}

function FileTypeBadge({ sourceType }) {
  const cfg = FILE_ICONS[sourceType] ?? { label: 'DOC', color: 'text-slate-400', bg: 'bg-slate-400/10' }
  return (
    <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded
                      ${cfg.color} ${cfg.bg}`}>
      {cfg.label}
    </span>
  )
}

export default function SourceCard({ source, index }) {
  const [expanded, setExpanded] = useState(false)
  const relevancePct = Math.round((source.relevance_score ?? 0) * 100)

  return (
    <div className="border border-navy-400 rounded-xl overflow-hidden bg-navy-700
                    transition-colors hover:border-navy-300">
      {/* ── Header (always visible) ────────────────────────── */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left
                   hover:bg-navy-600 transition-colors"
      >
        {/* Index number */}
        <span className="text-gold-500 font-mono text-xs shrink-0 w-4">
          [{index + 1}]
        </span>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <FileTypeBadge sourceType={source.source_type} />
            <p className="text-sm text-slate-200 truncate font-medium">
              {source.source_file}
            </p>
          </div>
          {source.section_heading && (
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {source.section_heading}
            </p>
          )}
        </div>

        {/* Relevance bar + chevron */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-14 h-1 bg-navy-400 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold-500 rounded-full transition-all"
                style={{ width: `${relevancePct}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 font-mono w-8">{relevancePct}%</span>
          </div>
          <svg
            className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200
                        ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* ── Expanded content ───────────────────────────────── */}
      {expanded && (
        <div className="border-t border-navy-400 px-3 py-3 animate-fade-in">
          <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap font-mono">
            {source.content}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            {source.author     && <span>Author: <span className="text-slate-500">{source.author}</span></span>}
            {source.page_number && <span>Page: <span className="text-slate-500">{source.page_number}</span></span>}
            <span>
              Ingested: <span className="text-slate-500">{source.date_ingested?.slice(0, 10)}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
