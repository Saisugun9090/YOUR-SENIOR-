import requests
import os

headers = {
    "X-API-Key": "yoursenior-sai-2025",
    "Content-Type": "application/json"
}

files = ["wipro.txt", "google.txt", "amazon.txt"]

for filename in files:
    filepath = os.path.join("..", filename)
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            text = f.read()
        r = requests.post(
            "http://localhost:8000/ingest/text",
            headers=headers,
            json={"text": text, "filename": filename}
        )
        data = r.json()
        chunks = data.get("chunks_created", "ERROR")
        print(f"{filename}: {chunks} chunks ingested")
    except Exception as e:
        print(f"{filename}: FAILED - {str(e)}")

print("Done.")
