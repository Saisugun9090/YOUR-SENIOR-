import json
import uuid
from datetime import datetime, timezone

import anthropic

from app.config import get_settings
from app.models.schemas import ChunkSource, ConfidenceTier, QueryResponse
from app.rag.retriever import retrieve_chunks

# Lazy import to avoid circular dependency (admin router imports engine indirectly)
def _append_log(entry: dict) -> None:
    from app.routers.admin import append_query_log
    append_query_log(entry)


_SYSTEM_PROMPT = """\
You are "Your Senior" — the AI-powered knowledge assistant for this company's internal documents. \
You answer questions exactly as a trusted, experienced senior employee would: \
direct, specific, grounded in what is actually documented, and honest when you don't know.

RULES YOU NEVER BREAK:
1. Answer ONLY from the provided document context. Never fill gaps with your training knowledge.
2. If the context fully answers the question — give a complete, specific answer with citations.
3. If the context only partially answers — say clearly what you found and what is missing.
4. If the context does not answer the question — say so plainly. Do not guess or extrapolate.
5. Always state which document and section each piece of your answer comes from.
6. Rate your confidence honestly. A wrong confident answer destroys trust.

YOUR ENTIRE RESPONSE MUST BE VALID JSON in this exact structure (no markdown, no prose outside JSON):
{
  "answer": "Your complete answer in plain, clear language.",
  "confidence_score": 0.82,
  "reasoning": "One sentence: why you are or are not confident.",
  "cited_chunk_ids": ["chunk-uuid-1", "chunk-uuid-2"]
}

Confidence score guide:
  0.80 – 1.00  The context directly and completely answers the question.
  0.50 – 0.79  The context partially answers, or requires minor inference.
  0.00 – 0.49  The context barely touches the topic, or is unrelated.\
"""


def _build_context(chunks: list[ChunkSource]) -> str:
    parts = []
    for i, chunk in enumerate(chunks, start=1):
        heading = f" › {chunk.section_heading}" if chunk.section_heading else ""
        parts.append(
            f"[SOURCE {i}] {chunk.source_file}{heading}\n"
            f"Chunk ID: {chunk.chunk_id}\n"
            f"Author: {chunk.author or 'Unknown'}  |  Ingested: {chunk.date_ingested[:10]}\n\n"
            f"{chunk.content}"
        )
    return "\n\n---\n\n".join(parts)


def _tier(score: float, settings) -> ConfidenceTier:
    if score >= settings.confidence_high:
        return ConfidenceTier.HIGH
    if score >= settings.confidence_low:
        return ConfidenceTier.PARTIAL
    return ConfidenceTier.LOW


def _format_answer(raw_answer: str, tier: ConfidenceTier, reasoning: str) -> str:
    if tier == ConfidenceTier.HIGH:
        return raw_answer
    if tier == ConfidenceTier.PARTIAL:
        return (
            f"[ PARTIAL INFORMATION ]\n\n"
            f"{raw_answer}\n\n"
            f"Confidence note: {reasoning}"
        )
    return (
        f"[ INSUFFICIENT INFORMATION ]\n\n"
        f"I don't have a reliable answer for this in our documents.\n\n"
        f"{raw_answer}\n\n"
        f"The closest sources are shown below — please review them directly."
    )


async def answer_question(question: str, top_k: int | None = None) -> QueryResponse:
    settings = get_settings()
    effective_top_k = top_k or settings.top_k_chunks
    query_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    # ── Step 1: Retrieve relevant chunks ──────────────────────────────────────
    chunks, retrieval_score = await retrieve_chunks(question, effective_top_k)

    if not chunks:
        return QueryResponse(
            query_id=query_id,
            question=question,
            answer=(
                "Your Senior has no documents indexed yet. "
                "Go to the Admin dashboard and run an ingestion job first."
            ),
            confidence_score=0.0,
            confidence_tier=ConfidenceTier.LOW,
            sources=[],
            timestamp=now,
        )

    # ── Step 2: Ask Claude ─────────────────────────────────────────────────────
    context = _build_context(chunks)
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    message = await client.messages.create(
        model=settings.claude_model,
        max_tokens=1500,
        system=_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": (
                    f"DOCUMENT CONTEXT:\n\n{context}\n\n"
                    f"---\n\n"
                    f"QUESTION: {question}"
                ),
            }
        ],
    )

    # ── Step 3: Parse Claude's JSON response ───────────────────────────────────
    raw = message.content[0].text.strip()

    # Strip markdown code fences if Claude wraps the JSON
    if raw.startswith("```"):
        raw = raw[raw.index("{") :]
        raw = raw[: raw.rindex("}") + 1]

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        # Claude returned non-JSON — treat as low confidence plain-text answer
        parsed = {
            "answer": raw,
            "confidence_score": 0.3,
            "reasoning": "Response format error — treating as low confidence.",
            "cited_chunk_ids": [],
        }

    claude_score = max(0.0, min(1.0, float(parsed.get("confidence_score", 0.5))))
    reasoning = parsed.get("reasoning", "")
    cited_ids = set(parsed.get("cited_chunk_ids", []))

    # ── Step 4: Compute final confidence ──────────────────────────────────────
    # Claude self-assessment (65%) + retrieval signal (35%)
    # Claude knows whether the context actually answers the question;
    # retrieval score catches cases where Claude is overconfident on weak matches.
    final_score = round(0.65 * claude_score + 0.35 * retrieval_score, 4)
    tier = _tier(final_score, settings)

    # Show only cited chunks; fall back to all retrieved if Claude cited none
    cited_chunks = [c for c in chunks if c.chunk_id in cited_ids] or chunks
    answer = _format_answer(parsed.get("answer", ""), tier, reasoning)

    # ── Step 5: Log for admin dashboard ───────────────────────────────────────
    _append_log(
        {
            "query_id": query_id,
            "question": question,
            "confidence_score": final_score,
            "confidence_tier": tier.value,
            "chunks_retrieved": len(chunks),
            "timestamp": now.isoformat(),
        }
    )

    return QueryResponse(
        query_id=query_id,
        question=question,
        answer=answer,
        confidence_score=final_score,
        confidence_tier=tier,
        sources=cited_chunks,
        timestamp=now,
    )
