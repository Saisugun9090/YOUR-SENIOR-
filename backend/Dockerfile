FROM python:3.11-slim

WORKDIR /app

# libgomp1 is required by onnxruntime (pulled in by chromadb)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps as a separate layer so code changes don't re-install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the embedding model and tiktoken vocab so container starts instantly
RUN python -c "\
from sentence_transformers import SentenceTransformer; \
SentenceTransformer('all-MiniLM-L6-v2'); \
import tiktoken; \
tiktoken.get_encoding('cl100k_base')"

COPY app/ ./app/

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
