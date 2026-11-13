"""Quality checks on the finished MP4. Writes data/validation.json and review images.

  python3 engine/validate.py <video-dir> [file.mp4]      (default: <video>/dist/<output>.mp4)

Technical : container/codec facts, full decode, black-frame and freeze detection,
            encode fidelity against the rendered frames (SSIM/PSNR), loudness.
Sync      : lag between the MP4's audio and the original narration (cross-correlation),
            speech-recognition pass on the final mix (is the voice still clear under the bed?).
Layout    : caption extents against the safe areas; phone-size previews with generic
            platform-UI overlays; contact sheet.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import ENGINE, MODELS, load_config, need, project_dir  # noqa: E402

ROOT = project_dir()
CFG = load_config(ROOT)
OUTDIR = ROOT / "dist"
MP4 = Path(sys.argv[2]) if len(sys.argv) > 2 else OUTDIR / (CFG.get("output", ROOT.name) + ".mp4")
need(MP4, "run: lockstep assemble <video>")
TMP = ROOT / "out/validate"
TMP.mkdir(parents=True, exist_ok=True)
OUTDIR.mkdir(exist_ok=True)
R = {}


def sh(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


# ------------------------------------------------------------ 1. stream facts
p = json.loads(sh(["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(MP4)]).stdout)
v = next(s for s in p["streams"] if s["codec_type"] == "video")
a = next(s for s in p["streams"] if s["codec_type"] == "audio")
num, den = map(int, v["avg_frame_rate"].split("/"))
R["file"] = {"path": str(MP4.resolve().relative_to(ROOT)) if MP4.resolve().is_relative_to(ROOT) else MP4.name, "size_mb": round(int(p["format"]["size"]) / 1e6, 1), "container": p["format"]["format_long_name"],
             "duration_s": round(float(p["format"]["duration"]), 3), "overall_bitrate_mbps": round(int(p["format"]["bit_rate"]) / 1e6, 2)}
R["video"] = {"codec": v["codec_name"], "profile": v["profile"], "level": v["level"] / 10, "width": v["width"], "height": v["height"],
              "aspect": f"{v['width'] // np.gcd(v['width'], v['height'])}:{v['height'] // np.gcd(v['width'], v['height'])}",
              "pix_fmt": v["pix_fmt"], "fps": num / den, "frames": int(v["nb_frames"]), "bitrate_mbps": round(int(v["bit_rate"]) / 1e6, 2),
              "color": f"{v.get('color_space')}/{v.get('color_transfer')}/{v.get('color_primaries')} {v.get('color_range')}"}
R["audio"] = {"codec": a["codec_name"], "profile": a.get("profile"), "sample_rate": int(a["sample_rate"]), "channels": a["channels"],
              "bitrate_kbps": round(int(a["bit_rate"]) / 1e3), "duration_s": round(float(a["duration"]), 3)}
moov_first = sh(["ffprobe", "-v", "trace", "-i", str(MP4)]).stderr
R["file"]["faststart"] = moov_first.find("type:'moov'") < moov_first.find("type:'mdat'")

# ------------------------------------------------- 2. decode, black, freeze
d = sh(["ffmpeg", "-v", "error", "-i", str(MP4), "-f", "null", "-"])
R["decode_errors"] = len([l for l in d.stderr.splitlines() if l.strip()])
bd = sh(["ffmpeg", "-hide_banner", "-i", str(MP4), "-vf", "blackdetect=d=0.05:pix_th=0.08:pic_th=0.97,freezedetect=n=0.0015:d=0.4", "-an", "-f", "null", "-"]).stderr
R["black_segments"] = re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", bd)
R["freeze_segments"] = [[float(x) for x in m] for m in re.findall(r"freeze_start: ([\d.]+)[\s\S]*?freeze_end: ([\d.]+)", bd)]

# --------------------------------------------- 3. fidelity vs rendered frames
if (ROOT / "out/frames/f00000.jpg").exists():
    ref = "[1:v]scale=in_range=full:in_color_matrix=bt601:out_range=tv:out_color_matrix=bt709:flags=bicubic+accurate_rnd+full_chroma_int+full_chroma_inp,format=yuv420p[r];"
    q = sh(["ffmpeg", "-hide_banner", "-i", str(MP4), "-framerate", "30", "-start_number", "0", "-i", str(ROOT / "out/frames/f%05d.jpg"),
            "-lavfi", ref.replace("[r];", ",split[r1][r2];") + "[0:v]split[m1][m2];[m1][r1]ssim;[m2][r2]psnr", "-an", "-f", "null", "-"]).stderr
    m = re.search(r"SSIM.*All:([\d.]+)", q)
    n = re.search(r"PSNR.*average:([\d.]+)", q)
    R["encode_fidelity"] = {"ssim_all": float(m.group(1)) if m else None, "psnr_avg_db": float(n.group(1)) if n else None}

# ------------------------------------------------------------- 4. loudness
e = sh(["ffmpeg", "-hide_banner", "-nostats", "-i", str(MP4), "-af", "ebur128=peak=true", "-vn", "-f", "null", "-"]).stderr
tail = e[e.rfind("Summary:"):]
R["loudness"] = {"integrated_lufs": float(re.search(r"I:\s*(-?[\d.]+) LUFS", tail).group(1)),
                 "range_lu": float(re.search(r"LRA:\s*(-?[\d.]+) LU", tail).group(1)),
                 "true_peak_dbtp": float(re.search(r"Peak:\s*(-?[\d.]+) dBFS", tail).group(1))}

# ---------------------------------------------------- 5. audio/video sync
wav = TMP / "final_audio_24k.wav"
sh(["ffmpeg", "-y", "-v", "error", "-i", str(MP4), "-vn", "-ac", "1", "-ar", "24000", str(wav)])
fin, sr = sf.read(wav, dtype="float32")
nar, _ = sf.read(ROOT / "audio/narration_24k.wav", dtype="float32")
n = min(len(fin), len(nar))
A, B_ = np.abs(fin[:n]), np.abs(nar[:n])
k = 240                                                    # 10 ms envelope
A = A[: n // k * k].reshape(-1, k).mean(1)
B_ = B_[: n // k * k].reshape(-1, k).mean(1)
A -= A.mean()
B_ -= B_.mean()
lags = range(-30, 31)
cc = [float(np.dot(A[max(0, l):len(A) + min(0, l)], B_[max(0, -l):len(B_) + min(0, -l)])) for l in lags]
best = list(lags)[int(np.argmax(cc))]
R["sync"] = {"narration_lag_ms_in_mp4": best * 10, "method": "cross-correlation of 10 ms envelopes, MP4 audio vs. original narration"}

# ------------------------------------- 6. speech recognition on the final mix
have_asr = (MODELS / "asr/sherpa-onnx-whisper-small.en").exists()
asr = sh([sys.executable, str(ENGINE / "tts/asr_check.py"), str(ROOT), str(wav)]) if have_asr else None
if asr is None:
    R["final_mix_asr"] = {"skipped": "speech-recognition models not installed (scripts/setup.sh --with-asr)"}
else:
    m = re.search(r"WER \(script vs Whisper small\.en\): (\d+)/(\d+) = ([\d.]+)%", asr.stdout)
    R["final_mix_asr"] = {"wer_percent": float(m.group(3)), "errors": int(m.group(1)), "words": int(m.group(2)),
                          "diffs": re.findall(r"diffs: (\[.*\])", asr.stdout)} if m else {"error": (asr.stdout + asr.stderr)[-400:]}
    mt = re.search(r"median ([+-]?\d+) ms \| mean abs (\d+) ms \| p95 abs (\d+) ms", asr.stdout)
    if mt:
        R["caption_timing_crosscheck"] = {"matched_words": int(re.search(r"on (\d+)/", asr.stdout).group(1)), "median_offset_ms": int(mt.group(1)),
                                          "mean_abs_dev_ms": int(mt.group(2)), "p95_abs_dev_ms": int(mt.group(3)),
                                          "note": "independent transducer ASR vs. TTS-derived word starts; the median is the recogniser's own emission delay"}

# ------------------------------------------------------ 7. caption geometry
tl = json.load(open(ROOT / "data/timeline.json"))
caps = tl["caps"]
if caps and "width" in caps[0]:
    wmax = max(c["width"] for c in caps)
    R["captions"] = {"phrases": len(caps), "two_line": sum(1 for c in caps if c["lines"] > 1), "max_width_px": round(wmax),
                     "x_extent": [round(540 - wmax / 2), round(540 + wmax / 2)], "y_extent": [1350 - 45 - 45, 1350 + 45 + 45],
                     "min_on_screen_s": round(min(c["show1"] - c["show0"] for c in caps), 2),
                     "max_words": max(len(c["text"].split()) for c in caps)}

# -------------------------------------------------------- 8. review images
def grab(t, w=None):
    out = TMP / f"g_{t:07.2f}.png"
    vf = ["-vf", f"scale={w}:-2:flags=lanczos"] if w else []
    sh(["ffmpeg", "-y", "-v", "error", "-ss", f"{t:.3f}", "-i", str(MP4), "-frames:v", "1", *vf, str(out)])
    return Image.open(out).convert("RGB")


def font(size):
    for f in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            pass
    return ImageFont.load_default()


# representative frames: a few per chapter, away from the scene changes
scenes = tl["scenes"]
per = max(2, min(4, round(30 / max(1, len(scenes)))))
picks = [round(sc["t0"] + (sc["t1"] - sc["t0"]) * (j + 0.6) / per, 1) for sc in scenes for j in range(per)]
picks[-1] = round(min(picks[-1], tl["dur"] - 0.4), 1)
picks = [min(t, tl["dur"] - 0.2) for t in picks]
tw, th, cols = 432, 768, 6
rows = (len(picks) + cols - 1) // cols
sheet = Image.new("RGB", (cols * tw, rows * th + 70), (6, 9, 14))
dr = ImageDraw.Draw(sheet)
dr.text((20, 18), CFG.get("title", ROOT.name) + "  —  frames taken from the final MP4", fill=(230, 240, 255), font=font(30))
for i, t in enumerate(picks):
    im = grab(t, tw)
    x, y = (i % cols) * tw, 70 + (i // cols) * th
    sheet.paste(im.resize((tw, th), Image.LANCZOS), (x, y))
    dr.rectangle([x, y, x + 96, y + 30], fill=(0, 0, 0))
    dr.text((x + 8, y + 5), f"{int(t // 60)}:{t % 60:04.1f}", fill=(255, 214, 80), font=font(20))
sheet.save(OUTDIR / "contact_sheet.jpg", quality=90)

# phone-size previews with generic UI keep-out overlays (approximate, from published measurements)
UI = {
    "reels_style": {"top": 210, "bottom": 1500, "col": (938, 1090, 1720), "label": "Reels-style overlay (approx.)"},
    "shorts_style": {"top": 250, "bottom": 1540, "col": (912, 900, 1560), "label": "Shorts-style overlay (approx.)"},
}
step = max(1, len(scenes) // 8 + (1 if len(scenes) % 8 and len(scenes) > 8 else 0))
ptimes = [round(sc["t0"] + (sc["t1"] - sc["t0"]) * 0.62, 1) for sc in scenes[::step]][:8]
for name, u in UI.items():
    pw, ph = 390, 693
    img = Image.new("RGB", (len(ptimes) * (pw + 16) + 16, ph + 76), (18, 20, 26))
    d2 = ImageDraw.Draw(img)
    d2.text((16, 14), f"{u['label']} — phone-size frames (390 pt wide). Shaded = interface keep-out.", fill=(230, 240, 255), font=font(22))
    for i, t in enumerate(ptimes):
        fr = grab(t).convert("RGBA")
        ov = Image.new("RGBA", fr.size, (0, 0, 0, 0))
        od = ImageDraw.Draw(ov)
        od.rectangle([0, 0, 1080, u["top"]], fill=(255, 70, 90, 70))
        od.rectangle([0, u["bottom"], 1080, 1920], fill=(255, 70, 90, 70))
        cx0, cy0, cy1 = u["col"]
        od.rectangle([cx0, cy0, 1080, cy1], fill=(255, 70, 90, 70))
        for k in range(5):                                   # generic round buttons
            yy = cy0 + 60 + k * (cy1 - cy0 - 120) / 4
            od.ellipse([cx0 + 30, yy - 38, cx0 + 106, yy + 38], fill=(255, 255, 255, 200))
        od.ellipse([40, u["bottom"] + 50, 120, u["bottom"] + 130], fill=(255, 255, 255, 200))   # avatar
        od.rounded_rectangle([140, u["bottom"] + 66, 520, u["bottom"] + 104], 16, fill=(255, 255, 255, 200))
        od.rounded_rectangle([40, u["bottom"] + 160, 820, u["bottom"] + 194], 14, fill=(255, 255, 255, 150))
        od.rounded_rectangle([40, u["bottom"] + 214, 640, u["bottom"] + 248], 14, fill=(255, 255, 255, 150))
        fr = Image.alpha_composite(fr, ov).convert("RGB").resize((pw, ph), Image.LANCZOS)
        img.paste(fr, (16 + i * (pw + 16), 60))
    img.save(OUTDIR / f"mobile_preview_{name}.jpg", quality=90)

json.dump(R, open(ROOT / "data/validation.json", "w"), indent=1)
print(json.dumps(R, indent=1))
