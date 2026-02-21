"""PDF processing utilities — convert PDF pages to images."""

import logging
from typing import List, Optional

logger = logging.getLogger(__name__)


def pdf_to_images(pdf_path: str, dpi: int = 300) -> List[str]:
    """
    Convert a PDF file to a list of image file paths (one per page).

    Requires poppler-utils to be installed on the system.
    In production, use: pdf2image.convert_from_path()

    Returns:
        List of file paths to generated page images.
    """
    try:
        from pdf2image import convert_from_path

        images = convert_from_path(pdf_path, dpi=dpi)
        image_paths = []
        for i, img in enumerate(images):
            img_path = pdf_path.replace(".pdf", f"_page_{i + 1}.png")
            img.save(img_path, "PNG")
            image_paths.append(img_path)
            logger.info(f"Extracted page {i + 1} → {img_path}")
        return image_paths
    except ImportError:
        logger.warning("pdf2image not installed. Returning empty list.")
        return []
    except Exception as e:
        logger.error(f"PDF conversion failed: {e}")
        return []


def get_page_count(pdf_path: str) -> int:
    """Get the number of pages in a PDF file."""
    try:
        from pdf2image import pdfinfo_from_path

        info = pdfinfo_from_path(pdf_path)
        return info.get("Pages", 0)
    except Exception:
        return 0
