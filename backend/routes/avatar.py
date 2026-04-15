from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.did_service import DidCreditsExhausted, create_talk_and_wait

router = APIRouter()


class AvatarBody(BaseModel):
    audio_url: str
    emotion: str = "neutral"


@router.post("/avatar")
async def avatar(body: AvatarBody):
    try:
        video_url = await create_talk_and_wait(audio_url=body.audio_url, emotion=body.emotion)
        return {"video_url": video_url}
    except DidCreditsExhausted:
        return {"video_url": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"D-ID failed: {e}")

