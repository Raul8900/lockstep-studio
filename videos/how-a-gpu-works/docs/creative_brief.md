# Creative brief — “How Does a Modern GPU Actually Work Internally?”

**Written retroactively.** This video was made before the creative-direction step existed in the
pipeline. The brief records the decisions as they were actually made. The three directions under
"Directions considered" were identified afterwards, in hindsight; only the first was considered at
the time. Read it as a record of this video and a baseline to improve on, not as a model of the
process.

## Audience and promise

Curious viewers who have heard that a GPU has "thousands of cores" and picture thousands of small
CPUs. Many are gamers or are following AI news; few have programmed a GPU. After two and a half
minutes they should be able to explain why a GPU is fast — one instruction drives many lanes in
lockstep, and stalls are hidden by switching between groups — and why that same design makes
branching code and memory traffic expensive. The promise that stops the scroll: a famous number
that turns out to mean something different from what everyone assumes.

## Angle

Candidates at the time: (1) "a GPU is a thousand weak CPUs" (the common framing, and wrong); (2) "a
GPU is a factory, a CPU is a craftsman" (accurate but familiar); (3) "the cores can't think for
themselves, and that is the trick" (lockstep execution as the hero). Chosen: (3). It contradicts the
headline number in the first two sentences, it is accurate (SIMT: fetch and scheduling happen per
warp, not per lane), and it can be drawn — identical pulses moving in step down 32 lanes.

## Directions considered

### A — Inside the machine, technical neon (chosen at the time)

A glowing 2.5D die opens the video; every chapter dives one level deeper into the hardware: the
chip, one compute unit, one warp, the lanes, the memory hierarchy. Dark charcoal and neon line art,
a chapter progress bar, a rowing-crew analogy for the core idea. Suits a hardware topic and an
audience that likes the look of technical diagrams. Risk: it reads as a beautiful lecture — even
pacing, one camera grammar, diagram after diagram — which is what ended up happening.

### B — The kitchen (identified in hindsight)

The whole video takes place in a restaurant kitchen: the CPU is a head chef making one complex dish
at a time; the GPU is a brigade of line cooks who all do the same step on command. Warps become
stations, divergence becomes half the line waiting while the other half plates. Flat illustrated
look, warm palette, faster cuts, humour. Risk: the metaphor strains at memory bandwidth and must be
dropped for the last third, and food imagery competes with the hardware for attention.

### C — The myth-buster (identified in hindsight)

Three claims about GPUs flashed as headlines — "thousands of cores", "better at everything",
"graphics only" — each stamped FALSE, then rebuilt from the true mechanism. Loud poster look,
condensed type, hard cuts, 60–75 seconds. Risk: debunking formats can feel smug, and three myths
in 75 seconds leaves little time to show the mechanism properly.

## Chosen direction

A, as made. With the direction step in place, the stronger choice would probably have been A's
content with C's structure and pace: open on the myth, keep the hardware dive and the rowing analogy
for the mechanism, cut to around 90 seconds, and break the single camera grammar every 15–20
seconds. The video as delivered is A unchanged; this brief does not pretend otherwise.

## Hook

As made: the lit, rotating die with a counter racing to 21,760 — "This chip has over twenty thousand
cores." — then quotation marks snap around CORES on "And not one of them can think for itself", and
the lights fall into lockstep on "That's exactly why it's so fast." The open loop (how can mindless
cores be fast?) is closed in chapter 6 ("They aren't tiny CPUs…"). Not considered at the time: a
cold open on the rowing crew, or the FALSE stamp on "thousands of cores".

## Story shape

Ten chapters in a fixed explanatory arc: hook (8 s) → CPU vs GPU contrast (21 s) → the CPU hands off
work (13 s) → zoom into the chip, the repeated unit (12 s) → threads, blocks and warps with the
rowing analogy (25 s, the core) → inside one unit, latency hiding (17 s) → memory hierarchy (17 s)
→ two applications, pixels and AI (19 s) → limits, divergence and stalls (16 s) → takeaway (11 s).
The end card restates the hook's picture. The payoff works; the middle is too even.

## Pacing

162 seconds, 390 words, af_heart at speed 1.0, about 170 wpm while speaking and 147 wpm overall
with pauses of 0.28–0.80 s. A new visual event roughly every 1–3 seconds. Viewer feedback after
delivery: too long and could be faster. A re-cut would aim for 90–110 seconds with shorter pauses
inside beats and at least two deliberate speed changes.

## Visual world

Inside the machine. The hero object is the die in 2.5D, which returns on the end card; every scene
change is a camera move between scales (dive into the die, into one unit, out to the whole). The
mechanism is drawn literally — lanes, instructions, warp cards, memory tiers — with one analogy (a
rowing crew: one call, thirty-two oars). Numbers carry the product name. No people, no logos, no
photographs of real chips.

## Style

neon-blueprint, the engine's original built-in look: charcoal gradient with slow fog, drifting dot
lattice and perspective floor; cyan for the GPU and computation, amber for the CPU, control and
numbers, violet for memory and data, coral for limits, mint for success; Inter Display, Inter and
JetBrains Mono; two-stage bloom; segmented chapter bar with chapter names; colour-highlighted
captions with an outline. It suits the topic, but it was the only look the engine had, so it was
not chosen against anything — and it is the main reason the video felt generic.

## Sound

100 BPM synthesised score in the D-minor family, one mood per chapter (drone, light, groove, build,
mechanical, drive, dark, bright, tense, finale) ending on a held D major chord. 235 synthesised sound
cues placed on the same word timings as the picture. Voice 16 dB above music and effects, mastered to
−14 LUFS. Clean and well balanced; like the look, it is the engine's single default sound.

## What would make this fail

What did go wrong: one look, one pace and one camera grammar for 162 seconds made a correct video
feel like a lecture. What went right and should be kept: the hook number undercut in the second
line, the mechanism drawn literally, every picture landing on its word, every number sourced. For
any remake: shorter, a structural surprise every 15–20 seconds, and a look chosen against
alternatives.
