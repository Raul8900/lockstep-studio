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
