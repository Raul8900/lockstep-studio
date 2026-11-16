# Implementation verification

Base: `develop` at `575ddb0ee3d5e15096d1fdd54adad54523ef5021`. PR #2 remains open at
`5d61565034f438e9b285963a193d051efe3f6287`; this feature is independent of that diff.

## Executed checks

- `scripts/selftest.sh --keep`: base and head pass, 17.67 seconds, 530 frames, 0% final-mix WER.
  Word/take JSON, narration WAV, music, effects and premaster hashes match.
- Full `bin/lockstep build torn-qr-code --preset veryfast --crf 20` on both revisions:
  92.73 seconds, 2,782 frames. All frames, word/take/timeline JSON, stems and final MP4 match
  byte-for-byte. Only validation.json gains the measured stream-duration difference.
  Both have the same 1.22% ASR WER and two pre-existing short holds.
- `bin/lockstep scan how-a-gpu-works`: no errors or near-black frames. Six frames each from
  GPU and torn-QR, spanning their story, match the baseline bytes after installing the same fonts.
- `python3 -m unittest discover -s tests -v`: 8 contract tests pass, including a selected missing
  Three backend's actionable setup remedy, recording hash binding, smooth rests and duplicate stems.
- `build choices-reel` and `build choices-mixed`: 15 seconds, 450 frames each, H.264/AAC,
  no invented speech/captions, clean decode, empty SRTs, matching stream durations,
  loudness −14.1/−14.0 LUFS, true peak −1.5/−2.3 dBTP respectively.
- `verify-seek choices-mixed 3s 9.8s 10.2s 12s`: all saved full-render frames and reverse seeks
  are identical, including the native/3D transition. Partial render 10–15 seconds with one worker
  also matches. Source stills use the same quality for opted-in productions.
- Same authoring interface: `choose ... shot preview native.scale --inputs '{"values":[2,5]}'`
  then `choose ... shot preview native.signal`, with distinct rendered outputs. The mixed fixture
  has a native growth/biology shot next to a real animated skin. Legacy and mixed audio selections
  use identical narration and picture in the A/B fixture.

## Idle benchmark

Linux, Node, Python, FFmpeg and Chromium versions are in [environment.json](verification-data/environment.json).
Identical short starter inputs, 1080×1920, 30 fps, first 5 seconds, one worker. Each revision uses
one cold-process run and three warm runs. OS caches are not forcibly dropped; the first run is
not claimed to be a fresh machine. Earlier runs overlapping setup/tests were discarded as noisy.

| Measure | Base | Head |
|---|---:|---:|
| Warm render elapsed median | 11.6019 s | 11.7288 s |
| Startup + metadata elapsed median | 1.4832 s | 1.6281 s |
| Warm render peak tree RSS median | 898.16 MiB | 897.81 MiB |

Warm render change: 1.09%, within the proposed 5% target on this machine.
Startup/metadata increases by 0.145 seconds; this is measured separately, not hidden in the render claim.
RSS sums descendants every 50 ms and may count shared pages more than once; it is a comparable
process-tree high-water estimate, not unique resident memory. Raw runs/commands are committed.

Legacy network audit contains no catalogue, optional scripts, visual sample assets or remote URLs.
Selected Three audit shows only local modules/GLB. Merely enlarging the catalogue does not decode
unused assets or launch WebGL. The original library's normal font/icon loads remain unchanged.

Reproduce after preparing identical baseline narration:

```bash
python3 scripts/benchmark_choices.py /path/to/base/engine/render.js /path/to/legacy-fixture --out work/base.json
python3 scripts/benchmark_choices.py engine/render.js /path/to/legacy-fixture --out work/head.json
LOCKSTEP_AUDIT=work/network.json bin/lockstep meta /path/to/legacy-fixture
node engine/render.js /path/to/legacy-fixture bench 1s
node engine/render.js videos/choices-mixed bench 12s
```

Install the optional measurement dependency with `pip install psutil` if absent. Browser startup
uses the system Chromium via the same Playwright executable shim for both revisions; production
can instead set `LOCKSTEP_CHROMIUM=/usr/bin/chromium`. Local setup uses a Python venv and
XDG font/cache directories under work/. Full build commands and optional setup are in
[production-choices.md](production-choices.md).

## Delivery status

Implementation and capability checks are complete. The aeroplane-window production will be authored
only after the implementation PR is open and its pushed head is confirmed. Final demo, A/B listening
artifacts and final tested SHA will be added to this same PR. No human listening judgement is claimed.
