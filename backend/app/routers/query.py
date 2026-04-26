from fastapi import APIRouter, HTTPException, status

from app.models.schemas import QueryRequest, QueryResponse
from app.rag.engine import answer_question

router = APIRouter(prefix="/query", tags=["Query"])


@router.post("", response_model=QueryResponse)
async def query(request: QueryRequest):
    """
    Ask Your Senior a question. Returns an answer, confidence score,
    confidence tier (high / partial / low), and cited source chunks.
    """
    try:
        return await answer_question(request.question, request.top_k)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Your Senior encountered an error: {str(exc)}",
        )
