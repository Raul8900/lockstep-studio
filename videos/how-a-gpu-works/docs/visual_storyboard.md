# Visual Storyboard — “How Does a Modern GPU Actually Work Internally?”

34 sequences · 162.05 s · 1080 × 1920 · 30 fps. The look, story shape and pacing were decided in docs/creative_brief.md. Timestamps are taken from the recorded narration; the animation code reads the same word timings, so picture and voice cannot drift apart.

## Conventions that apply to every sequence

**Canvas and safe areas.** Designed natively for 9:16; nothing is cropped from a wider layout.

| Zone | y range | Use |
|---|---|---|
| Top UI band | 0–270 | Backdrop only |
| Chapter bar | 286–340 | 10-segment progress bar (y 292) and chapter label (y 334) |
| Diagram zone | 372–1210 | All essential graphics, x 70–1010 |
| Caption band | 1250–1450 | Burned-in captions, centred on x 540, y 1350, max width 800 px |
| Bottom UI band | 1470–1920 | Backdrop, perspective floor, non-essential spill only |

Below y 900, numbers and names stay left of x ≈ 910, where both platforms stack their action buttons; only repeated or decorative elements extend further right.

**Look.** `neon-blueprint` (dark theme) — The engine's built-in look: charcoal, glowing line art, bloom. Technical subjects seen from inside the machine.

**Backdrop.** charcoal gradient, slow colour fog, a dot lattice drifting upward, a perspective floor grid and faint vertical traces with travelling pulses; background gradient #05080D → #090E17 → #04060A.

**Colour language.** Cyan #27E1FF = GPU and computation · Amber #FFA91E = CPU, control and all numbers · Violet #A073FF = memory and data · Coral #FF5F70 = limits and negation · Mint #4DFFB5 = success · White = the thing being talked about now.

**Type.** Inter Display for headlines, Inter for glosses and body, JetBrains Mono for labels and counters. Smallest label 19–22 px; primary labels ≥ 24 px.

**Captions.** Inter Display 800, 74 px, centred on y 1350, 1–5 words per phrase (141 phrases, 5 of them two-line); the spoken word takes its role colour, scales up slightly and lifts. Words not yet spoken are dimmed. Position never changes.

**Scene changes.** 0.84 s, default `fade`; each scene can choose its own arrival (zoom into a point, pull back, pan, slide, cut, flash). The incoming scene is already drawn and moving before the outgoing one has gone.

---

## 01 · Hero die: the number

**Time:** 0:00.00 → 0:03.05  (3.05 s)  
**Narration:** “This chip has over twenty thousand cores.”  
**Caption phrases:** This chip has | over twenty thousand | cores.

| | |
|---|---|
| **Objects on screen** | GPU package and die in 2.5D (10 × 17 = 170 compute tiles, cache bands, gold pads, capacitors); ~80 light pillars rising from tiles; headline counter. |
| **Position and size (1080 × 1920)** | Die centred at (540, 915); package spans x 95–1000, y 690–1190 (≈ 905 × 500 px on screen, 57° tilt, −40° yaw). Counter baseline y 530, 176 px digits; “CORES” y 610, 60 px; source line y 664, 25 px. |
| **Background** | Standard backdrop: charcoal gradient, slow cyan/violet fog, drifting dot lattice, perspective floor below y 1500. |
| **Movement** | Counter races 10,300 → 21,760 and lands on the word “cores” with a 10 px pop. Each tile flickers on its own random clock; each pillar breathes at its own rate (2.2–7.2 rad/s) — it reads as thousands of independent workers. |
| **Timing and easing** | Counter: ease-out-quart over 0.0–2.1 s. Pop: 60 ms attack, 0.6 s decay. |
| **Camera** | Continuous slow push-in (scale 1.06 → 1.20 over the whole hook) with a 17° orbit (yaw −0.74 → −0.44 rad) and a slight tilt change — the parallax between pillars and die sells the depth. |
| **Colour and emphasis** | Tiles and pillars cyan; one pillar in five violet; counter amber; label white. |
| **Text overlays** | “21,760” · “CORES” · “IN ONE CHIP · GEFORCE RTX 5090”. |
| **Transition out** | None (same shot continues). |
| **Sound** | Low power-up hum at 0.0; rising counter ticks 0.3–2.0 s; sub impact on “cores”. |
| **Purpose** | Open on the strongest image and a concrete, checkable number. First frame is already fully lit — no fade from black. |

## 02 · Hero die: lockstep

**Time:** 0:03.05 → 0:05.74  (2.68 s)  
**Narration:** “And not one of them can think for itself.”  
**Caption phrases:** And not one of them | can think | for itself.

| | |
|---|---|
| **Objects on screen** | Same die. Tiles and pillars now driven by one shared clock. Coral quotation marks around CORES; coral sub-line. |
| **Position and size (1080 × 1920)** | Quotation marks at x 372 and 708, y 618, 84 px. Sub-line replaces the source line at y 664. |
| **Background** | Unchanged. |
| **Movement** | Over 0.35 s every tile and pillar abandons its private rhythm and joins a single pulse (period 0.46 s) that sweeps the die top row to bottom row in 0.2 s. The quotation marks snap in on “one”; “NOT ONE THINKS FOR ITSELF” rises in on “think”. |
| **Timing and easing** | Blend to lockstep: ease-in-out-cubic 0.35 s. Quotes: ease-out-back 0.35 s. Sub-line: ease-out-cubic, 14 px rise. |
| **Camera** | Push-in and orbit continue uninterrupted. |
| **Colour and emphasis** | Coral marks the doubt; everything else unchanged so the change in *behaviour* is what the eye notices. |
| **Text overlays** | ““CORES”” · “NOT ONE THINKS FOR ITSELF”. |
| **Transition out** | None. |
| **Sound** | Soft metallic lock click 0.25 s before the change; five sub thumps on the lockstep pulse. |
| **Purpose** | The whole thesis in one visual: apparent independence collapses into lockstep. Sets up the question the video answers. |

## 03 · Hero die: the burst

**Time:** 0:05.74 → 0:08.29  (2.55 s)  
**Narration:** “That's exactly why it's so fast.”  
**Caption phrases:** That's exactly why | it's so fast.

| | |
|---|---|
| **Objects on screen** | Die at full power; white shock ring on the die plane; 44 vertical light streaks across the full frame height; headline swap. |
| **Position and size (1080 × 1920)** | Streaks span x 0–1080, y −200–2120. New headline centred at (540, 560), 88 px; sub-line 62 px below, 30 px mono. |
| **Background** | Unchanged; streaks pass in front. |
| **Movement** | Shock ring expands from the die centre (60 → 390 px half-width) and fades. Streaks rush top to bottom at 2,200–4,200 px/s. The counter block fades out; “THAT’S THE TRICK” scales in. Camera punches 5 %. |
| **Timing and easing** | Ring: ease-out-cubic 0.9 s. Headline: ease-out-back 0.35 s from 70 %. Punch: 0.1 s in, 0.9 s out. |
| **Camera** | Push-in continues with a 5 % punch-in on the cut point. |
| **Colour and emphasis** | White ring and streaks, cyan sub-line. |
| **Text overlays** | “THAT’S THE TRICK” · “LOCKSTEP → SPEED”. |
| **Transition out** | Zoom-out: the hook shrinks toward (540, 900) and fades over 0.84 s while the CPU scene settles from 135 %. |
| **Sound** | 0.45 s riser into the burst; wide whoosh; sub impact on “fast”. |
| **Purpose** | Pay the hook with a promise (“that’s the trick”) rather than an answer, so the viewer stays for the explanation. |

## 04 · CPU: built for decisions

**Time:** 0:08.29 → 0:11.37  (3.09 s)  
**Narration:** “A CPU is built for decisions.”  
**Caption phrases:** A CPU is built | for decisions.

| | |
|---|---|
| **Objects on screen** | Title “CPU”; a four-level decision tree (7 diamond branch nodes, 8 leaf boxes); two travelling packets. |
| **Position and size (1080 × 1920)** | Title at x 70, baseline 470, 132 px. Tree: root (540, 612); levels at y 772, 932, 1092; leaves 84 × 52 px. Right-aligned status “built for / decisions” at x 1010, y 420/472. |
| **Background** | Standard backdrop. |
| **Movement** | Tree draws itself top-down. Packet 1 enters the root on “CPU”, turns right-left-right; packet 2 follows 0.87 s later going left-right-right. Each diamond flashes as the packet commits; the taken edge stays lit amber; the reached leaf turns mint with a tick. |
| **Timing and easing** | Tree growth 0.8 s linear cascade by level. Packet hop 0.4 s per level, ease-in-out-quad. |
| **Camera** | Static (the previous scene’s zoom-out resolves into it). |
| **Colour and emphasis** | Amber = CPU and decisions throughout the video; mint = success. |
| **Text overlays** | “CPU” · “built for decisions” · “?” in each branch node. |
| **Transition out** | Tree fades as the die pops in (0.4 s cross-over). |
| **Sound** | Three ascending ticks per packet (one per decision), soft blip at each leaf. |
| **Purpose** | Give “decisions” a picture: branching, one path at a time, each choice depending on the last. |

## 05 · CPU: where the silicon goes

**Time:** 0:11.37 → 0:17.47  (6.09 s)  
**Narration:** “A few brilliant cores, each spending most of its silicon on prediction, caching, and control— to finish”  
**Caption phrases:** A few brilliant cores, | each spending | most of its silicon | on prediction, | caching, | and control— | to finish one task

| | |
|---|---|
| **Objects on screen** | CPU die with 8 core blocks; then one core’s floor plan: BRANCH PREDICTION, CACHE, OUT-OF-ORDER CONTROL (amber) and a small ARITHMETIC block (cyan). |
| **Position and size (1080 × 1920)** | Die 620 × 620 at x 230–850, y 524–1144; cores 270 × 124 in a 2 × 4 grid. Floor plan fills x 70–1010, y 548–1148: prediction 528 × 243 top-left, cache 397 × 389 right, control 528 × 343 bottom-left, arithmetic 397 × 197 bottom-right (≈ 14 % of the area). |
| **Background** | Standard backdrop; amber glow behind the die. |
| **Movement** | Eight cores pop in 85 ms apart. On “each” the camera dives into core 3 while its rectangle morphs into the floor plan. Regions start as dim outlines and light on their own words — “prediction”, “caching”, “control” — each with its own living detail: flickering branch-history bits, shimmering cache cells, three reorder queues sliding at different speeds. |
| **Timing and easing** | Core pops: ease-out-back 0.3 s. Dive: ease-in-out-cubic 0.95 s. Region light-up: ease-out-cubic 0.35 s. |
| **Camera** | 3.3× dive centred on core 3, travelling to frame centre. |
| **Colour and emphasis** | Three amber regions against one cyan block — the colour ratio is the argument. |
| **Text overlays** | “a few brilliant cores”; region names with one-line plain-English glosses (“guesses what comes next”, “keeps data close”, “reorders work on the fly”, “the actual math”). |
| **Transition out** | None (same shot). |
| **Sound** | Eight rising pops; whoosh on the dive; three blips rising a tone each on prediction / caching / control. |
| **Purpose** | Show, by area, that most of a CPU core is machinery for deciding, not for calculating. No percentages are claimed. |

## 06 · CPU: one task, fast

**Time:** 0:17.47 → 0:20.49  (3.03 s)  
**Narration:** “one task as fast as possible.”  
**Caption phrases:** as fast as possible.

| | |
|---|---|
| **Objects on screen** | Floor plan; a white comet (the task); silicon-budget bar; goal pill. |
| **Position and size (1080 × 1920)** | Comet route enters at (30, 762), crosses prediction and control, exits right through arithmetic at (1070, 1068). Budget bar x 470–1010, y 452, 22 px tall: 86 % amber, 14 % cyan. Pill centred (540, 1186). |
| **Background** | Unchanged. |
| **Movement** | Budget bar grows left to right. On “one task” the comet whips through the core in 0.55 s with a short trail that does not linger over the labels; a white ring expands from the arithmetic block as it finishes. |
| **Timing and easing** | Bar: ease-out-cubic 0.65 s. Comet: ease-in-out-quad 0.55 s, trail = last 20 % of the path. |
| **Camera** | Static. |
| **Colour and emphasis** | White comet over amber regions. |
| **Text overlays** | “decision machinery” / “math” over the bar · “GOAL · FINISH ONE TASK FAST”. |
| **Transition out** | Title flips to GPU (next sequence). |
| **Sound** | Fast upward zip on the comet; small chime when it lands. |
| **Purpose** | State the CPU’s goal — low latency for one task — in a single gesture. |

## 07 · GPU: the opposite bet

**Time:** 0:20.49 → 0:23.30  (2.80 s)  
**Narration:** “A GPU makes the opposite bet. It”  
**Caption phrases:** A GPU makes | the opposite bet. | It strips most of

| | |
|---|---|
| **Objects on screen** | Title flips CPU → GPU; floor plan remains; status line. |
| **Position and size (1080 × 1920)** | Title x 70, y 470. Status “makes the / opposite bet” right-aligned at x 1010. |
| **Background** | Unchanged. |
| **Movement** | The title rotates about its horizontal axis (scale-y 1 → 0 → 1) and comes back cyan reading “GPU”. Goal pill and budget bar fade. |
| **Timing and easing** | Flip 0.4 s, cosine. Fades 0.25 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Amber → cyan on the title: the colour language switches sides. |
| **Text overlays** | “GPU” · “makes the opposite bet”. |
| **Transition out** | None. |
| **Sound** | Flip whoosh with a click at the midpoint. |
| **Purpose** | A deliberate half-beat of stillness: same diagram, new owner, before it gets taken apart. |

## 08 · GPU: strip it out

**Time:** 0:23.30 → 0:27.95  (4.65 s)  
**Narration:** “strips most of that cleverness out, and spends the silicon on raw arithmetic—”  
**Caption phrases:** that cleverness out, | and spends the silicon | on raw arithmetic—

| | |
|---|---|
| **Objects on screen** | The three amber regions tear away; the arithmetic block survives and moves to centre. |
| **Position and size (1080 × 1920)** | Regions exit along (−0.85, −0.55), (0.95, −0.3), (−0.8, 0.65) for ~900 px. Arithmetic block ends as a 264 px square centred (540, 848). |
| **Background** | Unchanged. |
| **Movement** | Prediction rips off on “strips”, cache 0.36 s later, control on “cleverness”, each rotating up to 20° as it accelerates away. The lone arithmetic block glides to the centre and grows; “RAW ARITHMETIC” appears above it. |
| **Timing and easing** | Rips: ease-in-quad 0.7 s. Glide: ease-in-out-cubic ≈ 1.2 s. |
| **Camera** | Static; the block’s move to centre does the reframing. |
| **Colour and emphasis** | Amber leaves the frame; only cyan remains. |
| **Text overlays** | “RAW ARITHMETIC” · “and almost nothing else” · “+ × −”. |
| **Transition out** | None. |
| **Sound** | Three tearing sounds; low thump when the block settles. |
| **Purpose** | Removal is the explanation: a GPU is what is left when per-core cleverness is taken out. |

## 09 · GPU: copied thousands of times

**Time:** 0:27.95 → 0:30.07  (2.12 s)  
**Narration:** “copied thousands of times.”  
**Caption phrases:** copied | thousands of times.

| | |
|---|---|
| **Objects on screen** | The block subdivides 1 → 4 → 16 → 64 → 256 → 1,024 → 4,096 cells; copy counter; goal pill. |
| **Position and size (1080 × 1920)** | Grid grows from 264 px to 600 px square centred (540, 848). Counter right-aligned x 1010, y 468, 84 px. Pill (540, 1186). |
| **Background** | Cyan glow behind the grid. |
| **Movement** | Six doublings 0.235 s apart; new dividing lines open from zero width at each step. Cells flicker independently. After the last step the counter jumps to ×21,760 and the whole field flashes. |
| **Timing and easing** | Each split: ease-out-cubic 0.2 s. Grid growth: ease-in-out-quad across the run. |
| **Camera** | The growing grid acts as a pull-back. |
| **Colour and emphasis** | Cyan field; counter turns amber on the final figure (call-back to the hook). |
| **Text overlays** | “×4 … ×4,096” → “×21,760 ARITHMETIC LANES” · “GOAL · MAXIMUM THROUGHPUT”. |
| **Transition out** | Zoom-out toward (540, 900): the field shrinks into the GPU chip of the next scene. |
| **Sound** | Six pops rising in pitch under a 1.5 s riser; impact on the final number. |
| **Purpose** | Complete the contrast and reconnect to the hook’s number: those “cores” are copies of the arithmetic block. |

## 10 · Hand-off: who runs the program

**Time:** 0:30.07 → 0:34.15  (4.08 s)  
**Narration:** “It doesn't even run your program. The CPU does.”  
**Caption phrases:** It doesn't even run | your program. | The CPU does.

| | |
|---|---|
| **Objects on screen** | Code window “your_program” (6 lines); CPU chip; bus rail; GPU chip; two VRAM stacks. |
| **Position and size (1080 × 1920)** | Window x 70–618, y 404–704. CPU 236 px at (822, 548). Rail at y 786 from x 176 to 904 with drops to VRAM (x 176, 904) and GPU (x 540). GPU 300 px at (540, 1012). VRAM stacks 160 px wide at x 96 and 824, y 880–1128. |
| **Background** | Standard backdrop. |
| **Movement** | A highlight bar steps through the first three code lines. The GPU is dark with a coral cross and the note “NOT RUNNING YOUR PROGRAM”. On “The CPU does” the CPU pulses and a ring expands from it. |
| **Timing and easing** | Line stepping 3.2 lines/s. Cross draws in 0.35 s. Ring: 80 ms attack, 1.4 s decay. |
| **Camera** | Static, laid out top (CPU) to bottom (GPU). |
| **Colour and emphasis** | Amber CPU, dim cyan GPU, coral negation. |
| **Text overlays** | “your_program” code · “RUNS YOUR PROGRAM” · “NOT RUNNING YOUR PROGRAM” · “PCIe LINK”. |
| **Transition out** | None. |
| **Sound** | Low dissonant buzz on “doesn’t”; thump on “CPU”. |
| **Purpose** | Correct the common belief that the GPU runs the application. |

## 11 · Hand-off: copy the data

**Time:** 0:34.15 → 0:36.73  (2.58 s)  
**Narration:** “It copies your data into the GPU's memory,”  
**Caption phrases:** It copies your data | into the GPU's memory,

| | |
|---|---|
| **Objects on screen** | 26 violet data packets; VRAM fill meters; code highlight on line 4. |
| **Position and size (1080 × 1920)** | Packets travel CPU → rail → left/right drops (≈ 900 px of path) into the VRAM stacks. |
| **Background** | Unchanged. |
| **Movement** | Highlight jumps to `gpu.upload(data)`. Packets leave the CPU 0.1 s apart, alternate left and right, and the four memory chips of each stack fill bottom to top. |
| **Timing and easing** | Each packet 0.75 s, ease-in-out-quad. Fill tracks arrivals. |
| **Camera** | Static; the eye follows the flow downward. |
| **Colour and emphasis** | Violet = data and memory, everywhere in the video. |
| **Text overlays** | “COPY DATA” · “VRAM” · “the GPU’s own memory”. |
| **Transition out** | None. |
| **Sound** | Granular data-stream blips for the length of the copy; blip when the stacks are full. |
| **Purpose** | Data has to move into the GPU’s own memory before any work can start. |

## 12 · Hand-off: one function, one order

**Time:** 0:36.73 → 0:42.63  (5.90 s)  
**Narration:** “then sends one small function, with a single order: run this, a million times.”  
**Caption phrases:** then sends | one small function, | with a single order: | run this, | a million times.

| | |
|---|---|
| **Objects on screen** | White function card “f(x) · one small function”; order panel “RUN × n”; 150 burst particles. |
| **Position and size (1080 × 1920)** | Card 318 × 104 travels CPU → rail → GPU. Order panel 660 × 100 centred (540, 796). Particles spread up to 640 px from the GPU. |
| **Background** | Unchanged. |
| **Movement** | Highlight moves to `gpu.run(shade, 1e6)`. The card pops out of the CPU, slides along the bus and is absorbed by the GPU. The order panel appears; its counter runs logarithmically 1 → 1,000,000 while the GPU lights fully and copies of the function burst outward. |
| **Timing and easing** | Card: ease-in-out-quad ≈ 2.9 s. Counter: 10^(6·ease-out-quad). Burst: ease-out-cubic, staggered. |
| **Camera** | Static. |
| **Colour and emphasis** | White card (the instruction) against cyan GPU. |
| **Text overlays** | “f(x) one small function” · “RUN × 1,000,000”. |
| **Transition out** | Zoom-in ×3.6 into the GPU chip at (540, 1012); the die of the next scene grows out of it. |
| **Sound** | Pop and slide for the card; lock click on arrival; rising count ticks; impact on “times”. |
| **Purpose** | The unit of GPU work: one small function launched an enormous number of times. |

## 13 · Inside the chip: one block, stamped out

**Time:** 0:42.63 → 0:47.20  (4.57 s)  
**Narration:** “Zoom into the chip, and you find one block, stamped out again and again.”  
**Caption phrases:** Zoom into the chip, | and you find | one block, | stamped out | again and again.

| | |
|---|---|
| **Objects on screen** | Die outline; 10 × 17 grid of identical compute tiles; scan line; hero tile; count pill. |
| **Position and size (1080 × 1920)** | Grid x 70–1010, y 384–1200; tiles 86 × 40 px. Hero tile column 5, row 7 at (492, 695). Pill 580 × 86 at (540, 1161). |
| **Background** | Standard backdrop, cyan glow behind the die. |
| **Movement** | Arrive still diving (150 % → 100 %). A white scan line sweeps the unlit die. On “one block” a single tile lights. On “stamped” the rest press in as an expanding square ring around it, each overshooting to 130 % and settling. |
| **Timing and easing** | Dive: ease-out-cubic. Scan: linear ≈ 2.1 s. Stamp: ease-out-back 0.3 s per tile, rings 118 ms apart. |
| **Camera** | Decelerating dive, then static. |
| **Colour and emphasis** | Cyan tiles; white for the freshly stamped ring. |
| **Text overlays** | “ONE BLOCK × 1 … × 170”. |
| **Transition out** | None. |
| **Sound** | Whoosh on arrival; blip on “one block”; eleven stamps, one per ring. |
| **Purpose** | The chip is not one big processor: it is the same block repeated. |

## 14 · Inside the chip: three names

**Time:** 0:47.20 → 0:52.80  (5.61 s)  
**Narration:** “NVIDIA calls it a streaming multiprocessor. AMD, a compute unit. A”  
**Caption phrases:** NVIDIA calls it | a streaming | multiprocessor. | AMD, | a compute unit. | A flagship card has

| | |
|---|---|
| **Objects on screen** | Magnified copy of the hero tile with four lane groups; naming card with three rows. |
| **Position and size (1080 × 1920)** | Magnified tile 580 × 262 at x 250–830, y 470–732, joined to the real tile by four guide lines. Card x 70–1010, y 806–1178; rows 78 px tall. |
| **Background** | Grid dims to 38 %. |
| **Movement** | The tile lifts out and enlarges; its lanes pulse in step. Rows slide in from the right: NVIDIA on “NVIDIA”, AMD on “AMD”, Intel half a second later, each glowing while it is spoken. |
| **Timing and easing** | Lift: ease-in-out-cubic 0.6 s. Rows: ease-out-cubic 0.35 s, 40 px travel. |
| **Camera** | No camera move — the magnifier replaces a zoom so nothing spills into the top UI area. |
| **Colour and emphasis** | Vendor rows in mint, coral and cyan; names in white. |
| **Text overlays** | “ONE COMPUTE BLOCK · 1 of 170” · “SAME BLOCK · THREE NAMES” · “NVIDIA Streaming Multiprocessor SM” · “AMD Compute Unit CU” · “INTEL Xe-core”. |
| **Transition out** | Card and magnifier retract. |
| **Sound** | Slide; three blips, one per vendor. |
| **Purpose** | Separate the general idea (a repeated compute block) from vendor vocabulary. |

## 15 · Inside the chip: 170

**Time:** 0:52.80 → 0:55.74  (2.94 s)  
**Narration:** “flagship card has a hundred and seventy.”  
**Caption phrases:** a hundred | and seventy.

| | |
|---|---|
| **Objects on screen** | Full grid; serpentine counting sweep; number plate. |
| **Position and size (1080 × 1920)** | Plate 648 × 372 at x 216–864, y 598–970; digits 250 px. |
| **Background** | Grid at 45–75 % behind the plate. |
| **Movement** | Tiles light in reading order as the number counts 0 → 170, landing on “seventy”. |
| **Timing and easing** | Count: ease-in-out-quad ≈ 1.6 s; 14 px pop on landing. |
| **Camera** | Static. |
| **Colour and emphasis** | Amber number (numbers are always amber). |
| **Text overlays** | “170” · “COMPUTE UNITS” · “on one GeForce RTX 5090”. |
| **Transition out** | Cross-fade to the thread field. |
| **Sound** | Count ticks; impact on 170. |
| **Purpose** | Give the scale, attributed to a named product. |

## 16 · Threads

**Time:** 0:55.74 → 0:58.71  (2.97 s)  
**Narration:** “Each copy of that function is a thread.”  
**Caption phrases:** Each copy | of that function | is a thread.

| | |
|---|---|
| **Objects on screen** | 768 thread dots (32 × 24); headline. |
| **Position and size (1080 × 1920)** | Field x 100–980, y 556–1177, 27–28 px pitch, 5 px dots. Headline x 70, y 470. |
| **Background** | Standard backdrop. |
| **Movement** | Dots sparkle in at random. “× 1,000,000” becomes “= 1 thread each” on the word “thread”. |
| **Timing and easing** | Appear over 0.85 s, staggered by hash. Label swap 0.3 s cross-fade. |
| **Camera** | Static. |
| **Colour and emphasis** | Cyan dots. |
| **Text overlays** | “f(x) × 1,000,000” → “f(x) = 1 thread each” · “one copy of the function + its own data”. |
| **Transition out** | None. |
| **Sound** | Whoosh; blip on “thread”. |
| **Purpose** | Name the unit: a thread is one copy of the function plus its own data. |

## 17 · Blocks land on units

**Time:** 0:58.71 → 1:02.34  (3.62 s)  
**Narration:** “Threads are packed into blocks; each block lands on one unit,”  
**Caption phrases:** Threads are packed | into blocks; | each block lands | on one unit,

| | |
|---|---|
| **Objects on screen** | Six blocks of 128 threads; six small unit tiles; one large unit panel. |
| **Position and size (1080 × 1920)** | Blocks 440 × 196 in a 2 × 3 grid from (86, 548). Unit tiles 140 × 84 at y 392. Large unit x 70–1010, y 544–1196. |
| **Background** | Unchanged. |
| **Movement** | Gaps open in the field so six blocks form and get outlines. Five blocks shrink into their own unit tile; block 2 flies into the large unit and its dots enlarge. |
| **Timing and easing** | Pack: ease-in-out-cubic 0.9 s. Land: ease-in-out-cubic 1.0 s, blocks staggered 30 ms. |
| **Camera** | Static; the large unit is the zoom. |
| **Colour and emphasis** | White outline for the block we follow. |
| **Text overlays** | “THREADS → BLOCKS” · “BLOCK 0…5” · “UNIT 1…6” · “ONE COMPUTE UNIT · block 2 · 128 threads”. |
| **Transition out** | None. |
| **Sound** | Slide and lock for packing; whoosh and thump for landing. |
| **Purpose** | Work is distributed block by block; a block lives on exactly one unit. |

## 18 · Sliced into warps

**Time:** 1:02.34 → 1:06.02  (3.68 s)  
**Narration:** “which slices it into squads of thirty-two, called warps.”  
**Caption phrases:** which slices it | into squads | of thirty-two, | called warps.

| | |
|---|---|
| **Objects on screen** | 128 dots re-form into four rows of 32; cut lines; row frames. |
| **Position and size (1080 × 1920)** | Rows at y 686, 806, 926, 1046 spanning x 98–982. |
| **Background** | Unchanged. |
| **Movement** | Three white cuts sweep left to right; dots flow into their rows; each row gets a capsule frame, a “WARP n” tag and a “32”. |
| **Timing and easing** | Cuts 0.22 s linear, 0.25 s apart. Flow: ease-in-out-cubic, rows staggered 10 %. |
| **Camera** | Static. |
| **Colour and emphasis** | Rows in cyan, mint, violet, amber so four warps are told apart. |
| **Text overlays** | “WARP 0…3” · “32” · “WARP” · “NVIDIA: warp · AMD: wavefront”. |
| **Transition out** | Warp 0 expands into 32 lanes; the rest fade. |
| **Sound** | Three slicing sounds; chime on “warps”. |
| **Purpose** | The hardware’s real unit of execution is the warp, not the thread. |

## 19 · One instruction stream

**Time:** 1:06.02 → 1:09.73  (3.71 s)  
**Narration:** “Here's the trick: a warp shares one instruction stream.”  
**Caption phrases:** Here's the trick: | a warp shares | one instruction stream.

| | |
|---|---|
| **Objects on screen** | 32 vertical lanes with thread heads and data cells; instruction queue; fetch + decode box; bus with 32 drops. |
| **Position and size (1080 × 1920)** | Lanes x 86–994 (24.5 px wide), y 812–1096; heads y 786; data cells y 1108–1186. Queue 200 × 250 at x 440–640, y 384–634. Decode box 340 × 72 at y 648–720. Bus y 752. |
| **Background** | Unchanged. |
| **Movement** | The 32 dots of warp 0 slide up to become lane heads; lanes and data cells fade in. The queue shows LOAD, MUL, ADD, STORE stacked toward one decode box. |
| **Timing and easing** | Morph: ease-in-out-cubic 0.8 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Amber instruction path (control) over cyan lanes (compute) over violet data. |
| **Text overlays** | “ONE instruction stream” · “FETCH + DECODE” · “32 threads”. |
| **Transition out** | None. |
| **Sound** | Whoosh; blip on “instruction”. |
| **Purpose** | Lay out the machine before running it: one source of instructions, many lanes. |

## 20 · Fetched once, executed by 32

**Time:** 1:09.73 → 1:16.44  (6.71 s)  
**Narration:** “Each instruction is fetched once… then all thirty-two threads execute it together, each on its own data.”  
**Caption phrases:** Each instruction | is fetched once… | then all thirty-two | threads execute it | together, | each on its own data.

| | |
|---|---|
| **Objects on screen** | Same diagram, running four cycles: LOAD, MUL, ADD, STORE. |
| **Position and size (1080 × 1920)** | As above. Tally right-aligned at x 1010: “fetched ×1” y 448, “executed ×32” y 530. SIMT badge x 70, y 606. |
| **Background** | Unchanged. |
| **Movement** | Each cycle: one chip drops into the decode box, the bus flashes white, and all 32 lanes fire at the same instant. Data cells then update: every lane holds a different number, and the same operation changes each one (x → 2x → 2x + 1). |
| **Timing and easing** | Queue shift: ease-out-cubic 0.28 s. Lane pulse: ease-out-quad 0.5 s, identical start time in all lanes. |
| **Camera** | Static. |
| **Colour and emphasis** | White flash on the shared bus; cyan pulses; violet values. |
| **Text overlays** | “fetched ×1” · “executed ×32” · “SIMT — single instruction, multiple threads” · “32 different values”. |
| **Transition out** | Cross-fade to the rowing shell. |
| **Sound** | Tick for each fetch, deep thump plus bright zap for each execute — four times, on the narration’s stresses. |
| **Purpose** | The central mechanism. Simultaneity is shown literally: identical pulse timing across 32 lanes. |

## 21 · Rowing crew

**Time:** 1:16.44 → 1:19.99  (3.55 s)  
**Narration:** “Like a rowing crew: one call, thirty-two oars.”  
**Caption phrases:** Like a rowing crew: | one call, | thirty-two oars.

| | |
|---|---|
| **Objects on screen** | Top-down racing shell with 32 oars (16 per side), 32 rowers, a cox; call rings; water streaks. |
| **Position and size (1080 × 1920)** | Hull vertical, x 500–580, y 444–1128. Oars 290 px. Cox at (540, 1094). Opaque label plates 300 × 100: “1 CALL = one instruction” at (240, 1120) and “32 OARS = 32 threads” at (840, 452). |
| **Background** | Water streaks drift down past the hull. |
| **Movement** | Three strokes. Before each, an amber call arc travels from the cox up the boat; then every oar sweeps through the same angle at the same time, blades flashing white in the drive. |
| **Timing and easing** | Drive 38 % of the stroke, recovery 62 %, both ease-in-out-quad. |
| **Camera** | Static; the hull’s length uses the vertical frame. |
| **Colour and emphasis** | Amber call (instruction), cyan oars (threads). |
| **Text overlays** | “1 CALL = one instruction” · “32 OARS = 32 threads”. |
| **Transition out** | Zoom-out to the myth-bust. |
| **Sound** | Short vocal-like call then a splash, three times. |
| **Purpose** | A physical picture of SIMT that is accurate in the way that matters: one command, many executors, perfect unison. |

## 22 · Myth bust

**Time:** 1:19.99 → 1:27.19  (7.21 s)  
**Narration:** “So those twenty thousand cores aren't tiny CPUs. They're lanes of arithmetic, marching in lockstep.”  
**Caption phrases:** So those twenty thousand cores | aren't tiny CPUs. | They're lanes | of arithmetic, | marching in lockstep.

| | |
|---|---|
| **Objects on screen** | Headline number; 40 “tiny CPU” icons, each with an amber brain block and a cyan arithmetic bar; coral strike and cross; four rows of 32 lanes. |
| **Position and size (1080 × 1920)** | Number centred y 486, 150 px. Second line y 566, 62 px. Icons 100 px in an 8 × 5 grid from (80, 650). Lane rows at y 672, 806, 940, 1074, 108 px tall. |
| **Background** | Standard backdrop. |
| **Movement** | The icons blink independently. On “aren’t” a coral line strikes “tiny CPUs”, a cross draws over the grid, and every brain block tumbles away. The arithmetic bars give way to four rows of lanes that fire row after row. |
| **Timing and easing** | Strike 0.3 s ease-out-cubic. Brains fall: ease-in-quad 0.85 s with rotation. Lane rows fire 0.21 s apart on a 0.84 s cycle. |
| **Camera** | Static. |
| **Colour and emphasis** | Amber brains leave; cyan lanes stay. |
| **Text overlays** | “21,760 “CORES”” → “tiny CPUs?” → “tiny CPUs NO” → “lanes of arithmetic” · “170 units × 128 lanes, in lockstep”. |
| **Transition out** | The four rows fold into the unit diagram. |
| **Sound** | Buzz and tear on “aren’t”; chime on “lanes”; four thumps on “marching in lockstep”. |
| **Purpose** | Answer the hook explicitly and give the arithmetic behind the number. |

## 23 · Anatomy of one unit

**Time:** 1:27.19 → 1:31.43  (4.24 s)  
**Narration:** “Inside each unit, a scheduler juggles dozens of warps.”  
**Caption phrases:** Inside each unit, | a scheduler juggles | dozens of warps.

| | |
|---|---|
| **Objects on screen** | Four stacked panels: WARP SCHEDULER (8 warp cards), REGISTER FILE (8 blocks of 32 cells), EXECUTION LANES (4 × 32), SHARED MEMORY · L1 CACHE. |
| **Position and size (1080 × 1920)** | Panels x 70–1010: scheduler y 384–564, registers y 582–768, lanes y 786–1012, memory y 1030–1200. Warp cards 96 × 90. |
| **Background** | Unchanged. |
| **Movement** | Panels drop in top to bottom. The scheduler’s selection hops between warps every 0.3 s; each time, the lanes fire in that warp’s colour and its register block lights. |
| **Timing and easing** | Panels: ease-out-cubic 0.45 s, 0.14 s apart. Selection: instant, with a 0.35 s glow decay. |
| **Camera** | Slow 3 % push-in over the remaining 12 s to keep the frame alive. |
| **Colour and emphasis** | Amber scheduler (control), violet registers and memory, cyan lanes. |
| **Text overlays** | Panel titles · “W0…W7” · “READY / RUN” · “dozens of warps live here” · “L2 · VRAM ↓”. |
| **Transition out** | None. |
| **Sound** | Whoosh; four pops; a quiet tick on every scheduler hop. |
| **Purpose** | The repeated block opened up, in the order work flows through it: who chooses, what state is kept, where the maths happens, where data comes from. |

## 24 · Stall, swap, zero cost

**Time:** 1:31.43 → 1:40.05  (8.62 s)  
**Narration:** “Every thread keeps its registers right on the chip— so when one warp stalls on memory, another takes over instantly. Zero cost.”  
**Caption phrases:** Every thread keeps | its registers | right on the chip— | so when one warp | stalls on memory, | another takes over | instantly. | Zero cost.

| | |
|---|---|
| **Objects on screen** | Same diagram; request packet; waiting spinner; stamp. |
| **Position and size (1080 × 1920)** | Request travels down from the lanes at x 363 out of frame; stamp at (820, 418). |
| **Background** | Unchanged. |
| **Movement** | Register file glows and “every thread’s registers stay on-chip” appears. Warp 2 issues a load: an amber packet leaves downward, its card shows a spinner, its registers stay lit. 0.34 s later the scheduler is already running other warps — the lanes never pause. The stamp lands on “Zero”. The data returns and warp 2 goes back to READY. |
| **Timing and easing** | Stamp: ease-out-back 0.35 s, −2.6° tilt. Packet: ease-in-quad down, ease-out-quad back. |
| **Camera** | Push-in continues. |
| **Colour and emphasis** | Amber for the waiting warp; mint for the verdict. |
| **Text overlays** | “every thread’s registers stay on-chip” · “W2 WAITING ON MEMORY” · “kept busy” · “SWITCH COST 0”. |
| **Transition out** | Pan-down: the unit slides up and out while the memory tower rises from below (camera follows the request). |
| **Sound** | Blip on “registers”; descending power-down tone on “stalls”; lock click on the swap; impact and chime on “Zero”. |
| **Purpose** | Why the design tolerates slow memory: state never leaves the chip, so another warp can run immediately. |

## 25 · Memory: the tower

**Time:** 1:40.05 → 1:49.72  (9.67 s)  
**Narration:** “And they stall on memory a lot. Registers are instant. A small shared scratchpad lets threads in a block trade results. Then caches.”  
**Caption phrases:** And they stall | on memory | a lot. | Registers | are instant. | A small shared | scratchpad | lets threads in a block | trade results. | Then caches.

| | |
|---|---|
| **Objects on screen** | Lanes strip (64 lanes) with a live “% waiting on data” read-out; four level bands: REGISTERS, SHARED MEMORY, CACHES, VRAM. |
| **Position and size (1080 × 1920)** | Strip y 384–502. Bands x 70–1010: registers y 526–630, shared memory y 648–776, caches y 794–898, VRAM y 916–1200. |
| **Background** | Standard backdrop. |
| **Movement** | Lanes flip between working (cyan pulses) and waiting (amber); the read-out hovers near 60 %. Levels light top to bottom on their words. Registers: values hop straight up. Shared memory: eight thread dots pass results to each other through eight cells. Caches: cells shimmer. |
| **Timing and easing** | Each level: ease-out-cubic 0.35 s plus a 1.2 s glow. |
| **Camera** | Static; top-to-bottom order is the “camera move”. |
| **Colour and emphasis** | Each level has its own accent (cyan, mint, amber, violet) and a speed pill. |
| **Text overlays** | “EXECUTION LANES · 6x% waiting on data” · level names with glosses · “instant / very fast / fast / farthest”. |
| **Transition out** | None. |
| **Sound** | Power-down tone on “stall”; a blip per level, each lower than the last. |
| **Purpose** | Nearest is fastest and smallest; farthest is biggest and slowest. |

## 26 · Memory: VRAM is the limit

**Time:** 1:49.72 → 1:58.02  (8.30 s)  
**Narration:** “Then VRAM— feeding a flagship chip over a thousand gigabytes every second. And often, that's still the real speed limit.”  
**Caption phrases:** Then VRAM— | feeding a flagship chip | over a thousand | gigabytes | every second. | And often, | that's still the real | speed limit.

| | |
|---|---|
| **Objects on screen** | VRAM band at full brightness; three risers with 54 climbing packets; bandwidth read-out; coral ellipse. |
| **Position and size (1080 × 1920)** | Risers at x 596, 706, 816 from y 936 up to y 498. Read-out right-aligned at x 688, y 1078, 104 px, with “GB/s” and the product line to its right (kept left of x 930). Ellipse 524 × 184 centred (532, 1038). |
| **Background** | Unchanged. |
| **Movement** | Packets stream upward and turn cyan as they reach the lanes. The read-out counts to 1,792. On “speed limit” a coral ring closes around the number, the stream thins, and the lanes’ waiting share jumps to about 70 %. |
| **Timing and easing** | Count: ease-out-cubic ≈ 1.1 s. Ring: ease-out-back 0.4 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Violet stream; coral for the limit. |
| **Text overlays** | “32 GB” · “1,792 GB/s” · “RTX 5090 · GDDR7” · “THE REAL SPEED LIMIT” · “MATH: READY” / “DATA: STILL ARRIVING”. |
| **Transition out** | Zoom-in on the lanes strip into the next scene. |
| **Sound** | Data stream; count ticks; impact on the figure; stamp on “speed limit”. |
| **Purpose** | Even a very large bandwidth figure is often what holds the chip back. |

## 27 · Pixels: a 4K frame

**Time:** 1:58.02 → 2:06.88  (8.86 s)  
**Narration:** “Now it clicks. A 4K frame is eight million pixels, each running the same small program on different data. Perfect.”  
**Caption phrases:** Now it clicks. | A 4K frame is | eight million pixels, | each running | the same small program | on different data. | Perfect.

| | |
|---|---|
| **Objects on screen** | A 96 × 52-pixel sunset image shaded in 156 warp-sized tiles; shader card; pixel counter; loupe; stamp. |
| **Position and size (1080 × 1920)** | Frame x 70–1010, y 478–987. Pixel counter x 70–428 and shader card x 444–1010, both y 1012–1198 (the number sits on the left, clear of the platform button column). Loupe 448 × 270 at x 84–532, y 696–966. |
| **Background** | Standard backdrop. |
| **Movement** | Tiles of 8 × 4 pixels fill in a diagonal wave, each flashing white as its 32 pixels are shaded together. The counter runs to 8,294,400. The shader card glows on “same”. On “different” a loupe enlarges eight neighbouring pixels with their hex values. “PERFECT FIT” stamps on. |
| **Timing and easing** | Reveal spread over ≈ 6.9 s; tile flash 0.22 s. Loupe cells: ease-out-back, 35 ms apart. Stamp: ease-out-back. |
| **Camera** | Static. |
| **Colour and emphasis** | The image itself supplies the colour; UI stays cyan/amber/mint. |
| **Text overlays** | “4K FRAME · 3840 × 2160” · “for every pixel: color = shade(pixel)” · “32 pixels per warp, in lockstep” · “8,294,400 PIXELS in every frame” · “EACH PIXEL · ITS OWN DATA” · “PERFECT FIT”. |
| **Transition out** | Slides up and out as the AI half slides in. |
| **Sound** | Lock click on “clicks”; data stream under the reveal; count ticks and impact; two blips; chime and stamp. |
| **Purpose** | The first workload that matches the machine exactly: same program, different data, millions of times. |

## 28 · AI: matrix multiplication

**Time:** 2:06.88 → 2:15.36  (8.48 s)  
**Narration:** “A neural network is mostly giant matrix multiplications: billions of identical multiply-adds. Also perfect.”  
**Caption phrases:** A neural network | is mostly giant | matrix multiplications: | billions of identical | multiply-adds. | Also perfect.

| | |
|---|---|
| **Objects on screen** | Four-layer network glyph; three matrices (weights × inputs = outputs, 8 × 8 each); multiply-add strip; counter; stamp. |
| **Position and size (1080 × 1920)** | Network y 486–700, layers at x 150, 383, 617, 850. Matrices 264 px at x 70, 408, 746, y 808–1072. Strip x 70–1010, y 1100–1200. |
| **Background** | Unchanged. |
| **Movement** | Signals drift through the network; each bundle of connections is tagged “matrix 1/2/3”. The matrices rise in. One row and one column light, eight a·b terms tick on, one output cell fills. Then whole rows fill at once, pass after pass, while the counter climbs to billions. |
| **Timing and easing** | Matrices: ease-out-cubic 0.5 s, 0.12 s apart. Terms 70 ms apart. Row fills 45 ms apart, 0.5 s per pass. |
| **Camera** | Static. |
| **Colour and emphasis** | Violet weights, amber inputs, cyan outputs. |
| **Text overlays** | “NEURAL NETWORK” · “matrix 1/2/3” · “WEIGHTS × INPUTS = OUTPUTS” · “a·b + a·b + …” · “n MULTIPLY-ADDS” · “PERFECT FIT”. |
| **Transition out** | Pan-down to the limits. |
| **Sound** | Slide and thump for the matrices; eight ticks; riser and data stream to the stamp; chime. |
| **Purpose** | The second matching workload, reduced to its repeated operation. |

## 29 · Limits: divergence

**Time:** 2:15.36 → 2:22.16  (6.80 s)  
**Narration:** “But make threads disagree— half branch left, half right— and half the squad sits idle while the others work.”  
**Caption phrases:** But make threads | disagree— | half branch left, | half right— | and half the squad | sits idle | while the others work.

| | |
|---|---|
| **Objects on screen** | 32 tall lanes with three code regions (common, THEN, ELSE); branch bar; a single white instruction pointer; work meter. |
| **Position and size (1080 × 1920)** | Lanes x 86–994. Common y 476–590, branch bar y 606–664, THEN y 680–896, ELSE y 912–1128, each path labelled by a pill at its top-left. Meter x 70–1010, y 384–462. |
| **Background** | Standard backdrop. |
| **Movement** | The pointer runs down the common code with all 32 lanes lit. At the branch each thread head turns cyan (left) or violet (right), 16 each, scattered. The pointer then crosses THEN with only the cyan lanes working and the others greyed, then ELSE with the roles reversed. The meter falls from 100 % to 50 %. |
| **Timing and easing** | Pointer speed set by the narration: THEN during “and half the squad sits”, ELSE during “idle while the others work”. Meter: ease-in-out-cubic 0.35 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Cyan / violet for the two paths, grey for masked lanes, coral for the meter. |
| **Text overlays** | “LANES DOING WORK 100 % → 50 %” · “if (x > 0)” · “THEN-PATH · 16 GO LEFT” · “ELSE-PATH · 16 GO RIGHT” · “HALF THE WARP IS MASKED OFF” · “DIVERGENCE”. |
| **Transition out** | Cross-fade to the lock. |
| **Sound** | Buzz on “disagree”; two blips for left and right; power-down tone when the meter falls. |
| **Purpose** | One pointer cannot be in two places: each path runs in turn and the other half waits. |

## 30 · Limits: waiting on each other

**Time:** 2:22.16 → 2:26.02  (3.86 s)  
**Narration:** “Make them wait on each other, and the lanes go quiet.”  
**Caption phrases:** Make them wait | on each other, | and the lanes | go quiet.

| | |
|---|---|
| **Objects on screen** | Row of 32 waiting threads; a lock bar; a done row; 32 lanes; meter; three bottleneck chips. |
| **Position and size (1080 × 1920)** | Waiting row y 646, lock y 736, done row y 830, lanes y 906–1128. Chips at y 1178, x 226, 540, 854. |
| **Background** | Unchanged. |
| **Movement** | Threads pass the lock strictly one at a time (0.3 s each). Only the lane belonging to the thread that holds the lock is lit; the meter reads 3 %. The lanes dim further on “go quiet”. Chips DIVERGENCE, WAITING, MEMORY collect along the bottom. |
| **Timing and easing** | Pass: ease-in-out-quad 0.3 s. Chips: ease-out-back 0.3 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Amber waiting, mint done, coral lock. |
| **Text overlays** | “ONE SHARED RESULT — every thread needs it, so they take turns” · “LOCK · ONE AT A TIME” · “31 of 32 lanes dark” · “DIVERGENCE · WAITING · MEMORY”. |
| **Transition out** | Zoom-out to the conclusion. |
| **Sound** | A dull tick per pass; power-down tone on “quiet”. |
| **Purpose** | Parallel hardware does nothing for work that must be done in turn. Names the three things that break lockstep. |

## 31 · Takeaway: not a faster CPU

**Time:** 2:26.02 → 2:28.95  (2.93 s)  
**Narration:** “So a GPU isn't a faster CPU.”  
**Caption phrases:** So a GPU isn't | a faster CPU.

| | |
|---|---|
| **Objects on screen** | Three stacked words. |
| **Position and size (1080 × 1920)** | “GPU” 250 px at y 640; “≠” 190 px at y 838; “a faster CPU” 124 px at y 1000; footnote y 1086. |
| **Background** | Standard backdrop. |
| **Movement** | “GPU” arrives first; “≠” punches in on “isn’t”; the last line rises on “faster”. |
| **Timing and easing** | ease-out-back for each element, 0.35 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Cyan, coral, amber — the video’s three roles in one frame. |
| **Text overlays** | “GPU ≠ a faster CPU” · “different machine · different job”. |
| **Transition out** | Typography lifts away as the data ocean arrives. |
| **Sound** | Thump, buzz, thump on the three words. |
| **Purpose** | State the conclusion as bluntly as possible. |

## 32 · Takeaway: an ocean of data

**Time:** 2:28.95 → 2:33.72  (4.77 s)  
**Narration:** “It's a machine for doing one thing to an ocean of data, all at once.”  
**Caption phrases:** It's a machine | for doing one thing | to an ocean of data, | all at once.

| | |
|---|---|
| **Objects on screen** | Perspective field of 1,230 data points running to the bottom edge; GPU chip; “f(x)” chip and beam. |
| **Position and size (1080 × 1920)** | Horizon y 800; field spreads to full width at the bottom of the frame. GPU 210 px at (540, 566); instruction chip at (540, 726). |
| **Background** | The field replaces the floor grid; captions sit over it on the caption band. |
| **Movement** | Violet points roll in gentle waves. One instruction fans out over the whole field. On “all” every point turns cyan in the same 0.12 s and “ALL AT ONCE” flashes. |
| **Timing and easing** | Flip: ease-out-quad 0.12 s, no stagger — the lack of stagger is the point. |
| **Camera** | Static, deep perspective. |
| **Colour and emphasis** | Violet (untouched data) → cyan (processed). |
| **Text overlays** | “f(x)” · “ALL AT ONCE”. |
| **Transition out** | None. |
| **Sound** | Whoosh and pad swell; blip on “one thing”; riser into an impact on “all”. |
| **Purpose** | The mental model in one image: one operation, applied to everything, simultaneously. |

## 33 · Takeaway: it depends on the work

**Time:** 2:33.72 → 2:39.51  (5.79 s)  
**Narration:** “Give it that, and it's unstoppable. Give it anything else… and your CPU still wins.”  
**Caption phrases:** Give it that, | and it's unstoppable. | Give it anything else… | and your CPU | still wins.

| | |
|---|---|
| **Objects on screen** | Same field; GPU and CPU chips side by side; verdict pills. |
| **Position and size (1080 × 1920)** | GPU moves to (300, 566); CPU 210 px at (780, 566). Pills at y 414. |
| **Background** | Field turns white-cyan, then multi-coloured and scattered. |
| **Movement** | On “unstoppable” the field pulses in lockstep and streaks rush upward. On “anything else” the points scatter and take five different colours, the GPU dims and slides left, the CPU appears, lights, and takes the verdict. |
| **Timing and easing** | Scatter: ease-in-out-quad 0.9 s. Slide: ease-in-out-cubic 0.6 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Mint verdict for the GPU case, amber for the CPU case. |
| **Text overlays** | “SAME WORK × OCEAN OF DATA” · “BRANCHY · ONE-OFF · TANGLED” · “CPU WINS”. |
| **Transition out** | Field dims; end card rises. |
| **Sound** | Four thumps and a chime on “unstoppable”; power-down tone on “anything else”; thump and chime on “CPU … wins”. |
| **Purpose** | Performance depends on the shape of the work, not on the chip alone. |

## 34 · End card

**Time:** 2:39.51 → 2:42.05  (2.54 s)  
**Narration:** “(no narration)”  
**Caption phrases:** —

| | |
|---|---|
| **Objects on screen** | Two-line statement, divider, one-line caveat, three recap chips. |
| **Position and size (1080 × 1920)** | Lines at y 704 and 812, 96 px. Divider y 872. Caveat y 936, 40 px. Chips y 1024. |
| **Background** | Dimmed data field. |
| **Movement** | Lines rise 40 px; divider grows from the centre; caveat rises; chips pop in left to right. |
| **Timing and easing** | ease-in-out-cubic 0.6 s; chips ease-out-back 0.3 s, 0.12 s apart. |
| **Camera** | Static. Held 1.9 s so the final frame can be read and loops cleanly. |
| **Colour and emphasis** | White and cyan headline; chips in cyan, amber, violet. |
| **Text overlays** | “ONE INSTRUCTION. MANY THREADS.” · “How fast? That depends on the work.” · “IDENTICAL UNITS · WARPS OF 32 · FED BY MEMORY”. |
| **Transition out** | Ends on this frame; music rings out. |
| **Sound** | Whoosh, impact, final major chord. |
| **Purpose** | Leave one sentence to remember and the three facts that support it. |
