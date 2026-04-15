from __future__ import annotations
import os
import tempfile
from typing import Tuple
import imageio_ffmpeg
import whisper

_MODEL = None
_MODEL_NAME = None

def _ensure_ffmpeg_on_path() -> None:
    """
    openai-whisper shells out to `ffmpeg`.
    If ffmpeg is not installed system-wide, use the binary bundled by imageio-ffmpeg.
    """
    # If ffmpeg already exists, do nothing.
    if _which_ffmpeg():
        return

    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    shim_dir = os.path.join(tempfile.gettempdir(), "langswap_bin")
    os.makedirs(shim_dir, exist_ok=True)
    shim_path = os.path.join(shim_dir, "ffmpeg")

    # whisper calls "ffmpeg" by name; create a small shim that forwards args.
    if not os.path.exists(shim_path):
        with open(shim_path, "w", encoding="utf-8") as f:
            f.write("#!/bin/sh\n")
            f.write(f"exec \"{ffmpeg_exe}\" \"$@\"\n")
        os.chmod(shim_path, 0o755)

    current_path = os.getenv("PATH", "")
    if shim_dir not in current_path.split(os.pathsep):
        os.environ["PATH"] = shim_dir + os.pathsep + current_path


def _which_ffmpeg() -> str | None:
    import shutil

    return shutil.which("ffmpeg")

def _get_model():
    global _MODEL, _MODEL_NAME
    name = os.getenv("WHISPER_MODEL", "base").strip() or "base"
    if _MODEL is None or _MODEL_NAME != name:
        _ensure_ffmpeg_on_path()
        _MODEL = whisper.load_model(name)
        _MODEL_NAME = name
    return _MODEL

def transcribe_audio_bytes(audio_bytes: bytes) -> Tuple[str, str]:
    if not audio_bytes:
        return "", ""
    _ensure_ffmpeg_on_path()
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
            f.write(audio_bytes)
            tmp_path = f.name
        model = _get_model()
        result = model.transcribe(tmp_path)
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
    text = (result.get("text") or "").strip()
    language = (result.get("language") or "").strip()
    return text, language
