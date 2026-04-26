import { useState } from 'react'

const DECAY_CONFIG = {
  fresh: { label: 'Fresh',  text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/25' },
  aging: { label: 'Aging',  text: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/25'  },
  stale: { label: 'Stale',  text: 'text-red-400',     bg: 'bg-red-400/10',     border: 'border-red-400/25'    },
}

const TYPE_COLORS = {
  pdf:  { text: 'text-red-400',   bg: 'bg-red-400/10'   },
  docx: { text: 'text-blue-400',  bg: 'bg-blue-400/10'  },
  gdoc: { text: 'text-green-400', bg: 'bg-green-400/10' },
  txt:  { text: 'text-slate-400', bg: 'bg-slate-400/10' },
}

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function DocumentRow({ doc, onDelete, onReindex }) {
  const [confirming, setConfirming] = useState(false)
  const [working,    setWorking]    = useState(false)

  const decay = DECAY_CONFIG[doc.confidence_decay_status] ?? DECAY_CONFIG.stale
  const typeColor = TYPE_COLORS[doc.source_type] ?? TYPE_COLORS.txt

  const handleDelete = async () => {
    if (!confirming) { setConfirming(true); return }
    setWorking(true)
    await onDelete(doc.doc_id)
    setWorking(false)
    setConfirming(false)
  }

  const handleReindex = async () => {
    setWorking(true)
    await onReindex(doc.doc_id)
    setWorking(false)
  }

  return (
    <tr className="border-b border-navy-400 hover:bg-navy-600 transition-colors">
      {/* Filename */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded
                            ${typeColor.text} ${typeColor.bg}`}>
            {doc.source_type?.toUpperCase()}
          </span>
          <span className="text-slate-200 text-sm font-medium truncate max-w-[220px]"
                title={doc.filename}>
            {doc.filename}
          </span>
        </div>
        {doc.author && (
          <p className="text-slate-600 text-xs ml-12 mt-0.5">{doc.author}</p>
        )}
      </td>

      {/* Chunks */}
      <td className="px-4 py-3 text-right">
        <span className="text-gold-500 font-mono text-sm">{doc.chunk_count}</span>
      </td>

      {/* Size */}
      <td className="px-4 py-3 text-right">
        <span className="text-slate-500 text-sm font-mono">{formatBytes(doc.file_size_bytes)}</span>
      </td>

      {/* Date ingested */}
      <td className="px-4 py-3 text-right">
        <span className="text-slate-400 text-xs">
          {new Date(doc.date_ingested).toLocaleDateString()}
        </span>
      </td>

      {/* Decay badge */}
      <td className="px-4 py-3 text-center">
        <span className={`text-xs px-2 py-0.5 rounded-full border
                          ${decay.text} ${decay.bg} ${decay.border}`}>
          {decay.label}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={handleReindex}
            disabled={working}
            className="text-xs text-gold-500 hover:text-gold-400 transition-colors
                       px-2 py-1 rounded hover:bg-gold-500/10 disabled:opacity-40"
          >
            Re-index
          </button>
          <button
            onClick={handleDelete}
            disabled={working}
            className={`text-xs px-2 py-1 rounded transition-colors disabled:opacity-40
                        ${confirming
                          ? 'text-red-300 bg-red-400/15 border border-red-400/30'
                          : 'text-red-400 hover:bg-red-400/10'}`}
          >
            {confirming ? 'Confirm?' : 'Delete'}
          </button>
        </div>
      </td>
    </tr>
  )
}
