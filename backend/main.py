from __future__ import annotations

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.database import Base, engine
from routes import avatar, media, respond, session, speak, transcribe

load_dotenv()

app = FastAPI(title="LangSwap API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(transcribe.router)
app.include_router(respond.router)
app.include_router(speak.router)
app.include_router(media.router)
app.include_router(avatar.router)
app.include_router(session.router)

