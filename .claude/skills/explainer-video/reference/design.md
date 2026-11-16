# Design rules

The look of each video is decided in its creative brief and written in its `style.json`
(art-direction.md). This file holds the rules that apply in every look: the frame, sizes on a
phone, what colour roles mean, motion, attention, and what the encoder needs.

## The frame (1080 × 1920)

| Zone | y | What goes there |
|---|---|---|
| Top band | 0–270 | Nothing. Platform header and camera cut-outs. Backdrop only. |
| Progress bar | 286–340 | Drawn by the engine when the style has one (`hud`: segments with chapter names, or a thin line). Keep clear even when the style has none. |
| **Diagram zone** | **372–1210** | Everything the viewer must see. x 70–1010. |
| Caption band | 1250–1450 | Drawn by the engine (centre y 1350 unless the style moves it, within 1150–1400). Keep diagrams above it; glows and tints may spill. |
| Bottom band | 1470–1920 | Platform caption, username, buttons. Backdrop and decorative spill only. |

- Below y ≈ 900, keep numbers, names and anything that must be read **left of x ≈ 910**: both
  platforms stack their like/comment/share buttons on the right edge there. Repeating or
  decorative elements may extend further.
- Design for the vertical frame from the start. Stack things; a left-to-right process becomes
  top-to-bottom, or a row of at most 4–5 items. Never lay out for 16:9 and shrink.
- A headline usually sits at y 430–560; the main object is centred around y 800–900.
- Check any doubtful layout with `bin/lockstep still <slug> --safe <time>`.

## Size on a phone

The frame is shown about 390 points wide, so **1 px here ≈ 0.36 pt on the phone**.

| Element | Size (px) | Face |
|---|---|---|
| Hero number / single word | 150–250 | display face, heaviest weight (`bigWord` fits it to the width) |
| Headline | 60–112 | display face |
| Sub-headline, gloss | 34–44 | body face 500–700 |
| Label the viewer must read | ≥ 28 | mono or body 700–800, letter-spacing 2–4 for caps |
| Secondary label, tag | 22–26 | mono 600–700 |
| Decorative text (never required reading) | 19–22 | |
| Stroke width of a line that matters | ≥ 3 | |

Condensed display faces (Anton, Bebas Neue, Oswald) can run larger; wide ones (Unbounded, Syne)
need less size for the same presence. Handwriting faces need about 15 % more size to read.

On-screen text names things; it does not repeat the sentence — the captions do that. Keep a label
to 1–5 words, upper case for tags, and never show more than about 12 words of your own text at once.

## Colour means something

Every style maps its palette onto the same five roles, so meaning is stable whatever the look:

| Role | Means |
|---|---|
| `COL.subject` | the subject of the video and its core mechanism |
| `COL.accent` | numbers; the contrasting, competing or older thing |
| `COL.data` | the secondary family: data, memory, storage, money, time |
| `COL.alert` | limits, failure, negation, "wrong" |
| `COL.good` | success, the correct outcome |
| `COL.ink` | whatever is being talked about right now |
| `COL.dim`, `COL.line`, `COL.lineHi` | everything not in focus |

Decide what each role stands for in this topic once (write it as `COLOUR_LANGUAGE` in
`storyboard.py`) and never break it: if `subject` is "the vaccine" in scene 2 it is not "the
virus" in scene 5. The caption highlight classes use the same roles, so a term has the same colour
in the caption and in the diagram.

At any moment one thing is emphasised and the rest recedes — emphasis is the pointer. On dark
styles emphasis is brightness and glow; on light styles it is saturation, a filled shape, weight
or a marker swipe. On dark styles, dark fills with a bright edge read better than bright fills
(bloom turns a large bright area into haze); on light styles, large saturated fills are loud —
keep them for one hero element at a time.

## Motion

- Everything eases. Entrances `E.out3` or `E.outBack` over 0.25–0.4 s; exits faster (0.15–0.25 s)
  or by cross-fade. Linear motion only for things that are literally constant-speed.
- One focal movement at a time. If two things must move, stagger them 60–150 ms.
- Motion carries meaning: things that are the same move together; a cause moves before its effect;
  a part zooms out of its whole.
- The camera never quite stops: a slow push-in (`withCam`, 1.00 → 1.06–1.10 across a sequence) or
  drift underneath everything.
- **A visual change at least every 2–3 seconds**, tied to a word. A new element, a state change,
  a camera move, a highlight shifting. In the reference video the gap between consecutive cued
  events exceeds three seconds exactly once (3.4 s).
- Hold what must be read: a label needs about 0.8 s on screen before the next thing competes; a
  key number about 1.5 s.
- Give the pauses between sentences to the picture: finish an animation, let a pulse run, start
  the next reveal early.

## Keeping people watching

- **Frame 0 is the cover.** The first frame must already be lit, composed and moving — no fade
  from black, no title card. The strongest image and the hook number are on screen in the first second.
- **Hook as a picture, not only a sentence.** Show the contradiction: the thing looking one way,
  then revealed as another, inside the first eight seconds.
- **A recurring hero object.** One object (in 2.5D if it helps) that the video returns to and
  transforms — it opens the video, it is what the zooms go into and come out of, and it comes back
  changed on the end card.
- **Scale changes as transitions.** Zoom into a part → the part fills the next scene. Zoom out →
  the whole again. This is what makes ten scenes feel like one shot.
- **A pattern interrupt every 15–25 seconds**: flat diagram → 2.5D, calm colours → an `alert`
  "problem" scene, dense → one word on screen, steady → a hard cut or a camera punch, diagram →
  analogy. The story shape (story-formats.md) should plan where they fall.
- **Pay things off.** If the hook puts a word in quotation marks, a later scene removes them.
- **The end card moves.** The last 2–3 seconds after the final word hold the takeaway, still
  animating, while the music resolves. No "thanks for watching".

## Depth

Use `Proj` (2.5D slabs, pillars, tilted planes) for the hero object and one or two other moments;
parallax between layers at different heights sells it. Keep the explanatory diagrams flat — flat is
easier to read. On dark styles, `glow()` under important objects and the engine's bloom do the
rest; on light styles, use the style's card shadow and overlap instead.

## What the encoder needs

- No animated full-frame noise, grain or flicker. It multiplied the reference video's bitrate by
  eight for no visible gain; the engine already applies a fixed, invisible dither against banding.
- No hard 1-px patterns across the whole frame; no strobing.
- Large smooth areas, dark or light, are fine and cheap. The paper and halftone backdrops are fixed
  textures that drift slowly, which the encoder handles well.

## Do not

- Put essential content in the top or bottom band, or under the right-hand button column.
- Put a paragraph on screen, or labels under 22 px.
- Fade a scene in from nothing at its start, or leave it frozen in a pause.
- Use a colour outside its role, hard-code a hex value in a scene, or use more than three accent
  colours in one sequence.
- Draw real logos, brand marks, identifiable real people, or copied artwork. Name products in text;
  draw original schematic shapes; use the bundled illustration set for generic people and things.
