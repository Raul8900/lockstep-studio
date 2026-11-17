# Production Report — “How Bluetooth Works”

All figures in the numbered sections were measured on the delivered file by `engine/validate.py`; none are targets or estimates.

## 1. Deliverable

`how_bluetooth_works_vertical.mp4` — 71.1 MB, 112.33 s (1:52.3).

| Requirement | Measured | Result |
|---|---|---|
| 1080 × 1920, 9:16 portrait | 1080 × 1920, 9:16 | PASS |
| 30 fps or higher | 30 fps constant, 3370 frames | PASS |
| H.264 video | H264 High @ L4.2, yuv420p, bt709/bt709/bt709 tv, 4.79 Mbps | PASS |
| AAC audio | AAC-LC, 48 kHz, 2 ch, 268 kbps | PASS |
| MP4 container | MP4 (ISO BMFF), index at the front for streaming: yes | PASS |
| 130 s maximum | 112.33 s | PASS |
| Plays without error | full decode, 0 errors | PASS |
| No black frames | 0 black segments detected | PASS |
| Audio and picture in sync | narration lag inside the MP4: 0 ms | PASS |
| Complete, intelligible narration | 308 words; speech recognition on the final mix: 4.81 % word error (15 of 312 tokens once numbers are spelled out) | **FAIL** |
| Burned-in captions | 98 phrases, 1–5 words each, within x [142, 938], y [1260, 1440] | PASS |

## 2. How it was made

| Stage | Method |
|---|---|
| Narration | 308 words, recorded with Kokoro-82M (Apache-2.0 neural TTS, voice `bf_emma`, speed 1.06) running locally. |
| Word timing | Read from the voice model’s own phoneme durations: every word boundary is exact to one 25 ms model frame. |
| Animation | 8 chapters drawn on an HTML Canvas; every frame is a pure function of time and of the narration’s word timings. |
| Rendering | Headless Chromium, 1080 × 1920 native, 3370 frames, each leaving the page as a JPEG (q 0.97). |
| Look | `transit-map` (light theme); the reasoning behind it and the story shape is in docs/creative_brief.md. |
| Music | Original, synthesised at 112 BPM (pulse kit, transposed +1 semitones), arranged per chapter from the moods in video.json, ending on a held major chord. |
| Sound design | 181 synthesised cues, emitted by the animation code at the same cue times as the visuals. |
| Mix | Voice lightly compressed and peak-controlled; bed ducked under speech; mastered to −14 LUFS with a look-ahead limiter. |
| Encode | FFmpeg libx264 (CRF, preset slow), BT.709 limited range, 2 s keyframe interval; AAC-LC 256 kbps. |

Versions: ffmpeg version 6.1.1-3ubuntu5 · Node v22.23.4 · Python 3.13.18

## 3. Audio

| Measure | Value |
|---|---|
| Integrated loudness | -14.0 LUFS (target −14) |
| True peak | -3.2 dBTP |
| Loudness range | 2.6 LU |
| Voice above music + effects while speaking | 21.1 dB |
| Music level in pauses vs. under speech | +5.7 dB (ducking) |
| Limiter gain reduction at mastering | 0.0 dB |
| Speaking pace | 193 wpm while speaking; 169 wpm including pauses |

The narration was transcribed back by an independent recogniser (Whisper small.en) on the clean voice track and on the finished mix: 4.49 % and 4.81 % word error. Differences on the final mix: neighbours -> neighbors; point four gigahertz -> 4ghz, caf -> cafe; sixteen -> one thousand six; clock -> clerk; caf s -> cafes; sixteen -> one thousand six; neighbours -> neighbors.

## 4. Caption synchronisation

- Caption timing comes from the voice model’s own phoneme durations, not from word counts.
- Cross-check against a second, unrelated model (Zipformer transducer): 273 of 308 words matched; after removing that recogniser’s constant 95 ms emission delay, the mean deviation is 71 ms and 95 % of words are within 205 ms.
- 98 burned-in phrases (31 on two lines), shortest on screen 0.5 s; `dist/subtitles.srt` carries the same text as reading-length cues.

## 5. Mobile viewing

- Layout zones (1080 × 1920): top 0–270 backdrop only; chapter bar y 286–340; diagrams y 372–1210; captions y 1260–1440; bottom 1470–1920 backdrop only.
- Captions: Work Sans 800, 76 px, highlight mode `underline`, widest phrase 796 px.
- `dist/mobile_preview_reels_style.jpg` and `dist/mobile_preview_shorts_style.jpg` show frames at phone size under generic interface overlays. The overlays are approximations built from third-party measurements (neither platform publishes fixed pixel values), drawn conservatively.

## 6. Motion and encode fidelity

FFmpeg’s freeze detector (0.15 % mean change, 0.4 s) reports 16 short holds: 9.3–9.7 s, 12.0–12.4 s, 12.5–13.1 s, 13.1–13.6 s, 20.1–20.9 s, 22.9–23.3 s, 23.3–24.0 s, 24.0–24.6 s, 25.1–25.6 s, 25.7–26.1 s, 26.6–27.1 s, 39.0–40.0 s, 52.4–52.9 s, 54.0–54.7 s, 73.3–73.8 s, 74.0–74.9 s.

Encode fidelity against the rendered frames: SSIM 0.9968, PSNR 51.2 dB.

## Technical accuracy review

Every number and claim, spoken or on screen, was checked against the Bluetooth Core Specification v5.4
(downloaded from bluetooth.com and searched locally, so the quotations in `docs/sources.md` are verbatim)
or the other sources listed there. The hop maps are not illustrations of hopping but the real thing: they
are drawn by the specification's hop selection kernel (Vol 2 Part B §2.6), implemented in
`components.js` and checked with `node tools/verify_hops.js <sample-data.txt>` against all 7,680
connection-state hops in the specification's own sample data (Vol 2 Part G), for the copy in
`tools/hopkernel.js` and the copy the scenes run (15,360 / 15,360 match). `node tools/map_facts.js`
reproduces every map fact quoted below.

| On screen / spoken | Status |
|---|---|
| “Forty people in this carriage are streaming … over the same slice of radio” · “40 PEOPLE · 1 RADIO BAND” | A picture of a crowded carriage, not a measurement; all BR/EDR links use the same 2.4 GHz ISM band (Vol 2 Part A §2). |
| “You might think pairing gives your earbuds a private channel … There's no such thing” · “NO PRIVATE LINE” · “79 CHANNELS · SHARED BY EVERYONE” | Every basic piconet channel hops pseudo-randomly through all 79 RF channels (Vol 2 Part B §2.2.2); nothing reserves a channel for one link. |
| “two point four gigahertz, shared with café Wi-Fi and even microwave ovens” · Wi-Fi 1/6/11 blocks · oven hump | Band 2400–2483.5 MHz (Vol 2 Part A §2); Wi-Fi channel 1 = 2402–2422 MHz, 1/6/11 non-overlapping (Intel); ovens ≈ 2,450 MHz (USDA FSIS). The hump's width is schematic. |
| “UNLICENSED · NOBODY OWNS IT” | “unlicensed … ISM frequency band” (Bluetooth SIG tech overview). |
| “Classic Bluetooth slices it into seventy-nine channels” · “1 MHz EACH · BLUETOOTH LE: 40 × 2 MHz” | Vol 2 Part A Table 2.1; LE: Vol 6 Part A §2. |
| “It jumps channel up to sixteen hundred times a second” · “1,600 HOPS PER SECOND · MAXIMUM” · “REAL TIME” / “SLOWED ×400” | “The maximum hop rate is 1600 hops per second in the Connection state” (Vol 2 Part B §2.1). The burst really draws 1,600 slots per second of video; every other map runs at 4 slots a second and says “SLOWED ×400”. |
| “a timetable your phone works out from its address and its clock” · ADDRESS (example) · CLOCK · 312.5 µs TICKS · HOP SELECTION · the board's rows | “determined by the Bluetooth clock and BD_ADDR of the Central” (§2.2.2); the clock's LSB ticks every 312.5 µs (§1.1); slots are 625 µs (§2.2.3). Every row on the board is the kernel's output for the example address and clock. Usually the phone is the Central; roles can be switched (accuracy note in the script). |
| “Your earbuds work out the same one” · two identical boards · “SAME ADDRESS + SAME CLOCK = SAME TIMETABLE” | The Central's clock is communicated to the Peripherals, which add an offset to synchronise (§2.2.2). |
| “someone else's packet will sometimes land on your channel” · “SAME CHANNEL · CH 32” | A genuine coincidence of the two example phones' sequences: slot 98, channel 32 (`tools/map_facts.js`). |
| “every packet starts with a name tag: a code made from your phone's address” · badge 5B91E3 · “ACCESS CODE · MADE FROM THE ADDRESS” | The channel access code begins every packet and is derived from the LAP (the address's lower 24 bits, 5B:91:E3 here) of the Central (§1.3). The badge shows the LAP the code is made from; the code itself is a 64-bit sync word. |
| “Your earbuds only open up for that code” · “LET IN” / “IGNORED” | The access correlator searches for the correct channel access code; without a trigger the receiver may sleep until the next RX event (§2.2.5.1). |
| “two packets hit the same channel at the same instant” · “COLLISION · CH 50 · 2452 MHz” | A genuine coincidence of the two sequences: slot 150, channel 50. Real piconets are not slot-aligned; the map draws both on one grid (simplification). |
| “Bluetooth's own rulebook calls that a strong likelihood” · the quote card | Verbatim from Vol 2 Part B §2 (shown with an opening ellipsis). The “EXPECTED” stamp is the video's paraphrase, drawn as an annotation. |
| “They garble each other” | The simple case shown; a much stronger signal can survive (co-channel C/I 11 dB, Vol 2 Part A §4.1.2). Noted in sources.md. |
| “Your earbuds don't confirm” · “NO CONFIRMATION” | A corrupted packet gets a NAK or no reply (no trigger); either way it is not acknowledged (§7.6). |
| “your phone sends it again on the next hop, milliseconds later” · “SLOT 152 · CH 18” · “+1.25 ms” | “the same payload is retransmitted at the next TX occasion” (§7.6); the Central's next transmit slot is two slots = 1.25 ms later; the kernel gives channel 18 for slot 152. Longer packets push it to 3.75 ms (“milliseconds”). |
| “a fraction of a second of music waits in reserve” · “A FRACTION OF A SECOND IN RESERVE” | Headphones buffer audio “to allow time for retransmissions of any missed or dropped data packets”; typical A2DP latency ≈ 150 ms (Bose, US 10,705,793). No number on screen: it depends on the product. |
| “Wi-Fi doesn't hop. A network camps on about twenty of those channels” · “WI-FI · CHANNEL 6” · block over channels 25–44 | A 2.4 GHz Wi-Fi network stays on its 20 MHz channel; channel 6 = 2427–2447 MHz = Bluetooth channels 25–44. |
| “your phone keeps score. Channels that keep failing are dropped from the timetable” · tallies · “CLOSED” · the re-routed line | AFH classification by throughput failure (§8.6.8); the re-routed line is the kernel's adapted sequence with channels 25–44 unused (§2.6.3), which never lands in the block (`tools/map_facts.js`: 0 of 20,000 slots). The tally heights are illustrative. Note the adapted sequence's same-channel mechanism: the reply slot reuses the phone's channel, visible as pairs of stations. |
| “though it always keeps at least twenty” · “CHANNELS IN USE 59” · “NEVER FEWER THAN 20” | N_min = 20 (§2.3.1); 79 − 20 = 59, and the adapted sequence uses exactly 59 channels. |
| “Newer Bluetooth can share one stream with any number of earbuds” · “LE AUDIO BROADCAST · ONE STREAM, ANY NUMBER” | LE Audio broadcast: “an unlimited number of audio sink devices” (Bluetooth SIG; Auracast: “An unlimited number of in-range Auracast™ receivers”). Needs a phone and earbuds that support it. |

## Defects found during QA and fixed

| Found | Cause | Fix |
|---|---|---|
| “You'd think pairing…” transcribed as “You think pairing…” (check-voice) | the contraction's “'d” almost vanishes at this speed, turning a supposition into a claim | reworded: “You might think…” |
| Four caption phrases on screen for under 0.4 s, one of six words | first draft of the chunking | merged or split by hand |
| Grey earbuds on grey heads: nobody seemed to wear earbuds | pictogram colours | white earbuds with outlines; coloured only for your link and your neighbour's |
| The “?” badge appeared 0.1 s before the scene changed | tied to the end of the last word | tied to the bounce, 0.36 s after the word starts |
| The zoomed carriage ran under the progress bar | the custom strip-map HUD had no backing | the HUD got its own display panel |
| “YOUR EARBUDS” touched the “PRIVATE LINE?” sign | layout | pictograms moved down, sign up |
| The band scene opened on an almost empty frame | its content was all cued to words | the band slice and its label are there from the first frame |
| “MICROWAVE OVEN” collided with the 2.4 GHz headline | label above the oven | label beside it; headline raised |
| Ruler ticks crossed the map's axis labels during the hand-off to the hop map | both drawn at once | the ruler fades as the labels arrive |
| `packetCapsule` threw “px0 is not defined” | variable declared inside a closure | hoisted |
| “NAME TAG” crowded “ACCESS CODE” above the badge | both above the badge | name tag moved under it |
| The earbud gate looked small in the frame | scale | drawn 1.25× larger |
| “+1.25 ms” covered the slot labels on the resend strip | layout | labels beside their stations, the pill on the route |
| Failure crosses drew above the map for slots already past | not faded with the line | faded with the line |
| Lint: speed tag under the like/share buttons; code badges 19 px; clock label past the margin; camera punch pushed a label past the margin; stamp under the buttons; hard-coded hex colours | layout and colour choices | tag moved to the map's top right (and added to every slowed map); badges ≥ 24 px; shorter label; smaller punch, centred; stamp moved; colours by role. The split-flap digits overlap while they flip, by design: recorded in video.json |
| Accuracy re-read of every label | wording chosen for punch or precision the sources don't give | oven hump centred on 2,450 MHz; “ANYONE MAY TRANSMIT” → “NOBODY OWNS IT”; “NOTHING CAME BACK” → “NO CONFIRMATION” (a NAK can come back); “≈ 0.15 s” → “A FRACTION OF A SECOND”; example address labelled; “HOPS PER SECOND · MAXIMUM”; no bit count on the access-code label |

## Creative self-assessment

To be completed after the final build (see below).

## What was not verified

- The mix was verified by measurement and speech recognition, not by listening; I cannot hear it.
- Playback inside Instagram and YouTube was not tested; the mobile previews approximate their overlays.
- Whether any particular pair of earbuds uses Classic audio (A2DP) or LE Audio: the video's numbers are
  Classic's, and LE's are named on screen.
- Real collision rates in a real carriage: deliberately not claimed.

## Rebuild

From the repository root: `bin/lockstep voice how-bluetooth-works` then `bin/lockstep build how-bluetooth-works` (see the repository README for setup).
