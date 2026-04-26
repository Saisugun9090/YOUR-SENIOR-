import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import HealthPanel from '../components/HealthPanel'
import IngestPanel from '../components/IngestPanel'
import DocumentRow from '../components/DocumentRow'
import QueryLogTable from '../components/QueryLogTable'

const TABS = [
  { id: 'overview',  label: 'Overview'  },
  { id: 'documents', label: 'Documents' },
  { id: 'query-log', label: 'Query Log' },
]

function TabButton({ id, label, active, onClick, badge }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors relative
                  ${active
                    ? 'text-gold-500 bg-gold-500/10 border border-gold-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-600'}`}
    >
      {label}
      {badge > 0 && (
        <span className="ml-1.5 text-xs bg-navy-400 text-slate-400
                         px-1.5 py-0.5 rounded-full font-mono">
          {badge}
        </span>
      )}
    </button>
  )
}

function SectionHeader({ title, sub, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-slate-100 font-semibold text-sm">{title}</h3>
        {sub && <p className="text-slate-600 text-xs mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export default function Admin() {
  const [activeTab,  setActiveTab]  = useState('overview')
  const [health,     setHealth]     = useState(null)
  const [documents,  setDocuments]  = useState([])
  const [queryLog,   setQueryLog]   = useState([])
  const [loadingMap, setLoadingMap] = useState({})
  const [error,      setError]      = useState(null)

  const setLoading = (key, val) =>
    setLoadingMap(prev => ({ ...prev, [key]: val }))

  const loadHealth = useCallback(async () => {
    setLoading('health', true)
    try { setHealth(await api.getSystemHealth()) }
    catch (e) { setError(e.message) }
    finally { setLoading('health', false) }
  }, [])

  const loadDocuments = useCallback(async () => {
    setLoading('docs', true)
    try { setDocuments(await api.getDocuments()) }
    catch (e) { setError(e.message) }
    finally { setLoading('docs', false) }
  }, [])

  const loadQueryLog = useCallback(async () => {
    setLoading('log', true)
    try { setQueryLog(await api.getQueryLog()) }
    catch (e) { setError(e.message) }
    finally { setLoading('log', false) }
  }, [])

  // Load data when tab becomes active
  useEffect(() => {
    if (activeTab === 'overview')  { loadHealth(); }
    if (activeTab === 'documents') { loadDocuments(); }
    if (activeTab === 'query-log') { loadQueryLog(); }
  }, [activeTab])

  // Always load health on mount
  useEffect(() => { loadHealth() }, [])

  const handleDelete = async (docId) => {
    try {
      await api.deleteDocument(docId)
      setDocuments(prev => prev.filter(d => d.doc_id !== docId))
      loadHealth()
    } catch (e) { setError(e.message) }
  }

  const handleReindex = async (docId) => {
    try { await api.reindexDocument(docId) }
    catch (e) { setError(e.message) }
  }

  const isLoading = (key) => !!loadingMap[key]

  return (
    <div className="flex flex-col h-screen bg-navy-900">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="shrink-0 px-6 py-4 border-b border-navy-400">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-slate-100 font-semibold text-sm">Your Senior — Admin Dashboard</h2>
            <p className="text-slate-600 text-xs mt-0.5">
              Manage your knowledge base, monitor ingestion, and review query history
            </p>
          </div>
          {health && (
            <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border
                             ${health.chroma.connected
                               ? 'text-emerald-400 border-emerald-400/25 bg-emerald-400/5'
                               : 'text-red-400 border-red-400/25 bg-red-400/5'}`}>
              <span className={`w-1.5 h-1.5 rounded-full
                                ${health.chroma.connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
              {health.chroma.connected ? 'Live' : 'Offline'}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {TABS.map(t => (
            <TabButton
              key={t.id}
              id={t.id}
              label={t.label}
              active={activeTab === t.id}
              onClick={setActiveTab}
              badge={
                t.id === 'documents' ? documents.length :
                t.id === 'query-log' ? queryLog.length  : 0
              }
            />
          ))}
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-400/10 border border-red-400/25
                          text-red-400 text-sm flex items-center justify-between">
            {error}
            <button onClick={() => setError(null)}
                    className="text-red-400/50 hover:text-red-400 ml-4">✕</button>
          </div>
        )}

        {/* ── Overview tab ─────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="max-w-3xl space-y-6">
            <div>
              <SectionHeader
                title="System Health"
                sub="Real-time ChromaDB and backend status"
                action={
                  <button onClick={loadHealth}
                          className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                    Refresh
                  </button>
                }
              />
              {isLoading('health')
                ? <div className="text-slate-600 text-sm animate-pulse">Loading…</div>
                : <HealthPanel health={health} />
              }
            </div>

            <div>
              <SectionHeader
                title="Sync Knowledge Base"
                sub="Pull documents from Google Drive into Your Senior"
              />
              <IngestPanel onComplete={() => { loadHealth(); loadDocuments() }} />
            </div>
          </div>
        )}

        {/* ── Documents tab ────────────────────────────────── */}
        {activeTab === 'documents' && (
          <div className="max-w-5xl">
            <SectionHeader
              title="Indexed Documents"
              sub={`${documents.length} document${documents.length !== 1 ? 's' : ''} in Your Senior's knowledge base`}
              action={
                <button onClick={loadDocuments}
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  Refresh
                </button>
              }
            />

            {isLoading('docs') ? (
              <div className="text-slate-600 text-sm animate-pulse">Loading documents…</div>
            ) : documents.length === 0 ? (
              <div className="text-center py-16 text-slate-600 text-sm">
                No documents indexed yet. Use the Overview tab to sync from Google Drive.
              </div>
            ) : (
              <div className="bg-navy-700 border border-navy-400 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-navy-400">
                      {['Document', 'Chunks', 'Size', 'Ingested', 'Status', ''].map(h => (
                        <th key={h}
                            className="px-4 py-2.5 text-xs font-medium text-slate-500
                                       uppercase tracking-wider text-right first:text-left last:text-right">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map(doc => (
                      <DocumentRow
                        key={doc.doc_id}
                        doc={doc}
                        onDelete={handleDelete}
                        onReindex={handleReindex}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Query Log tab ────────────────────────────────── */}
        {activeTab === 'query-log' && (
          <div className="max-w-5xl">
            <SectionHeader
              title="Query Log"
              sub="Last 50 questions asked, with confidence scores and source counts"
              action={
                <button onClick={loadQueryLog}
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  Refresh
                </button>
              }
            />
            {isLoading('log') ? (
              <div className="text-slate-600 text-sm animate-pulse">Loading query log…</div>
            ) : (
              <div className="bg-navy-700 border border-navy-400 rounded-xl overflow-hidden">
                <QueryLogTable entries={queryLog} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
