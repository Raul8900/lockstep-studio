"""Narration script for “How Bluetooth Works”.

Shape (docs/creative_brief.md): myth → truth opening, then the line's stations — the band, the
hop, the code, the clash, the café — and a payoff back in the carriage with a twist.
Pacing: brisk. Pauses 0.22–0.32 s inside a thought, 0.45–0.55 s between thoughts,
0.65–0.75 s at beat changes.

After any change here:  lockstep voice <video>   then   lockstep captions <video>
"""

VOICE = "bf_emma"       # British English: a calm, station-announcement register (not an imitation of any real one)
SPEED = 1.06            # brisk: 1.05–1.10 (above 1.15 the consonants start to blur)
LEAD_IN = 0.30          # silence before the first word
TAIL = 2.80             # room after the last word for the end card

BEATS = [
    {
        "id": "hook",
        "title": "The question",
        "takes": [
            ("Rush hour: forty people in this carriage are streaming music over the same slice of radio.", 0.36),
            ("So why don't you ever hear your neighbour's?", 0.70),
        ],
    },
    {
        "id": "myth",
        "title": "No private line",
        "takes": [
            ("You might think pairing gives your earbuds a private channel, like an invisible wire.", 0.30),
            ("There's no such thing. {p:0.22} Yours share every channel with everyone in here.", 0.68),
        ],
    },
    {
        "id": "band",
        "title": "One band",
        "takes": [
            ("It's one band, at two point four gigahertz, shared with café Wi-Fi and even microwave ovens.", 0.34),
            ("Classic Bluetooth slices it into seventy-nine channels.", 0.66),
        ],
    },
    {
        "id": "hop",
        "title": "The hop",
        "takes": [
            ("And it never stays on one. It jumps channel up to sixteen hundred times a second.", 0.45),
            ("The jumps look random, but they follow a timetable your phone works out from its address and its clock.", 0.36),
            ("Your earbuds work out the same one, so they're always listening in the right place at the right moment.", 0.70),
        ],
    },
    {
        "id": "code",
        "title": "The code",
        "takes": [
            ("Still, someone else's packet will sometimes land on your channel.", 0.30),
            ("So every packet starts with a name tag: a code made from your phone's address.", 0.32),
            ("Your earbuds only open up for that code. Your neighbour's music carries a different one.", 0.70),
        ],
    },
    {
        "id": "clash",
        "title": "The clash",
        "takes": [
            ("And sometimes two packets hit the same channel at the same instant.", 0.28),
            ("Bluetooth's own rulebook calls that a strong likelihood.", 0.42),
            ("They garble each other. Your earbuds don't confirm, so your phone sends it again on the next hop, milliseconds later.", 0.34),
            ("And a fraction of a second of music waits in reserve, so you don't hear the gap.", 0.70),
        ],
    },
    {
        "id": "cafe",
        "title": "The café",
        "takes": [
            ("Cafés add a bigger problem: Wi-Fi doesn't hop. A network camps on about twenty of those channels.", 0.36),
            ("So your phone keeps score. Channels that keep failing are dropped from the timetable, though it always keeps at least twenty.", 0.72),
        ],
    },
    {
        "id": "payoff",
        "title": "Terminus",
        "takes": [
            ("So your earbuds never had a private line.", 0.26),
            ("They have their own timetable, a name tag and a second chance, up to sixteen hundred times a second.", 0.50),
            ("And if you do want your neighbour's song? Newer Bluetooth can share one stream with any number of earbuds.", 0.40),
        ],
    },
]

# Caption colour per spoken word (lower case, as spoken) — the same roles as the pictures:
#   "k" subject (line blue) = Bluetooth's mechanism   "n" accent (orange) = numbers, the neighbour's link
#   "m" data (violet) = time: the clock, the timetable  "w" alert (red) = collisions, interference, the myth
HIGHLIGHT = {
    "radio": "k", "band": "k", "bluetooth": "k", "bluetooth's": "k", "channel": "k", "channels": "k",
    "hop": "k", "jumps": "k", "code": "k", "tag": "k",
    "forty": "n", "seventy-nine": "n", "sixteen": "n", "hundred": "n", "twenty": "n", "two": "n", "four": "n",
    "neighbour's": "n", "gigahertz": "n",
    "timetable": "m", "clock": "m", "address": "m", "instant": "m", "milliseconds": "m", "reserve": "m",
    "private": "w", "garble": "w", "problem": "w", "wi-fi": "w", "failing": "w", "likelihood": "w",
}

# ---- used by docs/narration_script.md ---------------------------------------------------
DIRECTIONS = {
    "hook": "Matter-of-fact, like a platform announcement; a real question at the end, lifting on *neighbour's*.",
    "myth": "Set up the wire warmly, then flat and certain on *There's no such thing*.",
    "band": "Brisk and plain; a small smile on *even microwave ovens*.",
    "hop": "Lift on *sixteen hundred*; slow, even and clear through the timetable sentence.",
    "code": "Quiet and practical; the last line lands on *different one*.",
    "clash": "Slightly drier and faster; a beat before *strong likelihood*; relieved on the last line.",
    "cafe": "Brisk; *keeps score* is the turn.",
    "payoff": "Warm summary, then a playful question and a bright last line.",
}

PRONUNCIATION = [
    ("gigahertz", "GIG-uh-hurts", "British stress on the first syllable"),
    ("café", "KAF-ay", ""),
    ("Wi-Fi", "WHY-fye", ""),
]

ACCURACY_NOTES = [
    "*“forty people in this carriage”* — a picture of a crowded carriage, not a measurement (sources.md, simplifications).",
    "*“the same slice of radio … two point four gigahertz, shared with café Wi-Fi and even microwave ovens”* — Bluetooth operates in the 2.4 GHz ISM band, 2400–2483.5 MHz (Core Spec Vol 2 Part A §2); 2.4 GHz Wi-Fi channels lie in the same band (Intel); ovens run at about 2,450 MHz (USDA FSIS).",
    "*“There's no such thing … Yours share every channel with everyone in here”* — every BR/EDR link hops pseudo-randomly through all 79 RF channels (Vol 2 Part B §2.2.2); nothing reserves a channel for one link.",
    "*“seventy-nine channels”* — f = 2402 + k MHz, k = 0…78, 1 MHz apart (Vol 2 Part A Table 2.1). Classic (BR/EDR); Bluetooth LE uses 40 × 2 MHz (named on screen).",
    "*“up to sixteen hundred times a second”* — “The maximum hop rate is 1600 hops per second in the Connection state” (Vol 2 Part B §2.1); multi-slot packets stay on one channel, so the real rate is often lower.",
    "*“a timetable your phone works out from its address and its clock”* — “determined by the Bluetooth clock and BD_ADDR of the Central” (§2.2.2). Usually the phone is the Central; roles can be switched.",
    "*“Your earbuds work out the same one”* — the Central's clock is communicated to the Peripherals, which add an offset to synchronise (§2.2.2).",
    "*“someone else's packet will sometimes land on your channel … every packet starts with … a code made from your phone's address”* — the channel access code begins every packet and is derived from the LAP of the Central's address; the spec introduces it to mitigate collisions with independent devices (§1.3, §2).",
    "*“Your earbuds only open up for that code”* — the access correlator searches for the correct channel access code; without a trigger the receiver may sleep until the next RX event (§2.2.5.1).",
    "*“Bluetooth's own rulebook calls that a strong likelihood”* — Vol 2 Part B §2: “there is a strong likelihood of two independent Bluetooth devices having their transceivers tuned to the same RF carrier, resulting in a physical channel collision.”",
    "*“They garble each other”* — the case shown; a much stronger signal can survive an interferer (co-channel C/I 11 dB, Vol 2 Part A §4.1.2).",
    "*“sends it again on the next hop, milliseconds later”* — on a NAK “the same payload is retransmitted at the next TX occasion” (§7.6), 1.25–3.75 ms later depending on packet length; each packet's channel comes from the clock at its first slot.",
    "*“a fraction of a second of music waits in reserve”* — headphones buffer audio “to allow time for retransmissions of any missed or dropped data packets”; typical A2DP latency is around 150 ms (Bose, US 10,705,793).",
    "*“Wi-Fi doesn't hop. A network camps on about twenty of those channels”* — a 2.4 GHz Wi-Fi channel is 20 MHz wide (channel 1 = 2402–2422 MHz, Intel) and stays put = about 20 Classic Bluetooth channels.",
    "*“your phone keeps score … dropped from the timetable … always keeps at least twenty”* — AFH: channels classified bad when a throughput-failure measure exceeds a threshold; the adapted hop sequence uses N ≥ N_min = 20 channels (§8.6.8, §2.3.1).",
    "*“Newer Bluetooth can share one stream with any number of earbuds”* — LE Audio broadcast (Auracast): “an unlimited number of audio sink devices” (Bluetooth SIG); LE Isochronous Channels arrived in Core 5.2. Needs a phone and earbuds that support it.",
]
