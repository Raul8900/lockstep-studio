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
bin/lockstep meta <slug>                          # scenes load, cues resolve
bin/lockstep sheet <slug> 30s 31s 32s 33.5s 35s   # tile of stills -> out/sheet.jpg
bin/lockstep still <slug> --safe 33.5s            # full size with keep-out zones -> out/stills/
```

Open the image and check, for every still:

- Is it obvious within one second what to look at? One bright thing, the rest dim.
- Can every label be read at phone size (the sheet is about phone scale; if a label is unreadable
  on the sheet it is unreadable on a phone)?
- Do any two texts touch or overlap? Does anything touch the edge of the safe rectangle?
- Is anything essential under the caption, in the top or bottom band, or — below y ≈ 900 — right
  of x ≈ 910?
- Does the picture show what the caption on that frame says?
- Is it drawn in the video's world? Crisp vector diagrams in a hand-drawn look, or hairlines in a
  poster look, break the style; see "Make the scenes match the look" in art-direction.md.
- Are colours used by role (`COL.subject`, `COL.accent`, …), never as hex values or as the
  legacy hue names?
- At the first and last still of the scene: is the frame already (still) full and alive?

Sample densely around cues — the frame 0.1 s before, on, and 0.3 s after each reveal — and at
least every 1–2 seconds elsewhere. View small text at full size, not only on the sheet.

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
| `cue not found` after a script edit | The cue word was removed or moved to another beat | `lockstep words <slug> <beat>`; re-anchor to a word that exists |
| Frames differ between runs | `Math.random()`, `Date`, or state kept across frames | Use `hash`/`rng`; compute everything from `t` |
| Build refuses: "script.py is newer than the recorded narration" | Script edited after recording | `lockstep voice <slug>` (identical text re-records identically) |
| Voice or build refuses: "creative direction is not done yet" | Brief incomplete or no style.json | Do the creative-direction step (creative-direction.md); the message lists what is missing |
| Text in an unexpected font | Family name misspelt in style.json | `lockstep style-check <slug>` names it; `lockstep fonts` lists what exists |
| Words vanish against a light background | Legacy colour names (`COL.white` is dark ink on paper styles, `COL.bg0` light) or hard-coded hex | Use roles: `COL.ink`, `COL.onAccent` |
| Muddy blotches on a light style | Large or strong `glow()` (it becomes a tint on light backgrounds) | Smaller radius, lower alpha, or emphasise with a fill or `highlighter` |
| Voice sounds buried or the music vanishes | Voice-to-bed ratio outside 15–17 dB | `"mix"` in `video.json` (audio.md) |

## Honest reporting

Report measured facts as measured, and unverified things as unverified. If a requirement was not
met — length, a failed check, a section you could not finish — say so first, not last. Never
describe the video as finished while the verdict shows a FAIL.
