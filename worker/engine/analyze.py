"""Step 3: Claude reads the transcript and loudness map, picks the best moments,
and writes captions, hashtags and a profile setup for each platform."""
import json

import anthropic

from . import config

PLATFORM_COPY = {
    "type": "object",
    "properties": {
        "instagram": {
            "type": "object",
            "properties": {
                "caption": {"type": "string", "description": "Reel caption: hook line, 1-3 short lines, CTA. Max ~2200 chars, best under 300."},
                "hashtags": {"type": "array", "items": {"type": "string"}, "description": "3-8 hashtags mixing broad, niche and specific."},
            },
            "required": ["caption", "hashtags"], "additionalProperties": False,
        },
        "youtube": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Shorts title under 70 chars, curiosity-driven."},
                "description": {"type": "string"},
                "hashtags": {"type": "array", "items": {"type": "string"}, "description": "3-5 hashtags, include #Shorts."},
                "tags": {"type": "array", "items": {"type": "string"}, "description": "SEO keyword tags."},
            },
            "required": ["title", "description", "hashtags", "tags"], "additionalProperties": False,
        },
        "tiktok": {
            "type": "object",
            "properties": {
                "caption": {"type": "string", "description": "Short punchy caption with a question or CTA to drive comments."},
                "hashtags": {"type": "array", "items": {"type": "string"}, "description": "3-6 hashtags, niche plus trending."},
            },
            "required": ["caption", "hashtags"], "additionalProperties": False,
        },
    },
    "required": ["instagram", "youtube", "tiktok"], "additionalProperties": False,
}

PROFILE = {
    "type": "object",
    "properties": {
        "display_name": {"type": "string"},
        "username_ideas": {"type": "array", "items": {"type": "string"}},
        "bio": {"type": "string", "description": "Within the platform's limit (Instagram 150, TikTok 80, YouTube description up to 1000)."},
        "profile_photo": {"type": "string", "description": "What the profile picture should show."},
        "banner_or_highlights": {"type": "string", "description": "YouTube banner idea, Instagram highlight covers, or TikTok pinned videos plan."},
        "link_in_bio": {"type": "string"},
        "content_pillars": {"type": "array", "items": {"type": "string"}},
        "posting_schedule": {"type": "string"},
        "growth_tips": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["display_name", "username_ideas", "bio", "profile_photo", "banner_or_highlights",
                 "link_in_bio", "content_pillars", "posting_schedule", "growth_tips"],
    "additionalProperties": False,
}

SCHEMA = {
    "type": "object",
    "properties": {
        "video_summary": {"type": "string"},
        "niche": {"type": "string"},
        "target_audience": {"type": "string"},
        "clips": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Internal short name for the clip."},
                    "start": {"type": "number", "description": "Start time in seconds, at the start of a sentence."},
                    "end": {"type": "number", "description": "End time in seconds, at the end of a sentence."},
                    "hook_text": {"type": "string", "description": "On-screen text for the first 3 seconds, max 8 words."},
                    "why_it_works": {"type": "string"},
                    "virality_score": {"type": "integer", "description": "1-100 estimate."},
                    "copy": PLATFORM_COPY,
                },
                "required": ["title", "start", "end", "hook_text", "why_it_works", "virality_score", "copy"],
                "additionalProperties": False,
            },
        },
        "profiles": {
            "type": "object",
            "properties": {"instagram": PROFILE, "youtube": PROFILE, "tiktok": PROFILE},
            "required": ["instagram", "youtube", "tiktok"], "additionalProperties": False,
        },
    },
    "required": ["video_summary", "niche", "target_audience", "clips", "profiles"],
    "additionalProperties": False,
}

SYSTEM = """You are a senior short-form video strategist and social media manager who has grown \
accounts to millions of followers on Instagram Reels, YouTube Shorts and TikTok.

Your job: from a long video's timestamped transcript, choose the moments most likely to go viral as \
standalone vertical clips, then write the copy that gets them watched, shared and commented on.

How to pick moments:
- A clip must make sense to someone who never saw the full video. Start where a thought starts and \
end right after its payoff; never cut mid-sentence.
- The first 2 seconds must hook: a bold claim, a surprising fact, a question, conflict, emotion or a \
punchline setup. Prefer moments that open strong over ones that need context.
- Favour stories, strong opinions, counter-intuitive advice, funny or emotional peaks, and quotable \
lines. Loudness spikes in the audio map often mark laughter or reactions.
- Clips must not overlap. Respect the requested length range.

How to write copy:
- Write in the requested language, in a natural native voice for that audience, not translated-sounding.
- Each platform gets its own copy; do not paste the same text three times.
- Hashtags start with #, contain no spaces, and mix broad reach tags with niche tags. No banned or \
spammy tags (#fyp spam lists, #follow4follow).
- Never invent facts, quotes or claims the video does not contain.

Profile setup: base it on the video's niche and audience and the creator brief, and respect each \
platform's character limits."""


def _transcript_for_prompt(transcript: dict) -> str:
    return "\n".join(f"[{s['start']:.1f}-{s['end']:.1f}] {s['text']}" for s in transcript["segments"])


def _loudness_for_prompt(levels: list[float], top: int = 25) -> str:
    if not levels:
        return "(no audio levels)"
    ranked = sorted(range(len(levels)), key=lambda i: levels[i], reverse=True)[:top]
    return ", ".join(f"{i}s ({levels[i]:.0f} dB)" for i in sorted(ranked))


def analyze(meta: dict, transcript: dict, loudness: list[float], *, num_clips: int = 5,
            min_len: int = 20, max_len: int = 60, language: str = "English",
            brief: str = "") -> dict:
    client = anthropic.Anthropic()
    user = f"""Video title: {meta.get('title', '')}
Channel/uploader: {meta.get('uploader', '')}
Duration: {transcript.get('duration') or meta.get('duration')} seconds
Original description: {meta.get('description', '')[:1500]}

Creator brief (niche, brand, handle, audience): {brief or 'not given; infer it from the video'}

Task: pick the {num_clips} best clips, each between {min_len} and {max_len} seconds long, ordered \
from highest to lowest virality score. Write all captions, hashtags and profile copy in {language}.

Loudest seconds of the audio (possible reaction peaks): {_loudness_for_prompt(loudness)}

Transcript with timestamps in seconds:
{_transcript_for_prompt(transcript)}"""

    with client.beta.messages.stream(
        model=config.CLAUDE_MODEL,
        max_tokens=64000,
        system=SYSTEM,
        messages=[{"role": "user", "content": user}],
        output_config={"effort": "high", "format": {"type": "json_schema", "schema": SCHEMA}},
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",  # if a safety classifier declines, the API retries on a fallback model
    ) as stream:
        response = stream.get_final_message()

    if response.stop_reason == "refusal":
        raise RuntimeError(f"Claude declined to analyze this video: {response.stop_details}")
    if response.stop_reason == "max_tokens":
        raise RuntimeError("The analysis was cut off. Try fewer clips.")
    text = next(b.text for b in response.content if b.type == "text")
    result = json.loads(text)
    return _clean(result, transcript, min_len, max_len)


def _clean(result: dict, transcript: dict, min_len: int, max_len: int) -> dict:
    """Clamp times to the video, drop overlaps, normalise hashtags."""
    duration = transcript.get("duration") or max((s["end"] for s in transcript["segments"]), default=0)
    kept, used = [], []
    for c in sorted(result["clips"], key=lambda c: -c["virality_score"]):
        start = max(0.0, float(c["start"]))
        end = min(float(duration), float(c["end"])) if duration else float(c["end"])
        if end - start < min(5, min_len) or any(start < e and end > s for s, e in used):
            continue
        if end - start > max_len + 5:
            end = start + max_len
        c["start"], c["end"] = round(start, 2), round(end, 2)
        for p in c["copy"].values():
            p["hashtags"] = [("#" + h.lstrip("#")).replace(" ", "") for h in p["hashtags"] if h.strip("# ")]
        used.append((start, end))
        kept.append(c)
    result["clips"] = kept
    return result
