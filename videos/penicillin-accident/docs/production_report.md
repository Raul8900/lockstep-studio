# Production Report — “The Accident That Saved Millions”

All figures in the numbered sections were measured on the delivered file by `engine/validate.py`; none are targets or estimates.

## 1. Deliverable

`penicillin_accident_vertical.mp4` — 112.6 MB, 68.00 s (1:08.0).

| Requirement | Measured | Result |
|---|---|---|
| 1080 × 1920, 9:16 portrait | 1080 × 1920, 9:16 | PASS |
| 30 fps or higher | 30 fps constant, 2040 frames | PASS |
| H.264 video | H264 High @ L4.2, yuv420p, bt709/bt709/bt709 tv, 12.98 Mbps | PASS |
| AAC audio | AAC-LC, 48 kHz, 2 ch, 266 kbps | PASS |
| MP4 container | MP4 (ISO BMFF), index at the front for streaming: yes | PASS |
| 90 s maximum | 68.00 s | PASS |
| Plays without error | full decode, 0 errors | PASS |
| No black frames | 0 black segments detected | PASS |
| Audio and picture in sync | narration lag inside the MP4: 0 ms | PASS |
| Complete, intelligible narration | 191 words; speech recognition on the final mix: 0.51 % word error (1 of 197 tokens once numbers are spelled out) | PASS |
| Burned-in captions | 69 phrases, 1–5 words each, within x [133, 947], y [1185, 1345] | PASS |

## 2. How it was made

| Stage | Method |
|---|---|
| Narration | 191 words, recorded with Kokoro-82M (Apache-2.0 neural TTS, voice `af_heart`, speed 1.15) running locally. |
| Word timing | Read from the voice model’s own phoneme durations: every word boundary is exact to one 25 ms model frame. |
| Pictures | 9 scenes of real photographs, film and 3D, composed on an HTML Canvas (3D by three.js); every frame is a pure function of time and of the narration’s word timings. |
| Rendering | Headless Chromium, 1080 × 1920 native, 2040 frames, each leaving the page as a JPEG (q 0.97). |
| Look | `penicillin-archive`: one colour grade for every picture; the reasoning behind it and the story is in docs/creative_brief.md. |
| Music | Original, synthesised at 100 BPM (synth kit), arranged per chapter from the moods in video.json, ending on a held major chord. |
| Sound design | 50 synthesised cues, emitted by the animation code at the same cue times as the visuals. |
| Media | 12 picture(s), clip(s) and model(s) from free sources: CC BY 2.0: mrsa; CC BY 4.0: fleming-dish, mould-plate, paper-1929, fleming-dish; Public domain: fleming-colour, florey, oxford-racks, extraction, cantaloupe, dday, fleming-painting. Every source, author and licence is in media/credits.json; the credit lines for the description are in docs/credits.md. |
| Mix | Voice lightly compressed and peak-controlled; bed ducked under speech; mastered to −14 LUFS with a look-ahead limiter. |
| Encode | FFmpeg libx264 (CRF, preset slow), BT.709 limited range, 2 s keyframe interval; AAC-LC 256 kbps. |

Versions: ffmpeg version 6.1.1-3ubuntu5 · Node v22.23.4 · Python 3.13.18

## 3. Audio

| Measure | Value |
|---|---|
| Integrated loudness | -14.0 LUFS (target −14) |
| True peak | -2.7 dBTP |
| Loudness range | 2.0 LU |
| Voice above music + effects while speaking | 17.2 dB |
| Music level in pauses vs. under speech | +4.3 dB (ducking) |
| Limiter gain reduction at mastering | 0.0 dB |
| Speaking pace | 200 wpm while speaking; 175 wpm including pauses |

## 4. Caption synchronisation

- Caption timing comes from the voice model’s own phoneme durations, not from word counts.
- Cross-check against a second, unrelated model (Zipformer transducer): 183 of 191 words matched; after removing that recogniser’s constant 120 ms emission delay, the mean deviation is 81 ms and 95 % of words are within 180 ms.
- 69 burned-in phrases (4 on two lines), shortest on screen 0.48 s; `dist/subtitles.srt` carries the same text as reading-length cues.

## 5. Mobile viewing

- Layout (1080 × 1920): every shot fills the frame; essential text stays within y 270–1470 and clear of the right-hand buttons; captions y 1185–1345.
- Captions: Poppins 800, 72 px, highlight mode `color`, widest phrase 814 px.
- `dist/mobile_preview_reels_style.jpg` and `dist/mobile_preview_shorts_style.jpg` show frames at phone size under generic interface overlays. The overlays are approximations built from third-party measurements (neither platform publishes fixed pixel values), drawn conservatively.

## 6. Motion and encode fidelity

FFmpeg’s freeze detector (0.15 % mean change, 0.4 s) reports no holds anywhere in the video.

Encode fidelity against the rendered frames: SSIM 0.9884, PSNR 46.3 dB.

Credit lines the licences require are in docs/credits.md: paste them into the video's description.

## Technical accuracy review

| On screen / spoken | Status |
|---|---|
| “In 1928 … came back from holiday to a pile of dirty dishes” | Britannica and Wikipedia (docs/sources.md); “dishes” = his culture plates. The exact day in September 1928 differs between accounts, so only the year is said |
| “A fuzzy mould had landed on it … the bacteria were dead” | as above. The plate on screen is a Penicillium culture (CC BY 4.0) with the bacteria drawn on as dots — Fleming's own plate is not available under a free licence |
| The burst: a wall rebuilt as the cell grows, jammed builders, cracks, burst | the standard mechanism (transpeptidase inhibition, lysis of growing cells); bricks and builders are a stated metaphor |
| “for ten years, almost nobody paid attention” | 1929 paper → Oxford work from 1939; a fair summary, not a claim that no one at all worked on it |
| Albert Alexander: dying policeman, better within days, supply ran out, penicillin recovered from his urine, died | Wikipedia, University of Oxford, Oxfordshire Blue Plaques. The rose-thorn story is left out (disputed). The ring gauge is illustrative, not a measured supply |
| “the best penicillin mould they ever found … a rotten cantaloupe from a market in Illinois” | The Scientist; USDA ARS. Who found it is disputed: no name is given |
| “By D-Day, there were millions of doses” | UW–Madison (“millions of doses”); no exact figure used |
| Fleming's warning about misuse and resistance | Nobel lecture 1945 via nobelprize.org |
| D-Day photograph | US troops approaching Omaha Beach, 6 June 1944 (public domain) |
| Oxford photographs | Imperial War Museum, “Penicillin: Past, Present and Future”, England, 1943 (public domain) — they show the work, not the 1941 patient |

## Defects found during QA and fixed

| Found | Cause | Fix |
|---|---|---|
| The year counted 1900 → 1928, showing “1926” while “1928” was said | a count-up on a year | the year pops in whole |
| Fleming's dish soft at 1.9× | a 1226 px photograph pushed in too far | zoom 1.45 |
| The dead zone on the plate unreadable | the ring and dots sized for a closer zoom | zoom 1.6, ring and dots resized |
| “10 years” invisible | white number on white paper | red, with its shadow |
| The arc to America invisible, Peoria off frame | a 1-pixel line; the camera too close for a portrait frame | a glowing tube drawn on by index range; camera pulled back |
| The 3D bacterium washed out, too close | too much light and bloom on pale bricks | darker light with a rim, coloured bricks, camera further back, smaller flash |
| Stamps hard to read on bright pictures (lint: low contrast) | coloured text and border alone | stamps now sit on a dark see-through plate |
| Two labels past the side margin (lint) | label anchored too far out | anchors moved in |

## Creative self-assessment

What works: a story with a turn every few seconds, every line on a real picture of the real thing,
the camera always moving, the 3D burst as the one physical metaphor, and the last line paying off
the first on the same photograph. Weakest: the plate shot (not Fleming's plate; the drawn bacteria
are a stand-in), the D-Day shot is short, and the Oxford shots show 1943 production rather than the
1941 ward. A second pass would look for a public-domain photograph of the Radcliffe Infirmary ward,
and could open on film rather than a still.

## What was not verified

Playback inside the Instagram and YouTube apps; loudness on real phones; whether the drawn
bacteria could be mistaken for part of the photograph by a viewer (they are styled as plain dots).

## Rebuild

From the repository root: `bin/lockstep voice penicillin-accident` then `bin/lockstep build penicillin-accident` (see the repository README for setup).
