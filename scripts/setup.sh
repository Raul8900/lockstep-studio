#!/usr/bin/env bash
# Install everything the pipeline needs. Safe to run repeatedly: each step is skipped
# when it is already satisfied.
#
#   scripts/setup.sh              voice model, Python packages, fonts, tool checks
#   scripts/setup.sh --with-asr   also the speech-recognition models used for QA (~950 MB download)
#   scripts/setup.sh --check      report what is present, change nothing
#
# Needs network access to PyPI and to GitHub release downloads (github.com).
# Models go to $LOCKSTEP_MODELS (default: <repo>/models, which is git-ignored).
set -u
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODELS="${LOCKSTEP_MODELS:-$REPO/models}"
CHECK=0; WITH_ASR=0
for a in "$@"; do
  case "$a" in
    --check) CHECK=1 ;;
    --with-asr) WITH_ASR=1 ;;
    *) echo "unknown option: $a"; exit 2 ;;
  esac
done
FAIL=0
ok()   { printf '  ok       %s\n' "$1"; }
miss() { printf '  MISSING  %s\n' "$1"; FAIL=1; }
note() { printf '  --       %s\n' "$1"; }
have_py() { python3 -c "import $1" >/dev/null 2>&1; }
fetch() { # url dest
  [ -s "$2" ] && return 0
  mkdir -p "$(dirname "$2")"
  curl -sS -L --fail --retry 3 -o "$2.part" "$1" && mv "$2.part" "$2"
}

echo "== tools"
for t in python3 node ffmpeg ffprobe curl; do
  if command -v "$t" >/dev/null 2>&1; then ok "$t"; else miss "$t (install it with your system package manager)"; fi
done
if node -e "try{require('playwright')}catch(e){require((process.env.NODE_PATH||'/opt/node22/lib/node_modules')+'/playwright')}" >/dev/null 2>&1; then
  ok "playwright (node module)"
else
  miss "playwright  ->  npm install -g playwright && npx playwright install chromium"
fi

echo "== python packages"
if [ "$CHECK" = 0 ]; then
  have_py numpy && have_py scipy && have_py soundfile && have_py PIL && have_py onnx && have_py onnxruntime && have_py kokoro_onnx \
    || pip install --quiet numpy scipy soundfile pillow onnx onnxruntime kokoro-onnx 2>&1 | grep -v "WARNING: Running pip as" || true
  # misaki (pronunciation front-end): its [en] extra pulls packages that do not build everywhere,
  # so install the pieces it actually uses, binary wheels only
  have_py spacy && have_py regex && have_py addict \
    || pip install --quiet --only-binary=:all: spacy regex addict 2>&1 | grep -v "WARNING: Running pip as" || true
  have_py misaki && have_py num2words \
    || pip install --quiet --no-deps misaki num2words 2>&1 | grep -v "WARNING: Running pip as" || true
  have_py en_core_web_sm \
    || pip install --quiet --no-deps "https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl" 2>&1 | grep -v "WARNING: Running pip as" || true
  if [ "$WITH_ASR" = 1 ]; then have_py sherpa_onnx || pip install --quiet sherpa-onnx 2>&1 | grep -v "WARNING: Running pip as" || true; fi
fi
for m in numpy scipy soundfile PIL onnx onnxruntime kokoro_onnx espeakng_loader phonemizer spacy regex misaki num2words en_core_web_sm; do
  if have_py "$m"; then ok "$m"; else miss "python module $m"; fi
done

echo "== voice model ($MODELS)"
if [ "$CHECK" = 0 ] && [ ! -s "$MODELS/kokoro-v1.0-dur.onnx" ]; then
  fetch "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx" "$MODELS/kokoro-v1.0.onnx" \
    && python3 "$REPO/engine/tts/patch_model.py" "$MODELS/kokoro-v1.0.onnx" "$MODELS/kokoro-v1.0-dur.onnx" >/dev/null \
    && rm -f "$MODELS/kokoro-v1.0.onnx"          # only the patched copy is used
fi
[ "$CHECK" = 0 ] && fetch "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin" "$MODELS/voices-v1.0.bin"
if [ -s "$MODELS/kokoro-v1.0-dur.onnx" ]; then ok "kokoro-v1.0-dur.onnx (patched to report phoneme durations)"; else miss "kokoro-v1.0-dur.onnx"; fi
if [ -s "$MODELS/voices-v1.0.bin" ]; then ok "voices-v1.0.bin"; else miss "voices-v1.0.bin"; fi

echo "== speech-recognition models (optional QA)"
W="$MODELS/asr/sherpa-onnx-whisper-small.en"; Z="$MODELS/asr/sherpa-onnx-zipformer-en-2023-06-26"
if [ "$CHECK" = 0 ] && [ "$WITH_ASR" = 1 ]; then
  mkdir -p "$MODELS/asr"
  if [ ! -d "$W" ]; then
    fetch "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-small.en.tar.bz2" "$MODELS/asr/w.tar.bz2" \
      && tar xjf "$MODELS/asr/w.tar.bz2" -C "$MODELS/asr" && rm -f "$MODELS/asr/w.tar.bz2" "$W"/small.en-encoder.onnx "$W"/small.en-decoder.onnx
  fi
  if [ ! -d "$Z" ]; then
    fetch "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-zipformer-en-2023-06-26.tar.bz2" "$MODELS/asr/z.tar.bz2" \
      && tar xjf "$MODELS/asr/z.tar.bz2" -C "$MODELS/asr" && rm -f "$MODELS/asr/z.tar.bz2" "$Z"/*-avg-1.onnx
  fi
fi
if [ -d "$W" ] && [ -d "$Z" ] && have_py sherpa_onnx; then ok "whisper small.en + zipformer (lockstep check-voice, validate)"
else note "not installed — voice and final-mix transcription checks will be skipped (scripts/setup.sh --with-asr)"; fi

echo "== fonts"
FONTDIR="${XDG_DATA_HOME:-$HOME/.local/share}/fonts/lockstep"
has_font() { fc-list 2>/dev/null | grep -qi "$1"; }
if [ "$CHECK" = 0 ] && command -v fc-list >/dev/null 2>&1; then
  if ! has_font "Inter Display"; then
    T="$(mktemp -d)"; mkdir -p "$FONTDIR"
    fetch "https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip" "$T/inter.zip" \
      && python3 -c "import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); [open(sys.argv[2]+'/'+n.split('/')[-1],'wb').write(z.read(n)) for n in z.namelist() if n.startswith('extras/otf/') and n.endswith('.otf')]" "$T/inter.zip" "$FONTDIR"
    rm -rf "$T"; fc-cache -f >/dev/null 2>&1
  fi
  if ! has_font "JetBrains Mono"; then
    T="$(mktemp -d)"; mkdir -p "$FONTDIR"
    fetch "https://github.com/JetBrains/JetBrainsMono/releases/download/v2.304/JetBrainsMono-2.304.zip" "$T/jbm.zip" \
      && python3 -c "import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); [open(sys.argv[2]+'/'+n.split('/')[-1],'wb').write(z.read(n)) for n in z.namelist() if n.startswith('fonts/ttf/') and n.endswith('.ttf')]" "$T/jbm.zip" "$FONTDIR"
    rm -rf "$T"; fc-cache -f >/dev/null 2>&1
  fi
fi
for f in "Inter Display" "Inter" "JetBrains Mono"; do
  if has_font "$f"; then ok "$f"; else miss "font: $f (text would fall back to DejaVu and layouts would shift)"; fi
done

echo
if [ "$FAIL" = 0 ]; then echo "ready."; else echo "some requirements are missing (see MISSING above)."; fi
exit "$FAIL"
