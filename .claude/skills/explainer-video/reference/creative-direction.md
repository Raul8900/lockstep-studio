# Creative direction

Every video gets its own story shape, pacing, visual world and look, decided from the topic
before a word of narration is written. The decisions go in `docs/creative_brief.md` and
`style.json`; `lockstep voice` and `lockstep build` refuse to run until `lockstep brief <video>`
passes.

This step deserves real time — as much as writing the script. It is where a video becomes
memorable or interchangeable. The engine will execute any decision faithfully; it cannot make
one. The reference GPU video is the cautionary example: accurate, well timed, and generic,
because it was made before this step existed and every choice was the default.

## Inputs

- `docs/sources.md` — the research, done first.
- **How this topic is usually told.** Search for popular short explainers on the topic and read
  their titles, descriptions and any write-ups (do not download videos). Write down the default
  treatment — the metaphor everyone uses, the look everyone picks — so you can avoid it, or
  subvert it on purpose.
- **What earlier videos in this repo did.** `lockstep list` shows each video's look; read their
  briefs. Do not repeat the previous video's look or format unless the brief argues for a series
  identity.
- **What the user asked for.** Length, audience, tone, a look they named — these override your
  defaults, and the brief records them.

## The process

Write each step into the brief as you go; the brief is a record of thinking, not a form.

### 1. Audience and promise
Who is watching, what they believe now, what they will see differently after. One sentence on why
they would stop scrolling.

### 2. Raw material
From the research, list 10–15 items: facts, numbers, images, mechanisms, human stakes, surprises.
Mark the three most surprising and the three most drawable. The angle and the hook usually come
from items that are both.

### 3. Angle
Write five one-sentence takes. Keep the one that is true, surprising, drawable and matters to the
audience. Say why the others lost.

### 4. Diverge: at least three directions
A direction is a combination of four choices. Make the three differ in at least two of them:

| Axis | Options (examples, not limits) |
|---|---|
| Story shape | any format in story-formats.md, a combination, or your own |
| Visual world | literal mechanism diagram · analogy world · a character's point of view · kinetic typography · lab notebook / hand-drawn · data and maps · museum or archive · toy model / simulation · comic panels · poster |
| Tone | wonder · urgency · deadpan humour · warmth · drama · playful · forensic |
| Look | derived from the topic (art-direction.md); the library in `styles/` is a starting point |

Rules that keep the directions honest:
- At least one direction is **not** diagram-first.
- At least one uses a different story shape from "explain it in order".
- No direction may be a recolour of another.
- Each direction gets a pitch: what the viewer sees and hears in the first ten seconds, how it
  ends, why it suits this topic, and its biggest risk.

### 5. Choose
Judge each direction on:
- **Hook** — would *you* stop scrolling on its first three seconds?
- **Clarity** — does the mechanism become clearer in this treatment, or harder to see?
- **Fit** — does the look and tone belong to this topic and this audience?
- **Freshness** — how far is it from the default treatment you found in step "Inputs"?
- **Feasibility** — can this engine make it well? It draws vector shapes, type, line icons, hand-drawn
  lines, 2.5D slabs and particles; it has no photographs, footage, 3D models or lip-synced
  characters. A direction that needs those will be made badly.

Pick one, or combine — and say exactly what came from where.

### 6. Hook
Write three openings. Each is a picture and a line, both landing inside three seconds. Pick one.
Name the open loop it creates and where the video closes it.

### 7. Story shape
The beat map: every beat with its job, its length in seconds, and the turn into the next. Mark
the structural surprises (one every 15–25 s) and the payoff. Say how the end connects to the start.
These beats become the beats in `script.py` and the chapters in `video.json`.

### 8. Pacing
A preset from story-formats.md (calm, brisk, rapid) or your own numbers: target length, voice
speed, pause lengths, where it speeds up and where it breathes, what needs time to be read.

### 9. Visual world
Where the video takes place and why: the central metaphor, the recurring hero object or character,
what is drawn as diagram vs. object vs. type, how scale and time are shown, the camera's personality
(steady, floating, punchy), the motion personality (springy, smooth or snappy — see scene-api.md),
and what is deliberately left out.

### 10. Style
Design `style.json` from the visual world (art-direction.md). Make **two candidate styles** that
fit the chosen direction differently, preview them side by side, and choose with your eyes:

```bash
bin/lockstep tile <video> candidates/a.json candidates/b.json     # -> out/style_tiles.jpg — open it
bin/lockstep style-check --style candidates/a.json
```

Copy the winner to `style.json`. In the brief, explain each choice (palette roles, fonts, backdrop,
captions, transitions, shapes) and name the rejected candidate and why it lost.

### 11. Sound
Music settings in `video.json` (`music`: bpm, transpose, kit; `chapters[].mood`) and the arc they
make; the voice and its speed (`lockstep voice <video> list`); the character of the sound effects.
See audio.md.

### 12. What would make this fail
The three likeliest ways the video ends up boring, confusing, wrong or embarrassing, and what in
the plan prevents each.

Then:

```bash
bin/lockstep brief <video>        # must pass before voice and build
```

## Anti-patterns

- **The default look.** Choosing `neon-blueprint` — or whatever the last video used — because it
  exists. Every look must be argued from the topic.
- **Three directions, one idea.** The same treatment in three palettes is one direction.
- **Literal clichés.** Brain → pink brain with lightning; money → green dollar signs; space → stars
  on black. Start from them only to find the twist.
- **Tone mismatch.** Candy colours on a grave topic; doom-dark on a playful one.
- **Briefs the engine cannot make.** Photoreal footage, characters that talk, complex 3D.
- **Choosing a format and writing the old arc anyway.** Check the script's beats against the
  beat map before recording.
- **A brief written after the fact.** It exists to decide; filling it in to pass the gate wastes
  the step. (The GPU video's brief is retroactive and says so.)

## Example

`templates/video/docs/creative_brief.md` (the starter video) is a complete brief for a short
video, with three real directions, three hooks, and a light style chosen against the reference
video's dark one.

## After delivery: let the system learn

When the video is delivered, append a `## Retrospective` section to its brief: what worked, what
did not, what you would change. If the look worked and could serve other topics, add it to the
library — `bin/lockstep save-style <video> <name>` — with an `about` line saying what it suits.
Future videos read these briefs and the library before deciding their own direction, so the
range of looks and formats grows with every video instead of collapsing to one.
