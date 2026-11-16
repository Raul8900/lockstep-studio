"""Boundary/contract tests for opt-in clocks, assets, recording provenance and audio."""
import hashlib
import json
import sys
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path

import numpy as np
import soundfile as sf

REPO = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(REPO / "engine"), str(REPO / "engine/audio")]
from catalogue import search, select
from production import clock_data, import_voice, local_asset, preflight, sha256
from directed import envelope, sample, stems


class ProductionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.cfg = dict(title="fixture", chapters=[dict(id="a", name="A", start=0), dict(id="b", name="B", start=2)],
                        clock=dict(mode="music", duration=4, bpm=120, markers={"hit": {"frame": 60}}))
        self.save()

    def tearDown(self):
        self.tmp.cleanup()

    def save(self):
        (self.root / "video.json").write_text(json.dumps(self.cfg))

    def test_music_clock_has_no_fictional_speech(self):
        preflight(self.root)
        takes = json.loads((self.root / "data/takes.json").read_text())
        self.assertEqual(takes["takes"], [])
        self.assertIsNone(takes["meta"]["speech_end"])
        self.assertEqual(json.loads((self.root / "data/words.json").read_text()), [])
        self.assertEqual(takes["beats"][1]["t0"], 2)
        self.cfg["chapters"][1]["start"] = 0
        with self.assertRaisesRegex(ValueError, "strictly increasing"):
            clock_data(self.cfg)

    def test_search_and_independent_selection(self):
        self.assertEqual(search("follow a signal")[0]["id"], "native.signal")
        select(self.root, "shot", "native.scale", "a", {"values": [2, 4]})
        select(self.root, "effects", "effects.none")
        cfg = json.loads((self.root / "video.json").read_text())
        self.assertEqual(cfg["choices"]["shots"]["a"]["inputs"]["values"], [2, 4])
        self.assertEqual(cfg["audio"]["effects"], "none")

    def test_assets_cannot_escape_project(self):
        with self.assertRaises(ValueError): local_asset(self.root, "../outside.wav")
        with self.assertRaisesRegex(ValueError, "missing local asset"): local_asset(self.root, "missing.wav")

    def test_missing_selected_backend_has_setup_remedy(self):
        self.cfg['choices'] = {'shots': {'a': {'item': 'three.local'}}}
        self.save()
        with patch('production.REPO', self.root):
            with self.assertRaisesRegex(ValueError, 'setup-optional three'):
                preflight(self.root)

    def test_sample_seeking_trim_variation_and_fades(self):
        sr = 1000
        for name, value in (("one", .2), ("two", .8)):
            sf.write(self.root / f"{name}.wav", np.full(1000, value), sr, subtype="FLOAT")
        cue = dict(files=["one.wav", "two.wav"], seed=4, id="contact", trim_start=.2, trim_end=.8, fade_in=.02, fade_out=.02)
        a, b = sample(self.root, cue, sr), sample(self.root, cue, sr)
        np.testing.assert_array_equal(a, b)
        self.assertEqual(a.shape, (600, 2))
        self.assertEqual(a[0, 0], 0); self.assertEqual(a[-1, 0], 0)
        with self.assertRaises(ValueError): sample(self.root, dict(cue, trim_end=1.5), sr)

    def test_envelope_rest_is_smooth_and_word_anchored(self):
        timeline = {"scenes": [{"id": "a", "t0": 0, "t1": 4}]}
        words = [{"beat": "a", "w": "reveal", "t0": 1, "t1": 2}]
        env = envelope(4000, 1000, [{"from": {"chapter": "a", "word": "reveal"}, "to": 3, "rest": True, "fade": .2}], self.cfg, timeline, words)
        self.assertEqual(env[0], 1); self.assertEqual(env[2000], 0); self.assertEqual(env[-1], 1)
        self.assertLess(np.max(np.abs(np.diff(env))), .008)

    def test_duplicate_stem_rejected(self):
        sf.write(self.root / "air.wav", np.ones(1000) * .1, 1000)
        cfg = {"audio": {"stems": [{"file": "air.wav"}, {"file": "air.wav"}]}}
        with self.assertRaisesRegex(ValueError, "duplicate"):
            stems(self.root, cfg, {"dur": 4}, [], 1000)

    def test_external_voice_cannot_reuse_old_recording_timings(self):
        wav = self.root / "recorded.wav"
        sf.write(wav, np.sin(np.arange(24000) * .02) * .1, 24000)
        review = self.root / "review.json"
        data = dict(reviewed=True, audio_sha256=sha256(wav),
                    words=[dict(w="Hello", t0=.1, t1=.8, beat="a", take=0)],
                    takes=[dict(take=0, beat="a", text="Hello", t0=.1, t1=.8, pause_after=.2)],
                    beats=[dict(id="a", title="A", t0=.1, t1=.8)])
        review.write_text(json.dumps(data))
        self.cfg.pop("clock"); self.save()
        import_voice(self.root, wav, review)
        preflight(self.root)
        with (self.root / "audio/narration_24k.wav").open("ab") as f: f.write(b"changed")
        with self.assertRaisesRegex(ValueError, "audio changed"): preflight(self.root)
        data["audio_sha256"] = "wrong"; review.write_text(json.dumps(data))
        with self.assertRaisesRegex(ValueError, "exact WAV"): import_voice(self.root, wav, review)


if __name__ == "__main__":
    unittest.main()
