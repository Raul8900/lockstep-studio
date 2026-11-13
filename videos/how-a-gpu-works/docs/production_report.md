# Production Report — “How Does a Modern GPU Actually Work Internally?”

All figures in the numbered sections were measured on the delivered file by `engine/validate.py`; none are targets or estimates.

## 1. Deliverable

`how_a_gpu_works_vertical.mp4` — 149.0 MB, 162.07 s (2:42.1).

| Requirement | Measured | Result |
|---|---|---|
| 1080 × 1920, 9:16 portrait | 1080 × 1920, 9:16 | PASS |
| 30 fps or higher | 30 fps constant, 4862 frames | PASS |
| H.264 video | H264 High @ L4.2, yuv420p, bt709/bt709/bt709 tv, 7.08 Mbps | PASS |
| AAC audio | AAC-LC, 48 kHz, 2 ch, 266 kbps | PASS |
| MP4 container | MP4 (ISO BMFF), index at the front for streaming: yes | PASS |
| 180 s maximum | 162.07 s | PASS |
| Plays without error | full decode, 0 errors | PASS |
| No black frames | 0 black segments detected | PASS |
| Audio and picture in sync | narration lag inside the MP4: 0 ms | PASS |
| Complete, intelligible narration | 390 words; speech recognition on the final mix: 0.25 % word error (1 of 393 tokens once numbers are spelled out) | PASS |
| Burned-in captions | 141 phrases, 1–5 words each, within x [140, 940], y [1260, 1440] | PASS |

## 2. How it was made

| Stage | Method |
|---|---|
| Narration | 390 words, recorded with Kokoro-82M (Apache-2.0 neural TTS, voice `af_heart`, speed 1.00) running locally. |
| Word timing | Read from the voice model’s own phoneme durations: every word boundary is exact to one 25 ms model frame. |
| Animation | 10 chapters drawn on an HTML Canvas; every frame is a pure function of time and of the narration’s word timings. |
| Rendering | Headless Chromium, 1080 × 1920 native, 4862 frames, each leaving the page as a JPEG (q 0.97). |
| Music | Original, synthesised: pads, bass, arpeggio, soft kick and hats at 100 BPM, arranged per chapter, ending on a held major chord. |
| Sound design | 235 synthesised cues, emitted by the animation code at the same cue times as the visuals. |
| Mix | Voice lightly compressed and peak-controlled; bed ducked under speech; mastered to −14 LUFS with a look-ahead limiter. |
| Encode | FFmpeg libx264 (CRF, preset slow), BT.709 limited range, 2 s keyframe interval; AAC-LC 256 kbps. |

Versions: ffmpeg version 6.1.1-3ubuntu5 · Node v22.23.4 · Python 3.13.18

## 3. Audio

| Measure | Value |
|---|---|
| Integrated loudness | -14.1 LUFS (target −14) |
| True peak | -2.1 dBTP |
| Loudness range | 2.7 LU |
| Voice above music + effects while speaking | 16.2 dB |
| Music level in pauses vs. under speech | +4.5 dB (ducking) |
| Limiter gain reduction at mastering | 0.0 dB |
| Speaking pace | 170 wpm while speaking; 147 wpm including pauses |

The narration was transcribed back by an independent recogniser (Whisper small.en) on the clean voice track and on the finished mix: 0.25 % and 0.25 % word error. Differences on the final mix: adds -> ads.

## 4. Caption synchronisation

- Caption timing comes from the voice model’s own phoneme durations, not from word counts.
- Cross-check against a second, unrelated model (Zipformer transducer): 356 of 390 words matched; after removing that recogniser’s constant 110 ms emission delay, the mean deviation is 75 ms and 95 % of words are within 190 ms.
- 141 burned-in phrases (5 on two lines), shortest on screen 0.43 s; `dist/subtitles.srt` carries the same text as reading-length cues.

## 5. Mobile viewing

- Layout zones (1080 × 1920): top 0–270 backdrop only; chapter bar y 286–340; diagrams y 372–1210; captions y 1260–1440; bottom 1470–1920 backdrop only.
- Captions: 74 px ExtraBold with a 15 px outline, widest phrase 799 px.
- `dist/mobile_preview_reels_style.jpg` and `dist/mobile_preview_shorts_style.jpg` show frames at phone size under generic interface overlays. The overlays are approximations built from third-party measurements (neither platform publishes fixed pixel values), drawn conservatively.

## 6. Motion and encode fidelity

FFmpeg’s freeze detector (0.15 % mean change, 0.4 s) reports no holds anywhere in the video.

Encode fidelity against the rendered frames: SSIM 0.9934, PSNR 49.5 dB.

## Technical accuracy review

Each claim was checked against the sources before the script was locked, and the finished frames were re-read against the same list.

| On screen / spoken | Status |
|---|---|
| GPU execution shown as lanes sharing one instruction stream, never as independent CPU-like cores | Matches the SIMT model in NVIDIA’s and AMD’s documentation. The hook’s “cores” is put in quotation marks on screen and resolved in chapter 6. |
| 21,760 cores, 170 compute units, 128 lanes per unit, 1,792 GB/s, 32 GB | GeForce RTX 5090 figures; the product is named next to every number. |
| Warp = 32 threads; “AMD: wavefront” shown beside it | NVIDIA-specific number, labelled as such. AMD’s group is 32 or 64 wide, so no number is attached to its name. |
| Streaming Multiprocessor / Compute Unit / Xe-core | Vendor names shown as three labels for one idea. Intel’s row is on screen only; it is not narrated. |
| “Dozens of warps”; eight warp cards drawn | 48 concurrent warps per SM is documented for the previous generation only, so no number is claimed; the eight cards are captioned “dozens of warps live here”. |
| Switching warps at zero cost because registers stay on-chip | NVIDIA’s wording: switching between warps “incurs no cost”. |
| Registers → shared memory → caches → VRAM | Standard hierarchy. Speed labels are qualitative (“instant / very fast / fast / farthest”); no latency numbers are invented. |
| “Often the real speed limit” | True of bandwidth-bound work (e.g. large-model inference); the word “often” is doing honest work. |
| Divergence drawn as a 16/16 split, each path run in turn with the rest masked | The mechanism is exact; the even split is an illustration. |
| 4K = 8,294,400 pixels; 32 pixels per warp | Arithmetic is exact. Real rasterisers shade in 2 × 2 quads and pack warps less tidily than the 8 × 4 tiles shown. |
| Neural network “mostly” matrix multiplication | Correct as a first-order description; the 8 × 8 matrices are schematic. |

Deliberate simplifications: one warp scheduler is drawn where real units have several; the CPU floor-plan areas are indicative, not measured; the instruction sequence LOAD/MUL/ADD/STORE is illustrative; tensor cores, ray-tracing cores and the graphics-specific pipeline stages are left out to fit three minutes.

## Defects found during QA and fixed

| Found | Cause | Fix |
|---|---|---|
| First render ran at 3 fps | Uploading raw pixel buffers out of the browser took 400 ms per frame | Frames now leave the page as JPEG; 44 fps |
| First MP4 was 1.49 GB (74 Mbps) | Animated film grain | Replaced with a fixed ~1.5-code-value dither; 7 Mbps at higher nominal quality |
| “NVIDIA” spoken as letters | TTS default | Phoneme override |
| Empty or near-empty frames at four scene changes | Incoming scene started drawing after the cut | Incoming content now starts 0.3–0.45 s before the cut; full-timeline scan confirms no dark frames |
| Text collisions (matrix labels, “executed ×32”, rowing labels, memory read-outs) | Layout | Re-spaced; rowing labels became opaque plates |
| Diagram spilled into the caption band (synchronisation picture) | Layout | Re-laid-out above y 1130 |
| Key numbers under the platform button column | Layout | Pixel count, bandwidth, multiply-add counter and vendor abbreviations moved left |
| Voice only 10 dB above the bed, then 21 dB after peak control | Mix balance | Set to 16 dB |
| Limiter faded the first and last 80 ms | Filter start-up state | Initialised at unity gain |
| Two captions on screen for 0.25–0.33 s | Phrase breaks | Merged with their neighbours |
| Nine half-second holds with no motion | Static compositions between narration beats | Added subtle continuous motion (breathing, shimmer, second shading pass) |
| Label “never idle” on the execution lanes | Overstated: the next chapter shows lanes waiting on memory | Changed to “kept busy” |
| End-card chip “170 UNITS” | One product’s figure presented without attribution | Changed to “IDENTICAL UNITS” |
| “lock-step” on screen vs. “lockstep” in captions | Inconsistent spelling | Unified to “lockstep” |
| Three transitions crossed other elements (core dive over the title, a region flying across the title, lane rows shuffling sideways) | Motion paths | Clipped, redirected, and simplified |

## Creative self-assessment

| Aspect | Assessment |
|---|---|
| First three seconds | A lit, moving die and a racing counter are on screen from frame 0; the first sentence is a concrete number and the second contradicts it. No title card, no fade-in. |
| Curiosity thread | The hook (“not one of them can think for itself”) is left open for 80 seconds, answered explicitly in chapter 6, and restated on the end card. |
| Pacing | A new visual event every 1–3 s in most chapters; the two densest ideas (SIMT, the stalled warp) are given the slowest delivery. Chapter 6’s unit diagram is on screen for 12 s — the longest single layout — and relies on internal animation to hold attention. |
| Visual variety | Ten layouts and five kinds of transition; one consistent colour language. The middle chapters (5–7) are all panel-and-lane diagrams and look more alike than the rest. |
| Clarity of the central idea | One instruction, 32 lanes, identical pulse timing, then a rowing crew. This is the strongest part of the video. |
| Ending | The last spoken line is a contrast, and the end card restates the model in four words. It loops acceptably but was not designed as a seamless loop. |
| Voice | Clear and even, but it is a synthetic voice; a human read, or a premium TTS voice, would add warmth and more deliberate emphasis. |

## What was not verified

- **Listening.** This environment has no audio output. Balance, tone and the absence of harshness were checked with meters, spectra and speech recognition, not by ear. Listen once on phone speakers before publishing.
- **Platform previews.** Safe areas were checked against approximate overlays, not inside the apps.
- **Vendor pages.** The sandbox could not open vendor sites directly, so documentation was read through search results that quote them.
- **Paid tools.** The connected Higgsfield tools (premium voices, generated music) were not used because they spend account credits and no spending was authorised. A different voice can be dropped in: the pipeline needs the new audio plus its word timings in `data/words.json` (from the TTS engine or a forced aligner), after which every visual, caption and sound cue re-times itself.

## Rebuild

From the repository root: `bin/lockstep voice how-a-gpu-works` then `bin/lockstep build how-a-gpu-works` (see the repository README for setup).
