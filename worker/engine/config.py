"""Engine settings, read from environment variables (set as Modal secrets)."""
import os

CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-opus-5-5")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "large-v3")
WHISPER_DIR = os.getenv("WHISPER_DIR") or None  # where model weights are cached
