"""Clipnaa cloud worker on Modal.

Deploy:  modal deploy modal_app.py
The web app calls the `enqueue` endpoint, which starts `process_job` in the background
on a GPU container. Scales to zero when idle."""
import os
from pathlib import Path

import modal

app = modal.App("clipnaa-worker")
secrets = [modal.Secret.from_name("clipnaa")]  # see worker/README.md for the keys it holds

WHISPER_DIR = "/models/whisper"


def _download_whisper():
    from faster_whisper import WhisperModel
    WhisperModel(os.environ.get("WHISPER_MODEL", "large-v3"), device="cpu", compute_type="int8",
                 download_root=WHISPER_DIR)


gpu_image = (
    modal.Image.from_registry("nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04", add_python="3.12")
    .apt_install("ffmpeg", "fonts-noto-core", "fonts-noto-ui-core", "fontconfig")
    .pip_install("faster-whisper==1.2.1", "anthropic>=2.10", "yt-dlp>=2026.10.26",
                 "opencv-python-headless>=4.9,<5", "boto3>=1.34", "supabase>=2.34")
    .env({"WHISPER_DIR": WHISPER_DIR, "WHISPER_MODEL": "large-v3"})
    .run_function(_download_whisper)
    .add_local_python_source("engine", "job", "services")
)

web_image = modal.Image.debian_slim(python_version="3.12").pip_install("fastapi[standard]")


@app.function(image=gpu_image, gpu="L4", secrets=secrets, timeout=60 * 60, retries=1,
              scaledown_window=120)
def process_job(job_id: str):
    import job
    from services import R2Storage, SupabaseDB
    job.process(job_id, R2Storage.from_env(), SupabaseDB.from_env())


@app.function(image=web_image, secrets=secrets)
@modal.fastapi_endpoint(method="POST")
def enqueue(body: dict):
    from fastapi.responses import JSONResponse
    if body.get("secret") != os.environ["WORKER_SECRET"]:
        return JSONResponse({"error": "unauthorized"}, status_code=401)
    job_id = str(body.get("job_id", ""))
    if not job_id:
        return JSONResponse({"error": "job_id required"}, status_code=400)
    call = process_job.spawn(job_id)
    return {"ok": True, "call_id": call.object_id}


@app.local_entrypoint()
def main(job_id: str):
    """Run one job from your terminal: modal run modal_app.py --job-id <uuid>"""
    process_job.remote(job_id)


if __name__ == "__main__":
    print(Path(__file__).name, "is deployed with: modal deploy modal_app.py")
