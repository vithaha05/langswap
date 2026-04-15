from __future__ import annotations

AVATAR_NAMES = {
    "french": "Sophie",
    "spanish": "Carlos",
    "japanese": "Hana",
}


def _difficulty_instructions(difficulty: str) -> str:
    d = (difficulty or "beginner").lower()
    if d == "beginner":
        return (
            "Use simple vocabulary and short sentences. Speak slowly and be very encouraging."
        )
    if d == "intermediate":
        return "Introduce a few idioms when appropriate and ask one short follow-up question."
    if d == "advanced":
        return "Use complex grammar, discuss abstract topics, and keep guidance minimal."
    return "Adapt to the student's level."


def build_system_prompt(language: str, difficulty: str) -> str:
    lang = (language or "french").lower()
    avatar_name = AVATAR_NAMES.get(lang, "Tutor")
    diff = (difficulty or "beginner").lower()
    diff_inst = _difficulty_instructions(diff)

    return f"""
You are {avatar_name}, a friendly and encouraging {lang} language tutor.
The student is at {diff} level.
{diff_inst}

Always reply in {lang} first, then provide an English translation in parentheses.
Gently correct any grammar or pronunciation mistakes.
Keep responses short (2-3 sentences max).
End your response with an emotion tag on a new line: [emotion: encouraging|happy|thinking|neutral]
""".strip()

