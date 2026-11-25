# Production Report — “The Bridge That Danced Itself to Death”

All figures in the numbered sections were measured on the delivered file by `engine/validate.py`; none are targets or estimates.

## 1. Deliverable

`tacoma_narrows_vertical.mp4` — 71.8 MB, 64.53 s (1:04.5).

| Requirement | Measured | Result |
|---|---|---|
| 1080 × 1920, 9:16 portrait | 1080 × 1920, 9:16 | PASS |
| 30 fps or higher | 30 fps constant, 1936 frames | PASS |
| H.264 video | H264 High @ L4.2, yuv420p, bt709/bt709/bt709 tv, 8.63 Mbps | PASS |
| AAC audio | AAC-LC, 48 kHz, 2 ch, 266 kbps | PASS |
| MP4 container | MP4 (ISO BMFF), index at the front for streaming: yes | PASS |
| 90 s maximum | 64.53 s | PASS |
| Plays without error | full decode, 0 errors | PASS |
| No black frames | 0 black segments detected | PASS |
| Audio and picture in sync | narration lag inside the MP4: 0 ms | PASS |
| Complete, intelligible narration | 191 words; speech recognition on the final mix: 2.04 % word error (4 of 196 tokens once numbers are spelled out) | PASS |
| Burned-in captions | 60 phrases, 1–5 words each, within x [136, 944], y [1185, 1345] | PASS |

## 2. How it was made

| Stage | Method |
|---|---|
| Narration | 191 words, recorded with Kokoro-82M (Apache-2.0 neural TTS, voice `af_heart`, speed 1.15) running locally. |
| Word timing | Read from the voice model’s own phoneme durations: every word boundary is exact to one 25 ms model frame. |
| Pictures | 9 scenes of real photographs, film and 3D, composed on an HTML Canvas (3D by three.js); every frame is a pure function of time and of the narration’s word timings. |
| Rendering | Headless Chromium, 1080 × 1920 native, 1936 frames, each leaving the page as a JPEG (q 0.97). |
| Look | `overcast-1940`: one colour grade for every picture; the reasoning behind it and the story is in docs/creative_brief.md. |
| Music | Licensed track: “Impending Boom” by Kevin MacLeod (CC BY 4.0), from Incompetech, from 0 s; levelled against the voice, ducked under speech, faded in. Chosen from its description, not by ear. |
| Sound design | 31 synthesised cues, emitted by the animation code at the same cue times as the visuals. |
| Media | 1 picture(s), clip(s) and model(s) from free sources: Public domain: collapse-1940. Every source, author and licence is in media/credits.json; the credit lines for the description are in docs/credits.md. |
| Mix | Voice lightly compressed and peak-controlled; bed ducked under speech; mastered to −14 LUFS with a look-ahead limiter. |
| Encode | FFmpeg libx264 (CRF, preset slow), BT.709 limited range, 2 s keyframe interval; AAC-LC 256 kbps. |

Versions: ffmpeg version 6.1.1-3ubuntu5 · Node v22.23.4 · Python 3.13.18

## 3. Audio

| Measure | Value |
|---|---|
| Integrated loudness | -14.0 LUFS (target −14) |
| True peak | -2.5 dBTP |
| Loudness range | 2.1 LU |
| Voice above music + effects while speaking | 15.7 dB |
| Music level in pauses vs. under speech | +2.6 dB (ducking) |
| Limiter gain reduction at mastering | 0.0 dB |
| Speaking pace | 207 wpm while speaking; 186 wpm including pauses |

Pacing per beat (`lockstep pacing`): the time each beat has on screen, how fast it is spoken and how long the voice is silent in it (held, pauses of 0.6 s or more).

```
  beat             from      to  length  words   wpm   held  speed
  hook             0.30    9.61    9.3s     25   170   0.0s  1.15
  ribbon           9.61   16.58    7.0s     25   231   0.0s  1.15
  wind            16.58   23.15    6.6s     20   196   0.0s  1.15
  twist           23.15   36.43   13.3s     44   207   0.0s  1.15
  film            36.43   38.68    2.3s      7   233   0.0s  1.15
  tubby           38.68   43.40    4.7s     15   213   0.0s  1.15
  fall            43.40   47.11    3.7s     11   213   0.6s  1.15
  myth            47.11   56.02    8.9s     25   178   0.0s  1.15
  lesson          56.02   64.53    8.5s     19   199   2.8s  1.15
  length: the beat's time on screen. held: the voice silent for 0.6 s or more. wpm: while speaking.
```

## 4. Caption synchronisation

- Caption timing comes from the voice model’s own phoneme durations, not from word counts.
- Cross-check against a second, unrelated model (Zipformer transducer): 184 of 191 words matched; after removing that recogniser’s constant 113 ms emission delay, the mean deviation is 80 ms and 95 % of words are within 199 ms.
- 60 burned-in phrases (10 on two lines), shortest on screen 0.43 s; `dist/subtitles.srt` carries the same text as reading-length cues.

## 5. Mobile viewing

- Layout (1080 × 1920): every shot fills the frame; essential text stays within y 270–1470 and clear of the right-hand buttons; captions y 1185–1345.
- Captions: Poppins 800, 72 px, highlight mode `color`, widest phrase 808 px.
- `dist/mobile_preview_reels_style.jpg` and `dist/mobile_preview_shorts_style.jpg` show frames at phone size under generic interface overlays. The overlays are approximations built from third-party measurements (neither platform publishes fixed pixel values), drawn conservatively.

## 6. Motion and encode fidelity

FFmpeg’s freeze detector (0.15 % mean change, 0.4 s) reports no holds anywhere in the video.

Encode fidelity against the rendered frames: SSIM 0.9925, PSNR 49.1 dB.

## Technical accuracy review

| On screen / spoken | Status |
|---|---|
| 1940; Washington State; Galloping Gertie; people drove across for the ride | WSDOT, HistoryLink (docs/sources.md) |
| 2,800 ft main span (“over half a mile”); 8 ft deep deck | WSDOT “Lessons from failure”, Britannica |
| November 7, four months after opening; about 40 mph | WSDOT records 38–42 mph; Britannica 42; the video says “about forty” |
| Bounce turned into a twist; fell around eleven | WSDOT, HistoryLink, Live Science (accounts give 10–11:02 a.m.) |
| One man fled his car with his daughter's dog Tubby inside | WSDOT, Wikipedia; the dog was the only death (people were injured) |
| Not resonance: the twist fed itself from a steady wind (flutter) | Billah & Scanlan 1991; APS News. The section animation is a simplified picture of that, not a simulation |
| Bridges tested in wind tunnels | WSDOT “Lessons from failure” |
| The 3D bridge | built in code to the real layout (two towers, main span, side spans, suspenders), not to scale in every detail; motion is illustrative and timed to the narration |
| The film | Tacoma Fire Department film, 7 November 1940, public domain (Internet Archive, CEP176) |

## Defects found during QA and fixed

| Found | Cause | Fix |
|---|---|---|
| Tower legs filling two shots | cameras placed beside the deck centre line | chase camera on the centre line; end view between the legs |
| Wind invisible | streaks blowing straight at the camera | streaks thicker, brighter and slanted across the span |
| The twist not visible when “twist” is said | amplitude grew too late | a first rise on the word, then the growth |
| Film caption over the print | name tag below the picture | name tag above, print raised |
| The 1940 film cropped and blurred full frame | 320 px 4:3 film forced to fill 9:16 | new `fit: 'contain'`: the whole film as a framed print over a blurred copy |

## Creative self-assessment

The whole story is animated in code; the real film appears twice, as proof. Strongest: the chase
camera riding the bouncing deck, the twist growing on the bridge, the fall landing on its word.
Weakest: the cross-section is schematic and the streamlined deck in the wind tunnel reads as a disc;
the bridge has no texture detail; the music was chosen from its description, not by ear.

## The person's review

Animation, voice, the real footage and the music were right. The pacing was not: the explanation
and the real film were rushed while the setup had time to spare (the film of the twisting deck
2.3 s, talked over). Kept as built for reference; `lockstep lint` now flags both film appearances
(`pacing`), and the brief's Pacing section says how the time should have been shared.

## What was not verified

How the music sounds against the voice (measured, not heard); playback in the platform apps.

## Rebuild

From the repository root: `bin/lockstep voice tacoma-narrows` then `bin/lockstep build tacoma-narrows` (see the repository README for setup).
