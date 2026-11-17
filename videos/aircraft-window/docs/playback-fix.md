# Playback repair — replacement MP4

The requester reported that the previous MP4 played for 3–4 seconds and then froze in both the
chat preview and a downloaded player. The previous verification used FFmpeg decode, timestamp
checks and seeked story frames, which were insufficient to establish the requester's playback.

The original `3bd9333de800b0859f32847f1726d3287a66a6a5a4ce5437986f88538b8b815e` could not reproduce the freeze in local Chromium:
it played continuously to 40.766667 s, with 1224 total frames,
0 dropped and 0 corrupted frames. Its packet timestamps
were also continuous. The specific cause on the requester's player remains unconfirmed; the
replacement addresses encoding compatibility and provides a fresh delivery filename and ZIP.

## Changed export

- Original picture, captions, narration and timing are preserved; cached rendered frames were re-encoded.
- H.264 Constrained Baseline level 4.0; one reference; no B-frames; one-second keyframes.
- Explicit 30 fps, constant frame timestamps and a 30,000-unit video timescale.
- Inherited JPEG side data and H.264 SEI removed; SDR BT.709 tagged explicitly.
- AAC-LC stereo 48 kHz, MP4 faststart. Export profile is saved in video.json as encode.compatible.
- Replacement name `aircraft-window-fixed.mp4`; a ZIP contains the same file, README and checksum.

## Measured replacement

- 40.8 s, 1080 × 1920, 30 fps, 1224 frames; clean full decode.
- -14.0 LUFS; -3.1 dBTP; 0.0% final-mix ASR WER.
- Caption x bounds [193, 887]; shortest phrase 0.42 s; SSIM 0.993122.
- Exact delivery copy continuously played in Chromium 156.0.8078.79 at 1× over local HTTP, with no seeking.
- Last presented media time 40.766667 s; ended at 40.8 s; 1224 total frames,
  1 dropped, 0 corrupted. Largest callback gap 133.3 ms.
- Chronological picture hashes change throughout the later film. Seven screenshots were captured
  during playback, including the cutaway, normal load, backup load and final passenger return.
- SHA256 **`8acd357c0a9f09f1c02a2c32e8c627b8ede6a99e3fa9695beef19621f44e6278`**; 18,315,056 bytes. Delivery copy equals encoded source by SHA256.
- Export from pushed commit `4b820e553b5d1a007e34a493fcb4e8223b667790` took 98.549 s. Original 3D picture render commit: 4fafaed.
- Nine focused tests pass, including an actual ICC-JPEG-to-MP4 regression test for frame count,
  frame rate, profile, image side data and decode. Repository self-test passes; its MP4, word/take
  data and audio stems remain byte-identical to the baseline. GPU reference scan passes.

## Reproduce

```bash
bin/lockstep assemble aircraft-window --preset veryfast --crf 20
bin/lockstep validate aircraft-window
LOCKSTEP_CHROMIUM=/usr/bin/chromium bin/lockstep check-playback aircraft-window /workspace/output/aircraft-window-fixed.mp4
```

`check-playback` tests uninterrupted HTMLVideoElement playback with requestVideoFrameCallback,
frame-quality counters and chronological screenshots. A clean FFmpeg decode is still required.
The compatible encoder is optional; legacy projects retain the original profile and sound.
A compatible export cannot use --remux because replacing audio does not re-encode a video stream.

The source-of-truth delivery facts are data/delivery.json and data/playback.json. No human listening
judgement or playback verification on the requester's own device is claimed. Quiet explanation
holds are deliberate, but the encoded story progresses through all four beats.
