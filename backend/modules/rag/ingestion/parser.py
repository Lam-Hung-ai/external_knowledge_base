from pathlib import Path

from docling.datamodel.base_models import InputFormat
from docling.document_converter import DocumentConverter
from docling_core.types.doc.document import DoclingDocument


ALLOWWED_FORMATS = [InputFormat.DCLX, InputFormat.PDF, InputFormat.MD, InputFormat.HTML]
converter = DocumentConverter(allowed_formats=ALLOWWED_FORMATS)


def parse(file_path: str | Path) -> DoclingDocument:
    file_path = Path(file_path)
    result = converter.convert(source=file_path)
    return result.document
