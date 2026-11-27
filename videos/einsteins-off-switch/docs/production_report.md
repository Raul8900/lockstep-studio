# Production Report — “Einstein's Off Switch”

All figures in the numbered sections were measured on the delivered file by `engine/validate.py`; none are targets or estimates.

## 1. Deliverable

`einsteins_off_switch_vertical.mp4` — 98.8 MB, 85.87 s (1:25.9).

| Requirement | Measured | Result |
|---|---|---|
| 1080 × 1920, 9:16 portrait | 1080 × 1920, 9:16 | PASS |
| 30 fps or higher | 30 fps constant, 2576 frames | PASS |
| H.264 video | H264 High @ L4.2, yuv420p, bt709/bt709/bt709 tv, 8.93 Mbps | PASS |
| AAC audio | AAC-LC, 48 kHz, 2 ch, 265 kbps | PASS |
| MP4 container | MP4 (ISO BMFF), index at the front for streaming: yes | PASS |
| 100 s maximum | 85.87 s | PASS |
| Plays without error | full decode, 0 errors | PASS |
| No black frames | 0 black segments detected | PASS |
| Audio and picture in sync | narration lag inside the MP4: 0 ms | PASS |
| Complete, intelligible narration | 225 words; speech recognition on the final mix: 2.58 % word error (6 of 233 tokens once numbers are spelled out) | PASS |
| Burned-in captions | 88 phrases, 1–5 words each, within x [140, 940], y [1185, 1345] | PASS |

## 2. How it was made

| Stage | Method |
|---|---|
| Narration | 225 words, recorded with Kokoro-82M (Apache-2.0 neural TTS, voice `af_heart`, speed 1.15) running locally. |
| Word timing | Read from the voice model’s own phoneme durations: every word boundary is exact to one 25 ms model frame. |
| Pictures | 7 scenes of real photographs, film and 3D, composed on an HTML Canvas (3D by three.js); every frame is a pure function of time and of the narration’s word timings. |
| Rendering | Headless Chromium, 1080 × 1920 native, 2576 frames, each leaving the page as a JPEG (q 0.97). |
| Look | `orbit-gold`: one colour grade for every picture; the reasoning behind it and the story is in docs/creative_brief.md. |
| Music | Original, synthesised at 96 BPM (deep kit, transposed -2 semitones), arranged per chapter from the moods in video.json, ending on a held major chord. |
| Sound design | 77 synthesised cues, emitted by the animation code at the same cue times as the visuals. |
| Mix | Voice lightly compressed and peak-controlled; bed ducked under speech; mastered to −14 LUFS with a look-ahead limiter. |
| Encode | FFmpeg libx264 (CRF, preset slow), BT.709 limited range, 2 s keyframe interval; AAC-LC 256 kbps. |

Versions: ffmpeg version 6.1.1-3ubuntu5 · Node v22.23.5 · Python 3.13.18

## 3. Audio

| Measure | Value |
|---|---|
| Integrated loudness | -14.0 LUFS (target −14) |
| True peak | -2.7 dBTP |
| Loudness range | 2.6 LU |
| Voice above music + effects while speaking | 17.1 dB |
| Music level in pauses vs. under speech | +5.7 dB (ducking) |
| Limiter gain reduction at mastering | 0.0 dB |
| Speaking pace | 192 wpm while speaking; 162 wpm including pauses |

Pacing per beat (`lockstep pacing`): the time each beat has on screen, how fast it is spoken and how long the voice is silent in it (held, pauses of 0.6 s or more).

```
  beat             from      to  length  words   wpm   held  speed
  hook             0.31    5.05    4.7s     12   173   0.0s  1.15
  phone            5.05   17.59   12.5s     36   179   0.0s  1.15
  einstein        17.59   38.80   21.2s     52   159   1.5s  1.05
  stakes          38.80   47.56    8.8s     29   217   0.7s  1.15
  doubt           47.56   60.06   12.5s     33   175   1.2s  1.15
  proof           60.06   72.39   12.3s     28   175   2.7s  1.08
  payoff          72.39   85.86   13.5s     35   193   2.6s  1.15
  length: the beat's time on screen. held: the voice silent for 0.6 s or more. wpm: while speaking.
```

The narration was transcribed back by an independent recogniser (Whisper small.en) on the clean voice track and on the finished mix: 2.15 % and 2.58 % word error. Differences on the final mix: clock -> clocks; nts two -> nts2; percent -> ∅; flipped -> flip; a -> to.

## 4. Caption synchronisation

- Caption timing comes from the voice model’s own phoneme durations, not from word counts.
- Cross-check against a second, unrelated model (Zipformer transducer): 207 of 225 words matched; after removing that recogniser’s constant 110 ms emission delay, the mean deviation is 85 ms and 95 % of words are within 190 ms.
- 88 burned-in phrases (0 on two lines), shortest on screen 0.3 s; `dist/subtitles.srt` carries the same text as reading-length cues.

## 5. Mobile viewing

- Layout (1080 × 1920): every shot fills the frame; essential text stays within y 270–1470 and clear of the right-hand buttons; captions y 1185–1345.
- Captions: Space Grotesk 800, 72 px, highlight mode `color`, widest phrase 801 px.
- `dist/mobile_preview_reels_style.jpg` and `dist/mobile_preview_shorts_style.jpg` show frames at phone size under generic interface overlays. The overlays are approximations built from third-party measurements (neither platform publishes fixed pixel values), drawn conservatively.

## 6. Motion and encode fidelity

FFmpeg’s freeze detector (0.15 % mean change, 0.4 s) reports 3 short holds: 65.6–66.1 s, 67.9–68.6 s, 68.9–69.4 s.

Encode fidelity against the rendered frames: SSIM 0.9933, PSNR 48.9 dB.

## Technical accuracy review

| On screen / spoken | Status |
|---|---|
| Clocks set to 10.22999999543 MHz on the ground, before launch | Ashby 2003 §5 eq. 36; Penn State GEOG 862 (docs/sources.md) |
| +45 µs a day from gravity, −7 µs from speed, net +38 µs | Penn State's rounded figures; Ashby gives 38.6 µs a day. The video says “about” |
| More than 11 km of error in a day | Ashby 2002 (Physics Today), word for word |
| NTS-2, 1977, fix built in but switched off; about 20 days uncorrected | Ashby 2003 §5; NRL; Smithsonian |
| Predicted +446.5, measured +442.5 parts in 10¹², within 1% | Ashby 2003 and 2002 |
| 30 cm ghost beside the dot, dial rates, plate stack | Diagrams, marked “not to scale” and “rates exaggerated” on screen |
| NTS-2 and the GPS satellites | Generic satellites built in code, named only; no picture is passed off as them |

## Defects found during QA and fixed

| Found | Cause | Fix |
|---|---|---|
| Lint: one colour typed as a value in the ruler panel | rgb() in s02_phone.js | Uses a neutral dark panel |
| Lint: overlays and pins sitting in the caption band (y 1225–1300) and under the like/share column | Positions set from geometry, before any frame was seen | Stamps, gauges and pins moved above the band; `pin()` now clamps labels to y 320–1170 and inside the side margins |
| Lint: low-contrast dial labels (ORBIT) and small text | Thin text on a busy Earth | Labels stroked, sizes raised |
| Contact sheet: phone close-up of the blue dot looked pixelated | Camera too close to the Earth texture | Close-up pulled back (distance 1.0 → 0.85 framing, wider FOV) |
| Contact sheet: hook and payoff framed too tight on the satellite | heroCam distance | Camera now eases out (0.5 → 1.3 and 0.8 → 1.3) |
| Contact sheet: Einstein name tag lingered over the +45/−7 split | No fade-out | Tag fades out before the numbers land |
| Build scan: dark frames at 59.6–60.2 s | Proof shot opened looking into the unlit back of the NTS-2 drum | Camera reframed to the lit face; clock face lowered and moved clear of the drum |
| Verdict numbers read 447 and 443 | `bigNumber` rounds values of 100 or more while counting | Shown exact (`count: false`): +446.5 and +442.5 |
| Switch shot cropped the lever at ON | Camera too close | Camera eases back from [1.6, 0.3, 2.8] to [1.4, 0.6, 3.8] |

## Creative self-assessment

The strongest moment on paper is the switch: a doubt stated in 1977, a satellite flown with the
fix switched off, and the verdict held on screen before the lever slams to ON. The weakest is the
lack of any real archive picture of NTS-2: the media hosts were out of reach, so the satellite is a
named, generic model. A second pass should add a public-domain NRL or NASA photo of NTS-2 in the
doubt beat, credited in media/credits.json.

## What was not verified

Playback inside the YouTube and Instagram apps, and loudness on real phones. Frames were checked
on contact sheets and by the build's scan, not watched end to end at full speed by a person.
There is still no real archive photo of NTS-2 (see above).

## Rebuild

From the repository root: `bin/lockstep voice einsteins-off-switch` then `bin/lockstep build einsteins-off-switch` (see the repository README for setup).
