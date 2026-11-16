"""Resolved opt-in choices alongside measured evidence; legacy report stays intact."""
import json
from pathlib import Path


def write_report(root, cfg):
    def read(name):
        file = root / "data" / name
        return json.loads(file.read_text()) if file.exists() else {}
    resolved, timeline = read("choices_resolved.json"), read("timeline.json")
    validation, master, audio = read("validation.json"), read("master_report.json"), read("audio_stats.json")
    narration = read("takes.json").get("meta", {})
    lines = [f"# Production report — {cfg.get('title', root.name)}", "",
             "Measured technical results are below. Listening and visual review are separate author judgements.", "",
             "## Saved direction", "", "Choices live in video.json, style.json, scene code and docs/creative_brief.md.",
             "Rendering and rerendering these inputs uses zero authoring model calls. Voice generation is a separate local step.", "",
             "```json", json.dumps(resolved, indent=2, ensure_ascii=False), "```", "",
             "## Backends actually loaded", "", "```json", json.dumps(timeline.get("choices", {}).get("loaded", {}), indent=2), "```", "",
             "## Narration and clock", "", f"Timing provenance: `{narration.get('timing_provenance', 'Kokoro phoneme durations, 25 ms')}`.",
             f"Words: {narration.get('word_count', 0)}. Duration: {timeline.get('dur')} seconds.",
             "Speech and caption metrics are inapplicable when clock.mode=music; its SRT is empty.", "",
             "## Measured final file", "", "```json", json.dumps(validation, indent=2), "```", "",
             "## Audio", "", "```json", json.dumps(dict(mix=audio, master=master), indent=2), "```", ""]
    notes = root / "docs/report_notes.md"
    if notes.exists(): lines += [notes.read_text(), ""]
    lines += ["## Reproduction", "", f"Run `bin/lockstep build {root.name}` after setup and the recorded voice or explicit clock. See docs/production-choices.md for optional backend setup.", ""]
    (root / "docs").mkdir(exist_ok=True)
    (root / "docs/production_report.md").write_text("\n".join(lines))
    print("docs/production_report.md written (resolved choices + measurements)")
