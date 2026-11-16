# Sources — “Why a Torn QR Code Still Scans”

Research came before the script. Every number and every strong claim in the narration or on
screen traces to an entry here.

**Access note.** This machine's network policy refused the pages of the standard's free mirror
(law.resource.org), Denso Wave (qrcode.com) and the Thonky tutorial, so those were read only through
search-engine excerpts. To make up for it, every QR-specific number used in the video was
**re-derived and measured here**: the spec tables as transcribed in two independent open-source
implementations, a real encoder (segno), an independent Reed–Solomon library (reedsolo) and a real
decoder (zxing-cpp, the C++ port of ZXing, used by many scanning apps). See source 4.

## 1. Primary sources

| # | Source | What it supports |
|---|---|---|
| 1 | ISO/IEC 18004 (QR Code bar code symbology specification; editions 2006, 2015, 2024). Text not reachable from here; its tables are transcribed in sources 2–3. | The definition of versions, levels, codewords, Reed–Solomon blocks, function patterns. |
| 2 | Nayuki, *QR Code generator library*, `python/qrcodegen.py`, github.com/nayuki/QR-Code-generator (read 2026-11-16) | Tables `_ECC_CODEWORDS_PER_BLOCK` and `_NUM_ERROR_CORRECTION_BLOCKS` for all 40 versions × 4 levels; Reed–Solomon over GF(2^8) with modulus 0x11D (x^8+x^4+x^3+x^2+1); check bytes = remainder of polynomial division by a fixed generator; finder, timing and alignment patterns drawn as *function modules*, separate from data; "two copies of the format bits (with its own error correction code)". |
| 3 | zxing-cpp, `core/src/qrcode/QRDecoder.cpp` and `core/src/ReedSolomon.cpp`, github.com/zxing-cpp/zxing-cpp (read 2026-11-16) | The decoder error-corrects each block with `ReedSolomonDecode(RSField::QRCode, codewordBytes, numEC)` and passes **no erasure positions**: damage is treated as errors at unknown places. QR field = `gf2n_8_4_3_2` (same polynomial as source 2). |
| 4 | **Own measurement**, `videos/torn-qr-code/tools/qr_model.py` and `tools/verify_frames.py` (segno 1.x encoder, reedsolo, zxing-cpp 2.x decoder) | The hero code: "STILL HERE", version 1 (21 × 21 modules), level H, alphanumeric mode, mask 5. 208 data modules = 26 codewords: 9 message + 17 check. The 17 check bytes recomputed independently with reedsolo RS(26,9) over GF(256)/0x11D **match** the code exactly. Decoding with zxing-cpp: up to **8** changed codewords decode, **9** never did (21 tear shapes tried; with whole codewords flipped: 8 → 7/7 decode, 9 → 0/6). The hero tear (bottom-right corner, 8.6 % of the code's area) changes codewords 0, 1, 2, 4, 5, 6 (message) and 11 (check) and **decodes**. A tear through one corner square covering 3.1 % of the area, changing **0** data codewords, does **not** decode. Robustness (80 random renders each: scale 14–30 px per module, ±2.5° rotation, sub-pixel offset, JPEG quality 70–95): the hero tear decoded 80/80, the logo 80/80, the corner-square tear 0/80 (an earlier, smaller 1.3 % corner tear decoded 25/60 and was rejected as marginal). A blank 7 × 7-module square in the middle (11 % of the area, 7 codewords changed; it also covers 8 modules of the first copy of the format information, which has a second copy) **does** decode. The final rendered video frames were decoded the same way (results in `docs/report_notes.md`). |
| 5 | I. S. Reed and G. Solomon, “Polynomial Codes over Certain Finite Fields”, *J. SIAM* 8(2): 300–304, June 1960; work done at MIT Lincoln Laboratory | Reed–Solomon codes, 1960; the message is treated as a polynomial and sent as its values at more points than needed. |
| 6 | MIT Lincoln Laboratory, “Empowering digital communications”, ll.mit.edu/impact/empowering-digital-communications | “A little five-page article … in a 1960 issue of the Journal of the Society for Industrial and Applied Mathematics”; the codes are used in deep-space communication, CDs and DVDs, QR codes and HDTV. |
| 7 | European Patent Office, European Inventor Award 2014 finalist page for Masahiro Hara (epo.org/learning-events/european-inventor/finalists/2014/hara.html); IEEE Spectrum, “How a board game and skyscrapers inspired the development of the QR code” | QR code developed at Denso Wave by a team led by Masahiro Hara, released 1994, to track automotive parts. (Background only; not in the narration.) |
| 8 | Error-correction levels as quoted from Denso Wave and vendor documentation: Seagull Scientific BarTender help, “Error Correction (QR Code)”; Dynamsoft `QRCodeErrorCorrectionLevel` docs; Xenospectrum summary of Denso Wave's specification | L ≈ 7 %, M ≈ 15 %, Q ≈ 25 %, H ≈ 30 % — of the **codewords**, not of the printed area. |
| 9 | Standard coding theory: a Reed–Solomon code with *n − k* check symbols corrects any *t* errors and *s* erasures with 2*t* + *s* ≤ *n − k* (e.g. arXiv:0906.3778, “Modified Euclidean algorithms for decoding Reed–Solomon codes”: any μ erasures and ν errors with 2ν + μ < d_min, and d_min = n − k + 1); any *k* values of a polynomial of degree < *k* determine it (Lagrange interpolation; e.g. Stanford CS250 class notes on MDS codes) | “Each wrong byte costs two check bytes; a known gap costs one”; “two dots fix a line”; “any two survivors redraw the line”. |
| 10 | QR Code Tiger, “QR Code Error Correction: How does it work?” (qrcode-tiger.com/qr-code-error-correction) | Evidence of the **default explanation** only: it says the extra modules “contain duplicates of your embedded data”. Not used as a fact source — the video corrects it. |

### How this topic is usually told (for creative direction, not for facts)

Searches for short and long explainers (titles, descriptions and write-ups, no downloads) show one
dominant treatment: a QR code with a logo in the middle, the words “Reed–Solomon error correction”,
a bar chart of the four levels (7/15/25/30 %), and “redundant data” or even “duplicates” as the whole
explanation. Long-form pieces (a well-known “I built a QR code by hand” video, the Thonky tutorial,
visual-explainer blog posts) go through the layout — finder squares, timing lines, masks — and treat
Reed–Solomon as a black box or as polynomial division. Nobody in the short format shows *why* extra
bytes can rebuild missing ones, or why 30 % costs about 60 %.

## 2. Facts used in the video

| Claim (as spoken or shown) | Value | Source # | Caveat stated on screen |
|---|---|---|---|
| A torn QR code still scans | The hero tear (bottom-right corner, 8.6 % of the code's area) decodes to “STILL HERE” | 4 | Verified on the rendered frames |
| “Two-thirds of its bytes aren't even your message” | Version 1-H: 17 of 26 bytes are check bytes (65 %); every version at level H: 62.9–66.3 % | 2, 4 | — |
| Backup copies can't tell which copy is right; three copies cost the same space and two hits on one character beat them | Logic of majority voting; 3 × 9 = 27 bytes vs 26 | 9 (reasoning) | — |
| Reed–Solomon, 1960 | Reed & Solomon, J. SIAM 1960 | 5, 6 | — |
| Two dots fix exactly one line; extra dots on it let you lose some | Interpolation / MDS property | 9 | “Real QR codes use a curve of byte arithmetic you can't draw” |
| A scanner can't tell a torn spot from a real one | zxing-cpp corrects without erasure positions | 3, 4 | — |
| Each liar costs two extra dots: one to find it, one to fix it | 2t ≤ n − k; each error has two unknowns (where, what) | 9 | — |
| This code: 26 bytes, 9 message, 17 check, fixes any 8 | Version 1-H; measured: 8 decode, 9 fail | 2, 4 | — |
| “About thirty percent” | 8 / 26 = 30.8 %; level H fixes 30.8–33.2 % of the codewords in every version; nominal 30 % | 2, 8 | “of the bytes” |
| A logo in the middle is damage on purpose | 7 × 7-module blank centre decodes | 4, 8 | — |
| Thirty percent of the bytes, not the paper | In version 1 all 26 codewords cover only 47 % of the symbol; measured tears of 9.4 % of the area decoded, 11.3 % failed | 4 | — |
| The three corner squares aren't protected; they're how the scanner finds the code; “tear into one, and this code won't scan” | Function patterns are not codewords; a 3.1 % tear through one: no decode in 0/80 random renders and in every sampled frame of the MP4 | 2, 4 | “this code” — tested with one decoder |
| The torn corner held part of the message | The hero tear changes data codewords 0–2 (mode, length and the first letters) | 4 | — |

## 3. Deliberate simplifications

- **The curve.** The video draws the idea with a straight line through two numbers. A real QR code's
  message (9 bytes here) defines a polynomial of degree 8, and the arithmetic is GF(256) — a number
  system in which every result is again a byte — so there is no picture of that curve. The video says
  so in words (“you can't draw that curve, but the rule holds exactly”) and draws the real code's
  bytes as bricks, not as points on a drawn curve.
- **“Extra points on its curve.”** QR encoders compute check bytes by polynomial division (the
  “BCH view”). The resulting codewords form a shortened Reed–Solomon code, which is equivalent to
  evaluating the message polynomial at fixed points with fixed scale factors (a generalised
  Reed–Solomon code). “Extra points on the same curve” is therefore the true structure, stated
  without the scale factors.
- **“Fixes any eight.”** True for this decoder and this code. The standard reserves one of the 17
  check bytes of version 1-H as misdecode protection, which also leaves 8. Decoders that are told
  where damage is (erasures) could do more; phone scanners generally are not told.
- **“About thirty percent.”** The nominal figure for level H. The exact share depends on the version
  (30.8–33.2 % of the codewords) and is a share of bytes, not of area.
- **Copies.** Real designers would never use plain copies; the video uses them as the obvious first
  guess (which popular guides literally describe as “duplicates”) to show why points on a curve are
  better.

## 4. Things checked and rejected

- **“30 % of the QR code can be destroyed.”** Rejected as stated: it is 30 % of the codewords. In this
  version-1 code that is at most about 15 % of the printed area, and a 3 % tear in the wrong place
  (a corner square) is fatal while an 8.6 % tear elsewhere is not. The video's “fine print” beat says this.
- **“The extra modules contain duplicates of your data”** (source 10). Wrong: they are check bytes
  computed from all of the data; no byte of the message is stored twice.
- **“It tore off a third and still scans.”** Not used: measured tears up to 9.4 % of the area decode;
  11.3 % and more failed. The hook says “a chunk”.
- **Hara got the idea from the game Go.** Repeated online, not confirmed by the EPO or IEEE pages. Not used.
- **“QR codes never misread.”** Not used: beyond its capacity a Reed–Solomon decoder usually refuses,
  but can rarely accept a wrong codeword.
- **DataFlex's 20 / 37 / 55 / 65 % figures** describe how much of the symbol is overhead, not how
  much can be recovered. Not used as recovery figures (our own table gives 19–66 % overhead).
- **Voyager's first use of Reed–Solomon in 1977** (Lincoln Laboratory page). Plausible, but other
  accounts date Voyager's Reed–Solomon coding to later encounters; dropped from the script to avoid an
  uncertain date.
