# Art direction

A look is an argument about the topic. Each video gets its own `style.json`, designed from the
topic's world, its tone and its audience during creative direction (creative-direction.md). The
engine reads it for the palette, type, backdrop, captions, progress bar, card shapes and
transitions. The scenes then draw the video's world in that look.

## From topic to look

Work through these in order and write the reasoning into the brief's Style section.

1. **Name the world.** If this video were filmed, where? A lab, a kitchen, a cockpit, a museum, a
   factory floor, the inside of a body, a city at night, an archive, deep space, a classroom.
2. **Pick the medium that world suggests.** Blueprint, chalkboard, lab notebook, field guide,
   poster, newspaper infographic, comic, arcade screen, X-ray, map, receipt, instrument panel,
   museum label, risograph print. The medium decides most of the rest.
3. **Set the register.** Light or dark; saturated or muted; high or low contrast; warm or cool.
   Wonder and mystery go dark; everyday, warm and playful go light; urgency goes high-contrast.
4. **Find the palette in the world.** Start from the subject's real colours (chlorophyll,
   rust, blood and plasma, sea water, sodium streetlights, old paper, phosphor green), then find a
   harmony: `bin/lockstep palettes <video> warm dark` (or `#hex` to search near a colour) renders 48
   matching palettes from a set of 1,000. Assign the roles (below), then check contrast.
5. **Choose a type voice** (table below): one display face with personality, one quiet body face,
   a mono for numbers and labels.
6. **Choose the backdrop, captions, transitions and shapes** to match the medium.
7. **Preview and compare.** Two candidates side by side: `bin/lockstep tile <video> a.json b.json`.
   Open the image. Choose with your eyes, then `bin/lockstep style-check <video>`.

When the user names a look ("make it look like a chalkboard", "use poster-pop"), that is the
decision: record it in the brief and still run the checks.

## The library

`styles/` holds looks made so far, each with a preview in `styles/previews/`
(`bin/lockstep styles` re-renders them and lists which videos used which look). They are
starting points to adapt — change the palette, swap a font, change the backdrop — not
destinations. A video whose `style.json` is identical to a library look gets a warning; the brief
must argue why that exact look fits.

| Look | Mode | Character | Suits |
|---|---|---|---|
| `neon-blueprint` | dark | charcoal, glowing line art, bloom, Inter | inside machines, computing, the engine's original look |
| `paper-ink` | light | warm paper, ink colours, Fraunces serif, slide transitions | history, biology, everyday things, notebook explanations |
| `poster-pop` | light | yellow, sunburst, Anton caps, hard offset shadows, hard cuts | myths, rankings, money, opinions with attitude |
| `midnight-editorial` | dark | aubergine stage, one warm light, Playfair, slow fades | space, psychology, true stories, anything told quietly |
| `chalkboard` | dark | green board, chalk colours, Caveat handwriting | maths, physics intuitions, "let me draw it for you" |
| `candy-pop` | light | pastel, rounded Fredoka, soft blobs, boxed captions | food, pets, the body, feel-good curiosities |
| `sunset-synth` | dark | purple-to-orange fields, wide Unbounded caps, glow | music, internet culture, the future |
| `studio-grid` | light | graph paper, electric blue, Space Grotesk, cards with shadows | process, craft, how things are made |

After a successful video, add its look with `bin/lockstep save-style <video> <name>`.

## `style.json` reference

Everything is optional except `name`. Omitted values keep the engine's defaults, and most of
the palette is derived from the few colours you give.

```json
{
  "name": "field-guide",
  "about": "One line: what this look is and which topics it suits (shown in the library).",
  "mode": "light",
  "palette": {
    "bg": ["#F4EFE3", "#F1EBDD", "#E9E1CF"],
    "ink": "#1E2A22",
    "subject": "#2F6B3A", "accent": "#C2571B", "data": "#3C5A99", "alert": "#B3261E", "good": "#2E7D32"
  },
  "fonts": { "display": "Fraunces", "body": "DM Sans", "mono": "IBM Plex Mono" },
  "backdrop": { "type": "paper", "wash": "subject" },
  "post": { "bloom": 0, "vignette": 0.3, "scrim": 0.75 },
  "captions": { "highlight": "underline", "weight": 800, "size": 74 },
  "hud": { "type": "line" },
  "shape": { "radius": 10, "stroke": 3, "strokeAlpha": 0.9, "panelAlpha": 0.6 },
  "transition": { "duration": 0.7, "default": "slideLeft" }
}
```

**`palette`** — given at all, it must have `bg` (one hex or three for a vertical gradient), `ink`
and the five roles. Optional overrides: `panel`, `panelHi`, `line`, `lineHi`, `text`, `dim`,
`faint`, `onAccent` (text on a role-coloured fill), `subjectDeep`, `dataDeep`, `accentDeep`.

| Role | Meaning in every video | Pick it so that |
|---|---|---|
| `subject` | the topic and its core mechanism | it is the colour the viewer remembers |
| `accent` | numbers; the contrasting or competing element | it pops against `subject` |
| `data` | the secondary family (data, memory, money, time…) | it is calmer than the first two |
| `alert` | limits, failure, negation | it reads as a warning in this palette |
| `good` | success, the correct outcome | it reads as "right" without being garish |
| `ink` | text and the thing being talked about now | contrast with the background ≥ 7 : 1 |

The caption highlight classes in `script.py` (`k`, `n`, `m`, `w`) use the same roles, so a term has
the same colour in the caption and in the diagram.

**`mode`** — `light` or `dark`; inferred from the background if omitted. Light styles turn off
bloom, turn glows into tints and outline captions in the background colour.

**`fonts`** — family names from `bin/lockstep fonts` (bundled, nothing to install) or installed on
the system (Inter, Inter Display, JetBrains Mono).

**`backdrop`** — `type` plus that type's options. Colours take role names or hex.

| Type | Looks like | Options (default) |
|---|---|---|
| `circuit` | fog, drifting dot lattice, perspective floor, vertical traces | — |
| `solid` | the palette's gradient only | — |
| `aurora` | large soft colour fields drifting | `colors` (subject, data, accent), `strength` 1, `speed` 1 |
| `paper` | grain, fibres, slow colour wash | `grain` 1, `lines` (ruled-line spacing in px, 0 = none), `lineColor`, `wash` (accent) |
| `grid` | graph paper drifting diagonally | `cell` 54, `color` (subject), `strength` 1 |
| `halftone` | print dots in a slow wave | `spacing` 38, `color` (subject), `strength` 1 |
| `stage` | dark stage, one light, floor pool, dust | `color` (ink), `strength` 1 |
| `sunburst` | slowly turning rays | `color` (accent), `cy` 900, `rays` 14, `strength` 1 |
| `blobs` | big flat shapes drifting | `colors` (subject, accent, data), `strength` 1 |

When none fits the world, draw your own in the video's `components.js` (`window.drawBackdrop`,
see scene-api.md).

**`post`** — `bloom` 0–1 (glow on bright strokes; dark styles only), `vignette` 0–1, `scrim` 0–1
(a soft band behind the captions in `scrimColor`), `dither` (leave at 0.014).

**`captions`**

| Key | Default | |
|---|---|---|
| `highlight` | `color` | `color`: the spoken word takes its role colour and lifts · `box`: one filled box slides from word to word · `underline`: one bar slides under the words |
| `font` | `disp` | `disp`, `ui`, `mono`, or a family name |
| `weight`, `size` | 800, 74 | size 56–100; condensed faces can go larger, wide faces smaller |
| `case` | `none` | `upper` for poster and social-native looks |
| `y` | 1350 | centre line; keep 1150–1400 |
| `maxW` | 800 | at most 860 (the platform buttons) |
| `stroke`, `strokeW` | dark outline, 15 | outline for legibility; 0 for none (then keep `scrim`) |
| `glow` | dark styles | halo on key terms |
| `fill`, `boxText` | ink, `onAccent` | base text colour; text colour on the box |
| `future` | 0.44 | opacity of words not yet spoken |
| `boxRadius` | 14 | |

**`hud`** — `segments` (numbered chapter bar with names: good for recipes, countdowns, long
videos), `line` (a thin progress line), `none` (narrative videos, 60 s and under).

**`shape`** — `radius` (0 sharp … 36 pill-soft), `stroke` and `strokeAlpha` (card outline),
`panelAlpha` (card opacity), `shadow` `{ "dx": 10, "dy": 10, "color": "ink" }` for a hard offset
(poster, cut paper) or `{ "dx": 0, "dy": 12, "color": "rgba(…, 0.12)" }` for a soft lift (cards).

**`transition`** — `duration` 0.2–1.2 s and the `default` type for scenes that do not name one:
`fade`, `slideLeft`, `slideRight`, `zoomIn`, `zoomOut`, `panDown`, `panUp`, `cut`, `flash`.

## Type voices

All bundled families are open-licence (OFL or Apache); `bin/lockstep fonts` lists their weights.

| Voice | Display | Body / mono |
|---|---|---|
| precise, technical | Space Grotesk, IBM Plex Sans, Inter Display | IBM Plex Mono, Space Mono, JetBrains Mono, Fira Code |
| loud, urgent, poster | Anton, Bebas Neue, Oswald, Archivo Black | DM Sans, Archivo, Work Sans |
| futuristic, wide | Unbounded, Syne | Manrope, Space Mono |
| friendly, rounded | Fredoka, Baloo 2, Rubik, Poppins | Nunito, DM Mono |
| editorial, historic, elegant | Playfair Display, DM Serif Display, Abril Fatface, Fraunces | Lora, Source Serif 4, DM Sans |
| handmade, teaching | Caveat, Permanent Marker | Patrick Hand, Courier Prime |
| documents, mystery | Special Elite | Courier Prime |
| comic | Bangers | Nunito, Rubik |

One face with personality is enough. Pair it with a quiet body face, and keep numbers in a mono
or in the display face's tabular figures.

## Make the scenes match the look

`style.json` dresses the frame; the scenes still have to draw in the same world. A chalkboard
look with crisp vector diagrams, or a poster look with thin hairlines, reads as a mistake.

| Look | Draw with |
|---|---|
| hand-drawn (chalk, notebook, marker) | `roughLine`, `roughRect`, `roughCircle` with boiling seeds; `highlighter`; handwritten labels; no glow |
| poster, bold | `bigWord` kinetic type, thick strokes (6–10 px), flat fills, hard shadows, hard cuts, few elements |
| editorial, dark stage | one lit subject at a time, generous space, serif headlines, slow push-ins, fades |
| technical, neon | thin glowing lines, 2.5D slabs, counters, `glow` and bloom |
| cards and process | panels in sequence, slides, icons as small pictograms, a progress line |
| soft, friendly | round shapes, springy easing (`E.outBack`), big friendly icons, pastel fills |

Icons (2,300 line icons, `bin/lockstep icons <word>`) suit small pictograms and labels. The hero
object deserves its own drawing in the video's `components.js`.

## Quality bar for a look

Open the tile (`out/style_tile.jpg`) at full size and check:

- the headline and body text read easily at phone size;
- the five role dots are clearly different from one another and from the background;
- the caption is readable and its highlight is obvious;
- a card reads as a surface, not as mud;
- the backdrop is felt, not watched — the tile should not look busy;
- it belongs to this topic, and it does not look like the previous video.

`bin/lockstep style-check` must pass: ink contrast ≥ 4.5 : 1 (7 : 1 recommended), every role ≥ 2.2 : 1
against the background (3 : 1 recommended), roles distinguishable, fonts available, caption size
and position inside the safe range.

## Do not

- Recreate a specific creator's or studio's signature style. Take from broad, shared traditions
  (Swiss poster, risograph print, blueprint, chalkboard, mid-century science illustration,
  newspaper infographics, 80s arcade), never from one channel's look.
- Draw logos, brand marks or trademarked characters. Name products in text.
- Use more than three accent colours in one sequence, or change what a colour means mid-video.
- Animate the backdrop quickly or with fine full-frame texture: it costs bitrate and attention.
