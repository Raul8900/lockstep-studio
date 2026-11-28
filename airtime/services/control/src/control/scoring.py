"""Deterministic scoring (plan: Lifecycle steps 3–5; config/rubric.yaml).

The critic (brain) scores every dimension except `technical`, which comes from the engine's QA in
the handoff. The total is the weighted mean of the dimension scores (Σ weight × score / Σ weight,
which is Σ weight × score / 100 with the default weights); a failed hard gate caps it at
threshold − 1.
"""

from __future__ import annotations

from .ids import new_id

LOUDNESS_TARGET_LUFS, LOUDNESS_TOLERANCE = -14.0, 2.0


def _penalties(s: dict) -> list[tuple[float, str]]:
    """What each problem in the QA summary costs, out of 100 (a missing value costs nothing)."""
    out: list[tuple[float, str]] = []
    lufs, peak = s.get("loudness_lufs"), s.get("true_peak_dbtp")
    if lufs is not None and abs(lufs - LOUDNESS_TARGET_LUFS) > LOUDNESS_TOLERANCE:
        off = abs(lufs - LOUDNESS_TARGET_LUFS) - LOUDNESS_TOLERANCE
        out.append((min(20.0, 4 * off), f"loudness {lufs} LUFS (target {LOUDNESS_TARGET_LUFS} ± 2)"))
    if peak is not None and peak > -1.0:
        out.append((10.0, f"true peak {peak} dBTP (max -1.0)"))
    if (sync := s.get("sync_ms")) is not None and abs(sync) > 40:
        out.append((min(20.0, (abs(sync) - 40) / 5), f"caption sync off by {sync} ms"))
    if (wer := s.get("wer_percent")) is not None and wer > 3:
        out.append((min(25.0, 3 * (wer - 3)), f"transcription error rate {wer} %"))
    for key, label in (("freeze_segments", "frozen"), ("black_segments", "black")):
        if n := s.get(key):
            out.append((min(30.0, 10.0 * n), f"{n} {label} segment(s)"))
    if s.get("decode_errors"):
        out.append((40.0, f"{s['decode_errors']} decode error(s)"))
    if n := s.get("lint_warnings"):
        out.append((min(10.0, 2.0 * n), f"{n} lint warning(s)"))
    return out


def technical(qa: dict | None) -> tuple[float, list[str]]:
    """Score the engine's QA 0–100. A cut whose own QA failed stays below the hard gate (60)."""
    if not qa:
        return 0.0, ["the handoff has no QA"]
    penalties = _penalties(qa.get("summary") or {})
    score = max(0.0, 100.0 - sum(p for p, _ in penalties))
    issues = [why for _, why in penalties]
    if not qa.get("passed"):
        score = min(score, 59.0)
        issues.insert(0, "the engine's own QA did not pass")
    return round(score, 1), issues


def scorecard(critic: dict, handoff: dict, rubric: dict) -> dict:
    by_id = {d.get("id"): d for d in critic.get("dimensions") or [] if isinstance(d, dict)}
    tech_score, tech_issues = technical(handoff.get("qa"))
    dims = []
    for dim in rubric["dimensions"]:
        if dim["id"] == "technical":
            dims.append({"id": "technical", "score": tech_score, "weight": dim["weight"],
                         "evidence": "computed from the engine's QA", "issues": tech_issues})
            continue
        given = by_id.get(dim["id"])
        try:
            score = min(100.0, max(0.0, float(given["score"]))) if given else 0.0
        except (TypeError, ValueError):
            given, score = None, 0.0
        dims.append({"id": dim["id"], "score": score, "weight": dim["weight"],
                     "evidence": (given or {}).get("evidence"),
                     "issues": list((given or {}).get("issues") or [])
                     or ([] if given else ["the critic did not score this dimension"])})
    total_weight = sum(d["weight"] for d in dims) or 1.0
    raw = round(sum(d["weight"] * d["score"] for d in dims) / total_weight, 1)
    scores = {d["id"]: d["score"] for d in dims}
    failed = [f"{g['dimension']} {scores.get(g['dimension'], 0):g} < {g['min']:g}"
              for g in rubric.get("hard_gates", []) if scores.get(g["dimension"], 0.0) < g["min"]]
    threshold = rubric["threshold"]
    total = min(raw, threshold - 1) if failed else raw
    return {"scorecard_id": new_id("sc"), "total": total, "raw_total": raw, "threshold": threshold,
            "gates_passed": not failed, "failed_gates": failed,
            "passed": not failed and total >= threshold, "dimensions": dims,
            "predicted": critic.get("predicted")}


def choose(cards: list[tuple[int, dict]]) -> int | None:
    """The best cut that passes the hard gates (a tie goes to the later revision), or None."""
    passing = [(card["total"], revision) for revision, card in cards if card and card["gates_passed"]]
    return max(passing)[1] if passing else None


def best_by_total(cards: list[tuple[int, dict]]) -> int | None:
    scored = [(card["total"], revision) for revision, card in cards if card]
    return max(scored)[1] if scored else None
