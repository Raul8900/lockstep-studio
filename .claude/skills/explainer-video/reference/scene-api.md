# Writing scenes (`scenes/sNN_<beat>.js`)

A scene is a JavaScript file that registers one draw function for one beat. The engine calls it
with a 2D canvas context and the time in seconds; it draws that instant. `templates/video/scenes/`
is a small working set: a photograph with a pull-back, a 3D Earth and Moon with NASA's maps,
archive film and a photograph with a laser drawn onto it.

## Anatomy

```js
'use strict';
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  /* 1. cues: every time in the scene comes from a spoken word */
  const c = { mould: at('discovery', 'mould'), killed: at('discovery', 'killed'), end: at('discovery', 'it', 2, 't1') };

  /* 2. media: declared once, here (never inside the draw function) */
  const dish = useImage('petri-dish');                       // media/petri-dish.jpg (lockstep take)
  const fleming = useImage('fleming', { cutout: true });     // media/fleming.cut.png (lockstep cutout)

  /* 3. sound, on the same cues as the picture */
  sfx(c.mould - 0.1, 'whoosh', 0.6);
  sfx(c.killed, 'impact', 0.8);

  /* 4. the picture: a pure function of t */
  addScene('discovery', function (ctx, t) {
    const pic = photo(ctx, dish, tw(t, c.mould - 0.5, c.end + 0.5, E.lin), { move: 'in', focus: [0.55, 0.5] });
    cutout(ctx, fleming, tw(t, c.mould, c.end), { x: 300, y: 1900, h: 1300, depth: 2, in: tw(t, c.mould, c.mould + 0.5) });
    circleIt(ctx, ...pic.at(0.6, 0.48), 160, 140, { p: tw(t, c.killed - 0.1, c.killed + 0.5, E.lin) });
  });                                                         // optional 3rd argument: how the scene ARRIVES
});
```

- File name `sNN_<beat id>.js`; files load in name order and must match the narration order.
- The first argument of `addScene` is the beat `id` from `script.py`. Every beat needs exactly one scene.
- Code used by several scenes goes in the video's `components.js` (top-level functions, loaded first).

## Time

- `t` is seconds from the start of the video — the same clock as the word timings.
- A scene **starts 0.5 s before its beat's first word** (the first at 0) and ends where the next
  begins. During a transition both scenes are drawn, each with the real `t`: have the frame full
  and already moving at the scene's first instant.
- `beatOf('id')` → `{ id, title, t0, t1 }`; `DATA.words` → `[{ w, t0, t1, beat, take, cls }]`;
  `DATA.dur` is the video's length.

### Cue keys
`at(beat, word, nth = 1, edge = 't0')`. The key is the word in lower case without surrounding
punctuation; apostrophes and hyphens stay (`"that's"`, `"twenty-eight"`). `bin/lockstep words
<slug> [beat]` prints every key with its time (`word#2` = second occurrence). A wrong key stops
the page with `cue not found: beat/word#n`, and `lint` names the nearest words.

### Shaping time
| Helper | Meaning |
|---|---|
| `prog(t, a, b)` | linear 0→1 as t goes a→b, clamped |
| `tw(t, a, b, ease = E.io3)` | eased `prog` |
| `pulse(t, c, attack = 0.08, decay = 0.5)` | 0→1→0 spike at c |
| `win(t, a, b, fadeIn = 0.25, fadeOut = 0.25)` | 1 between a and b with soft edges |
| `punch(t, t0, amt = 0.08, dur = 0.5)` | a scale ≥ 1 that kicks at t0 and settles: a zoom punch on a word |
| `shake(t, t0, amp = 14, dur = 0.6)` | camera shake for `photo`/`film` (`{ shake: shake(t, c.boom) }`) |
| `clamp`, `lerp`, `smooth` | |
| `E.lin in2 out2 io2 in3 out3 io3 out4 out5 io5 inExpo outExpo outBack outBackSoft outElastic ioSine` | easing curves on 0..1 |

### Randomness
`hash(n)`, `hash2(a, b)` → a stable value in 0..1; `rng(seed)` → a generator. Never `Math.random()`.

## Pictures and film (`media.js`)

Every picture is graded once, as it loads, by `style.json` → `grade` (contrast, saturation,
brightness, sepia, a tint), so photographs from different archives read as one film. `{ grade:
false }` keeps a picture's own colours.

| Setup (once) | |
|---|---|
| `useImage(name, o)` | a photograph, painting, print, map or texture from `media/` (`name` as taken). `o.grade` (false, or values that override the style's), `o.cutout: true` for `media/<name>.cut.png` |
| `useVideo(name, { from, to, focus })` | a film clip: the seconds `from`–`to` of the source are cut into frames once (at 30 fps, to `out/media/<name>/`). `focus: [x, y]` — the part of a wide clip to keep |

| Draw (every frame) | |
|---|---|
| `photo(ctx, h, p, o)` → box | the picture filling the frame, the camera moving through it as `p` goes 0→1 (`tw(t, start, end, E.lin)`: the move spans the shot). `o.move`: `in` (default), `out`, `left`, `right`, `up`, `down`, `still`; `o.focus: [x, y]` the point (0..1 of the picture) the move centres on; `o.amount` (1); or `o.from`/`o.to`: `{ z, x, y }` zoom and centre — `{ from: { z: 2.1, x: 0.28, y: 0.12 }, to: { z: 1 } }` pulls back from a detail to the whole. `o.ease` (E.ioSine), `o.alpha`, `o.shake` |
| `photoPath(ctx, h, t, keys, o)` → box | a camera path through a picture: `[[time, { z, x, y }], …]` (zoom, and the point of the picture at the frame's centre), eased between keys — overview → face → detail, each arrival on its word |
| `film(ctx, h, local, o)` → box | the clip filling the frame; `local` is seconds since the shot began (`t - shotStart`). `o.speed` (1), `o.loop`, `o.dur` (the shot's length, for the camera move), and `photo`'s camera options (default: a gentle push-in). The last frame holds after the clip ends |
| `cutout(ctx, h, p, o)` → box | a cut-out standing in the frame: `x`, `y` where its feet are, `h` its height, `depth` (1.6; more = nearer the camera, moves more against the picture behind), `drift: [dx, dy]` over the shot, `in` 0..1 rises and fades it in, `flip`, `shadow` |
| `shots(ctx, t, list, o)` | several shots in one beat: `[{ at: time, draw(ctx, t, p, local, dur), cut }]` in order; each runs until the next starts (`o.end` for the last: `DATA.dur` or the next scene). `p` is 0→1 through the shot, `local` the seconds since it began. `cut: 'flash'` or `'dip'` gives the cut a 0.18 s accent |

The box a picture returns has `at(u, v)` → the frame position of the point (u, v) of the picture
(0..1 from its top left) wherever the camera has moved it: pin overlays to what is in the picture.

```js
shots(ctx, t, [
  { at: 0, draw: (ctx, t, p, local) => film(ctx, launch, local, { dur: c.orbit - 0 }) },
  { at: c.orbit - 0.2, cut: 'flash', draw: (ctx, t, p) => {
      const pic = photo(ctx, earth, p, { move: 'out' });
      pointer(ctx, ...pic.at(0.42, 0.37), 620, 520, 'LONDON', { p: tw(t, c.london, c.london + 0.6, E.lin) });
  } },
], { end: DATA.dur });
```

## 3D worlds (`world3d.js`, three.js)

A world is built once at boot, from three.js objects, glTF models, HDRI skies and textures in
`media/`; a draw function views it through a camera. Frames are deterministic: animation clips
are set from `t`, never from a clock.

```js
const lab = world3d(async (T, w) => {                 // T: three.js; w: this world's helpers
  w.room();                                            // soft studio light, no file needed (or: await w.sky('studio'))
  w.background('#0e1116');  w.fog('#0e1116', 8, 30);
  w.ground({ color: '#2b3442' });                      // or { shadowOnly: true } to stand a model in a photo
  w.sun({ dir: [4, 8, 3], intensity: 2.4 });
  const bot = await w.model('robot', { height: 1.8 }); // media/robot.glb, scaled, stood on the floor, centred
  const pill = w.add(new T.Mesh(new T.CapsuleGeometry(0.2, 0.6, 8, 24), w.glow('accent', 2)));
  return (t) => {                                      // the world's state at time t — set everything from t
    bot.act(t, [[0, 'Idle'], [c.walk, 'Walking'], [c.wave, 'Wave', { loop: false }]]);
    bot.object.position.x = lerp(-2, 0, tw(t, c.walk, c.wave));
    pill.rotation.y = t * 1.2;
  };
});

addScene('lab', (ctx, t) => {
  const v = view3d(ctx, lab, t, camPath(t, [
    [c.start, { from: [0, 2, 9], to: [0, 1, 0], fov: 40 }],
    [c.wave,  { from: [2.2, 1.5, 3.4], to: [0, 1.4, 0], fov: 32 }],
  ]));
  if (v) { const [x, y] = v.project([0, 2.0, 0]); bubble(ctx, x + 160, y - 160, 300, 110, x + 20, y - 20, { text: 'Hi!', p: tw(t, c.wave, c.wave + 0.3) }); }
});
```

| `w.` | |
|---|---|
| `room(intensity)` | even studio light (three.js RoomEnvironment) |
| `await sky(name, { background, blur, intensity, rotate })` | an HDRI from `media/` lights the world and is its background (`background: false`: light only) |
| `sun({ dir, intensity, color, shadow, area })` · `ambient(color, intensity)` | a key light with soft shadows; a fill |
| `background(color)` · `fog(color, near, far)` | colours may be roles (`'subject'`) or values |
| `ground({ color, size, shadowOnly, opacity, y })` | a floor; `shadowOnly` catches shadows only — draw `photo()` first and the model stands in the photograph |
| `await model(name, { height \| size, at, turn, ground, shadows })` → `{ object, clips, act(t, schedule) }` | a glTF from `media/`, cloned (use one several times). `act` poses its animation from a schedule `[[start, clip, { speed, loop, blend }], …]`; `clips` lists the clip names |
| `await texture(name)` | a picture from `media/` as a texture: a planet's surface, a poster on a wall |
| `mat(color, o)` · `glow(color, intensity)` · `glass(o)` | materials that look right under image-based light |
| `add(object)` · `scene` · `T` | anything three.js can build: shapes, lines, points, text sprites |

| View | |
|---|---|
| `view3d(ctx, world, t, cam, o)` → `{ camera, project([x, y, z]) → [px, py, inFront] }` | renders the world over whatever is already drawn; its background is transparent unless it has a sky or a background colour. `cam`: `{ from, to, fov, roll }` |
| `camPath(t, keys, { ease })` | the camera along `[[time, { from, to, fov, roll, ease }], …]`, holding before the first and after the last key |
| `orbit(t, { center, radius, height, speed, start, fov })` | circling a point |

Rendering in software takes about 0.2 s a frame with shadows; that is fine for a minute of 3D.
Characters: `lockstep find <slug> model "robot"` (an expressive CC0 robot with walk, run, wave,
jump, dance, yes/no, thumbs-up, sit, death), Khronos samples (a fox, a walking man), Poly Haven
props; files you add yourself (Kenney, Quaternius packs: CC0) with `lockstep media <slug> add`.

## Overlays (`overlays.js`)

Drawn over a picture, film or 3D, with a soft shadow that reads on anything; each builds in with
`o.p` 0→1 keyed to the word that introduces it, and takes colour roles. Use one at a time.

| | |
|---|---|
| `bigNumber(ctx, value, x, y, o)` | a number that counts up from `o.from` and pops in: `prefix`, `suffix`, `decimals`, `sep: false` (years), `label` (a line under it), `size` (230), `color`, `count: false`, `t` + `hit` (a punch when it lands) |
| `ringGauge(ctx, cx, cy, r, share, o)` | a ring filling to `share` (0..1) with ticks; `show(k)` → the text inside (default a percentage), `label`, `color`, `ticks` |
| `pointer(ctx, tx, ty, lx, ly, label, o)` | a label on a dark plate with a leader to a point of the picture: `color`, `size`, `plate: false`, `t` (the dot breathes) |
| `circleIt(ctx, x, y, rx, ry, o)` | a hand-drawn ring drawing itself round something: `color` (alert), `lw`, `seed` |
| `arrowTo(ctx, x0, y0, x1, y1, o)` | a hand-drawn curved arrow: `bend`, `color`, `lw` |
| `spotlight(ctx, x, y, r, o)` | darkens all but a soft circle: `dark` (0.62), `soft` |
| `stamp(ctx, str, x, y, o)` | a word slammed on at an angle — DENIED, 1928, FREE: `color`, `size`, `angle` |
| `nameTag(ctx, name, sub, x, y, o)` | a person's or place's name with a line under it, sliding in on a plate: `align: 'right'`, `color`, `size` |
| `stagger(p, i, n, spread)` · `numText(v, o)` | the share of a group's build-in that is item i's; a number as text |

## Type, characters, drawing

- **Type that moves** (`text.js`): `textBlock(ctx, 'Text with *emphasis* and [a role](alert)', x, y, w, { size, p, reveal: 'rise' | 'pop' | 'slam' | 'type', fit, h, upper })`;
  `sayText(ctx, t, beat, x, y, w, o)` — the narration's own words, each on its word; with it,
  `hideCaptions(t0, t1)` in setup so the same words are not on screen twice.
- **Characters and things that act** (`kit.js`): `bob(t)`, `sway(t)`, `breathe(t)`, `wiggle(t,
  { from, until })`, `hop(t, t0)` → `{ dy, squash }` — apply to a cut-out's `y`, rotation or scale;
  `bubble(ctx, x, y, w, h, tailX, tailY, { text, think, p })` for speech.
- **Drawing** (`core.js`, `kit.js`): `text`, `measure`, `pill`, `line`, `polyline` (with progress),
  `arrowHead`, `dot`, `ring`, `glow`, `rr`/`fillRR`, `withAlpha(ctx, a, fn)`, `withCam(ctx, { fx,
  fy, zoom, dx, dy, rot }, fn)`, `roughLine`/`roughCircle`/`highlighter`, `icon(ctx, name, …)`
  (Lucide; `lockstep icons <word>`), `fitSize`, `bigWord`.
- **Colour roles**: `COL.subject`, `COL.accent`, `COL.data`, `COL.alert`, `COL.good`, `COL.ink`
  (and `rgba(COL.x, a)`, `mixHex`). The style decides what they are; `lint` warns on typed colours
  except black, white and greys.
- **Constants**: `W = 1080`, `H = 1920`, `FPS = 30`, `CX = 540`, `TAU`, `SAFE = { l: 70, r: 1010,
  t: 270, b: 1470 }`. Fonts: `F.disp` (numbers, names, stamps), `F.ui`, `F.mono`; `fontCSS(weight,
  size, family)`.

## Transitions between scenes

Inside a beat, cuts are shots (`shots`). Between beats, the third argument of `addScene` says how
the scene arrives; without one, the style's default (`cut` unless `style.json` says otherwise).

| Type | |
|---|---|
| `{ type: 'cut' }` | a hard cut on the boundary — the default; the references cut or keep the camera moving |
| `{ type: 'flash' }` | a cut hidden under a quick flash (`color`) |
| `{ type: 'fade' }` | a cross-fade: time passing |
| `{ type: 'zoomIn', fx, fy }` / `{ type: 'zoomOut', fx, fy }` | dive into a point of the old shot / pull back from it |
| `{ type: 'panDown' }` `panUp` `slideLeft` `slideRight` | the camera travels |
| `{ type: 'gl:<Name>', params, ease }` | one of 223 shader transitions (`lockstep transitions <slug>` shows the shortlist; `--all` every one): `gl:CrossZoom`, `gl:WhipPan`, `gl:FilmBurn`, `gl:InkBleed` … one family per video, sparingly |

## Sound
`sfx(time, type, gain = 1, { pan, pitch })` in setup code, on the same cue as the picture. Types:
`whoosh` (camera moves, cuts), `impact`/`thump` (a reveal, a number landing), `riser`/`swell`
(into a twist), `stamp`, `pop`, `blip`, `tick`/`count`, `chime`, `zip`, `slide`, `lock`, `deny`,
`fire`, `splash`, `rip`, `flip`, `slice`, `data`, `boot`, `call`, `stall` (reference/audio.md).

## Performance

`node engine/render.js videos/<slug> bench 12s 40s` prints the draw time of a frame. Photographs
and film draw in 40–50 ms; 3D with shadows in about 200 ms. Costly in 2D: `ctx.filter` in a draw
function (the grade is applied once, at load), `shadowBlur` on hundreds of items, big `clip()`
regions in loops.

## Debugging

| Message | Cause |
|---|---|
| `cue not found: beat/word#n` | the word is not in that beat — `lockstep words <slug> beat` |
| `no picture media/x.jpg` | not taken, or not restored — `lockstep media <slug>`, `… restore` |
| `useImage('x') called after loading` | declared inside a draw function |
| `film clip x: …` | ffmpeg could not cut the clip (the message says why); `from` beyond its end gives no frames |
| `model media/x.glb: …` | the file is missing or not glTF 2.0 |
| `caption/word mismatch at …` | `caption_phrases.json` differs from the narration — `lockstep captions <slug>` |
| `beats without a scene: …` | a beat in `script.py` has no `addScene` with that id |
| `dark_frames` in `scan` | a frame that is black and flat — a shot that draws nothing at that time |

`bin/lockstep still <slug> --safe 12.5s` shades the platform's keep-out areas. Times may be given
as seconds (`12.5s`) or frame numbers (`375`).
