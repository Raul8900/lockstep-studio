# Production Report — “Why a Torn QR Code Still Scans”

All figures in the numbered sections were measured on the delivered file by `engine/validate.py`; none are targets or estimates.

## 1. Deliverable

`torn_qr_code_vertical.mp4` — 61.1 MB, 92.67 s (1:32.7).

| Requirement | Measured | Result |
|---|---|---|
| 1080 × 1920, 9:16 portrait | 1080 × 1920, 9:16 | PASS |
| 30 fps or higher | 30 fps constant, 2780 frames | PASS |
| H.264 video | H264 High @ L4.2, yuv420p, bt709/bt709/bt709 tv, 5.0 Mbps | PASS |
| AAC audio | AAC-LC, 48 kHz, 2 ch, 262 kbps | PASS |
| MP4 container | MP4 (ISO BMFF), index at the front for streaming: yes | PASS |
| 120 s maximum | 92.67 s | PASS |
| Plays without error | full decode, 0 errors | PASS |
| No black frames | 0 black segments detected | PASS |
| Audio and picture in sync | narration lag inside the MP4: 0 ms | PASS |
| Complete, intelligible narration | 240 words; speech recognition on the final mix: 1.22 % word error (3 of 246 tokens once numbers are spelled out) | PASS |
| Burned-in captions | 77 phrases, 1–5 words each, within x [149, 931], y [1260, 1440] | PASS |

## 2. How it was made

| Stage | Method |
|---|---|
| Narration | 240 words, recorded with Kokoro-82M (Apache-2.0 neural TTS, voice `af_bella`, speed 1.08) running locally. |
| Word timing | Read from the voice model’s own phoneme durations: every word boundary is exact to one 25 ms model frame. |
| Animation | 7 chapters drawn on an HTML Canvas; every frame is a pure function of time and of the narration’s word timings. |
| Rendering | Headless Chromium, 1080 × 1920 native, 2780 frames, each leaving the page as a JPEG (q 0.97). |
| Look | `riso-sticker` (light theme); the reasoning behind it and the story shape is in docs/creative_brief.md. |
| Music | Original, synthesised at 108 BPM (pluck kit, transposed +2 semitones), arranged per chapter from the moods in video.json, ending on a held major chord. |
| Sound design | 129 synthesised cues, emitted by the animation code at the same cue times as the visuals. |
| Mix | Voice lightly compressed and peak-controlled; bed ducked under speech; mastered to −14 LUFS with a look-ahead limiter. |
| Encode | FFmpeg libx264 (CRF, preset slow), BT.709 limited range, 2 s keyframe interval; AAC-LC 256 kbps. |

Versions: ffmpeg version 6.1.1-3ubuntu5 · Node v22.23.4 · Python 3.13.18

## 3. Audio

| Measure | Value |
|---|---|
| Integrated loudness | -14.0 LUFS (target −14) |
| True peak | -2.3 dBTP |
| Loudness range | 2.3 LU |
| Voice above music + effects while speaking | 16.4 dB |
| Music level in pauses vs. under speech | +3.8 dB (ducking) |
| Limiter gain reduction at mastering | 0.0 dB |
| Speaking pace | 191 wpm while speaking; 161 wpm including pauses |

The narration was transcribed back by an independent recogniser (Whisper small.en) on the clean voice track and on the finished mix: 0.81 % and 1.22 % word error. Differences on the final mix: reed -> read; percent -> ∅; percent -> ∅.

## 4. Caption synchronisation

- Caption timing comes from the voice model’s own phoneme durations, not from word counts.
- Cross-check against a second, unrelated model (Zipformer transducer): 224 of 240 words matched; after removing that recogniser’s constant 115 ms emission delay, the mean deviation is 82 ms and 95 % of words are within 185 ms.
- 77 burned-in phrases (6 on two lines), shortest on screen 0.4 s; `dist/subtitles.srt` carries the same text as reading-length cues.

## 5. Mobile viewing

- Layout zones (1080 × 1920): top 0–270 backdrop only; chapter bar y 286–340; diagrams y 372–1210; captions y 1260–1440; bottom 1470–1920 backdrop only.
- Captions: Archivo 800, 76 px, highlight mode `box`, widest phrase 781 px.
- `dist/mobile_preview_reels_style.jpg` and `dist/mobile_preview_shorts_style.jpg` show frames at phone size under generic interface overlays. The overlays are approximations built from third-party measurements (neither platform publishes fixed pixel values), drawn conservatively.

## 6. Motion and encode fidelity

FFmpeg’s freeze detector (0.15 % mean change, 0.4 s) reports no holds anywhere in the video.

Encode fidelity against the rendered frames: SSIM 0.9960, PSNR 51.2 dB.

## Technical accuracy review

Every scan claim in the video was checked on a real QR code with a real decoder, first on the model
(`tools/qr_model.py`) and then on frames taken from the finished MP4 (`tools/verify_frames.py`, results
in `tools/verify_frames.json`).

| On screen / spoken | Status |
|---|---|
| The hero code says “STILL HERE” and still scans after the tear | The code is a real version-1-H code (segno). Torn exactly as drawn, it decodes with zxing-cpp from the MP4's own frames (cover, “It still scans”, payoff, end card). |
| “Most of it isn't your message” / 9 message bytes, 17 check bytes, 26 bytes | Version 1-H tables (sources 2) and the code itself: the 17 check bytes recomputed independently with reedsolo match the code byte for byte. Message bytes are 35 % of the bytes and 16 % of the area. |
| “Copies can't tell you” (which copy is right) | Reasoning, not a measurement: two copies that differ have no majority. Labelled as the obvious first guess, not as anything QR codes do. |
| “Reed–Solomon codes, from 1960” | Reed & Solomon, *J. SIAM* 8(2), 1960; MIT Lincoln Laboratory (sources 5, 6). |
| Two dots fix exactly one line; the survivors redraw it; the liar is the dot off the line | Interpolation (any k points fix a polynomial of degree < k) and its consequence for one wrong point among four collinear ones — checked by hand for the drawn values 2, 4, 6, 8 → 7: only {4, 6, 8} are collinear. |
| “A scanner can't see holes” | zxing-cpp's QR decoder passes no erasure positions to its Reed–Solomon decoder (sources 3); torn areas read as ordinary light modules. |
| “Every liar costs two extra dots: one finds it, one fixes it” | 2t ≤ n − k (sources 9); “find / fix” = each error's two unknowns, position and value — a standard simplification. |
| “It can fix any eight. About thirty percent.” “ANY 8 OF 26 ≈ 30%” | 17 check bytes → 8 errors (floor(17/2), also the standard's figure with one misdecode-protection byte); measured with zxing-cpp: 8 wrong codewords always decoded, 9 never did. 8/26 = 30.8 %. |
| “That's why a logo can sit in the middle. It's damage, on purpose.” | A blank 7 × 7-module plate decodes in the model; the drawn plate (white with a pink cup icon) decodes from the MP4 frame. |
| “Thirty percent of the bytes, not of the paper” / “BYTES = 47% OF THIS CODE” | 208 of 441 modules carry codewords (47.2 %). |
| “These three corner squares aren't protected at all… Tear into one, and this code won't scan.” | Finder patterns are function modules, not codewords (sources 2). A 1.3 % tear through one changes no codeword and the code no longer decodes — in the model and in the MP4 frame. Worded “this code” because it was tested with one decoder. |
| “It took six of the nine message bytes” | The hero tear changes codewords 0, 1, 2, 4, 5, 6 (message) and 11 (check) in the model; the module grid sampled from the MP4 frame is compared in `tools/verify_frames.json`. |
| “The extra points rebuilt every one” | The torn frame decodes to the full message. |
| “SAME RULE · BYTE ARITHMETIC · NO PICTURE” | Real QR codes compute in GF(256); the straight line is the analogy, and the screen says where it stops being literal. |

## Defects found during QA and fixed

| Found | Cause | Fix |
|---|---|---|
| “tear” spoken as “tier” twice (check-voice) | the voice model read the noun as the teardrop word | phoneme override `[tear](/tˈɛɹ/)` |
| “one to find it, one to fix it” transcribed as “want to find it…” | “one to” runs together at this speed | reworded: “one finds it, one fixes it” |
| First tear shape did not decode (9 codewords changed) | tear too deep into the message columns | searched shapes with zxing-cpp; chose one that changes 7 (6 message + 1 check) and decodes |
| The liar dot started at 7 instead of 2 | `E.outBack(0)` returns a tiny positive float, so a `> 0` test fired before the cue | test the time instead of the eased value |
| “1 LIAR = 2 EXTRA DOTS” ran through the line and dot 8 | placed in the card's top-left, where the line passes | moved to the empty lower-right of the card |
| Candidate lines spilled out of the graph card | no clip | content clipped to the card |
| Graph card empty for about a second after the slide | first dots tied to “two … numbers” | first dots on “say … message” |
| The smudge hid the red A that the shot is about | smudge drawn over the letters | drawn under them, lighter |
| Copy cards sat high, lower frame empty | layout | cards enlarged and lowered |
| “9 · YOUR MESSAGE” and “17 · EXTRA POINTS” overlapped | anchored to the sticker's edges | one centred line |
| Byte bricks hard to read | sticker 550 px | 625 px (25 px modules) |
| End-card headline outside the safe margins | 58 px over the full width | 50 px |

## Creative self-assessment

_Written after the final build — see below._

## What was not verified

- I cannot listen. The mix was judged by measurement (loudness, true peak, voice-to-bed ratio) and by
  speech recognition on the clean voice and on the final mix, not by ear.
- Scanning was tested with one decoder (zxing-cpp, the C++ port of ZXing) on frames from the MP4, not
  with phone camera apps pointed at a screen; phones may differ, especially on the corner-square tear.
- The ISO/IEC 18004 text, Denso Wave's pages and the Thonky tutorial could not be opened from this
  machine (network policy); their facts were taken from search excerpts and confirmed against two
  open-source implementations and direct measurement.
- Playback inside the Instagram and YouTube apps was not checked; the mobile previews are approximations.

## Rebuild

From the repository root: `bin/lockstep voice torn-qr-code` then `bin/lockstep build torn-qr-code` (see the repository README for setup).
