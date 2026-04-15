from __future__ import annotations

import json
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session as OrmSession

from db.database import get_db
from db.models import Session as DbSession

router = APIRouter()


class CreateSessionBody(BaseModel):
    language: str = "french"
    difficulty: str = "beginner"


class UpdateSessionBody(BaseModel):
    language: Optional[str] = None
    difficulty: Optional[str] = None
    messages: List[Dict[str, Any]] = Field(default_factory=list)
    score: Optional[int] = None
    corrected_delta: int = 0


@router.post("/session")
def create_session(body: CreateSessionBody, db: OrmSession = Depends(get_db)):
    session_id = uuid.uuid4().hex
    s = DbSession(
        session_id=session_id,
        language=body.language,
        difficulty=body.difficulty,
        messages_json="[]",
        created_at=datetime.utcnow(),
        score=0,
        corrected_count=0,
    )
    db.add(s)
    db.commit()
    return {"session_id": session_id}


@router.post("/session/{session_id}")
def update_session(
    session_id: str, body: UpdateSessionBody, db: OrmSession = Depends(get_db)
):
    s = db.get(DbSession, session_id)
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")

    if body.language:
        s.language = body.language
    if body.difficulty:
        s.difficulty = body.difficulty

    if body.messages is not None:
        s.messages_json = json.dumps(body.messages)

    if body.score is not None:
        s.score = body.score

    if body.corrected_delta:
        s.corrected_count = int(s.corrected_count or 0) + int(body.corrected_delta)

    db.add(s)
    db.commit()
    return {"ok": True}


@router.get("/session/{session_id}")
def get_session(session_id: str, db: OrmSession = Depends(get_db)):
    s = db.get(DbSession, session_id)
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    try:
        messages = json.loads(s.messages_json or "[]")
    except Exception:
        messages = []
    return {
        "session_id": s.session_id,
        "language": s.language,
        "difficulty": s.difficulty,
        "messages": messages,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "score": s.score,
        "corrected_count": s.corrected_count,
        "message_count": len(messages),
    }

