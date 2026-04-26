# Your Senior

[![Python](https://img.shields.io/badge/Python-3.11-3776ab?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ed?logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-c9a84c)](LICENSE)

An AI-powered RAG agent that reads your company's internal documents and answers questions like a trusted senior employee.

Upload PDFs, Word docs, Google Docs, or plain text files. Ask anything. Get cited, confidence-rated answers — or a clear "I don't know" when the data isn't there.

---

## Screenshot

> _Add a screenshot of the chat interface here._

![Your Senior chat interface](docs/screenshot.png)

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
# Open backend/.env and fill in ANTHROPIC_API_KEY and YOUR_SENIOR_API_KEY

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
python -m venv venv
source venv/bin/activate     # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env         # fill in ANTHROPIC_API_KEY and YOUR_SENIOR_API_KEY
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

The frontend reads `VITE_API_URL` (defaults to `http://localhost:8000`) and `VITE_API_KEY` from a `.env` file in the `frontend/` directory. Create one if you need to override:

```env
VITE_API_URL=http://localhost:8000
VITE_API_KEY=<your-api-key>
```

---

## Ingesting documents

### Option A — File upload (no Google Drive needed)

```bash
curl -X POST http://localhost:8000/ingest/upload \
  -H "X-API-Key: <your-api-key>" \
  -F "file=@/path/to/document.pdf"
```

Accepts `.pdf`, `.docx`, `.txt`. Max 50 MB. Re-uploading the same filename replaces its previous chunks cleanly.

### Option B — Raw text via JSON

```bash
curl -X POST http://localhost:8000/ingest/text \
  -H "X-API-Key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"text": "Your content here...", "filename": "my-doc.txt"}'
```

### Option C — Google Drive sync

```bash
# 1. Place your service account JSON at backend/secrets/service-account.json
# 2. Set GOOGLE_DRIVE_FOLDER_ID in backend/.env

curl -X POST http://localhost:8000/ingest/drive \
  -H "X-API-Key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"folder_id": "your-google-drive-folder-id"}'

# Poll for status
curl http://localhost:8000/ingest/status/<job_id> \
  -H "X-API-Key: <your-api-key>"
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

Full interactive docs at `http://localhost:8000/docs`.

### Example: ask a question

```bash
curl -X POST http://localhost:8000/query \
  -H "X-API-Key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is our parental leave policy?"}'
```

Response:

```json
{
  "answer": "The parental leave policy grants ...",
  "confidence_score": 0.82,
  "confidence_tier": "high",
  "sources": [
    {
      "source_file": "hr-handbook.pdf",
      "section_heading": "Leave Entitlements",
      "relevance_score": 0.91,
      "content": "..."
    }
  ]
}
```

---

## Environment variables

All variables live in `backend/.env`. See `backend/.env.example` for the full list with descriptions.

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
4. For the frontend service, set these build variables:
   ```
   VITE_API_URL=https://your-backend.up.railway.app
   VITE_API_KEY=<your-api-key>
   ```
5. Add a Railway volume mounted at `/app/chromadb_store` to persist ChromaDB data across deploys.

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
│   │   │   ├── retriever.py     # ChromaDB similarity search
│   │   │   └── embedder.py      # sentence-transformers (all-MiniLM-L6-v2)
│   │   ├── ingestion/
│   │   │   ├── chunker.py       # Semantic chunking with sentence-split fallback
│   │   │   ├── pipeline.py      # Google Drive sync job runner
│   │   │   ├── gdrive.py        # Google Drive API client
│   │   │   ├── registry.py      # Parser lookup by extension / MIME type
│   │   │   └── parsers/
│   │   │       ├── base.py      # BaseParser abstract class
│   │   │       ├── pdf_parser.py
│   │   │       ├── docx_parser.py
│   │   │       ├── gdocs_parser.py
│   │   │       └── txt_parser.py
│   │   ├── db/
│   │   │   └── chroma.py        # ChromaDB client + collection singleton
│   │   └── models/
│   │       └── schemas.py       # Pydantic request / response models
│   ├── secrets/                 # Google service account JSON (gitignored)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
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
│   ├── nginx.conf               # SPA routing + static asset caching
│   ├── Dockerfile
│   └── tailwind.config.js       # navy + gold colour families
│
├── docker-compose.yml
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, code conventions, and the PR process.

## License

[MIT](LICENSE) © 2026 Sai
