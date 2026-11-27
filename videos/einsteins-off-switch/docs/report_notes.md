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
| Lint: overlays and pins sitting in the caption band (y 1225–1300) and under the like/share column | Positions set from geometry, before any frame was seen | Stamps, gauges and pins moved above the band; `pin()` now clamps labels to y 320–1170 and inside the side margins |
| Lint: low-contrast dial labels (ORBIT) and small text | Thin text on a busy Earth | Labels stroked, sizes raised |
| Contact sheet: phone close-up of the blue dot looked pixelated | Camera too close to the Earth texture | Close-up pulled back (distance 1.0 → 0.85 framing, wider FOV) |
| Contact sheet: hook and payoff framed too tight on the satellite | heroCam distance | Camera now eases out (0.5 → 1.3 and 0.8 → 1.3) |
| Contact sheet: Einstein name tag lingered over the +45/−7 split | No fade-out | Tag fades out before the numbers land |
| Build scan: dark frames at 59.6–60.2 s | Proof shot opened looking into the unlit back of the NTS-2 drum | Camera reframed to the lit face; clock face lowered and moved clear of the drum |
| Verdict numbers read 447 and 443 | `bigNumber` rounds values of 100 or more while counting | Shown exact (`count: false`): +446.5 and +442.5 |
| Switch shot cropped the lever at ON | Camera too close | Camera eases back from [1.6, 0.3, 2.8] to [1.4, 0.6, 3.8] |

## Creative self-assessment

The strongest moment on paper is the switch: a doubt stated in 1977, a satellite flown with the
fix switched off, and the verdict held on screen before the lever slams to ON. The weakest is the
lack of any real archive picture of NTS-2: the media hosts were out of reach, so the satellite is a
named, generic model. A second pass should add a public-domain NRL or NASA photo of NTS-2 in the
doubt beat, credited in media/credits.json.

## What was not verified

Playback inside the YouTube and Instagram apps, and loudness on real phones. Frames were checked
on contact sheets and by the build's scan, not watched end to end at full speed by a person.
There is still no real archive photo of NTS-2 (see above).
