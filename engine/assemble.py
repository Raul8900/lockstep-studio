"""Master the audio and assemble the final MP4.

  python3 engine/assemble.py <video-dir> [--crf 16] [--preset slow] [--out file.mp4] [--remux] [--audio-only]

1. mix_premaster.wav -> gain to -14 LUFS integrated, look-ahead limited to -1.5 dBFS
   (measured with FFmpeg's EBU R128 meter, corrected, measured again)
2. out/frames/f%05d.jpg (full-range BT.601 JPEG) -> H.264 High, yuv420p, BT.709 limited range
3. AAC-LC 48 kHz stereo, MP4 with the index at the front (faststart)
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.ndimage import minimum_filter1d
from scipy.signal import lfilter, lfilter_zi, resample_poly

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import load_config, need, project_dir  # noqa: E402

ROOT = None            # the video folder, set in main()
TARGET_LUFS, CEILING_DB = -14.0, -1.5


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, text=True, **kw)


def measure(path):
    """integrated loudness (LUFS), loudness range and true peak (dBTP) via ebur128"""
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True)
    tail = r.stderr[r.stderr.rfind("Summary:"):]
    i = float(re.search(r"I:\s*(-?[\d.]+) LUFS", tail).group(1))
    lra = float(re.search(r"LRA:\s*(-?[\d.]+) LU", tail).group(1))
    tp = float(re.search(r"Peak:\s*(-?[\d.]+) dBFS", tail).group(1))
    return i, lra, tp


def limiter(x, ceiling_db, sr, lookahead=0.004, release=0.08):
    """transparent look-ahead peak limiter (stereo-linked), checked on a 4x oversampled copy"""
    ceil = 10 ** (ceiling_db / 20)
    up = resample_poly(x, 4, 1, axis=0)
    peak = np.abs(up).max(axis=1).reshape(-1, 4).max(axis=1)[: len(x)]          # inter-sample peaks per sample
    g = np.minimum(1.0, ceil / np.maximum(peak, 1e-9))
    k = max(3, int(lookahead * sr) | 1)
    g = minimum_filter1d(g, size=k, mode="nearest")                              # reach the reduction before the peak
    a = np.exp(-1 / (release * sr))
    zi = lfilter_zi([1 - a], [1, -a])                                            # start both passes at unity gain
    rel = lfilter([1 - a], [1, -a], g[::-1], zi=zi * g[-1])[0][::-1]             # smooth the recovery
    g = np.minimum(g, np.minimum(rel, lfilter([1 - a], [1, -a], g, zi=zi * g[0])[0]))
    return x * g[:, None], float(20 * np.log10(g.min()))


def master_audio():
    src = ROOT / "audio/mix_premaster.wav"
    x, sr = sf.read(src, dtype="float64")
    out = ROOT / "audio/final_mix.wav"
    if not np.any(x):
        sf.write(out, x, sr, subtype="PCM_24")
        return out, {"premaster_lufs": None, "final_lufs": None, "final_true_peak_db": None,
                     "max_limiter_reduction_db": 0, "silent": True}
    gain_db, report = 0.0, {}
    ceiling = float(load_config(ROOT).get('mix', {}).get('master_ceiling_db', CEILING_DB))
    if not np.isfinite(ceiling) or not -12 <= ceiling <= -1:
        raise ValueError('mix.master_ceiling_db must be between -12 and -1; allow headroom for AAC overshoot and measure the exported file')
    i0, lra0, tp0 = measure(src)
    for attempt in range(4):
        gain_db += TARGET_LUFS - (i0 if attempt == 0 else i_now)
        y, max_gr = limiter(x * 10 ** (gain_db / 20), ceiling, sr)
        sf.write(out, y, sr, subtype="PCM_24")
        i_now, lra, tp = measure(out)
        if abs(i_now - TARGET_LUFS) <= 0.15:
            break
    report = {"premaster_lufs": i0, "premaster_true_peak_db": tp0, "applied_gain_db": round(gain_db, 2),
              "max_limiter_reduction_db": round(max_gr, 2), "final_lufs": i_now, "final_lra_lu": lra, "final_true_peak_db": tp}
    return out, report


def main():
    global ROOT
    ap = argparse.ArgumentParser()
    ap.add_argument("project", help="video folder or slug under videos/")
    ap.add_argument("--crf", default="16")
    ap.add_argument("--preset", default="slow")
    ap.add_argument("--out", default=None, help="default: <video>/dist/<output>.mp4")
    ap.add_argument("--audio-only", action="store_true")
    ap.add_argument("--remux", action="store_true", help="keep the existing video stream, replace the audio")
    args = ap.parse_args()

    ROOT = project_dir(args.project)
    cfg = load_config(ROOT)
    if not args.out:
        (ROOT / "dist").mkdir(exist_ok=True)
        args.out = str(ROOT / "dist" / (cfg.get("output", ROOT.name) + ".mp4"))
    need(ROOT / "audio/mix_premaster.wav", "run: lockstep audio <video>")
    tl = json.load(open(need(ROOT / "data/timeline.json", "run: lockstep meta <video>")))
    total = tl["total"]
    opted_in = bool(cfg.get('choices') or cfg.get('audio') or cfg.get('music', {}).get('source') or cfg.get('clock'))
    # Bound new productions explicitly. FFmpeg's shortest buffering can otherwise
    # discard ~70 ms of AAC from a finite image sequence; preserve legacy encoding.
    end_args = ["-t", f"{total / 30:.6f}"] if opted_in else ["-shortest", "-fflags", "+shortest", "-max_interleave_delta", "100M"]
    frames = sorted((ROOT / "out/frames").glob("f*.jpg"))
    if not args.audio_only and not args.remux and len(frames) != total:
        sys.exit(f"expected {total} frames, found {len(frames)} — render first")

    audio, arep = master_audio()
    print("audio master:", json.dumps(arep))
    if args.audio_only:
        return
    if args.remux:
        tmp = args.out + ".remux.mp4"
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", args.out, "-i", str(audio),
                        "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-af", "apad", "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-ac", "2",
                        "-movflags", "+faststart", *end_args,
                        "-map_metadata", "0", tmp], check=True)
        Path(tmp).replace(args.out)
        json.dump(arep, open(ROOT / "data/master_report.json", "w"), indent=1)
        print("remuxed audio into", args.out)
        return

    vf = ("scale=in_range=full:in_color_matrix=bt601:out_range=tv:out_color_matrix=bt709:"
          "flags=bicubic+accurate_rnd+full_chroma_int+full_chroma_inp,format=yuv420p")
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-stats", "-y",
           "-framerate", "30", "-start_number", "0", "-i", str(ROOT / "out/frames/f%05d.jpg"),
           "-i", str(audio),
           "-vf", vf, "-af", "apad",
           "-c:v", "libx264", "-preset", args.preset, "-crf", args.crf, "-profile:v", "high", "-level:v", "4.2",
           "-pix_fmt", "yuv420p", "-x264-params", "aq-mode=3:aq-strength=0.9:keyint=60:min-keyint=30:deblock=-1,-1",
           "-maxrate", "16M", "-bufsize", "32M",
           "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv",
           "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-ac", "2",
           "-movflags", "+faststart", *end_args,
           "-metadata", "title=" + cfg.get("title", ROOT.name),
           "-metadata", ("comment=Deterministic local Lockstep production. See saved choices and provenance in production_report.md." if opted_in else "comment=Programmatically rendered (HTML Canvas + FFmpeg). Voice: Kokoro TTS. Music and sound design: original synthesis."),
           args.out]
    subprocess.run(cmd, check=True)
    json.dump(arep, open(ROOT / "data/master_report.json", "w"), indent=1)
    print("wrote", args.out)


if __name__ == "__main__":
    main()
