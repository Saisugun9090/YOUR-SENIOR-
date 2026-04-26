"""Google Drive client: lists and downloads files using a service account."""

import asyncio
import io

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

_SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

# Google Docs must be exported as plain text; all other types are downloaded directly.
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
    """Build an authenticated Google Drive v3 service client."""
    creds = service_account.Credentials.from_service_account_file(
        service_account_path, scopes=_SCOPES
    )
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def _list_files_sync(service_account_path: str, folder_id: str | None) -> list[dict]:
    """Synchronously list all supported files in a Drive folder (handles pagination)."""
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
    """Synchronously download or export a single Drive file as bytes."""
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


async def list_drive_files(
    service_account_path: str, folder_id: str | None = None
) -> list[dict]:
    """Async wrapper: list supported files in a Drive folder."""
    return await asyncio.to_thread(_list_files_sync, service_account_path, folder_id)


async def download_file(
    service_account_path: str, file_id: str, mime_type: str
) -> bytes:
    """Async wrapper: download a Drive file by ID."""
    return await asyncio.to_thread(_download_file_sync, service_account_path, file_id, mime_type)
