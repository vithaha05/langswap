from __future__ import annotations

import asyncio
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.groq_service import generate_tutor_reply

router = APIRouter()


class RespondBody(BaseModel):
    text: str = ""
    language: str = "french"
    difficulty: str = "beginner"
    history: List[Dict[str, Any]] = Field(default_factory=list)


@router.post("/respond")
async def respond(body: RespondBody):
    try:
        return generate_tutor_reply(
            text=body.text,
            language=body.language,
            difficulty=body.difficulty,
            history=body.history,
        )
    except Exception as e:
        msg = str(e)
        if "429" in msg or "rate" in msg.lower():
            await asyncio.sleep(2)
            try:
                return generate_tutor_reply(
                    text=body.text,
                    language=body.language,
                    difficulty=body.difficulty,
                    history=body.history,
                )
            except Exception as e2:
                raise HTTPException(status_code=429, detail=f"Groq rate limited: {e2}")
        if "GROQ_API_KEY" in msg:
            raise HTTPException(status_code=500, detail=msg)
        raise HTTPException(status_code=500, detail=f"Groq request failed: {e}")

