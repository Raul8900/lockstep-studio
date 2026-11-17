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

## Selected-render costs

The renderer's in-browser ten-frame micro-benchmark excludes process startup and catalogue lookup.
Native starter frame 30 measured 28.4 ms/frame; selected animated-GLB fixture frame 360 measured
168.1 ms/frame. These are different compositions, so this is a practical per-frame budget comparison,
not an isolated causal estimate of adding the Three library to identical imagery. Raw measurements
are [native-cost.log](verification-data/native-cost.log) and [three-cost.log](verification-data/three-cost.log).
The final aircraft production's complete stage costs are recorded separately in
[final_verification.md](../videos/aircraft-window/docs/final_verification.md).

## Audio comparison and intentional silence

Reproduction uses the unchanged built starter from `scripts/selftest.sh --keep`:

```bash
python3 scripts/audio_ab.py /workspace/work/legacy-fixture --out /workspace/work/audio-ab-verified
```

The script saves both downloadable clips, exact commands and measured stages, validates the
remux and decodes/checksums each delivery copy. The 17.667-second clips have identical compressed
picture streams and narration WAVs. Legacy/directed loudness is −14.0/−14.1 LUFS (0.1 LU apart),
true peak −3.0/−4.7 dBTP and both final mixes have 0% ASR WER. The directed mix dips music by 10 dB
around “exact word names”, moves the stamp 280 ms later as a quiet local contact sample and moves
and reduces the chime. During “word”, music RMS changes from −33.943 to −43.943 dBFS and effects
from −31.446 to −57.648 dBFS. These are measurements; no human listening judgement is claimed.

The audio-only cached change takes **8.535 seconds**: metadata 2.085 s, mixing 3.509 s, mastering
and remux 2.941 s. No voice synthesis or picture rendering is repeated. Validation is separate
(84.380 s, including final ASR, fidelity comparison and review images). Raw evidence is in
[audio-ab.json](verification-data/audio-ab.json). The directed mix selects a −5 dB mastering
ceiling because this particular AAC encode overshot a less conservative waveform ceiling;
the exported file, not only the pre-encode WAV, is measured. Legacy mastering is unchanged.

A fully silent 15-second variation of the music-clock reel also passes full decode, duration,
geometry and picture checks. Its measured digital silence correctly makes loudness, peak,
speech recognition and audio correlation inapplicable. See [silent-validation.json](verification-data/silent-validation.json).
The selection regression check ensures replacing a local score removes that music stem while
retaining independently selected ambience.

## Delivery status

Implementation and capability checks are complete. [PR #6](https://github.com/Raul8900/lockstep-studio/pull/6)
was confirmed open at c7f6946 before any aircraft-video authoring began. The original narrated aircraft
film and its inputs are on this same branch. See its [final verification](../videos/aircraft-window/docs/final_verification.md)
for the final render commit, exact delivered checksum, decoded story review, stage costs and reproduction.
The requester receives the verified MP4 and a secondary review package containing both A/B listening
clips, capability fixtures, captions, sources and contact sheets. No human listening judgement is claimed.

## Playback compatibility repair

The requester reported that the first delivery froze after 3–4 seconds in both preview and a
downloaded player. Although the original file passed local continuous Chromium playback, its
verification had relied on decode and still extraction rather than an explicit presentation test.
The replacement uses optional H.264 Constrained Baseline with no B-frames, stripped image/SEI
metadata, explicit SDR color tags and constant 30 fps. It has a fresh filename and a ZIP containing
the exact MP4. The device-specific root cause remains unconfirmed.

`bin/lockstep check-playback` now tests the whole file without seeking, recording presented frames,
per-second picture hashes, decoder counters and chronological screenshots. Nine focused tests pass,
including an actual ICC-JPEG encode regression check. The full repository self-test passes and its
final MP4, timings and stems remain byte-identical to the baseline; the GPU scan passes. See the
[repair report](../videos/aircraft-window/docs/playback-fix.md) for replacement delivery facts and
continuous playback measurements. Earlier export records are explicitly retained as superseded.
