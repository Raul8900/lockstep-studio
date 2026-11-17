# Production report — choices-mixed

Measured technical results are below. Listening and visual review are separate author judgements.

## Saved direction

Choices live in video.json, style.json, scene code and docs/creative_brief.md.
Rendering and rerendering these inputs uses zero authoring model calls. Voice generation is a separate local step.

```json
{
  "schema": 1,
  "selected": [
    {
      "id": "native.growth",
      "version": 1,
      "slot": "shots",
      "backend": "native",
      "inputs": {
        "duration": 5.0,
        "cue": {
          "marker": "accent0"
        }
      },
      "source": "Original Lockstep recipes and assets",
      "license": "CC0-1.0 (new example assets); repository code terms"
    },
    {
      "id": "native.cell",
      "version": 1,
      "slot": "shots",
      "backend": "native",
      "inputs": {
        "duration": 5.0,
        "cue": {
          "marker": "accent1"
        }
      },
      "source": "Original Lockstep recipes and assets",
      "license": "CC0-1.0 (new example assets); repository code terms"
    },
    {
      "id": "three.rig",
      "version": 1,
      "slot": "shots",
      "backend": "three",
      "inputs": {
        "model": "assets/production/hinge-rig.glb",
        "duration": 5.0,
        "cue": {
          "marker": "accent2"
        }
      },
      "source": "Three.js 0.180.0; original CC0 verification asset",
      "license": "MIT runtime; CC0-1.0 original model"
    },
    {
      "id": "voice.none",
      "version": 1,
      "slot": "narration",
      "backend": "audio",
      "inputs": {},
      "source": "Original Lockstep recipes and assets",
      "license": "CC0-1.0 (new example assets); repository code terms"
    },
    {
      "id": "score.synth",
      "version": 1,
      "slot": "score",
      "backend": "audio",
      "inputs": {},
      "source": "Original Lockstep recipes and assets",
      "license": "CC0-1.0 (new example assets); repository code terms"
    },
    {
      "id": "effects.mixed",
      "version": 1,
      "slot": "effects",
      "backend": "audio",
      "inputs": {},
      "source": "Original Lockstep recipes and assets",
      "license": "CC0-1.0 (new example assets); repository code terms"
    }
  ],
  "assets": {
    "assets/production/hinge-rig.glb": "f95a6325c2536d9fb41a9049bd493a202acd7644718d844e667d081d1a1d8545"
  },
  "backends": [
    "audio",
    "native",
    "three"
  ],
  "clock": {
    "mode": "music",
    "duration": 15,
    "bpm": 120,
    "markers": {
      "accent0": {
        "frame": 0
      },
      "accent1": {
        "frame": 150
      },
      "accent2": {
        "frame": 300
      }
    }
  },
  "timing_provenance": "explicit duration/beat clock",
  "audio": {
    "music": {
      "bpm": 120,
      "kit": "soft"
    },
    "mix": {},
    "direction": {
      "effects": "mixed",
      "music_envelopes": [
        {
          "from": {
            "beat": 10
          },
          "to": {
            "beat": 12
          },
          "gain_db": -8,
          "fade": 0.12
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
  "assets": [
    "assets/production/hinge-rig.glb"
  ],
  "renderers": [
    "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)"
  ],
  "cues": [
    {
      "scene": "shot0",
      "item": "native.growth",
      "t": 0,
      "source": {
        "marker": "accent0"
      }
    },
    {
      "scene": "shot1",
      "item": "native.cell",
      "t": 5,
      "source": {
        "marker": "accent1"
      }
    },
    {
      "scene": "shot2",
      "item": "three.rig",
      "t": 10,
      "source": {
        "marker": "accent2"
      }
    }
  ]
}
```

## Narration and clock

Timing provenance: `explicit duration/beat clock`.
Words: 0. Duration: 15 seconds.
Speech and caption metrics are inapplicable when clock.mode=music; its SRT is empty.

## Measured final file

```json
{
  "file": {
    "path": "dist/choices-mixed.mp4",
    "size_mb": 5.7,
    "container": "QuickTime / MOV",
    "duration_s": 15.0,
    "overall_bitrate_mbps": 3.05,
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
    "frames": 450,
    "bitrate_mbps": 2.79,
    "color": "bt709/None/None tv"
  },
  "audio": {
    "codec": "aac",
    "profile": "LC",
    "sample_rate": 48000,
    "channels": 2,
    "bitrate_kbps": 253,
    "duration_s": 15.0
  },
  "decode_errors": 0,
  "black_segments": [],
  "freeze_segments": [],
  "encode_fidelity": {
    "ssim_all": 0.989663,
    "psnr_avg_db": 48.193674
  },
  "loudness": {
    "integrated_lufs": -14.0,
    "range_lu": 1.6,
    "true_peak_dbtp": -2.3
  },
  "sync": {
    "music_lag_ms_in_mp4": 0,
    "method": "10 ms envelope correlation against mastered music; no speech metrics"
  },
  "stream_duration_error_s": 0.0,
  "final_mix_asr": {
    "skipped": "inapplicable: no narration"
  }
}
```

## Audio

```json
{
  "mix": {
    "duration_s": 15.0,
    "speech_metrics": "inapplicable: no narration",
    "speech_to_bed_ratio_db": null,
    "voice_rms_while_speaking_db": null,
    "music_rms_while_speaking_db": null,
    "music_rms_in_pauses_db": -25.9,
    "premaster_peak_db": -1.5,
    "sfx_cues": 2,
    "clock": {
      "mode": "music",
      "duration": 15,
      "bpm": 120,
      "markers": {
        "accent0": {
          "frame": 0
        },
        "accent1": {
          "frame": 150
        },
        "accent2": {
          "frame": 300
        }
      }
    }
  },
  "master": {
    "premaster_lufs": -13.2,
    "premaster_true_peak_db": -1.5,
    "applied_gain_db": -0.8,
    "max_limiter_reduction_db": -0.0,
    "final_lufs": -14.0,
    "final_lra_lu": 1.6,
    "final_true_peak_db": -2.3
  }
}
```

# Review notes

Engineering fixture. Measurements are automated; no human listening judgement is claimed.


## Reproduction

Run `bin/lockstep build choices-mixed` after setup and the recorded voice or explicit clock. See docs/production-choices.md for optional backend setup.
