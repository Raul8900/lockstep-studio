"""Narration script for “Why a Torn QR Code Still Scans”.

Story shape: build it from nothing (docs/creative_brief.md). Beats: the tear (hook), attempt one
(copies), attempt two (the curve), the new problem (the liar), the real design (bytes), its limits
(fine print), and the callback to the first tear (payoff).

Inline markers:
  {p:0.30}               make the pause at this point at least 0.30 s long
  [word](/IPA/)          pronunciation override

After any change here:  lockstep voice <video>   then   lockstep captions <video>
"""

VOICE = "af_bella"
SPEED = 1.08
LEAD_IN = 0.30          # silence before the first word
TAIL = 2.60             # room after the last word for the end card

BEATS = [
    {
        "id": "hook",
        "title": "The tear",
        "takes": [
            ("I just tore a chunk off this QR code. {p:0.30} It still scans.", 0.40),
            ("That's because most of it isn't your message at all.", 0.65),
        ],
    },
    {
        "id": "copies",
        "title": "Attempt one: copies",
        "takes": [
            ("So what's the rest? {p:0.20} A backup copy?", 0.30),
            ("Smudge one letter, and the two copies disagree.", 0.28),
            ("Which one's right? {p:0.20} Copies can't tell you.", 0.45),
            ("Reed-Solomon codes, from 1960, do something smarter.", 0.65),
        ],
    },
    {
        "id": "curve",
        "title": "Attempt two: the line",
        "takes": [
            ("Say your message is just two numbers.", 0.28),
            ("Two dots fix exactly one line.", 0.55),
            ("Now add extra dots on that same line.", 0.35),
            ("Tear any two away: the survivors still fix the line, and it puts the missing dots back.", 0.65),
        ],
    },
    {
        "id": "liar",
        "title": "The liar",
        "takes": [
            ("But a scanner can't see holes.", 0.25),
            ("To a scanner, a [tear](/tˈɛɹ/) looks like a wrong number.", 0.40),
            ("So which dot is lying? {p:0.22} The one that's off the line.", 0.40),
            ("Every liar costs two extra dots: {p:0.15} one finds it, one fixes it.", 0.65),
        ],
    },
    {
        "id": "bytes",
        "title": "The real code",
        "takes": [
            ("A QR code does the same trick, with bytes.", 0.30),
            ("This one has twenty-six bytes. {p:0.22} Nine are your message. {p:0.22} Seventeen are extra points.", 0.40),
            ("At two per liar, it can fix any eight. {p:0.20} About thirty percent.", 0.45),
            ("That's why a logo can sit in the middle. {p:0.20} It's damage, on purpose.", 0.65),
        ],
    },
    {
        "id": "fineprint",
        "title": "The fine print",
        "takes": [
            ("The catch: {p:0.15} that's thirty percent of the bytes, not of the paper.", 0.35),
            ("These three corner squares aren't protected at all. They're how the scanner finds the code.", 0.30),
            ("Tear into one, and this code won't scan.", 0.65),
        ],
    },
    {
        "id": "payoff",
        "title": "The first tear",
        "takes": [
            ("That first [tear](/tˈɛɹ/)? {p:0.15} It took six of the nine message bytes.", 0.30),
            ("The extra points rebuilt every one.", 0.45),
            ("A torn QR code isn't lucky. {p:0.20} It was built expecting to be torn.", 0.60),
        ],
    },
]

# Caption colour per spoken word (lower case, as spoken). Same roles as the picture:
#   "k" subject (blue)  = Reed-Solomon, the line, the extra points
#   "n" accent (pink)   = numbers
#   "m" data (orange)   = your message
#   "w" alert (red)     = damage, liars, limits
HIGHLIGHT = {
    "reed-solomon": "k", "line": "k", "extra": "k", "points": "k", "rebuilt": "k", "scans": "k",
    "two": "n", "1960": "n", "twenty-six": "n", "nine": "n", "seventeen": "n", "eight": "n",
    "thirty": "n", "percent": "n", "six": "n", "three": "n",
    "message": "m", "numbers": "m", "letter": "m",
    "tore": "w", "tear": "w", "torn": "w", "smudge": "w", "disagree": "w", "holes": "w", "wrong": "w",
    "lying": "w", "liar": "w", "damage": "w", "catch": "w", "won't": "w", "aren't": "w",
    "one": None, "one's": None,
}

# ---- optional, used only by docs/narration_script.md ---------------------------------
DIRECTIONS = {
    "hook": "Matter-of-fact, a little delighted. A clear stop before *It still scans*; the last line opens a question.",
    "copies": "Quick, almost dismissive of the obvious guess. *Which one's right?* is a real question; land *smarter*.",
    "curve": "Slow down. Let *exactly one line* sit before the extra dots arrive; the last take runs as one long, satisfying sentence.",
    "liar": "Conspiratorial on *can't see holes*; crisp on *one finds it, one fixes it*.",
    "bytes": "Counting: three even steps for 26 / 9 / 17, then the payoff *about thirty percent*; a wink on *on purpose*.",
    "fineprint": "Lower and firmer: this is the warning label.",
    "payoff": "Warm callback; the last sentence slows and lands on *torn*.",
}

# (term, say it as, note)
PRONUNCIATION = [
    ("Reed-Solomon", "REED SOL-uh-mun", "two surnames: Irving Reed and Gustave Solomon"),
    ("QR", "Q R", "letters"),
]

# What each number or strong claim in the narration rests on (cite docs/sources.md).
ACCURACY_NOTES = [
    "*“I just tore a chunk off … It still scans”* — the drawn code (version 1-H, “STILL HERE”) decodes with zxing-cpp torn exactly as shown (sources 4).",
    "*“most of it isn't your message”* — 9 of 26 bytes are message (35 %); by area the message is 72 of 441 modules (sources 2, 4).",
    "*“Copies can't tell you”* — with two copies that disagree there is no majority (reasoning; sources 9).",
    "*“Reed-Solomon codes, from 1960”* — Reed & Solomon, J. SIAM 8(2), 1960 (sources 5, 6).",
    "*“Two dots fix exactly one line … the survivors still fix the line”* — interpolation; any k points determine a polynomial of degree < k (sources 9).",
    "*“a scanner can't see holes”* — zxing-cpp corrects QR blocks with no erasure positions (sources 3).",
    "*“Every liar costs two extra dots”* — t errors need 2t check symbols (sources 9).",
    "*“twenty-six bytes … Nine … Seventeen … fix any eight … About thirty percent”* — version 1-H tables; 8 decode, 9 fail (measured); 8/26 = 30.8 %; level H nominal 30 % (sources 2, 4, 8).",
    "*“a logo … damage, on purpose”* — a blank 7 × 7-module centre still decodes (sources 4).",
    "*“thirty percent of the bytes, not of the paper”* — codewords cover 47 % of a version-1 symbol (sources 4).",
    "*“corner squares aren't protected … this code won't scan”* — function patterns carry no codewords; a 3.1 % tear through one: no decode in 0/80 random renders or any MP4 frame (sources 2, 4).",
    "*“It took six of the nine message bytes”* — the hook's tear changes codewords 0, 1, 2, 4, 5, 6 (message) and 11 (sources 4).",
]
