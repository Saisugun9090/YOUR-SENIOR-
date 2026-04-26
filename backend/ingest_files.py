import requests
from pathlib import Path

API_URL = "http://localhost:8000/ingest/text"
API_KEY = "yoursenior-sai-2025"

ROOT = Path(__file__).parent.parent  # project root
FILES = ["wipro.txt", "google.txt", "amazon.txt"]

for filename in FILES:
    path = ROOT / filename
    text = path.read_text(encoding="utf-8")
    response = requests.post(
        API_URL,
        headers={"X-API-Key": API_KEY, "Content-Type": "application/json"},
        json={"text": text, "filename": filename},
        timeout=120,
    )
    data = response.json()
    print(f"{filename}: status={data.get('status')}  chunks_created={data.get('chunks_created')}")
