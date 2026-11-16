# Visual Storyboard — “Why a Torn QR Code Still Scans”

24 sequences · 92.66 s · 1080 × 1920 · 30 fps. The look, story shape and pacing were decided in docs/creative_brief.md. Timestamps are taken from the recorded narration; the animation code reads the same word timings, so picture and voice cannot drift apart.

## Conventions that apply to every sequence

**Canvas and safe areas.** Designed natively for 9:16; nothing is cropped from a wider layout.

| Zone | y range | Use |
|---|---|---|
| Top UI band | 0–270 | Backdrop only |
| Chapter bar | 286–340 | 7-segment progress bar (y 292) and chapter label (y 334) |
| Diagram zone | 372–1210 | All essential graphics, x 70–1010 |
| Caption band | 1250–1450 | Burned-in captions, centred on x 540, y 1350, max width 800 px |
| Bottom UI band | 1470–1920 | Backdrop and non-essential spill only |

Below y 900, numbers and names stay left of x ≈ 910, where both platforms stack their action buttons; only repeated or decorative elements extend further right.

**Look.** `riso-sticker` (light theme) — Risograph print on cream stock: black ink plus spot inks (blue, sunflower, fluorescent pink), a heavy grotesque, hard misregistered offset shadows and a halftone field. Printed objects, codes, labels and 'how this everyday thing works'.

**Backdrop.** a field of print dots whose size follows a slow wave; background gradient #F4EEE2 → #F1EADC → #EBE2CF.

**Colour language.** Riso blue (subject) = Reed–Solomon: the line, the extra points, the 17 check bytes, the scanner · Burnt sunflower (data) = your message: the two dots, the nine message bytes · Fluorescent pink (accent) = numbers and the competing idea (copies) · Scarlet (alert) = damage: tears, smudges, the liar, the unprotected corner squares, a failed scan · Green (good) = it scans · Black ink = the QR code itself and what is being talked about now.

**Type.** Archivo Black for headlines, Archivo for glosses and body, IBM Plex Mono for labels and counters. Smallest label 19–22 px; primary labels ≥ 24 px.

**Captions.** Archivo 800, 76 px, centred on y 1350, 1–5 words per phrase (77 phrases, 6 of them two-line); the spoken word sits on a filled box in its role colour. Words not yet spoken are dimmed. Position never changes.

**Scene changes.** 0.55 s, default `slideLeft`; each scene can choose its own arrival (zoom into a point, pull back, pan, slide, cut, flash). The incoming scene is already drawn and moving before the outgoing one has gone.

---

## 01 · The rip

**Time:** 0:00.00 → 0:02.49  (2.49 s)  
**Narration:** “I just tore a chunk off this QR code.”  
**Caption phrases:** I just tore a chunk | off this QR code.

| | |
|---|---|
| **Objects on screen** | The hero QR sticker (version 1-H, “STILL HERE”, drawn from the real module matrix) with a printed red dashed tear line and scissors; four blue scanner brackets. |
| **Position and size (1080 × 1920)** | Sticker 575 × 575 px (23 px modules) centred at (540, 692); brackets 30 px outside it. |
| **Background** | Cream riso stock with a faint blue halftone field drifting slowly (style backdrop). |
| **Movement** | Frame 0: sticker already floating (±0.5°), corner slightly lifted. On “tore” the bottom-right corner rips along a ragged edge and spins off to the lower right. |
| **Timing and easing** | Rip lands 0.05 s before “tore”; the piece leaves with ease-in over 0.9 s; camera punch decays in 0.35 s. |
| **Camera** | Slow push-in 1.00 → 1.03; a 6 px shake on the rip. |
| **Colour and emphasis** | Ink-black modules on white; the torn edge has white fibres; brackets dim blue. |
| **Text overlays** | None — the picture is the hook. |
| **Transition out** | Continues into the scan. |
| **Sound** | rip + whoosh on “tore”, small impact under it. |
| **Purpose** | Show the anomaly in the first second: a torn code. |

## 02 · It still scans

**Time:** 0:02.49 → 0:04.14  (1.64 s)  
**Narration:** “It still scans.”  
**Caption phrases:** It still scans.

| | |
|---|---|
| **Objects on screen** | Torn sticker, scan line, brackets, readout pill. |
| **Position and size (1080 × 1920)** | Pill centred at (540, 1050), 74 px tall. |
| **Background** | Cream riso stock with a faint blue halftone field drifting slowly (style backdrop). |
| **Movement** | A scan line sweeps the code top to bottom; the brackets snap in and turn green on “scans”; the pill pops with a check. |
| **Timing and easing** | Sweep 0.45 s ending on “scans”; snap E.outBack 0.3 s. |
| **Camera** | Push-in continues. |
| **Colour and emphasis** | Brackets and pill turn green (good); everything else stays ink. |
| **Text overlays** | “✓ STILL HERE” — what the code really decodes to. |
| **Transition out** | Continues. |
| **Sound** | two ticks during the sweep, lock + chime on “scans”. |
| **Purpose** | Prove the premise on screen; the payload is real (verified with zxing-cpp). |

## 03 · Mostly not your message

**Time:** 0:04.14 → 0:07.53  (3.39 s)  
**Narration:** “That's because most of it isn't your message at all.”  
**Caption phrases:** That's because | most of it isn't | your message at all.

| | |
|---|---|
| **Objects on screen** | A strip of 26 byte cells under the sticker: 9 orange, 17 blue with question marks. |
| **Position and size (1080 × 1920)** | Strip y 1150, 26 cells of 28 px with 5 px gaps and a 22 px split after the ninth; labels below it at y 1214. |
| **Background** | Cream riso stock with a faint blue halftone field drifting slowly (style backdrop). |
| **Movement** | Cells stamp in left to right on “most”; the orange nine light on “message”; the seventeen get “?” on “all”. |
| **Timing and easing** | Stagger 0.025 s per cell, E.outBack 0.25 s. |
| **Camera** | Push-in eases out. |
| **Colour and emphasis** | Orange = message (data), blue = the rest (subject). |
| **Text overlays** | “YOUR MESSAGE · 9” and “THE REST · 17 ?”. |
| **Transition out** | Slide left: the next card. |
| **Sound** | ticks rising in pitch for the cells, blip on “message”. |
| **Purpose** | Open the loop: what is the rest? |

## 04 · A backup copy

**Time:** 0:07.53 → 0:10.65  (3.12 s)  
**Narration:** “So what's the rest? A backup copy?”  
**Caption phrases:** So what's the rest? | A backup copy?

| | |
|---|---|
| **Objects on screen** | Pink ATTEMPT 1 pill; headline; card A “STILL HERE” (orange tag MESSAGE). |
| **Position and size (1080 × 1920)** | Pill y 452; headline baseline 560; card A 780 × 196 at y 650; card B lands at y 912. |
| **Background** | Cream riso stock with a faint blue halftone field drifting slowly (style backdrop). |
| **Movement** | On “backup copy” card B peels out of card A and drops into place below it. |
| **Timing and easing** | Peel 0.35 s E.outBack; small settle. |
| **Camera** | Static, slight drift. |
| **Colour and emphasis** | Copy B tagged pink (accent = the competing idea). |
| **Text overlays** | “ATTEMPT 1” · “A BACKUP COPY?” · “MESSAGE” · “COPY”. |
| **Transition out** | Continues. |
| **Sound** | slide on arrival, stamp when the copy lands. |
| **Purpose** | State the obvious guess fairly before breaking it. |

## 05 · The smudge

**Time:** 0:10.65 → 0:13.91  (3.26 s)  
**Narration:** “Smudge one letter, and the two copies disagree.”  
**Caption phrases:** Smudge one letter, | and the two copies | disagree.

| | |
|---|---|
| **Objects on screen** | Ink smudge on copy B's I; the I becomes an A. |
| **Position and size (1080 × 1920)** | Smudge over the letter at about (450, 950). |
| **Background** | Cream riso stock with a faint blue halftone field drifting slowly (style backdrop). |
| **Movement** | On “smudge” a soft ink blot spreads under the I; on “letter” STILL morphs to STALL with the A in red; on “disagree” a red ≠ badge appears between the cards and both shake. |
| **Timing and easing** | Splat 0.2 s; morph 0.25 s; shake 0.3 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Scarlet for the changed letter and the ≠. |
| **Text overlays** | “≠”. |
| **Transition out** | Continues. |
| **Sound** | splash on the smudge, flip on the morph, deny on “disagree”. |
| **Purpose** | Show the failure, not tell it. |

## 06 · Which one's right?

**Time:** 0:13.91 → 0:16.74  (2.84 s)  
**Narration:** “Which one's right? Copies can't tell you.”  
**Caption phrases:** Which one's right? | Copies can't tell you.

| | |
|---|---|
| **Objects on screen** | Pink scanner brackets with a “?” badge hopping between the two cards; a red FAILED stamp across them. |
| **Position and size (1080 × 1920)** | Brackets around card A ↔ card B; stamp centred at (690, 880), rotated −7°. |
| **Background** | Cream riso stock with a faint blue halftone field drifting slowly (style backdrop). |
| **Movement** | The brackets hop from card to card on “which” and “right”; on “you” the stamp hits. |
| **Timing and easing** | Hops every 0.3 s; stamp E.outBack 0.2 s with a camera punch. |
| **Camera** | Punch on the stamp. |
| **Colour and emphasis** | Pink question, scarlet stamp. |
| **Text overlays** | “?” · “FAILED”. |
| **Transition out** | Continues. |
| **Sound** | two ticks for the hops, stamp + impact on “can't”. |
| **Purpose** | Close attempt 1 decisively. |

## 07 · Reed–Solomon, 1960

**Time:** 0:16.74 → 0:20.99  (4.25 s)  
**Narration:** “Reed-Solomon codes, from 1960, do something smarter.”  
**Caption phrases:** Reed-Solomon codes, | from 1960, | do something smarter.

| | |
|---|---|
| **Objects on screen** | Kinetic title card: REED–SOLOMON in big blue type, a tag with the two names and the year. |
| **Position and size (1080 × 1920)** | Title centred at y 740; names y 860; year y 975; underline y 1038. |
| **Background** | Cream riso stock with a faint blue halftone field drifting slowly (style backdrop). |
| **Movement** | Cards slide off left; the title slams in on “Reed-Solomon”; “1960” counts up on the tag; a blue underline draws on “smarter”. |
| **Timing and easing** | Slam 0.25 s E.outBack; underline 0.4 s. |
| **Camera** | Push-in 1.00 → 1.05. |
| **Colour and emphasis** | Blue (subject) takes over the frame for the first time. |
| **Text overlays** | “REED–SOLOMON” · “IRVING REED & GUSTAVE SOLOMON · 1960”. |
| **Transition out** | Slide left: attempt 2. |
| **Sound** | whoosh as the cards leave, impact on the title, chime on “smarter”. |
| **Purpose** | Pattern interrupt; name the idea and its date. |

## 08 · Two numbers, one line

**Time:** 0:20.99 → 0:26.55  (5.55 s)  
**Narration:** “Say your message is just two numbers. Two dots fix exactly one line.”  
**Caption phrases:** Say your message | is just two numbers. | Two dots fix | exactly one line.

| | |
|---|---|
| **Objects on screen** | Blue ATTEMPT 2 pill; a white graph card with a printed grid and the label FIG. 2 · THE MESSAGE AS DOTS; two orange dots labelled 2 and 4; faint candidate lines pivoting about the first dot; a blue ruler line. |
| **Position and size (1080 × 1920)** | Card x 110–970, y 492–1132; dots at x 250 and 430 (values 2, 4 → y 960, 840). |
| **Background** | Cream riso stock with a faint blue halftone field drifting slowly (style backdrop). |
| **Movement** | Dots pop on “say” and “message”; on “fix exactly” six faint lines through the first dot swing onto the second; the line draws through both, ending on “line”. |
| **Timing and easing** | Pop E.outBack 0.3 s; line E.io3 1.0 s. |
| **Camera** | Static; the card drifts slightly. |
| **Colour and emphasis** | Orange message dots; blue line. |
| **Text overlays** | “ATTEMPT 2” · “YOUR MESSAGE” under the dots · “2”, “4”. |
| **Transition out** | Continues. |
| **Sound** | pop per dot, slide while the line draws. |
| **Purpose** | The core idea in one picture: two points fix a line. |

## 09 · Extra dots

**Time:** 0:26.55 → 0:29.41  (2.86 s)  
**Narration:** “Now add extra dots on that same line.”  
**Caption phrases:** Now add extra dots | on that same line.

| | |
|---|---|
| **Objects on screen** | Two blue dots on the line at x 610 and 790 (values 6, 8). |
| **Position and size (1080 × 1920)** | As above. |
| **Background** | Cream riso stock with a faint blue halftone field drifting slowly (style backdrop). |
| **Movement** | Dots pop on “extra” and “dots”; a pulse runs along the line through all four on “same line”. |
| **Timing and easing** | Pop E.outBack 0.3 s; pulse 0.6 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Blue extra dots, labelled in blue. |
| **Text overlays** | “EXTRA” · “6”, “8”. |
| **Transition out** | Continues. |
| **Sound** | pops rising in pitch, a soft tick per dot on the pulse. |
| **Purpose** | The redundancy is more points on the same line, not copies. |

## 10 · Tear two away

**Time:** 0:29.41 → 0:30.86  (1.45 s)  
**Narration:** “Tear any two away:”  
**Caption phrases:** Tear any two away:

| | |
|---|---|
| **Objects on screen** | A ragged vertical strip of the card containing dots 2 and 3 tears out and falls. |
| **Position and size (1080 × 1920)** | Strip x ≈ 335–705. |
| **Background** | Cream riso stock with a faint blue halftone field drifting slowly (style backdrop). |
| **Movement** | Rip on “tear”; the strip drops and fades below the card by “away”. |
| **Timing and easing** | Rip instant; fall E.in3 0.7 s. |
| **Camera** | Small punch on the rip. |
| **Colour and emphasis** | Scarlet tear edges. |
| **Text overlays** | None. |
| **Transition out** | Continues. |
| **Sound** | rip + whoosh. |
| **Purpose** | Physical damage, the way a sticker gets torn. |

## 11 · The line puts them back

**Time:** 0:30.86 → 0:34.97  (4.11 s)  
**Narration:** “the survivors still fix the line, and it puts the missing dots back.”  
**Caption phrases:** the survivors | still fix the line, | and it puts | the missing dots back.

| | |
|---|---|
| **Objects on screen** | Survivor dots 1 and 4 pulse; a new blue line draws between them across the gap; ghost dots fill in at 4 and 6. |
| **Position and size (1080 × 1920)** | As above. |
| **Background** | Cream riso stock with a faint blue halftone field drifting slowly (style backdrop). |
| **Movement** | Survivors pulse on “survivors”; the line draws by “line”; on “missing dots back” the two ghosts fill in with their values. |
| **Timing and easing** | Line E.io3 0.6 s; fills E.outBack 0.3 s, staggered 0.25 s. |
| **Camera** | Gentle push-in. |
| **Colour and emphasis** | Blue line; restored dots come back in their own colours (one orange, one blue) with a green tick. |
| **Text overlays** | “4”, “6” reappear; “RESTORED” tag. |
| **Transition out** | Fade: same card, the scanner's view. |
| **Sound** | slide while the line draws, pop + pop, chime. |
| **Purpose** | Any two survivors rebuild everything. |

## 12 · Damage looks like a wrong number

**Time:** 0:34.97 → 0:40.64  (5.67 s)  
**Narration:** “But a scanner can't see holes. To a scanner, a tear looks like a wrong number.”  
**Caption phrases:** But a scanner | can't see holes. | To a scanner, | a tear looks like | a wrong number.

| | |
|---|---|
| **Objects on screen** | Same graph card, whole again (FIG. 3 · WHAT THE SCANNER SEES), red NEW PROBLEM pill, scanner brackets; dot 1 jumps from 2 to 7 and still looks ordinary. |
| **Position and size (1080 × 1920)** | Card as before; brackets 30 px outside the card. |
| **Background** | Cream riso stock with a faint blue halftone field drifting slowly (style backdrop). |
| **Movement** | Brackets appear on “scanner” and the line fades (the scanner doesn't know it); a red nick marks the card under dot 1 on “tear”; on “wrong number” dot 1 jumps up, still orange, its label flipping 2 → 7. |
| **Timing and easing** | Brackets E.outBack 0.3 s; jump E.outBack 0.3 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Scarlet liar; the rest stay their colours; the line is hidden — the scanner doesn't know it. |
| **Text overlays** | “SCANNER VIEW” · “7”. |
| **Transition out** | Continues. |
| **Sound** | lock on the brackets, rip (small), flip on the jump. |
| **Purpose** | To a scanner, damage is not a hole — it is a lie. |

## 13 · The dot off the line

**Time:** 0:40.64 → 0:43.99  (3.34 s)  
**Narration:** “So which dot is lying? The one that's off the line.”  
**Caption phrases:** So which dot | is lying? | The one that's | off the line.

| | |
|---|---|
| **Objects on screen** | Question marks over all four dots; then a line through the three honest dots; the liar ringed and snapped back. |
| **Position and size (1080 × 1920)** | As above. |
| **Background** | Cream riso stock with a faint blue halftone field drifting slowly (style backdrop). |
| **Movement** | Question marks pop on “which dot”; on “off the line” the line draws through dots 2–4, the liar gets a red ring and slides back down to 2, turning orange again. |
| **Timing and easing** | Line 0.5 s; snap E.outBack 0.35 s. |
| **Camera** | Push-in to the liar 1.00 → 1.06. |
| **Colour and emphasis** | Scarlet ring, then green flash when fixed. |
| **Text overlays** | “?” ×4 · “LIAR” · “2 ✓”. |
| **Transition out** | Continues. |
| **Sound** | ticks for the question marks, deny on the ring, lock + chime on the snap. |
| **Purpose** | The detection idea: only the liar is off the line. |

## 14 · Two per liar

**Time:** 0:43.99 → 0:48.70  (4.71 s)  
**Narration:** “Every liar costs two extra dots: one finds it, one fixes it.”  
**Caption phrases:** Every liar costs | two extra dots: | one finds it, | one fixes it.

| | |
|---|---|
| **Objects on screen** | A printed ledger: “1 LIAR =” / “2 EXTRA DOTS”, with FIND IT and FIX IT chips. |
| **Position and size (1080 × 1920)** | Ledger at x 498, y 878–1064, in the empty lower-right of the card (left of the platform buttons). |
| **Background** | Cream riso stock with a faint blue halftone field drifting slowly (style backdrop). |
| **Movement** | The ledger slides up on “costs”; “FIND” (search icon) pops on “finds”, “FIX” (wrench icon) on “fixes”. |
| **Timing and easing** | E.outBack 0.3 s each. |
| **Camera** | Push-in eases out. |
| **Colour and emphasis** | Pink (accent) for the count; blue for the two extra dots, which pulse. |
| **Text overlays** | “1 LIAR = 2 EXTRA DOTS” · “FIND” · “FIX”. |
| **Transition out** | Hard cut: back to the real code. |
| **Sound** | blip, call, call. |
| **Purpose** | The cost that explains 30 %. |

## 15 · Twenty-six bytes

**Time:** 0:48.70 → 0:53.81  (5.11 s)  
**Narration:** “A QR code does the same trick, with bytes. This one has twenty-six bytes.”  
**Caption phrases:** A QR code | does the same trick, | with bytes. | This one has | twenty-six bytes.

| | |
|---|---|
| **Objects on screen** | The intact hero sticker; outlines of its 26 codewords (8-module bricks from the standard zig-zag) draw on; a counter. |
| **Position and size (1080 × 1920)** | Sticker 625 px (25 px modules) centred at (540, 708); honesty line and counter at y 1098. |
| **Background** | Cream riso stock with a faint blue halftone field drifting slowly (style backdrop). |
| **Movement** | On “bytes” every brick outline draws on; on “twenty-six” the counter speeds 1 → 26 as bricks number themselves. |
| **Timing and easing** | Outlines 0.5 s; counter speed-ramped to land on “bytes”. |
| **Camera** | Hard cut in; slow push-in. |
| **Colour and emphasis** | Ink outlines; pink counter. |
| **Text overlays** | “SAME RULE · BYTE ARITHMETIC (NO PICTURE)” · “26 BYTES”. |
| **Transition out** | Continues. |
| **Sound** | accelerating ticks (count) ending in a stamp. |
| **Purpose** | Pattern interrupt back to reality: the real structure. |

## 16 · Nine and seventeen

**Time:** 0:53.81 → 0:57.44  (3.63 s)  
**Narration:** “Nine are your message. Seventeen are extra points.”  
**Caption phrases:** Nine are your message. | Seventeen are | extra points.

| | |
|---|---|
| **Objects on screen** | Bricks fill: 9 orange, then 17 blue; legend. |
| **Position and size (1080 × 1920)** | Legend: one centred line at y 1178. |
| **Background** | Cream riso stock with a faint blue halftone field drifting slowly (style backdrop). |
| **Movement** | Orange bricks fill in order on “nine … message”, blue on “seventeen … extra points”. |
| **Timing and easing** | Stagger 0.04 s per brick, E.outBack. |
| **Camera** | Push-in continues. |
| **Colour and emphasis** | Orange vs blue at a glance. |
| **Text overlays** | “9 MESSAGE” · “17 EXTRA POINTS”. |
| **Transition out** | Continues. |
| **Sound** | stamp per group, riser into the blue fill. |
| **Purpose** | The real design is assembled from the fixes. |

## 17 · Any eight, about 30 %

**Time:** 0:57.44 → 1:01.61  (4.17 s)  
**Narration:** “At two per liar, it can fix any eight. About thirty percent.”  
**Caption phrases:** At two per liar, | it can fix any eight. | About thirty percent.

| | |
|---|---|
| **Objects on screen** | Eight bricks spread across the code flash red and heal; a big “≈ 30 %”. |
| **Position and size (1080 × 1920)** | Big line centred at y 1098; arithmetic under it at y 1178. |
| **Background** | Cream riso stock with a faint blue halftone field drifting slowly (style backdrop). |
| **Movement** | On “eight” the eight bricks turn red with crosses; on “thirty percent” they heal back to their colours and the number lands. |
| **Timing and easing** | Red 0.2 s stagger; heal 0.3 s. |
| **Camera** | Punch on the number. |
| **Colour and emphasis** | Scarlet damage, pink number. |
| **Text overlays** | “FIX ANY 8” → “ANY 8 OF 26 ≈ 30%” · “17 EXTRA ÷ 2 PER LIAR → 8”. |
| **Transition out** | Continues. |
| **Sound** | deny ×1, impact on “thirty”, chime on heal. |
| **Purpose** | The headline number, earned. |

## 18 · The logo

**Time:** 1:01.61 → 1:05.93  (4.33 s)  
**Narration:** “That's why a logo can sit in the middle. It's damage, on purpose.”  
**Caption phrases:** That's why a logo | can sit in the middle. | It's damage, | on purpose.

| | |
|---|---|
| **Objects on screen** | A logo plate (white rounded square with a generic cup icon) drops into the middle; brackets lock; readout. |
| **Position and size (1080 × 1920)** | Plate 7 × 7 modules at the centre. |
| **Background** | Cream riso stock with a faint blue halftone field drifting slowly (style backdrop). |
| **Movement** | Plate stamps down on “logo”; brackets lock on “middle”; on “damage” the plate goes see-through to show seven red bricks under it; “ON PURPOSE” stamp. |
| **Timing and easing** | Stamp E.outBack 0.25 s. |
| **Camera** | Punch on the stamp. |
| **Colour and emphasis** | Green lock; scarlet bricks; pink stamp. |
| **Text overlays** | “✓ STILL HERE” · “ON PURPOSE”. |
| **Transition out** | Hard cut to the fine print. |
| **Sound** | stamp, lock + chime, stamp. |
| **Purpose** | A thing they have seen every day, explained. |

## 19 · Bytes, not paper

**Time:** 1:05.93 → 1:10.11  (4.17 s)  
**Narration:** “The catch: that's thirty percent of the bytes, not of the paper.”  
**Caption phrases:** The catch: | that's thirty percent | of the bytes, | not of the paper.

| | |
|---|---|
| **Objects on screen** | Red THE FINE PRINT tag; the sticker with its byte area tinted and the rest hatched. |
| **Position and size (1080 × 1920)** | Sticker 625 px at (540, 708); words under it at y 1098 and 1176. |
| **Background** | Cream riso stock with a faint blue halftone field drifting slowly (style backdrop). |
| **Movement** | Tag stamps on “catch”; byte area tints blue on “bytes”; everything else hatches grey on “paper”. |
| **Timing and easing** | 0.3 s each. |
| **Camera** | Slow push-in. |
| **Colour and emphasis** | Scarlet tag; blue tint; grey hatching. |
| **Text overlays** | “THE FINE PRINT” · “30% OF THE BYTES” · “BYTES = 47% OF THIS CODE · HATCHED = NOT BYTES”. |
| **Transition out** | Continues. |
| **Sound** | stamp, slide, slide. |
| **Purpose** | Correct the “30 % of the code” misreading. |

## 20 · The unprotected squares

**Time:** 1:10.11 → 1:15.32  (5.21 s)  
**Narration:** “These three corner squares aren't protected at all. They're how the scanner finds the code.”  
**Caption phrases:** These three | corner squares | aren't protected at all. | They're how the scanner | finds the code.

| | |
|---|---|
| **Objects on screen** | The three corner squares ringed in red; a locator triangle between them; brackets. |
| **Position and size (1080 × 1920)** | Finder centres at module (3.5, 3.5), (17.5, 3.5), (3.5, 17.5). |
| **Background** | Cream riso stock with a faint blue halftone field drifting slowly (style backdrop). |
| **Movement** | Rings pop on “three”, “corner”, “squares”; “NO BACKUP” on “protected”; on “finds” the brackets snap to the three squares and a triangle joins them. |
| **Timing and easing** | Pops staggered; triangle draws 0.5 s. |
| **Camera** | Push-in toward the top-left square. |
| **Colour and emphasis** | Scarlet rings; blue locator. |
| **Text overlays** | “NO BACKUP” · “HOW THE SCANNER FINDS IT”. |
| **Transition out** | Continues. |
| **Sound** | pop ×3, deny, lock. |
| **Purpose** | The limit that the 30 % hides. |

## 21 · The tear that kills it

**Time:** 1:15.32 → 1:18.16  (2.85 s)  
**Narration:** “Tear into one, and this code won't scan.”  
**Caption phrases:** Tear into one, | and this code | won't scan.

| | |
|---|---|
| **Objects on screen** | A small rip takes the top-left corner square's outer corner; brackets search and turn red; readout fails. |
| **Position and size (1080 × 1920)** | Rip polygon from the verified model (3.1 % of the code; 0/80 decodes in the robustness test). |
| **Background** | Cream riso stock with a faint blue halftone field drifting slowly (style backdrop). |
| **Movement** | Rip on “tear”; brackets jitter; on “won't scan” they go red and the pill reads NO CODE FOUND. |
| **Timing and easing** | Rip instant; jitter 0.6 s; fail E.outBack. |
| **Camera** | Punch on the rip. |
| **Colour and emphasis** | Scarlet throughout. |
| **Text overlays** | “✕ NO CODE FOUND”. |
| **Transition out** | Slide right: back in time to the first tear. |
| **Sound** | rip, stall, deny. |
| **Purpose** | Show the failure the claim hides (verified: this exact frame does not decode). |

## 22 · Back to the first tear

**Time:** 1:18.16 → 1:22.13  (3.97 s)  
**Narration:** “That first tear? It took six of the nine message bytes.”  
**Caption phrases:** That first tear? | It took six | of the nine | message bytes.

| | |
|---|---|
| **Objects on screen** | The torn hero sticker from the hook; the missing corner as a dashed outline with its bricks as ghosts; counter. |
| **Position and size (1080 × 1920)** | Sticker 575 px at (540, 692), as in the hook; counter under it. |
| **Background** | Cream riso stock with a faint blue halftone field drifting slowly (style backdrop). |
| **Movement** | Dashed outline draws on “first tear”; on “six” six orange ghost bricks blink; on “nine” the three surviving message bricks light up too. |
| **Timing and easing** | Outline 0.5 s; blinks 0.2 s. |
| **Camera** | Slow push-in toward the corner. |
| **Colour and emphasis** | Orange message ghosts, one blue ghost, scarlet dashed edge. |
| **Text overlays** | “6 OF 9 MESSAGE BYTES”. |
| **Transition out** | Continues. |
| **Sound** | tick ×6, blip. |
| **Purpose** | Close the loop with evidence from the hook. |

## 23 · Rebuilt

**Time:** 1:22.13 → 1:24.94  (2.81 s)  
**Narration:** “The extra points rebuilt every one.”  
**Caption phrases:** The extra points | rebuilt every one.

| | |
|---|---|
| **Objects on screen** | Blue threads from the sixteen surviving blue bricks converge on the missing corner; ghosts fill solid; brackets lock. |
| **Position and size (1080 × 1920)** | As above. |
| **Background** | Cream riso stock with a faint blue halftone field drifting slowly (style backdrop). |
| **Movement** | Threads draw on “extra points”; ghost bricks fill one by one on “rebuilt every one”; lock + pill. |
| **Timing and easing** | Threads 0.6 s; fills stagger 0.07 s. |
| **Camera** | Push-in peaks then eases. |
| **Colour and emphasis** | Blue threads; orange and blue fills; green lock. |
| **Text overlays** | “✓ STILL HERE”. |
| **Transition out** | Continues to the end card. |
| **Sound** | riser, pops rising, lock + chime. |
| **Purpose** | Show the mechanism finishing the job. |

## 24 · End card

**Time:** 1:24.94 → 1:32.66  (7.71 s)  
**Narration:** “A torn QR code isn't lucky. It was built expecting to be torn.”  
**Caption phrases:** A torn QR code | isn't lucky. | It was built | expecting to be torn.

| | |
|---|---|
| **Objects on screen** | The torn sticker, still reading STILL HERE; headline “EXTRA POINTS, NOT COPIES.”; tag REED–SOLOMON · 1960; on “expecting” the red dashed tear line and scissors are printed back on along the torn edge. |
| **Position and size (1080 × 1920)** | Headline y 432, tag y 490; the sticker eases to 500 px at (540, 826); pill y 1138. |
| **Background** | Cream riso stock with a faint blue halftone field drifting slowly (style backdrop). |
| **Movement** | Ghost outlines fade; the sticker keeps floating; the pill breathes; the headline types on by word. |
| **Timing and easing** | Headline words 0.12 s apart. |
| **Camera** | Slow push-in to the end. |
| **Colour and emphasis** | Ink headline with pink “NOT COPIES”; green pill. |
| **Text overlays** | “EXTRA POINTS, NOT COPIES.” · “REED–SOLOMON · 1960”. |
| **Transition out** | End of video. |
| **Sound** | chime on “torn”, the finale chord. |
| **Purpose** | Leave the takeaway on screen while the music resolves. |
