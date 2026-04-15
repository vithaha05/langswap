from __future__ import annotations

import asyncio
import tempfile
from typing import Literal

import aiofiles
import edge_tts


VOICE_BY_LANGUAGE = {
    "french": "fr-FR-DeniseNeural",
    "spanish": "es-ES-ElviraNeural",
    "japanese": "ja-JP-NanamiNeural",
}


async def synthesize_mp3_bytes(text: str, language: str) -> bytes:
    t = (text or "").strip()
    if not t:
        return b""

    voice = VOICE_BY_LANGUAGE.get((language or "").lower(), VOICE_BY_LANGUAGE["french"])

    communicate = edge_tts.Communicate(text=t, voice=voice)
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=True) as f:
        async with aiofiles.open(f.name, "wb") as out:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    await out.write(chunk["data"])

        async with aiofiles.open(f.name, "rb") as inp:
            return await inp.read()

