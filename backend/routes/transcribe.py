from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile

from services.whisper_service import transcribe_audio_bytes

router = APIRouter()


@router.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    try:
        data = await audio.read()
        text, language = transcribe_audio_bytes(data)
        return {"text": text, "language": language}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Whisper transcription failed: {e}")

