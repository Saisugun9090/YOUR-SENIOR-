from google import genai
from app.config import get_settings
settings = get_settings()
client = genai.Client(api_key=settings.google_api_key)
for m in client.models.list():
    if 'embed' in m.name.lower():
        print(m.name)
