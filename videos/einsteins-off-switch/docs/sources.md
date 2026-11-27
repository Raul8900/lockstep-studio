# Sources — “Einstein's Off Switch”

Primary source: Neil Ashby, the physicist who worked out GPS's relativity corrections, in two
reviews. Read on 27 Nov 2026.

- **[A1]** N. Ashby, “Relativity in the Global Positioning System”, *Living Reviews in Relativity* 6 (2003), 1, §5 “Relativistic Effects on Satellite Clocks” — https://emis.dsd.sztaki.hu/journals/LRG/Articles/lrr-2003-1/articlese5.html
- **[A2]** N. Ashby, “Relativity and the Global Positioning System”, *Physics Today* 55(5), 41 (2002) — https://physicstoday.aip.org/features/relativity-and-the-global-positioning-system
- **[P]** Penn State, GEOG 862 “GPS and GNSS for Geospatial Professionals”, “The Satellite Clock” — https://courses.ems.psu.edu/geog862/node/1714
- **[N]** U.S. Naval Research Laboratory, “First GPS NAVSTAR satellite goes on display” (12 Apr 2013) — https://www.nrl.navy.mil/Media/News/Article/2563219/first-gps-navstar-satellite-goes-on-display/
- **[G]** GPS.gov, “Space Segment” — https://www.gps.gov/systems/gps/space
- **[S]** Smithsonian, Time and Navigation, “NTS-2 Satellite” — https://timeandnavigation.si.edu/node/667

| Claim (spoken or on screen) | Source | Exact wording in the source |
|---|---|---|
| Every GPS satellite clock is set off-frequency on the ground, before launch | A1, P | A1: “This adjustment is accomplished on the ground before the clock is placed in orbit.” P: “their frequencies are set to 10.22999999543 MHz before they are launched into space” |
| On screen: 10.22999999543 MHz instead of 10.23 MHz | A1 eq. (36), P | A1: “[1 − 4.4647 × 10⁻¹⁰] × 10.23 MHz” = 10.229 999 995 43 MHz |
| Satellites about twenty thousand kilometres up, twice round the Earth a day | A2, G | A2: “Orbiting about 20 000 km above Earth's surface … periods of 11 hours and 58 minutes.” G: “approximately 20,200 km”, “circles the Earth twice a day” |
| Light covers about thirty centimetres in a billionth of a second; a clock a billionth off puts you about 30 cm off | A2 (arithmetic) | A2: “A radio wave travels 1 cm in 0.03 ns” (so 30 cm in 1 ns); “If navigation errors of more than a meter are to be avoided, an atomic clock must deviate by less than about 4 nanoseconds” |
| Weaker gravity up there: the clock runs fast by about 45 microseconds a day | P (A1 for the physics) | P: “appear to run faster than the clocks on earth by about 45 microseconds a day”; A1: net offset “primarily because its frequency is gravitationally blueshifted” |
| Moving at almost four kilometres a second; that slows it by about 7 microseconds a day | P, A2 | P: “At 3.874 kilometers per second”, “run slower than the clocks on earth by about 7 microseconds a day”; A2: “about 4 km/s” |
| Net: about 38 microseconds fast every day | P, A1 | P: “run faster by about 38 microseconds a day”; A1: fractional offset 4.4647 × 10⁻¹⁰ × 86 400 s = 38.6 µs/day |
| Uncorrected, the errors pile up to more than 11 km in a single day | A2 | “satellite clock errors building up in just one day would cause navigational errors of more than 11 km” (also: 38.6 µs × c = 11.6 km) |
| In 1977 some doubted the relativistic correction was needed | A1 | “there were some who doubted that relativistic effects were truths that would need to be incorporated” |
| The Navy's test satellite NTS-2, launched 1977, with cesium atomic clocks | N, S, A1 | N: “NTS-2 is the first satellite completely designed and built by the U.S. Naval Research Laboratory”, “launched June 23, 1977”; S: “The two cesium atomic clocks on board”; A1: “the first Cesium atomic clock to be placed in orbit” |
| The fix was built in but switched off; it would be turned on only if the clock ran at the rate relativity predicted | A1 | “A frequency synthesizer was built into the satellite clock system so that after launch, if in fact the rate of the clock in its final orbit was that predicted by general relativity, then the synthesizer could be turned on” |
| About twenty days uncorrected | A1 (A2: “three weeks”) | A1: “operated for about 20 days to measure its clock rate before turning on the synthesizer” |
| On screen: predicted +446.5, measured +442.5 parts in a trillion (10¹²); within one percent | A1, A2 | A1: “+442.5 parts in 10¹² … general relativity predicted +446.5 parts in 10¹²”; A2: “agreeing with the relativistic calculation to better than 1%” |
| The relativistic offset is still used in every GPS satellite | N, A1 | N: “resulting in the need for a relativistic offset correction that remains in use by every satellite in the GPS constellation” |
| Constellation drawn as 24 satellites in six planes inclined 55° | A2 | “24 satellites (plus spares) … four satellites in each of six different planes inclined 55°” (GPS.gov counted 31 operational in 2017) |

## Simplifications, said plainly

- “Einstein said time doesn't tick the same everywhere” covers both effects: the speed effect is
  special relativity (1905), the gravity effect general relativity (1915). Both are Einstein's.
- 45 − 7 = 38 uses Penn State's rounded figures; the precise values (about 45.7, 7.1 and 38.6 µs a
  day) tell the same story. The video says “about”.
- “Your blue dot would wander off” stands for Ashby's “navigational errors of more than 11 km”
  building up in a day. Modern receivers also solve for their own clock error, but the satellites'
  clocks would drift away from GPS time; Ashby's figure is what that drift amounts to.
- NTS-2 and the GPS satellites are built in code as generic satellites, not accurate models, and are
  labelled by name only; no picture is shown as if it were them.

Media and their licences: media/credits.json, and docs/credits.md (`lockstep media <video> credits`).
