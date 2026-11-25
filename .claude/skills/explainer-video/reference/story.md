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
- **They move fast through what is easy and slow down for what matters.** Setup lines (who,
  when, where, a number) run at 200–220 spoken words a minute with pauses of 0.1–0.3 s. The
  explanation goes a step at a time, each step seen before the next is said. When the real thing
  appears — the footage, the reveal — the voice stops for a second or two and lets it play. There
  is never a dead picture: a held moment is one where the picture is doing something worth watching.
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

## Pacing: the time goes where the attention is

A short is short, but it must never feel rushed. The pace is decided **per beat**, not once for
the whole video: fix the total length first, then share it out by what each beat has to do. A beat
that needs the viewer's attention gets more time; it is paid for by tightening the setup, **not by
making the video longer**.

| Beat | Time on screen | How it is paced |
|---|---|---|
| Setup: who, when, where, a number | 3–6 s | brisk: one line, one picture; cut the words that only repeat the picture |
| The mechanism or explanation | 10–15 s | one step per sentence, each step seen happening before the next is said; a slightly slower voice (`"speed": 1.0–1.05` on the beat); a held moment at its peak |
| Real footage or a real photograph used as proof | footage 4–8 s, a photograph 2.5 s or more | one line introduces it, then the voice stops for 1–2 s while it plays; the clip runs its whole action (the deck falls, the rocket clears the tower), never cut off mid-movement |
| The twist or reveal | 4–8 s | a 0.5–1 s pause before the line; the picture changes on the word, then holds a moment |
| The payoff and last image | 5–8 s | the last line, then 1.5–2.5 s of the final picture still moving |

- **Held moments.** Two to four times in a minute, the narration pauses (1–2.5 s) while the picture
  carries the story: the real footage playing, the wall cracking at the peak of the mechanism, the
  reveal landing. The music comes up under it by itself (the mix ducks only under speech). This is
  not dead air: dead air is a still picture with nothing to look at.
- **Pay for it in the setup.** Every held second comes out of a beat that does not need it: a date
  said with its picture, a transition sentence ("and that's when things got strange") cut.
- **Explanations are not compressed.** If the mechanism does not fit in its time, cut a fact from
  elsewhere; never cram the explanation into fewer seconds or a faster voice.
- **How:** a longer pause after a take in `script.py` — `("This is the real film from that
  morning.", 1.8)` — holds the picture after the line; `{p:1.2}` holds inside a take; `"speed":
  1.0` on a beat slows that beat's voice only.
- **Check:** `lockstep voice` (and `lockstep pacing <slug>` at any time) prints every beat's length,
  words a minute and held time; compare it with the brief's Pacing plan. `lockstep lint` warns
  (`pacing`) when real footage is on screen under 4 s or talked over from start to end, or a real
  photograph is on screen under 2 s.

What went wrong before, so it does not again: in the Tacoma Narrows test the real 1940 film of the
twisting bridge was on screen for 2.3 s with narration over all of it, and no beat held at all; it
should have had about 6 s with a 1.5 s held moment, paid for by two seconds out of the hook and two
out of the "ribbon" setup — the same total length.

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

| Target length | Spoken words (with 4–6 s of held moments) |
|---|---|
| 30 s | 85–95 |
| 45 s | 130–145 |
| 60 s | 175–195 |
| 90 s | 265–290 |

`SPEED` 1.1–1.2 in `script.py` gives about 200 words a minute while speaking with the best voice
(`af_heart`); a beat can set its own (`"speed": 1.0` for the explanation). Pauses after takes:
0.15–0.35 s between sentences; 0.5–1 s before a reveal; 1–2.5 s where the picture should be watched
(Pacing, above). `lockstep voice` prints each beat's length, words a minute and held time
(`lockstep pacing <slug>` again later); `docs/production_report.md` measures the whole.

### `script.py`

```python
VOICE = "af_heart"   # or "af_bella" — the only voices offered: the rest sound synthetic
SPEED = 1.15
BEATS = [
    {"id": "hook", "title": "The accident", "takes": [
        ("In 1928, a scientist came back from holiday to a sink full of dirty dishes.", 0.25),
    ]},
    {"id": "burst", "title": "How it kills", "speed": 1.0, "takes": [   # the explanation: a little slower
        ("The bacteria keep building their walls.", 0.3),
        ("Penicillin jams the builders.", 0.3),
        ("The wall cracks, and the cell bursts.", 1.6),                 # held: the burst plays on its own
    ]},
    ...
]
HIGHLIGHT = {"mould": "k", "dishes": "k"}   # the key word of a sentence, in the caption's key colour
```

- A beat is a stretch of the story with its own scene file; a take is one or two sentences the
  voice records in one pass (natural prosody needs whole sentences). A beat's optional `"speed"`
  (0.9–1.3) overrides `SPEED` for that beat.
- `{p:0.3}` inside a take forces a pause; `[word](/IPA/)` fixes a pronunciation.
- `HIGHLIGHT`: one key word per sentence at most — the word the sentence is about.
- After any change: `lockstep voice <slug>` then `lockstep captions <slug>`.

### Captions

Two to four words a phrase, cut where a speaker would breathe; a number stays with its unit; a
name stays whole. `lockstep captions <slug> --draft` drafts them; edit by hand.

## The brief

`docs/creative_brief.md` holds the decisions, in this order: audience and promise; five candidate
angles and the one kept; the story with its beats; three hooks and the one kept; the world and the
hero (reference/shots.md); the shot plan with the media search for every shot; the pacing (each
beat's seconds and pace, the held moments, and which setup beats pay for them); the look; sound and
voice; what would make it fail. `lockstep brief <slug>` checks that every section is written.
