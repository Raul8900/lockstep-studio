# Production report — The tiny hole in aeroplane windows

Measured technical results are below. Listening and visual review are separate author judgements.

## Saved direction

Choices live in video.json, style.json, scene code and docs/creative_brief.md.
Rendering and rerendering these inputs uses zero authoring model calls. Voice generation is a separate local step.

```json
{
  "schema": 1,
  "selected": [
    {
      "id": "three.local",
      "version": 1,
      "slot": "shots",
      "backend": "three",
      "inputs": {},
      "source": "Three.js 0.180.0; original CC0 verification asset",
      "license": "MIT runtime; CC0-1.0 original model"
    },
    {
      "id": "three.local",
      "version": 1,
      "slot": "shots",
      "backend": "three",
      "inputs": {},
      "source": "Three.js 0.180.0; original CC0 verification asset",
      "license": "MIT runtime; CC0-1.0 original model"
    },
    {
      "id": "three.local",
      "version": 1,
      "slot": "shots",
      "backend": "three",
      "inputs": {},
      "source": "Three.js 0.180.0; original CC0 verification asset",
      "license": "MIT runtime; CC0-1.0 original model"
    },
    {
      "id": "three.local",
      "version": 1,
      "slot": "shots",
      "backend": "three",
      "inputs": {},
      "source": "Three.js 0.180.0; original CC0 verification asset",
      "license": "MIT runtime; CC0-1.0 original model"
    },
    {
      "id": "voice.kokoro",
      "version": 1,
      "slot": "narration",
      "backend": "audio",
      "inputs": {
        "voice": "af_heart",
        "speed": 1.0
      },
      "source": "Original Lockstep recipes and assets",
      "license": "CC0-1.0 (new example assets); repository code terms"
    },
    {
      "id": "score.none",
      "version": 1,
      "slot": "score",
      "backend": "audio",
      "inputs": {},
      "source": "Original Lockstep recipes and assets",
      "license": "CC0-1.0 (new example assets); repository code terms"
    },
    {
      "id": "effects.none",
      "version": 1,
      "slot": "effects",
      "backend": "audio",
      "inputs": {},
      "source": "Original Lockstep recipes and assets",
      "license": "CC0-1.0 (new example assets); repository code terms"
    },
    {
      "id": "sound.ambience",
      "version": 1,
      "slot": "ambience",
      "backend": "wav",
      "inputs": {},
      "source": "Original synthetic sample; scripts/generate_production_assets.py seed 2217",
      "license": "CC0-1.0"
    }
  ],
  "assets": {
    "assets/production/ambience.wav": "028af9c3b27c43d56c5864f172ba8f4e326e0cf6d8ea5a792551b4d8b6f84f8d"
  },
  "backends": [
    "audio",
    "three",
    "wav"
  ],
  "clock": {
    "mode": "narration"
  },
  "timing_provenance": {
    "provider": "kokoro-phoneme-durations",
    "resolution_ms": 25,
    "model_sha256": "13ea8cc2a2742b2ee5b6d1407b6aba099b4904478dd9ce9f45b2bebab0bed74f",
    "voices_sha256": "bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d",
    "script_sha256": "7d7512a1bee7c71cb2ae8ea73433169ad3018a57151d180f52e64449ea7a2b53",
    "render_wav_sha256": "4bc7c83e325f0079380f128cad87f51a23ae63012644b2b3e958b272218d1f7c"
  },
  "audio": {
    "music": {
      "source": "none",
      "bpm": 80,
      "kit": "soft"
    },
    "mix": {
      "master_ceiling_db": -3,
      "duck_ambience_db": -4
    },
    "direction": {
      "effects": "none",
      "stems": [
        {
          "role": "ambience",
          "file": "assets/production/ambience.wav",
          "loop": true,
          "gain_db": -23,
          "fade_in": 0.4,
          "fade_out": 0.8
        }
      ],
      "ambience_envelopes": [
        {
          "chapter": "pressure",
          "gain_db": -6,
          "fade": 0.2
        }
      ]
    }
  },
  "render_model_calls": 0
}
```

## Backends actually loaded

```json
{
  "backends": [
    "native",
    "three"
  ],
  "assets": [],
  "renderers": [
    "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)"
  ],
  "cues": []
}
```

## Narration and clock

Timing provenance: `{'provider': 'kokoro-phoneme-durations', 'resolution_ms': 25, 'model_sha256': '13ea8cc2a2742b2ee5b6d1407b6aba099b4904478dd9ce9f45b2bebab0bed74f', 'voices_sha256': 'bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d', 'script_sha256': '7d7512a1bee7c71cb2ae8ea73433169ad3018a57151d180f52e64449ea7a2b53', 'render_wav_sha256': '4bc7c83e325f0079380f128cad87f51a23ae63012644b2b3e958b272218d1f7c'}`.
Words: 102. Duration: 40.785 seconds.
Speech and caption metrics are inapplicable when clock.mode=music; its SRT is empty.

## Measured final file

```json
{
  "file": {
    "path": "dist/aircraft-window.mp4",
    "size_mb": 11.8,
    "container": "QuickTime / MOV",
    "duration_s": 40.8,
    "overall_bitrate_mbps": 2.32,
    "faststart": true
  },
  "video": {
    "codec": "h264",
    "profile": "High",
    "level": 4.2,
    "width": 1080,
    "height": 1920,
    "aspect": "9:16",
    "pix_fmt": "yuv420p",
    "fps": 30.0,
    "frames": 1224,
    "bitrate_mbps": 2.06,
    "color": "bt709/None/None tv"
  },
  "audio": {
    "codec": "aac",
    "profile": "LC",
    "sample_rate": 48000,
    "channels": 2,
    "bitrate_kbps": 246,
    "duration_s": 40.8
  },
  "decode_errors": 0,
  "black_segments": [],
  "freeze_segments": [
    [
      11.066667,
      11.633333
    ],
    [
      11.633333,
      12.033333
    ],
    [
      12.133333,
      12.533333
    ],
    [
      13.3,
      13.9
    ],
    [
      13.9,
      14.466667
    ],
    [
      14.5,
      15.133333
    ],
    [
      16.0,
      16.566667
    ],
    [
      18.666667,
      19.533333
    ],
    [
      19.533333,
      19.933333
    ],
    [
      20.833333,
      21.866667
    ],
    [
      22.766667,
      23.266667
    ],
    [
      24.3,
      24.733333
    ],
    [
      24.733333,
      25.333333
    ],
    [
      26.233333,
      26.666667
    ],
    [
      26.666667,
      27.066667
    ],
    [
      27.5,
      28.0
    ],
    [
      29.0,
      29.4
    ],
    [
      29.5,
      30.0
    ],
    [
      32.7,
      33.466667
    ],
    [
      36.766667,
      37.666667
    ],
    [
      37.733333,
      39.0
    ],
    [
      39.0,
      40.0
    ]
  ],
  "encode_fidelity": {
    "ssim_all": 0.995344,
    "psnr_avg_db": 51.513961
  },
  "loudness": {
    "integrated_lufs": -14.0,
    "range_lu": 2.1,
    "true_peak_dbtp": -3.1
  },
  "sync": {
    "narration_lag_ms_in_mp4": 0,
    "method": "cross-correlation of 10 ms envelopes, MP4 audio vs. original narration"
  },
  "stream_duration_error_s": 0.0,
  "final_mix_asr": {
    "wer_percent": 0.0,
    "errors": 0,
    "words": 103,
    "diffs": []
  },
  "caption_timing_crosscheck": {
    "matched_words": 96,
    "median_offset_ms": -125,
    "mean_abs_dev_ms": 76,
    "p95_abs_dev_ms": 176,
    "note": "independent transducer ASR vs. TTS-derived word starts; the median is the recogniser's own emission delay"
  },
  "captions": {
    "phrases": 36,
    "two_line": 6,
    "max_width_px": 695,
    "x_extent": [
      193,
      887
    ],
    "y_extent": [
      1260,
      1440
    ],
    "min_on_screen_s": 0.42,
    "max_words": 4
  }
}
```

## Audio

```json
{
  "mix": {
    "duration_s": 40.785,
    "voice_rms_while_speaking_db": -15.0,
    "music_rms_while_speaking_db": -240.0,
    "sfx_rms_while_speaking_db": -240.0,
    "bed_rms_while_speaking_db": -50.3,
    "music_rms_in_pauses_db": -240.0,
    "premaster_peak_db": -1.5,
    "sfx_cues": 0,
    "speech_to_bed_ratio_db": 35.3
  },
  "master": {
    "premaster_lufs": -11.7,
    "premaster_true_peak_db": -0.8,
    "applied_gain_db": -2.3,
    "max_limiter_reduction_db": -0.0,
    "final_lufs": -14.0,
    "final_lra_lu": 2.1,
    "final_true_peak_db": -3.1
  }
}
```

# Production review notes

Primary engineering claims checked against Airbus Safety First and AAIB printed page 5. Gaps and vent are enlarged; only the inner structural geometry contains the vent, scratch is passenger-side and outer is exterior-side. Air path ends at z=-0.48 between inner z=0 and outer z=-1.05. Normal outer pane is intact. A distinct amber annotation indicates load; backup is explicitly conditional. Physical leaders use the current Three camera projection.

The initial narration-only ASR reported pane/pain homophones. Clarifying those sentences with “windowpane” preserves the mechanical meaning and the revised recording passes with 0% WER; windowpane/window pane spacing variants are excluded by the existing normalizer. No human listening judgment is claimed. The final mixed audio and encoded frames are checked by the full build; measured results are recorded in final_verification.md after that pass.

All visuals are original procedural Canvas/Three geometry. Original bundled CC0 filtered-air ambience; no score and no event effects. Kokoro voice is local. Software, asset and rendering API incremental cost: ₹0 on existing hardware. Authoring uses the existing Codex session; token/model billing is not exposed here. Rendering uses zero authoring-model calls.


First-export review found that 780-pixel captions could reach the approximate Shorts button column. Final caption maxW is 720 pixels, with wrapping rather than smaller type. The cutaway camera has a slightly broader, smooth orbit and dolly to preserve visible depth during explanation. A full picture rebuild verified these changes; narration and its timing are unchanged.


Final technical, visual and mechanical checks are recorded in final_verification.md. All hard build checks pass. Low-motion intervals are intentionally retained for label reading. The exact delivered copy was decoded and matched by SHA256. No human listening was performed.


## Reproduction

Run `bin/lockstep build aircraft-window` after setup and the recorded voice or explicit clock. See docs/production-choices.md for optional backend setup.
