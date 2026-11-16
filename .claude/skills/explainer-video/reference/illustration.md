# Illustrations

The engine draws diagrams, type and icons; illustrations add the **who and what**: people,
animals, objects, places — characters to act, props to build a metaphor with, crowds to show a
number. They come from Microsoft Fluent Emoji (MIT licence), bundled in `assets/illustrations/`:

- **1,595 subjects**: people in hundreds of roles and activities (each with five skin tones),
  faces and gestures, animals and plants, food, tools, devices, science and medicine, buildings,
  transport, weather, symbols.
- **Three sets**, chosen by the style:

| Set | Looks like | Suits |
|---|---|---|
| `color` | soft gradients, a gentle 3D feel | most looks; premium, friendly |
| `flat` | flat fills, crisp shapes | poster, cards, print and flat-design looks |
| `line` | single-colour line art, no skin tones | tinted to a role colour: chalk, ink, neon |

## Find and preview

```bash
bin/lockstep art honey                         # search by meaning: names, labels, keywords
bin/lockstep art doctor --set line             # only what exists in one set
bin/lockstep art-sheet <video> honeybee flower "light bulb" cook-dark   # -> out/art_sheet.jpg, in this video's look
```

Open the sheet before using anything: it shows each illustration exactly as the video's style
will draw it (set, treatment, border, shadow). Words in `art-sheet` are searched; exact names are
used as given.

## In a scene

```js
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { bee: at('idea', 'bee'), stop: at('idea', 'stops') };
  const bee = art('honeybee');                                  // declare in the SETUP code
  const keeper = art('farmer', { tone: 'medium-dark' });        // people: light, medium-light, medium, medium-dark, dark
  const hero = art('honey-pot', { res: 900 });                  // will be drawn larger than 600 px

  addScene('idea', function (ctx, t) {
    const j = hop(t, c.stop, { height: 90 });
    drawArt(ctx, bee, 540 + 260 * Math.sin(t * 1.3), 720 + bob(t, { speed: 3, amp: 14 }), 160,
      { p: prog(t, c.bee - 0.1, c.bee + 0.25), flipX: Math.cos(t * 1.3) < 0, rot: sway(t) });
    drawArt(ctx, keeper, 300, 1150 + j.dy, 260, { anchor: 'bottom', squash: j.squash });
  });
});
```

`art(name, opts)` — call in the scene's setup (calling it inside the draw function is an error):
every illustration is fetched, rasterised and treated once, before the first frame.

| Option | Default | |
|---|---|---|
| `set` | style | `color`, `flat`, `line` |
| `tone` | none (the yellow default) | skin tone for people and hands; ignored by the line set |
| `treat`, `colors` | style | `none`; `tint` with `[colour]`; `duotone` with `[dark, light]` or `[dark, mid, light]` (role names or hex) |
| `sticker`, `stickerColor` | style | die-cut border, as a fraction of the size (0.03–0.06) |
| `shadow` | style | `{ dx, dy, blur, alpha, color }`, sizes as fractions of the illustration |
| `res` | 600 | raster size in px; set it to the largest size you draw this illustration at |

`drawArt(ctx, handle, x, y, size, opts)` — `(x, y)` is the centre, or with `anchor: 'bottom'` the
middle of the base (feet on the ground; squash and rotation pivot there). `size` is the width of
the illustration itself. Options: `p` (0–1 pop-in with overshoot), `alpha`, `rot` (radians),
`flipX`, `squash` (+ squashed wide, − stretched tall; about ±1).

### Motion helpers (pure functions of time)

| Helper | Returns | Use |
|---|---|---|
| `bob(t, { speed, amp, phase })` | y offset ≤ 0 | walking, trotting, flying bounce (`speed` = steps per second) |
| `sway(t, { speed, amp, phase })` | rotation | idle lean, a leaf, a hanging sign |
| `breathe(t, { speed, amp })` | scale ≈ 1 | anything alive that is standing still |
| `wiggle(t, { from, until, amp, speed })` | rotation | excitement, alarm, "this one!" |
| `hop(t, t0, { height, dur })` | `{ dy, squash }` | a jump at `t0`: crouch, stretch, land with a squash — put it on a word |

### Speech and thought bubbles

```js
bubble(ctx, 600, 820, 360, 130, 470, 1010, { p: prog(t, c.says - 0.1, c.says + 0.2), text: 'Not me!' });
bubble(ctx, 600, 820, 360, 130, 470, 1010, { think: true, text: '…why?' });
```

The body is centred at `(x, y)`, `w × h`; the tail points at the speaker `(tx, ty)` and the bubble
grows out of it. Two to five words; the caption already carries the sentence.

## Matching the look

The style decides the default set and treatment (`style.json` → `illustrations`, see
art-direction.md), so illustrations sit in the same world as the type and the cards:

| Look | Default treatment |
|---|---|
| `neon-blueprint` | line set tinted `subject`: glowing line art |
| `chalkboard` | line set tinted `ink`: chalk drawings |
| `paper-ink` | line set tinted `ink`: pen-and-ink drawings |
| `poster-pop` | flat set, cream die-cut border, hard ink shadow |
| `riso-sticker` | flat set, ink→blue→paper tritone, pink misregistered shadow |
| `candy-pop` | color set, white border, soft shadow |
| `midnight-editorial` | color set, soft dark shadow |
| `sunset-synth` | color set, purple→pink→yellow tritone with a cream border |
| `studio-grid` | flat set, soft shadow (like its cards) |

Override per illustration only with a reason (one hero in full colour among line drawings is a
deliberate spotlight; three random treatments is noise).

## Using them well

- **Who and what, not how.** Illustrations name the actors and the objects; the mechanism still
  needs a diagram. A bee illustration says "bees"; how nectar becomes honey is drawn.
- **A recurring character beats a parade.** One protagonist (a cook, a delivery rider, a cell
  drawn as a face) who reappears and reacts holds attention better than a new emoji per sentence.
- **Acting.** Swap faces on the beat (`neutral-face` → `face-screaming-in-fear` with a hop),
  turn characters toward what they look at (`flipX`), let them land on the stressed word.
- **Build a small world.** Object metaphors (a kitchen brigade for parallel work, a post office
  for a network) come together from props: counters, pots, parcels, a truck.
- **Show numbers as crowds.** A grid of 100 small people where one lights up; a field of tiny
  phones. Vary tones in human crowds.
- **One set, one treatment per video.** Mixed sets in one frame look like clip art.
- **Restraint.** One to three illustrations per idea, each meaning something in the sentence it
  appears with. Decoration and emoji soup read as cheap.
- **Size.** At least 90 px to read on a phone; a punchline hero can take 500–900 px (raise `res`).
  `lockstep scan` lists illustrations drawn larger than their raster (`soft_illustrations`).
- **Never in captions.** Captions are text; illustrations live in the diagram zone.

## Accuracy and respect

- An emoji is a symbol, not a depiction. `microbe` is not a particular virus; `brain` is not
  anatomy; `dna` is not a real helix. Label it, or draw the accurate version when accuracy is the
  point.
- People: mix skin tones and genders across a video and within any group; do not tie a tone or
  gender to a role in a way that reinforces a stereotype. Never present an illustration as a real,
  identifiable person.
- `tint` and `duotone` replace skin tones with the palette. When representation matters, draw
  people with `treat: 'none'`, or choose a look that keeps colour.
- Leave out religious and political symbols unless they are the topic, and be careful with
  gestures whose meaning differs by culture. Do not make light of illness, injury or death with
  comic faces.

## Credit

Fluent Emoji is MIT-licensed. The production report lists every illustration a video uses
(`data/timeline.json` → `art`) and the credit line; put "Illustrations: Microsoft Fluent Emoji
(MIT)" in the video's description when it is published.
