"""Process one Clipnaa job: source video in R2 -> clips + copy in R2 and the database.

The storage and database are passed in, so this runs the same on Modal and in tests."""
import math
import tempfile
import traceback
from pathlib import Path
from typing import Protocol

from engine.analyze import analyze
from engine.download import fetch_video, slugify
from engine.render import render_clip
from engine.transcribe import loudness_per_second, probe, transcribe

MAX_SOURCE_MINUTES = 180
WATERMARK = "clipnaa.com"


class Storage(Protocol):
    def download(self, key: str, dest: Path) -> None: ...
    def upload(self, src: Path, key: str, content_type: str) -> None: ...


class Database(Protocol):
    def get_job(self, job_id: str) -> dict: ...
    def get_profile(self, user_id: str) -> dict: ...
    def update_job(self, job_id: str, fields: dict) -> None: ...
    def minutes_remaining(self, user_id: str) -> float: ...
    def charge_job(self, job_id: str, minutes: float) -> bool: ...
    def insert_clips(self, rows: list[dict]) -> None: ...


class JobError(Exception):
    """A problem the user should see, e.g. not enough minutes left."""


def process(job_id: str, store: Storage, db: Database) -> None:
    job = db.get_job(job_id)
    if job["status"] == "done":
        return  # already finished (duplicate trigger)
    progress = lambda msg: db.update_job(job_id, {"status": "processing", "progress": msg})  # noqa: E731
    try:
        _run(job, store, db, progress)
    except JobError as e:
        db.update_job(job_id, {"status": "failed", "error": str(e), "progress": None})
    except Exception as e:  # unexpected: keep the details for us, a short message for the user
        traceback.print_exc()
        db.update_job(job_id, {"status": "failed", "progress": None,
                               "error": f"Processing failed ({type(e).__name__}). Please try again."})
        raise


def _run(job: dict, store: Storage, db: Database, progress) -> None:
    job_id, user_id = job["id"], job["user_id"]
    profile = db.get_profile(user_id)
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        progress("downloading")
        source = job["source_key"]
        if source.startswith("http://") or source.startswith("https://"):
            meta = fetch_video(source, work)
            video = Path(meta["path"])
        else:
            video = work / ("source" + (Path(source).suffix or ".mp4"))
            store.download(source, video)
            meta = {"title": Path(job.get("source_name") or "video").stem, "description": "", "uploader": ""}

        info = probe(video)
        minutes = round(math.ceil(info["duration"]) / 60, 2)
        if minutes > MAX_SOURCE_MINUTES:
            raise JobError(f"Videos can be up to {MAX_SOURCE_MINUTES} minutes long.")
        remaining = db.minutes_remaining(user_id)
        if minutes > remaining:
            raise JobError(f"This video is {minutes:.0f} minutes but your plan has {remaining:.0f} "
                           "minutes left this month. Upgrade to continue.")
        db.update_job(job_id, {"duration_sec": info["duration"], "title": meta.get("title")})

        progress("transcribing")
        transcript = transcribe(video)
        transcript.setdefault("duration", info["duration"])
        loud = loudness_per_second(video) if info["has_audio"] else []

        progress("finding the best moments")
        result = analyze(meta, transcript, loud, num_clips=job["num_clips"], min_len=job["min_len"],
                         max_len=job["max_len"], language=job["caption_language"], brief=job.get("brief") or "")

        words = [w for s in transcript["segments"] for w in s.get("words", [])]
        watermark = WATERMARK if profile.get("plan", "free") == "free" else ""
        rows = []
        for i, clip in enumerate(result["clips"], 1):
            progress(f"rendering clip {i} of {len(result['clips'])}")
            out = work / f"clip_{i:02d}_{slugify(clip['title'], 30)}.mp4"
            render_clip(video, clip["start"], clip["end"], out, words=words, hook=clip["hook_text"],
                        src_w=info["width"], src_h=info["height"], mode=job.get("reframe", "auto"),
                        watermark=watermark)
            key = f"clips/{user_id}/{job_id}/{out.name}"
            store.upload(out, key, "video/mp4")
            rows.append({"job_id": job_id, "user_id": user_id, "idx": i, "title": clip["title"],
                         "start_sec": clip["start"], "end_sec": clip["end"], "hook_text": clip["hook_text"],
                         "why_it_works": clip["why_it_works"], "virality_score": clip["virality_score"],
                         "copy": clip["copy"], "file_key": key})

        db.insert_clips(rows)
        db.charge_job(job_id, minutes)
        db.update_job(job_id, {"status": "done", "progress": None, "summary": result["video_summary"],
                               "profiles": {"niche": result["niche"], "audience": result["target_audience"],
                                            **result["profiles"]}})
