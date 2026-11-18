"""Narration script for “__TITLE__”.

BEATS -> takes. A beat is one stretch of the story and owns one scene file
(scenes/sNN_<id>.js). A take is the text the voice records in one pass, followed by a pause
in seconds: keep a take to one or two sentences so the voice keeps natural prosody.

Write it the way the short-form references talk: a hook that opens a question in the first
line, one idea per sentence, plain words, short pauses (0.15-0.4 s), and a last line that pays
the first one off. 190-210 words a minute (SPEED 1.1-1.2).

Inline markers:
  {p:0.30}               make the pause at this point at least 0.30 s long
  [NVIDIA](/ɛnvˈɪdiə/)   pronunciation override (IPA between the slashes)

After any change here:  lockstep voice <video>   then   lockstep captions <video>
"""

VOICE = "af_heart"      # `lockstep voice <video> list`: only the best-graded voices are offered
SPEED = 1.15
LEAD_IN = 0.25          # silence before the first word
TAIL = 1.40             # room after the last word

BEATS = [
    {
        "id": "hook",
        "title": "The Moon is leaving",
        "takes": [
            ("The Moon is slowly running away from us.", 0.30),
        ],
    },
    {
        "id": "drift",
        "title": "Four centimetres a year",
        "takes": [
            ("Every year it drifts almost four centimetres further out, pushed by the tides it raises on Earth.", 0.30),
        ],
    },
    {
        "id": "proof",
        "title": "Mirrors on the Moon",
        "takes": [
            ("How do we know? {p:0.15} Apollo astronauts left mirrors up there.", 0.20),
            ("And we still fire lasers at them.", 0.30),
        ],
    },
]

# Caption colour per spoken word (lower case, as spoken): "k" = the key word, in the key colour.
# One or two per sentence at most: the word the sentence is about.
HIGHLIGHT = {
    "running": "k", "four": "k", "tides": "k", "mirrors": "k", "lasers": "k",
}
