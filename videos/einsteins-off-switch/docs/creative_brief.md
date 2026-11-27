# Creative brief — “Einstein's Off Switch”

## Audience and promise

Anyone with a phone in their hand, which is everyone scrolling: they use GPS daily and file
relativity under "weird stuff about black holes that doesn't touch my life". In about 80 seconds they
learn that relativity is running in their pocket right now: GPS satellites' clocks are deliberately
mistuned before launch, by an amount Einstein predicted, and in 1977 engineers were sceptical enough
to fly the correction switched off until a satellite proved him right. They leave able to say the
number (38 microseconds a day, 11 km of error) and the story (the off switch).

## Angle

Candidates:
1. **The off switch**: in 1977 some engineers doubted relativity mattered, so the Navy's NTS-2 flew
   the fix switched off and only turned it on after the clock proved Einstein right. A story with
   sceptics, a test and a verdict.
2. **Set wrong on purpose**: every GPS clock is tuned to 10.22999999543 MHz instead of 10.23 MHz.
   An object that sounds like a mistake.
3. **"You" as the blue dot**: without relativity your location drifts 11 km a day.
4. **Two effects fighting**: gravity speeds the clock up, speed slows it down; gravity wins.
5. **Relativity tested billions of times a day** by every phone.

Kept: 2 as the hook (the mystery a viewer cannot resist: why would anyone set a clock wrong?), 3 and 4
as the mechanism (the stakes in the viewer's own blue dot), and 1 as the twist (the strongest story:
real doubters, a real switch, a real verdict). 5 becomes the last line. Each alone is a fact; together
they are a case with a payoff that answers the first line.

Topic chosen over three runners-up: **Apollo 12's self-made lightning** (the rocket triggered the
strikes; strong, but the payoff depends on NASA launch film this session cannot download, see Shot
plan), **the Hafele–Keating clocks flown round the world on airliners in 1971** (charming, but the
GPS story contains the same physics and touches the viewer's own phone), and **Boston's 1919 molasses
flood** (vivid, but a fluid wave is hard to make convincing in code and the tone is grim). The GPS
story wins on all three tests: a counter-intuitive first line, a world that is natural to build in 3D
(Earth, orbits, clocks, light), and primary sources from the physicist who did the work (Ashby).

## Story

The hero is one GPS satellite and the atomic clock inside it, built in code; the viewer is the blue
dot on the Earth. Line one: every satellite is launched with its clock set wrong, on purpose (the
mystery). Setup, brisk: your phone finds you by timing signals; light covers 30 cm in a nanosecond,
so a nanosecond of clock error is 30 cm of you in the wrong place. Escalation ("But Einstein…"): up
there time itself runs at another rate. The mechanism, slow and held: weaker gravity makes the clock
run fast (+45 µs a day), the speed makes it run slow (−7), net +38 µs every day. Stakes: in light,
38 µs is over 11 km, and your dot would drift that far in a day. Twist: in 1977 not everyone believed
it, so NTS-2 flew the fix switched off. Proof: about twenty days uncorrected, Einstein's prediction on
screen against the measurement, within one percent; they flip the switch (held). Payoff: every GPS
clock since is tuned a hair slow on the ground so it is right in the sky, which answers "set wrong on
purpose", and every time the blue dot finds you, Einstein passes the test again.

Beats: hook (the wrong clock), phone (timing is position), einstein (the mechanism), stakes (11 km),
doubt (the off switch), proof (the verdict), payoff (wrong on the ground, right in the sky).

## Hook

1. A gold satellite turning against the Earth, its clock readout spinning past 10.23 to 10.229999…:
   "Every GPS satellite is launched with its clock set wrong. On purpose."
2. A blue location dot sliding off across the Earth: "Without Einstein, your phone would lose you by
   eleven kilometres a day."
3. A big switch marked OFF in orbit: "In 1977, the Navy didn't trust Einstein. So they built an off switch."

Kept: 1. It is an object on screen from frame one and a claim that sounds like an error, and it opens
the question the whole video answers ("why set it wrong?"), answered by the payoff. 2 gives away the
stakes too early; 3 needs context the viewer doesn't have in two seconds and is kept for the twist.

## World and hero

One world: near-Earth space built in code with three.js. The Earth is a sphere wrapped in the NASA
Blue Marble map (public domain, the one picture in the video, used as a texture), lit by a hard sun,
with a thin atmosphere glow, stars as seeded points. The hero is a GPS satellite built from shapes:
a gold-foil body, two blue solar wings made of cell grids, an antenna array facing Earth, and its
clock shown as a glowing ring of 60 ticks on the body that beat visibly faster or slower than a twin
clock ring on the ground. The viewer is a blue location dot with a pulsing halo on the Earth's surface.
Abstract things made physical: a radio signal is an expanding shell of light from each satellite;
position by timing is four shells meeting on the dot; gravity is a warped grid (a spacetime sheet)
with the Earth sitting in its well and the satellite riding high on the shallow rim; speed is motion
streaks; the day's error is a stack of glowing time blocks (+45 up, −7 down); 11 km is the dot sliding
along a glowing track across the map; the doubt is a heavy toggle switch in orbit beside a second,
squatter test satellite labelled NTS-2 (generic, not a replica); the payoff is the whole
constellation, 24 satellites in six planes at 55°, all their shells converging on the dot.
Deliberately left out: people (no figures made of shapes; no photograph of the NRL team was reachable),
real photographs of NTS-2 (none reachable from this session, see Shot plan), equations.

## Shot plan

- hook: wide on the Earth's limb, the satellite sweeps into frame, camera pushes to its glowing clock
  ring; a giant in-world readout ticks 10.23000000000 → 10.22999999543 MHz on "wrong"; stamp ON
  PURPOSE. (code, earth-map texture)
- phone: pull back from the satellite down to the Earth: the blue dot on a city at night; four
  satellites send light shells that meet on the dot; label 20,000 km up the line to a satellite; then
  a fast push to the dot as a shell crawls 30 cm per nanosecond: a ruler marked 1 ns = 30 cm.
  bigNumber 30 cm. (code)
- einstein: the spacetime sheet: grid warped under the Earth, satellite on the rim; two clock rings,
  ground and orbit, side by side; on "gravity" the orbit ring speeds up (green +45 µs block rises); on
  "moving" streaks appear and a red −7 block cuts it; "net result" the blocks merge into +38 µs, a
  bigNumber that lands with an impact; held 1.4 s while the two clock rings visibly drift apart.
  (code)
- stakes: from the clock out to the Earth: the blue dot slides along a glowing track; bigNumber
  11 km counts up; a ring gauge of 24 hours fills as it drifts. (code)
- doubt: a second, squatter test satellite in a dawn orbit: name tag NTS-2 · 1977; a heavy toggle
  switch in the world labelled RELATIVITY FIX, set OFF (stamp OFF); held on "right" while the switch
  waits. (code)
- proof: a 20-day counter (ring of days) as the clock runs; two numbers stand in the world:
  PREDICTED +446.5 and MEASURED +442.5 (parts in a trillion); a ring fills to 99%; on "flipped" the
  switch slams to ON with a lock sound and the clock ring turns gold; held 1.3 s. (code)
- payoff: pull back to the full constellation, 24 satellites in six tilted planes, shells converging
  on the blue dot; the readout 10.22999999543 MHz floats beside the hero; final pull-out holds on the
  Earth with the dot pulsing. (code)

Media: one picture, the Blue Marble Earth map (`earth-map`, NASA Earth Observatory via Wikimedia
Commons, public domain), already in the repository's template. Gap: the session's network policy
blocks Wikimedia Commons, NASA, the Internet Archive and Incompetech, so `lockstep find` could not run.
The ideal evidence shot, the real NTS-2 satellite (NRL photographs, U.S. Government work), is missing;
the video is therefore fully animated and the NTS-2 in it is a generic satellite labelled by name.
It can be added later with `lockstep find einsteins-off-switch photo "NTS-2 satellite"` on a machine
that can reach Commons, as a board in the doubt beat (`w.picture`).

## Pacing

About 82 s. hook 5 s brisk; phone 12 s brisk (three short setup lines, no held moment); einstein
17 s slow (`speed` 1.05, one effect per sentence, each seen before the next is said, held 1.4 s at
+38 µs); stakes 8 s steady (0.6 s after "single day" as the dot drifts); doubt 11 s steady, held 1 s
on the waiting switch; proof 11 s (held 1.1 s on the two numbers and 1.3 s on the switch flipping);
payoff 12 s, the last picture moving 2.2 s after the last word. Held moments: +38 µs, the switch
waiting, the numbers, the flip: four, about 5 s in total, paid for by keeping phone to three plain
lines with no pauses over 0.35 s and the hook to one sentence. No real footage, so the lint's footage
rules do not apply; the mechanism gets its 15+ s.

## Look

`orbit-gold`: space at night, black with a faint blue tint, the Earth bright and saturated, the hero
in warm gold foil so it is the warmest thing in every frame. Grade { contrast 1.1, saturate 0.95,
tint #2B4C7E 0.05 }. Palette: accent gold #FFC94A (the hero, the key numbers), subject sky blue
#5BC8FF (the blue dot, signals), alert #FF5A4F (the −7, OFF), good #43E58F (+45, ON), data #C9B8FF
(the spacetime grid). Fonts: Space Grotesk for numbers and names (engineering, slightly retro-space).
Captions white, key word gold, size 72. Post: bloom 0.35 (glowing clocks and signals), vignette 0.55.
Cuts inside beats are camera moves; between beats a cut or a quick flash.

## Sound and voice

af_heart at 1.15, the explanation at 1.05 and the proof at 1.08 so the numbers land. No licensed track
(Incompetech unreachable here): the engine's own score, kit `deep` (space, scale), bpm 96, moods:
hook drone, phone light, einstein mechanical, stakes dark, doubt tense, proof build, payoff finale.
Effects: a tick on every clock beat (the clock is the hero's heartbeat), whooshes on camera moves,
blips on labels, a riser into "net result" and an impact on +38, a count under 11 km, a deny on OFF,
a riser into the verdict, a lock and chime on the flip, a swell on the final pull-back.

## What would make this fail

1. A lecture: three microsecond numbers in a row lose people. Prevented by one effect per sentence,
   each a physical event (a block rising, a block cut away) and by turning the total into the viewer's
   own dot drifting 11 km.
2. Toy-like space: a plastic satellite on flat black. Prevented by real lighting (hard sun, rim light
   on gold foil, bloom), the real Earth texture, slow camera moves and star parallax.
3. Getting the physics wrong or overclaiming: the 11 km figure is attributed to Ashby's statement,
   "Einstein showed" covers both effects, NTS-2 is not shown as a real photo, every number traces to
   docs/sources.md, and "about" is spoken where the source rounds.

## Status (27 Nov 2026)

Written and checked: topic, sources, script, narration (recorded, 85.9 s, pacing checked), caption
phrases, style, and all seven scenes with their four code-built worlds (components.js). Every
narration cue the scenes use exists in data/words.json and every file passes `node --check`.

Not yet rendered: the machine that wrote the scenes had no headless Chromium, which the renderer
needs, and could not download one. On a machine with Playwright's Chromium:

    bin/lockstep voice einsteins-off-switch      # the narration is not committed; this rebuilds it
    bin/lockstep lint einsteins-off-switch
    bin/lockstep sheet einsteins-off-switch 2s 8s 14s 25s 34s 45s 53s 67s 71s 80s
    bin/lockstep build einsteins-off-switch

Expect camera framings to need a pass after the first contact sheet: they were set from the
geometry, not from looking at frames.
