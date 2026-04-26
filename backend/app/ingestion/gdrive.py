import asyncio
import io

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

_SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

# Google Docs exports to plain text; other types are downloaded directly
_EXPORT_MAP: dict[str, str] = {
    "application/vnd.google-apps.document": "text/plain",
}

SUPPORTED_MIME_TYPES = frozenset(
    {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "application/vnd.google-apps.document",
    }
)


def _build_service(service_account_path: str):
    creds = service_account.Credentials.from_service_account_file(
        service_account_path, scopes=_SCOPES
    )
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def _list_files_sync(service_account_path: str, folder_id: str | None) -> list[dict]:
    service = _build_service(service_account_path)
    conditions = ["trashed = false", "mimeType != 'application/vnd.google-apps.folder'"]
    if folder_id:
        conditions.append(f"'{folder_id}' in parents")

    query = " and ".join(conditions)
    files: list[dict] = []
    page_token = None

    while True:
        resp = service.files().list(
            q=query,
            spaces="drive",
            fields="nextPageToken, files(id, name, mimeType, size, owners)",
            pageToken=page_token,
        ).execute()
        files.extend(resp.get("files", []))
        page_token = resp.get("nextPageToken")
        if not page_token:
            break

    return [f for f in files if f.get("mimeType") in SUPPORTED_MIME_TYPES]


def _download_file_sync(service_account_path: str, file_id: str, mime_type: str) -> bytes:
    service = _build_service(service_account_path)
    export_mime = _EXPORT_MAP.get(mime_type)

    if export_mime:
        request = service.files().export_media(fileId=file_id, mimeType=export_mime)
    else:
        request = service.files().get_media(fileId=file_id)

    buf = io.BytesIO()
    downloader = MediaIoBaseDownload(buf, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()

    return buf.getvalue()


async def list_drive_files(service_account_path: str, folder_id: str | None = None) -> list[dict]:
    return await asyncio.to_thread(_list_files_sync, service_account_path, folder_id)


async def download_file(service_account_path: str, file_id: str, mime_type: str) -> bytes:
    return await asyncio.to_thread(_download_file_sync, service_account_path, file_id, mime_type)
