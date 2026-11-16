# Production Report — “The 'I'm not a robot' box”

All figures in the numbered sections were measured on the delivered file by `engine/validate.py`; none are targets or estimates.

## 1. Deliverable

`captcha_checkbox_vertical.mp4` — 111.5 MB, 163.73 s (2:43.7).

| Requirement | Measured | Result |
|---|---|---|
| 1080 × 1920, 9:16 portrait | 1080 × 1920, 9:16 | PASS |
| 30 fps or higher | 30 fps constant, 4912 frames | PASS |
| H.264 video | H264 High @ L4.2, yuv420p, bt709/bt709/bt709 tv, 5.18 Mbps | PASS |
| AAC audio | AAC-LC, 48 kHz, 2 ch, 265 kbps | PASS |
| MP4 container | MP4 (ISO BMFF), index at the front for streaming: yes | PASS |
| 180 s maximum | 163.73 s | PASS |
| Plays without error | full decode, 0 errors | PASS |
| No black frames | 0 black segments detected | PASS |
| Audio and picture in sync | narration lag inside the MP4: 0 ms | PASS |
| Complete, intelligible narration | 405 words; speech recognition on the final mix: 5.81 % word error (24 of 413 tokens once numbers are spelled out) | **FAIL** |
| Burned-in captions | 140 phrases, 1–5 words each, within x [149, 931], y [1260, 1440] | PASS |

## 2. How it was made

| Stage | Method |
|---|---|
| Narration | 405 words, recorded with Kokoro-82M (Apache-2.0 neural TTS, voice `af_heart`, speed 1.00) running locally. |
| Word timing | Read from the voice model’s own phoneme durations: every word boundary is exact to one 25 ms model frame. |
| Animation | 9 chapters drawn on an HTML Canvas; every frame is a pure function of time and of the narration’s word timings. |
| Rendering | Headless Chromium, 1080 × 1920 native, 4912 frames, each leaving the page as a JPEG (q 0.97). |
| Music | Original, synthesised: pads, bass, arpeggio, soft kick and hats at 100 BPM, arranged per chapter, ending on a held major chord. |
| Sound design | 124 synthesised cues, emitted by the animation code at the same cue times as the visuals. |
| Mix | Voice lightly compressed and peak-controlled; bed ducked under speech; mastered to −14 LUFS with a look-ahead limiter. |
| Encode | FFmpeg libx264 (CRF, preset slow), BT.709 limited range, 2 s keyframe interval; AAC-LC 256 kbps. |

Versions: ffmpeg version 6.1.1-3ubuntu5 · Node v22.23.4 · Python 3.13.18

## 3. Audio

| Measure | Value |
|---|---|
| Integrated loudness | -14.0 LUFS (target −14) |
| True peak | -2.6 dBTP |
| Loudness range | 2.6 LU |
| Voice above music + effects while speaking | 18.2 dB |
| Music level in pauses vs. under speech | +5.4 dB (ducking) |
| Limiter gain reduction at mastering | 0.0 dB |
| Speaking pace | 176 wpm while speaking; 152 wpm including pauses |

The narration was transcribed back by an independent recogniser (Whisper small.en) on the clean voice track and on the finished mix: 6.05 % and 5.81 % word error. Differences on the final mix: twenty -> two thousand; twenty -> two thousand; twenty -> two thousand; nineteen -> one thousand nine hundred; twenty -> two thousand; twenty -> two thousand; point five -> 5; twenty -> two thousand; ∅ -> zero, percent -> ∅; twenty -> two thousand, thirty -> three thousand.

## 4. Caption synchronisation

- Caption timing comes from the voice model’s own phoneme durations, not from word counts.
- Cross-check against a second, unrelated model (Zipformer transducer): 371 of 405 words matched; after removing that recogniser’s constant 120 ms emission delay, the mean deviation is 82 ms and 95 % of words are within 192 ms.
- 140 burned-in phrases (12 on two lines), shortest on screen 0.45 s; `dist/subtitles.srt` carries the same text as reading-length cues.

## 5. Mobile viewing

- Layout zones (1080 × 1920): top 0–270 backdrop only; chapter bar y 286–340; diagrams y 372–1210; captions y 1260–1440; bottom 1470–1920 backdrop only.
- Captions: 74 px ExtraBold with a 15 px outline, widest phrase 781 px.
- `dist/mobile_preview_reels_style.jpg` and `dist/mobile_preview_shorts_style.jpg` show frames at phone size under generic interface overlays. The overlays are approximations built from third-party measurements (neither platform publishes fixed pixel values), drawn conservatively.

## 6. Motion and encode fidelity

FFmpeg’s freeze detector (0.15 % mean change, 0.4 s) reports 59 short holds: 2.0–2.5 s, 4.2–4.7 s, 6.0–6.4 s, 11.4–11.8 s, 13.4–13.8 s, 19.5–20.0 s, 20.4–20.8 s, 21.0–21.6 s, 28.0–28.5 s, 32.5–32.9 s, 34.7–35.1 s, 38.7–39.3 s, 44.6–45.1 s, 46.5–47.2 s, 49.3–49.7 s, 50.0–50.6 s, 52.0–52.5 s, 54.0–54.8 s, 58.0–58.6 s, 63.3–63.8 s, 66.0–66.5 s, 66.9–67.4 s, 68.5–69.1 s, 77.6–78.0 s, 80.0–80.4 s, 83.5–83.9 s, 85.2–85.7 s, 88.3–88.7 s, 90.5–91.1 s, 92.7–93.1 s, 93.2–93.6 s, 94.0–94.4 s, 95.2–95.7 s, 97.0–97.4 s, 98.8–99.4 s, 100.0–100.4 s, 100.6–101.0 s, 102.0–102.5 s, 112.1–112.7 s, 112.7–113.1 s, 114.8–115.3 s, 117.3–117.9 s, 120.0–120.4 s, 122.0–122.6 s, 124.0–124.5 s, 132.3–132.8 s, 133.3–133.7 s, 134.5–135.0 s, 136.8–137.2 s, 138.6–139.0 s, 140.7–141.3 s, 144.0–144.4 s, 146.0–146.5 s, 147.5–148.0 s, 154.2–154.7 s, 158.3–158.8 s, 160.6–161.2 s, 161.2–162.0 s, 162.0–163.1 s.

Encode fidelity against the rendered frames: SSIM 0.9954, PSNR 52.5 dB.

## Technical accuracy review

How the claims were checked: every number and factual claim traces to `docs/sources.md`. The full
pages could not be opened in this session (a page fetch was refused by the session's permission
check), so every claim was checked against search-engine excerpts of the page or paper, not full
text. Rows marked "excerpt" below are in that state. Rows marked "paraphrase" are the excerpt's
wording, not the page's.

| On screen / spoken | Status |
|---|---|
| "In 2013, Google said its risk analysis covers everything you do around a challenge" | Excerpt of Google's 2013 post (paraphrase). Labelled as Google's description. |
| "In 2014, the checkbox arrived, and many people passed with one click" | Excerpt of Google's 2014 launch post (paraphrase). |
| "If it can't tell, you get a puzzle" | Excerpt of the 2014 post (falls back to a puzzle when unsure) and of a 2021 survey. |
| "Google doesn't publish the full list" / "Google doesn't say" | No full signal list or weights found in the excerpts of Google's pages. Stated as not published by Google. |
| "A 2021 survey describes the checkbox recording cursor movement, where you click, and how long the pointer hovers" | Survey's description (secondhand). On screen: "SURVEY'S DESCRIPTION, NOT GOOGLE". |
| "Google's own FAQ calls a cookie essential" | FAQ excerpt (paraphrase): the `_GRECAPTCHA` cookie is essential and supports the risk analysis. |
| "Version three has no checkbox" / "one means very likely a good interaction, zero means very likely a bot" | v3 documentation excerpt; the quoted phrasing was confirmed in the excerpt. |
| "Google suggests starting at point five" | v3 documentation excerpt (starting cutoff 0.5). Labelled "sites tune their own". |
| "A real hand never moves at one steady speed … a smooth, bell-shaped curve of speed" / "In 1985, Flash and Hogan modeled" | Citation confirmed in several later reference lists; the 1985 paper itself was not read. The bell profile is attributed to this work by a later J Neurosci paper. Presented as a model of human reaching, not as a claim about reCAPTCHA. |
| "One published detector checks cursor paths against a model like that" | Abstract excerpt of BeCAPTCHA-Mouse. On screen: "TRAINED ON PUZZLE DRAGS". The name is shown on screen, not spoken. |
| "In a 2024 study of reCAPTCHA version two, any cursor movement cut the number of puzzles needed to pass" | Excerpts of the paper's tables and text. On screen: "ILLUSTRATIVE, NOT TO SCALE" for the two-column picture. |
| "Straight paths and curved ones were not significantly different" (p = 0.57) | Same paper, from the excerpt (t = 0.58, p = 0.57). Not checked in the full PDF. |
| "A 2024 study reports that cookies and browsing history carry substantial weight" | The authors' own report, from the excerpt. On screen: "REPORTED BY RESEARCHERS". |
| "Browsing history is what researchers report. Google hasn't confirmed it." | No Google statement confirming browsing history was found in the excerpts checked. On screen: "GOOGLE: NOT CONFIRMED". |
| "In 2019, researchers trained an AI agent … a score of point nine about ninety-seven percent of the time" | Abstract excerpt (97.4% on a 100 × 100 grid, 96.7% on 1000 × 1000). On screen: "SIMULATOR, NOT THE LIVE SITE". |
| "A 2023 study ran for thirteen months with more than thirty-six hundred people" | Abstract excerpt (13-month live study, more than 3,600 participants, one large public university). |
| "Its authors judged the checkbox costly, with close to no security gain, and say it should be retired" | The authors' own judgement, from the abstract excerpt. On screen: "THE AUTHORS' VIEW". |

Numbers on screen, all traced in `docs/sources.md`: 2013, 2014, 2019, 2021, 2023, 2024, 1985 (dates);
0.0 to 1.0 and 0.5 (the v3 scale and suggested cutoff); about 97% and 97.4% / 96.7% (simulator);
3,600+ and 13 months (study); p = 0.57 (2024 paper). "13 MONTHS" and "3,600+" are the study's figures.

Simplifications, stated on screen where they matter: the checkbox is reCAPTCHA v2's widget and v3 is
shown as a score with no checkbox; Google's list of signals and their weights is described as not
published; "wobble" is shown as a question, because no source measures micro-wobble and the 2024
test found that the movement mattered and the path's shape did not.

## Defects found during QA and fixed

Found by reading the contact sheets and full-size stills, and by `scan` and `meta`.

| Found | Cause | Fix |
|---|---|---|
| The signal ring crossed the headline "AROUND THE CHALLENGE" (old-test scene) | Ring radius and headline position were set independently | Card moved to the centre line; ring radius reduced; headline placed above the ring |
| The crossed-out checkbox stayed on screen for the rest of the score scene, over the scale | The cross was drawn at constant progress, not faded | The cross fades out with the box, before the scale appears |
| "NO CHECKBOX" stayed on screen beside "ABOUT 97%" | The label had no end | Fades out before the score scale |
| "VERSION 3" overlapped "2019" (simulator section) | Two headlines at the same position | The version headline fades before the simulator section |
| "START 0.5" overlapped "EACH SITE SETS ITS OWN" | Both at the same height | Labels separated; the cutoff labels now have their own window |
| The cutoff labels came back during the "point nine" section | They were gated by the scale's visibility | Gated to their own window, from the checkbox to "but" |
| A nearly empty frame at the score section's handoff (about 121 s) | The simulator faded in after the scale had gone | The two fades now overlap |
| "THE TEST" label was clipped at the left edge (takeaway scene) | Label centred on a point too far left | Left-aligned to the right of the path |
| "HOW YOU GOT THERE" ran almost edge to edge | 88 px headline | Reduced to 72 px |
| The recogniser heard "reCAPTCHA" as "Ray Capcha" | Default reading of the brand name | IPA override on the narration (check-voice now matches it) |
| The recogniser heard "BeCAPTCHA-Mouse" as "B-CAP Shemouse" | Unfamiliar compound name | The narration says "one published detector"; the name appears on screen as a labelled caveat |
| "a researchers' finding" (ungrammatical) | Script wording | "what researchers report" |
| "rise and fall in speed" heard as "fallen speed" | Phrasing | "a smooth, bell-shaped curve of speed" |
| "want it retired" heard as "wanted retired" | "it" dropped by the voice | "say it should be retired" |
| A continuity gap of 0.2 s at the score section's start in the storyboard | Boundary written from a different cue | Corrected; the docs step reports no continuity gaps |
| A source attributed to a "2016 study" and a robot-arm anecdote presented as fooling reCAPTCHA | Careless summary in the research notes | Corrected in `docs/sources.md`; a duplicate uncertain bullet removed |

## Creative self-assessment

What works: the hook's picture (the trail already lit before the tap, labelled "STARTED HERE") makes
the claim visible in the first second; the bell-shaped speed curve and the steady line are a clear
picture of one idea; the verdict branches (PASS and PUZZLE) show the outcome without numbers; the
simulator's "NOT THE LIVE SITE" caveat and the coral "NOT CONFIRMED" stamp keep the claims honest on screen.

What is weakest: the browser chapter is abstract (a meter and a person icon stand for "weight" and
"seems human"); the takeaway's lower third is nearly empty (only the trail remains); the two-column
puzzle comparison is an illustration and reads as data at a glance; the "wobble" chapter is text-led;
the simulator grid is faint on a phone; the dot field for 3,600 people is dim until it fills.

A second pass would: read the full texts of the Google pages and the three papers and correct any
wording that differs; give "a score built from many signals" its own picture, since it is the claim
the viewer most needs; fill the takeaway's lower third; check the simulator grid's contrast at phone size.

## What was not verified

- Full texts of Google's pages and of the papers. Every claim was checked against search excerpts. A
  page fetch was refused by the session's permission check, so the wording of the 2013 and 2014
  posts, the v3 documentation and the FAQ is paraphrased and needs checking.
- The voice, music, sound design and mix were not heard. They were checked by measurement only
  (loudness, speech-to-bed ratio, sync) and by a speech recogniser transcribing the narration back.
- Playback inside the phone apps: the safe-zone shading and the mobile previews are approximations,
  because neither platform publishes exact pixels.
- Whether the 2019 simulator result or the 2024 study holds for today's reCAPTCHA. The video
  presents both as what the studies found, and labels the simulator as a simulator.
- Micro-wobble as a measured feature. No source establishes it, and the video says Google does not say.

## Rebuild

From the repository root: `bin/lockstep voice captcha-checkbox` then `bin/lockstep build captcha-checkbox` (see the repository README for setup).
