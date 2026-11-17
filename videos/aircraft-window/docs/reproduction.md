# Reproduce the aircraft-window film

PR: https://github.com/Raul8900/lockstep-studio/pull/6
The PR was open at c7f6946 before production began. Final production inputs were pushed as
4fafaedffac5d9b0d6fee0ff3afb18a51cc1b3a5 before the final full render started. Later review commits
contain generated evidence and documentation; the render inputs are identified separately.

```bash
bin/lockstep setup --with-asr
bin/lockstep setup-optional three
bin/lockstep brief aircraft-window
bin/lockstep tile aircraft-window candidates/daylight.json candidates/night.json
bin/lockstep voice aircraft-window
bin/lockstep check-voice aircraft-window
bin/lockstep captions aircraft-window
bin/lockstep meta aircraft-window
bin/lockstep sheet aircraft-window --cols 4 2s 12s 19s 23s 26s 30s 34s 40s
bin/lockstep build aircraft-window --preset veryfast --crf 18
```

The current machine uses `LOCKSTEP_CHROMIUM=/usr/bin/chromium` or the equivalent Playwright
executable shim, XDG font/cache folders under /workspace/work, and the local Python venv.
Full environment versions and compatibility benchmarks are in ../../../docs/verification.md. The system Chromium executable is optional; a normal baseline
setup can use its installed Playwright browser. Three uses Chromium's SwiftShader software
renderer; no external video or audio renderer is composited into the export.

Audio-only revisions with unchanged narration timing use `meta`, `audio`, `assemble --remux`,
`validate` and `report`. A changed script needs new voice timings, captions and a full picture
build. Catalogue choices and exact audio levels are saved in video.json. Physical geometry,
camera, leaders and the separate air/load annotations are in components.js. Both source articles
and mechanical claim mapping are in sources.md.

The original waveform assets, fonts and Three runtime have no incremental usage/API fee.
Authoring used the existing Codex session; its model billing is not exposed. All frame rendering,
preview and cached rerender steps require zero authoring-model calls. Local neural voice inference
is timed separately in data/voice_cost.json.

## Export verification

`bin/lockstep validate aircraft-window` measures the exported AAC/H.264 file, performs a full
decode and compares it with the rendered JPEG frames. `bin/lockstep verify-seek aircraft-window
2s 12s 23s 27.5s 33s 39s` compares reverse-order still captures with full-render frames.
After copying the final MP4 to the task deliverable, the exact copy is checked again:

```bash
sha256sum videos/aircraft-window/dist/aircraft-window.mp4 /workspace/output/aircraft-window.mp4
ffmpeg -v error -xerror -i /workspace/output/aircraft-window.mp4 -f null -
ffprobe -v error -show_streams -show_format -of json /workspace/output/aircraft-window.mp4
```

Six PNGs decoded from that delivery copy cover the passenger opening, three labelled layers,
airflow, normal outer load, hypothetical inner backup and passenger return. Their exact word-based
pick times, full stream metadata and matching source/delivery SHA256 are saved in delivery.json.
The packaged review artifacts include both approximate mobile interface overlays.
