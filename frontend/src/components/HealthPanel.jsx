const StatCard = ({ label, value, sub }) => (
  <div className="bg-navy-700 border border-navy-400 rounded-xl px-4 py-4">
    <p className="text-slate-500 text-xs mb-1.5">{label}</p>
    <p className="text-gold-500 text-2xl font-bold font-mono">{value}</p>
    {sub && <p className="text-slate-600 text-xs mt-1">{sub}</p>}
  </div>
)

export default function HealthPanel({ health }) {
  if (!health) return null

  const { chroma } = health
  const lastSync = chroma.last_ingestion
    ? new Date(chroma.last_ingestion).toLocaleString()
    : 'Never'

  return (
    <div className="space-y-4">
      {/* Connection status banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border
                       ${chroma.connected
                         ? 'bg-emerald-400/5 border-emerald-400/20'
                         : 'bg-red-400/5 border-red-400/20'}`}>
        <span className={`w-2 h-2 rounded-full shrink-0
                          ${chroma.connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
        <div>
          <p className={`text-sm font-medium
                         ${chroma.connected ? 'text-emerald-400' : 'text-red-400'}`}>
            ChromaDB {chroma.connected ? 'Connected' : 'Disconnected'}
          </p>
          <p className="text-slate-600 text-xs">
            Collection: <span className="font-mono">{chroma.collection_name}</span>
          </p>
        </div>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border
                          ${health.backend_status === 'ok'
                            ? 'text-emerald-400 border-emerald-400/25 bg-emerald-400/10'
                            : 'text-amber-400 border-amber-400/25 bg-amber-400/10'}`}>
          Backend {health.backend_status}
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Indexed Documents"
          value={chroma.total_documents.toLocaleString()}
        />
        <StatCard
          label="Total Chunks"
          value={chroma.total_chunks.toLocaleString()}
          sub={chroma.total_chunks > 0
            ? `~${Math.round(chroma.total_chunks / Math.max(chroma.total_documents, 1))} avg / doc`
            : undefined}
        />
        <StatCard
          label="Last Ingestion"
          value={chroma.last_ingestion ? new Date(chroma.last_ingestion).toLocaleDateString() : '—'}
          sub={chroma.last_ingestion ? new Date(chroma.last_ingestion).toLocaleTimeString() : undefined}
        />
        <StatCard
          label="System Status"
          value={chroma.connected ? 'Online' : 'Offline'}
          sub={lastSync}
        />
      </div>
    </div>
  )
}
