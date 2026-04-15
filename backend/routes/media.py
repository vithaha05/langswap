from __future__ import annotations

import os
import tempfile

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter()

MEDIA_DIR = os.path.join(tempfile.gettempdir(), "langswap_media")


@router.get("/media/{audio_id}.mp3")
def get_mp3(audio_id: str):
    path = os.path.join(MEDIA_DIR, f"{audio_id}.mp3")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Audio not found")
    return FileResponse(path, media_type="audio/mpeg")

