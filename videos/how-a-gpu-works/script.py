"""Narration script for “How Does a Modern GPU Actually Work Internally?”.

Structure: BEATS -> takes. A take is the text synthesised in one pass (so the
voice keeps natural prosody across its sentences), followed by a pause.

Inline markers understood by synth.py:
  [word](/phonemes/)   pronunciation override (misaki syntax)
  {p:0.30}             make the pause at this point at least 0.30 s long
  *word*               emphasis hint for captions only (stripped before TTS)

Caption colour classes come from HIGHLIGHT below. DIRECTIONS, PRONUNCIATION and ACCURACY_NOTES
are only used for docs/narration_script.md.
"""

VOICE = "af_heart"
SPEED = 1.0
LEAD_IN = 0.30          # silence before the first word
TAIL = 2.60             # room after the last word for the end card

BEATS = [
    {
        "id": "hook",
        "title": "Hook",
        "takes": [
            ("This chip has over twenty thousand cores.", 0.34),
            ("And not one of them can think for itself.", 0.38),
            ("That's exactly why it's so fast.", 0.75),
        ],
    },
    {
        "id": "cpu_gpu",
        "title": "CPU vs GPU",
        "takes": [
            ("A CPU is built for decisions.", 0.28),
            ("A few brilliant cores, each spending most of its silicon on prediction, caching, "
             "and control — to finish one task as fast as possible.", 0.55),
            ("A GPU makes the opposite bet.", 0.28),
            ("It strips most of that cleverness out, and spends the silicon on raw arithmetic "
             "— copied thousands of times.", 0.70),
        ],
    },
    {
        "id": "dispatch",
        "title": "Dispatch",
        "takes": [
            ("It doesn't even run your program. {p:0.22} The CPU does.", 0.34),
            ("It copies your data into the GPU's memory, then sends one small function, "
             "with a single order: {p:0.25} run this, a million times.", 0.72),
        ],
    },
    {
        "id": "architecture",
        "title": "Overall architecture",
        "takes": [
            ("Zoom into the chip, and you find one block, stamped out again and again.", 0.36),
            ("[NVIDIA](/ɛnvˈɪdiə/) calls it a streaming multiprocessor. {p:0.22} AMD, a compute unit.", 0.36),
            ("A flagship card has a hundred and seventy.", 0.72),
        ],
    },
    {
        "id": "warps",
        "title": "Parallel execution",
        "takes": [
            ("Each copy of that function is a thread.", 0.30),
            ("Threads are packed into blocks; each block lands on one unit, which slices it "
             "into squads of thirty-two, called warps.", 0.55),
            ("Here's the trick: a warp shares one instruction stream.", 0.34),
            ("Each instruction is fetched once… then all thirty-two threads execute it together, "
             "each on its own data.", 0.45),
            ("Like a rowing crew: one call, thirty-two oars.", 0.78),
        ],
    },
    {
        "id": "inside",
        "title": "Inside a compute unit",
        "takes": [
            ("So those twenty thousand cores aren't tiny CPUs.", 0.26),
            ("They're lanes of arithmetic, marching in lockstep.", 0.58),
            ("Inside each unit, a scheduler juggles dozens of warps.", 0.34),
            ("Every thread keeps its registers right on the chip — so when one warp stalls on memory, "
             "another takes over instantly. {p:0.30} Zero cost.", 0.75),
        ],
    },
    {
        "id": "memory",
        "title": "GPU memory",
        "takes": [
            ("And they stall on memory a lot.", 0.40),
            ("Registers are instant. {p:0.25} A small shared scratchpad lets threads in a block "
             "trade results. {p:0.25} Then caches.", 0.30),
            ("Then VRAM — feeding a flagship chip over a thousand gigabytes every second.", 0.40),
            ("And often, that's still the real speed limit.", 0.78),
        ],
    },
    {
        "id": "workloads",
        "title": "Graphics and AI",
        "takes": [
            ("Now it clicks.", 0.34),
            ("A 4K frame is eight million pixels, each running the same small program on "
             "different data. {p:0.30} Perfect.", 0.48),
            ("A neural network is mostly giant matrix multiplications: billions of identical "
             "multiply-adds. {p:0.30} Also perfect.", 0.78),
        ],
    },
    {
        "id": "limits",
        "title": "Limits",
        "takes": [
            ("But make threads disagree — half branch left, half right — and half the squad sits "
             "idle while the others work.", 0.40),
            ("Make them wait on each other, and the lanes go quiet.", 0.80),
        ],
    },
    {
        "id": "payoff",
        "title": "Conclusion",
        "takes": [
            ("So a GPU isn't a faster CPU.", 0.34),
            ("It's a machine for doing one thing to an ocean of data, all at once.", 0.52),
            ("Give it that, and it's unstoppable.", 0.36),
            ("Give it anything else… and your CPU still wins.", 0.0),
        ],
    },
]

# Caption highlight classes: word (lower-case, punctuation stripped) -> class
#   k = key hardware term (cyan)   n = number / quantity (amber)
#   m = memory term (violet)       w = limit / warning (coral)
HIGHLIGHT = {
    "cores": "k", "cpu": "k", "cpus": "k", "gpu": "k", "gpu's": "k", "chip": "k",
    "streaming": "k", "multiprocessor": "k", "compute": "k", "unit": "k", "units": "k",
    "thread": "k", "threads": "k", "blocks": "k", "block": "k", "warp": "k", "warps": "k",
    "instruction": "k", "scheduler": "k", "lanes": "k", "arithmetic": "k", "lockstep": "k",
    "pixels": "k", "matrix": "k", "multiplications": "k", "multiply-adds": "k",
    "twenty": "n", "thousand": "n", "million": "n", "thirty-two": "n", "hundred": "n",
    "seventy": "n", "dozens": "n", "eight": "n", "billions": "n", "gigabytes": "n",
    "4k": "n", "zero": "n", "one": None,
    "memory": "m", "registers": "m", "scratchpad": "m", "caches": "m", "vram": "m", "data": "m",
    "stalls": "w", "stall": "w", "idle": "w", "disagree": "w", "quiet": "w", "limit": "w",
    "wait": "w",
    "decisions": "k", "prediction": "k", "caching": "k", "control": "k",
    "perfect": "n", "unstoppable": "n", "wins": "n", "fast": "n",
}

# ---- used by docs/narration_script.md only -------------------------------------------
# Delivery notes per beat (what a human narrator would be told).
DIRECTIONS = {'hook': 'Curiosity gap. Flat, confident statement, then the twist. Slight smile on *think for itself*; land hard on *fast*.',
 'cpu_gpu': 'Explain by contrast. Even, patient pace for the CPU; brighter and quicker when the GPU enters. List of three (*prediction, caching, and '
            'control*) climbs in pitch.',
 'dispatch': 'Correct a misconception lightly. Tiny beat before *The CPU does.* Build to *a million times*.',
 'architecture': 'Discovery. Slow slightly on the vendor names so they can be read on screen.',
 'warps': "The core idea — slowest, clearest delivery in the video. Pause after *Here's the trick*. The rowing line is a release: warm, almost "
          'amused.',
 'inside': "Pay off the hook. Firm on *aren't tiny CPUs*. *Zero cost.* is two flat, separate words.",
 'memory': 'Lower energy, a note of warning. The list (*registers, scratchpad, caches, VRAM*) descends like the diagram.',
 'workloads': 'Lift. *Perfect.* and *Also perfect.* are short, satisfied, identical in tone.',
 'limits': 'Tension. Slightly faster, clipped. Let *go quiet* trail off.',
 'payoff': 'Summing up. Measured, then a clean final contrast: up on *unstoppable*, down and dry on *still wins*.'}

# (term, say it as, note)
PRONUNCIATION = [('NVIDIA', 'en-VID-ee-uh', 'forced with a phoneme override /ɛnvˈɪdiə/; the default reading spelled it out letter by letter'),
 ('AMD', 'ay-em-DEE', 'letter by letter'),
 ('CPU / GPU / CPUs', 'see-pee-YOO / jee-pee-YOO', 'letter by letter, stress on the last letter'),
 ('VRAM', 'VEE-ram', 'one word, not V-R-A-M'),
 ('4K', 'four-KAY', ''),
 ('warp', 'worp (rhymes with *thorp*)', 'not *wahrp*'),
 ('thirty-two', 'THUR-tee-too', 'always spoken in full, never *three two*'),
 ('multiply-adds', 'MUL-tih-ply adds', 'compound noun, stress on the first syllable'),
 ('scratchpad', 'SKRATCH-pad', 'one word'),
 ('lockstep', 'LOK-step', 'one word')]

# What each number or bold claim in the narration rests on.
ACCURACY_NOTES = ['*“over twenty thousand cores”* — 21,760 CUDA cores on a GeForce RTX 5090; the product is named on screen so the number is not presented as '
 'universal.',
 '*“not one of them can think for itself”* — a figure of speech for the SIMT model: fetch, decode and scheduling happen per warp, not per lane. The '
 'video states the literal version later (*“lanes of arithmetic, marching in lockstep”*).',
 '*“most of its silicon on prediction, caching, and control”* — follows NVIDIA’s own description of where CPU transistors go; no percentage is '
 'claimed.',
 '*“squads of thirty-two, called warps”* — NVIDIA’s number and name; the on-screen label adds *AMD: wavefront* because AMD’s group is 32 or 64 wide.',
 '*“a hundred and seventy”* — streaming multiprocessors on the RTX 5090, labelled as such on screen.',
 '*“dozens of warps”* — deliberately not a number: 48 is documented for the previous (Ada) generation only.',
 '*“Zero cost”* — NVIDIA’s wording is that switching between warps *incurs no cost* because each warp’s execution context stays on-chip.',
 '*“over a thousand gigabytes every second”* — 1,792 GB/s on the RTX 5090 (1,008 GB/s on the RTX 4090), shown with the product name.',
 '*“eight million pixels”* — 3840 × 2160 = 8,294,400.',
 '*“half the squad sits idle”* — the 16/16 split is an illustration; the general rule is that threads not on the executing path are masked off.']
