from __future__ import annotations

import os
import re
from typing import Any, Dict, List, Tuple

from groq import Groq

from prompts.tutor_prompts import build_system_prompt


EMOTION_RE = re.compile(r"\[emotion:\s*(encouraging|happy|thinking|neutral)\s*\]\s*$", re.I)
DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant"
FALLBACK_MODELS = [
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
]


def _parse_reply(text: str) -> Tuple[str, str]:
    raw = (text or "").strip()
    emotion = "neutral"
    m = EMOTION_RE.search(raw)
    if m:
        emotion = m.group(1).lower()
        raw = raw[: m.start()].rstrip()
    return raw, emotion


def _looks_corrected(reply: str) -> bool:
    r = (reply or "").lower()
    return any(k in r for k in ["correction", "correct:", "better:", "you should say", "instead of"])


def generate_tutor_reply(
    *,
    text: str,
    language: str,
    difficulty: str,
    history: List[Dict[str, Any]] | None,
) -> Dict[str, Any]:
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set")

    client = Groq(api_key=api_key)
    system = build_system_prompt(language, difficulty)

    messages: List[Dict[str, str]] = [{"role": "system", "content": system}]
    if history:
        for item in history[-20:]:
            role = (item.get("role") or "").strip()
            content = (item.get("content") or item.get("text") or "").strip()
            if role in {"user", "assistant"} and content:
                messages.append({"role": role, "content": content})

    user_text = (text or "").strip()
    if not user_text:
        user_text = "Introduce yourself briefly and ask a friendly question to begin."
    messages.append({"role": "user", "content": user_text})

    primary_model = os.getenv("GROQ_MODEL", DEFAULT_GROQ_MODEL).strip() or DEFAULT_GROQ_MODEL
    model_candidates = [primary_model, *[m for m in FALLBACK_MODELS if m != primary_model]]

    completion = None
    last_error: Exception | None = None
    for model_name in model_candidates:
        try:
            completion = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.7,
                max_tokens=250,
            )
            break
        except Exception as e:
            last_error = e
            msg = str(e).lower()
            if "decommissioned" in msg or "model" in msg:
                continue
            raise

    if completion is None:
        raise RuntimeError(f"No available Groq model succeeded: {last_error}")

    content = completion.choices[0].message.content or ""
    reply, emotion = _parse_reply(content)

    return {
        "reply": reply,
        "emotion": emotion,
        "corrected": _looks_corrected(reply),
    }

