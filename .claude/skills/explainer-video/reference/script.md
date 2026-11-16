# Writing the narration (`script.py`)

The narration fixes the length, the pacing and every cue in the video. It is written after the
creative brief (creative-direction.md), in the story shape, pacing and tone the brief chose — not in
a default arc. Get it right before drawing anything: a script change after the scenes exist means
re-recording, and any cue word you removed breaks its scene.

## Length

The brief sets the length; choose the shortest that delivers the angle (story-formats.md). Words
for a target length, from the measured pacing presets (0.3 s lead-in and 2.6 s end card included):

| Finished length | calm (≈ 150 wpm) | brisk (≈ 163 wpm) | rapid (≈ 172 wpm) |
|---|---|---|---|
| 45 s | ≈ 105 | ≈ 115 | ≈ 120 |
| 60 s | ≈ 145 | ≈ 155 | ≈ 165 |
| 90 s | ≈ 215 | ≈ 235 | ≈ 250 |
| 150 s | ≈ 370 | ≈ 400 | ≈ 420 |

`bin/lockstep voice <slug>` prints the real length of every beat. If the total is over, cut
sentences. `SPEED` is a weak lever (1.1 is only 5 % shorter than 1.0) and above 1.15 the voice
starts to blur consonants; fewer words and shorter pauses are what make a video faster.

## Shape

The beats come from the brief's story shape and beat map. Whatever the shape:

- 3–10 beats. Each beat is one chapter: one scene file, one segment of the progress bar (if the
  style has one), one music mood.
- The first sentence must make sense with the sound off — it is also the first caption. No
  greeting, no "in this video", no channel intro.
- One idea per beat; the beat's last sentence turns toward the next.
- If an analogy carries the explanation, use one and keep it (unless the format *is* the analogy
  world); make sure it is true to the mechanism, and say where it breaks.
- If the topic has real limits, give them a beat: it is what makes the rest credible.
- The last line pays off the hook — answers its question, removes its quotation marks, or loops
  back to its first image.

Before recording, check the script against the brief's beat map: if it has drifted back to
"hook → contrast → mechanism → limits → payoff" when the brief chose a different shape, rewrite it.

## Style

- Spoken English. Contractions. Sentences under 18 words; one idea per sentence.
- Concrete nouns and verbs you can draw. If you cannot say what is on screen during a sentence,
  rewrite or cut the sentence.
- Numbers: few, round, and attributed ("a flagship card has…"). Spell numbers out as words
  (`"thirty-two"`, `"twenty thousand"`): the caption shows the text as written and the cue key is
  predictable. If you do use digits, run `lockstep words` to see how they were split.
- Hedge honestly with one word ("often", "mostly", "roughly") rather than overclaiming.
- No filler ("basically", "essentially", "let's dive in"), no sign-off asking for likes unless
  the user wants a call to action.
- Rhythm devices that survive text-to-speech well: contrast pairs ("A CPU is built for
  decisions. A GPU makes the opposite bet."), a list of three, a short flat sentence after a long
  one ("Zero cost.").

## Format

```python
VOICE = "af_heart"; SPEED = 1.0
LEAD_IN = 0.30     # silence before the first word
TAIL = 2.60        # after the last word: the end card

BEATS = [
    {"id": "hook", "title": "Hook", "takes": [
        ("This chip has over twenty thousand cores.", 0.34),      # (text, pause after it in seconds)
        ("And not one of them can think for itself.", 0.38),
        ("That's exactly why it's so fast.", 0.75),
    ]},
    ...
]
```

- **Beat `id`**: lower-case identifier. It names the scene (`addScene('hook', …)`), the chapter in
  `video.json`, and the first argument of every `at('hook', …)`.
- **Take**: what the voice records in one pass. One or two sentences, at most about 45 words (the
  model's limit is 510 phonemes; over that the recorder stops with "take too long"). Sentences
  that belong together prosodically go in one take; a new thought starts a new take.
- **Pause after a take**: 0.28–0.40 s inside a thought, 0.45–0.60 s between thoughts, 0.70–0.80 s
  at the end of a beat (the scene change happens in this gap — under 0.6 s feels rushed).
- **`{p:0.30}`** inside a take forces a pause of at least that length at that point, e.g. before
  a punchline: `"It doesn't even run your program. {p:0.22} The CPU does."`
- A dash, colon or ellipsis in the text gives a short natural breath.
- **Pronunciation override**: `[NVIDIA](/ɛnvˈɪdiə/)` — IPA between the slashes. Needed when
  `check-voice` shows a name spelled out letter by letter or stressed wrongly. Acronyms that are
  meant to be spelled (CPU, GPU, AMD) are read correctly as written.

## Caption colours (`HIGHLIGHT`)

Maps a spoken word (lower case, punctuation trimmed, apostrophes and hyphens kept) to a class:

| Class | Colour | Use for |
|---|---|---|
| `"k"` | cyan | the subject and its key terms |
| `"n"` | amber | numbers, quantities, superlatives |
| `"m"` | violet | the secondary noun family (data, memory, money, time…) |
| `"w"` | coral | problems, limits, negation |

Highlight 15–25 % of words. A word maps to one class everywhere it occurs; map a common word to
`None` if another entry would colour it wrongly.

## Recording and checking

```bash
bin/lockstep voice <slug>            # af_heart at speed 1.0 unless script.py or the arguments say otherwise
bin/lockstep voice <slug> list       # available voices (af_/am_ American, bf_/bm_ British; f/m = female/male)
bin/lockstep voice <slug> am_michael 0.98
bin/lockstep check-voice <slug>
```

`check-voice` transcribes each take with an independent speech recogniser and lists the
differences from the script. Read every `DIFF` line:

- a homophone or a spacing variant ("ads" for "adds", "scratch pad") — fine;
- a name read letter by letter, a wrong stress, a dropped word — fix with an override or a
  rewrite, record again;
- a very short sentence on its own ("Show it.") is the likeliest thing to be misheard once music
  is under it. Prefer joining it to its neighbour.

Also listen for meaning: the recogniser cannot tell you that the stress fell on the wrong word.
Italic emphasis does nothing; word order and punctuation are the only controls. Moving the key
word to the end of the sentence is the reliable way to stress it.

## Caption phrases (`caption_phrases.json`)

A flat list of strings that, joined, equal the narration word for word. Each string is on screen
as one caption while it is spoken; the current word is highlighted.

- 1–4 words; 5 only if they are short. Target ≤ 22 characters; longer phrases wrap to two lines.
- Break where a reader would breathe: after punctuation, before a preposition or conjunction.
- Keep together: number + unit ("eight million pixels"), adjective + noun, verb + particle.
- Never leave a short word alone on screen for under 0.35 s — join it to a neighbour.
- A phrase that would be on screen for less than about a third of a second is flagged by the
  build ("captions readable"); merge it.

`bin/lockstep captions <slug> --draft` produces a starting point from the punctuation; the
hand-editing is where captions become readable.

## Optional notes for the generated script document

`DIRECTIONS` (a delivery note per beat), `PRONUNCIATION` (term, say-it-as, note) and
`ACCURACY_NOTES` (what each number or bold claim rests on) are printed in
`docs/narration_script.md`. Write `ACCURACY_NOTES` — it is the bridge between the script and
`docs/sources.md`.
