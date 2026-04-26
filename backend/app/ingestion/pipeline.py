import uuid
from datetime import datetime, timezone

from app.config import get_settings
from app.db.chroma import get_collection
from app.ingestion.chunker import chunk_document
from app.ingestion.gdrive import download_file, list_drive_files
from app.ingestion.registry import get_parser
from app.rag.embedder import embed_texts

# In-memory job store — sufficient for MVP, swap for Redis/DB in production
_jobs: dict[str, dict] = {}


def get_job_status(job_id: str) -> dict | None:
    return _jobs.get(job_id)


async def run_ingestion_job(job_id: str, folder_id: str | None = None) -> None:
    settings = get_settings()
    _jobs[job_id] = {
        "status": "running",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "documents_found": 0,
        "chunks_created": 0,
    }

    try:
        target_folder = folder_id or settings.google_drive_folder_id or None
        files = await list_drive_files(settings.google_service_account_json, target_folder)
        _jobs[job_id]["documents_found"] = len(files)

        collection = get_collection()
        total_chunks = 0

        for file_meta in files:
            file_id = file_meta["id"]
            filename = file_meta["name"]
            mime_type = file_meta.get("mimeType", "")
            owner = file_meta.get("owners", [{}])[0].get("displayName")

            parser = get_parser(filename, mime_type)
            if not parser:
                continue

            content = await download_file(
                settings.google_service_account_json, file_id, mime_type
            )
            parsed = await parser.parse(content, filename, author=owner)

            # Stable doc_id derived from the Drive file ID — survives re-ingestion
            doc_id = str(uuid.uuid5(uuid.NAMESPACE_URL, file_id))
            chunks = chunk_document(
                parsed, doc_id, settings.max_chunk_tokens, settings.chunk_overlap_tokens
            )

            if not chunks:
                continue

            # Remove stale chunks before re-inserting (idempotent re-index)
            try:
                existing = collection.get(where={"doc_id": doc_id})
                if existing["ids"]:
                    collection.delete(ids=existing["ids"])
            except Exception:
                pass

            texts = [c.content for c in chunks]
            embeddings = await embed_texts(texts)

            collection.add(
                ids=[c.chunk_id for c in chunks],
                documents=texts,
                embeddings=embeddings,
                metadatas=[c.metadata for c in chunks],
            )
            total_chunks += len(chunks)
            _jobs[job_id]["chunks_created"] = total_chunks

        _jobs[job_id].update(
            {
                "status": "completed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    except Exception as exc:
        _jobs[job_id].update(
            {
                "status": "failed",
                "error": str(exc),
                "completed_at": datetime.now(timezone.utc).isoformat(),
            }
        )
