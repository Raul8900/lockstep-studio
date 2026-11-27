<!-- Authored per video. `lockstep report` inserts this file into docs/production_report.md
     after the measured sections. Keep the four headings; write what is true for this video. -->

## Technical accuracy review

| On screen / spoken | Status |
|---|---|
| Clocks set to 10.22999999543 MHz on the ground, before launch | Ashby 2003 §5 eq. 36; Penn State GEOG 862 (docs/sources.md) |
| +45 µs a day from gravity, −7 µs from speed, net +38 µs | Penn State's rounded figures; Ashby gives 38.6 µs a day. The video says “about” |
| More than 11 km of error in a day | Ashby 2002 (Physics Today), word for word |
| NTS-2, 1977, fix built in but switched off; about 20 days uncorrected | Ashby 2003 §5; NRL; Smithsonian |
| Predicted +446.5, measured +442.5 parts in 10¹², within 1% | Ashby 2003 and 2002 |
| 30 cm ghost beside the dot, dial rates, plate stack | Diagrams, marked “not to scale” and “rates exaggerated” on screen |
| NTS-2 and the GPS satellites | Generic satellites built in code, named only; no picture is passed off as them |

## Defects found during QA and fixed

| Found | Cause | Fix |
|---|---|---|
| Lint: one colour typed as a value in the ruler panel | rgb() in s02_phone.js | Uses a neutral dark panel |

## Creative self-assessment

The strongest moment on paper is the switch: a doubt stated in 1977, a satellite flown with the
fix switched off, and the verdict held on screen before the lever slams to ON. The weakest is the
lack of any real archive picture of NTS-2: the media hosts were out of reach, so the satellite is a
named, generic model. A second pass should add a public-domain NRL or NASA photo of NTS-2 in the
doubt beat, credited in media/credits.json.

## What was not verified

Frames, motion and the mix: the render could not run in the session that wrote the scenes (no
headless Chromium in that machine), so every check that needs pixels is still to do.
Playback inside the platform apps; loudness on real devices.
