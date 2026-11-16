"""Narration script for “How Painkillers Work”.

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
SPEED = 1.07            # brisk: 1.05–1.10 (above 1.15 the consonants start to blur)
LEAD_IN = 0.30          # silence before the first word
TAIL = 2.60             # room after the last word for the end card

BEATS = [
    {
        "id": "hook",
        "title": "The myth",
        "takes": [
            ("Your painkiller knows where it hurts.", 0.22),
            ("It doesn't.", 0.75),
        ],
    },
    {
        "id": "why",
        "title": "Why it seems true",
        "takes": [
            ("It seems to.", 0.36),
            ("You swallow one, the ankle feels better, so the pill must have gone there.", 0.75),
        ],
    },
    {
        "id": "flood",
        "title": "The flood",
        "takes": [
            ("The pill dissolves and passes into your blood.", 0.36),
            ("Its level peaks within one to two hours. It sticks to blood proteins, so it mostly stays in the bloodstream.", 0.50),
            ("Blood reaches every organ, and the drug travels with it.", 0.75),
        ],
    },
    {
        "id": "factory",
        "title": "The factory",
        "takes": [
            ("Hurt tissue switches on an enzyme called COX-2. It makes prostaglandins.", 0.36),
            ("They make nerves more sensitive to the chemicals injury releases.", 0.50),
            ("Ibuprofen blocks both versions of that enzyme, everywhere it works.", 0.50),
            ("The sore ankle is where that enzyme is busiest, so the block removes the most there.", 0.75),
        ],
    },
    {
        "id": "cost",
        "title": "The cost",
        "takes": [
            ("The same block runs everywhere. {p:0.20} Your stomach makes its own prostaglandins to help guard its lining.", 0.40),
            ("Block it, and ulcers and bleeding can happen. The label calls them serious.", 0.50),
            ("Your kidneys use prostaglandins to keep blood flowing. In people with kidney problems, ibuprofen can cut that flow.", 0.75),
        ],
    },
    {
        "id": "breaks",
        "title": "Where the myth breaks",
        "takes": [
            ("Not every painkiller plays this game.", 0.40),
            ("Paracetamol, or acetaminophen, has almost no anti-inflammatory effect.", 0.36),
            ("It works mostly in the brain and spinal cord. Scientists still argue about exactly how.", 0.50),
            ("Opioids like morphine work largely through the nervous system.", 0.75),
        ],
    },
    {
        "id": "truth",
        "title": "The truth",
        "takes": [
            ("So it doesn't know where your pain is.", 0.40),
            ("It doesn't need to. The sore spot is just the busiest factory, and the pill shuts down every factory it reaches.", 0.75),
        ],
    },
]

# Caption colour per spoken word (lower case, as spoken). In this look the roles are:
#   "k" subject (ink-blue)  the drug and the mechanism words
#   "n" accent (vermilion)  numbers, quantities, superlatives
#   "m" data (violet)       organs, blood, body parts
#   "w" alert (red)         negation, warnings, limits
HIGHLIGHT = {
    # the drug and the mechanism
    "painkiller": "k", "ibuprofen": "k", "pill": "k", "enzyme": "k", "cox-2": "k",
    "prostaglandins": "k", "block": "k", "factory": "k",
    # numbers and quantities
    "one": "n", "two": "n", "hours": "n", "busiest": "n", "most": "n",
    "everywhere": "n", "almost": "n",
    # organs and body parts
    "blood": "m", "bloodstream": "m", "organ": "m", "stomach": "m", "kidneys": "m",
    "nerves": "m", "ankle": "m", "lining": "m", "brain": "m", "spinal": "m",
    # negation and warnings
    "doesn't": "w", "not": "w", "ulcers": "w", "bleeding": "w", "serious": "w",
    "problems": "w", "argued": "w",
}

# ---- optional, used only by docs/narration_script.md ---------------------------------
# Delivery note per beat.
DIRECTIONS = {
    "hook": "Certain and flat on *knows where it hurts*. Then a short, dry drop on *It doesn't.*",
    "why": "Conversational. Let *the pill must have gone there* sound like the obvious assumption it is.",
    "flood": "Factual and even. A small lift on *two hours*; steady through the blood sentences.",
    "factory": "Clear and deliberate. Say COX-2 plainly. Give *busiest* a little weight.",
    "cost": "Measured and a touch slower. *The label calls them serious* is flat and final.",
    "breaks": "Dry and careful. *mostly* and *largely* stay soft, not emphasised.",
    "truth": "Warm and final. *It doesn't need to.* is a short, relaxed close.",
}

# (term, say it as, note)
PRONUNCIATION = [
    ("COX-2", "cox two", "the enzyme's name, spoken as letters and a number"),
    ("prostaglandins", "pros-tuh-GLAN-dins", "a long word; check it in the voice check"),
    ("paracetamol", "par-uh-SEE-tuh-mol", "the name used in the research; acetaminophen is the US name"),
    ("ibuprofen", "eye-byoo-PROH-fen", "the drug"),
]

# What each number or strong claim in the narration rests on (see docs/sources.md §2).
ACCURACY_NOTES = [
    "*“within one to two hours”* — peak serum concentration in adults; Health Canada ibuprofen monograph (2005), p.1 and p.3 (source 1).",
    "*“sticks to blood proteins, so it mostly stays in the bloodstream”* — high plasma-protein binding and a small distribution volume (source 1, p.2). “Mostly stays” is our inference, not a measured figure.",
    "*“Hurt tissue switches on … COX-2”* — COX-2 is rapidly expressed in response to growth factors and pro-inflammatory cytokines, and rises in inflamed epithelium (source 6).",
    "*“make nerves more sensitive”* — the label: prostaglandins are believed to sensitise tissues to pain-producing mediators (source 1, p.1).",
    "*“blocks both versions of that enzyme”* — every available NSAID inhibits both COX-1 and COX-2 to varying degrees (source 2).",
    "*“the block removes the most there”* — inference: inhibition removes prostaglandin in proportion to enzyme activity. Not measured per tissue for ibuprofen.",
    "*“the stomach makes its own prostaglandins to help guard its lining”* — COX-1 is constitutive in the stomach, and PGE2 prevents NSAID-induced lesions in experimental models (source 7). Source 2 links COX-1 inhibition to ulcers.",
    "*“ulcers and bleeding can happen … the label calls them serious”* — serious GI toxicity, including ulceration and bleeding, sometimes fatal (source 1, p.5).",
    "*“kidney flow … in people with kidney problems”* — renal blood flow and filtration fell in mild renal impairment on 1,200 mg a day for a week (source 1, p.14).",
    "*“paracetamol … almost no anti-inflammatory effect … mostly in the brain and spinal cord … still argued over”* — source 8 (abstract and body text).",
    "*“opioids … work largely through the nervous system”* — morphine has central effects and can also act in the periphery (source 11). “Largely” is our reading of that abstract.",
    "*“Read the label … ask a pharmacist”* — the label's contraindications (active peptic ulcer; impaired kidney function) and dosing (source 1, p.5 and p.17).",
]
