"""Verify the actual compatible MP4 contract rather than encoder arguments alone."""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

import numpy as np
from PIL import Image, ImageCms
import soundfile as sf


@unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe'), 'FFmpeg required')
class CompatibleExportTests(unittest.TestCase):
    def test_icc_jpegs_produce_thirty_fps_without_reordering_or_icc(self):
        repo = Path(__file__).resolve().parents[1]
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for folder in ['out/frames', 'audio', 'data']:
                (root / folder).mkdir(parents=True)
            (root / 'video.json').write_text(json.dumps({'title': 'compatibility fixture', 'output': 'test', 'encode': {'compatible': True}}))
            (root / 'data/timeline.json').write_text(json.dumps({'total': 30}))
            icc = ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
            for i in range(30):
                Image.new('RGB', (64, 96), (i * 7, 80, 130)).save(root / f'out/frames/f{i:05d}.jpg', icc_profile=icc)
            tone = np.sin(np.arange(48000) * (2 * np.pi * 440 / 48000)) * .1
            sf.write(root / 'audio/mix_premaster.wav', np.column_stack([tone, tone]), 48000, subtype='PCM_24')
            result = subprocess.run([sys.executable, str(repo / 'engine/assemble.py'), str(root), '--preset', 'ultrafast'], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            mp4 = root / 'dist/test.mp4'
            info = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-of', 'json', str(mp4)], text=True))
            video = next(s for s in info['streams'] if s['codec_type'] == 'video')
            audio = next(s for s in info['streams'] if s['codec_type'] == 'audio')
            self.assertEqual(video['profile'], 'Constrained Baseline')
            self.assertEqual(video['avg_frame_rate'], '30/1')
            self.assertEqual(int(video['nb_frames']), 30)
            self.assertEqual(video['has_b_frames'], 0)
            self.assertAlmostEqual(float(video['duration']), 1, places=3)
            self.assertAlmostEqual(float(audio['duration']), 1, places=3)
            self.assertFalse(any(s.get('side_data_type') == 'ICC Profile' for s in video.get('side_data_list', [])))
            decoded = subprocess.run(['ffmpeg', '-v', 'error', '-xerror', '-i', str(mp4), '-f', 'null', '-'], capture_output=True, text=True)
            self.assertEqual(decoded.returncode, 0, decoded.stderr)


if __name__ == '__main__':
    unittest.main()
