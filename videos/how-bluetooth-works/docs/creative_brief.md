# Creative brief — “How Bluetooth Works”

Requested by the user as: *“How Bluetooth works, the technology behind it and how it stops your earbuds
from clashing with everyone else's in a crowded metro or cafe. Make a video on this topic. Use the things
in your arsenal. Go all out.”* No length, look or audience was named, so those are decided below. “Go all
out” is read as craft, not length: the most considered direction, real data behind every picture (the hop
sequences drawn are computed with the specification's own algorithm), a custom backdrop, HUD and drawn
world, dense sound design — inside the shortest length that answers both halves of the question.

## Audience and promise

Everyone who wears wireless earbuds on a train, a bus or in a café — curious, not technical. If they have a
model at all, it is “pairing connects my earbuds to my phone”, which quietly implies a private link, like an
invisible wire or a walkie-talkie channel that is theirs. The question in their head is the user's: forty
people in one carriage are streaming music by radio, so why doesn't it turn into noise, and why don't I
hear my neighbour's song? After about 110 seconds they will be able to say: there is no private channel —
everyone's earbuds share the same 79 channels of one unlicensed band; yours jump channel up to 1,600 times a
second, following a timetable your phone works out from its own address and clock, and your earbuds work
out the same one; every packet starts with a code made from your phone's address, so your earbuds ignore
everyone else's; clashes still happen — Bluetooth's own rulebook expects them — and a garbled packet is
simply sent again on the next hop while a buffer hides the gap; and in a café, your phone learns which
channels Wi-Fi is drowning and stops using them. They stop scrolling because frame one is a packed carriage
seen from above with every pair of earbuds lit in its own colour — and a stray packet from the neighbour's
phone bouncing off your ear.

## Angle

Raw material from the research (docs/sources.md), ★ = most surprising, ✎ = most drawable:
1. Every earbud in the carriage is on the same 2.4 GHz band — the same one as café Wi-Fi and microwave ovens,
   and nobody owns it. ✎
2. Classic Bluetooth slices the band into 79 channels, 1 MHz each. ✎
3. A link changes channel up to 1,600 times a second. ★✎
4. The order isn't random: it is computed from the phone's address and clock — every phone has its own
   “timetable”, about a day long before it repeats — and the earbuds compute the same one. ★✎
5. The phone talks in even 625 µs slots, the earbuds answer in the odd ones. ✎
6. Every packet starts with an access code made from the phone's address; the earbud's correlator only
   wakes up for that code. ★✎
7. The specification itself says collisions have “a strong likelihood” when many devices are around:
   Bluetooth doesn't prevent clashes, it is built to shrug them off. ★
8. A garbled packet isn't acknowledged, so it is resent at the next transmit slot — on the next hop's
   channel, 1.25–3.75 ms later. ✎
9. Headphones buffer a fraction of a second of audio precisely so resends arrive in time. ★
10. A Wi-Fi network sits on 20 MHz — about twenty Bluetooth channels — all the time. ✎
11. Adaptive hopping: channels that keep failing are marked bad and dropped, but at least 20 stay. ★✎
12. Up to seven active devices per phone link (piconet).
13. Newer Bluetooth (LE Audio, Auracast) can do the opposite on purpose: one stream, any number of earbuds. ★✎
14. The name comes from a Viking king; Hedy Lamarr patented frequency hopping in 1942 (both widely told).

Most surprising: 3, 4, 6, 7, 9, 11, 13. Most drawable: 2, 3, 4, 6, 8, 10–11. The angle comes from the items
that are both, with 7 as the turn that makes it honest.

Five candidate angles:
1. **There is no private channel: your earbuds share every channel with the whole carriage and win by never
   standing still — Bluetooth doesn't prevent clashes, it makes them rare, recognisable and cheap.** (kept)
2. Your phone and earbuds follow a secret timetable: up to 1,600 channel changes a second, computed from the
   phone's address and clock.
3. Every packet wears a name tag; your earbuds are bouncers who ignore every other name in the room.
4. Bluetooth's own rulebook expects collisions — it calls them “a strong likelihood”.
5. In a café, your earbuds quietly stop using a quarter of the radio band.

Kept (1): it is the honest answer to the user's question — the true answer to “how does it stop clashing?”
is “it doesn't stop all of them; it makes them rare, tells yours apart and repairs the rest” — and it
overturns the private-wire picture the viewer starts with. The others become its beats: (2) is the hop beat,
(3) the code beat, (4) the turn into the clash beat, (5) the café beat. On their own, (2)–(5) are single
tricks; (1) is the reason all four are needed.

## Directions considered

### A — Rush hour on the radio (transit wayfinding world, myth → truth, playful clarity)

The first frame is a metro carriage drawn as a plan, the way transit diagrams draw them: seats, poles,
forty passengers seen from above, every pair of earbuds lit in its own line colour. A stray packet from the
neighbour's phone flies at your ear and bounces off: “So why don't you ever hear your neighbour's music?”
Then the private wire you imagined is drawn — and snapped. The rest of the video is told in the graphic
language people already use to keep many routes apart on one network: the radio band becomes a line map
of 79 tracks, your link is the blue line hopping between them with 45° bends, the hop order is a
departure board (the real sequence, computed), the access code is the badge on the front of every
packet, a collision is two lines hitting the same station at the same instant, café Wi-Fi is a closed
section of track. It ends back in the carriage, every line running, nobody colliding for long. Why it
suits: the user framed the question in a metro, and transit graphics exist to solve exactly this problem —
many lines sharing one network without confusion. Risk: the metaphor multiplies (trains, platforms, tickets,
doors) until the mechanism disappears behind it.

### B — The song you can't hear (analogy world: a piano roll, wonder)

Dark velvet, a scrolling piano roll with 79 keys. “Your earbuds are playing a song you'll never hear —
sixteen hundred notes a second.” Each phone plays its own melody of hops on the same keyboard; a clash is a
sour note, replayed on the next key; café Wi-Fi is a fat chord held on twenty keys, and your melody is
rewritten around it. A 1942 cameo: Hedy Lamarr and George Antheil's frequency-hopping patent, kept in step
by piano rolls. It ends on the whole carriage as a polyphonic score. Why it suits: a hop pattern plotted
over time literally looks like a piano roll, and earbuds are about music. Risk: the hop “melody” collides
with the actual music being streamed; the access code has no musical equivalent; the Lamarr story is
usually overclaimed (no documented lineage to Bluetooth); and it is another dark look after the GPU video.

### C — You are a packet (second person, game HUD, comic urgency)

“You are three milliseconds of a song. You have to get from this phone to that ear, through a carriage of
forty other radios. You have a fifth of a second.” An arcade HUD of the packet's own: CHANNEL, TIME LEFT,
RETRIES. You get stamped with your phone's code, launched onto channel 47 at exactly the slot the earbud is
listening, hit by another packet — lost — and a copy of you respawns on channel 12 a few milliseconds later,
dodges the café's Wi-Fi zone and lands. “Now do that sixteen hundred times a second, for everyone here.” Why
it suits: the stakes (a deadline, a crowd, retries) are the real ones. Risk: from inside one packet you
can't see the pattern — the hop timetable, the idea that matters most, becomes invisible; game gimmicks and
pixel type read poorly at phone size.

## Chosen direction

**A**, because it is the only direction in which the central idea — many links sharing one network by
following separate timetables — is shown in a graphic language viewers already read fluently, and because
the user's own setting (a crowded metro) becomes the video's world rather than a backdrop. From **C** it
takes the stakes of one packet: the clash beat follows a single packet of your song through the collision,
the silence where the acknowledgement should be, the resend and the arrival inside the buffer's deadline.
From **B** it takes the insight that a hop pattern drawn over time is a readable *line*, not noise — drawn
here as a metro line, not a melody. B's piano roll and Lamarr cameo and C's arcade look are dropped. To
contain A's risk, the metaphor is the *graphic language*, not a story: the map is always the real thing
(channels against time, real hop sequences), labels use the real words (channel, packet, code), and each
beat borrows exactly one transit object (the timetable board for the hop pattern, the line badge for the
access code, the closed section for Wi-Fi).

## Hook

Three openings, each a picture and a line inside three seconds:

1. **The stray packet.** A packed carriage in plan view; every pair of earbuds lit in its own line colour;
   a packet from the neighbour's phone arcs toward your ear and bounces off. Line: “Rush hour. Forty people
   in this carriage are streaming over the same slice of radio.” Then: “So why don't you ever hear your
   neighbour's music?”
2. **The counter.** A counter races to 1,600 while a line zigzags across a map. Line: “In the last second,
   your earbuds changed radio channel sixteen hundred times.”
3. **The wire.** A cable from a phone to an ear, then scissors. Line: “Your earbuds aren't on a private
   channel. There's no such thing.”

Chosen: **1**, because the picture is the viewer's own situation and the line is the user's own question —
the open loop is felt before anything is explained. (3) becomes the immediate turn (the myth beat), and
(2) becomes the hop beat's punchline. **Open loop:** why don't you hear your neighbour's music? **Closed**
twice: in the code beat (their packets carry a different code and are ignored) and in the payoff (and if
you ever want to hear it, newer Bluetooth can share one stream on purpose).

## Story shape

**Myth → truth** for the opening, then a **follow-the-line** body told as stations on a metro line (the
progress bar is that line), ending with a scale reveal and a twist. About 105–112 s. Beats (each one is a
chapter, a scene and a music mood):

| # | Beat (`id`) | Seconds | Job | Turn into the next |
|---|---|---|---|---|
| 1 | `hook` | 0–8 | The carriage; a stray packet bounces off; the question. | “You'd think pairing…” |
| 2 | `myth` | 8–15 | The private wire you imagine — snapped. They share every channel with everyone here. | “Here's what they share.” |
| 3 | `band` | 15–27 | One band at 2.4 GHz, shared with Wi-Fi and microwave ovens, owned by nobody, sliced into 79 channels. | “And it never stays put.” |
| 4 | `hop` | 27–46 | Up to 1,600 jumps a second; the order is a timetable computed from the phone's address and clock; the earbuds compute the same one and wait on the right channel at the right moment. | “Sometimes, someone else lands on yours.” |
| 5 | `code` | 46–57 | Every packet starts with a code made from your phone's address; the earbuds only open for that code; your neighbour's are ignored (loop closed). | “And sometimes two arrive at the very same instant.” |
| 6 | `clash` | 57–75 | The rulebook calls collisions a “strong likelihood”. Both packets garbled; no confirmation; your phone resends on the next hop, milliseconds later; a buffer hides the gap. | “Cafés bring a bigger problem.” |
| 7 | `cafe` | 75–91 | Café Wi-Fi blankets about twenty channels nonstop; your phone keeps score, marks them bad and hops around them, always keeping at least twenty. | “So…” |
| 8 | `payoff` | 91–110 | Back in the carriage: no private line — a timetable, a name tag, a second chance, up to 1,600 times a second. Twist: newer Bluetooth can share one stream with any number of earbuds. | End card holds. |

Structural surprises, never more than ~18 s apart: the stray packet bouncing (0.5 s); the wire snapping
(~11 s, hard cut, alert red); the dive from the carriage into the band (~15 s, scale change); the line map
coming alive with the counter (~28 s); the split-flap timetable board (~36 s, format change); the badge
check at the door (~47 s, close-up); the camera punch and the stamped spec quote at the clash (~58 s,
alert register); the cut to the café (~75 s, new location); the zoom back out to the whole carriage (~91 s);
the broadcast twist (~103 s). **Payoff:** every line running at once and nothing breaking. **End ↔ start:**
the last frame is the first frame's carriage, now with its invisible lines drawn, and the neighbour's song
finally reaching you — because you both chose it.

## Pacing

Brisk. Target 105–112 s including the 0.3 s lead-in and the end card: about 290 words. Voice speed 1.05–1.08
(measured after recording). Pauses 0.22–0.32 s inside a thought, 0.45–0.55 s between thoughts, 0.65–0.75 s at
beat changes, where the scene changes land. Fastest in the hook and the myth (short sentences, hard cuts);
it breathes in the hop beat (the line drawing itself and the timetable board need a beat of reading) and in
the clash (the resend has to be seen before the buffer is mentioned). The 1,600 figure holds about 1.5 s on
screen. Something visibly changes every 1–2.5 s — a hop, a flap, a badge check, a camera move.

## Visual world

**The metro, drawn as wayfinding graphics.** Everything is a transit diagram: plan views (the carriage from
above, the café from above), line maps (the radio band as a 79-track map, the hop map), a split-flap
departure board (the hop timetable), line badges (the access code), signage pictograms (Wi-Fi, microwave,
phone, earbuds). The hero is **your line** — the blue line between your phone and your earbuds — which is
drawn in the carriage, hops across the band, crosses another line at the clash, detours around the café's
Wi-Fi and returns to the carriage at the end. Your neighbour's line is orange; everyone else's lines are
grey, the way a route map greys out the lines you aren't taking.

The hop maps are real: every sequence drawn is computed with the Bluetooth hop-selection kernel
(`tools/hopkernel.js`, checked against all 7,680 hops of the specification's sample data), for example
addresses and clocks; the clash shown is a genuine coincidence of two real sequences, found by search; the
café's adapted sequence is the real AFH re-mapping with the Wi-Fi channels marked unused. Time on the maps
is slowed and labelled (“slowed ×400”).

Diagram vs. object vs. type: mechanisms are diagrams (maps, boards, slots); people and places are plan-view
objects; numbers and the spec quote are type. Scale: the band is shown as a ruler from 2.400 to 2.4835 GHz;
time as slots of 0.625 ms. Camera: steady and smooth, like a train — slow push-ins along the line, one punch
on the clash, zooms that connect scales (carriage → band → carriage). Motion personality: **smooth**
(`E.io3`/`E.out3`, entrances 0.4–0.6 s), with the board's flaps as the one mechanical, clicky exception.
Left out on purpose: radio-wave arcs, glow, the logo and the Viking name story, Hedy Lamarr, modulation,
pairing, encryption, LE's channel layout (one footnote), how the second earbud gets its audio.

## Style

**transit-map**, a new look designed for this video (`style.json`; candidates in `candidates/`). Light,
cool and clean — the white enamel of station signage: an off-white background (#F2F2EE → #E8E9E4) with a
custom backdrop of large, very faint wall tiles (drawn in `components.js`, static), so the frame reads as a
station wall without texture noise. Palette from the world of line colours, assigned by meaning:
**subject** line blue #1450D2 = your link and Bluetooth's mechanism (the line the viewer follows);
**accent** signal orange #E3640E = numbers and the competing link (your neighbour's line); **data**
violet #7B3DB5 = time — the clock, the timetable, slots; **alert** red #D21F35 = collisions, Wi-Fi
interference, bad channels; **good** green #13894B = delivered, acknowledged, good channels; **ink** near-black
#15171C. Other passengers' lines are greys from the palette (`COL.dim`), never extra hues. Type: Work Sans
for headlines and body — a neutral grotesque in the signage tradition, heavy weights for station names —
and IBM Plex Mono for numbers, channel labels and the board. Shapes: rounded line badges and pills (radius
12), 3 px ink strokes on signs, no shadows (enamel signs are flat). Captions: Work Sans 800, highlight as a
coloured underline bar (like the line strip under a station name), dark outline-free text on a soft light
scrim. HUD: a custom strip map — the chapters as stations on a blue line, the current one named (“NOW:
THE HOP”), drawn in `components.js` instead of the stock bar. Transitions: one family — camera moves along the line. Zooms connect
scales (into your seat, into the band, back out to the carriage at the end), fades join two states of the
same map (the band becoming the hop map, the hop map gaining your neighbour's line), one hard cut on the
clash and one whip-pan (`gl:WhipPan`) for the change of place to the café. The split-flap board is the
in-scene flourish for the timetable rather than a transition. **Rejected:**
*night-carriage* (deep navy, amber dot-matrix type, glowing line colours) — atmospheric and closer to the
LED boards, but it reads as the GPU video's dark technical world again, glowing lines on dark look like the
default “Bluetooth = blue glow” treatment, and amber-on-black type is harder to read at caption size. Also
rejected: studio-grid and riso-sticker (library looks with similar role colours) — the first says
“workshop”, the second “print shop”, and the previous video used the second.

## Sound

Score: 112 BPM, `pulse` kit (a driving kick and hats, like wheels on rail joints), transposed +1 for a
brighter, everyday key. Mood arc: `drone` (cold open in the carriage) → `light` (the myth) → `groove` (the band) →
`mechanical` (the hop: kick on every beat, room for flaps and ticks) → `build` (the code) → `tense` (the
clash: filtered, no kick) → `drive` (the café fix) → `finale` (back in the carriage, resolving on the held chord).
Voice: `bf_emma` (British English) at about 1.06 — a different voice from the earlier videos (`af_heart`,
`af_bella`), and a calm British delivery quietly evokes a station announcement without imitating any real
one; checked with `check-voice`, with `am_michael` as the fallback. Effects are transit sounds made by the
synthesiser: a `chime` for the doors and the end card, `slide` for doors and sliding panels, `whoosh` for
camera moves and passing trains, `tick` bursts for the split-flap board, `fire`/`zip` for packets leaving,
`lock` when a badge matches, `deny` when it doesn't, `impact` + `rip` for the collision, `stall` for the
missing acknowledgement, `stamp` for channels being closed, `swell` for the final reveal. Cues on short
words sit 50–80 ms early at gain ≤ 0.6.

## What would make this fail

1. **The metaphor eats the mechanism.** Trains, platforms, tickets, doors and timetables could turn into a
   transport story with Bluetooth as a footnote. Prevented by using transit as a graphic language only, by
   keeping the real words on every label (channel, packet, code, slot), by drawing real hop sequences and
   by borrowing one transit object per beat.
2. **It overclaims.** “1,600 hops a second, always”, “the phone is always in charge”, a made-up collision rate
   for a real train, “Bluetooth prevents collisions”. Prevented by “up to”, by quoting the specification's own
   phrase about collisions, by showing no carriage statistics, and by an accuracy note on roles (usually the
   phone).
3. **The maps are unreadable on a phone.** 79 hairline tracks and dozens of lines could be mush at 390 points
   wide. Prevented by drawing the tracks as faint guides labelled every ten, keeping only your line bold, slowing
   time down (and saying so), zooming into a window of channels when a detail matters, and checking every map
   at phone scale with `sheet` and `still`.
4. **It looks like every Bluetooth video** — blue glow on black, radio-wave arcs, a logo. Prevented by the
   daylight signage world, plan views and line maps, and by drawing no waves and no logo.
