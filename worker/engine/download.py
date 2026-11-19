"""Step 1: get the video from a link (YouTube, TikTok, Instagram, X, Drive, ...) or a local file."""
import re
import shutil
from pathlib import Path

import yt_dlp


def slugify(text: str, limit: int = 50) -> str:
    text = re.sub(r"[^\w\s-]", "", text, flags=re.UNICODE).strip().lower()
    return re.sub(r"[\s_-]+", "-", text)[:limit] or "video"


def fetch_video(source: str, work_dir: Path) -> dict:
    """Download `source` (URL or local path) into work_dir. Returns {path, title, duration, ...}."""
    work_dir.mkdir(parents=True, exist_ok=True)

    local = Path(source).expanduser()
    if local.exists():
        dest = work_dir / f"source{local.suffix or '.mp4'}"
        if local.resolve() != dest.resolve():
            shutil.copy(local, dest)
        return {"path": dest, "title": local.stem, "description": "", "uploader": "",
                "duration": None, "url": None}

    opts = {
        # best quality up to 1080p, merged to mp4
        "format": "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/bv*[height<=1080]+ba/b[height<=1080]/b",
        "merge_output_format": "mp4",
        "outtmpl": str(work_dir / "source.%(ext)s"),
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(source, download=True)
        path = Path(ydl.prepare_filename(info)).with_suffix(".mp4")
        if not path.exists():  # merged file may keep another extension
            path = next(work_dir.glob("source.*"))
    return {
        "path": path,
        "title": info.get("title") or "video",
        "description": (info.get("description") or "")[:2000],
        "uploader": info.get("uploader") or "",
        "duration": info.get("duration"),
        "url": source,
    }
