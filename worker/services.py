"""Real storage (Cloudflare R2) and database (Supabase) used by the worker."""
import os
from datetime import datetime, timezone
from pathlib import Path


class R2Storage:
    def __init__(self, client, bucket: str):
        self.s3, self.bucket = client, bucket

    @classmethod
    def from_env(cls):
        import boto3
        client = boto3.client(
            "s3",
            endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
            aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
            aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
            region_name="auto",
        )
        return cls(client, os.environ["R2_BUCKET"])

    def download(self, key: str, dest: Path) -> None:
        self.s3.download_file(self.bucket, key, str(dest))

    def upload(self, src: Path, key: str, content_type: str) -> None:
        self.s3.upload_file(str(src), self.bucket, key, ExtraArgs={"ContentType": content_type})


class SupabaseDB:
    """Uses the service role key, so it bypasses row level security. Server side only."""

    def __init__(self, client):
        self.sb = client

    @classmethod
    def from_env(cls):
        from supabase import create_client
        return cls(create_client(_supabase_url(), os.environ["SUPABASE_SERVICE_ROLE_KEY"].strip()))

    def get_job(self, job_id: str) -> dict:
        return self.sb.table("jobs").select("*").eq("id", job_id).single().execute().data

    def get_profile(self, user_id: str) -> dict:
        return self.sb.table("profiles").select("*").eq("id", user_id).single().execute().data

    def update_job(self, job_id: str, fields: dict) -> None:
        self.sb.table("jobs").update({**fields, "updated_at": datetime.now(timezone.utc).isoformat()}).eq("id", job_id).execute()

    def minutes_remaining(self, user_id: str) -> float:
        return float(self.sb.rpc("minutes_remaining", {"p_user": user_id}).execute().data)

    def charge_job(self, job_id: str, minutes: float) -> bool:
        return bool(self.sb.rpc("charge_job", {"p_job": job_id, "p_minutes": minutes}).execute().data)

    def insert_clips(self, rows: list[dict]) -> None:
        if rows:
            self.sb.table("clips").upsert(rows, on_conflict="job_id,idx").execute()


def _supabase_url() -> str:
    """Accept common copy-paste slips: spaces, quotes, no https://, or a path such as /rest/v1/."""
    from urllib.parse import urlparse
    raw = os.environ["SUPABASE_URL"].strip().strip("'\"")
    if not raw.lower().startswith(("http://", "https://")):
        raw = "https://" + raw
    u = urlparse(raw)
    return f"{u.scheme}://{u.netloc}"
