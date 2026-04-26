const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API_KEY  = import.meta.env.VITE_API_KEY  || ''

async function request(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `Request failed: ${res.status}`)
  }

  return res.json()
}

export const api = {
  // ── Query ───────────────────────────────────────────────────
  query: (question, top_k) =>
    request('POST', '/query', { question, ...(top_k && { top_k }) }),

  // ── Ingestion ───────────────────────────────────────────────
  ingestDrive:      (folder_id) => request('POST', '/ingest/drive', { folder_id }),
  ingestionStatus:  (jobId)     => request('GET',  `/ingest/status/${jobId}`),

  // ── Admin ───────────────────────────────────────────────────
  getDocuments:    ()      => request('GET',    '/admin/documents'),
  deleteDocument:  (docId) => request('DELETE', `/admin/documents/${docId}`),
  reindexDocument: (docId) => request('POST',   `/admin/documents/${docId}/reindex`),
  getQueryLog:     ()      => request('GET',    '/admin/query-log'),
  getSystemHealth: ()      => request('GET',    '/admin/system-health'),
}
