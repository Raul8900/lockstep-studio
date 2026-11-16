# Directing productions with saved choices

Search intent before writing scene code. A compact local catalogue returns at most six items;
`show` returns one recipe's inputs, timing, source, licence and executable preview command.
No search, preview, frame render or rerender calls an authoring model or network service.

```bash
bin/lockstep catalog search follow a signal
bin/lockstep catalog search show what is inside
bin/lockstep catalog search introduce a scale comparison
bin/lockstep catalog search give this hit weight
bin/lockstep catalog show native.signal
bin/lockstep catalog preview native.signal --out work/previews
bin/lockstep catalog preview sound.paper --out work/previews/paper
bin/lockstep choose <video> shot <chapter-id> native.signal --inputs '{"duration":2}'
bin/lockstep choose <video> narration voice.kokoro --inputs '{"voice":"af_heart","speed":1.0}'
bin/lockstep choose <video> score score.synth
bin/lockstep choose <video> effects effects.mixed
bin/lockstep choose <video> ambience sound.ambience --inputs '{"gain_db":-30}'
```

Each selected shot is independent. Call `const shot = prepareChoice('chapter-id')` in scene
setup, then `addScene('chapter-id', (ctx,t) => shot.draw(ctx,t))`. Native-only, local art and
3D scenes can be neighbours. To author a bespoke shot, select `three.local`, then use
`createThreeShot({setup(shot), update(shot,t), width,height,x,y})` in components.js. Setup can
return a promise; it is awaited before frame zero. Call `shot.draw(ctx, absoluteShotTime)`
in the scene, before drawing labels. `shot.project(Vector3)` projects a physical point for a
leader line. The actual scene layer receives the WebGL canvas immediately, including both
sides of a transition, before captions/HUD and JPEG capture. No external audio is imported.

`shot.loadGLB('assets/model.glb', clipNameOrIndex)` loads a project-local model and optional
clip. AnimationMixer.setTime seeks from absolute seconds. Draco/KTX2 and remote texture URIs
are not configured; use a self-contained uncompressed GLB. The small committed hinge fixture
has two skin joints and an original four-second animation. It is a verification model, not a
finished human character. Quaternius' CC0 humanoid assets are a possible optional author choice:
obtain only the selected free glTF model/clip from its pack page, save it under the project,
record the exact download hash and licence, then select it through `three.rig --inputs`.

The browser uses Chromium's SwiftShader for selected Three shots in this verified route.
Native legacy jobs retain their original browser options. `LOCKSTEP_CHROMIUM=/usr/bin/chromium`
can select an existing browser. On one machine, compare out-of-order seeks and saved full or
partial frames with `bin/lockstep verify-seek <video> 1s 5s 10s`. New-choice stills and saved
frames use the same JPEG quality. Legacy stills retain their original preview quality.

## Optional backends and cost

```bash
bin/lockstep setup                   # unchanged baseline; downloads no visual packs
bin/lockstep setup-optional three    # Three.js 0.180.0, npm lock integrity
bin/lockstep setup-optional maps     # d3-geo 3.1.1, d3-shape 3.2.0, d3-array 3.2.4
```

A selected missing backend fails before Chromium starts with its setup command. Only selected
backend scripts load. Project images load only when declared during setup; no decoding happens
inside the frame function. Local SVG/PNG/JPEG preserve intrinsic aspect, transparency and an
editable normalized pivot. Runtime libraries/large optional packs are absent from the normal
setup. `node_modules/` and renders stay out of Git. Model usage during authoring is separate from
local render cost; incremental software, asset and rendering API fees are ₹0 on existing hardware.

## Speech, auditions and supplied recordings

Kokoro retains the existing short takes, `[term](/IPA/)`, `{p:0.30}` pauses, voices and word/take
contracts. Audition one take without replacing production audio or timings:

```bash
bin/lockstep audition <video> 0 af_heart 1.0
bin/lockstep voice <video>
bin/lockstep captions <video> --draft
```

For supplied narration, prepare reviewed JSON with `reviewed:true`, `audio_sha256` of the exact
source WAV, `reviewer`, `method`, and complete `words`, `takes`, `beats` arrays in the existing
contracts. Word times must lie within their take and beat. Then run:

```bash
bin/lockstep import-voice <video> recording.wav reviewed-timings.json
bin/lockstep captions <video> --draft
bin/lockstep build <video>
```

The import resamples to the normal mono 24 kHz render input and records both source and output
hashes. Changed audio requires newly reviewed timings. Kokoro times are never borrowed for a
different recording. Automatic forced alignment is deliberately not a baseline dependency.

## Event effects, music and ambience

Sounds are editorial choices: a visible event can be silent. Old `sfx(t,'thump',gain)` remains
unchanged. With `effects.mixed` or `effects.local`, add a local sample:

```js
sfx(at('reveal','inside'), 'sample', 0.6, {
  file:'assets/contact.wav', trim_start:0.02, trim_end:0.32,
  fade_in:0.01, fade_out:0.05, gain_db:-6, reverb:0
});
```

`files:[...]`, `seed` and a stable `id` choose repeatable variation. Paths are relative to the
project, except the bundled `assets/production/` namespace. `audio.cues` in video.json can also
schedule samples using `at:{word,chapter,nth,edge,offset}`, `{beat}`, `{frame}`, `{seconds}` or
`{marker}`. Synth, local, mixed and none are explicit effects choices. No picture automatically
creates a sound.

`music.source` is synth (legacy default), local or none. A local choice requires an `audio.stems`
entry with `role:"music"`; ambience uses `role:"ambience"`. Each stem supports `file`, `at`,
`gain_db`, `trim_start`, `trim_end`, `duration`, `loop`, `fade_in`, `fade_out`. Duplicate file/start
entries are rejected. Loops overlap by 20 ms and authored boundaries fade. Existing score kits,
moods, BPM, transposition and ducking are retained. Music, ambience and narration are independent.
`audio.music_envelopes`, `audio.ambience_envelopes` and `audio.sfx_envelopes` accept intervals:

```json
{"from":{"chapter":"reveal","word":"pressure"}, "to":{"chapter":"reveal","word":"outer","offset":0.4}, "gain_db":-8, "fade":0.15}
```

Or select an entire `chapter`, or a `rest:true`. Smooth ramps avoid gain discontinuities.
After sound-only changes run `meta`, `audio`, `assemble --remux`, `validate`, `report`.
Do not reuse picture or captions after changing the recording's timing.

## Music-only clocks

```json
{"clock":{"mode":"music","duration":15,"bpm":120,"markers":{"hit":{"frame":150}}},
 "chapters":[{"id":"first","name":"FIRST","start":0},{"id":"next","name":"NEXT","start":7.5}]}
```

`bin/lockstep clock <video>` saves empty word/take/caption arrays and actual chapter intervals.
The same preflight runs on build/render; no fake speech is generated. Scene starts are explicit,
without the narrated path's half-second preroll. `choiceTime({marker:'hit'})`, frame/beat markers
and normal word cues are available to authored scenes. Build produces an empty SRT and marks
speech metrics inapplicable. Duration, decode, music sync, loudness, peak and picture checks remain.

## Evidence and reproducibility

The authored files plus data/choices_resolved.json and timeline.json record item IDs/versions,
asset hashes, inputs, actual loaded backends, renderer, visual clock, narration provenance and
sound decisions. The report embeds that summary. Legacy projects without new fields follow the
original visual/audio path. The new opt-in encode path explicitly bounds output duration to avoid
FFmpeg shortest-buffering truncating a short music track. Full decode remains mandatory.

```bash
python3 -m unittest discover -s tests -v
scripts/selftest.sh --keep
python3 scripts/create_choices_fixtures.py
bin/lockstep build choices-reel --preset veryfast --crf 20
bin/lockstep build choices-mixed --preset veryfast --crf 20
bin/lockstep verify-seek choices-mixed 3s 9.8s 10.2s 12s
```

## Research and selection (16 November 2026)

| Source | Selection / integration | Licence / recurring fee |
|---|---|---|
| [Natural Earth v5.1.2](https://github.com/nvkelso/natural-earth-vector/tree/v5.1.2), [terms](https://www.naturalearthdata.com/about/terms-of-use/) | Real 110m countries, unused properties removed; native map fixture | Public domain; ₹0 |
| [D3 geo paths](https://d3js.org/d3-geo/path), [shapes](https://d3js.org/d3-shape) | Canvas geoPath/Mercator and line; optional pinned runtime | ISC; ₹0 |
| [Three.js r180](https://github.com/mrdoob/three.js/tree/r180), [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html), [AnimationMixer](https://threejs.org/docs/pages/AnimationMixer.html) | Offscreen WebGL + immediate drawImage; absolute setTime | MIT; ₹0 |
| [Quaternius base rigs](https://quaternius.com/packs/universalbasecharacters.html), [clips](https://quaternius.com/packs/universalanimationlibrary.html) | Larger optional packs deferred; original small skin fixture verifies route | Asset pages list CC0; selected future files need own provenance; ₹0 free tier |
| [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) | Keep local ONNX voice and measured durations | Apache-2.0 weights; ₹0 |
| [WhisperX](https://github.com/m-bain/whisperX), [Chatterbox Turbo](https://huggingface.co/ResembleAI/chatterbox-turbo) | Evaluated, not added: existing ASR plus reviewed WAV timings suffice | No dependency or fee added |
| [Fluent Emoji](https://github.com/microsoft/fluentui-emoji) | PR #2 still open; no imported diff or competing library. Local art API uses distinct names | MIT assets; not bundled here |
| [Bioicons](https://github.com/duerrsimon/bioicons), [Noto animations](https://googlefonts.github.io/noto-emoji-files/?view=docs) | Deferred: original science schematic makes specific asset licences unnecessary | Bioicons varies per asset; Noto animated assets CC BY 4.0 |
| [Flubber](https://github.com/veltman/flubber), [lottie-web](https://github.com/airbnb/lottie-web) | Deferred: current examples use native deterministic interpolation; no player benefit yet | No runtime added |
| [Kenney backgrounds](https://kenney.nl/assets/background-elements-remastered), [Impact Sounds](https://kenney.nl/assets/impact-sounds), [Digital Audio](https://kenney.nl/assets/digital-audio) | Access returned 403/restricted; did not import or assume a specific download licence. Original WAV palette instead | Original example assets CC0; ₹0 |
| [HyperFrames](https://hyperframes.heygen.com/concepts/compositions), [Remotion ThreeCanvas](https://www.remotion.dev/docs/three-canvas) | Deferred: an extra scene framework would duplicate capture/scheduling. Native + Three is sufficient | No added dependency or fee |

Offscreen rendering was selected over cached image sequences: it preserves editable camera,
lighting and pose without an extra cache invalidation format. Cached final JPEG frames already
support audio-only remux. Software Three is visibly more expensive and is measured separately.
No claim of GPU speed or universal pixel identity across different machines is made.

PR #2 overlap: both declare art in setup and preload before frame zero. This implementation uses
`projectImage`/`drawProjectImage`, not PR #2's Fluent `art`/`drawArt`, and does not change style
illustration conventions. Both patches touch the boot hook/report/CLI and may need a small merge
resolution if PR #2 lands first. Neither that PR nor its branch was modified.
