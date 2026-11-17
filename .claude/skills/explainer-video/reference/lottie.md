# Lottie animations

Lottie files are designer-made vector animations (JSON exported from After Effects or made in
LottieFiles' editor): characters that actually move, objects with personality, gestures, effects.
The engine plays them with lottie-web (MIT) frame-accurately on the narration's clock, so a
character can start on a word, hit its key pose on another, loop while idle and freeze on a cue —
and every frame stays a pure function of time.

## When to use one

- **Yes:** the who and what, with life — a bee flying in, a hand demonstrating a swipe, a heart that
  beats, a rocket lifting off, confetti on the payoff, a character reacting.
- **No:** the mechanism itself (draw it, so it is accurate and in the look), text (captions and type
  do that), decoration with no meaning in its sentence.
- **One artist, one style per video.** Animations from different authors have different line
  weights, palettes and motion; mixed together they read as clip art. Prefer several files by the
  same author, or recolour them all to the video's palette.

## Find, take, inspect

```bash
bin/lockstep lottie-search <video> bee flying         # LottieFiles' free animations, most downloaded first
                                                       # -> out/lottie_search.jpg: filmstrips in this video's look — open it
bin/lockstep lottie-get <video> 12555 bee              # -> lottie/bee.json + its entry in lottie/credits.json
bin/lockstep lottie-info <video>                       # duration, fps, markers, warnings, credits
bin/lockstep lottie-sheet <video>                      # every file as a filmstrip, recoloured as the look draws it
```

Search words: an object plus an action ("bee flying", "rocket launch", "hand swipe up"), and a
style word to stay consistent ("line", "outline", "flat", "isometric", "3d"). The search prints the
author of each result — once you like one, search that style again and prefer the same author.
The filmstrips show six moments across each animation, cropped to what it draws; check that it reads
on this video's background and that its motion is what the sentence needs.

**Your own files** (made by you or a designer): put the JSON in `lottie/` and add an entry to
`lottie/credits.json` — `{"name": {"title", "author", "source", "licence"}}`. `lockstep build`
refuses to run while any file in `lottie/` has no source and licence.

## Licence

LottieFiles' free animations are under the **Lottie Simple License**
(`lottie/LICENSE-LottieFiles.txt`, written by `lottie-get`):

- use, modify (recolour, crop, retime) and publish them, including commercially;
- modified versions stay under the same licence;
- attribution is not required but strongly encouraged — the production report prints a credit line
  for the video's description;
- **not allowed:** collecting files from LottieFiles to build a similar or competing service. Download
  what one video uses; never bulk-copy a library into this repository.

## In a scene

```js
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { bee: at('idea', 'bee'), lands: at('idea', 'lands'), stop: at('idea', 'stops') };
  const bee = useLottie('bee', { crop: true });                 // declare in the SETUP code
  const hive = useLottie('bee-hive', { res: 800 });              // drawn larger than 600 px
  sfx(c.lands, 'pop', 0.6);

  addScene('idea', function (ctx, t) {
    const x = lerp(-150, 760, tw(t, c.bee - 0.3, c.lands, E.io2));
    drawLottie(ctx, bee, t, x, 620 + bob(t, { speed: 2.4, amp: 16 }), 260, { loop: true });
    drawLottie(ctx, hive, t, 540, 980, 520, { at: c.lands, peak: 100 });   // its frame 100 lands on "lands"
  });
});
```

`useLottie(name, opts)` — call in the setup code (inside the draw function it is an error).

| Option | Default | |
|---|---|---|
| `recolor`, `colors` | style | see Matching the look |
| `crop` | false | trim the empty canvas the artist left around the drawing (measured over the whole animation) |
| `res` | 600 | size in px of its off-screen canvas, longest side; set it to the largest size you draw it at |
| `dir` | `lottie` | folder inside the video |

`drawLottie(ctx, handle, t, x, y, size, opts)` — `size` is the width of the animation's frame (or of
its content with `crop`); `(x, y)` is the centre, or with `anchor: 'bottom'` the middle of the base.

| Timing | |
|---|---|
| `at` | when the animation starts (seconds on the narration's clock — a cue) |
| `peak` | the animation frame that must land exactly on `at` (a key pose on a stressed word) |
| `speed` | playback rate (1 = as authored) |
| `loop` | repeat forever (idle characters, flapping wings, spinning loaders) |
| `segment` | play one named marker (`lottieInfo(h).markers` lists them) |
| `from`, `to` | play a frame range |
| `frame` | show one exact frame; freeze at a moment with `frame: lottieFrameAt(h, c.stop, sameOptions)` |
| `before`, `after` | `'hide'` to draw nothing before it starts or after it ends |

| Look | |
|---|---|
| `p` | 0–1 pop-in (scale with overshoot and fade) |
| `alpha`, `rot`, `flipX` | opacity, rotation in radians, mirror (turn a character to face where it goes) |
| `squash`, `dy`, `anchor` | squash and stretch about the base — feed `hop(t, t0)` straight in: `{ dy: j.dy, squash: j.squash, anchor: 'bottom' }` |

`lottieInfo(h)` → `{ fr, ip, op, frames, duration, w, h, markers }` for planning cues.
Drawing the same handle several times in one frame (a crowd, a swarm) is fine; each copy can be at
its own frame and speed.

## Matching the look

Lottie files arrive in their artist's colours. `recolor` maps them onto the video's palette when they
clash (set a default in `style.json` → `lottie`, override per file):

| `recolor` | Effect | Good for |
|---|---|---|
| `none` | as authored | files that already sit well on the background |
| `nearest` with `colors: [...]` | each colour becomes the closest of the listed palette colours | most cases: keeps the artwork's structure, speaks the video's palette |
| `palette` with 2–3 colours | dark-to-light ramp through the colours | print and duotone looks |
| `tint` with one colour | every colour becomes one | line-art animations on chalk, ink or neon looks (filled artwork becomes a silhouette) |
| `{ "#F9C74F": "accent" }` | listed colours (± a little) change, the rest stay | fixing one clashing colour |

Embedded bitmap images do not recolour (and blur when scaled up): `lottie-search` warns about them.
White artwork made for dark backgrounds disappears on light ones — recolour it or choose another.

## Quality checklist

- Opened `out/lottie_search.jpg` / `out/lottie_sheet.jpg` before choosing; the filmstrip shows the
  motion the sentence needs, in this video's colours.
- One author or one recolour scheme across the video.
- `crop: true` when the drawing occupies a small part of its canvas; `res` at least the drawn size
  (`lockstep scan` lists `soft_lottie`).
- Key moments land on words (`peak`); idle characters loop or breathe; nothing freezes mid-air by
  accident when an animation ends (`after: 'hide'`, a loop, or an explicit freeze).
- Shape-only files: no embedded images, no text layers (`lottie-info` warns).
- Every file credited (`lockstep build` checks).
