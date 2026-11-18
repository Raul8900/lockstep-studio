"""Narration script for “The Accident That Saved Millions”.

The accident shape (reference/story.md): an ordinary man, a mess, a strange result, a decade of
nothing, a desperate first patient, a rotten melon, millions of doses — and a warning that calls
back to the dirty dishes of the first line. About 190 words at 1.15: a little over a minute.
"""

VOICE = "af_heart"
SPEED = 1.15
LEAD_IN = 0.25
TAIL = 1.8

BEATS = [
    {"id": "hook", "title": "Dirty dishes", "takes": [
        ("In 1928, a scientist came back from holiday to a pile of dirty dishes.", 0.20),
        ("One of them was about to change the world.", 0.30),
    ]},
    {"id": "plate", "title": "The plate", "takes": [
        ("A fuzzy mould had landed on it.", 0.15),
        ("And all around the mould, the bacteria were dead.", 0.35),
    ]},
    {"id": "burst", "title": "Why they die", "takes": [
        ("Here's why.", 0.10),
        ("A bacterium lives inside a wall it keeps rebuilding as it grows.", 0.15),
        ("The mould's chemical jams the builders.", 0.15),
        ("The wall cracks, {p:0.15} and the bacterium bursts.", 0.40),
    ]},
    {"id": "shelf", "title": "Ignored", "takes": [
        ("Fleming called it penicillin.", 0.15),
        ("But he could barely make any, and for ten years, almost nobody paid attention.", 0.35),
    ]},
    {"id": "oxford", "title": "The first patient", "takes": [
        ("Then, in Oxford, a team finally purified it.", 0.15),
        ("Their first real test was a dying policeman.", 0.15),
        ("Within days, he was getting better.", 0.15),
        ("Then the penicillin ran out.", 0.30),
    ]},
    {"id": "urine", "title": "Desperate", "takes": [
        ("They were so desperate, they pulled it back out of his urine to use it again.", 0.20),
        ("It wasn't enough. {p:0.20} He died.", 0.45),
    ]},
    {"id": "melon", "title": "The melon", "takes": [
        ("So the hunt moved to America, where the best penicillin mould they ever found turned up on a rotten cantaloupe from a market in Illinois.", 0.30),
    ]},
    {"id": "dday", "title": "D-Day", "takes": [
        ("By D-Day, there were millions of doses.", 0.35),
    ]},
    {"id": "warning", "title": "The warning", "takes": [
        ("Fleming warned that if we misused it, bacteria would learn to resist it.", 0.15),
        ("He was right.", 0.30),
        ("The next miracle might already be growing in someone's dirty dishes.", 0.60),
    ]},
]

HIGHLIGHT = {
    "dishes": "k", "mould": "k", "dead": "k", "bursts": "k", "penicillin": "k", "policeman": "k",
    "urine": "k", "cantaloupe": "k", "millions": "k", "resist": "k", "miracle": "k",
}
