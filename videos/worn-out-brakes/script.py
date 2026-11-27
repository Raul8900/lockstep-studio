"""Narration script for "Worn-Out Brakes" (how a plane stops after landing).

Shape: a test that sounds insane (hook) -> what normally stops you: spoilers, reversers, carbon
brakes (brisk) -> the test takes the help away (escalation) -> the heat, numbers held on screen ->
the five-minute rule and the verdict -> payoff that loops into the first line.
Every claim: sources.md.
"""

VOICE = "af_heart"
SPEED = 1.15
LEAD_IN = 0.25
TAIL = 0.6   # short tail: the last line runs straight back into the first

BEATS = [
    {"id": "hook", "title": "Worn out on purpose", "takes": [
        ("To certify a new jet, Boeing grinds its brakes down until they're worn out. {p:0.2} Then it tries to stop the plane with them.", 0.40),
    ]},
    {"id": "normal", "title": "Three things stop you", "takes": [
        ("Normally, three things stop you.", 0.10),
        ("Panels on the wings pop up and dump the lift, pressing the plane onto its wheels.", 0.15),
        ("The engines roar into reverse.", 0.15),
        ("But the real work is done by carbon brakes, turning your speed into heat.", 0.40),
    ]},
    {"id": "test", "title": "Take the help away", "speed": 1.08, "takes": [
        ("The test takes the help away.", 0.15),
        ("Maximum weight. {p:0.15} Brakes worn to the last two percent. {p:0.15} No reverse thrust.", 0.45),
        ("A seven thirty-seven hits three hundred and thirty-three kilometres an hour, then slams the brakes.", 0.45),
    ]},
    {"id": "heat", "title": "1,370 degrees", "takes": [
        ("That's three hundred and eighty-five megajoules, poured mostly into four brakes.", 0.20),
        ("They pass thirteen hundred and seventy degrees.", 0.85),
        ("Plugs in the wheels melt on purpose, letting the air out before the tyres burst.", 0.80),
    ]},
    {"id": "rule", "title": "Five minutes", "takes": [
        ("Then nobody touches it for five minutes, the time fire crews take to arrive.", 0.30),
        ("All four brakes held.", 0.70),
    ]},
    {"id": "payoff", "title": "Loop", "takes": [
        ("So the brakes under your seat have survived worse than any landing. {p:0.2} Because to certify a new jet,", 0.0),
    ]},
]

HIGHLIGHT = {
    "worn": "k", "brakes": "k", "three": "k", "wheels": "k", "reverse": "k", "carbon": "k",
    "heat": "k", "maximum": "k", "two": "k", "333": "k", "slams": "k", "megajoules": "k",
    "celsius": "k", "melt": "k", "five": "k", "held": "k", "worse": "k", "certify": "k",
}
