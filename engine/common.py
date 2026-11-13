"""Shared paths and loaders for the engine scripts.

Every engine script takes the video folder (or its slug under videos/) as its
first argument. Models live outside the video folders so all videos share them.
"""
import importlib.util
import json
import os
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
ENGINE = REPO / "engine"
MODELS = Path(os.environ.get("LOCKSTEP_MODELS", REPO / "models"))


def project_dir(arg=None):
    """Resolve a video folder from a path or a slug under videos/."""
    if arg is None:
        arg = sys.argv[1] if len(sys.argv) > 1 else None
    if not arg:
        sys.exit("usage: " + Path(sys.argv[0]).name + " <video-dir or slug> ...")
    for cand in (Path(arg), REPO / "videos" / arg):
        if (cand / "video.json").exists():
            return cand.resolve()
    sys.exit(f"no video project at '{arg}' (expected a folder containing video.json)")


def load_config(project):
    return json.load(open(project / "video.json", encoding="utf-8"))


def load_module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def load_script(project):
    """The video's narration script (script.py)."""
    return load_module(project / "script.py", "video_script")


def need(path, hint):
    if not Path(path).exists():
        sys.exit(f"missing {path}\n  -> {hint}")
    return Path(path)
