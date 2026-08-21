import os
import json
import io
import logging

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from PIL import Image

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

logger = logging.getLogger("ad_generator")

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY was not found in environment variables")

logger.info("Using Gemini API key: %s...%s", api_key[:8], api_key[-4:])

client = genai.Client(
    api_key=api_key
)

app = FastAPI(
    title="AI Advertisement Generator",
    description="Generate advertisements from uploaded posters using Gemini AI",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    logger.info("Health check hit")
    return {
        "message": "AI Advertisement Generator API is running"
    }

@app.post("/api/analyze")
async def analyze_image(
    image: UploadFile = File(...),
    format: str = Form(...)
):
    logger.info("=== /api/analyze called ===")
    logger.info("Filename: %s", image.filename)
    logger.info("Content-Type: %s", image.content_type)
    logger.info("Requested format: %s", format)

    try:
        image_bytes = await image.read()

        logger.info("Image bytes read: %d bytes", len(image_bytes))

        if len(image_bytes) == 0:
            logger.error("Received empty image upload")
            return {"error": "The uploaded image is empty."}

        uploaded_image = Image.open(
            io.BytesIO(image_bytes)
        )

        logger.info(
            "Image opened: mode=%s size=%s format=%s",
            uploaded_image.mode,
            uploaded_image.size,
            uploaded_image.format
        )

        prompt = f"""
Analyze this advertisement poster and create content for a web advertisement.

The selected advertisement format is:

{format}

Return ONLY valid JSON using exactly this structure:

{{
    "primary_text": "A compelling primary advertisement text",
    "headline": "A catchy advertisement headline",
    "description": "A detailed promotional description in 3 to 4 sentences"
}}

Rules:

- Create content suitable for the selected advertisement format.
- Keep the headline short and catchy.
- Primary text should be engaging and suitable for the selected advertisement format.
- Keep the headline short, clear, and catchy.
- Description MUST contain exactly 3 to 4 complete sentences.
- Do not invent information that is not present or reasonably inferred from the poster.
- Clearly mention the main offer if one exists.
- CTA should be short.
- Do not invent information that is not present or reasonably inferred from the poster.
- Return ONLY JSON.
"""

        logger.info("Calling Gemini model: gemini-3.6-flash")

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=[
                uploaded_image,
                prompt
            ]
        )

        logger.info("Gemini response received")
        logger.info("Raw Gemini response text: %s", response.text[:500])

        result_text = response.text.strip()

        if result_text.startswith("```"):
            logger.info("Stripping markdown code fences from response")
            result_text = result_text.replace("```json", "")
            result_text = result_text.replace("```", "")
            result_text = result_text.strip()

        logger.info("Parsing JSON from response")
        ad_data = json.loads(result_text)

        logger.info("Successfully generated ad data: %s", json.dumps(ad_data, indent=2))

        return ad_data

    except json.JSONDecodeError:
        logger.exception("Gemini returned an invalid JSON response")
        return {
            "error": "Gemini returned an invalid JSON response.",
            "raw_response": response.text
        }

    except Exception as e:
        logger.exception("Error during advertisement generation")
        return {
            "error": str(e)
        }