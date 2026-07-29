"""STT/TTS placeholders. Frontend uses Web Speech API today."""
from __future__ import annotations
from dataclasses import dataclass


@dataclass
class Transcript:
    text: str
    confidence: float = 0.0
    language: str = "en"


class SpeechToText:
    def transcribe(self, audio_bytes: bytes, *, language: str = "en") -> Transcript:
        # TODO: integrate Whisper API / faster-whisper.
        raise NotImplementedError("Handled client-side via Web Speech API.")


class TextToSpeech:
    def synthesize(self, text: str, *, voice: str = "default") -> bytes:
        # TODO: integrate ElevenLabs / OpenAI TTS / gTTS.
        raise NotImplementedError("Handled client-side via SpeechSynthesis.")