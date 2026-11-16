"""Print the verdict for a finished build from data/validation.json.

  python3 engine/summary.py <video-dir>

Exit status 0 only if every hard requirement passes. Items marked "check" need a human
(or the agent) to look at the named output; they do not fail the build by themselves.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import load_config, need, project_dir  # noqa: E402

ROOT = project_dir()
CFG = load_config(ROOT)
V = json.load(open(need(ROOT / "data/validation.json", "run: lockstep validate <video>")))
TL = json.load(open(ROOT / "data/timeline.json"))
MAX_S = float(CFG.get("max_seconds", 180))
f, v, a, lo = V["file"], V["video"], V["audio"], V["loudness"]
rows, failed = [], 0


def row(name, ok, detail):
    global failed
    if ok is False:
        failed += 1
    rows.append(("PASS" if ok is True else "FAIL" if ok is False else "check", name, detail))


row("1080 x 1920, 9:16", v["width"] == 1080 and v["height"] == 1920, f"{v['width']} x {v['height']}")
row("30 fps, all frames present", v["fps"] == 30 and v["frames"] == TL["total"], f"{v['fps']:.0f} fps, {v['frames']} of {TL['total']} frames")
row("H.264 + AAC in MP4", v["codec"] == "h264" and a["codec"] == "aac", f"{v['codec']} {v['profile']} / {a['codec']} {a['sample_rate']} Hz")
row("streamable (index first)", bool(f.get("faststart")), "faststart" if f.get("faststart") else "moov atom is at the end")
row(f"length <= {MAX_S:.0f} s", f["duration_s"] <= MAX_S, f"{f['duration_s']:.2f} s")
row("decodes cleanly", V["decode_errors"] == 0, f"{V['decode_errors']} errors")
row("no black frames", not V["black_segments"], f"{len(V['black_segments'])} segments " + str(V["black_segments"][:4] if V["black_segments"] else ""))
lag = V["sync"].get("narration_lag_ms_in_mp4", V["sync"].get("music_lag_ms_in_mp4", 0))
row("audio/picture sync", None if lag is None else abs(lag) <= 20, 'inapplicable: silent track' if lag is None else f"{lag:+d} ms")
if "stream_duration_error_s" in V:
    tolerance = .05 if CFG.get('choices') or CFG.get('clock') or CFG.get('audio') else .1
    row("stream durations agree", V["stream_duration_error_s"] <= tolerance, f"{V['stream_duration_error_s']:.3f} s difference")
if lo.get('meaningful') is False:
    intentional = CFG.get('clock', {}).get('mode') == 'music' and CFG.get('music', {}).get('source') == 'none' and CFG.get('audio', {}).get('effects') == 'none' and not CFG.get('audio', {}).get('stems')
    row('intentional silent soundtrack', intentional, 'loudness/peak inapplicable' if intentional else 'unexpected silent output')
else:
    row("loudness -14 LUFS +/- 1", abs(lo["integrated_lufs"] + 14) <= 1.0, f"{lo['integrated_lufs']} LUFS")
    row("true peak <= -1 dBTP", lo["true_peak_dbtp"] <= -1.0, f"{lo['true_peak_dbtp']} dBTP")
caps = V.get("captions")
if caps:
    row("captions inside safe width", caps["x_extent"][0] >= 60 and caps["x_extent"][1] <= 1020, f"x {caps['x_extent']}, widest {caps['max_width_px']} px")
    row("captions readable", None if caps["min_on_screen_s"] < 0.35 or caps["max_words"] > 5 else True,
        f"shortest on screen {caps['min_on_screen_s']} s, longest {caps['max_words']} words")
fid = V.get("encode_fidelity") or {}
if fid.get("ssim_all"):
    row("encode fidelity", fid["ssim_all"] >= 0.98, f"SSIM {fid['ssim_all']:.4f}")
asr = V.get("final_mix_asr", {})
if "wer_percent" in asr:
    # under 3 % passes; in a very short script one misheard word is already 3 %, so 1-2 differences are flagged to listen to, not failed
    verdict = True if asr["wer_percent"] < 3.0 else None if asr["errors"] <= 2 else False
    row("voice intelligible in the mix", verdict, f"{asr['wer_percent']} % word error ({asr['errors']} of {asr['words']})" + (f"  {asr['diffs']}" if asr.get("diffs") else ""))
else:
    if CFG.get("clock", {}).get("mode") == "music":
        row("no invented speech/captions", not TL["caps"], "music clock; speech metrics inapplicable")
    else:
        row("voice intelligible in the mix", None, "not measured: " + str(asr.get("skipped") or asr.get("error") or "unavailable")[:90])
fz = V.get("freeze_segments", [])
row("continuous motion", None if fz else True, "no holds" if not fz else f"{len(fz)} static holds: " + ", ".join(f"{s:.1f}-{e:.1f}s" for s, e in fz[:8]))

print()
print(f"  {Path(f['path']).name}   {f['duration_s']:.2f} s   {f['size_mb']} MB   {v['bitrate_mbps']} Mbps")
for st, name, detail in rows:
    print(f"  {st:<5} {name:<30} {detail}")
print()
if failed:
    print(f"  {failed} requirement(s) FAILED — this is not a finished video yet.")
else:
    notes = sum(1 for r in rows if r[0] == "check")
    print("  all hard requirements pass" + (f"; {notes} item(s) to look at above." if notes else "."))
    print(f"  next: look at {ROOT.name}/dist/contact_sheet.jpg and the mobile previews before calling it done.")
sys.exit(1 if failed else 0)
