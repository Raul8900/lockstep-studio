"""Check the video's scan claims on its own pixels.

For each checkpoint, extracts the frame from the finished MP4 (or reads a still), decodes it with
zxing-cpp, and compares the result with what the narration claims at that moment. For frames that
decode, it also samples the 21 x 21 module grid at the positions zxing reports and counts which of
the 26 codewords differ from the clean code (tools/qr_model.json) — that is how “the tear took six
of the nine message bytes” is checked on the rendered picture, not only on the model.

Run (needs: pip install zxing-cpp pillow numpy; ffmpeg on PATH):
    python tools/verify_frames.py [dist/<output>.mp4]
Writes tools/verify_frames.json.
"""
import json, os, subprocess, sys, tempfile

import numpy as np
import zxingcpp
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
VIDEO = os.path.dirname(HERE)
MODEL = json.load(open(os.path.join(HERE, 'qr_model.json')))
N = MODEL['n']
CLEAN = np.array([[int(ch) for ch in row] for row in MODEL['matrix']])
CW = MODEL['codewords']

# (label, word cue as beat/word[/nth][/edge], offset s, expected text or None for "must not decode", sample grid?)
CHECKS = [
    ('cover frame, intact', 'hook/i', -0.2, 'STILL HERE', False),
    ('hook: torn, "It still scans"', 'hook/scans/1/t1', 0.3, 'STILL HERE', True),
    ('hook: torn, end of beat', 'hook/all/1/t1', 0.2, 'STILL HERE', True),
    ('bytes: logo plate, "middle"', 'bytes/middle/1/t1', 0.25, 'STILL HERE', False),
    ('fine print: corner square torn, "won\'t"', "fineprint/won't", 0.4, None, False),
    ('fine print: corner square torn, "scan" (before the slide out)', "fineprint/scan", 0.3, None, False),
    ('payoff: rebuilt, "every one"', 'payoff/one/1/t1', 0.35, 'STILL HERE', True),
    ('end card', 'payoff/torn/2/t1', 2.0, 'STILL HERE', True),
]


def cue(spec):
    parts = spec.split('/')
    beat, word = parts[0], parts[1]
    nth = int(parts[2]) if len(parts) > 2 else 1
    edge = parts[3] if len(parts) > 3 else 't0'
    words = json.load(open(os.path.join(VIDEO, 'data', 'words.json')))
    words = words['words'] if isinstance(words, dict) else words
    n = 0
    for w in words:
        key = w['w'].lower().strip('.,;:!?—…"“”()')
        if w['beat'] == beat and key == word:
            n += 1
            if n == nth:
                return w[edge]
    raise KeyError(spec)


def frame_at(mp4, t, tmp):
    out = os.path.join(tmp, f'f_{t:.3f}.png')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', mp4, '-frames:v', '1', out], check=True)
    return Image.open(out).convert('RGB')


def sample_grid(img, pos):
    """Module values (1 = dark) sampled at module centres, from the corner positions zxing reports."""
    g = np.asarray(img.convert('L'), dtype=float)
    P = {k: np.array([getattr(pos, k).x, getattr(pos, k).y], float) for k in ('top_left', 'top_right', 'bottom_left', 'bottom_right')}
    out = np.zeros((N, N), int)
    for r in range(N):
        for c in range(N):
            u, v = (c + 0.5) / N, (r + 0.5) / N
            p = (1 - u) * (1 - v) * P['top_left'] + u * (1 - v) * P['top_right'] + (1 - u) * v * P['bottom_left'] + u * v * P['bottom_right']
            x, y = int(round(p[0])), int(round(p[1]))
            out[r, c] = 1 if g[max(0, y - 2):y + 3, max(0, x - 2):x + 3].mean() < 128 else 0
    return out


# windows: every sampled frame inside must meet the expectation (start cue, offset, end cue or scene id, offset)
WINDOWS = [
    ('hook: torn, every frame until the slide', 'hook/tore', 0.95, 'scene:copies', -0.35, 'STILL HERE'),
    ('fine print: corner square torn, every frame until the slide', 'fineprint/tear', 0.15, 'scene:payoff', -0.35, None),
    ('end card: every frame', 'payoff/a', -0.2, 'end', -0.1, 'STILL HERE'),
]


def scene_t0(sid):
    tl = json.load(open(os.path.join(VIDEO, 'data', 'timeline.json')))
    for sc in tl['scenes']:
        if sc['id'] == sid:
            return sc['t0']
    raise KeyError(sid)


def main():
    mp4 = sys.argv[1] if len(sys.argv) > 1 else None
    if mp4 is None:
        dist = os.path.join(VIDEO, 'dist')
        mp4s = [f for f in os.listdir(dist) if f.endswith('.mp4')] if os.path.isdir(dist) else []
        if not mp4s:
            sys.exit('no MP4 in dist/: pass one as the first argument')
        mp4 = os.path.join(dist, mp4s[0])
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4], capture_output=True, text=True).stdout)
    results, ok_all = [], True
    with tempfile.TemporaryDirectory() as tmp:
        for label, spec, off, expect, grid in CHECKS:
            t = cue(spec) + off
            img = frame_at(mp4, t, tmp)
            bars = zxingcpp.read_barcodes(img)
            texts = [b.text for b in bars]
            ok = (texts == [expect]) if expect else (texts == [])
            row = {'check': label, 't': round(t, 2), 'decoded': texts, 'expected': expect, 'ok': ok}
            if grid and bars:
                m = sample_grid(img, bars[0].position)
                changed = [k for k, mods in enumerate(CW) if any(m[r][c] != CLEAN[r][c] for r, c in mods)]
                row['changed_codewords'] = changed
                row['changed_message_bytes'] = [k for k in changed if k < MODEL['data']]
            ok_all &= ok
            results.append(row)
            print(('PASS ' if ok else 'FAIL ') + json.dumps(row))
        for label, spec, off, end, eoff, expect in WINDOWS:
            t0 = cue(spec) + off
            t1 = (dur if end == 'end' else scene_t0(end.split(':')[1]) if end.startswith('scene:') else cue(end)) + eoff
            n_ok, n, bad = 0, 0, []
            t = t0
            while t <= t1:
                texts = [b.text for b in zxingcpp.read_barcodes(frame_at(mp4, t, tmp))]
                good = (texts == [expect]) if expect else (texts == [])
                n += 1; n_ok += good
                if not good:
                    bad.append(round(t, 2))
                t += 1 / 6
            ok = n_ok == n
            row = {'window': label, 't0': round(t0, 2), 't1': round(t1, 2), 'frames': n, 'as_expected': n_ok, 'expected': expect, 'exceptions': bad, 'ok': ok}
            ok_all &= ok
            results.append(row)
            print(('PASS ' if ok else 'FAIL ') + json.dumps(row))
    json.dump({'video': os.path.basename(mp4), 'checks': results, 'all_ok': ok_all}, open(os.path.join(HERE, 'verify_frames.json'), 'w'), indent=1)
    sys.exit(0 if ok_all else 1)


if __name__ == '__main__':
    main()
