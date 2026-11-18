# The story and the script

Five successful science and history shorts were studied frame by frame and line by line (53–101
seconds each; tens of millions of views between them). None of them is a lecture. Each one tells
a story, fast, and every sentence has a picture. This file is what they do, as rules you can
follow; reference/shots.md is how they look.

## What the references do

- **They open on a mystery or a claim that sounds wrong**, in the first sentence, with the picture
  already showing it: an object no one recognises, a number that seems impossible, a person in
  trouble, "you" in a situation. No greeting, no title, no "did you know".
- **They have a protagonist.** A named person, an object, an animal, or the viewer ("you are
  standing in…"). The facts happen *to* someone.
- **They escalate.** Every 8–15 seconds the stakes rise or the story turns: "but there was a
  problem", "and it gets stranger", "that's when…". A video that only adds facts flattens out.
- **They end on a payoff that calls back to the first line** — the mystery answered, the number
  explained, the twist that reframes the start, or the present-day consequence ("…and we still do
  it today"). No summary, no "so in conclusion", no call to like and subscribe.
- **They talk fast and never stop.** 200–220 spoken words a minute, pauses of 0.1–0.3 s between
  sentences, a longer beat (0.5 s) only before a reveal. Continuous narration over continuous
  pictures: there is no silent title card anywhere.
- **Their sentences are short and concrete.** 5–14 words; one idea each; nouns you can photograph;
  numbers said the way people say them ("almost four centimetres", not "3.78 cm").

## Shapes that work

Choose the one that fits the material you found in research; the angle usually decides it.

| Shape | How it runs | Fits |
|---|---|---|
| **The accident** | Someone ordinary → something goes wrong or strange → they notice → it changes everything → the twist (it nearly didn't; they were ignored; it backfired) | discoveries, inventions, history |
| **"You"** | Put the viewer inside the situation, present tense → what happens to your body / your money / your city, second by second → the moment it turns → what saves you or doesn't | biology, survival, disasters, physics of the everyday |
| **The case** | A mystery object or event → the obvious explanation (wrong) → the clue → the real explanation → it gets stranger → the answer, and why it matters | mysteries, "why does X", how-it-works with a surprise |
| **The countdown** | A scale, step by step, each bigger or stranger than the last → the last one breaks the pattern | scales, rankings, timelines, "what if" |
| **Then and now** | A picture of the past → what people believed → the person who doubted it → the proof → the present day, calling back to the first picture | history of science, places, technology |

Explanations of mechanisms still fit: the mechanism is the middle of the story, told as a
sequence of physical events that happen to the protagonist ("the mould leaks a chemical; the
bacteria try to build their walls; the walls fail; they burst"), never as a list of properties.

## Hooks

Write three; keep the one whose picture and line both land inside two seconds and open a question
the video answers.

- **The claim that sounds wrong:** "The Moon is slowly running away from us."
- **The impossible number:** "Your body makes about two million red blood cells every second."
- **"You":** "You have about fifteen seconds before you pass out."
- **The object:** "This rusty box on the Moon is still in use." (the picture: the box)
- **The person in trouble:** "In 1970, three astronauts heard a bang, two hundred thousand miles from home."

Avoid: a question the viewer can answer with "no" ("Have you ever wondered…?"), a definition, the
topic's name alone, a slow establishing shot, a promise ("In this video…").

## Writing the script

- One sentence, one picture. Read the script against the shot plan: a sentence with no picture is
  cut or rewritten until it has one.
- Lead with the concrete: "Fleming came back from holiday to a sink of dirty dishes" beats
  "Penicillin was discovered by accident".
- Say numbers once, rounded, with a comparison when it helps ("as long as your fingernail grows in
  a month").
- Turns are signposted in a few words: "But.", "Then.", "And it gets worse.", "Here's the thing."
  — once per turn, never as filler.
- Every claim traces to `docs/sources.md`. Simplify, never falsify: if a metaphor breaks, the
  script says so in five words.
- The last line pays off the first. Read the two side by side.

### Length and pace

| Target length | Spoken words (at ~200 wpm) |
|---|---|
| 30 s | 95–105 |
| 45 s | 140–155 |
| 60 s | 190–210 |
| 90 s | 285–310 |

`SPEED` 1.1–1.2 in `script.py` gives 190–210 words a minute with the best voice (`af_heart`).
Pauses after takes: 0.15–0.35 s; 0.5 s only before a reveal. `lockstep voice` prints each beat's
length; `docs/production_report.md` measures the words a minute.

### `script.py`

```python
VOICE = "af_heart"   # or "af_bella" — the only voices offered: the rest sound synthetic
SPEED = 1.15
BEATS = [
    {"id": "hook", "title": "The accident", "takes": [
        ("In 1928, a scientist came back from holiday to a sink full of dirty dishes.", 0.25),
    ]},
    ...
]
HIGHLIGHT = {"mould": "k", "dishes": "k"}   # the key word of a sentence, in the caption's key colour
```

- A beat is a stretch of the story with its own scene file; a take is one or two sentences the
  voice records in one pass (natural prosody needs whole sentences).
- `{p:0.3}` inside a take forces a pause; `[word](/IPA/)` fixes a pronunciation.
- `HIGHLIGHT`: one key word per sentence at most — the word the sentence is about.
- After any change: `lockstep voice <slug>` then `lockstep captions <slug>`.

### Captions

Two to four words a phrase, cut where a speaker would breathe; a number stays with its unit; a
name stays whole. `lockstep captions <slug> --draft` drafts them; edit by hand.

## The brief

`docs/creative_brief.md` holds the decisions, in this order: audience and promise; five candidate
angles and the one kept; the story with its beats; three hooks and the one kept; the world and the
hero (reference/shots.md); the shot plan with the media search for every shot; the look; sound and
voice; what would make it fail. `lockstep brief <slug>` checks that every section is written.
