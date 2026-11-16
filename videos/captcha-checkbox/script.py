"""Narration script for “The 'I'm not a robot' box”.

BEATS -> takes. A beat is one chapter of the video and owns one scene file
(scenes/sNN_<id>.js) and one entry in video.json "chapters". A take is the text the
voice records in one pass, followed by a pause in seconds: keep a take to one or two
sentences so the voice keeps natural prosody, and under roughly 45 words.

Inline markers:
  {p:0.30}               make the pause at this point at least 0.30 s long
  [NVIDIA](/ɛnvˈɪdiə/)   pronunciation override (IPA between the slashes)

Every factual claim below is traced to docs/sources.md (row numbers in ACCURACY_NOTES).
Research was done from search excerpts; see the access note in docs/sources.md.

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
            ("You tap a box that says you're not a robot.", 0.40),
            ("Researchers say the test started before your finger got there.", 0.75),
        ],
    },
    {
        "id": "old",
        "title": "The old test",
        "takes": [
            ("For years, the test was reading wobbly letters.", 0.45),
            ("In 2013, Google said its risk analysis covers everything you do around a challenge, not only the answer you type.", 0.60),
            ("In 2014, the checkbox arrived, and many people passed with one click.", 0.75),
        ],
    },
    {
        "id": "click",
        "title": "The tap",
        "takes": [
            ("The click feels like the test. {p:0.25} It's really a request for a verdict.", 0.50),
            ("The evidence was gathered around it. If it looks human, you pass. If it can't tell, you get a puzzle.", 0.75),
        ],
    },
    {
        "id": "watch",
        "title": "What it watches",
        "takes": [
            ("So what does it watch? Google doesn't publish the full list.", 0.45),
            ("A 2021 survey describes the checkbox recording cursor movement, where you click, and how long the pointer hovers.", 0.45),
            ("It also records browser details and cookies. Google's own FAQ calls a cookie essential to that analysis.", 0.75),
        ],
    },
    {
        "id": "cursor",
        "title": "The cursor",
        "takes": [
            ("A real hand never moves at one steady speed.", 0.35),
            ("It speeds up, peaks, and eases into the target.", 0.50),
            ("In 1985, Flash and Hogan modeled arm movement this way: a smooth, bell-shaped curve of speed.", 0.55),
            ("One published detector checks cursor paths against a model like that.", 0.60),
            ("In a 2024 study of [reCAPTCHA](/ɹiːkˈæptʃə/) version two, any cursor movement cut the number of puzzles needed to pass.", 0.45),
            ("Straight paths and curved ones were not significantly different.", 0.45),
            ("So is it the wobble? {p:0.20} Google doesn't say.", 0.75),
        ],
    },
    {
        "id": "browser",
        "title": "The browser",
        "takes": [
            ("Then there's the browser.", 0.40),
            ("A 2024 study reports that cookies and browsing history carry substantial weight in whether a visitor seems human.", 0.55),
            ("Browsing history is what researchers report. Google hasn't confirmed it.", 0.75),
        ],
    },
    {
        "id": "score",
        "title": "The score",
        "takes": [
            ("Version three has no checkbox at all.", 0.40),
            ("It returns a score from zero to one. One means very likely a good interaction. Zero means very likely a bot.", 0.55),
            ("Each site sets its own cutoff, and Google suggests starting at 0.5.", 0.55),
            ("But a score can be pushed. In 2019, researchers trained an AI agent to move and click in a simulator they built.", 0.45),
            ("It reached a score of 0.9, about 97% of the time. The simulator isn't the live site.", 0.75),
        ],
    },
    {
        "id": "limits",
        "title": "The limits",
        "takes": [
            ("A 2023 study ran for thirteen months with more than 3,600 people.", 0.45),
            ("Its authors judged the checkbox costly, with close to no security gain, and say it should be retired.", 0.70),
            ("Nobody outside Google knows how the signals are weighted. So every study tests from the outside.", 0.75),
        ],
    },
    {
        "id": "payoff",
        "title": "The takeaway",
        "takes": [
            ("So the tap is the last step, not the test.", 0.70),
            ("It cares how you got there.", 0.80),
        ],
    },
]

# Caption colour per spoken word (lower case, as spoken):
#   "k" cyan = the subject and its key terms    "n" amber = numbers, superlatives
#   "m" violet = data, memory, secondary nouns  "w" coral = limits, problems, negation
HIGHLIGHT = {
    # cyan: the subject
    "checkbox": "k", "cursor": "k", "click": "k", "verdict": "k", "test": "k", "score": "k",
    "recaptcha": "k", "detector": "k", "tap": "k",
    # amber: numbers
    "thirteen": "n", "3,600": "n", "97": "n", "0.5": "n", "0.9": "n",
    "2013": "n", "2014": "n", "2019": "n", "2021": "n", "2023": "n", "2024": "n", "1985": "n",
    "zero": "n", "one": "n", "two": "n", "three": "n",
    # violet: data
    "cookies": "m", "cookie": "m", "history": "m", "browser": "m", "browsing": "m",
    "signals": "m", "months": "m",
    # coral: limits and negation
    "not": "w", "never": "w", "nobody": "w", "doesn't": "w", "isn't": "w", "can't": "w",
    "puzzle": "w", "puzzles": "w", "costly": "w", "wobble": "w",
}

# ---- optional, used only by docs/narration_script.md ---------------------------------
# Delivery note per beat.
DIRECTIONS = {
    "hook": "Flat and even, like a fact. Let *got there* land, then a clear stop.",
    "old": "Storytelling pace, one date per sentence. Slight lift on *one click*.",
    "click": "Slow. Pause hard after *test* so *request for a verdict* lands as the correction.",
    "watch": "Even and factual. Pause before *Google's own FAQ*, which is the turn.",
    "cursor": "The longest beat. Slower on *never moves at one steady speed* and on *bell-shaped*. Then flat on *Google doesn't say.*",
    "browser": "Quiet. The contrast in the last take is the point: *what researchers report* against *Google hasn't confirmed*.",
    "score": "Brisk on the numbers. Slow on *about 97%*, then a clear stop before *The simulator*.",
    "limits": "Measured and neutral. No judgment in the voice; the authors make the judgment, not the narrator.",
    "payoff": "Quiet and even. Two short takes. A pause before *It cares*, then let *how you got there* land.",
}

# (term, say it as, note)
PRONUNCIATION = [
    ("reCAPTCHA", "ree-KAP-chuh", "the brand name; stress on KAP. Overridden inline."),
    ("Hogan", "HOH-gun", "surname"),
]

# What each number or strong claim in the narration rests on (rows of docs/sources.md).
ACCURACY_NOTES = [
    "*“covers everything you do around a challenge”* (2013) — row 1: Google's 2013 post, paraphrased from a search excerpt.",
    "*“many people passed with one click”* (2014) — row 2: Google's 2014 launch post; the wording is a paraphrase.",
    "*“It's really a request for a verdict.”* — row 8: the click is among the data passed to the risk engine; row 2: the verdict falls back to a puzzle when unclear.",
    "*“If it can't tell, you get a puzzle.”* — row 2 (falls back to a puzzle when unsure) and row 8 (an image challenge follows when a visitor is not cleared).",
    "*“Google doesn't publish the full list.”* — rows 1–4 contain no full signal list or weights; row 8 says the same of the checkbox.",
    "*“recording cursor movement, where you click, and how long the pointer hovers”* — row 8, a 2021 survey's description. Not Google's own statement.",
    "*“Google's own FAQ calls a cookie essential”* — row 4: the FAQ treats `_GRECAPTCHA` as essential to the risk analysis.",
    "*“A real hand never moves at one steady speed … bell-shaped curve of speed”* — row 10: Flash and Hogan's 1985 model of human reaching, with a smooth bell-shaped speed profile.",
    "*“One published detector checks cursor paths against a model like that”* — row 9: BeCAPTCHA-Mouse, a detector built on neuromotor-model features. Its data come from puzzle drags, not checkbox clicks; the screen says so.",
    "*“any cursor movement cut the number of puzzles needed to pass”* and *“Straight paths and curved ones were not significantly different”* — row 6: the 2024 test; the straight-versus-curved comparison has t = 0.58, p = 0.57.",
    "*“cookies and browsing history carry substantial weight”* — row 6: the authors' own report. *“Google hasn't confirmed it”* — no Google statement found in rows 1–4.",
    "*“Version three has no checkbox”*, *“one means very likely a good interaction, zero means very likely a bot”* — row 3: the v3 documentation.",
    "*“Google suggests starting at 0.5”* — row 3: Google's suggested starting cutoff; sites tune their own.",
    "*“In 2019 … about 97% of the time”* — row 5: 97.4% and 96.7% success on the simulated grids. The simulator is the authors' own.",
    "*“more than 3,600 people … thirteen months”* — row 7: a 13-month live study with more than 3,600 participants at one large public university.",
    "*“costly, with close to no security gain … say it should be retired”* — row 7: the authors' own judgment and their call for reCAPTCHAv2 to be retired.",
]
