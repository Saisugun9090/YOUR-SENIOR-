"""Parser registry: maps filenames and MIME types to the correct parser class."""

from app.ingestion.parsers.base import BaseParser
from app.ingestion.parsers.docx_parser import DOCXParser
from app.ingestion.parsers.gdocs_parser import GDocsParser
from app.ingestion.parsers.pdf_parser import PDFParser
from app.ingestion.parsers.txt_parser import TXTParser

# Ordered list — first matching parser wins.
_PARSERS: list[type[BaseParser]] = [
    PDFParser,
    DOCXParser,
    GDocsParser,
    TXTParser,
]


def get_parser(filename: str, mime_type: str = "") -> BaseParser | None:
    """Return an instantiated parser for the given filename/MIME type, or None if unsupported."""
    for parser_class in _PARSERS:
        if parser_class.can_parse(filename, mime_type):
            return parser_class()
    return None


def register_parser(parser_class: type[BaseParser]) -> None:
    """Add a custom parser at runtime without modifying core code."""
    _PARSERS.append(parser_class)
