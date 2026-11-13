<!-- Authored per video. engine/make_report.py inserts this file into docs/production_report.md
     after the measured sections. Keep the four headings; write what is true for this video. -->

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
