# Production report — choices-reel

Measured technical results are below. Listening and visual review are separate author judgements.

## Saved direction

Choices live in video.json, style.json, scene code and docs/creative_brief.md.
Rendering and rerendering these inputs uses zero authoring model calls. Voice generation is a separate local step.

```json
{
  "schema": 1,
  "selected": [
    {
      "id": "native.signal",
      "version": 1,
      "slot": "shots",
      "backend": "native",
      "inputs": {
        "points": [
          [
            180,
            800
          ],
          [
            540,
            800
          ],
          [
            540,
            620
          ],
          [
            900,
            620
          ]
        ],
        "duration": 2.5,
        "label": "FOLLOW THE SIGNAL",
        "cue": {
          "marker": "accent0"
        }
      },
      "source": "Original Lockstep recipes and assets",
      "license": "CC0-1.0 (new example assets); repository code terms"
    },
    {
      "id": "native.evidence",
      "version": 1,
      "slot": "shots",
      "backend": "native",
      "inputs": {
        "text": "THE EVIDENCE",
        "detail": "One detail changes the explanation.",
        "duration": 2.5,
        "cue": {
          "marker": "accent1"
        }
      },
      "source": "Original Lockstep recipes and assets",
      "license": "CC0-1.0 (new example assets); repository code terms"
    },
    {
      "id": "native.number",
      "version": 1,
      "slot": "shots",
      "backend": "native",
      "inputs": {
        "value": 42,
        "unit": "UNITS",
        "duration": 2.5,
        "cue": {
          "marker": "accent2"
        }
      },
      "source": "Original Lockstep recipes and assets",
      "license": "CC0-1.0 (new example assets); repository code terms"
    },
    {
      "id": "native.scale",
      "version": 1,
      "slot": "shots",
      "backend": "native",
      "inputs": {
        "values": [
          1,
          3
        ],
        "labels": [
          "ONE",
          "THREE"
        ],
        "unit": "relative units",
        "duration": 2.5,
        "cue": {
          "marker": "accent3"
        }
      },
      "source": "Original Lockstep recipes and assets",
      "license": "CC0-1.0 (new example assets); repository code terms"
    },
    {
      "id": "native.parallax",
      "version": 1,
      "slot": "shots",
      "backend": "native",
      "inputs": {
        "speed": 0.18,
        "growth": true,
        "duration": 2.5,
        "cue": {
          "marker": "accent4"
        }
      },
      "source": "Original Lockstep recipes and assets",
      "license": "CC0-1.0 (new example assets); repository code terms"
    },
    {
      "id": "native.zoom",
      "version": 1,
      "slot": "shots",
      "backend": "native",
      "inputs": {
        "label": "A WORLD INSIDE",
        "duration": 2.5,
        "cue": {
          "marker": "accent5"
        }
      },
      "source": "Original Lockstep recipes and assets",
      "license": "CC0-1.0 (new example assets); repository code terms"
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
    "assets/production/paper.wav": "8259049a6d8231d6249543a60e983c1758e405f0605ec72f9a70b70cba47bfad"
  },
  "backends": [
    "audio",
    "native"
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
        "frame": 75
      },
      "accent2": {
        "frame": 150
      },
      "accent3": {
        "frame": 225
      },
      "accent4": {
        "frame": 300
      },
      "accent5": {
        "frame": 375
      }
    }
  },
  "timing_provenance": "explicit duration/beat clock",
  "audio": {
    "music": {
      "bpm": 120,
      "kit": "pulse"
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
    "native"
  ],
  "assets": [],
  "renderers": [],
  "cues": [
    {
      "scene": "shot0",
      "item": "native.signal",
      "t": 0,
      "source": {
        "marker": "accent0"
      }
    },
    {
      "scene": "shot1",
      "item": "native.evidence",
      "t": 2.5,
      "source": {
        "marker": "accent1"
      }
    },
    {
      "scene": "shot2",
      "item": "native.number",
      "t": 5,
      "source": {
        "marker": "accent2"
      }
    },
    {
      "scene": "shot3",
      "item": "native.scale",
      "t": 7.5,
      "source": {
        "marker": "accent3"
      }
    },
    {
      "scene": "shot4",
      "item": "native.parallax",
      "t": 10,
      "source": {
        "marker": "accent4"
      }
    },
    {
      "scene": "shot5",
      "item": "native.zoom",
      "t": 12.5,
      "source": {
        "marker": "accent5"
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
    "path": "dist/choices-reel.mp4",
    "size_mb": 5.1,
    "container": "QuickTime / MOV",
    "duration_s": 15.0,
    "overall_bitrate_mbps": 2.74,
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
    "bitrate_mbps": 2.46,
    "color": "bt709/None/None tv"
  },
  "audio": {
    "codec": "aac",
    "profile": "LC",
    "sample_rate": 48000,
    "channels": 2,
    "bitrate_kbps": 274,
    "duration_s": 15.0
  },
  "decode_errors": 0,
  "black_segments": [],
  "freeze_segments": [],
  "encode_fidelity": {
    "ssim_all": 0.990172,
    "psnr_avg_db": 48.745896
  },
  "loudness": {
    "integrated_lufs": -14.1,
    "range_lu": 2.0,
    "true_peak_dbtp": -1.5
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
    "music_rms_in_pauses_db": -30.7,
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
          "frame": 75
        },
        "accent2": {
          "frame": 150
        },
        "accent3": {
          "frame": 225
        },
        "accent4": {
          "frame": 300
        },
        "accent5": {
          "frame": 375
        }
      }
    }
  },
  "master": {
    "premaster_lufs": -16.8,
    "premaster_true_peak_db": -1.5,
    "applied_gain_db": 2.8,
    "max_limiter_reduction_db": -2.82,
    "final_lufs": -14.1,
    "final_lra_lu": 2.0,
    "final_true_peak_db": -1.5
  }
}
```

# Review notes

Engineering fixture. Measurements are automated; no human listening judgement is claimed.


## Reproduction

Run `bin/lockstep build choices-reel` after setup and the recorded voice or explicit clock. See docs/production-choices.md for optional backend setup.
