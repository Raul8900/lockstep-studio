#!/usr/bin/env python3
"""Reproduce the directed-mix comparison from a built, unchanged selftest fixture.

Run scripts/selftest.sh --keep first, then:
  python3 scripts/audio_ab.py /tmp/lockstep-selftest.XXXXXX/selftest --out work/audio-ab
The output directory must be new. No picture rendering or TTS is repeated.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import time

import numpy as np
import soundfile as sf

REPO = Path(__file__).resolve().parents[1]
CLI = REPO / 'bin/lockstep'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def video_hash(path):
    return subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(path), '-map', '0:v:0',
                                   '-c', 'copy', '-f', 'hash', '-hash', 'sha256', '-'], text=True).strip()


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('legacy', type=Path)
    ap.add_argument('--out', required=True, type=Path)
    args = ap.parse_args()
    legacy, out = args.legacy.resolve(), args.out.resolve()
    cfg = json.loads((legacy / 'video.json').read_text())
    source = legacy / 'dist' / (cfg['output'] + '.mp4')
    scene_name = 'scenes/s02_idea.js'
    scene = (legacy / scene_name).read_text()
    replacements = {
        "sfx(c.word, 'stamp', 0.9);": "sfx(c.word + 0.28, 'sample', 0.28, {file:'assets/production/contact.wav', fade_in:.015, fade_out:.06});",
        "sfx(c.word + 0.03, 'chime', 0.5);": "sfx(c.word + 0.38, 'chime', 0.25);",
    }
    if not source.exists() or not all(s in scene for s in replacements):
        ap.error('requires the built, unchanged three-scene selftest example')
    if out.exists():
        ap.error('choose a new --out directory; existing evidence is never overwritten')
    out.mkdir(parents=True)
    directed = out / 'directed-project'
    shutil.copytree(legacy, directed, ignore=shutil.ignore_patterns('out', 'dist', 'audio'))
    (directed / 'audio').mkdir()
    shutil.copy2(legacy / 'audio/narration_24k.wav', directed / 'audio/narration_24k.wav')
    (directed / 'dist').mkdir()
    dest = directed / 'dist' / source.name
    shutil.copy2(source, dest)
    (directed / 'out').mkdir()
    # Reference the immutable cached pictures only for the validation SSIM pass.
    (directed / 'out/frames').symlink_to(legacy / 'out/frames', target_is_directory=True)
    cfg['choices'] = dict(narration={'item': 'voice.kokoro'}, score={'item': 'score.synth'}, effects={'item': 'effects.mixed'})
    cfg['audio'] = dict(effects='mixed', music_envelopes=[{
        'from': {'chapter': 'idea', 'word': 'exact', 'offset': -.15},
        'to': {'chapter': 'idea', 'word': 'names', 'offset': .45},
        'gain_db': -10, 'fade': .12,
    }])
    cfg['mix'] = {'master_ceiling_db': -5}
    (directed / 'video.json').write_text(json.dumps(cfg, indent=2) + '\n')
    for old, new in replacements.items():
        scene = scene.replace(old, new)
    (directed / scene_name).write_text(scene)
    elapsed, commands = {}, []
    for name, tail in [('meta', []), ('audio', []), ('assemble', ['--remux']), ('validate', []), ('report', [])]:
        command = [str(CLI), name, str(directed), *tail]
        commands.append(command)
        start = time.monotonic()
        with (out / (name + '.log')).open('w') as log:
            subprocess.run(command, stdout=log, stderr=subprocess.STDOUT, check=True)
        elapsed[name] = round(time.monotonic() - start, 3)
        print(name, elapsed[name], 's', flush=True)
    subprocess.run(['python3', str(REPO / 'engine/summary.py'), str(directed)], check=True)
    result = dict(commands=commands, elapsed_s=elapsed,
                  cached_audio_change_s=round(sum(elapsed[k] for k in ('meta', 'audio', 'assemble')), 3),
                  listened_by_human=False,
                  editorial_change='Music dips 10 dB around exact word names; stamp moves 280 ms after word and becomes a quiet local contact; chime moves 380 ms after word and is reduced.')
    for label, project, mp4 in [('legacy', legacy, source), ('directed', directed, dest)]:
        validation = json.loads((project / 'data/validation.json').read_text())
        words = json.loads((project / 'data/words.json').read_text())
        word = next(w for w in words if w['beat'] == 'idea' and w['w'].lower().strip('.,') == 'word')
        record = dict(picture_stream_hash=video_hash(mp4), duration=validation['file']['duration_s'],
                      loudness=validation['loudness'], narration_sha256=sha(project / 'audio/narration_24k.wav'),
                      focus_word=word, asr=validation['final_mix_asr'])
        for stem in ('music', 'sfx'):
            audio, sr = sf.read(project / f'audio/{stem}.wav')
            part = audio[int(word['t0'] * sr):int(word['t1'] * sr)]
            record[stem + '_rms_during_focus_dbfs'] = round(float(20 * np.log10(np.sqrt(np.mean(part**2)) + 1e-12)), 3)
        delivered = out / (label + '.mp4')
        shutil.copy2(mp4, delivered)
        if sha(mp4) != sha(delivered):
            raise RuntimeError('delivered copy differs from validated source')
        subprocess.run(['ffmpeg', '-v', 'error', '-xerror', '-i', str(delivered), '-f', 'null', '-'], check=True)
        record['file_sha256'] = sha(delivered)
        result[label] = record
    for field in ('picture_stream_hash', 'narration_sha256'):
        if result['legacy'][field] != result['directed'][field]:
            raise RuntimeError(f'A/B {field} differs')
    result['level_match_difference_lu'] = round(abs(result['legacy']['loudness']['integrated_lufs'] - result['directed']['loudness']['integrated_lufs']), 3)
    if result['level_match_difference_lu'] > .3:
        raise RuntimeError('A/B differs by more than 0.3 LU')
    (out / 'evidence.json').write_text(json.dumps(result, indent=2) + '\n')
    print(out / 'evidence.json')


if __name__ == '__main__':
    main()
