"""End-to-end test of job.process with fake storage and database.

Transcription and Claude are stubbed, so this needs only ffmpeg:  python -m pytest worker/tests
"""
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import job  # noqa: E402

COPY = {
    "instagram": {"caption": "c", "hashtags": ["#a"]},
    "youtube": {"title": "t", "description": "d", "hashtags": ["#Shorts"], "tags": ["x"]},
    "tiktok": {"caption": "c", "hashtags": ["#b"]},
}
PROFILE = {"display_name": "x", "bio": "x", "username_ideas": ["a"], "content_pillars": ["b"]}


@pytest.fixture(scope="module")
def sample(tmp_path_factory) -> Path:
    out = tmp_path_factory.mktemp("src") / "sample.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc2=s=1280x720:d=60:r=30",
                    "-f", "lavfi", "-i", "sine=f=440:d=60", "-c:v", "libx264", "-c:a", "aac", "-shortest",
                    str(out)], check=True)
    return out


class FakeStore:
    def __init__(self, src: Path, out: Path):
        self.files, self.out = {"uploads/u1/src.mp4": src}, out

    def download(self, key, dest):
        shutil.copy(self.files[key], dest)

    def upload(self, src, key, content_type):
        dest = self.out / Path(key).name
        shutil.copy(src, dest)
        self.files[key] = dest


class FakeDB:
    def __init__(self, plan="free", remaining=30.0, status="queued"):
        self.job = {"id": "j1", "user_id": "u1", "status": status, "source_key": "uploads/u1/src.mp4",
                    "source_name": "Episode 12.mp4", "num_clips": 2, "min_len": 10, "max_len": 60,
                    "caption_language": "Arabic", "brief": "", "reframe": "auto"}
        self.plan, self.remaining, self.clips, self.charged, self.updates = plan, remaining, [], None, []

    def get_job(self, _):
        return dict(self.job)

    def get_profile(self, _):
        return {"plan": self.plan}

    def update_job(self, _, fields):
        self.job.update(fields)
        self.updates.append(fields)

    def minutes_remaining(self, _):
        return self.remaining

    def charge_job(self, _, minutes):
        self.charged = minutes
        return True

    def insert_clips(self, rows):
        self.clips = rows


@pytest.fixture(autouse=True)
def stub_ai(monkeypatch):
    words = [{"start": i * 0.5, "end": i * 0.5 + 0.4, "word": w} for i, w in enumerate("هذا اللي غير كل شي".split())]
    monkeypatch.setattr(job, "transcribe", lambda *_: {"language": "ar", "segments": [
        {"start": 0, "end": 3, "text": "هذا اللي غير كل شي", "words": words}]})
    monkeypatch.setattr(job, "analyze", lambda *_a, **_k: {
        "video_summary": "s", "niche": "n", "target_audience": "a",
        "profiles": {"instagram": PROFILE, "youtube": PROFILE, "tiktok": PROFILE},
        "clips": [{"title": "One", "start": 0, "end": 12, "hook_text": "Wait", "why_it_works": "w",
                   "virality_score": 90, "copy": COPY},
                  {"title": "Two", "start": 20, "end": 35, "hook_text": "h", "why_it_works": "w",
                   "virality_score": 70, "copy": COPY}]})


def test_job_produces_vertical_clips_and_charges_minutes(sample, tmp_path):
    db, store = FakeDB(), FakeStore(sample, tmp_path)
    job.process("j1", store, db)
    assert db.job["status"] == "done"
    assert db.charged == 1.0
    assert [c["idx"] for c in db.clips] == [1, 2]
    probe = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                            "stream=width,height", "-of", "csv=p=0", str(store.files[db.clips[0]["file_key"]])],
                           capture_output=True, text=True, check=True)
    assert probe.stdout.strip() == "1080,1920"


def test_over_quota_fails_with_a_clear_message(sample, tmp_path):
    db = FakeDB(plan="creator", remaining=0.5)
    job.process("j1", FakeStore(sample, tmp_path), db)
    assert db.job["status"] == "failed"
    assert "Upgrade" in db.job["error"]
    assert db.charged is None


def test_finished_job_is_not_reprocessed(sample, tmp_path):
    db = FakeDB(status="done")
    job.process("j1", FakeStore(sample, tmp_path), db)
    assert db.updates == [] and db.charged is None
