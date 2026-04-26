import { useState, useEffect, useRef } from 'react'
import { api } from '../api/client'

const STATUS_COLORS = {
  pending:   'text-slate-400',
  running:   'text-amber-400',
  completed: 'text-emerald-400',
  failed:    'text-red-400',
}

export default function IngestPanel({ onComplete }) {
  const [folderId,  setFolderId]  = useState('')
  const [jobId,     setJobId]     = useState(null)
  const [jobStatus, setJobStatus] = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const pollRef = useRef(null)

  // Poll ingestion status every 2 s while running
  useEffect(() => {
    if (!jobId) return
    pollRef.current = setInterval(async () => {
      try {
        const status = await api.ingestionStatus(jobId)
        setJobStatus(status)
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(pollRef.current)
          if (status.status === 'completed') onComplete?.()
        }
      } catch { /* polling error — keep trying */ }
    }, 2000)
    return () => clearInterval(pollRef.current)
  }, [jobId, onComplete])

  const handleSync = async () => {
    setLoading(true)
    setError(null)
    setJobStatus(null)
    try {
      const res = await api.ingestDrive(folderId || undefined)
      setJobId(res.job_id)
      setJobStatus(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isRunning = jobStatus?.status === 'running' || jobStatus?.status === 'pending'

  return (
    <div className="bg-navy-700 border border-navy-400 rounded-xl p-4 space-y-4">
      <div>
        <h3 className="text-slate-200 text-sm font-semibold">Sync from Google Drive</h3>
        <p className="text-slate-500 text-xs mt-0.5">
          Leave folder ID blank to use the default configured in your .env
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={folderId}
          onChange={e => setFolderId(e.target.value)}
          placeholder="Google Drive folder ID (optional)"
          className="flex-1 bg-navy-600 border border-navy-400 rounded-lg px-3 py-2
                     text-sm text-slate-200 placeholder-slate-600 outline-none
                     focus:border-gold-500/50 transition-colors"
        />
        <button
          onClick={handleSync}
          disabled={loading || isRunning}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${loading || isRunning
                        ? 'bg-navy-500 text-slate-600 cursor-not-allowed'
                        : 'bg-gold-500 hover:bg-gold-400 text-navy-900'}`}
        >
          {isRunning ? 'Syncing…' : 'Sync Now'}
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}

      {jobStatus && (
        <div className="bg-navy-800 rounded-lg px-3 py-2.5 space-y-1 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Status</span>
            <span className={STATUS_COLORS[jobStatus.status] ?? 'text-slate-400'}>
              {jobStatus.status}
              {isRunning && <span className="ml-1 animate-pulse">●</span>}
            </span>
          </div>
          {jobStatus.documents_found != null && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Files found</span>
              <span className="text-slate-300">{jobStatus.documents_found}</span>
            </div>
          )}
          {jobStatus.chunks_created != null && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Chunks created</span>
              <span className="text-slate-300">{jobStatus.chunks_created}</span>
            </div>
          )}
          {jobStatus.message && (
            <p className="text-red-400 text-xs pt-1">{jobStatus.message}</p>
          )}
        </div>
      )}
    </div>
  )
}
