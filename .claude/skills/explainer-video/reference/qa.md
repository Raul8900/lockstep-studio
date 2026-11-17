# Review, QA and known pitfalls

A build that passes its technical checks is not yet a good video. Review in four passes: the
look before any scene exists, while drawing each scene, after the first full build, and before
delivery.

## Pass 0 — the look, before drawing

```bash
bin/lockstep brief <slug>          # brief complete, style.json present
bin/lockstep style-check <slug>    # legibility: contrast, distinct roles, fonts, caption size and position
bin/lockstep tile <slug>           # -> out/style_tile.jpg — open it at full size
```

Check the tile against the quality bar in art-direction.md, and against the brief: does it look
like the world the brief describes? Would someone who saw the previous video in this repo
recognise this as a different video?

## Pass 1 — while drawing (per scene)

```bash
bin/lockstep lint <slug>                          # code mistakes and text placement, with times (see below)
bin/lockstep meta <slug>                          # scenes load, cues resolve
bin/lockstep sheet <slug> 30s 31s 32s 33.5s 35s   # tile of stills -> out/sheet.jpg
bin/lockstep still <slug> --safe 33.5s            # full size with keep-out zones -> out/stills/
bin/lockstep preview <slug>                       # for the person: plays in a browser with sound, follows every save
```

Open the image and check, for every still:

- Is it obvious within one second what to look at? One bright thing, the rest dim.
- Can every label be read at phone size (the sheet is about phone scale; if a label is unreadable
  on the sheet it is unreadable on a phone)?
- Do any two texts touch or overlap? Does anything touch the edge of the safe rectangle?
- Is anything essential under the caption, in the top or bottom band, or — below y ≈ 900 — right
  of x ≈ 910?
- Does the picture show what the caption on that frame says?
- Lottie animations: one author or one recolour scheme; readable on this background; key frames on
  their words; nothing left frozen mid-move by accident.
- Is it drawn in the video's world? Crisp vector diagrams in a hand-drawn look, or hairlines in a
  poster look, break the style; see "Make the scenes match the look" in art-direction.md.
- Are colours used by role (`COL.subject`, `COL.accent`, …), never as hex values or as the
  legacy hue names?
- At the first and last still of the scene: is the frame already (still) full and alive?

Sample densely around cues — the frame 0.1 s before, on, and 0.3 s after each reveal — and at
least every 1–2 seconds elsewhere. View small text at full size, not only on the sheet.

### Reading lint

`bin/lockstep lint <slug>` answers several of the questions above mechanically, for every 0.2 s of
the video; `--static` reads the code only (a second, instead of about half a minute). It sees text
drawn with `text()`/`fillText` on the scene itself; text drawn into an off-screen canvas, an icon or
a Lottie file is invisible to it. Errors stop `build`:

| Error | Means |
|---|---|
| `boot`, `draw` | the page does not start, or a frame throws (the message and the time) |
| `narration` | no recording yet, or script.py says something the recording does not |
| `captions` | caption_phrases.json does not match the narration |
| `nondeterministic` | `Math.random()`, `Date` or `performance.now()`: frames would differ between renders |
| `cue` | `at('beat', 'word', n)` names a beat or word that is not there (with the nearest words) |
| `sound`, `icon`, `lottie` | a sound type, icon name (also `{ icon: 'x' }` in a block's options) or Lottie file that does not exist, or a Lottie file without credits |

Warnings hold for at least 0.4 s while the text stays put (text sliding or zooming through a zone
is animation) and need a decision:

| Warning | Means | Usual fix |
|---|---|---|
| `typed-time` | a time in seconds in the code (`prog(t, 24.0, 26.5)`) | anchor it to a word: `at('beat', 'word') - 0.3` |
| `hex-colour`, `legacy-colour` | a colour typed as a value, or `COL.cyan`-style names | a role: `COL.subject`, `COL.accent`, … |
| `colour-role` | `{ color: 'acent' }`: an option that is neither a role nor a colour (a block would draw it in whatever colour came before) | the role's name |
| `top-band`, `bottom-band`, `side-margin`, `right-column` | text under the app's interface | move it inside the safe zone (`still --safe`) |
| `under-captions` | scene text where the captions are drawn | lay out above y ≈ 1210 |
| `small-text` | under 20 px on screen | 24 px or more for anything that must be read |
| `low-contrast` | at least 5 % of a label's box is something drawn in nearly its colour — usually its own icon, a line or a glow | move it clear, or give it a plate (`pill`) or an outline |
| `off-frame` | text cut off by the frame's edge | bring it in |
| `text-overlap` | two different texts on top of each other | lay out from measured widths (`measure`) |

To accept a warning, end its line with `// lint-ignore` (or `// lint-ignore typed-time`), or list
it in `video.json` with the reason, narrowed to a text or a file when you can:

```json
"lint": { "ignore": [ { "rule": "low-contrast", "text": "ON PURPOSE", "why": "the stamp's own border" } ] }
```

## Pass 2 — after the first full build

`bin/lockstep build <slug>` prints the verdict. Then:

1. **`dist/contact_sheet.jpg`** — frames from the finished MP4, a few per chapter. Does the video
   read as one design? Is any chapter visibly thinner than the others?
2. **`dist/mobile_preview_reels_style.jpg`, `…_shorts_style.jpg`** — phone-size frames under
   generic interface overlays (approximations: neither platform publishes exact pixels). Nothing
   essential under a shaded area.
3. **Transitions** — `bin/lockstep filmstrip <slug> 7.4:8.6:10 28.9:30.1:10` makes rows of
   consecutive frames across each scene change (use the scene start times from
   `data/timeline.json`). Look for an empty or half-drawn frame mid-transition, a jump, or an
   element popping.
4. **`docs/visual_storyboard.md` against the frames** — does each sequence do what you planned?
5. **Accuracy re-read** — go through every frame's on-screen text against `docs/sources.md`.
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
| continuous motion (*check*) | listed time ranges barely change for ≥ 0.4 s — add large-area idle motion there |
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
- [ ] No third-party logos, footage, images, fonts outside the bundled ones, or music.
- [ ] `docs/report_notes.md` filled in honestly, including what could not be verified (you
      cannot listen to the mix or watch it play inside the apps — say so).
- [ ] `bin/lockstep report <slug>` re-run after the last build.
- [ ] A `## Retrospective` section appended to `docs/creative_brief.md`: what worked, what did not.
      If the look could serve other topics, `bin/lockstep save-style <slug> <name>`.
- [ ] The user gets the MP4 itself, not only a path in a container that will be discarded.

## Pitfalls already paid for

| Symptom | Cause | Fix |
|---|---|---|
| Empty or near-empty frame at a scene change | Incoming scene fades its content in after the cut | Content present and moving from 0.4 s before the scene's start; no fade-in of the base layout |
| "Static holds" in a pause between sentences | Only small elements moving | Slow `withCam` push-in, pulsing glow, a second pass of the animation — something large |
| Two captions flash by | One- or two-word phrases under 0.35 s | Merge with a neighbour |
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
| Voice or build refuses: "creative direction is not done yet" | Brief incomplete or no style.json | Do the creative-direction step (creative-direction.md); the message lists what is missing |
| Text in an unexpected font | Family name misspelt in style.json | `lockstep style-check <slug>` names it; `lockstep fonts` lists what exists |
| Words vanish against a light background | Legacy colour names (`COL.white` is dark ink on paper styles, `COL.bg0` light) or hard-coded hex | Use roles: `COL.ink`, `COL.onAccent` |
| Muddy blotches on a light style | Large or strong `glow()` (it becomes a tint on light backgrounds) | Smaller radius, lower alpha, or emphasise with a fill or `highlighter` |
| `no Lottie file lottie/x.json` at boot | Name misspelt or never taken | `lockstep lottie-info <slug>` lists the files; `lottie-get` takes one |
| `useLottie(…) called after loading` | `useLottie()` inside the draw function | Declare every animation in the scene's setup code |
| A Lottie is tiny in its box | The artist left empty canvas around the drawing | `useLottie(name, { crop: true })` |
| A Lottie is blurry | Drawn larger than its off-screen canvas | `scan` lists `soft_lottie`; raise `res` |
| A Lottie vanishes on the background | White artwork on a light look (or dark on dark) | `recolor` (lottie.md) or another file |
| Build refuses: "Lottie files without a source and licence" | A file in `lottie/` has no entry in `credits.json` | `lottie-get` writes it; add your own files' entries by hand |
| Voice sounds buried or the music vanishes | Voice-to-bed ratio outside 15–17 dB | `"mix"` in `video.json` (audio.md) |

## Honest reporting

Report measured facts as measured, and unverified things as unverified. If a requirement was not
met — length, a failed check, a section you could not finish — say so first, not last. Never
describe the video as finished while the verdict shows a FAIL.
