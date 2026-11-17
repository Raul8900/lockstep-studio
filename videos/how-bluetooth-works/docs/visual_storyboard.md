# Visual Storyboard — “How Bluetooth Works”

23 sequences · 112.35 s · 1080 × 1920 · 30 fps. The look, story shape and pacing were decided in docs/creative_brief.md. Timestamps are taken from the recorded narration; the animation code reads the same word timings, so picture and voice cannot drift apart.

## Conventions that apply to every sequence

**Canvas and safe areas.** Designed natively for 9:16; nothing is cropped from a wider layout.

| Zone | y range | Use |
|---|---|---|
| Top UI band | 0–270 | Backdrop only |
| Chapter bar | 286–340 | 8-segment progress bar (y 292) and chapter label (y 334) |
| Diagram zone | 372–1210 | All essential graphics, x 70–1010 |
| Caption band | 1250–1450 | Burned-in captions, centred on x 540, y 1350, max width 800 px |
| Bottom UI band | 1470–1920 | Backdrop and non-essential spill only |

Below y 900, numbers and names stay left of x ≈ 910, where both platforms stack their action buttons; only repeated or decorative elements extend further right.

**Look.** `transit-map` (light theme) — Station signage in daylight: off-white enamel and faint wall tiles, line colours (blue, orange, violet, red, green), a neutral grotesque, flat signs without shadows, plan views, line maps and a split-flap board. Networks, routes, schedules, sharing — many things moving through one system without colliding.

**Backdrop.** drawn by this video's own components.js; background gradient #F4F4F0 → #EFEFEA → #E7E8E2.

**Colour language.** Line blue (subject) = your link — phone ↔ earbuds, its hops, its code — and Bluetooth's mechanism · Signal orange (accent) = numbers and your neighbour's link · Violet (data) = time: the clock, slots, the timetable, the buffer · Red (alert) = collisions, Wi-Fi interference, bad channels, the private-wire myth · Green (good) = delivered, acknowledged, accepted · Ink = what is being talked about now; greys = everyone else's links, the way a route map greys out the lines you are not taking.

**Type.** Work Sans for headlines, Work Sans for glosses and body, IBM Plex Mono for labels and counters. Smallest label 19–22 px; primary labels ≥ 24 px.

**Captions.** Work Sans 800, 76 px, centred on y 1350, 1–5 words per phrase (98 phrases, 31 of them two-line); the spoken word takes its role colour and an underline draws in beneath it. Words not yet spoken are dimmed. Position never changes.

**Scene changes.** 0.6 s, default `slideLeft`; each scene can choose its own arrival (zoom into a point, pull back, pan, slide, cut, flash). The incoming scene is already drawn and moving before the outgoing one has gone.

---

## 01 · Rush hour

**Time:** 0:00.00 → 0:05.37  (5.37 s)  
**Narration:** “Rush hour: forty people in this carriage are streaming music over the same slice of radio.”  
**Caption phrases:** Rush hour: | forty people | in this carriage | are streaming music | over the same | slice of radio.

| | |
|---|---|
| **Objects on screen** | A metro carriage in plan view (walls, two door bays, longitudinal benches, poles) with forty passengers seen from above; every passenger's phone is joined to their earbuds by a thin link with packets flowing along it. |
| **Position and size (1080 × 1920)** | Carriage 700 × 840 px centred on (540, 790); you and your neighbour sit on the left bench at y ≈ 860. |
| **Background** | Station wall: off-white enamel tiles (150 × 75 px, running bond), a blue frieze low on the wall, a soft light sweeping past every ~14 s (components.js). Strip-map HUD at y 302: the eight chapters as stations on a blue line; NOW / NEXT station names. |
| **Movement** | Frame 0: the doors are sliding shut, links already pulsing. On “forty people” a tag counts 40; on “same slice of radio” every link flashes the same colour at once. |
| **Timing and easing** | Doors E.io3 0.6 s; link flashes stagger 15 ms per passenger; packets travel at a steady speed. |
| **Camera** | Slow push-in 1.00 → 1.05 about the carriage centre; the carriage sways ±2 px. |
| **Colour and emphasis** | Everyone grey; your link blue, your neighbour's orange. |
| **Text overlays** | “40 PEOPLE · 40 LINKS” · “ONE BAND”. |
| **Transition out** | Continues. |
| **Sound** | chime + slide for the doors at 0 s; a soft tick wave as the links light; swell on “radio”. |
| **Purpose** | Frame one is the viewer's own situation, already full of invisible traffic. |

## 02 · The stray packet

**Time:** 0:05.37 → 0:08.28  (2.91 s)  
**Narration:** “So why don't you ever hear your neighbour's?”  
**Caption phrases:** So why don't you ever | hear your neighbour's?

| | |
|---|---|
| **Objects on screen** | You and your neighbour, close up; an orange packet leaves the neighbour's phone, arcs toward your ear and bounces off; a question badge. |
| **Position and size (1080 × 1920)** | Camera centred on the pair at (300, 860), zoom 1.9. |
| **Background** | Station wall: off-white enamel tiles (150 × 75 px, running bond), a blue frieze low on the wall, a soft light sweeping past every ~14 s (components.js). |
| **Movement** | The packet launches on “hear”, glances off your earbud on “neighbour's” and falls away; a round sign with “?” pops beside your head. |
| **Timing and easing** | Arc 0.7 s E.io3; bounce E.out3 0.4 s; badge E.out3. |
| **Camera** | Push in to the pair over 1 s (E.io3). |
| **Colour and emphasis** | The packet orange; your earbuds blue; the bounce mark red. |
| **Text overlays** | “?” |
| **Transition out** | Zoom into your seat (the next scene grows out of it). |
| **Sound** | zip on launch, deny on the bounce (60 ms early, gain 0.55), pop for the badge. |
| **Purpose** | Open the loop: why don't you hear it? |

## 03 · The invisible wire

**Time:** 0:08.28 → 0:13.46  (5.18 s)  
**Narration:** “You might think pairing gives your earbuds a private channel, like an invisible wire.”  
**Caption phrases:** You might think | pairing gives | your earbuds | a private channel, | like an invisible wire.

| | |
|---|---|
| **Objects on screen** | Your phone and your earbuds as large pictograms; a blue cable drawing itself between them; a sign plate. |
| **Position and size (1080 × 1920)** | Phone at (300, 1000), earbuds at (720, 640); sign at (540, 470). |
| **Background** | Station wall: off-white enamel tiles (150 × 75 px, running bond), a blue frieze low on the wall, a soft light sweeping past every ~14 s (components.js). |
| **Movement** | On “private channel” a dashed route draws; on “invisible wire” it thickens into a cable with plugs. |
| **Timing and easing** | Draw-on 0.7 s E.io3. |
| **Camera** | Slow push-in 1.0 → 1.04. |
| **Colour and emphasis** | Blue cable, ink pictograms. |
| **Text overlays** | Sign “PRIVATE LINE?”. |
| **Transition out** | Continues. |
| **Sound** | slide as the route draws, a soft thump as the plugs seat. |
| **Purpose** | Draw the model the viewer carries in their head. |

## 04 · No such thing

**Time:** 0:13.46 → 0:18.01  (4.55 s)  
**Narration:** “There's no such thing. Yours share every channel with everyone in here.”  
**Caption phrases:** There's no such thing. | Yours share | every channel | with everyone in here.

| | |
|---|---|
| **Objects on screen** | The cable snaps; a red cross; then the carriage again with all forty links rising into one shared horizontal band at the top. |
| **Position and size (1080 × 1920)** | Band bar 860 × 46 px at y 470 with 79 ticks; carriage below it, smaller (scale 0.62). |
| **Background** | Station wall: off-white enamel tiles (150 × 75 px, running bond), a blue frieze low on the wall, a soft light sweeping past every ~14 s (components.js). |
| **Movement** | Snap on “thing”; on “share every channel” the links of all forty passengers rise and plug into the same band, staggered. |
| **Timing and easing** | Snap: hard, 0.15 s; links E.out3 0.5 s, staggered 12 ms. |
| **Camera** | A camera punch on the snap; then a pull-back. |
| **Colour and emphasis** | The snapped cable in red; all links grey with yours blue. |
| **Text overlays** | “NO PRIVATE LINE” → “79 CHANNELS · SHARED BY EVERYONE”; every link's end hops along the band (real hop sequences of the crowd's example phones). |
| **Transition out** | Zoom into the band. |
| **Sound** | rip + impact on “thing”; a rising tick run as the links plug in. |
| **Purpose** | Replace the myth with the truth in one picture. |

## 05 · One band

**Time:** 0:18.01 → 0:24.41  (6.40 s)  
**Narration:** “It's one band, at two point four gigahertz, shared with café Wi-Fi and even microwave ovens.”  
**Caption phrases:** It's one band, | at two point four gigahertz, | shared with café Wi-Fi | and even microwave ovens.

| | |
|---|---|
| **Objects on screen** | A horizontal ruler of the 2.4 GHz band, 2400 → 2483.5 MHz; Wi-Fi channels 1, 6 and 11 as rounded blocks above it; a microwave oven pictogram with its broad emission hump; a big “2.4 GHz”. |
| **Position and size (1080 × 1920)** | Ruler x 100–980 at y 860; Wi-Fi blocks above it at y 700–800; oven hump around 2450 MHz; “2.4 GHz” at y 520. |
| **Background** | Station wall: off-white enamel tiles (150 × 75 px, running bond), a blue frieze low on the wall, a soft light sweeping past every ~14 s (components.js). |
| **Movement** | “2.4 GHz” lands on “gigahertz”; the Wi-Fi blocks drop in on “Wi-Fi”; the oven and its hump on “microwave”; a small sign “UNLICENSED · NOBODY OWNS IT”. |
| **Timing and easing** | Drops E.out3 0.45 s, staggered 0.08 s. |
| **Camera** | Slow drift right to left (12 px). |
| **Colour and emphasis** | Wi-Fi blocks and the hump in red tints (interference); the band in ink; the number in orange. |
| **Text overlays** | “ONE RADIO BAND” · “2.4 GHz” · “WI-FI 1 · 6 · 11” · “MICROWAVE OVEN” (hump centred on 2450 MHz) · “UNLICENSED · NOBODY OWNS IT”; before the Wi-Fi arrives, the crowd's hops dance inside the band. |
| **Transition out** | Continues. |
| **Sound** | impact (soft) on “gigahertz”; pops for the blocks; a hum-like swell for the oven. |
| **Purpose** | Make the band concrete — and crowded before Bluetooth even arrives. |

## 06 · Seventy-nine channels

**Time:** 0:24.41 → 0:28.40  (3.99 s)  
**Narration:** “Classic Bluetooth slices it into seventy-nine channels.”  
**Caption phrases:** Classic Bluetooth | slices it into | seventy-nine channels.

| | |
|---|---|
| **Objects on screen** | The ruler gains 79 ticks, one per channel; the ticks stretch down into 79 tracks; “79” in big type; a footnote for Bluetooth LE. |
| **Position and size (1080 × 1920)** | Tracks x 100–980, 11.3 px apart; “79” at (540, 560); footnote at y 1170. |
| **Background** | Station wall: off-white enamel tiles (150 × 75 px, running bond), a blue frieze low on the wall, a soft light sweeping past every ~14 s (components.js). |
| **Movement** | The ticks run in left to right ending on “seventy-nine”; on “channels” they grow into tracks. |
| **Timing and easing** | Ticks staggered 8 ms each; tracks E.io3 0.6 s. |
| **Camera** | Steady. |
| **Colour and emphasis** | Ticks and tracks in blue; the number in orange. |
| **Text overlays** | “CLASSIC BLUETOOTH” · “79 CHANNELS · 1 MHz EACH” · “BLUETOOTH LE: 40 × 2 MHz”. |
| **Transition out** | Fade: the ruler has become the hop map's axis, so the next scene starts where this one ends. |
| **Sound** | a run of ticks rising in pitch; lock on “channels”. |
| **Purpose** | Bluetooth's slice of the band, made visible. |

## 07 · Never stays on one

**Time:** 0:28.40 → 0:30.40  (2.00 s)  
**Narration:** “And it never stays on one.”  
**Caption phrases:** And it never | stays on one.

| | |
|---|---|
| **Objects on screen** | The hop map: a white sign panel with the 79 tracks (2402 → 2480 MHz across), time running down, a NOW line near the top; your line in blue — the real hop sequence of an example phone (computed with the specification's kernel). |
| **Position and size (1080 × 1920)** | Panel x 70–1010, y 400–1190; NOW line at y 560; one slot = 58 px. |
| **Background** | Station wall: off-white enamel tiles (150 × 75 px, running bond), a blue frieze low on the wall, a soft light sweeping past every ~14 s (components.js). |
| **Movement** | Your line steps from channel to channel, one hop per slot, scrolling up; phone and earbud markers ride the NOW line. |
| **Timing and easing** | Scroll 4 slots per second (slowed ×400); marker snaps E.out3 0.1 s. |
| **Camera** | Slow push-in 1.00 → 1.03. |
| **Colour and emphasis** | Blue line, grey tracks, ink labels. |
| **Text overlays** | “CHANNEL” · “2402 MHz” · “2480 MHz” · “NOW” · “SLOWED ×400” · legend “YOUR PHONE ↔ EARBUDS”. |
| **Transition out** | Continues. |
| **Sound** | tick on every hop (alternating pitch). |
| **Purpose** | Show hopping as a line you can follow. |

## 08 · Sixteen hundred a second

**Time:** 0:30.40 → 0:34.01  (3.61 s)  
**Narration:** “It jumps channel up to sixteen hundred times a second.”  
**Caption phrases:** It jumps channel | up to sixteen hundred | times a second.

| | |
|---|---|
| **Objects on screen** | The same map running at real speed: 1,600 hops a second become a dense blue mesh streaming upward; a rate readout. |
| **Position and size (1080 × 1920)** | Readout plate at (540, 1100). |
| **Background** | Station wall: off-white enamel tiles (150 × 75 px, running bond), a blue frieze low on the wall, a soft light sweeping past every ~14 s (components.js). |
| **Movement** | On “jumps” the scroll accelerates to real time; the readout climbs to 1,600 hops/s, landing on “hundred”; it decelerates back on “second”. |
| **Timing and easing** | Rate eased in over 0.6 s and out over 0.5 s. |
| **Camera** | A short shake at full speed. |
| **Colour and emphasis** | Blue mesh; the number in orange. |
| **Text overlays** | “1,600” · “HOPS PER SECOND · MAXIMUM” · “REAL TIME” → back to “SLOWED ×400”. |
| **Transition out** | Continues. |
| **Sound** | count + riser into impact on “hundred”; whoosh as it slows. |
| **Purpose** | Make the number felt, honestly labelled as real time. |

## 09 · A timetable

**Time:** 0:34.01 → 0:39.89  (5.88 s)  
**Narration:** “The jumps look random, but they follow a timetable your phone works out from its address and its clock.”  
**Caption phrases:** The jumps look random, | but they follow | a timetable | your phone works out | from its address | and its clock.

| | |
|---|---|
| **Objects on screen** | A split-flap departure board slides up over the lower map: TIME · CHANNEL · MHz rows — the next hops of your line; above it, two input chips (ADDRESS, CLOCK) feed a small box labelled HOP KERNEL. |
| **Position and size (1080 × 1920)** | Board 860 × 430 px at y 700; chips at y 470. |
| **Background** | Station wall: off-white enamel tiles (150 × 75 px, running bond), a blue frieze low on the wall, a soft light sweeping past every ~14 s (components.js). |
| **Movement** | On “timetable” the board flips in row by row; on “address” and “clock” the chips light and send their values into the kernel; the rows keep flipping as the map scrolls. |
| **Timing and easing** | Flaps 0.12 s each, rows staggered 0.05 s; chips E.out3 0.35 s. |
| **Camera** | Steady. |
| **Colour and emphasis** | Board in ink with white flaps; the address chip blue, the clock chip violet. |
| **Text overlays** | “YOUR PHONE'S TIMETABLE” with rows “NOW / +0.625 / +1.250 … · CH · MHz” · “ADDRESS · AN EXAMPLE  DA:7E:12:5B:91:E3” · “CLOCK · 312.5 µs TICKS  0x3A4F…” · “HOP SELECTION”. |
| **Transition out** | Continues. |
| **Sound** | flap ticks in bursts; blip for each chip. |
| **Purpose** | The jumps are not random: anyone with the address and the clock can compute them. |

## 10 · In step

**Time:** 0:39.89 → 0:45.55  (5.65 s)  
**Narration:** “Your earbuds work out the same one, so they're always listening in the right place at the right moment.”  
**Caption phrases:** Your earbuds | work out the same one, | so they're always listening | in the right place | at the right moment.

| | |
|---|---|
| **Objects on screen** | Two boards side by side — PHONE and EARBUDS — flipping identically; then the map again with the phone and earbud markers landing on the same channel at every hop. |
| **Position and size (1080 × 1920)** | Boards 420 × 360 px at x 70 and 550; map below. |
| **Background** | Station wall: off-white enamel tiles (150 × 75 px, running bond), a blue frieze low on the wall, a soft light sweeping past every ~14 s (components.js). |
| **Movement** | The earbuds' board flips in on “same one”; on “right place” the markers lock together hop after hop. |
| **Timing and easing** | Flaps as before; lock pulses on each hop. |
| **Camera** | Pull back to the full map. |
| **Colour and emphasis** | Both boards identical; the markers blue; each lock flashes green. |
| **Text overlays** | “PHONE” · “EARBUDS” · “SAME ADDRESS + SAME CLOCK = SAME TIMETABLE” · “RIGHT PLACE = CHANNEL” · “RIGHT MOMENT = SLOT · 0.625 ms”. |
| **Transition out** | Fade: the same map continues, now with your neighbour's line. |
| **Sound** | lock on each landing, rising pitch. |
| **Purpose** | Show synchronisation: two devices, one plan. |

## 11 · Someone else lands

**Time:** 0:45.55 → 0:49.70  (4.15 s)  
**Narration:** “Still, someone else's packet will sometimes land on your channel.”  
**Caption phrases:** Still, someone else's | packet will sometimes | land on your channel.

| | |
|---|---|
| **Objects on screen** | The map with your line and your neighbour's orange line (also a real sequence); the orange line lands on the channel where your earbud is listening. |
| **Position and size (1080 × 1920)** | As the hop map. |
| **Background** | Station wall: off-white enamel tiles (150 × 75 px, running bond), a blue frieze low on the wall, a soft light sweeping past every ~14 s (components.js). |
| **Movement** | The orange packet arrives at your earbud's listening ring on “land on your channel”. |
| **Timing and easing** | Ring pulse 0.4 s. |
| **Camera** | Push in toward the landing point. |
| **Colour and emphasis** | Orange intruder, blue listener. |
| **Text overlays** | “YOUR NEIGHBOUR'S LINK” · “SAME CHANNEL · CH 32”. |
| **Transition out** | Zoom into the listening ring. |
| **Sound** | pop for the landing. |
| **Purpose** | Set up the problem the code solves. |

## 12 · The name tag

**Time:** 0:49.70 → 0:54.68  (4.98 s)  
**Narration:** “So every packet starts with a name tag: a code made from your phone's address.”  
**Caption phrases:** So every packet | starts with a name tag: | a code made from | your phone's address.

| | |
|---|---|
| **Objects on screen** | One packet as a capsule: a round badge at its front (the access code, shown as the low 24 bits of the phone's address: 5B91E3), header, and a music payload. |
| **Position and size (1080 × 1920)** | Capsule 760 × 170 px centred at (540, 760); legend below it at y 900. |
| **Background** | Station wall: off-white enamel tiles (150 × 75 px, running bond), a blue frieze low on the wall, a soft light sweeping past every ~14 s (components.js). |
| **Movement** | The packet slides in; the badge pops on “name tag”; on “phone's address” the address chip flies into the badge. |
| **Timing and easing** | Slide E.out3 0.5 s; badge E.out3 0.35 s. |
| **Camera** | Steady. |
| **Colour and emphasis** | Badge in blue; payload violet notes; header grey. |
| **Text overlays** | “ACCESS CODE” · “HEADER” · “MUSIC” · “NAME TAG” · “YOUR PHONE'S ADDRESS (EXAMPLE)” with 5B:91:E3 highlighted · “ACCESS CODE · MADE FROM THE ADDRESS”. |
| **Transition out** | Continues. |
| **Sound** | slide; pop on “tag”; blip as the address lands. |
| **Purpose** | Every packet carries the phone's identity at its very front. |

## 13 · Only that code

**Time:** 0:54.68 → 1:00.13  (5.45 s)  
**Narration:** “Your earbuds only open up for that code. Your neighbour's music carries a different one.”  
**Caption phrases:** Your earbuds only | open up for that code. | Your neighbour's music | carries a different one.

| | |
|---|---|
| **Objects on screen** | Your earbud as a station with a pair of sliding doors; your packet (blue badge 5B91E3) arrives — doors open; your neighbour's (orange badge 9E2B47) arrives — doors stay shut and it fades away. |
| **Position and size (1080 × 1920)** | Earbud gate at (540, 820); packets arrive from the right. |
| **Background** | Station wall: off-white enamel tiles (150 × 75 px, running bond), a blue frieze low on the wall, a soft light sweeping past every ~14 s (components.js). |
| **Movement** | Blue opens on “code”; orange is refused on “different one”. |
| **Timing and easing** | Doors E.io3 0.3 s. |
| **Camera** | Steady. |
| **Colour and emphasis** | Green check for the match, red cross for the refusal. |
| **Text overlays** | “YOUR EARBUD · LISTENING FOR 5B91E3” · “YOUR CODE · LET IN” · “NOT YOUR CODE · IGNORED”. |
| **Transition out** | Hard cut. |
| **Sound** | lock + chime for the match; deny for the refusal (on the cue, gain 0.6). |
| **Purpose** | Close the hook's loop: your neighbour's music is ignored. |

## 14 · Same channel, same instant

**Time:** 1:00.13 → 1:04.36  (4.23 s)  
**Narration:** “And sometimes two packets hit the same channel at the same instant.”  
**Caption phrases:** And sometimes | two packets | hit the same channel | at the same instant.

| | |
|---|---|
| **Objects on screen** | The map with your line and your neighbour's: two real sequences that coincide — both on the same channel in the same slot. |
| **Position and size (1080 × 1920)** | As the hop map; the collision at the NOW line. |
| **Background** | Station wall: off-white enamel tiles (150 × 75 px, running bond), a blue frieze low on the wall, a soft light sweeping past every ~14 s (components.js). |
| **Movement** | The two lines converge; on “instant” they hit the same station; a starburst. |
| **Timing and easing** | Burst E.out3 0.35 s. |
| **Camera** | Camera punch (zoom 1.05, shake) on “instant”. |
| **Colour and emphasis** | Red burst over blue and orange. |
| **Text overlays** | “COLLISION · CH 50 · 2452 MHz” · legend “YOURS · YOUR NEIGHBOUR'S” · “SLOWED ×400”. |
| **Transition out** | Hard cut. |
| **Sound** | riser into impact + rip on “instant”. |
| **Purpose** | Show that collisions really happen. |

## 15 · Strong likelihood

**Time:** 1:04.36 → 1:08.10  (3.74 s)  
**Narration:** “Bluetooth's own rulebook calls that a strong likelihood.”  
**Caption phrases:** Bluetooth's own | rulebook calls that | a strong likelihood.

| | |
|---|---|
| **Objects on screen** | A notice from the rulebook: an abridged quote from the Bluetooth Core Specification with “strong likelihood” marked; the source line. |
| **Position and size (1080 × 1920)** | Notice 860 × 520 px centred at (540, 780). |
| **Background** | Station wall: off-white enamel tiles (150 × 75 px, running bond), a blue frieze low on the wall, a soft light sweeping past every ~14 s (components.js). |
| **Movement** | The notice slides up; “STRONG LIKELIHOOD” is marked with a red underline on its words. |
| **Timing and easing** | Slide E.out3 0.45 s; marker 0.4 s. |
| **Camera** | Slow push-in. |
| **Colour and emphasis** | Ink text on white; the phrase in red. |
| **Text overlays** | “BLUETOOTH CORE SPECIFICATION · VOL 2 · PART B · §2” and the verbatim sentence “…there is a strong likelihood of two independent Bluetooth devices having their transceivers tuned to the same RF carrier, resulting in a physical channel collision.”, “strong likelihood” highlighted; an “EXPECTED” stamp (the video's annotation). |
| **Transition out** | Slide back down. |
| **Sound** | stamp on “strong”, slide. |
| **Purpose** | Credibility: the designers expected this. |

## 16 · Garbled, then sent again

**Time:** 1:08.10 → 1:14.89  (6.79 s)  
**Narration:** “They garble each other. Your earbuds don't confirm, so your phone sends it again on the next hop, milliseconds later.”  
**Caption phrases:** They garble each other. | Your earbuds | don't confirm, | so your phone | sends it again | on the next hop, | milliseconds later.

| | |
|---|---|
| **Objects on screen** | The two packets cracked and scrambled; your earbud's reply slot empty (no acknowledgement); your packet re-launched on the next hop's channel and accepted. |
| **Position and size (1080 × 1920)** | Packets at y 620; the reply slot at y 820; the map strip with the resend below at y 980. |
| **Background** | Station wall: off-white enamel tiles (150 × 75 px, running bond), a blue frieze low on the wall, a soft light sweeping past every ~14 s (components.js). |
| **Movement** | Payloads scramble on “garble”; the empty reply box flashes on “confirm”; the packet re-launches on “again” and lands on “hop”; a green check and “+1.25 ms” on “milliseconds”. |
| **Timing and easing** | Scramble 0.3 s; relaunch E.io3 0.5 s. |
| **Camera** | Steady. |
| **Colour and emphasis** | Red scramble; the resend blue with a green check. |
| **Text overlays** | “REPLY: OK?” · “NO CONFIRMATION” · “SENT AGAIN · NEXT HOP” · “SLOT 150 · CH 50” · “SLOT 152 · CH 18” · “+1.25 ms”. |
| **Transition out** | Continues. |
| **Sound** | stall for the missing reply; zip for the resend; lock + chime on arrival. |
| **Purpose** | Show the repair, not just the damage. |

## 17 · In reserve

**Time:** 1:14.89 → 1:19.83  (4.94 s)  
**Narration:** “And a fraction of a second of music waits in reserve, so you don't hear the gap.”  
**Caption phrases:** And a fraction | of a second of music | waits in reserve, | so you don't hear | the gap.

| | |
|---|---|
| **Objects on screen** | The earbud's buffer as a queue of packets sliding toward a playhead; the resent packet drops into its gap well before the playhead reaches it. |
| **Position and size (1080 × 1920)** | Queue 860 × 110 px at y 820; playhead at its left end. |
| **Background** | Station wall: off-white enamel tiles (150 × 75 px, running bond), a blue frieze low on the wall, a soft light sweeping past every ~14 s (components.js). |
| **Movement** | The queue streams left; on “reserve” the length of the queue is labelled; the gap fills on “gap”. |
| **Timing and easing** | Constant streaming; gap fill E.out3 0.3 s. |
| **Camera** | Steady. |
| **Colour and emphasis** | Violet queue (time); the refilled slot blue; the playhead ink. |
| **Text overlays** | “INSIDE YOUR EARBUDS” · “PLAYING” · “ARRIVING” · “A FRACTION OF A SECOND IN RESERVE” · “THE GAP IS FILLED BEFORE IT PLAYS”. |
| **Transition out** | Whip pan to the café. |
| **Sound** | slide under the queue; pop when the gap fills. |
| **Purpose** | Why a resend costs nothing you can hear. |

## 18 · The café

**Time:** 1:19.83 → 1:23.23  (3.40 s)  
**Narration:** “Cafés add a bigger problem: Wi-Fi doesn't hop.”  
**Caption phrases:** Cafés add | a bigger problem: | Wi-Fi doesn't hop.

| | |
|---|---|
| **Objects on screen** | A café in plan view: round tables, chairs, people with earbuds and laptops, a counter with a Wi-Fi router whose coverage tints the room. |
| **Position and size (1080 × 1920)** | Room 860 × 760 px centred on (540, 800); router on the counter at (820, 520). |
| **Background** | Station wall: off-white enamel tiles (150 × 75 px, running bond), a blue frieze low on the wall, a soft light sweeping past every ~14 s (components.js). |
| **Movement** | On “Wi-Fi” the router's coverage fills the room; on “doesn't hop” a label pins it to one place. |
| **Timing and easing** | Fill E.out3 0.6 s. |
| **Camera** | Slow push-in. |
| **Colour and emphasis** | Coverage in a red tint; earbud links blue/grey. |
| **Text overlays** | “CAFÉ” · “WI-FI · CHANNEL 6” · “DOESN'T HOP”; your seat ringed in blue. |
| **Transition out** | Zoom into the router's label (to the map). |
| **Sound** | whoosh on the cut; a soft swell for the coverage. |
| **Purpose** | A new place, a new kind of neighbour. |

## 19 · Twenty channels, nonstop

**Time:** 1:23.23 → 1:26.57  (3.34 s)  
**Narration:** “A network camps on about twenty of those channels.”  
**Caption phrases:** A network camps on | about twenty | of those channels.

| | |
|---|---|
| **Objects on screen** | The hop map with a red block over channels 25–44 (Wi-Fi channel 6, 2427–2447 MHz) for all time; your line's hops inside it fail with red crosses. |
| **Position and size (1080 × 1920)** | As the hop map. |
| **Background** | Station wall: off-white enamel tiles (150 × 75 px, running bond), a blue frieze low on the wall, a soft light sweeping past every ~14 s (components.js). |
| **Movement** | The block grows down the map on “camps”; crosses land on each failed hop as it reaches NOW. |
| **Timing and easing** | Block E.io3 0.6 s; crosses E.out3 0.2 s. |
| **Camera** | Steady. |
| **Colour and emphasis** | Red block and crosses; blue line elsewhere. |
| **Text overlays** | “WI-FI · ≈ 20 CHANNELS”. |
| **Transition out** | Continues. |
| **Sound** | deny (soft) on each failure. |
| **Purpose** | Show persistent interference, unlike another hopper. |

## 20 · Dropped from the timetable

**Time:** 1:26.57 → 1:33.45  (6.89 s)  
**Narration:** “So your phone keeps score. Channels that keep failing are dropped from the timetable, though it always keeps at least twenty.”  
**Caption phrases:** So your phone | keeps score. | Channels that | keep failing | are dropped from | the timetable, | though it always keeps | at least twenty.

| | |
|---|---|
| **Objects on screen** | Tally bars above each channel count failures; the failing channels are closed (hatched, “CLOSED”); your line re-routes — the real adapted hop sequence with those channels unused; a counter of channels in use. |
| **Position and size (1080 × 1920)** | Tallies at y 470–520; counter plate at (540, 1100). |
| **Background** | Station wall: off-white enamel tiles (150 × 75 px, running bond), a blue frieze low on the wall, a soft light sweeping past every ~14 s (components.js). |
| **Movement** | Tallies grow on “keeps score”; on “dropped” the block is stamped closed and the line jumps to the adapted sequence; the counter drops 79 → 59 on “twenty” with a floor mark at 20. |
| **Timing and easing** | Stamp hard; reroute E.io3 0.5 s. |
| **Camera** | Pull back slightly. |
| **Colour and emphasis** | Closed channels grey-hatched; the rerouted line blue; the counter orange. |
| **Text overlays** | “FAILURES PER CHANNEL” (illustrative tallies) · “CLOSED” · “CHANNELS IN USE 79 → 59” · “NEVER FEWER THAN 20”. |
| **Transition out** | Zoom out to the carriage. |
| **Sound** | tick tallies; stamp on “dropped”; lock + chime as the line re-routes. |
| **Purpose** | Adaptive hopping, shown with the real algorithm. |

## 21 · No private line

**Time:** 1:33.45 → 1:36.68  (3.23 s)  
**Narration:** “So your earbuds never had a private line.”  
**Caption phrases:** So your earbuds never | had a private line.

| | |
|---|---|
| **Objects on screen** | Back in the carriage: all forty links visible and running; your link blue. |
| **Position and size (1080 × 1920)** | As the first scene, camera wider. |
| **Background** | Station wall: off-white enamel tiles (150 × 75 px, running bond), a blue frieze low on the wall, a soft light sweeping past every ~14 s (components.js). |
| **Movement** | The links pulse with traffic; the snapped wire icon appears faintly and fades. |
| **Timing and easing** | Steady streaming. |
| **Camera** | Slow pull back 1.06 → 1.0. |
| **Colour and emphasis** | Your link blue; the rest grey. |
| **Text overlays** | “NO PRIVATE LINE”. |
| **Transition out** | Continues. |
| **Sound** | chime as the camera settles. |
| **Purpose** | Return to the first picture, now understood. |

## 22 · Timetable, name tag, second chance

**Time:** 1:36.68 → 1:43.23  (6.55 s)  
**Narration:** “They have their own timetable, a name tag and a second chance, up to sixteen hundred times a second.”  
**Caption phrases:** They have their own | timetable, | a name tag | and a second chance, | up to sixteen hundred | times a second.

| | |
|---|---|
| **Objects on screen** | Three signage pictogram tiles over the carriage: a split-flap timetable, a code badge, a retry arrow; then every link in the carriage pulses fast. |
| **Position and size (1080 × 1920)** | Tiles 250 × 250 px at y 470, x 125 / 415 / 705. |
| **Background** | Station wall: off-white enamel tiles (150 × 75 px, running bond), a blue frieze low on the wall, a soft light sweeping past every ~14 s (components.js). |
| **Movement** | Each tile pops on its word; on “sixteen hundred” all the links pulse at once. |
| **Timing and easing** | Tiles E.out3 0.35 s; pulse 0.5 s. |
| **Camera** | Steady. |
| **Colour and emphasis** | Tiles blue, violet, green. |
| **Text overlays** | “TIMETABLE” · “NAME TAG” (badge 5B91E3) · “SECOND CHANCE” · “UP TO 1,600 TIMES A SECOND”. |
| **Transition out** | Continues. |
| **Sound** | three pops rising in pitch; swell on “second”. |
| **Purpose** | The three ideas in three pictures. |

## 23 · Share on purpose

**Time:** 1:43.23 → 1:52.35  (9.11 s)  
**Narration:** “And if you do want your neighbour's song? Newer Bluetooth can share one stream with any number of earbuds.”  
**Caption phrases:** And if you do want | your neighbour's song? | Newer Bluetooth | can share one stream | with any number | of earbuds.

| | |
|---|---|
| **Objects on screen** | Your neighbour's orange stream fans out from their phone to your earbuds and to many others in the carriage; a station-name sign with the title; end card. |
| **Position and size (1080 × 1920)** | Title sign 860 × 150 px at y 430; carriage below. |
| **Background** | Station wall: off-white enamel tiles (150 × 75 px, running bond), a blue frieze low on the wall, a soft light sweeping past every ~14 s (components.js). |
| **Movement** | On “song” the orange link reaches you; on “any number” it fans out to a dozen earbuds; the title sign slides in after the last word and holds. |
| **Timing and easing** | Fan-out staggered 40 ms, E.out3 0.4 s. |
| **Camera** | Slow pull back. |
| **Colour and emphasis** | Orange broadcast; your earbuds glow orange-blue. |
| **Text overlays** | “LE AUDIO BROADCAST · ONE STREAM, ANY NUMBER” · title “HOW BLUETOOTH WORKS” · “HOP · TAG · RETRY · DODGE”. |
| **Transition out** | End (holds). |
| **Sound** | chime + swell on the title; the finale chord resolves. |
| **Purpose** | A twist that closes the hook: now you can hear it — on purpose. |
