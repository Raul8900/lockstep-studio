# Creative brief — “Why a Torn QR Code Still Scans”

Requested by the user as: *“The secret behind QR codes working even when torn: how Reed–Solomon
error correction lets up to 30 % of a QR code get destroyed while still scanning cleanly.”* No length,
look or audience was named, so those are decided below. The user's “30 % of a QR code” is honoured
as the headline number and then made precise on screen: 30 % of the code's *bytes*, at the strongest
of four levels, with the corner squares unprotected (docs/sources.md).

## Audience and promise

Everyone who scans menus, parking meters and tickets — curious, not technical. They have seen scuffed
codes and codes with a logo in the middle still work, and if they have an explanation at all it is
the one the popular guides give: “error correction” or “it stores duplicates of your data”. After about
90 seconds they will be able to say what the extra part of a QR code really is (more points on a curve
drawn through the message, not copies), why a scanner can rebuild a torn-off piece from it, why
surviving 30 % damage costs about 60 % extra (every wrong byte costs two check bytes), and the fine
print (bytes, not paper; the corner squares are not protected). They stop scrolling because frame one
is a QR code being torn — and then it scans anyway.

## Angle

Raw material from the research, ★ = most surprising, ✎ = most drawable:
a level-H code is about two-thirds check bytes, in every version ★; this code is 26 bytes, 9 message
and 17 check, and fixes any 8 ✎; extra points on a curve beat copies — copies can't tell which one is
right ★✎; two dots fix a line, extra dots on it let you lose some ✎; a scanner can't see holes, so damage
looks like a lie; each liar costs two extra points ★; a logo in the middle is deliberate damage ★✎; a
3 % tear through a corner square kills the code while a 9 % tear elsewhere doesn't ★✎; the hero tear
destroys 6 of the 9 message bytes and the code still reads ★✎; 30 % means bytes, not area; Reed and
Solomon, 1960; QR codes, Denso Wave 1994, car parts; the same maths in CDs and deep-space links.

Five candidate angles:
1. **A QR code survives a tear because it doesn't store copies — it stores extra points on a curve
   through your message, and any enough of them redraw the rest.** (kept)
2. Two-thirds of a damage-proof QR code isn't your message at all.
3. That logo in the middle of a QR code is damage, on purpose.
4. Each wrong byte costs two check bytes — the real price of “30 %”.
5. The “30 %” has fine print: a 3 % tear in the wrong corner kills the code.

Kept (1): it is the only one that explains *why*, it is true to the mechanism (it is literally Reed and
Solomon's 1960 construction), it can be drawn with a ruler, and it overturns the “duplicates”
explanation the default videos give. The others become its beats: (2) is the hook's turn, (4) the
mechanism's punchline, (3) and (5) the pattern interrupts. On their own, (2)–(5) are facts without a
reason; (1) is the reason that makes all four click.

## Directions considered

### A — Build one that can't be torn (riso-printed, playful “oh, that's clever”)

The first frame is a QR sticker on a printed page; it rips and still scans. Then the video *reinvents*
the idea with the viewer: attempt one, a backup copy — a smudge makes the copies disagree and nothing
can say which is right; attempt two, Reed and Solomon's curve — two dots fix a line, extra dots on it
survive a tear; the new problem, a scanner can't see holes, so damage arrives as a lie — and the liar is
the dot off the line, at a cost of two dots each. Then the real sticker returns with its 26 bytes
outlined, the logo trick, the fine print, and the payoff: the first tear took six of the nine message
bytes and the extra points rebuilt them. World: the print shop — cream stock, black ink, spot colours,
torn paper. Why it suits: the design really does follow from its constraints, and the viewer gets to
feel each fix. Risk: build-it formats sag if a failure is told instead of shown; every attempt must
visibly fail on screen.

### B — The case of the torn code (mystery, forensic)

“This code is missing a chunk. It still scans. That shouldn't be possible.” A dark evidence board under
one light; clues pinned up as cards: a ten-letter message that somehow takes 26 bytes; codes with logos
that “shouldn't” scan; the obvious suspect, backup copies, cleared by an alibi (two copies can't settle
a disagreement); the culprit unmasked as a 1960 paper by Reed and Solomon. Typewriter labels, red
string, slow push-ins. Why it suits: the topic is an anomaly with a satisfying cause. Risk: suspense
delays the mechanism the viewer came for, the noir costume reads as a gimmick on an everyday object,
and a dark stage fights the printed, black-on-white nature of a QR code.

### C — Scanner's-eye view (second person, technical HUD)

“You are a phone camera. You have half a second to read this.” The camera *is* the scanner: a live
viewfinder HUD finds the three squares, samples the grid, reads 26 bytes, counts seven that don't add
up, solves, and prints the result. Phosphor-green readouts on black, data streams, a status bar of
the scanner's own (bytes read, errors found, fixes left). Why it suits: it shows the real pipeline in
order, and the stakes (time, damage) are real. Risk: Reed–Solomon's actual algebra can't be shown at
this length, so the key step becomes a progress bar — the mechanism disappears into “SOLVING…”. It is
also the closest of the three to the reference GPU video's dark technical look.

## Chosen direction

**A**, because it is the only direction in which the viewer *sees why* extra points beat copies — the
one idea that the default videos skip — and because the line-through-dots picture is exactly Reed and
Solomon's construction, so the analogy is the mechanism rather than a costume. From **B** it takes the
anomaly framing of the hook (“it still scans” is presented as something that shouldn't happen) and the
callback structure (the first tear is the evidence re-examined at the end). From **C** it takes the
scanner's viewfinder: four corner brackets and a readout pill that lock on whenever a code reads, turn
red when it fails, and come back in every QR scene as the video's verdict. B's dark stage and C's HUD
look are dropped: both would bury a black-and-white printed object in a dark technical world.

## Hook

Three openings, each a picture and a line inside three seconds:

1. **The rip.** A clean QR sticker inside scanner brackets; on “tore”, its bottom-right corner rips off
   and spins away. Line: “I just tore a chunk off this QR code.” Then the brackets lock and a pill reads
   STILL HERE: “It still scans.”
2. **The logo lid.** A QR code with a coffee-cup logo; the logo lifts like a lid to show the hole under
   it. Line: “Every QR code with a logo in the middle is broken. On purpose.”
3. **The split.** A QR code splits into a small orange stack and a big blue stack. Line: “Most of this
   QR code isn't your message.”

Chosen: **1**. The picture and the line are the same event, it is the user's own premise, and its first
frame is already the hero object. The scan result is real: the drawn code decodes to “STILL HERE” with
zxing-cpp, torn exactly as shown. The hook closes on (3)'s line as a turn — “Most of it isn't even your
message” — and (2) becomes the pattern interrupt in beat 5. **Open loop:** how can it read a piece that
isn't there? **Closed** in the last beat: that corner held six of the nine message bytes, and the extra
points rebuilt every one.

## Story shape

**Build it from nothing**, with a mystery-style hook and callback, about 90 s. Beats (each is a chapter,
a scene and a music mood):

| # | Beat (`id`) | Seconds | Job | Turn into the next |
|---|---|---|---|---|
| 1 | `hook` | 0–7 | Tear, it still scans, and most of it isn't your message. | “So what's the rest?” |
| 2 | `copies` | 7–17 | Attempt 1: a backup copy. Shown failing: a smudge turns STILL into STALL and two copies can't say which is right. | “Reed–Solomon codes, from 1960, do something smarter.” |
| 3 | `curve` | 17–32 | Attempt 2: the message as two dots, one line; extra dots on the line; tear two away, the survivors redraw the line and refill the gaps. | “But a scanner can't see holes…” |
| 4 | `liar` | 32–47 | The new problem: damage arrives as a wrong value. The liar is the dot off the line. Price: two extra dots per liar — one to find it, one to fix it. | “A QR code does exactly this, with bytes.” |
| 5 | `bytes` | 47–63 | The real design, assembled from the fixes: 26 bytes = 9 message + 17 extra points; fixes any 8, about 30 %; the logo is damage on purpose. | “The catch…” |
| 6 | `fineprint` | 63–74 | Limits: bytes, not paper; the three corner squares aren't protected; a tiny tear there and the scanner can't even find the code. | Back to the first tear. |
| 7 | `payoff` | 74–90 | The first tear took six of the nine message bytes; the extra points rebuilt every one. Built expecting to be torn. | End card holds. |

Structural surprises: the rip at 0.5 s; the slide from sticker to a print card at 7 s (object → idea);
the paper tear across the graph at ~27 s; the dot that jumps off the line in alert red at ~33 s; the
hard cut back to the real sticker with its bytes drawn as bricks at ~47 s (scale and register change);
the logo landing at ~59 s; the red “fine print” register at ~63 s; the zoom-out to the first, torn
sticker at ~74 s. Never more than about 15 s apart. **Payoff:** the torn corner's bricks fill back in.
**End ↔ start:** the last frame is the first frame's sticker, still torn, still reading STILL HERE.

## Pacing

Brisk. Target 85–92 s including the 0.3 s lead-in and the end card, about 230–240 words. Measured:
240 words, 92.7 s, `af_bella` at speed 1.08 (1.05 gave 94.4 s; 1.08 transcribed even more cleanly,
0.8 % word error). Pauses 0.22–0.32 s inside a thought, 0.45–0.55 s between thoughts, 0.65–0.75 s at beat changes
(the scene changes land in those). It runs fastest in the hook and the copies attempt, and breathes in
`curve` and `bytes`, where the viewer must read a line being drawn and count bricks: “Two dots fix
exactly one line” gets a full beat of silence before the extra dots arrive, and the 9 / 17 split holds
for about 1.5 s before the next number. Something visible changes every 1–2.5 s: dots, lines, tears,
bricks lighting up, the scanner locking.

## Visual world

The print shop. Everything is a printed object on cream stock: the hero is a white QR sticker with a
riso-blue offset shadow, drawn from the real module matrix of a version-1, level-H code that says
“STILL HERE”. It is torn, written on, covered with a logo and torn again, and it opens and closes the
video. The ideas in the middle are printed cards and a small graph sheet (a printed grid), on which the
message is two orange dots and the Reed–Solomon line is drawn in blue with a ruler-straight stroke.
Damage is physical: ragged paper tears with white fibre edges, ink smudges. The scanner is the only
“digital” element: four blue corner brackets and a readout pill, locking on success, turning red on
failure. The real code's bytes are shown as their actual 8-module “bricks” (from the standard's zig-zag
placement), tinted orange (message) or blue (extra points). Camera: steady, with slow push-ins and one
punch on the rip; motion personality *snappy-springy*: things pop in with `E.outBack` over 0.3 s,
tears and cuts are instant. Left out on purpose: polynomial division, GF(256) arithmetic, masks, timing
lines, versions beyond the one on screen, and any real brand's logo (the logo is a generic cup icon).
Where the analogy breaks is said on screen: the real “curve” lives in byte arithmetic and has no picture.

## Style

**riso-sticker**, a new look designed for this video (`style.json`; candidates in `candidates/`). Light,
warm, printed: cream stock (#F4EEE2 → #EBE2CF) with a faint halftone field in blue that drifts slowly,
like a riso print's screen. Palette from the medium — black ink plus spot inks — assigned by meaning:
**subject** riso blue #2A55B5 = Reed–Solomon's line, the extra points, the check bytes, the scanner;
**data** burnt sunflower #C26A00 = your message (two dots, nine bytes); **accent** fluorescent pink
#D6338A = numbers and the competing idea (the copies); **alert** scarlet #C92A1E = damage, tears, the
liar, the unprotected squares; **good** green #2B8742 = it scans. Blue against orange makes the
message/extra split readable at a glance. Type: Archivo Black for headlines (a heavy print grotesque),
Archivo for body and captions, IBM Plex Mono for byte values and tags. Cards are white with a 3 px
ink stroke and a hard blue offset shadow (misregistered second ink); radius 5. Captions: Archivo 800
with a sliding box highlight (radius 3, like a printed label). A thin progress line, no chapter names.
Transitions: slide-left between attempts (the next card), hard cuts for the two register changes, a
zoom out for the callback. **Rejected:** *ballpoint-notebook* (graph paper, marker headlines,
handwritten captions) — charming, but its handwriting read thin at phone size, its grid repeated the
template's studio-grid, and a notebook says “homework” where a printed sticker says “object you own”.
Also rejected outright: neon-blueprint (the previous video's dark look) and poster-pop (too loud for
an “oh, that's clever” idea).

## Sound

Score: 108 BPM, `pluck` kit, transposed +2 (light, curious, everyday). Mood arc: `drone` (cold open
on the rip) → `light` (the copies) → `build` (the curve idea rising) → `mechanical` (the liar; sparse,
leaves room for clicks) → `bright` (the real code, 9 + 17) → `tense` (fine print) → `finale` (payoff,
resolving on the held chord). Voice: `af_bella` at 1.08 — warm and quick, a different voice from the
reference video's `af_heart`; checked with `check-voice` (two fixes: “tear” was read as “tier” until
given a phoneme override, and “one to find it” was heard as “want to find it” until reworded to “one
finds it, one fixes it”). Effects are
paper and print-shop sounds: a `rip` for every tear, `whoosh` for the flying piece, `slide` and `flip`
for cards, `pop` for dots, `stamp` for bytes laid down, `tick` for counting, `lock` + `chime` whenever
the scanner reads, `deny` when it can't, a `riser` into the 9/17 reveal and the payoff. Cues on short
words sit 50–80 ms early at gain ≤ 0.6.

## What would make this fail

1. **It turns into a maths lesson.** Prevented by keeping the maths to one picture (a line through
   dots), never showing an equation, and giving each attempt a physical failure (a smudge, a tear)
   instead of a formula. The real code is shown as bricks you can count, not as algebra.
2. **It overclaims “30 % of the paper”.** Prevented by the fine-print beat, by narration that says
   “bytes”, and by verifying every scan claim on the rendered frames with a real decoder (the torn hero,
   the logo, the corner tear that fails).
3. **The analogy lies.** A straight line is a degree-1 curve and real QR codes use byte arithmetic.
   Prevented by saying so on screen (“byte arithmetic — no picture, same rule”), and by only claiming
   what holds exactly in both: any enough points pin down the curve; each liar costs two.
4. **It looks like every other QR explainer** (logo in the middle, bar chart of four levels). The logo
   is only an interrupt, the four levels appear once as small print, and the look is a print-shop world
   no other video in this repo uses.

## Retrospective

Written after delivery.

**What worked.**
- *A real hero object.* Drawing an actual QR code from its module matrix, and decode-testing every
  state of it (torn, logo, corner square), turned every on-screen claim into something checkable on the
  video's own frames. It also produced the best fact in the video, which no amount of desk research
  would have found: the hook's tear destroys six of the nine message bytes. Future videos about an
  object should look for the equivalent — a real artefact the engine can draw and the claims can be
  tested against.
- *Build it from nothing* gave the mechanism a reason to exist: copies fail on screen, the line survives
  a tear on screen, the liar is exposed on screen. The beat map held from brief to script; nothing
  drifted back to the default arc.
- The riso-sticker look (cream stock, black ink, spot blue/orange, misregistered blue shadow) was
  chosen against a notebook look by eye, and it carried the print-shop world without custom backdrops.
- The voice check paid for itself: “tear” as “tier” and “one to find” as “want to find” would both have
  shipped.

**What did not.**
- The first tear shape was chosen for looks and did not decode; tear shapes must be searched with the
  decoder in the loop, not drawn first.
- A negative claim needs a robustness test, not one render: the first corner-square tear failed to
  decode on the stills I checked, but decoded on other frames of the MP4 (25 of 60 random renders). It
  was enlarged until it failed in 0 of 80; `tools/qr_model.py` now asserts that for every damage shape.
- An eased value tested with `> 0` (`E.outBack(0)` is a tiny positive float) put the liar dot in the
  wrong place for ten seconds of the timeline; test times, not eased values, when a branch matters.
- The default mix left the quiet `pluck` kit 21.7 dB under the voice; quiet kits need `"mix"` from the
  start (here: music +4.5 dB, ducking −7 dB → 16.4 dB).
- Thin moving lines on a still card do not count as motion: the freeze check wants large areas to
  change. A whole card floating slightly (like the stickers) fixed every remaining hold at once.
- The leap from “STILL HERE” to “two numbers” is asserted, not shown.

**Next time.**
- Bridge the toy and the real thing in one picture (the nine message bytes becoming points).
- Give the title card more than type: a stamp or a printing pass.
- Test scans with phone camera apps as well as zxing-cpp.
