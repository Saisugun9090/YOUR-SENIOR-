from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class ParsedDocument:
    raw_text: str
    paragraphs: list[str]      # natural splits used by the semantic chunker
    metadata: dict = field(default_factory=dict)
    # expected metadata keys:
    #   filename, source_type, page_count, author, file_size_bytes


class BaseParser(ABC):
    @classmethod
    @abstractmethod
    def can_parse(cls, filename: str, mime_type: str = "") -> bool:
        """Return True if this parser handles the given filename / MIME type."""

    @abstractmethod
    async def parse(self, content: bytes, filename: str, **kwargs) -> ParsedDocument:
        """Parse raw file bytes and return a structured ParsedDocument."""
