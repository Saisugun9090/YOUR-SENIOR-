from app.ingestion.parsers.base import BaseParser, ParsedDocument

_GDOC_MIME = "application/vnd.google-apps.document"


class GDocsParser(BaseParser):
    """
    Parses Google Docs content that has already been exported as plain text
    by the Google Drive module. Does not call the Drive API itself.
    """

    @classmethod
    def can_parse(cls, filename: str, mime_type: str = "") -> bool:
        return mime_type == _GDOC_MIME

    async def parse(self, content: bytes, filename: str, **kwargs) -> ParsedDocument:
        text = content.decode("utf-8", errors="replace")
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        author = kwargs.get("author")

        return ParsedDocument(
            raw_text=text,
            paragraphs=paragraphs,
            metadata={
                "filename": filename,
                "source_type": "gdoc",
                "page_count": None,
                "author": author,
                "file_size_bytes": len(content),
            },
        )
