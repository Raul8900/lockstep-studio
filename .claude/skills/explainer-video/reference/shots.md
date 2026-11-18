# Shots: what fills the frame

What the five reference shorts share, frame by frame, and how to do it with this engine. The
short version: **one world, one hero, real pictures filling the frame, a camera that never stops,
and almost nothing on top.**

## One world

Each reference lives in one world from the first frame to the last, and comes back to where it
started at the end: a hospital and a particle accelerator; a 90s bedroom, a jungle and a memory
warehouse in one game-like style; space, a control room and a city; a toy castle with a cartoon
cast; an antique map with small historical figures. Choose the world from the material research
found:

| World | Made of | Fits |
|---|---|---|
| **The archive** | photographs and film of the real people and places (Wikimedia, NASA, museums, Internet Archive), graded as one film | history, discoveries, biographies, disasters |
| **The real world now** | stock photographs and footage (Pexels, Pixabay — free keys), with cut-outs | everyday science, the body, money, cities |
| **Space** | NASA imagery, and a 3D world with NASA's maps on planets | astronomy, spaceflight, the Earth |
| **A 3D world** | Poly Haven props and skies, Khronos models, a CC0 animated character, and shapes built in three.js | mechanisms, scale, "what if", anything abstract |
| **The museum** | paintings, engravings and maps from public-domain collections (Art Institute of Chicago, Cleveland, Wikimedia) | older history, myths, art |

Mixing is fine when it is one film: an archive story can drop into a 3D model of the mechanism
and come back, if the grade and the camera language carry across. Jumping between unrelated
looks every shot is the "collage" failure.

## One hero

A recurring hero acts out each line: the scientist (photographs of the person, cut out and moved
in front of other pictures), an object (the dish, the Moon, the coin), a 3D character (the CC0
robot walks, runs, waves, jumps, sits, dies), or "you" (point-of-view shots). When a line says
"he noticed", the picture shows him noticing; when it says "it burst", something bursts.

## Abstract things become physical

The references never draw a diagram on flat colour. Every abstraction is an object in the world:
memory is a warehouse of shelves; a dose is a stack of glowing blocks; a delay is a ring gauge
counting; a probability is a crowd with a few people lit; a signal is a beam of light; a number is
giant type standing in the scene. Find the physical thing in the brief's "World and hero"
section, then build it: in 3D from three.js shapes (`world3d`), or in 2D over a photograph
(`ringGauge`, `bigNumber`, a laser drawn with `polyline` and `glow`).

## The camera never stops

- **Every shot fills the frame.** No picture floats in a box; no flat background shows.
- **Every shot moves**: push in on the detail the line names, pull back to reveal, pan across a
  wide photograph, tilt down a tall one, orbit or dolly through 3D, film that plays. A still
  photograph is held for at most a word without a move.
- **Shots are short**: 1.5–4 s, one per sentence or half-sentence, cut on the word that names the
  next picture (`shots()` with `at: at(beat, word) - 0.2`).
- **Few hard cuts between worlds; many moves inside one.** The references have 0–9 hard cuts in a
  minute; the rest is camera motion carrying the eye from one thing to the next.
- **Cut-outs give depth.** A person cut out of their photo (`lockstep cutout`) standing in front
  of another picture, both moving at different speeds (`cutout(…, { depth: 2 })`), is the cheapest
  way to make a photograph feel like a shot.
- **Accents on the beat**: a `punch()` zoom or a `shake()` on an impact word, a `flash` on a cut,
  a whoosh under every big move (audio.md).

```js
/* a push-in on the line's subject: the detail ends centred and big */
photo(ctx, lab, tw(t, s0, s1, E.lin), { from: { z: 1.05, x: 0.5, y: 0.5 }, to: { z: 1.8, x: 0.62, y: 0.41 } });
/* a pan across a wide picture, left to right */
photo(ctx, panorama, p, { move: 'right', focus: [0.5, 0.45], amount: 1.5 });
/* a reveal: from a detail out to the whole */
photo(ctx, city, p, { from: { z: 2.2, x: 0.3, y: 0.15 }, to: { z: 1.0 } });
```

## Overlays: few and on the picture

The references put almost nothing over their pictures: the captions, and now and then one big
number, a ring that counts, a name, an arrow or a circle on the thing that matters. Use one at a
time, on its word, pinned to the picture (`pic.at(u, v)`, `view3d(…).project(p)`), and take it
away when the line moves on. Never a panel, a card, a chart frame, a title bar or a progress bar.

## Captions

Big, white, bold, two to four words, low in the frame (centre y ≈ 1265), with a dark outline and
shadow so they read on any picture; the key word in the key colour (yellow by default). They are
the only text on most frames. Nothing else goes in their band.

## Safe areas

The platform's own interface covers the top (y < 270), the bottom (y > 1470) and the right edge
below y ≈ 1000 (likes, comments, share). Pictures fill everything; essential detail — a face, the
object the line names, an overlay's text — stays inside x 70–1010, y 270–1470 and left of x ≈ 950
below y 1000. `lockstep still <slug> --safe 12s` shades the zones.

## The look (`style.json`)

The look is the grade and the type, not a palette of shapes. One grade makes pictures from
different sources one film:

| Material | A grade that unifies it |
|---|---|
| Archive photographs and film | `"grade": { "contrast": 1.12, "saturate": 0.75, "sepia": 0.2 }` |
| Space and night | `{ "contrast": 1.1, "saturate": 0.9, "tint": "#2B4C7E", "tintAmount": 0.06 }` |
| Modern stock | `{ "contrast": 1.06, "saturate": 1.1 }` |
| A cold or clinical story | `{ "saturate": 0.8, "tint": "#3A6F8F", "tintAmount": 0.08 }` |
| Warm, nostalgic | `{ "saturate": 0.95, "sepia": 0.12, "tint": "#C9853B", "tintAmount": 0.06 }` |

```json
{
  "name": "penicillin-archive",
  "about": "1920s–40s photographs and film, warm and grainy; the key word in yellow.",
  "grade": { "contrast": 1.12, "saturate": 0.8, "sepia": 0.18 },
  "captions": { "key": "#FFD23F" },
  "palette": { "accent": "#FFD23F", "alert": "#FF4D4D", "good": "#43E58F", "subject": "#5BC8FF" },
  "fonts": { "display": "Poppins" },
  "post": { "vignette": 0.6, "bloom": 0.25 },
  "transition": { "default": "cut" }
}
```

Every key is optional: `palette` (the overlay colour roles), `fonts` (display, body, mono —
`lockstep fonts`), `captions` (`size`, `y`, `key`, `fill`, `strokeW`, `shadow`, `highlight`:
`color` | `box` | `underline`, `case`), `grade`, `post` (`bloom`, `vignette`, `scrim`, `dither`),
`transition`. Check it on the real media with `lockstep look <slug>`; `lockstep style-check`
validates it.
