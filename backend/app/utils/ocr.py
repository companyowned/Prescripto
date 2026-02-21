"""OCR utility — stub for Azure AI Vision integration."""

import logging
from typing import Optional

logger = logging.getLogger(__name__)


class OCRResult:
    """Container for OCR extraction results."""

    def __init__(
        self,
        text_segments: list[str],
        confidence_scores: list[float],
        low_confidence_flags: list[bool],
    ):
        self.text_segments = text_segments
        self.confidence_scores = confidence_scores
        self.low_confidence_flags = low_confidence_flags

    @property
    def full_text(self) -> str:
        return " ".join(self.text_segments)

    @property
    def average_confidence(self) -> float:
        if not self.confidence_scores:
            return 0.0
        return sum(self.confidence_scores) / len(self.confidence_scores)


async def extract_text_from_image(file_path: str) -> OCRResult:
    """
    Extract text from an image using OCR.

    STUB: In production, this calls Azure AI Vision API.
    Currently returns mock data for development.
    """
    logger.info(f"[OCR STUB] Extracting text from: {file_path}")

    # Mock response for development
    return OCRResult(
        text_segments=[
            "Dr. Ahmed Hassan",
            "Cairo Medical Center",
            "Patient: John Doe",
            "Diagnosis: Upper respiratory infection",
            "Rx: Amoxicillin 500mg",
            "Take 1 capsule 3 times daily for 7 days",
            "Rx: Ibuprofen 400mg",
            "Take 1 tablet as needed for pain",
        ],
        confidence_scores=[0.95, 0.92, 0.88, 0.85, 0.90, 0.87, 0.91, 0.86],
        low_confidence_flags=[False, False, False, False, False, False, False, False],
    )


async def extract_text_from_azure(
    file_path: str, endpoint: str, api_key: str
) -> OCRResult:
    """
    Production OCR using Azure AI Vision.

    Requires AZURE_VISION_ENDPOINT and AZURE_VISION_KEY in settings.
    """
    import httpx

    with open(file_path, "rb") as f:
        image_data = f.read()

    headers = {
        "Ocp-Apim-Subscription-Key": api_key,
        "Content-Type": "application/octet-stream",
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{endpoint}/vision/v3.2/read/analyze",
            headers=headers,
            content=image_data,
            timeout=30.0,
        )
        response.raise_for_status()

        # Poll for results
        operation_url = response.headers.get("Operation-Location")
        if not operation_url:
            raise Exception("No operation URL returned from Azure Vision")

        import asyncio
        for _ in range(30):  # Max 30 seconds polling
            await asyncio.sleep(1)
            result_response = await client.get(
                operation_url,
                headers={"Ocp-Apim-Subscription-Key": api_key},
            )
            result = result_response.json()
            if result.get("status") == "succeeded":
                # Parse results
                segments = []
                scores = []
                flags = []
                for page in result.get("analyzeResult", {}).get("readResults", []):
                    for line in page.get("lines", []):
                        text = line.get("text", "")
                        confidence = line.get("confidence", 0.0)
                        segments.append(text)
                        scores.append(confidence)
                        flags.append(confidence < 0.7)
                return OCRResult(segments, scores, flags)
            elif result.get("status") == "failed":
                raise Exception("Azure Vision OCR failed")

        raise Exception("Azure Vision OCR timed out")
