"""Step 2: transcribe speech with word timestamps, and measure loudness per second."""
import json
import re
import subprocess
from pathlib import Path

from . import config


_MODEL = None


def _model():
    """Load Whisper once per container and reuse it for every job."""
    global _MODEL
    if _MODEL is None:
        from faster_whisper import WhisperModel
        _MODEL = WhisperModel(config.WHISPER_MODEL, device="auto", compute_type="auto",
                              download_root=config.WHISPER_DIR)
    return _MODEL


def transcribe(video: Path, language: str | None = None) -> dict:
    """Run faster-whisper. Returns {language, duration, segments:[{start,end,text,words:[...]}]}."""
    model = _model()
    segments, info = model.transcribe(str(video), language=language, word_timestamps=True, vad_filter=True)
    out = []
    for s in segments:
        out.append({
            "start": round(s.start, 2),
            "end": round(s.end, 2),
            "text": s.text.strip(),
            "words": [{"start": round(w.start, 2), "end": round(w.end, 2), "word": w.word.strip()}
                      for w in (s.words or [])],
        })
    return {"language": info.language, "duration": info.duration, "segments": out}


def loudness_per_second(video: Path) -> list[float]:
    """RMS level (dB) for each second of audio. Peaks often mark laughs, shouts and big reactions."""
    cmd = ["ffmpeg", "-hide_banner", "-nostats", "-i", str(video), "-vn",
           "-af", "aresample=16000,asetnsamples=n=16000,astats=metadata=1:reset=1,"
                  "ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-",
           "-f", "null", "-"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    levels = []
    for m in re.finditer(r"RMS_level=(-?[\d.]+|-inf)", res.stdout):
        v = m.group(1)
        levels.append(-90.0 if v == "-inf" else float(v))
    return levels


def probe(video: Path) -> dict:
    res = subprocess.run(["ffprobe", "-v", "error", "-print_format", "json", "-show_format",
                          "-show_streams", str(video)], capture_output=True, text=True, check=True)
    data = json.loads(res.stdout)
    v = next((s for s in data["streams"] if s["codec_type"] == "video"), {})
    return {"duration": float(data["format"].get("duration", 0)),
            "width": int(v.get("width", 0)), "height": int(v.get("height", 0)),
            "has_audio": any(s["codec_type"] == "audio" for s in data["streams"])}
