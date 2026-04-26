"""Abstract base classes for all document parsers."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class ParsedDocument:
    """Normalised representation of any parsed document."""

    raw_text: str
    paragraphs: list[str]   # natural paragraph splits consumed by the chunker
    metadata: dict = field(default_factory=dict)
    # Expected metadata keys:
    #   filename, source_type, page_count, author, file_size_bytes


class BaseParser(ABC):
    @classmethod
    @abstractmethod
    def can_parse(cls, filename: str, mime_type: str = "") -> bool:
        """Return True if this parser handles the given filename or MIME type."""

    @abstractmethod
    async def parse(self, content: bytes, filename: str, **kwargs) -> ParsedDocument:
        """Parse raw file bytes and return a structured ParsedDocument."""
