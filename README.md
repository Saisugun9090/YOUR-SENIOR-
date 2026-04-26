# Your Senior

An AI-powered RAG agent that reads your company's internal documents and answers questions like a trusted senior employee.

Upload PDFs, Word docs, Google Docs, or plain text files. Ask anything. Get cited, confidence-rated answers — or a clear "I don't know" when the data isn't there.

---

## How it works

```
Documents → Parse → Chunk → Embed → ChromaDB
                                         ↓
User question → Embed → Retrieve top-K chunks → Claude → Cited answer
```

Every answer is scored on a three-tier confidence scale:

| Confidence | Threshold | Behaviour |
|---|---|---|
| **HIGH** | > 75 % | Full answer with source citations |
| **PARTIAL** | 40 – 75 % | Answer with a confidence warning |
| **LOW** | < 40 % | Declines to answer; shows raw retrieved chunks |

---

## Tech stack

| Layer | Technology |
|---|---|
| API | FastAPI + uvicorn |
| LLM | Anthropic Claude (`claude-sonnet-4-5`) |
| Embeddings | `sentence-transformers` — `all-MiniLM-L6-v2` (local, no API key) |
| Vector DB | ChromaDB (persistent, cosine similarity) |
| Parsers | pypdf · python-docx · Google Drive API · plain text |
| Frontend | React 18 + Vite + Tailwind CSS |
| Auth | API key middleware (swap to OAuth in one file) |
| Containers | Docker + docker-compose |

---

## Quick start (Docker)

**Prerequisites:** Docker Desktop installed and running.

```bash
# 1. Clone the repo
git clone <repo-url>
cd your-senior

# 2. Create your environment file
cp backend/.env.example backend/.env
# Fill in ANTHROPIC_API_KEY and YOUR_SENIOR_API_KEY in backend/.env

# 3. Build and start both services
docker compose up --build

# Backend:  http://localhost:8000
# Frontend: http://localhost:3000
# API docs: http://localhost:8000/docs
```

ChromaDB data is stored in a named Docker volume (`chromadb_data`) and survives container restarts.

To stop: `docker compose down`
To wipe the vector store too: `docker compose down -v`

---

## Local development (no Docker)

### Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux

pip install -r requirements.txt

cp .env.example .env
# Fill in ANTHROPIC_API_KEY and YOUR_SENIOR_API_KEY

uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

The frontend reads `VITE_API_URL` (defaults to `http://localhost:8000`) and `VITE_API_KEY` from a `.env` file in the `frontend/` directory. Create one if you need to override:

```
VITE_API_URL=http://localhost:8000
VITE_API_KEY=yoursenior-sai-2025
```

---

## Ingesting documents

### Option A — File upload (no Google Drive needed)

```bash
curl -X POST http://localhost:8000/ingest/upload \
  -H "X-API-Key: yoursenior-sai-2025" \
  -F "file=@/path/to/document.pdf"
```

Accepts `.pdf`, `.docx`, `.txt`. Max 50 MB. Re-uploading the same filename replaces its previous chunks cleanly.

### Option B — Raw text via JSON

```bash
curl -X POST http://localhost:8000/ingest/text \
  -H "X-API-Key: yoursenior-sai-2025" \
  -H "Content-Type: application/json" \
  -d '{"text": "Your content here...", "filename": "my-doc.txt"}'
```

### Option C — Google Drive sync

```bash
# Place your service account JSON at backend/secrets/service-account.json
# Set GOOGLE_DRIVE_FOLDER_ID in backend/.env

curl -X POST http://localhost:8000/ingest/drive \
  -H "X-API-Key: yoursenior-sai-2025" \
  -H "Content-Type: application/json" \
  -d '{"folder_id": "your-google-drive-folder-id"}'

# Poll for status
curl http://localhost:8000/ingest/status/<job_id> \
  -H "X-API-Key: yoursenior-sai-2025"
```

### Bulk ingest script

```bash
# Put wipro.txt, google.txt, amazon.txt in the project root, then:
cd backend
python ingest_companies.py
```

---

## API reference

All endpoints (except `/health`, `/docs`, `/redoc`) require the `X-API-Key` header.

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check — no auth required |
| `POST` | `/query` | Ask a question |
| `POST` | `/ingest/upload` | Upload a PDF / DOCX / TXT file |
| `POST` | `/ingest/text` | Ingest raw text as JSON |
| `POST` | `/ingest/drive` | Start a Google Drive sync job |
| `GET` | `/ingest/status/{job_id}` | Poll a Drive sync job |
| `GET` | `/admin/documents` | List all indexed documents |
| `DELETE` | `/admin/documents/{doc_id}` | Delete a document's chunks |
| `POST` | `/admin/documents/{doc_id}/reindex` | Re-ingest a document |
| `GET` | `/admin/query-log` | Last 50 queries |
| `GET` | `/admin/system-health` | ChromaDB stats + uptime |

Full interactive docs: `http://localhost:8000/docs`

### Example: ask a question

```bash
curl -X POST http://localhost:8000/query \
  -H "X-API-Key: yoursenior-sai-2025" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is Wipro's revenue for FY2024?"}'
```

Response:

```json
{
  "answer": "Wipro reported revenue of ...",
  "confidence": 0.82,
  "confidence_level": "HIGH",
  "sources": [
    {
      "content": "...",
      "metadata": { "source_file": "wipro.txt", "chunk_index": 3 }
    }
  ]
}
```

---

## Environment variables

All variables live in `backend/.env`. See `backend/.env.example` for the full list.

| Variable | Required | Description |
|---|---|---|
| `YOUR_SENIOR_API_KEY` | Yes | Shared secret for all API requests |
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `CLAUDE_MODEL` | No | Defaults to `claude-sonnet-4-5` |
| `CHROMA_PERSIST_DIR` | No | Where ChromaDB stores data (default `./chromadb_store`) |
| `CONFIDENCE_HIGH` | No | High-confidence threshold (default `0.75`) |
| `CONFIDENCE_LOW` | No | Low-confidence threshold (default `0.40`) |
| `TOP_K_CHUNKS` | No | Chunks retrieved per query (default `5`) |
| `MAX_CHUNK_TOKENS` | No | Max tokens per chunk (default `512`) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Drive only | Path to service account JSON |
| `GOOGLE_DRIVE_FOLDER_ID` | Drive only | Drive folder to sync from |

---

## Deploy to Railway

Railway runs each service from its own Dockerfile. No changes needed — the files are already there.

1. Create a new Railway project and add two services: `backend` and `frontend`.
2. Point each service at the correct subdirectory (`./backend` and `./frontend`).
3. Set environment variables for the backend service in Railway's dashboard (same as `.env`).
4. For the frontend, set these Railway build variables:
   ```
   VITE_API_URL=https://your-backend.railway.app
   VITE_API_KEY=<your key>
   ```
5. Add a Railway volume mounted at `/app/chromadb_store` for the backend to persist ChromaDB data.

---

## Project structure

```
your-senior/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, middleware, router registration
│   │   ├── config.py            # pydantic-settings: all env vars in one place
│   │   ├── middleware/
│   │   │   └── auth.py          # API key middleware (swap for OAuth here)
│   │   ├── routers/
│   │   │   ├── query.py         # POST /query
│   │   │   ├── ingest.py        # POST /ingest/*
│   │   │   ├── admin.py         # GET/DELETE /admin/*
│   │   │   └── health.py        # GET /health
│   │   ├── rag/
│   │   │   ├── engine.py        # Retrieve → Claude → confidence score
│   │   │   └── embedder.py      # sentence-transformers (all-MiniLM-L6-v2)
│   │   ├── ingestion/
│   │   │   ├── chunker.py       # Semantic chunking with sentence-split fallback
│   │   │   ├── pipeline.py      # Google Drive sync job runner
│   │   │   ├── registry.py      # Parser lookup by extension / MIME type
│   │   │   └── parsers/
│   │   │       ├── pdf.py
│   │   │       ├── docx.py
│   │   │       ├── gdoc.py
│   │   │       └── txt.py
│   │   ├── db/
│   │   │   └── chroma.py        # ChromaDB client + collection singleton
│   │   └── models/
│   │       └── schemas.py       # Pydantic request / response models
│   ├── secrets/                 # Google service account JSON (gitignored)
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   └── ingest_companies.py      # Bulk ingest helper script
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Chat.jsx         # Main chat interface
│   │   │   └── Admin.jsx        # Document manager + query log + health panel
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ChatMessage.jsx
│   │   │   ├── ConfidenceBadge.jsx
│   │   │   ├── SourceCard.jsx
│   │   │   ├── DocumentRow.jsx
│   │   │   ├── QueryLogTable.jsx
│   │   │   └── HealthPanel.jsx
│   │   └── api/
│   │       └── client.js        # Typed fetch wrapper for all API calls
│   ├── nginx.conf               # SPA routing + asset caching
│   ├── Dockerfile
│   └── tailwind.config.js       # navy + gold color families
│
├── docker-compose.yml
└── README.md
```
