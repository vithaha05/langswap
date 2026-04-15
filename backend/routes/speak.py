from __future__ import annotations

import os
import tempfile
import uuid

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services.tts_service import synthesize_mp3_bytes

router = APIRouter()

MEDIA_DIR = os.path.join(tempfile.gettempdir(), "langswap_media")
os.makedirs(MEDIA_DIR, exist_ok=True)


class SpeakBody(BaseModel):
    text: str
    language: str = "french"


@router.post("/speak")
async def speak(body: SpeakBody):
    try:
        mp3 = await synthesize_mp3_bytes(body.text, body.language)
        if not mp3:
            raise HTTPException(status_code=400, detail="No text to synthesize")
        audio_id = uuid.uuid4().hex
        path = os.path.join(MEDIA_DIR, f"{audio_id}.mp3")
        with open(path, "wb") as f:
            f.write(mp3)

        resp = StreamingResponse(iter([mp3]), media_type="audio/mpeg")
        resp.headers["X-Audio-Id"] = audio_id
        return resp
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS failed: {e}")

