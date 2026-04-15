# LangSwap

Immersive AI language tutoring:

- Speak into your mic
- Whisper transcribes
- Groq LLM replies with an emotion tag
- edge-tts generates audio
- (Optional) D‑ID renders a lip-synced avatar video

## Local dev

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# create backend/.env from backend/.env.example
uvicorn main:app --reload --port 8000
```

Health check: `GET http://localhost:8000/health`

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Notes

- D‑ID requires a **publicly reachable** `audio_url`. For local dev, the backend returns `X-Audio-Id` from `/speak` and serves it at `/media/{audio_id}.mp3` so D‑ID can fetch it.
- If D‑ID credits are exhausted, `/avatar` returns `{"video_url": null}` and the UI falls back to audio-only.

