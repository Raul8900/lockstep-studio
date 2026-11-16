# Production Report — “Your painkiller doesn't know where it hurts”

All figures in the numbered sections were measured on the delivered file by `engine/validate.py`; none are targets or estimates.

## 1. Deliverable

`how_painkillers_work_vertical.mp4` — 48.6 MB, 93.13 s (1:33.1).

| Requirement | Measured | Result |
|---|---|---|
| 1080 × 1920, 9:16 portrait | 1080 × 1920, 9:16 | PASS |
| 30 fps or higher | 30 fps constant, 2794 frames | PASS |
| H.264 video | H264 High @ L4.2, yuv420p, bt709/bt709/bt709 tv, 3.9 Mbps | PASS |
| AAC audio | AAC-LC, 48 kHz, 2 ch, 264 kbps | PASS |
| MP4 container | MP4 (ISO BMFF), index at the front for streaming: yes | PASS |
| 180 s maximum | 93.13 s | PASS |
| Plays without error | full decode, 0 errors | PASS |
| No black frames | 0 black segments detected | PASS |
| Audio and picture in sync | narration lag inside the MP4: 0 ms | PASS |
| Complete, intelligible narration | 224 words; speech recognition on the final mix: 0.0 % word error (0 of 226 tokens once numbers are spelled out) | PASS |
| Burned-in captions | 66 phrases, 1–5 words each, within x [151, 929], y [1260, 1440] | PASS |

## 2. How it was made

| Stage | Method |
|---|---|
| Narration | 224 words, recorded with Kokoro-82M (Apache-2.0 neural TTS, voice `af_heart`, speed 1.07) running locally. |
| Word timing | Read from the voice model’s own phoneme durations: every word boundary is exact to one 25 ms model frame. |
| Animation | 7 chapters drawn on an HTML Canvas; every frame is a pure function of time and of the narration’s word timings. |
| Rendering | Headless Chromium, 1080 × 1920 native, 2794 frames, each leaving the page as a JPEG (q 0.97). |
| Look | `anatomy-plate` (light theme); the reasoning behind it and the story shape is in docs/creative_brief.md. |
| Music | Original, synthesised at 108 BPM (pluck kit, transposed -2 semitones), arranged per chapter from the moods in video.json, ending on a held major chord. |
| Sound design | 43 synthesised cues, emitted by the animation code at the same cue times as the visuals. |
| Illustrations | 3 from Microsoft Fluent Emoji (MIT licence; line set, tint): brain, pill, warning. Credit: “Illustrations: Microsoft Fluent Emoji (MIT)”. |
| Mix | Voice lightly compressed and peak-controlled; bed ducked under speech; mastered to −14 LUFS with a look-ahead limiter. |
| Encode | FFmpeg libx264 (CRF, preset slow), BT.709 limited range, 2 s keyframe interval; AAC-LC 256 kbps. |

Versions: ffmpeg version 6.1.1-3ubuntu5 · Node v22.23.4 · Python 3.13.18

## 3. Audio

| Measure | Value |
|---|---|
| Integrated loudness | -14.1 LUFS (target −14) |
| True peak | -4.0 dBTP |
| Loudness range | 2.6 LU |
| Voice above music + effects while speaking | 21.7 dB |
| Music level in pauses vs. under speech | +6.1 dB (ducking) |
| Limiter gain reduction at mastering | 0.0 dB |
| Speaking pace | 176 wpm while speaking; 150 wpm including pauses |

The narration was transcribed back by an independent recogniser (Whisper small.en) on the clean voice track and on the finished mix: 0.0 % and 0.0 % word error. Differences on the final mix: none.

## 4. Caption synchronisation

- Caption timing comes from the voice model’s own phoneme durations, not from word counts.
- Cross-check against a second, unrelated model (Zipformer transducer): 204 of 224 words matched; after removing that recogniser’s constant 103 ms emission delay, the mean deviation is 79 ms and 95 % of words are within 198 ms.
- 66 burned-in phrases (26 on two lines), shortest on screen 0.5 s; `dist/subtitles.srt` carries the same text as reading-length cues.

## 5. Mobile viewing

- Layout zones (1080 × 1920): top 0–270 backdrop only; chapter bar y 286–340; diagrams y 372–1210; captions y 1260–1440; bottom 1470–1920 backdrop only.
- Captions: Fraunces 800, 74 px, highlight mode `underline`, widest phrase 778 px.
- `dist/mobile_preview_reels_style.jpg` and `dist/mobile_preview_shorts_style.jpg` show frames at phone size under generic interface overlays. The overlays are approximations built from third-party measurements (neither platform publishes fixed pixel values), drawn conservatively.

## 6. Motion and encode fidelity

FFmpeg’s freeze detector (0.15 % mean change, 0.4 s) reports 66 short holds: 0.5–1.0 s, 1.7–2.5 s, 2.8–3.5 s, 4.4–5.6 s, 7.4–7.9 s, 9.1–9.6 s, 10.8–11.4 s, 11.6–12.0 s, 12.3–13.3 s, 15.2–16.0 s, 17.1–17.5 s, 19.0–19.6 s, 21.5–21.9 s, 23.3–23.7 s, 26.6–27.4 s, 27.9–29.0 s, 29.0–29.4 s, 30.5–31.1 s, 31.4–31.8 s, 31.9–32.3 s, 32.3–33.3 s, 35.1–35.5 s, 36.0–36.5 s, 36.6–37.1 s, 37.1–38.0 s, 42.5–43.2 s, 44.0–44.7 s, 45.1–46.0 s, 46.7–47.1 s, 47.4–48.3 s, 48.9–50.0 s, 50.2–50.7 s, 50.7–51.3 s, 51.5–51.9 s, 51.9–52.6 s, 52.8–53.4 s, 53.6–54.7 s, 55.2–55.8 s, 55.9–56.7 s, 57.4–58.2 s, 58.4–58.9 s, 59.2–60.0 s, 60.1–60.9 s, 61.2–62.0 s, 63.6–64.0 s, 64.5–65.3 s, 66.0–66.5 s, 66.7–67.7 s, 68.0–68.6 s, 68.7–69.8 s, 70.0–70.8 s, 72.4–72.8 s, 72.8–73.6 s, 75.0–75.5 s, 75.5–76.3 s, 76.7–77.2 s, 77.4–77.9 s, 78.2–78.7 s, 79.3–80.0 s, 82.1–83.0 s, 84.0–84.4 s, 84.9–85.3 s, 86.1–86.9 s, 87.1–87.5 s, 88.5–88.9 s, 89.0–89.8 s.

Encode fidelity against the rendered frames: SSIM 0.9978, PSNR 55.1 dB.

## Technical accuracy review

| On screen / spoken | Status |
|---|---|
| _claim_ | _how it was checked; which source; any labelled simplification_ |

## Defects found during QA and fixed

| Found | Cause | Fix |
|---|---|---|
| | | |

## Creative self-assessment

_What works, what is weakest, what a second pass would change. Be specific and honest._

## What was not verified

_Anything that could not be measured or checked here (for example: playback inside the platform apps, real-device loudness)._

## Rebuild

From the repository root: `bin/lockstep voice how-painkillers-work` then `bin/lockstep build how-painkillers-work` (see the repository README for setup).
