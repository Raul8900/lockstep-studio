# Superseded export

The requester reported a playback freeze in this original High-profile export. See final_verification.md for the replacement and playback-fix.md for the investigation. The following measurements describe the original file, not the replacement.

# Final aircraft-window verification

PR: https://github.com/Raul8900/lockstep-studio/pull/6

The PR was confirmed open at implementation commit c7f6946 before this production began.
Final render inputs were pushed at `4fafaedffac5d9b0d6fee0ff3afb18a51cc1b3a5` before the full build. Later evidence commits
contain reports/review images and do not change engine, scenes, style, recording or captions.

## Delivered artifact

`aircraft-window.mp4`, 11,822,675 bytes. Delivered to the task requester through the
workspace file channel, alongside `lockstep-review.zip`. A GitHub release asset upload was
unavailable (uploads endpoint rejected credentials); large renders remain outside Git history.
The local download, build commands and checksum provide a reproducible artifact identity.

SHA256: `3bd9333de800b0859f32847f1726d3287a66a6a5a4ce5437986f88538b8b815e`.

The source render and exact delivery copy match. The delivery copy passed an additional full
FFmpeg decode with `-xerror`, and its stream facts were read independently with ffprobe. Six PNGs
were decoded from that same delivery copy, covering all four story beats plus the normal/backup
load distinction. See `data/delivery.json`, `dist/four-beat-review.jpg` and the review package.

## Measured results

- Duration 40.8 s; 1080 × 1920; 30 fps; 1224 frames.
- H.264 High / AAC-LC stereo 48 kHz; faststart; clean full decode; no black segments.
- Loudness -14.0 LUFS; true peak -3.1 dBTP.
- Narration/master correlation lag 0 ms; audio/video duration difference 0.0 s.
- Final-mix ASR 0.0% WER (0/103); no human listening judgement is claimed.
- 36 caption phrases, width ≤ 695 px, x [193, 887], y [1260, 1440]; shortest 0.42 s.
- Encode SSIM 0.995344; reverse-order seeks at 2, 12, 23, 27.5, 33 and 39 s match full-render frame bytes.
- Independent transducer comparison: 96 matched words, median -125 ms, mean absolute deviation 76 ms, p95 176 ms. This is a recognizer timing cross-check, not a claim of ground-truth word timing accuracy.

## Visual and mechanical review

Decoded frames and both approximate mobile overlays were inspected. The scratch protector is
nearest the passenger; only the inner structural pane has the depicted vent. Leaders are projected
from physical layer coordinates throughout the camera move. The teal airflow terminates at
z=-0.48, between inner z=0 and outer z=-1.05 in the enlarged view. The normal-load frame keeps
the outer pane intact and uses a separate amber pressure-load annotation. The backup frame is
explicitly conditional and transfers that annotation to the inner structural pane. The film then
returns to the assembled passenger view. Source support is mapped in sources.md.

The first export revealed captions too close to the Shorts button column. The final picture was
rebuilt with maxW=720 and reviewed after encoding. Font size was retained, allowing line wrapping.
The cutaway also received a broader smooth orbit/dolly. The freeze detector reports
22 intervals of low full-frame change; these were reviewed as quiet explanatory
holds and retained for label reading. All scheduled frames are present; reverse-order seeks reproduce their saved bytes. The warnings
remain visible in validation.json and endpoint measurements in motion_review.json. The settled
passenger return can contain identical frames. Technical detection is reported without calling
every frame visibly animated.

## Time, dependencies and model usage

Local neural TTS took 23.639 s. The final full build took 579.762 s:

| Stage | Wall seconds |
|---|---:|
| direction | 0.112 |
| captions | 0.022 |
| meta | 2.483 |
| scan | 115.078 |
| audio | 2.488 |
| render | 302.895 |
| assemble | 66.615 |
| srt | 0.047 |
| validate | 89.937 |
| docs | 0.027 |
| report | 0.049 |

The build uses 4 frame workers and Chromium SwiftShader. Stage wall times include command startup;
scan also renders sampled frames. `assemble` includes local mastering and H.264/AAC encoding.
See build_cost.json for actual commands. Benchmark/cached-remux evidence for the implementation
is in the repository's docs/verification.md; its controlled idle benchmark is separate from this
production build. The optional 3D route has a measured cost beyond catalogue lookup.

Incremental software, assets and rendering API fees are ₹0 on existing hardware. No paid service
was used. Authoring used the available Codex session; its token counts, billing and active authoring
time are not exposed by this environment. Preview/frame rendering/rerendering call no authoring
models. Neural TTS and local ASR are separately installed local inference tools. Three 0.180.0 is
optional and pinned. Renderer details and loaded assets are recorded in the production report.

## Reproduce and listen

See reproduction.md and sources.md in this folder. The review package includes both level-matched
17.667-second legacy/directed audio clips, the native beat-clock reel and native/3D growth/biology
fixture, decoded story PNGs, mobile previews, subtitles, source credits, reports and checksums.
No claim of human listening approval is made; listening remains a human judgement.
