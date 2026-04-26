"""Parser for plain-text (.txt) files."""

from app.ingestion.parsers.base import BaseParser, ParsedDocument


class TXTParser(BaseParser):
    @classmethod
    def can_parse(cls, filename: str, mime_type: str = "") -> bool:
        """Return True for .txt files or the text/plain MIME type."""
        return filename.lower().endswith(".txt") or mime_type == "text/plain"

    async def parse(self, content: bytes, filename: str, **kwargs) -> ParsedDocument:
        """Decode UTF-8 bytes and split on double newlines into paragraphs."""
        text = content.decode("utf-8", errors="replace")
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]

        return ParsedDocument(
            raw_text=text,
            paragraphs=paragraphs,
            metadata={
                "filename": filename,
                "source_type": "txt",
                "page_count": None,
                "author": None,
                "file_size_bytes": len(content),
            },
        )
