from app.ingestion.parsers.base import BaseParser, ParsedDocument


class TXTParser(BaseParser):
    @classmethod
    def can_parse(cls, filename: str, mime_type: str = "") -> bool:
        return filename.lower().endswith(".txt") or mime_type == "text/plain"

    async def parse(self, content: bytes, filename: str, **kwargs) -> ParsedDocument:
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
