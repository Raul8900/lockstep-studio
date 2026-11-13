# Narration Script — “How Does a Modern GPU Actually Work Internally?”

**Final recorded length:** 162.05 s (speech ends at 159.36 s, then a 2.7 s end card)  
**Word count:** 390 spoken words · **Average pace:** 170 wpm while speaking, 147 wpm overall  
**Voice:** Kokoro-82M neural TTS (Apache-2.0), voice `af_heart`, speed 1.00, synthesised locally  
**Timing source:** every timestamp below is measured from the recorded audio (phoneme durations reported by the voice model, 25 ms resolution), not estimated from word counts.

Legend: **bold** = stressed / on-screen highlighted term · `‖ 0.3 s` = pause after the line · an em dash or ellipsis inside a line is a short breath, not a full stop.

---

## 1. THE MYTH  ·  0:00.39 – 0:07.86  (7.5 s of speech)

*Direction:* Curiosity gap. Flat, confident statement, then the twist. Slight smile on *think for itself*; land hard on *fast*.

| # | Start | End | Dur | Line | Pause after |
|---|---|---|---|---|---|
| 1 | 0:00.39 | 0:02.66 | 2.27 s | This **chip** has over **twenty thousand cores.** | ‖ 0.49 s |
| 2 | 0:03.15 | 0:05.35 | 2.20 s | And not one of them can think for itself. | ‖ 0.53 s |
| 3 | 0:05.89 | 0:07.86 | 1.97 s | That's exactly why it's so **fast.** | ‖ 0.93 s |

## 2. CPU vs GPU  ·  0:08.79 – 0:29.72  (20.9 s of speech)

*Direction:* Explain by contrast. Even, patient pace for the CPU; brighter and quicker when the GPU enters. List of three (*prediction, caching, and control*) climbs in pitch.

| # | Start | End | Dur | Line | Pause after |
|---|---|---|---|---|---|
| 4 | 0:08.79 | 0:10.91 | 2.12 s | A **CPU** is built for **decisions.** | ‖ 0.46 s |
| 5 | 0:11.37 | 0:19.94 | 8.58 s | A few brilliant **cores,** each spending most of its silicon on **prediction, caching,** and **control—** to finish one task as **fast** as possible. | ‖ 0.73 s |
| 6 | 0:20.67 | 0:22.77 | 2.10 s | A **GPU** makes the opposite bet. | ‖ 0.43 s |
| 7 | 0:23.20 | 0:29.72 | 6.53 s | It strips most of that cleverness out, and spends the silicon on raw **arithmetic—** copied thousands of times. | ‖ 0.84 s |

## 3. THE HAND-OFF  ·  0:30.57 – 0:42.18  (11.6 s of speech)

*Direction:* Correct a misconception lightly. Tiny beat before *The CPU does.* Build to *a million times*.

| # | Start | End | Dur | Line | Pause after |
|---|---|---|---|---|---|
| 8 | 0:30.57 | 0:33.66 | 3.09 s | It doesn't even run your program. The **CPU** does. | ‖ 0.49 s |
| 9 | 0:34.15 | 0:42.18 | 8.02 s | It copies your **data** into the **GPU's memory,** then sends one small function, with a single order: run this, a **million** times. | ‖ 0.95 s |

## 4. INSIDE THE CHIP  ·  0:43.13 – 0:55.35  (12.2 s of speech)

*Direction:* Discovery. Slow slightly on the vendor names so they can be read on screen.

| # | Start | End | Dur | Line | Pause after |
|---|---|---|---|---|---|
| 10 | 0:43.13 | 0:47.05 | 3.92 s | Zoom into the **chip,** and you find one **block,** stamped out again and again. | ‖ 0.54 s |
| 11 | 0:47.60 | 0:52.24 | 4.65 s | NVIDIA calls it a **streaming multiprocessor.** AMD, a **compute unit.** | ‖ 0.54 s |
| 12 | 0:52.78 | 0:55.35 | 2.58 s | A flagship card has a **hundred** and **seventy.** | ‖ 0.89 s |

## 5. THREADS & WARPS  ·  0:56.24 – 1:19.51  (23.3 s of speech)

*Direction:* The core idea — slowest, clearest delivery in the video. Pause after *Here's the trick*. The rowing line is a release: warm, almost amused.

| # | Start | End | Dur | Line | Pause after |
|---|---|---|---|---|---|
| 13 | 0:56.24 | 0:58.39 | 2.15 s | Each copy of that function is a **thread.** | ‖ 0.47 s |
| 14 | 0:58.86 | 1:05.64 | 6.78 s | **Threads** are packed into **blocks;** each **block** lands on one **unit,** which slices it into squads of **thirty-two,** called **warps.** | ‖ 0.73 s |
| 15 | 1:06.37 | 1:09.37 | 3.00 s | Here's the trick: a **warp** shares one **instruction** stream. | ‖ 0.51 s |
| 16 | 1:09.88 | 1:16.13 | 6.25 s | Each **instruction** is fetched once… then all **thirty-two threads** execute it together, each on its own **data.** | ‖ 0.61 s |
| 17 | 1:16.74 | 1:19.51 | 2.77 s | Like a rowing crew: one call, **thirty-two** oars. | ‖ 0.98 s |

## 6. INSIDE ONE UNIT  ·  1:20.49 – 1:39.65  (19.2 s of speech)

*Direction:* Pay off the hook. Firm on *aren't tiny CPUs*. *Zero cost.* is two flat, separate words.

| # | Start | End | Dur | Line | Pause after |
|---|---|---|---|---|---|
| 18 | 1:20.49 | 1:23.51 | 3.03 s | So those **twenty thousand cores** aren't tiny **CPUs.** | ‖ 0.41 s |
| 19 | 1:23.92 | 1:26.77 | 2.85 s | They're **lanes** of **arithmetic,** marching in **lockstep.** | ‖ 0.77 s |
| 20 | 1:27.54 | 1:31.12 | 3.58 s | Inside each **unit,** a **scheduler** juggles **dozens** of **warps.** | ‖ 0.51 s |
| 21 | 1:31.63 | 1:39.65 | 8.03 s | Every **thread** keeps its **registers** right on the **chip—** so when one **warp stalls** on **memory,** another takes over instantly. **Zero** cost. | ‖ 0.90 s |

## 7. MEMORY  ·  1:40.55 – 1:57.52  (17.0 s of speech)

*Direction:* Lower energy, a note of warning. The list (*registers, scratchpad, caches, VRAM*) descends like the diagram.

| # | Start | End | Dur | Line | Pause after |
|---|---|---|---|---|---|
| 22 | 1:40.55 | 1:42.42 | 1.88 s | And they **stall** on **memory** a lot. | ‖ 0.59 s |
| 23 | 1:43.01 | 1:49.51 | 6.50 s | **Registers** are instant. A small shared **scratchpad** lets **threads** in a **block** trade results. Then **caches.** | ‖ 0.45 s |
| 24 | 1:49.97 | 1:54.44 | 4.47 s | Then **VRAM—** feeding a flagship **chip** over a **thousand gigabytes** every second. | ‖ 0.55 s |
| 25 | 1:55.00 | 1:57.52 | 2.52 s | And often, that's still the real speed **limit.** | ‖ 1.00 s |

## 8. PIXELS & AI  ·  1:58.52 – 2:14.93  (16.4 s of speech)

*Direction:* Lift. *Perfect.* and *Also perfect.* are short, satisfied, identical in tone.

| # | Start | End | Dur | Line | Pause after |
|---|---|---|---|---|---|
| 26 | 1:58.52 | 1:59.47 | 0.95 s | Now it clicks. | ‖ 0.51 s |
| 27 | 1:59.98 | 2:06.70 | 6.72 s | A **4K** frame is **eight million pixels,** each running the same small program on different **data. Perfect.** | ‖ 0.66 s |
| 28 | 2:07.36 | 2:14.93 | 7.57 s | A neural network is mostly giant **matrix multiplications: billions** of identical **multiply-adds.** Also **perfect.** | ‖ 0.93 s |

## 9. THE LIMITS  ·  2:15.86 – 2:25.51  (9.6 s of speech)

*Direction:* Tension. Slightly faster, clipped. Let *go quiet* trail off.

| # | Start | End | Dur | Line | Pause after |
|---|---|---|---|---|---|
| 29 | 2:15.86 | 2:22.03 | 6.18 s | But make **threads disagree—** half branch left, half right— and half the squad sits **idle** while the others work. | ‖ 0.57 s |
| 30 | 2:22.61 | 2:25.51 | 2.90 s | Make them **wait** on each other, and the **lanes** go **quiet.** | ‖ 1.01 s |

## 10. THE TAKEAWAY  ·  2:26.52 – 2:39.36  (12.8 s of speech)

*Direction:* Summing up. Measured, then a clean final contrast: up on *unstoppable*, down and dry on *still wins*.

| # | Start | End | Dur | Line | Pause after |
|---|---|---|---|---|---|
| 31 | 2:26.52 | 2:28.92 | 2.40 s | So a **GPU** isn't a faster **CPU.** | ‖ 0.48 s |
| 32 | 2:29.40 | 2:33.22 | 3.83 s | It's a machine for doing one thing to an ocean of **data,** all at once. | ‖ 0.69 s |
| 33 | 2:33.92 | 2:35.82 | 1.90 s | Give it that, and it's **unstoppable.** | ‖ 0.52 s |
| 34 | 2:36.34 | 2:39.36 | 3.03 s | Give it anything else… and your **CPU** still **wins.** | ‖ end card |

---

## Pronunciation guide

| Term | Say it as | Note |
|---|---|---|
| NVIDIA | en-VID-ee-uh | forced with a phoneme override /ɛnvˈɪdiə/; the default reading spelled it out letter by letter |
| AMD | ay-em-DEE | letter by letter |
| CPU / GPU / CPUs | see-pee-YOO / jee-pee-YOO | letter by letter, stress on the last letter |
| VRAM | VEE-ram | one word, not V-R-A-M |
| 4K | four-KAY |  |
| warp | worp (rhymes with *thorp*) | not *wahrp* |
| thirty-two | THUR-tee-too | always spoken in full, never *three two* |
| multiply-adds | MUL-tih-ply adds | compound noun, stress on the first syllable |
| scratchpad | SKRATCH-pad | one word |
| lockstep | LOK-step | one word |

## Plain reading copy

**THE MYTH** — This chip has over twenty thousand cores. And not one of them can think for itself. That's exactly why it's so fast.

**CPU vs GPU** — A CPU is built for decisions. A few brilliant cores, each spending most of its silicon on prediction, caching, and control — to finish one task as fast as possible. A GPU makes the opposite bet. It strips most of that cleverness out, and spends the silicon on raw arithmetic — copied thousands of times.

**THE HAND-OFF** — It doesn't even run your program. The CPU does. It copies your data into the GPU's memory, then sends one small function, with a single order: run this, a million times.

**INSIDE THE CHIP** — Zoom into the chip, and you find one block, stamped out again and again. NVIDIA calls it a streaming multiprocessor. AMD, a compute unit. A flagship card has a hundred and seventy.

**THREADS & WARPS** — Each copy of that function is a thread. Threads are packed into blocks; each block lands on one unit, which slices it into squads of thirty-two, called warps. Here's the trick: a warp shares one instruction stream. Each instruction is fetched once… then all thirty-two threads execute it together, each on its own data. Like a rowing crew: one call, thirty-two oars.

**INSIDE ONE UNIT** — So those twenty thousand cores aren't tiny CPUs. They're lanes of arithmetic, marching in lockstep. Inside each unit, a scheduler juggles dozens of warps. Every thread keeps its registers right on the chip — so when one warp stalls on memory, another takes over instantly. Zero cost.

**MEMORY** — And they stall on memory a lot. Registers are instant. A small shared scratchpad lets threads in a block trade results. Then caches. Then VRAM — feeding a flagship chip over a thousand gigabytes every second. And often, that's still the real speed limit.

**PIXELS & AI** — Now it clicks. A 4K frame is eight million pixels, each running the same small program on different data. Perfect. A neural network is mostly giant matrix multiplications: billions of identical multiply-adds. Also perfect.

**THE LIMITS** — But make threads disagree — half branch left, half right — and half the squad sits idle while the others work. Make them wait on each other, and the lanes go quiet.

**THE TAKEAWAY** — So a GPU isn't a faster CPU. It's a machine for doing one thing to an ocean of data, all at once. Give it that, and it's unstoppable. Give it anything else… and your CPU still wins.

## Accuracy notes on the wording

- *“over twenty thousand cores”* — 21,760 CUDA cores on a GeForce RTX 5090; the product is named on screen so the number is not presented as universal.
- *“not one of them can think for itself”* — a figure of speech for the SIMT model: fetch, decode and scheduling happen per warp, not per lane. The video states the literal version later (*“lanes of arithmetic, marching in lockstep”*).
- *“most of its silicon on prediction, caching, and control”* — follows NVIDIA’s own description of where CPU transistors go; no percentage is claimed.
- *“squads of thirty-two, called warps”* — NVIDIA’s number and name; the on-screen label adds *AMD: wavefront* because AMD’s group is 32 or 64 wide.
- *“a hundred and seventy”* — streaming multiprocessors on the RTX 5090, labelled as such on screen.
- *“dozens of warps”* — deliberately not a number: 48 is documented for the previous (Ada) generation only.
- *“Zero cost”* — NVIDIA’s wording is that switching between warps *incurs no cost* because each warp’s execution context stays on-chip.
- *“over a thousand gigabytes every second”* — 1,792 GB/s on the RTX 5090 (1,008 GB/s on the RTX 4090), shown with the product name.
- *“eight million pixels”* — 3840 × 2160 = 8,294,400.
- *“half the squad sits idle”* — the 16/16 split is an illustration; the general rule is that threads not on the executing path are masked off.
