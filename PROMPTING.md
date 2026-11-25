# How to ask for a video

A one-line request works: "Make a short about how vaccines train the immune system." The
`explainer-video` skill researches the topic, picks an angle, writes the story, plans every shot,
builds the animation in code and checks the result.

A fuller request gets a better video. In order of how much it helps:

1. **The angle or the question.** "Why the Titanic's sister ship survived a torpedo" beats "the Titanic".
2. **The visual mix.** For example "animation built in code; real photos only of the real people".
3. **Audience, length and platform.**
4. **Tone.** Dramatic, curious, funny, calm.
5. **Must include / must avoid.** Facts, names, sources, claims to stay away from.
6. **Music mood.** A licensed track (Incompetech, CC BY) is picked to match; name a mood if you have one.
7. **What needs time.** The pace is decided per scene: the explanation and the real footage get
   time and a held moment, paid for by a brisker setup, not a longer video. Name the moments you
   want held if you have them in mind.
8. **Checkpoints.** Where Claude should stop and show you something before carrying on.

## Template

Copy, fill in, delete the lines you don't need.

```
Make a [30 / 45 / 60 / 90]-second short about [topic].

Angle: [the surprising thing, or the question it answers]
Audience: [who is watching, what they already know]
Platform: [YouTube Shorts / Instagram Reels / both]
Tone: [dramatic / curious / funny / calm / urgent]

Visuals: animation built in code with three.js; real photos or footage only where the real
thing matters ([e.g. the real scientist, the real ship, the real place]).
The one thing the animation should show: [e.g. "the cell wall cracking and the cell bursting"]
Give time to: [the moments that must not be rushed, e.g. "the real footage; the burst"]
Music: [mood, e.g. "tense, building" — a licensed track is chosen to match]

Must include: [facts, names, numbers, sources]
Avoid: [claims, topics, styles]

Check with me:
- after the story and shot plan, before recording
- when two photos or clips are equally good
```

## Examples

Short:

```
Make a 60-second short about why the sky is blue. Curious tone, for teenagers.
```

Typical:

```
Make a 60-second short about the Tacoma Narrows Bridge collapse.
Angle: a bridge that danced itself to death in a steady wind.
Visuals: the bridge and the wind built in 3D in code; the real 1940 film of the collapse as the payoff.
Tone: dramatic. Check with me after the story and shot plan.
```

Detailed:

```
Make a 75-second short about how penicillin kills bacteria.
Angle: the drug doesn't poison bacteria, it stops them building their own walls.
Audience: adults with no biology. Platform: YouTube Shorts.
Visuals: one bacterium built in code as the hero: a wall of bricks it keeps rebuilding; penicillin
jams the builders; the wall cracks and it bursts. Give the burst at least 12 seconds.
One real photo of Fleming at the start, nothing else archival.
Must include: Fleming 1928; it only works on bacteria that are growing.
Avoid: the "200 million lives saved" figure (no solid source).
Check with me after the story and shot plan.
```

## Giving feedback

Point at times or beats, and say what you want instead:

- "0:11, the plate shot: show a real dish, not drawn dots."
- "Make the burst twice as long, and hold on it."
- "The real footage goes by too fast; let it play, and take the time from the intro."
- "Less narration in the middle; the 3D part should breathe."
- "The music is too busy under the voice."

Then ask for a new build: "rebuild with these changes".
