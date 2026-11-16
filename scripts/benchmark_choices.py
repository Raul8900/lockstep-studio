"""Measure fresh-process startup, short render wall time and peak process-tree RSS.

Optional measurement dependency: psutil. Run with the machine otherwise idle.
First run is labelled cold-process (OS caches are not forcibly evicted).
"""
import argparse
import json
import statistics
import subprocess
import time
from pathlib import Path

import psutil

ap = argparse.ArgumentParser()
ap.add_argument("renderer", help="path to base or head engine/render.js")
ap.add_argument("project")
ap.add_argument("--out", required=True)
ap.add_argument("--runs", type=int, default=4)
args = ap.parse_args()
results = []
for mode in ("meta", "video"):
    for i in range(args.runs):
        command = ["node", str(Path(args.renderer).resolve()), str(Path(args.project).resolve()), mode]
        if mode == "video": command += ["--from", "0", "--to", "5", "--workers", "1"]
        peak = 0
        start = time.perf_counter()
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        while process.poll() is None:
            try:
                root = psutil.Process(process.pid)
                rss = sum(p.memory_info().rss for p in [root, *root.children(recursive=True)])
                peak = max(peak, rss)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
            time.sleep(.05)
        stdout, stderr = process.communicate()
        if process.returncode:
            raise RuntimeError(stdout + stderr)
        results.append(dict(mode=mode, run=i, kind="cold-process" if i == 0 else "warm", command=command,
                            elapsed_s=round(time.perf_counter() - start, 4), peak_tree_rss_mib=round(peak / 2**20, 2),
                            stdout=stdout, stderr=stderr))
report = dict(runs=results, warm_medians={mode: statistics.median(r["elapsed_s"] for r in results if r["mode"] == mode and r["run"] > 0) for mode in ("meta", "video")},
              memory_method="sum of parent and descendant RSS sampled every 50 ms; shared pages may be counted in multiple processes")
Path(args.out).write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report["warm_medians"]))
