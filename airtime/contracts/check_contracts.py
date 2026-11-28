"""Validate Airtime's contract examples and config files against the JSON Schemas.

Run from anywhere:
    uv run --with jsonschema --with pyyaml python airtime/contracts/check_contracts.py
Exit status 0 means every example and config file is valid.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator
from referencing import Registry, Resource

HERE = Path(__file__).resolve().parent
CONFIG = HERE.parent / "config"
BASE = "https://airtime.local/contracts/"

# example file → schema file and an optional pointer into its $defs
EXAMPLES = {
    "growth-brief.json": ("growth-brief.schema.json", None),
    "review-notes.json": ("review-notes.schema.json", None),
    "handoff.json": ("handoff.schema.json", None),
    "engine-job.json": ("engine-job.schema.json", None),
    "engine-job-event.json": ("engine-job.schema.json", "event"),
    "brain-run.json": ("brain-run.schema.json", None),
    "critic-output.json": ("role-outputs.schema.json", "critic"),
    "accounts.json": ("accounts.schema.json", None),
    "upload-request.json": ("youtube.schema.json", "upload_request"),
    "upload-status.json": ("youtube.schema.json", "upload_status"),
    "analytics-snapshot.json": ("youtube.schema.json", "analytics_snapshot"),
    "signals.json": ("scout.schema.json", "signals"),
    "probes.json": ("scout.schema.json", "probes"),
    "mark-uploaded.json": ("control-api.schema.json", "mark_uploaded"),
}
CONFIGS = ["markets", "rubric", "autopilot", "roles", "claude"]


def load_registry() -> Registry:
    resources = []
    for path in sorted(HERE.glob("*.schema.json")):
        schema = json.loads(path.read_text())
        expected = BASE + path.name
        if schema.get("$id") != expected:
            raise SystemExit(f"{path.name}: $id must be {expected}")
        Draft202012Validator.check_schema(schema)
        resources.append((expected, Resource.from_contents(schema)))
    return Registry().with_resources(resources)


def validate(registry: Registry, instance: object, schema_file: str, pointer: str | None) -> list[str]:
    ref = BASE + schema_file + (f"#/$defs/{pointer}" if pointer else "")
    validator = Draft202012Validator({"$ref": ref}, registry=registry,
                                     format_checker=Draft202012Validator.FORMAT_CHECKER)
    return [f"{'/'.join(map(str, e.absolute_path)) or '(root)'}: {e.message}"
            for e in sorted(validator.iter_errors(instance), key=lambda e: list(e.absolute_path))]


def semantic_checks(cfg: dict) -> list[str]:
    problems = []
    rubric, markets = cfg["rubric"], cfg["markets"]["markets"]
    dims = {d["id"] for d in rubric["dimensions"]}
    if abs(sum(d["weight"] for d in rubric["dimensions"]) - 100) > 1e-6:
        problems.append("rubric: dimension weights must sum to 100")
    for gate in rubric["hard_gates"]:
        if gate["dimension"] not in dims:
            problems.append(f"rubric: hard gate on unknown dimension {gate['dimension']}")
    enabled = [m for m in markets if m["enabled"]]
    if abs(sum(m["weight"] for m in enabled) - 1) > 1e-6:
        problems.append("markets: enabled market weights must sum to 1")
    codes = {m["code"] for m in markets}
    if len(codes) != len(markets):
        problems.append("markets: duplicate market code")
    ids = [a["id"] for a in cfg["claude"]["accounts"]]
    if len(set(ids)) != len(ids):
        problems.append("claude: duplicate account id")
    critic = json.loads((HERE / "examples" / "critic-output.json").read_text())
    scored = {d["id"] for d in critic["dimensions"]}
    judged = {d["id"] for d in rubric["dimensions"] if not d.get("deterministic")}
    if scored != judged:
        problems.append(f"critic example: scores {sorted(scored)} but the rubric expects {sorted(judged)}")
    brief = json.loads((HERE / "examples" / "growth-brief.json").read_text())
    unknown = {m["code"] for m in brief["markets"]} - codes
    if unknown:
        problems.append(f"growth-brief example: unknown markets {sorted(unknown)}")
    return problems


def main() -> int:
    registry = load_registry()
    failures = 0
    for name, (schema_file, pointer) in EXAMPLES.items():
        errors = validate(registry, json.loads((HERE / "examples" / name).read_text()), schema_file, pointer)
        failures += bool(errors)
        print(f"{'FAIL' if errors else 'ok  '} examples/{name}")
        for e in errors:
            print(f"       {e}")
    cfg = {}
    for name in CONFIGS:
        cfg[name] = yaml.safe_load((CONFIG / f"{name}.yaml").read_text())
        errors = validate(registry, cfg[name], "config.schema.json", name)
        failures += bool(errors)
        print(f"{'FAIL' if errors else 'ok  '} config/{name}.yaml")
        for e in errors:
            print(f"       {e}")
    for problem in semantic_checks(cfg):
        failures += 1
        print(f"FAIL {problem}")
    unchecked = {p.name for p in (HERE / "examples").glob("*.json")} - set(EXAMPLES)
    for name in sorted(unchecked):
        failures += 1
        print(f"FAIL examples/{name} is not mapped to a schema in check_contracts.py")
    print("all contracts valid" if not failures else f"{failures} problem(s)")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
