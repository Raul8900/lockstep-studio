"""Narration script for “__TITLE__”.

BEATS -> takes. A beat is one chapter of the video and owns one scene file
(scenes/sNN_<id>.js) and one entry in video.json "chapters". A take is the text the
voice records in one pass, followed by a pause in seconds: keep a take to one or two
sentences so the voice keeps natural prosody, and under roughly 45 words.

Inline markers:
  {p:0.30}               make the pause at this point at least 0.30 s long
  [NVIDIA](/ɛnvˈɪdiə/)   pronunciation override (IPA between the slashes)

After any change here:  lockstep voice <video>   then   lockstep captions <video>
"""

VOICE = "af_heart"      # run `lockstep voice <video> list` to see the others
SPEED = 1.0
LEAD_IN = 0.30          # silence before the first word
TAIL = 2.60             # room after the last word for the end card

BEATS = [
    {
        "id": "hook",
        "title": "Hook",
        "takes": [
            ("What makes an explainer impossible to scroll past?", 0.60),
        ],
    },
    {
        "id": "idea",
        "title": "The idea",
        "takes": [
            ("One idea at a time.", 0.45),
            ("Every picture lands on the exact word that names it. {p:0.30} Never before. {p:0.25} Never after.", 0.70),
        ],
    },
    {
        "id": "payoff",
        "title": "Payoff",
        "takes": [
            ("Say it and show it. {p:0.30} In lockstep.", 0.60),
        ],
    },
]

# Caption colour per spoken word (lower case, as spoken):
#   "k" cyan = the subject and its key terms    "n" amber = numbers, superlatives
#   "m" violet = data, memory, secondary nouns  "w" coral = limits, problems, negation
HIGHLIGHT = {
    "explainer": "k", "picture": "k", "word": "k", "lockstep": "k",
    "one": "n", "exact": "n",
    "idea": "m",
    "impossible": "w", "never": "w",
}

# ---- optional, used only by docs/narration_script.md ---------------------------------
# Delivery note per beat.
DIRECTIONS = {
    "hook": "A real question. Lift on *impossible*, let the last two words fall.",
    "idea": "Slow and plain. Two flat, separate beats on *Never before. Never after.*",
    "payoff": "Even and plain, then a clear stop before *In lockstep*.",
}

# (term, say it as, note)
PRONUNCIATION = [
    ("lockstep", "LOK-step", "one word"),
]

# What each number or strong claim in the narration rests on (cite docs/sources.md).
ACCURACY_NOTES = [
    "*“lands on the exact word”* — picture cues are read from the voice model's own word timings (25 ms resolution), not typed in by hand.",
]
