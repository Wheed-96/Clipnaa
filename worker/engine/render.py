"""Step 4: cut each moment into a 1080x1920 vertical clip with a hook title and
word-by-word animated subtitles, ready for Reels, Shorts and TikTok."""
import statistics
import subprocess
from pathlib import Path

W, H = 1080, 1920


# ---------- reframing ----------

def face_center_x(video: Path, start: float, end: float, samples: int = 12) -> float | None:
    """Median horizontal position (0-1) of the largest face across the clip, or None."""
    try:
        import cv2
    except ImportError:
        return None
    if not hasattr(cv2, "CascadeClassifier"):  # OpenCV 5 dropped Haar cascades; use 4.x
        return None
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    cap = cv2.VideoCapture(str(video))
    xs = []
    for i in range(samples):
        t = start + (end - start) * (i + 0.5) / samples
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
        ok, frame = cap.read()
        if not ok:
            continue
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = cascade.detectMultiScale(gray, 1.2, 5, minSize=(gray.shape[0] // 12,) * 2)
        if len(faces):
            x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
            xs.append((x + w / 2) / frame.shape[1])
    cap.release()
    return statistics.median(xs) if len(xs) >= max(2, samples // 4) else None


def video_filter(mode: str, src_w: int, src_h: int, face_x: float | None) -> str:
    """ffmpeg filter that turns any aspect ratio into 1080x1920."""
    if src_w and src_h and src_w / src_h <= W / H + 0.01:  # already vertical
        return f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1[v0]"
    if mode == "auto":
        mode = "face" if face_x is not None else "blur"
    if mode == "face" and face_x is not None:
        # crop a full-height 9:16 window centred on the speaker
        return (f"[0:v]scale=-2:{H},crop={W}:{H}:"
                f"'min(max(iw*{face_x:.4f}-{W}/2,0),iw-{W})':0,setsar=1[v0]")
    if mode == "crop":
        return f"[0:v]scale=-2:{H},crop={W}:{H},setsar=1[v0]"
    # blur: whole frame in the middle, blurred zoomed copy behind it
    return (f"[0:v]split[a][b];[a]scale={W}:{H}:force_original_aspect_ratio=increase,"
            f"crop={W}:{H},boxblur=25:3[bg];[b]scale={W}:-2[fg];"
            f"[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1[v0]")


# ---------- subtitles ----------

def _ts(t: float) -> str:
    t = max(0.0, t)
    h, rem = divmod(t, 3600)
    m, s = divmod(rem, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def _esc(text: str) -> str:
    return text.replace("\\", "").replace("{", "(").replace("}", ")").replace("\n", " ")


def build_ass(words: list[dict], start: float, end: float, hook: str, out: Path,
              words_per_line: int = 3, highlight: str = "&H0000E5FF&", watermark: str = "") -> Path:
    """Write an .ass file: hook title for 3 s at the top, karaoke captions at the lower third."""
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Noto Sans,86,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,6,3,2,60,60,560,1
Style: Mark,Noto Sans,40,&H80FFFFFF,&H00FFFFFF,&H80000000,&H00000000,-1,0,0,0,100,100,0,0,1,2,0,9,40,40,60,1
Style: Hook,Noto Sans,78,&H00000000,&H00FFFFFF,&H00FFFFFF,&H00FFFFFF,-1,0,0,0,100,100,0,0,3,18,0,8,70,70,230,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = []
    if watermark:
        lines.append(f"Dialogue: 2,{_ts(0)},{_ts(end - start)},Mark,,0,0,0,,{_esc(watermark)}")
    if hook:
        lines.append(f"Dialogue: 1,{_ts(0)},{_ts(min(3.5, end - start))},Hook,,0,0,0,,"
                     f"{{\\fad(150,250)}}{_esc(hook)}")

    clip_words = [w for w in words if w["end"] > start and w["start"] < end and w["word"]]
    for i in range(0, len(clip_words), words_per_line):
        chunk = clip_words[i:i + words_per_line]
        for j, w in enumerate(chunk):
            w_start = w["start"] - start
            w_end = (chunk[j + 1]["start"] if j + 1 < len(chunk) else w["end"]) - start
            text = " ".join(
                (f"{{\\c{highlight}\\fscx108\\fscy108}}{_esc(x['word'])}{{\\r}}" if k == j else _esc(x["word"]))
                for k, x in enumerate(chunk))
            lines.append(f"Dialogue: 0,{_ts(w_start)},{_ts(max(w_end, w_start + 0.05))},Caption,,0,0,0,,{text}")
    out.write_text(header + "\n".join(lines) + "\n", encoding="utf-8")
    return out


# ---------- render ----------

def render_clip(video: Path, start: float, end: float, out: Path, *, words: list[dict], hook: str,
                src_w: int, src_h: int, mode: str = "auto", subtitles: bool = True,
                watermark: str = "") -> Path:
    face_x = face_center_x(video, start, end) if mode in ("auto", "face") else None
    vf = video_filter(mode, src_w, src_h, face_x)
    if subtitles or hook or watermark:
        ass = build_ass(words if subtitles else [], start, end, hook, out.with_suffix(".ass"),
                        watermark=watermark)
        ass_path = str(ass).replace("\\", "/").replace(":", "\\:").replace("'", "\\'")
        vf += f";[v0]ass='{ass_path}'[v]"
    else:
        vf += ";[v0]null[v]"
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
           "-ss", f"{start:.2f}", "-to", f"{end:.2f}", "-i", str(video),
           "-filter_complex", vf, "-map", "[v]", "-map", "0:a?",
           "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
           "-r", "30", "-c:a", "aac", "-b:a", "160k", "-ar", "44100",
           "-movflags", "+faststart", str(out)]
    subprocess.run(cmd, check=True)
    return out
