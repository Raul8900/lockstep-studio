"""Narration script for “Einstein's Off Switch”.

The case shape (reference/story.md): a clock set wrong on purpose (the mystery) → why GPS lives and
dies by clocks (brisk setup, "you" as the blue dot) → the mechanism: gravity speeds the clock up,
speed slows it down, net +38 µs a day (slow, held at the peak) → the stakes in kilometres → the twist:
in 1977 engineers doubted it and flew the fix switched off → the proof, numbers held on screen →
the payoff that answers the first line. Every claim: docs/sources.md.
"""

VOICE = "af_heart"
SPEED = 1.15
LEAD_IN = 0.25
TAIL = 2.2

BEATS = [
    {"id": "hook", "title": "Set wrong on purpose", "takes": [
        ("Every GPS satellite is launched with its clock set wrong. {p:0.3} On purpose.", 0.45),
    ]},
    {"id": "phone", "title": "Timing is position", "takes": [
        ("Your phone finds you by timing radio signals from satellites twenty thousand kilometres up.", 0.20),
        ("Light covers thirty centimetres in a billionth of a second.", 0.15),
        ("So a clock that's a billionth off puts you thirty centimetres off.", 0.35),
    ]},
    {"id": "einstein", "title": "Time runs fast up there", "speed": 1.05, "takes": [
        ("But Einstein showed that time doesn't tick at the same rate everywhere.", 0.30),
        ("Up there, gravity is weaker, so the clock runs fast, by about forty-five microseconds a day.", 0.35),
        ("It's also moving at almost four kilometres a second, which slows it down by about seven.", 0.35),
        ("Net result: thirty-eight microseconds fast. {p:0.25} Every single day.", 1.40),
    ]},
    {"id": "stakes", "title": "Eleven kilometres", "takes": [
        ("That sounds like nothing. But at the speed of light, it's more than eleven kilometres.", 0.25),
        ("Ignore it, and your blue dot drifts that far off in a single day.", 0.60),
    ]},
    {"id": "doubt", "title": "The off switch", "takes": [
        ("In 1977, not everyone believed it.", 0.25),
        ("So the Navy's test satellite, NTS-2, flew with the fix built in, {p:0.15} but switched off.", 0.30),
        ("They'd only turn it on if Einstein turned out to be right.", 1.00),
    ]},
    {"id": "proof", "title": "The verdict", "speed": 1.08, "takes": [
        ("For about twenty days, the clock ran uncorrected.", 0.30),
        ("Einstein's math predicted how fast it would run.", 0.25),
        ("The clock matched him to within one percent.", 1.10),
        ("They flipped the switch.", 1.30),
    ]},
    {"id": "payoff", "title": "Wrong on the ground, right in the sky", "takes": [
        ("Ever since, every GPS clock is tuned a hair slow before launch.", 0.25),
        ("Wrong on the ground, {p:0.15} so it's right in the sky.", 0.40),
        ("And every time that blue dot finds you, Einstein passes the test again.", 0.30),
    ]},
]

# Caption colour per spoken word: "k" = the key word of its sentence, in the key colour.
HIGHLIGHT = {
    "wrong": "k", "purpose": "k", "timing": "k", "thirty": "k", "billionth": "k",
    "einstein": "k", "fast": "k", "forty-five": "k", "seven": "k", "thirty-eight": "k",
    "eleven": "k", "drifts": "k", "1977": "k", "nts-2": "k", "switched": "k", "right": "k",
    "twenty": "k", "percent": "k", "flipped": "k", "slow": "k", "sky": "k", "test": "k",
}
