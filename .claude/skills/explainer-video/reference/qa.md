# Review, QA and known pitfalls

A build that passes its technical checks is not yet a good video. Review in four passes: the
look before any scene exists, while drawing each scene, after the first full build, and before
delivery.

## Pass 0 — the media and the look, before drawing

```bash
bin/lockstep brief <slug>          # brief complete, style.json present
bin/lockstep media <slug>          # every file taken, with its licence; MISSING ones: lockstep media <slug> restore
bin/lockstep look <slug>           # every picture and clip through the grade, with captions -> out/look.jpg
bin/lockstep style-check <slug>    # grade ranges, caption size and position, fonts
```

Open `out/look.jpg` at full size. Do the pictures read as one film (one grade, similar contrast),
or does one photo look like it came from somewhere else? Is every picture sharp enough to fill a
phone screen? Does each one show what its line will say — the right person, place, object, era?
Would the captions read on the brightest of them?

## Pass 1 — while drawing (per scene)

```bash
bin/lockstep lint <slug>                          # code mistakes and text placement, with times (see below)
bin/lockstep meta <slug>                          # scenes load, cues resolve
bin/lockstep sheet <slug> 30s 31s 32s 33.5s 35s   # tile of stills -> out/sheet.jpg
bin/lockstep still <slug> --safe 33.5s            # full size with keep-out zones -> out/stills/
bin/lockstep preview <slug>                       # for the person: plays in a browser with sound, follows every save
```

Open the image and check, for every still:

- Does the picture show what the caption on that frame says? This is the test that matters most.
- Is the subject of the line big? A face, an object, a place filling the frame — not a small
  thing in a wide shot.
- Is the camera moving? Compare two stills 0.5 s apart: if nothing changed, the shot is dead.
- Is it obvious within one second what to look at?
- Can every overlay be read at phone size, on this picture? White text on a bright sky or paper
  needs its shadow, a plate, or a different spot.
- Is anything essential under the caption, in the top or bottom band, or — below y ≈ 1000 —
  right of x ≈ 950?
- Does the shot belong to the video's world, in its grade? A stock photo in a run of archive
  photographs, or a glossy render in a grainy film, breaks it.
- Is every picture sharp at the size it is shown? A 640 px photo pushed in to fill 1920 px is mush:
  find a larger one.
- At the first and last still of the scene: is the frame already (still) full and moving?
- For a real object built in 3D (an aircraft, a car, a bridge): does its silhouette match the
  reference drawings from the side, top and front (scene-api.md, Film worlds)? Hold the full-size
  still next to a reference photo: nose, tail, wing and engine positions, proportions. Anything
  shiny, wet or glowing that the story does not need comes out.

Sample densely around cues — the frame 0.1 s before, on, and 0.3 s after each reveal — and at
least every 1–2 seconds elsewhere. View small text at full size, not only on the sheet.

### Reading lint

`bin/lockstep lint <slug>` answers several of the questions above mechanically, for every 0.2 s of
the video; `--static` reads the code only (a second, instead of about half a minute). It sees text
drawn with `text()`/`fillText` on the scene itself; text inside a picture or a 3D world is
invisible to it. Errors stop `build`:

| Error | Means |
|---|---|
| `boot`, `draw` | the page does not start, or a frame throws (the message and the time) |
| `narration` | no recording yet, or script.py says something the recording does not |
| `captions` | caption_phrases.json does not match the narration |
| `nondeterministic` | `Math.random()`, `Date` or `performance.now()`: frames would differ between renders |
| `cue` | `at('beat', 'word', n)` names a beat or word that is not there (with the nearest words) |
| `sound`, `icon` | a sound type or icon name that does not exist |
| `media` | `useImage` / `useVideo` / `w.model` / `w.sky` / `w.texture` naming something never taken; a cut-out not made; a file in `media/` without a credit; a licence a video cannot use (NC, ND); files missing from disk |

Warnings hold for at least 0.4 s while the text stays put (text sliding or zooming through a zone
is animation) and need a decision:

| Warning | Means | Usual fix |
|---|---|---|
| `typed-time` | a time in seconds in the code (`prog(t, 24.0, 26.5)`) | anchor it to a word: `at('beat', 'word') - 0.3` |
| `hex-colour`, `legacy-colour` | a colour typed as a value, or `COL.cyan`-style names | a role: `COL.subject`, `COL.accent`, … |
| `colour-role` | `{ color: 'acent' }`: an option that is neither a role nor a colour | the role's name |
| `top-band`, `bottom-band`, `side-margin`, `right-column` | text under the app's interface | move it inside the safe zone (`still --safe`) |
| `under-captions` | scene text where the captions are drawn | lay out above y ≈ 1210 |
| `small-text` | under 20 px on screen | 24 px or more for anything that must be read |
| `low-contrast` | at least 5 % of a label's box is something drawn in nearly its colour — usually its own icon, a line or a glow | move it clear, or give it a plate (`pill`) or an outline |
| `off-frame` | text cut off by the frame's edge | bring it in |
| `text-overlap` | two different texts on top of each other | lay out from measured widths (`measure`) |
| `pacing` | real footage on screen under 4 s, or talked over from start to end; a real photograph under 2 s | give it time from a setup beat and a longer pause after the take that introduces it (story.md, "Pacing") — not a longer video |

To accept a warning, end its line with `// lint-ignore` (or `// lint-ignore typed-time`), or list
it in `video.json` with the reason, narrowed to a text or a file when you can:

```json
"lint": { "ignore": [ { "rule": "low-contrast", "text": "ON PURPOSE", "why": "the stamp's own border" } ] }
```

## Pass 2 — after the first full build

`bin/lockstep build <slug>` prints the verdict. Then:

1. **`dist/contact_sheet.jpg`** — frames from the finished MP4, a few per beat. Does the video
   read as one world, one film? Is any beat visibly thinner than the others (a held photo where
   the rest moves)?
2. **Pacing** — `bin/lockstep pacing <slug>` against the brief's Pacing plan. Does the mechanism
   get its 10–15 s? Is the real footage on long enough to take in, with a held moment? Are there
   two to four held moments in a minute? Is any setup beat longer than the explanation it leads
   to? A viewer seeing it once must be able to follow each step.
3. **`dist/mobile_preview_reels_style.jpg`, `…_shorts_style.jpg`** — phone-size frames under
   generic interface overlays (approximations: neither platform publishes exact pixels). Nothing
   essential under a shaded area.
4. **Transitions** — `bin/lockstep filmstrip <slug> 7.4:8.6:10 28.9:30.1:10` makes rows of
   consecutive frames across each scene change (use the scene start times from
   `data/timeline.json`). Look for an empty or half-drawn frame mid-transition, a jump, or an
   element popping. With shader transitions, also check the look survives them: a colour that
   clashes (set it with a role in `params`), or a black 3D background on a light look.
5. **`docs/visual_storyboard.md` against the frames** — does each sequence do what you planned?
6. **Accuracy re-read** — go through every frame's on-screen text against `docs/sources.md`.
   Labels drift during design ("never idle" where the truth is "kept busy").

### Reading the verdict

| Row | If it is not PASS |
|---|---|
| 1080 × 1920; 30 fps, all frames present | a render was interrupted — run `render` again |
| length ≤ max | cut the script and re-record; do not speed the voice up past ~1.05 |
| no black frames | a scene draws nothing at that time — almost always a scene start |
| audio/picture sync | must be 0 ms ± 20; anything else means stale files — rebuild `audio` and `assemble` |
| loudness, true peak | the master step failed to converge — rerun `assemble`; check the premaster is not silent |
| captions inside safe width | a phrase is too long — split it in `caption_phrases.json` |
| captions readable (*check*) | a phrase is on screen under 0.35 s or has more than 5 words — merge or split |
| encode fidelity | SSIM under 0.98: lower `--crf`, or look for full-frame flicker in a scene |
| voice intelligible in the mix | see audio.md: a cue or a busy mood is masking a word. *check* (not FAIL) when it is 1–2 words of a short script — read which words |
| continuous motion (*check*) | listed time ranges barely change for ≥ 0.4 s — the camera stopped: give the shot a move |
| "not measured" | speech-recognition models missing: `bin/lockstep setup --with-asr` |

`check` rows do not fail the build, but each needs a decision: fix it, or note in the report why
it is acceptable.

## Pass 3 — before delivery

- [ ] Verdict has no FAIL; every `check` row is resolved or explained.
- [ ] The finished video matches its brief: the chosen story shape, pacing, visual world and look —
      not a drift back to a default arc or a default style.
- [ ] You opened the contact sheet and both mobile previews after the final build.
- [ ] First frame: lit, composed, hook visible. Last 2.5 s: takeaway on screen, still moving.
- [ ] Every number on screen and in the narration is in `docs/sources.md`; product-specific
      numbers carry the product's name.
- [ ] Every picture, clip and model is in `media/credits.json` with a licence a video can use;
      `docs/credits.md` written (`lockstep media <slug> credits`) and handed over for the description.
- [ ] No music, fonts or footage from anywhere else; no logos beyond what the factual story needs.
- [ ] `docs/report_notes.md` filled in honestly, including what could not be verified (you
      cannot listen to the mix or watch it play inside the apps — say so).
- [ ] `bin/lockstep report <slug>` re-run after the last build.
- [ ] A `## Retrospective` section appended to `docs/creative_brief.md`: what worked, what did not.
- [ ] The user gets the MP4 itself, not only a path in a container that will be discarded.

## Pitfalls already paid for

| Symptom | Cause | Fix |
|---|---|---|
| Empty or near-empty frame at a scene change | Incoming scene fades its content in after the cut | Content present and moving from 0.4 s before the scene's start; no fade-in of the base layout |
| "Static holds" in a pause between sentences | Only small elements moving | Slow `withCam` push-in, pulsing glow, a second pass of the animation — something large |
| Two captions flash by | One- or two-word phrases under 0.35 s | Merge with a neighbour |
| The real footage is gone before it registers; the explanation feels rushed | One pace for the whole video: every beat talked through at the same speed | Pace per beat (story.md, "Pacing"): footage 4–8 s with a held moment, the mechanism 10–15 s; take the time from the setup |
| A name is spelled out letter by letter | TTS default reading | `[Name](/IPA/)` override in `script.py` |
| A short word misheard only in the final mix | Percussive cue or dense music on it | Cue 50–80 ms earlier at gain ≤ 0.6; sparser mood; or join the short sentence to its neighbour |
| Text collisions | Labels positioned independently | Lay out from measured widths (`measure`), or give labels opaque plates (`pill`) |
| Diagram runs into the captions | Content below y 1210 | Re-lay-out above it; only glow may spill |
| Key number hidden on a phone | Under the right-hand button column | Move left of x ≈ 910 when below y ≈ 900 |
| Label overstates the truth | Wording chosen for punch | Re-read every label against the sources; prefer the weaker, true word |
| A product's figure presented as universal | Missing attribution | Put the product name next to the number, or use a generic label |
| Huge file, 70+ Mbps | Animated grain or full-frame flicker | Remove it; the engine's static dither already prevents banding |
| Rendering crawls (a few fps) | Heavy per-frame work in a scene | `render.js … bench <time>`; replace `shadowBlur`/`filter` with `glow()`; hoist gradients out of loops |
| `cue not found` after a script edit | The cue word was removed or moved to another beat | `lockstep lint <slug>` names every broken cue with the nearest words; re-anchor to a word that exists |
| Frames differ between runs | `Math.random()`, `Date`, or state kept across frames | Use `hash`/`rng`; compute everything from `t` (`lint` finds the first two) |
| Lint or build refuses: "script.py has changed since the narration was recorded" | The spoken text, a beat or a pause in the script differs from the recording | `lockstep voice <slug>` (identical text re-records identically); notes and comments in script.py do not count |
| Voice or build refuses: "creative direction is not done yet" | Brief incomplete or no style.json | Write the brief (story.md, shots.md); the message lists what is missing |
| Text in an unexpected font | Family name misspelt in style.json | `lockstep style-check <slug>` names it; `lockstep fonts` lists what exists |
| `no picture media/x.jpg` at boot | Never taken, or the files were not restored after a fresh clone | `lockstep media <slug>`; `lockstep media <slug> restore` |
| `use…() called after loading` / `world3d() called after loading` | declared inside a draw function | Declare media and worlds in the scene's setup code |
| A photo looks soft | It is smaller than the shot shows it (a push-in on a 900 px picture) | Find a larger one; Wikimedia serves 1920 and 3840 px copies; push in less |
| A film clip stutters or jumps | Its frame rate is not 30 and `speed` is fractional, or `from`/`to` cut mid-motion | Cut on a still moment; leave `speed` at 1 |
| Film frames black at the start | `from` beyond the clip's length | `lockstep media <slug>` shows each clip's duration |
| `find` returns nothing useful | Too specific, or the wrong kind | Search the thing, not the sentence ("penicillium mould", not "the mould that saved lives"); try `--sources` one at a time; Pexels and Pixabay need keys |
| Wikimedia refuses a download (429) | Rate limit on original files | It falls back to the 1920 px copy automatically; wait a minute and `take` again for the original |
| A 3D model is tiny, huge or floating | Its own units | `w.model(name, { height: 1.8 })` scales it and stands it on y = 0 |
| A 3D frame is black | No light: no `w.sky`, `w.room`, `w.sun` or `w.ambient` | Add `w.room()` for even studio light |
| 3D frames render slowly | Shadows and anti-aliasing in software rendering (~0.2 s a frame) | Fine for a minute of 3D; for more, `w.sun({ shadow: false })` |
| Voice sounds buried or the music vanishes | Voice-to-bed ratio outside 15–17 dB | `"mix"` in `video.json` (audio.md) |
| The same sentence twice on screen | The scene's own type (`sayText`) and the captions say the same words | `hideCaptions(t0, t1)` for that stretch (scene-api.md) |
| Rendering slows down around scene changes | A heavy shader transition (blurs, glows) costs up to ~0.5 s a frame in software | Accept it, or pick a lighter one from `lockstep transitions` |

## Honest reporting

Report measured facts as measured, and unverified things as unverified. If a requirement was not
met — length, a failed check, a section you could not finish — say so first, not last. Never
describe the video as finished while the verdict shows a FAIL.
