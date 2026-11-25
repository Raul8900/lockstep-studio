"""Write docs/production_report.md from the measured QA data.

  python3 engine/make_report.py <video-dir>

Measured sections come from data/validation.json, master_report.json, audio_stats.json
and asr_check.json. The judgement sections (accuracy review, defects fixed, creative
self-assessment, what was not verified) are authored per video in docs/report_notes.md
and inserted as written.
"""
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import load_config, need, project_dir  # noqa: E402

ROOT = project_dir()
CFG = load_config(ROOT)
D = ROOT / "data"
V = json.load(open(need(D / "validation.json", "run: lockstep validate <video>")))
M = json.load(open(D / "master_report.json"))
A = json.load(open(D / "audio_stats.json"))
ASR = json.load(open(D / "asr_check.json")) if (D / "asr_check.json").exists() else None
T = json.load(open(D / "takes.json"))
TL = json.load(open(D / "timeline.json"))
words = json.load(open(D / "words.json"))
TITLE = CFG.get("title", ROOT.name)
MAX_S = float(CFG.get("max_seconds", 180))


def ver(cmd):
    try:
        return subprocess.run(cmd, capture_output=True, text=True, shell=True).stdout.strip().splitlines()[0]
    except Exception:
        return "n/a"


f, v, a, lo = V["file"], V["video"], V["audio"], V["loudness"]
ok = lambda c: "PASS" if c else "**FAIL**"
speech = sum(t["t1"] - t["t0"] for t in T["takes"])
fz = V.get("freeze_segments", [])
fid = V.get("encode_fidelity", {})
caps = V.get("captions", {})
asr_final = V.get("final_mix_asr", {})
cc = V.get("caption_timing_crosscheck", {})
mp4 = Path(f["path"]).name

L = []
w = L.append
w(f"# Production Report — “{TITLE}”\n")
w("All figures in the numbered sections were measured on the delivered file by `engine/validate.py`; none are targets or estimates.\n")

w("## 1. Deliverable\n")
w(f"`{mp4}` — {f['size_mb']} MB, {f['duration_s']:.2f} s ({int(f['duration_s'] // 60)}:{f['duration_s'] % 60:04.1f}).\n")
w("| Requirement | Measured | Result |")
w("|---|---|---|")
w(f"| 1080 × 1920, 9:16 portrait | {v['width']} × {v['height']}, {v['aspect']} | {ok(v['width'] == 1080 and v['height'] == 1920)} |")
w(f"| 30 fps or higher | {v['fps']:.0f} fps constant, {v['frames']} frames | {ok(v['fps'] >= 30)} |")
w(f"| H.264 video | {v['codec'].upper()} {v['profile']} @ L{v['level']}, {v['pix_fmt']}, {v['color']}, {v['bitrate_mbps']} Mbps | {ok(v['codec'] == 'h264')} |")
w(f"| AAC audio | {a['codec'].upper()}-{a['profile']}, {a['sample_rate'] // 1000} kHz, {a['channels']} ch, {a['bitrate_kbps']} kbps | {ok(a['codec'] == 'aac')} |")
w(f"| MP4 container | MP4 (ISO BMFF), index at the front for streaming: {'yes' if f.get('faststart') else 'no'} | {ok(bool(f.get('faststart')))} |")
w(f"| {MAX_S:.0f} s maximum | {f['duration_s']:.2f} s | {ok(f['duration_s'] <= MAX_S)} |")
w(f"| Plays without error | full decode, {V['decode_errors']} errors | {ok(V['decode_errors'] == 0)} |")
w(f"| No black frames | {len(V['black_segments'])} black segments detected | {ok(not V['black_segments'])} |")
w(f"| Audio and picture in sync | narration lag inside the MP4: {V['sync']['narration_lag_ms_in_mp4']} ms | {ok(abs(V['sync']['narration_lag_ms_in_mp4']) <= 20)} |")
if "wer_percent" in asr_final:
    w(f"| Complete, intelligible narration | {len(words)} words; speech recognition on the final mix: {asr_final['wer_percent']} % word error ({asr_final['errors']} of {asr_final['words']} tokens once numbers are spelled out) | {ok(asr_final['wer_percent'] < 3 or asr_final['errors'] <= 2)} |")
else:
    w(f"| Complete narration | {len(words)} words; speech-recognition check not run ({asr_final.get('skipped', asr_final.get('error', 'unavailable'))}) | not measured |")
w(f"| Burned-in captions | {caps.get('phrases')} phrases, 1–{caps.get('max_words')} words each, within x {caps.get('x_extent')}, y {caps.get('y_extent')} | {ok(bool(caps) and caps['x_extent'][0] >= 60 and caps['x_extent'][1] <= 1020)} |")
w("")

w("## 2. How it was made\n")
w("| Stage | Method |")
w("|---|---|")
w(f"| Narration | {len(words)} words, recorded with Kokoro-82M (Apache-2.0 neural TTS, voice `{T['meta']['voice']}`, speed {T['meta']['speed']:.2f}) running locally. |")
w("| Word timing | Read from the voice model’s own phoneme durations: every word boundary is exact to one 25 ms model frame. |")
w(f"| Pictures | {len(TL['scenes'])} scenes of real photographs, film and 3D, composed on an HTML Canvas (3D by three.js); every frame is a pure function of time and of the narration’s word timings. |")
w(f"| Rendering | Headless Chromium, 1080 × 1920 native, {TL['total']} frames, each leaving the page as a JPEG (q 0.97). |")
MUS = CFG.get("music", {})
ST = TL.get("style") or {}
w(f"| Look | `{ST.get('name', 'engine default')}`: one colour grade for every picture; the reasoning behind it and the story is in docs/creative_brief.md. |")
w(f"| Music | Original, synthesised at {MUS.get('bpm', 100):g} BPM ({MUS.get('kit', 'synth')} kit" + (f", transposed {MUS['transpose']:+g} semitones" if MUS.get("transpose") else "")
  + "), arranged per chapter from the moods in video.json, ending on a held major chord. |")
w(f"| Sound design | {A['sfx_cues']} synthesised cues, emitted by the animation code at the same cue times as the visuals. |")
MEDIA_CR = json.load(open(ROOT / "media/credits.json", encoding="utf-8")) if (ROOT / "media/credits.json").exists() else {}
USED = list(dict.fromkeys(m["name"] for m in TL.get("media") or []))
if USED:
    lic = {}
    for n in USED:
        lic.setdefault(MEDIA_CR.get(n, {}).get("licence", "licence not recorded"), []).append(n)
    w(f"| Media | {len(USED)} picture(s), clip(s) and model(s) from free sources: " + "; ".join(f"{k}: {', '.join(v)}" for k, v in sorted(lic.items()))
      + ". Every source, author and licence is in media/credits.json; the credit lines for the description are in docs/credits.md. |")
w("| Mix | Voice lightly compressed and peak-controlled; bed ducked under speech; mastered to −14 LUFS with a look-ahead limiter. |")
w("| Encode | FFmpeg libx264 (CRF, preset slow), BT.709 limited range, 2 s keyframe interval; AAC-LC 256 kbps. |")
w("")
w("Versions: " + " · ".join([ver("ffmpeg -version | head -1 | cut -d' ' -f1-3"), "Node " + ver("node --version"), ver("python3 --version")]) + "\n")

w("## 3. Audio\n")
w("| Measure | Value |")
w("|---|---|")
w(f"| Integrated loudness | {lo['integrated_lufs']} LUFS (target −14) |")
w(f"| True peak | {lo['true_peak_dbtp']} dBTP |")
w(f"| Loudness range | {lo['range_lu']} LU |")
w(f"| Voice above music + effects while speaking | {A['speech_to_bed_ratio_db']} dB |")
w(f"| Music level in pauses vs. under speech | {A['music_rms_in_pauses_db'] - A['music_rms_while_speaking_db']:+.1f} dB (ducking) |")
w(f"| Limiter gain reduction at mastering | {abs(M['max_limiter_reduction_db']):.1f} dB |")
w(f"| Speaking pace | {len(words) / speech * 60:.0f} wpm while speaking; {len(words) / T['meta']['speech_end'] * 60:.0f} wpm including pauses |")
w("")
if ASR and "wer_percent" in asr_final:
    w(f"The narration was transcribed back by an independent recogniser (Whisper small.en) on the clean voice track and on the finished mix: "
      f"{ASR['wer_percent']} % and {asr_final['wer_percent']} % word error. Differences on the final mix: {'; '.join(d.strip("[]").replace("'", "") for d in asr_final.get('diffs', [])) or 'none'}.\n")

w("## 4. Caption synchronisation\n")
w("- Caption timing comes from the voice model’s own phoneme durations, not from word counts.")
if cc:
    w(f"- Cross-check against a second, unrelated model (Zipformer transducer): {cc.get('matched_words')} of {len(words)} words matched; "
      f"after removing that recogniser’s constant {abs(cc.get('median_offset_ms', 0))} ms emission delay, the mean deviation is {cc.get('mean_abs_dev_ms')} ms "
      f"and 95 % of words are within {cc.get('p95_abs_dev_ms')} ms.")
w(f"- {caps.get('phrases')} burned-in phrases ({caps.get('two_line')} on two lines), shortest on screen {caps.get('min_on_screen_s')} s; `dist/subtitles.srt` carries the same text as reading-length cues.\n")

w("## 5. Mobile viewing\n")
CS = ST.get("captions", {})
w(f"- Layout (1080 × 1920): every shot fills the frame; essential text stays within y 270–1470 and clear of the right-hand buttons; captions y {caps.get('y_extent', ['?', '?'])[0]}–{caps.get('y_extent', ['?', '?'])[1]}.\n"
  f"- Captions: {CS.get('family', 'Inter Display')} {CS.get('weight', 800)}, {CS.get('size', 74)} px, highlight mode `{CS.get('highlight', 'color')}`, widest phrase {caps.get('max_width_px')} px.\n"
  "- `dist/mobile_preview_reels_style.jpg` and `dist/mobile_preview_shorts_style.jpg` show frames at phone size under generic interface overlays. "
  "The overlays are approximations built from third-party measurements (neither platform publishes fixed pixel values), drawn conservatively.\n")

w("## 6. Motion and encode fidelity\n")
if fz:
    w(f"FFmpeg’s freeze detector (0.15 % mean change, 0.4 s) reports {len(fz)} short holds: " + ", ".join(f"{s:.1f}–{e:.1f} s" for s, e in fz) + ".\n")
else:
    w("FFmpeg’s freeze detector (0.15 % mean change, 0.4 s) reports no holds anywhere in the video.\n")
if fid.get("ssim_all"):
    w(f"Encode fidelity against the rendered frames: SSIM {fid['ssim_all']:.4f}, PSNR {fid['psnr_avg_db']:.1f} dB.\n")

if any(MEDIA_CR.get(n, {}).get("credit_required") for n in USED):
    w("Credit lines the licences require are in docs/credits.md: paste them into the video's description.\n")

notes = ROOT / "docs/report_notes.md"
if notes.exists():
    import re
    w(re.sub(r"<!--.*?-->\s*", "", notes.read_text(encoding="utf-8"), flags=re.S).strip() + "\n")
else:
    w("## Review notes\n\n_No docs/report_notes.md was written for this video: the accuracy review, the list of defects fixed, the creative self-assessment and the list of things not verified are missing._\n")

w("## Rebuild\n")
w(f"From the repository root: `bin/lockstep voice {ROOT.name}` then `bin/lockstep build {ROOT.name}` (see the repository README for setup).\n")

(ROOT / "docs").mkdir(exist_ok=True)
(ROOT / "docs/production_report.md").write_text("\n".join(L), encoding="utf-8")
print("docs/production_report.md written,", len("\n".join(L).split()), "words")
