## Technical accuracy review

Every number and claim, spoken or on screen, was checked against the Bluetooth Core Specification v5.4
(downloaded from bluetooth.com and searched locally, so the quotations in `docs/sources.md` are verbatim)
or the other sources listed there. The hop maps are not illustrations of hopping but the real thing: they
are drawn by the specification's hop selection kernel (Vol 2 Part B §2.6), implemented in
`components.js` and checked with `node tools/verify_hops.js <sample-data.txt>` against all 7,680
connection-state hops in the specification's own sample data (Vol 2 Part G), for the copy in
`tools/hopkernel.js` and the copy the scenes run (15,360 / 15,360 match). `node tools/map_facts.js`
reproduces every map fact quoted below.

| On screen / spoken | Status |
|---|---|
| “Forty people in this carriage are streaming … over the same slice of radio” · “40 PEOPLE · 1 RADIO BAND” | A picture of a crowded carriage, not a measurement; all BR/EDR links use the same 2.4 GHz ISM band (Vol 2 Part A §2). |
| “You might think pairing gives your earbuds a private channel … There's no such thing” · “NO PRIVATE LINE” · “79 CHANNELS · SHARED BY EVERYONE” | Every basic piconet channel hops pseudo-randomly through all 79 RF channels (Vol 2 Part B §2.2.2); nothing reserves a channel for one link. |
| “two point four gigahertz, shared with café Wi-Fi and even microwave ovens” · Wi-Fi 1/6/11 blocks · oven hump | Band 2400–2483.5 MHz (Vol 2 Part A §2); Wi-Fi channel 1 = 2402–2422 MHz, 1/6/11 non-overlapping (Intel); ovens ≈ 2,450 MHz (USDA FSIS). The hump's width is schematic. |
| “UNLICENSED · NOBODY OWNS IT” | “unlicensed … ISM frequency band” (Bluetooth SIG tech overview). |
| “Classic Bluetooth slices it into seventy-nine channels” · “1 MHz EACH · BLUETOOTH LE: 40 × 2 MHz” | Vol 2 Part A Table 2.1; LE: Vol 6 Part A §2. |
| “It jumps channel up to sixteen hundred times a second” · “1,600 HOPS PER SECOND · MAXIMUM” · “REAL TIME” / “SLOWED ×400” | “The maximum hop rate is 1600 hops per second in the Connection state” (Vol 2 Part B §2.1). The burst really draws 1,600 slots per second of video; every other map runs at 4 slots a second and says “SLOWED ×400”. |
| “a timetable your phone works out from its address and its clock” · ADDRESS (example) · CLOCK · 312.5 µs TICKS · HOP SELECTION · the board's rows | “determined by the Bluetooth clock and BD_ADDR of the Central” (§2.2.2); the clock's LSB ticks every 312.5 µs (§1.1); slots are 625 µs (§2.2.3). Every row on the board is the kernel's output for the example address and clock. Usually the phone is the Central; roles can be switched (accuracy note in the script). |
| “Your earbuds work out the same one” · two identical boards · “SAME ADDRESS + SAME CLOCK = SAME TIMETABLE” | The Central's clock is communicated to the Peripherals, which add an offset to synchronise (§2.2.2). |
| “someone else's packet will sometimes land on your channel” · “SAME CHANNEL · CH 32” | A genuine coincidence of the two example phones' sequences: slot 98, channel 32 (`tools/map_facts.js`). |
| “every packet starts with a name tag: a code made from your phone's address” · badge 5B91E3 · “ACCESS CODE · MADE FROM THE ADDRESS” | The channel access code begins every packet and is derived from the LAP (the address's lower 24 bits, 5B:91:E3 here) of the Central (§1.3). The badge shows the LAP the code is made from; the code itself is a 64-bit sync word. |
| “Your earbuds only open up for that code” · “LET IN” / “IGNORED” | The access correlator searches for the correct channel access code; without a trigger the receiver may sleep until the next RX event (§2.2.5.1). |
| “two packets hit the same channel at the same instant” · “COLLISION · CH 50 · 2452 MHz” | A genuine coincidence of the two sequences: slot 150, channel 50. Real piconets are not slot-aligned; the map draws both on one grid (simplification). |
| “Bluetooth's own rulebook calls that a strong likelihood” · the quote card | Verbatim from Vol 2 Part B §2 (shown with an opening ellipsis). The “EXPECTED” stamp is the video's paraphrase, drawn as an annotation. |
| “They garble each other” | The simple case shown; a much stronger signal can survive (co-channel C/I 11 dB, Vol 2 Part A §4.1.2). Noted in sources.md. |
| “Your earbuds don't confirm” · “NO CONFIRMATION” | A corrupted packet gets a NAK or no reply (no trigger); either way it is not acknowledged (§7.6). |
| “your phone sends it again on the next hop, milliseconds later” · “SLOT 152 · CH 18” · “+1.25 ms” | “the same payload is retransmitted at the next TX occasion” (§7.6); the Central's next transmit slot is two slots = 1.25 ms later; the kernel gives channel 18 for slot 152. Longer packets push it to 3.75 ms (“milliseconds”). |
| “a fraction of a second of music waits in reserve” · “A FRACTION OF A SECOND IN RESERVE” | Headphones buffer audio “to allow time for retransmissions of any missed or dropped data packets”; typical A2DP latency ≈ 150 ms (Bose, US 10,705,793). No number on screen: it depends on the product. |
| “Wi-Fi doesn't hop. A network camps on about twenty of those channels” · “WI-FI · CHANNEL 6” · block over channels 25–44 | A 2.4 GHz Wi-Fi network stays on its 20 MHz channel; channel 6 = 2427–2447 MHz = Bluetooth channels 25–44. |
| “your phone keeps score. Channels that keep failing are dropped from the timetable” · tallies · “CLOSED” · the re-routed line | AFH classification by throughput failure (§8.6.8); the re-routed line is the kernel's adapted sequence with channels 25–44 unused (§2.6.3), which never lands in the block (`tools/map_facts.js`: 0 of 20,000 slots). The tally heights are illustrative. Note the adapted sequence's same-channel mechanism: the reply slot reuses the phone's channel, visible as pairs of stations. |
| “though it always keeps at least twenty” · “CHANNELS IN USE 59” · “NEVER FEWER THAN 20” | N_min = 20 (§2.3.1); 79 − 20 = 59, and the adapted sequence uses exactly 59 channels. |
| “Newer Bluetooth can share one stream with any number of earbuds” · “LE AUDIO BROADCAST · ONE STREAM, ANY NUMBER” | LE Audio broadcast: “an unlimited number of audio sink devices” (Bluetooth SIG; Auracast: “An unlimited number of in-range Auracast™ receivers”). Needs a phone and earbuds that support it. |

## Defects found during QA and fixed

| Found | Cause | Fix |
|---|---|---|
| “You'd think pairing…” transcribed as “You think pairing…” (check-voice) | the contraction's “'d” almost vanishes at this speed, turning a supposition into a claim | reworded: “You might think…” |
| Four caption phrases on screen for under 0.4 s, one of six words | first draft of the chunking | merged or split by hand |
| Grey earbuds on grey heads: nobody seemed to wear earbuds | pictogram colours | white earbuds with outlines; coloured only for your link and your neighbour's |
| The “?” badge appeared 0.1 s before the scene changed | tied to the end of the last word | tied to the bounce, 0.36 s after the word starts |
| The zoomed carriage ran under the progress bar | the custom strip-map HUD had no backing | the HUD got its own display panel |
| “YOUR EARBUDS” touched the “PRIVATE LINE?” sign | layout | pictograms moved down, sign up |
| The band scene opened on an almost empty frame | its content was all cued to words | the band slice and its label are there from the first frame |
| “MICROWAVE OVEN” collided with the 2.4 GHz headline | label above the oven | label beside it; headline raised |
| Ruler ticks crossed the map's axis labels during the hand-off to the hop map | both drawn at once | the ruler fades as the labels arrive |
| `packetCapsule` threw “px0 is not defined” | variable declared inside a closure | hoisted |
| “NAME TAG” crowded “ACCESS CODE” above the badge | both above the badge | name tag moved under it |
| The earbud gate looked small in the frame | scale | drawn 1.25× larger |
| “+1.25 ms” covered the slot labels on the resend strip | layout | labels beside their stations, the pill on the route |
| Failure crosses drew above the map for slots already past | not faded with the line | faded with the line |
| Lint: speed tag under the like/share buttons; code badges 19 px; clock label past the margin; camera punch pushed a label past the margin; stamp under the buttons; hard-coded hex colours | layout and colour choices | tag moved to the map's top right (and added to every slowed map); badges ≥ 24 px; shorter label; smaller punch, centred; stamp moved; colours by role. The split-flap digits overlap while they flip, by design: recorded in video.json |
| Accuracy re-read of every label | wording chosen for punch or precision the sources don't give | oven hump centred on 2,450 MHz; “ANYONE MAY TRANSMIT” → “NOBODY OWNS IT”; “NOTHING CAME BACK” → “NO CONFIRMATION” (a NAK can come back); “≈ 0.15 s” → “A FRACTION OF A SECOND”; example address labelled; “HOPS PER SECOND · MAXIMUM”; no bit count on the access-code label |
| Build 1: voice-to-bed ratio 21.1 dB (music nearly inaudible under the voice) | default bus levels with the `pulse` kit | `"mix"` in video.json (music 0 dB, effects +1 dB, ducking −7 / −3 dB): 16.4 dB |
| Build 1: “voice intelligible in the mix” FAILED at 4.81 % | 14 of the 15 “errors” were the checker's: “café” cut to “caf”, British spellings, “sixteen hundred” vs “1600”, “2.4GHz” | the engine's checker now folds accents, British spellings, year-style hundreds and units glued to numbers (clean narration: 0.00 %) |
| Build 1: “clock” heard as “clerk” in the mix | a blip and the board's flap ticks landed on the word | no cue within the words “timetable”, “address”, “clock”; their blips moved to just after each word |
| Build 1: 16 static holds | elements landed and then stood still | slow camera push-ins (band, board, packet, repair), signal rings and packets on the cable (myth), Wi-Fi traffic flicker and the crowd's hops in the band, a moving music meter in every packet, a packet looping the repaired route |
| Build 2: “hop” heard as “half”, and “A” as “and”, in the mix | a lock cue on “hop” (clash); a stamp just before “A” (café) | both moved into the pause after the word |
| Build 2: two remaining holds (25.1 s, 59.6 s) | the crowd's hops faded before the ticks began; the gate stood still after the refusal | hops kept until the ticks start; the gate floats |
| Mobile preview: the address heading spilled over its plate | plate sized to the address only | plate sized to the wider of the two lines |
| Café: customers' earbuds invisible, a chair outside the room, your seat hard to find | grey buds on grey heads; seat positions unchecked | white earbuds; seats kept inside the room; your seat ringed in blue |

## Creative self-assessment

**What works.** The video answers the question the user actually asked — why forty sets of earbuds in
one carriage don't turn into noise — instead of the usual Bluetooth trivia, and it answers it honestly:
clashes are not prevented, they are made rare (hopping), recognisable (the code) and cheap (the resend and
the buffer), and avoidable where they persist (adaptive hopping). The transit-map world gives every
mechanism one familiar object (a line map, a departure board, a line badge, a closed section of track) and
looks like no other video in this repo or in the default treatment (no blue glow, no radio-wave arcs, no
logo). The strongest moments are the burst to real speed (the map becomes a mesh at 1,600 hops per
second), the two identical timetables, and the clash — which is a genuine coincidence of two real hop
sequences, followed by the specification's own sentence predicting it. The hook's question is closed twice:
your neighbour's packets carry a different code, and — the twist — newer Bluetooth can share their song on
purpose.

**What is weakest.** The café is the plainest picture: a generic plan with small figures; its job (Wi-Fi as
a block that never moves) is done better by the map that follows it. The quote card asks the viewer to read
a 27-word sentence while the narration only says three of its words; the highlight and the stamp carry it,
but it is still reading. The hop beat changes layout four times in seventeen seconds (map, burst, board with
inputs, two boards, map again); it is clear on a second watch, dense on the first. The British voice
(`bf_emma`) is a lower-graded voice in the model than the American ones used before; it transcribes cleanly
but may sound flatter.

**A second pass would** draw the café as a cut-away with a counter and a queue (or drop the café picture
and go straight to its map), replace the quote card's full sentence with the three words and a smaller
citation, and give the board one layout that grows (inputs → one board → two boards) instead of swapping.

## What was verified by measurement only

- The hop sequences drawn are the kernel's output, and the kernel matches the specification's sample data
  (`tools/verify_hops.js`); the map facts are reproduced by `tools/map_facts.js`.
- The narration was transcribed back with Whisper small.en (clean narration: 0.00 % word error after the
  checker learned accents, British spellings and “sixteen hundred”); the final mix is checked the same way
  by `validate`.

## What was not verified

- The mix was verified by measurement and speech recognition, not by listening; I cannot hear it.
- Playback inside Instagram and YouTube was not tested; the mobile previews approximate their overlays.
- Whether any particular pair of earbuds uses Classic audio (A2DP) or LE Audio: the video's numbers are
  Classic's, and LE's are named on screen.
- Real collision rates in a real carriage: deliberately not claimed.
- The one remaining difference in the final mix's transcript is the one-letter article in “Wi-Fi doesn't hop.
  A network camps…”, heard as “…hop, and network…”; the clean narration transcribes it correctly, the
  meaning is unchanged, and the caption shows the right word.
- Engine change: `engine/tts/asr_check.py` now folds accents, British spellings, year-style hundreds
  (“sixteen hundred”) and units glued to numbers before comparing. Checked with `scripts/selftest.sh`
  (passed, 0.0 % on the template) and `lockstep scan how-a-gpu-works` (0 errors, no dark frames); the
  change touches only the speech-recognition comparison, not rendering.
