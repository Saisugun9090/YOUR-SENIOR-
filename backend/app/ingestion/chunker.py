"""Semantic document chunker: splits at heading/paragraph boundaries with sentence fallback."""

import re
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone

import tiktoken

from app.ingestion.parsers.base import ParsedDocument

_ENCODER = None


def _get_encoder():
    global _ENCODER
    if _ENCODER is None:
        _ENCODER = tiktoken.get_encoding("cl100k_base")
    return _ENCODER


def _count_tokens(text: str) -> int:
    return len(_get_encoder().encode(text))


def _is_heading(text: str) -> bool:
    """Heuristic: short lines without trailing punctuation are likely section headings."""
    text = text.strip()
    if not text or len(text) > 120:
        return False
    if len(text.split()) > 12:
        return False
    if text[-1] in ".,:;?!":
        return False
    if text.startswith("#"):          # Markdown heading
        return True
    if re.match(r"^(\d+\.)+\s", text):  # "1.2 Section Title"
        return True
    if text.isupper() and len(text.split()) <= 8:  # ALL CAPS TITLE
        return True
    return False


def _split_by_sentences(text: str, max_tokens: int, overlap_tokens: int) -> list[str]:
    """Split an oversized paragraph at sentence boundaries with token overlap."""
    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks: list[str] = []
    current: list[str] = []
    current_tokens = 0

    for sentence in sentences:
        s_tokens = _count_tokens(sentence)
        if current_tokens + s_tokens > max_tokens and current:
            chunks.append(" ".join(current))
            # Carry overlap: walk back until we have ~overlap_tokens worth
            overlap: list[str] = []
            carried = 0
            for s in reversed(current):
                carried += _count_tokens(s)
                overlap.insert(0, s)
                if carried >= overlap_tokens:
                    break
            current = overlap
            current_tokens = sum(_count_tokens(s) for s in current)

        current.append(sentence)
        current_tokens += s_tokens

    if current:
        chunks.append(" ".join(current))

    return [c for c in chunks if c.strip()]


@dataclass
class Chunk:
    chunk_id: str
    content: str
    doc_id: str
    metadata: dict = field(default_factory=dict)


def chunk_document(
    parsed_doc: ParsedDocument,
    doc_id: str,
    max_tokens: int,
    overlap_tokens: int,
) -> list[Chunk]:
    date_ingested = datetime.now(timezone.utc).isoformat()
    base_meta = {
        "source_file": parsed_doc.metadata.get("filename", "unknown"),
        "source_type": parsed_doc.metadata.get("source_type", "unknown"),
        "author": parsed_doc.metadata.get("author") or "",
        "date_ingested": date_ingested,
        "doc_id": doc_id,
        "file_size_bytes": parsed_doc.metadata.get("file_size_bytes") or 0,
    }

    chunks: list[Chunk] = []
    current_paras: list[str] = []
    current_tokens = 0
    current_heading: str | None = None
    chunk_index = 0

    def flush() -> None:
        nonlocal chunk_index
        if not current_paras:
            return
        chunks.append(
            Chunk(
                chunk_id=str(uuid.uuid4()),
                content="\n\n".join(current_paras),
                doc_id=doc_id,
                metadata={
                    **base_meta,
                    "section_heading": current_heading or "",
                    "chunk_index": chunk_index,
                    "page_number": 0,
                },
            )
        )
        chunk_index += 1

    for para in parsed_doc.paragraphs:
        para = para.strip()
        if not para:
            continue

        if _is_heading(para):
            flush()
            current_paras.clear()
            current_tokens = 0
            current_heading = para
            continue

        para_tokens = _count_tokens(para)

        if para_tokens > max_tokens:
            # Single paragraph too large — flush pending, split by sentences
            flush()
            current_paras.clear()
            current_tokens = 0
            for sub in _split_by_sentences(para, max_tokens, overlap_tokens):
                chunks.append(
                    Chunk(
                        chunk_id=str(uuid.uuid4()),
                        content=sub,
                        doc_id=doc_id,
                        metadata={
                            **base_meta,
                            "section_heading": current_heading or "",
                            "chunk_index": chunk_index,
                            "page_number": 0,
                        },
                    )
                )
                chunk_index += 1
            continue

        if current_tokens + para_tokens > max_tokens:
            flush()
            current_paras.clear()
            current_tokens = 0

        current_paras.append(para)
        current_tokens += para_tokens

    flush()
    return chunks
