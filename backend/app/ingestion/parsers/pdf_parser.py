"""Parser for PDF files using pypdf."""

import io

from pypdf import PdfReader

from app.ingestion.parsers.base import BaseParser, ParsedDocument


class PDFParser(BaseParser):
    @classmethod
    def can_parse(cls, filename: str, mime_type: str = "") -> bool:
        """Return True for .pdf files or the PDF MIME type."""
        return filename.lower().endswith(".pdf") or mime_type == "application/pdf"

    async def parse(self, content: bytes, filename: str, **kwargs) -> ParsedDocument:
        """Extract text from each PDF page and split on blank lines into paragraphs."""
        reader = PdfReader(io.BytesIO(content))
        paragraphs: list[str] = []
        full_pages: list[str] = []

        for page in reader.pages:
            text = page.extract_text() or ""
            full_pages.append(text)
            for para in text.split("\n\n"):
                para = para.strip()
                if para:
                    paragraphs.append(para)

        author = None
        if reader.metadata:
            author = reader.metadata.get("/Author") or reader.metadata.get("Author")

        return ParsedDocument(
            raw_text="\n\n".join(full_pages),
            paragraphs=paragraphs,
            metadata={
                "filename": filename,
                "source_type": "pdf",
                "page_count": len(reader.pages),
                "author": author,
                "file_size_bytes": len(content),
            },
        )
