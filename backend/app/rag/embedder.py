import asyncio

from sentence_transformers import SentenceTransformer

_model = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def _embed_one(text: str) -> list[float]:
    model = _get_model()
    embedding = model.encode(text, convert_to_tensor=False)
    return embedding.tolist()


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a list of document chunks for storage."""
    results = []
    for text in texts:
        embedding = await asyncio.to_thread(_embed_one, text)
        results.append(embedding)
    return results


async def embed_query(text: str) -> list[float]:
    """Embed a single user question for retrieval."""
    return await asyncio.to_thread(_embed_one, text)
