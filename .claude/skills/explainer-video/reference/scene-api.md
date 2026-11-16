# Writing scenes (`scenes/sNN_<beat>.js`)

A scene is a JavaScript file that registers one draw function for one beat. The engine calls it
with a 2D canvas context and the time in seconds; it draws that instant. `templates/video/scenes/`
is a minimal working set; `videos/how-a-gpu-works/scenes/` shows every pattern at full scale.

## Anatomy

```js
'use strict';
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  /* 1. cues: every time in the scene comes from a spoken word */
  const c = {
    cores: at('hook', 'cores'),                 // when "cores" starts
    coresEnd: at('hook', 'cores', 1, 't1'),     // when it ends
    that2: at('hook', 'that', 2),               // second "that" in this beat
  };

  /* 2. sound, on the same cues as the picture */
  sfx(c.cores, 'impact', 0.9);

  /* 3. the picture: a pure function of t */
  addScene('hook', function (ctx, t) {
    const show = tw(t, c.cores - 0.05, c.cores + 0.25, E.outBack);
    riseText(ctx, '21,760', CX, 530, show, { size: 176, weight: 900, family: F.disp, color: COL.accent, align: 'center' });
  }, { type: 'fade' });                          // how this scene ARRIVES
});
```

- File name `sNN_<beat id>.js`; files load in name order and must match the narration order.
- The first argument of `addScene` is the beat `id` from `script.py`. Every beat needs exactly one scene.
- Helpers and constants used by several scenes of the video go in the video's `components.js`
  (plain top-level functions; loaded before the scenes).

## Time

- `t` is seconds from the start of the video — the same clock as the word timings.
- A scene **starts 0.5 s before its beat's first word** (the first scene starts at 0) and ends
  where the next begins; the last runs to the end of the video.
- Transitions last 0.84 s, centred on the boundary. During one, both scenes are drawn, each with
  the real `t`. So your draw function is called from 0.42 s before its start to 0.42 s after its
  end. **Do not fade your base layout in at the start of a scene** — the transition reveals it.
  Have it present and already moving, or the cut shows an empty frame.
- `beatOf('id')` → `{ id, title, t0, t1 }` (first word start, last word end).
- `DATA.words` → `[{ w, t0, t1, beat, take, cls }]`, `DATA.takes`, `DATA.beats`, `DATA.dur`.
  Useful for diagrams driven by the narration itself.

### Cue keys

`at(beat, word, nth = 1, edge = 't0')`. The key is the word in lower case with surrounding
punctuation removed; apostrophes and hyphens stay: `"that's"`, `"thirty-two"`, `"gpu's"`, `"4k"`.
`bin/lockstep words <slug> [beat]` prints every key with its time (`word#2` = second occurrence).
A wrong key stops the page with `cue not found: beat/word#n`.

### Shaping time

| Helper | Meaning |
|---|---|
| `prog(t, a, b)` | linear 0→1 as t goes a→b, clamped |
| `tw(t, a, b, ease = E.io3)` | eased `prog` |
| `pulse(t, c, attack = 0.08, decay = 0.5)` | 0→1→0 spike at c: hits, flashes, pops |
| `win(t, a, b, fadeIn = 0.25, fadeOut = 0.25)` | 1 between a and b with soft edges |
| `clamp(x, a = 0, b = 1)`, `lerp(a, b, k)`, `smooth(k)` | |
| `E.lin in2 out2 io2 in3 out3 io3 out4 out5 io5 inExpo outExpo outBack outBackSoft outElastic ioSine` | easing curves on 0..1 |

`E.outBack` overshoots past 1: wrap it in `clamp()` when you use the value as an alpha or a blend.

### Randomness

`hash(n)` and `hash2(a, b)` → stable value in 0..1; `rng(seed)` → a generator function. Never
`Math.random()`. For "random flicker", quantise time: `hash(id * 3.3 + Math.floor(t * 9))`.

## Canvas, layout, colour

`W = 1080`, `H = 1920`, `FPS = 30`, `CX = 540`, `TAU`.
`SAFE = { l: 70, r: 1010, t: 270, b: 1470 }`, `CONTENT = { x: 70, y: 372, w: 940, h: 838 }`.

### Colour roles — the style decides the colours

Every colour comes from the video's `style.json`. Scenes name **roles**, never hex values or
hue names, so the same scene code renders correctly in any look:

| Role | Use for | Legacy name (same value) |
|---|---|---|
| `COL.ink` | primary text; the thing being talked about now | `COL.white` |
| `COL.subject` | the subject of the video and its core mechanism | `COL.cyan` |
| `COL.accent` | numbers; the contrasting or competing element | `COL.amber` |
| `COL.data` | the secondary family (data, memory, money, time…) | `COL.violet` |
| `COL.alert` | limits, failure, negation, "wrong" | `COL.coral` |
| `COL.good` | success, the correct outcome | `COL.mint` |
| `COL.onAccent` | text drawn on a fill of `subject` / `accent` (pills, badges, the "1" on a dot) | — |
| `COL.text`, `COL.dim`, `COL.faint` | secondary text, receding labels, barely-there marks | |
| `COL.panel`, `COL.panelHi`, `COL.line`, `COL.lineHi` | card fills and strokes, derived from the palette | |
| `COL.subjectDeep`, `COL.dataDeep`, `COL.accentDeep` | darker variants for fills under bright strokes | |

The legacy names still work (the GPU video uses them) but read wrongly in a light or warm style —
`COL.white` is dark ink on paper. Use role names in new code. Never hard-code a hex colour in a
scene unless it is part of a drawn object's own colour (a red apple stays red in any style).

`STYLE.mode` is `'dark'` or `'light'`; check it where a technique only works on one (see Light
styles below). `STYLE.name`, `STYLE.shape.radius` etc. are also readable.

### Fonts

`F.disp` (headlines), `F.ui` (body and glosses), `F.mono` (labels, numbers, code) are the style's
families. Weights: ask for what the family has (`lockstep fonts`). A family bundled with a single
weight renders that weight whatever you ask for, so `weight: 900` on Anton is just Anton.

`rgba(hex, alpha)` → CSS colour. `mixHex(hexA, hexB, k, alpha = 1)` → blend. Both take 6-digit
hex strings, which every `COL` entry is; every `color` argument below accepts any CSS colour.

The engine draws the backdrop, bloom (dark styles), vignette, caption scrim, progress bar and
captions. A scene draws only its own content on a transparent layer: do not fill the whole frame.

## Drawing

All take `ctx` first. `alpha` arguments multiply the current alpha.

| Shapes | |
|---|---|
| `panel(ctx, x, y, w, h, { r, fill, stroke, lw, accent, accentA })` | the style's card (radius, stroke, shadow come from `style.json` → `shape`); `accent` adds a coloured edge |
| `fillRR(ctx, x, y, w, h, r, fill)` · `strokeRR(ctx, x, y, w, h, r, stroke, lw)` · `rr(ctx, x, y, w, h, r)` | rounded rectangles (`rr` only builds the path) |
| `line(ctx, x0, y0, x1, y1, color, lw, alpha, dash)` | |
| `polyline(ctx, pts, color, lw, p = 1, alpha, dash)` | draws the first fraction `p` of the path: lines that draw themselves |
| `polySeg(ctx, pts, color, lw, p0, p1, alpha)` | a moving stretch of a path: signals travelling along a wire |
| `polyAt(pts, d)` · `polyLen(pts)` | point at distance d along a path; its length |
| `arrowHead(ctx, x, y, angle, size, color, alpha)` | |
| `dot(ctx, x, y, r, color, alpha)` · `ring(ctx, x, y, r, color, lw, alpha)` | |
| `glow(ctx, x, y, r, hex, alpha)` | soft light on dark styles, a soft tint on light styles; cheap (hex colour only) |
| `check(ctx, x, y, size, color, p, lw)` · `cross(ctx, x, y, size, color, p, lw)` | drawn with progress p |

| Text | |
|---|---|
| `text(ctx, str, x, y, { size, weight, family, color, align, base, alpha, ls, stroke, strokeW, maxW })` | returns the width. `ls` = letter spacing in px |
| `measure(ctx, str, size, weight, family, ls)` | width without drawing |
| `riseText(ctx, str, x, y, p, opts)` | fades and rises in with progress p (`opts.rise` px) |
| `tag(ctx, str, x, y, opts)` | small spaced mono label: `'WARP SCHEDULER'` |
| `pill(ctx, str, x, y, { bg, color, size, align, alpha })` | label on a filled capsule |
| `titleBlock(ctx, title, sub, p, { x, y, size, subSize, align, color })` | headline + subtitle |
| `fmt(n)` | `21760` → `"21,760"` |

| State | |
|---|---|
| `withAlpha(ctx, a, () => { … })` | everything inside at alpha a (skipped when a ≈ 0) |
| `withCam(ctx, { fx, fy, zoom, dx, dy, rot }, () => { … })` | zoom about a point, then pan: push-ins, shakes, zoom-throughs |

| Ready-made components | |
|---|---|
| `chipIcon(ctx, cx, cy, size, { color, label, sub, power, cells, cell })` | flat chip with a grid of cells |
| `drawLanes(ctx, x, y, w, h, n, i => ({ hex, base, head, len, a, masked }), { gap, group, groupGap })` | a bank of n parallel lanes with travelling pulses; `laneX(x, w, n, i, gap, group, groupGap)` gives a lane's centre |
| `instr(ctx, label, cx, cy, { w, h, color, hot, alpha })` | a boxed token (instruction, packet, step) |
| `callout(ctx, x0, y0, x1, y1, p, color)` | leader line with a dot |
| `streaks(ctx, t, { n, alpha, seed, color, x0, x1, y0, y1, minV, maxV, dir })` | speed lines |

### Beyond diagrams (`kit.js`)

| Helper | |
|---|---|
| `icon(ctx, name, cx, cy, size, color, { lw = 2, p = 1, alpha })` | one of 2,300 line icons (Lucide). `p` draws its strokes on. Find names with `lockstep icons <word>` |
| `bigWord(ctx, str, cx, cy, p, { maxW, max, weight, family, color })` | one word or short phrase scaled to fill the width, popping in with `p`: kinetic type |
| `fitSize(ctx, str, maxW, max, weight, family)` | the largest size at which `str` fits in `maxW` |
| `roughLine(ctx, pts, color, lw, { seed, wobble, p, alpha })` | hand-drawn line through points; `p` draws it on |
| `roughRect(ctx, x, y, w, h, color, lw, { seed, wobble, fill, overshoot })` · `roughCircle(ctx, cx, cy, r, color, lw, opts)` | hand-drawn box and circle (circling a word, boxing a number) |
| `highlighter(ctx, x, y, w, h, color, p, alpha)` | a marker swipe behind text, drawn left to right with `p` |

Hand-drawn shapes are deterministic for a given `seed`. For lines that "boil" like animation
drawn by hand, change the seed a few times a second: `seed: 7 + Math.floor(t * 6)`.

Icons are generic pictograms: good for a row of concepts, a status, a small label. The hero
object of a video deserves to be drawn by hand in the video's `components.js`, in its own style.

### Illustrations (`art.js`)

People, animals, food, objects and places from the illustration set, drawn in the style's
treatment. Full guide, motion helpers and bubbles: illustration.md.

```js
const cook = art('cook', { tone: 'medium-dark' });        // setup code: declare (fetched and rasterised before frame 0)
drawArt(ctx, cook, 540, 1150, 260, { anchor: 'bottom', p, rot, flipX, squash, alpha });   // draw function
```

| Helper | |
|---|---|
| `art(name, { set, tone, treat, colors, sticker, stickerColor, shadow, res })` | declare; defaults from `style.json` → `illustrations` |
| `drawArt(ctx, h, x, y, size, { anchor, p, alpha, rot, flipX, squash })` | draw; `size` is the illustration's width |
| `bob`, `sway`, `breathe`, `wiggle`, `hop(t, t0)` | character motion, pure functions of `t` |
| `bubble(ctx, x, y, w, h, tx, ty, { p, text, think })` | speech or thought bubble pointing at a speaker |

**2.5D** — `const P = new Proj({ cx, cy, scale, yaw, pitch })`: world x/y in a tilted plane, z up.
`P.pt(x, y, z)` → `[screenX, screenY, scale]`; `P.quad(ctx, x0, y0, x1, y1, z)` builds a path;
`P.slab(ctx, x0, y0, x1, y1, z0, z1, topFill, sideFill, edge)` draws an extruded box. Call
`P.set({...})` each frame to move the camera. See `drawChip` in the GPU video's `components.js`.

## Transitions

The third argument of `addScene` says how the scene **arrives** from the previous one.

| Type | Effect | Options |
|---|---|---|
| `{ type: 'fade' }` | cross-fade | |
| `{ type: 'zoomIn', fx, fy }` | camera dives into point (fx, fy) of the outgoing scene; the new scene grows out of it | `z` (2.6) outgoing zoom, `zb` (0.62) incoming start scale, `bx`, `by` incoming focus |
| `{ type: 'zoomOut', fx, fy }` | pulls back: the outgoing scene shrinks to (fx, fy) | `z` (0.45), `zb` (1.5), `bx`, `by` |
| `{ type: 'panDown' }` / `{ type: 'panUp' }` | camera travels vertically | `d` distance in px (620) |
| `{ type: 'slideLeft' }` / `{ type: 'slideRight' }` | the new scene pushes the old one sideways: the next card, the next step | |
| `{ type: 'cut' }` | hard cut on the boundary: punch, contrast, comedy timing | |
| `{ type: 'flash' }` | a hard cut hidden under a quick flash | `color` (role name or hex; default ink) |

Without a third argument a scene uses the style's default (`style.json` → `transition.default`);
the length of every transition is `transition.duration` (0.2–1.2 s). The transition grammar is a
style decision: a calm editorial look fades and slides, a loud poster look cuts, a journey
through scales zooms. Mix types deliberately — a different one marks a change of register.

Use the zooms to connect scales (into a part → the part becomes the next scene; back out to the
whole). Aim `fx, fy` at the object the viewer is looking at. The first scene's transition is unused.

## Backdrop

The backdrop comes from the style (`style.json` → `backdrop`: `circuit`, `solid`, `aurora`,
`paper`, `grid`, `halftone`, `stage`, `sunburst`, `blobs`; see art-direction.md). When the
visual world needs something none of these give — a starfield, a microscope slide, a city at
night — define it in the video's `components.js`:

```js
window.drawBackdrop = function (ctx, t) {
  backdropBase(ctx); backdropFlush(ctx);           // the palette's gradient, drawn small and scaled up
  /* your own slow, full-frame drawing here; a pure function of t */
};
```

It is drawn under every scene. Keep it slow and low in detail: fast full-frame change costs
bitrate and competes with the content.

## Light styles

On a light background the engine switches its own behaviour: no bloom, `glow()` becomes a soft
tint (multiply), speed lines draw normally, captions get a background-coloured outline. In
scenes:

- Do not rely on glow for emphasis: use size, a role-coloured fill, an outline, or `highlighter`.
- Fill shapes with `COL.panel` and outline them with role colours; big saturated fills are loud on
  white — keep them for one hero element at a time.
- Text on a role-coloured fill uses `COL.onAccent`.
- Dim things with `COL.dim` / `COL.faint`, not with low alpha on `COL.ink` over coloured shapes.

## Patterns

**Land on the word.** Start a reveal 50–100 ms before its word so the peak of the motion
coincides with the word: `tw(t, c.x - 0.05, c.x + 0.25, E.outBack)`. A picture that arrives after
its word feels late; one that arrives a beat early spoils it.

**Hit.** `const hit = pulse(t, c.x, 0.06, 0.6);` then scale/brighten by `hit` — pair with an `sfx`.

**Counter.** `fmt(Math.round(N * E.out4(prog(t, t0, c.word))))` ending exactly on the word that
says the number.

**Sequences inside a scene.** A beat usually holds 2–4 visual ideas. Gate each with its own
window and cross-fade so that one leaves before the next arrives:
```js
const part2 = tw(t, c.next - 0.45, c.next - 0.05);
const out1 = 1 - prog(part2, 0, 0.5), in2 = prog(part2, 0.5, 1);
withAlpha(ctx, out1, () => { /* sequence 1 */ });
withAlpha(ctx, in2,  () => { /* sequence 2 */ });
```

**Continuous camera.** Wrap a sequence in `withCam` with a slow zoom
(`zoom: lerp(1, 1.08, prog(t, start, end))`). It makes a static diagram feel filmed and keeps the
frame alive between words.

**Idle motion.** In every pause, something visibly large must keep changing — a push-in, a
pulsing glow, a travelling highlight, a second pass of an animation. Small wobbles are not enough:
the build reports any stretch of 0.4 s where the frame barely changes ("static holds").

**Stagger.** For n similar items, offset each by 30–60 ms: `tw(t, c.x + i * 0.04, c.x + i * 0.04 + 0.3, E.out3)`.

**Motion personality.** Pick one easing family in the brief and use it everywhere, so the video
moves like one hand made it: *springy* (`E.outBack`, `E.outElastic` for one or two hero moments;
entrances 0.3–0.45 s), *smooth* (`E.io3`, `E.out3`; 0.4–0.7 s), or *snappy* (`E.out5`, `E.outExpo`;
0.12–0.25 s, with hard cuts). Mixing all three in one video is what makes motion feel generic.

**Kinetic-type punchline.** On the line the whole beat builds to, clear the frame and give the key
word the screen: `bigWord(ctx, 'ZERO', CX, 800, tw(t, c.zero - 0.05, c.zero + 0.2, E.out3), { color: COL.accent })`.
Once or twice per video; it is a pattern interrupt, not a layout.

**Camera punch.** On an impact, push in and shake for a few frames:
`withCam(ctx, { fx: CX, fy: 800, zoom: 1 + 0.05 * hit, dx: 7 * hit * Math.sin(t * 95) }, () => { … })`
with `hit = pulse(t, c.x, 0.03, 0.35)`. Pair with an `impact` sound.

**Speed ramp.** For a repeated action (cards dealt, items counted, copies stamped), shrink the
interval as it goes — `t_k = t0 + 0.5 * (1 - Math.pow(0.82, k)) / 0.18` — so the viewer feels
"faster and faster" without being told.

**Out before the cut.** Do not animate a scene's content away at its end; the transition removes
it. Keep it alive through the boundary.

**Sound with picture.** Every visible event (appear, hit, move, lock, fail) gets a cue at the
same expression, e.g. `sfx(c.word - 0.05, 'pop', 0.6)`. See audio.md.

## Performance

`node engine/render.js videos/<slug> bench 12s 40s` prints the draw time of a frame. The
reference video's scenes take 40–70 ms per frame, which renders at about 40 frames per second
across four workers. A scene several times slower than that is worth fixing before a full
render. Costly: `ctx.shadowBlur` on many items (use `glow()`), `ctx.filter`, thousands of
gradient fills, large `clip()` regions inside loops. Build gradients once per frame, not once
per item.

## Debugging

| Message | Cause |
|---|---|
| `cue not found: beat/word#n` | the word is not in that beat, or is spelled differently — `lockstep words <slug> beat` |
| `caption/word mismatch at …` | `caption_phrases.json` differs from the narration — `lockstep captions <slug>` |
| `beats without a scene: …` | a beat in `script.py` has no `addScene` with that id |
| `scenes are out of order` | file names do not sort in narration order |
| `[pageerror] …` from `meta`, `still` or `scan` | a JavaScript error; `scan` gives the time it occurs |
| `dark_frames` in `scan` | the diagram zone is nearly empty at that time — usually a scene that starts blank |
| text in the wrong font | fonts missing — `bin/lockstep doctor` |

`bin/lockstep still <slug> --safe 12.5s` shades the platform keep-out areas and outlines the safe
rectangle. Times may be given as seconds (`12.5s`) or frame numbers (`375`).
