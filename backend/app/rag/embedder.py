"""Local text embedder using sentence-transformers (no external API required)."""

import asyncio

from sentence_transformers import SentenceTransformer

_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    """Return the shared embedding model, loading it on first call."""
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def _embed_one(text: str) -> list[float]:
    """Embed a single text string synchronously."""
    return _get_model().encode(text, convert_to_tensor=False).tolist()


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a batch of document chunks for storage in ChromaDB."""
    results = []
    for text in texts:
        embedding = await asyncio.to_thread(_embed_one, text)
        results.append(embedding)
    return results


async def embed_query(text: str) -> list[float]:
    """Embed a single user question for similarity search."""
    return await asyncio.to_thread(_embed_one, text)
