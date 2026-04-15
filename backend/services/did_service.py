from __future__ import annotations

import os
import time
from typing import Dict, Optional

import httpx


DEFAULT_PRESENTER_IMAGE = (
    "https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/v1/image.jpeg"
)

PRESENTER_BY_EMOTION = {
    "encouraging": DEFAULT_PRESENTER_IMAGE,
    "happy": DEFAULT_PRESENTER_IMAGE,
    "thinking": DEFAULT_PRESENTER_IMAGE,
    "neutral": DEFAULT_PRESENTER_IMAGE,
}


class DidCreditsExhausted(RuntimeError):
    pass


async def create_talk_and_wait(*, audio_url: str, emotion: str) -> str:
    api_key = os.getenv("DID_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("DID_API_KEY is not set")

    presenter = PRESENTER_BY_EMOTION.get((emotion or "neutral").lower(), DEFAULT_PRESENTER_IMAGE)

    headers = {
        "Authorization": f"Basic {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "source_url": presenter,
        "script": {
            "type": "audio",
            "audio_url": audio_url,
        },
        "config": {
            "stitch": True,
        },
    }

    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post("https://api.d-id.com/talks", headers=headers, json=payload)
        if r.status_code in {402, 403}:
            raise DidCreditsExhausted("D-ID credits exhausted or not authorized")
        if r.status_code >= 400:
            raise RuntimeError(f"D-ID create failed: {r.status_code} {r.text}")

        talk_id = r.json().get("id")
        if not talk_id:
            raise RuntimeError("D-ID did not return talk id")

        deadline = time.time() + 90
        while time.time() < deadline:
            g = await client.get(f"https://api.d-id.com/talks/{talk_id}", headers=headers)
            if g.status_code >= 400:
                raise RuntimeError(f"D-ID status failed: {g.status_code} {g.text}")
            data = g.json()
            status = (data.get("status") or "").lower()
            if status == "done":
                result_url = data.get("result_url")
                if not result_url:
                    raise RuntimeError("D-ID talk done but no result_url")
                return result_url
            if status in {"error", "rejected"}:
                raise RuntimeError(f"D-ID talk failed: {data}")
            await asyncio_sleep(1.5)

    raise RuntimeError("D-ID timeout waiting for video")


async def asyncio_sleep(seconds: float) -> None:
    import asyncio

    await asyncio.sleep(seconds)

