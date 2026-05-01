"""n8n workflow API client."""

import logging
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class N8nClient:
    """Client for interacting with an n8n webhook workflow."""

    def __init__(
        self,
        webhook_url: Optional[str] = None,
        auth_key: Optional[str] = None,
    ):
        self.webhook_url = webhook_url or settings.N8N_WEBHOOK_URL
        self.auth_key = auth_key or settings.N8N_AUTH_KEY

    async def run_workflow(
        self,
        file_path: Optional[str] = None,
        text_input: Optional[str] = None,
        extra_data: Optional[dict] = None,
    ) -> dict:
        """
        Execute an n8n workflow and return the JSON output.

        Args:
            file_path: Path to the file to process
            text_input: Alternative text input (for text trigger)
            extra_data: Additional fields to send to the webhook
        """
        if not self.webhook_url:
            logger.warning("[STUB MODE] No n8n webhook URL configured — returning mock output")
            return self._mock_output()

        try:
            # Add custom header auth if key is configured
            headers = {"Accept": "application/json"}
            if self.auth_key:
                headers["Authorization"] = f"Bearer {self.auth_key}"

            # Prepare request based on input type
            async with httpx.AsyncClient(timeout=120.0) as client:
                if file_path:
                    with open(file_path, "rb") as f:
                        # Send as "data" so n8n OCR node finds it in the binary 'data' field
                        files = {"data": f}
                        data = extra_data or {}
                        response = await client.post(
                            self.webhook_url,
                            headers=headers,
                            files=files,
                            data=data,
                        )
                elif text_input:
                    payload = {"input": text_input, **(extra_data or {})}
                    response = await client.post(
                        self.webhook_url,
                        headers=headers,
                        json=payload,
                    )
                else:
                    raise ValueError("Either file_path or text_input must be provided")

            response.raise_for_status()

            # --- DEBUG LOGGING ---
            print("\n" + "="*50)
            print("🚀 RAW RESPONSE FROM N8N WEBHOOK:")
            print(f"Status Code: {response.status_code}")
            print(f"Headers: {dict(response.headers)}")
            print(f"Body: '{response.text}'")
            print("="*50 + "\n")
            # ---------------------
            
            try:
                # n8n often returns nested structures depending on your webhook config,
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    result = result[0]
                logger.info("n8n workflow completed successfully.")
                return result
            except Exception as e:
                logger.warning(f"Could not parse n8n response as JSON. Returning mock data.")
                return self._mock_output()

        except httpx.HTTPStatusError as e:
            logger.error(f"n8n API error: {e.response.status_code} — {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"n8n workflow failed: {e}")
            raise

    @staticmethod
    def _mock_output() -> dict:
        """Return mock workflow output for development without a webhook."""
        return {
            "doctor": {"name": "Dr. Ahmed Hassan"},
            "facility": {"name": "Cairo Medical Center"},
            "diagnosis": "Upper respiratory infection",
            "medications": [
                {
                    "name": "Amoxicillin",
                    "dose": "500mg",
                    "frequency": "3 times daily",
                    "duration": "7 days",
                }
            ],
            "follow_up_requests": [
                {
                    "kind": "lab",
                    "name": "CBC",
                    "instructions": "Upload the completed lab result PDF or scan the result page.",
                    "confidence": 0.89,
                },
                {
                    "kind": "radiology",
                    "name": "Chest X-ray",
                    "instructions": "Upload the finalized radiology report when it is available.",
                    "confidence": 0.82,
                },
            ],
            "confidence": {"overall": 0.87},
        }
