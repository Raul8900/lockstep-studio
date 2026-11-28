"""Learning (Lifecycle step 9): the playbook's decay, rubric calibration and market re-weighting.

- A learning's weight is confidence × 0.5^(age / half_life_days), its age counted from when it was
  last confirmed; it retires after max_age_days without a confirmation.
- Rubric calibration: once `calibration.min_videos` uploaded cuts (published within `window_days`,
  at least 3 days old) have views, each dimension's weight becomes default × (1 + max_change × ρ),
  ρ being the Spearman correlation between that dimension's score and the video's views. So a
  weight never leaves ±max_change of its default, and the total stays a weighted mean.
- Market re-fit: once `markets_refit.min_videos` videos have by-country data, each market's weight
  moves toward its share of measured revenue (or, without revenue, views × rpm_index), clamped to
  ±max_weight_change of its default and normalised to sum to 1 (then clamped again).
"""

from __future__ import annotations

from datetime import datetime, timedelta

from rapidfuzz import fuzz
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import config
from .config import Files
from .ids import new_id
from .models import Diagnosis, Learning, Production, Revision, Video
from .timeutil import age_days, iso

MIN_CALIBRATION_AGE = timedelta(days=3)


def current_weight(learning: Learning, half_life_days: float, at: datetime) -> float:
    age = max(0.0, age_days(learning.last_confirmed_at, at) or 0.0)
    return learning.confidence * 0.5 ** (age / half_life_days)


def expires_in_days(learning: Learning, max_age_days: float, at: datetime) -> float:
    return round(max_age_days - (age_days(learning.last_confirmed_at, at) or 0.0), 1)


def _ranks(values: list[float]) -> list[float]:
    order = sorted(range(len(values)), key=lambda i: values[i])
    ranks = [0.0] * len(values)
    i = 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and values[order[j + 1]] == values[order[i]]:
            j += 1
        for k in range(i, j + 1):
            ranks[order[k]] = (i + j) / 2
        i = j + 1
    return ranks


def spearman(xs: list[float], ys: list[float]) -> float:
    if len(xs) < 3:
        return 0.0
    a, b = _ranks(xs), _ranks(ys)
    ma, mb = sum(a) / len(a), sum(b) / len(b)
    cov = sum((x - ma) * (y - mb) for x, y in zip(a, b, strict=True))
    va, vb = sum((x - ma) ** 2 for x in a), sum((y - mb) ** 2 for y in b)
    return cov / (va * vb) ** 0.5 if va and vb else 0.0


def calibrated_weights(rows: list[tuple[dict[str, float], float]], defaults: dict[str, float],
                       max_change: float) -> tuple[dict[str, float], dict[str, float]]:
    outcomes = [outcome for _, outcome in rows]
    correlations = {dim: round(spearman([scores.get(dim, 0.0) for scores, _ in rows], outcomes), 3)
                    for dim in defaults}
    weights = {dim: round(w * (1 + max_change * correlations[dim]), 3) for dim, w in defaults.items()}
    return weights, correlations


def refit_weights(values: dict[str, float], defaults: dict[str, float], max_change: float) -> dict[str, float]:
    total = sum(values.get(code, 0.0) for code in defaults)
    if total <= 0:
        return dict(defaults)
    lo = {c: w * (1 - max_change) for c, w in defaults.items()}
    hi = {c: w * (1 + max_change) for c, w in defaults.items()}
    weights = {c: min(hi[c], max(lo[c], values.get(c, 0.0) / total)) for c in defaults}
    norm = sum(weights.values()) or 1.0
    return {c: round(min(hi[c], max(lo[c], w / norm)), 4) for c, w in weights.items()}


# ----------------------------------------------------------------------------- database steps


def decay_and_retire(s: Session, ap: dict, at: datetime) -> list[str]:
    max_age = ap["timing"]["max_age_days"]
    retired = []
    for learning in s.scalars(select(Learning).where(Learning.status == "active")):
        if (age_days(learning.last_confirmed_at, at) or 0) > max_age:
            learning.status, learning.retired_at = "retired", at
            learning.retired_reason = f"not confirmed for {max_age} days"
            retired.append(learning.id)
    return retired


def _uploaded(s: Session, since: datetime) -> list[tuple[Production, Video]]:
    rows = s.execute(select(Production, Video).join(Video, Video.video_id == Production.video_id)
                     .where(Video.published_at >= since)).all()
    return [(p, v) for p, v in rows]


def calibrate(s: Session, files: Files, at: datetime) -> dict:
    cfg = files.rubric["calibration"]
    rows = []
    for prd, video in _uploaded(s, at - timedelta(days=cfg["window_days"])):
        views = (video.latest.get("metrics") or {}).get("views")
        if views is None or prd.chosen_revision is None or at - video.published_at < MIN_CALIBRATION_AGE:
            continue
        card = s.scalar(select(Revision.scorecard).where(Revision.production_id == prd.id,
                                                         Revision.revision == prd.chosen_revision))
        if card:
            rows.append(({d["id"]: d["score"] for d in card["dimensions"]}, float(views)))
    defaults = {d["id"]: d["weight"] for d in files.rubric["dimensions"]}
    active = len(rows) >= cfg["min_videos"]
    weights, correlations = (calibrated_weights(rows, defaults, cfg["max_weight_change"]) if active
                             else (dict(defaults), {d: None for d in defaults}))
    state = {"computed_at": iso(at), "active": active, "n_videos": len(rows), "min_videos": cfg["min_videos"],
             "window_days": cfg["window_days"], "max_weight_change": cfg["max_weight_change"],
             "outcome": "views", "weights": weights, "correlations": correlations}
    config.put_setting(s, "calibration", state)
    return state


def refit_markets(s: Session, files: Files, ap: dict, at: datetime) -> dict:
    cfg = ap["markets_refit"]
    since = at - timedelta(days=cfg["window_days"])
    videos = [v for v in s.scalars(select(Video).where(Video.published_at >= since))
              if v.latest.get("by_country")]
    rpm = {m["code"]: m["rpm_index"] for m in files.markets}
    revenue: dict[str, float] = {}
    weighted_views: dict[str, float] = {}
    for video in videos:
        for row in video.latest["by_country"]:
            code = row.get("country")
            revenue[code] = revenue.get(code, 0.0) + (row.get("estimated_revenue_usd") or 0.0)
            weighted_views[code] = weighted_views.get(code, 0.0) + (row.get("views") or 0.0) * rpm.get(code, 0.0)
    basis, values = ("revenue", revenue) if sum(revenue.values()) > 0 else ("views × rpm_index", weighted_views)
    defaults = {m["code"]: m["weight"] for m in files.markets if m["enabled"]}
    active = len(videos) >= cfg["min_videos"]
    total = sum(values.get(c, 0.0) for c in defaults) or 1.0
    state = {"computed_at": iso(at), "active": active, "n_videos": len(videos), "min_videos": cfg["min_videos"],
             "window_days": cfg["window_days"], "max_weight_change": cfg["max_weight_change"], "basis": basis,
             "shares": {c: round(values.get(c, 0.0) / total, 4) for c in defaults},
             "weights": refit_weights(values, defaults, cfg["max_weight_change"]) if active else defaults}
    config.put_setting(s, "market_refit", state)
    return state


def learner_input(s: Session, ap: dict, at: datetime) -> dict:
    timing = ap["timing"]
    since = at - timedelta(days=timing["max_age_days"])
    active = s.scalars(select(Learning).where(Learning.status == "active")).all()
    diagnoses = s.scalars(select(Diagnosis).where(Diagnosis.created_at >= since)
                          .order_by(Diagnosis.created_at.desc()).limit(30)).all()
    productions = []
    for prd, video in _uploaded(s, since):
        card = s.scalar(select(Revision.scorecard).where(Revision.production_id == prd.id,
                                                         Revision.revision == prd.chosen_revision))
        productions.append({"topic": prd.topic, "angle": prd.angle, "markets": prd.markets,
                            "scorecard_total": (card or {}).get("total"),
                            "metrics": video.latest.get("metrics")})
    return {
        "now": iso(at),
        "learnings": [{"id": x.id, "statement": x.statement, "scope": x.scope, "confidence": x.confidence,
                       "weight": round(current_weight(x, timing["half_life_days"], at), 3),
                       "age_days": round(age_days(x.last_confirmed_at, at) or 0, 1),
                       "last_confirmed_at": iso(x.last_confirmed_at)} for x in active],
        "diagnoses": [{"video_id": d.video_id, "checkpoint_h": d.checkpoint_h, **{
            k: d.data.get(k) for k in ("as_of", "verdict", "primary_cause", "findings", "hypotheses", "actions")}}
            for d in diagnoses],
        "productions": productions,
        "half_life_days": timing["half_life_days"],
        "max_age_days": timing["max_age_days"],
    }


def apply_learner(s: Session, output: dict, at: datetime) -> dict:
    active = {x.id: x for x in s.scalars(select(Learning).where(Learning.status == "active"))}
    added, confirmed, retired = [], [], []

    def confirm(learning: Learning) -> None:
        learning.last_confirmed_at, learning.confirmations = at, learning.confirmations + 1
        confirmed.append(learning.id)

    for lid in output.get("confirm") or []:
        if lid in active:
            confirm(active[lid])
    for item in output.get("retire") or []:
        if (learning := active.get(item.get("id"))) is not None:
            learning.status, learning.retired_at, learning.retired_reason = "retired", at, item.get("why")
            retired.append(learning.id)
    for item in output.get("add") or []:
        statement = str(item.get("statement") or "").strip()
        if not statement:
            continue
        same = next((x for x in active.values() if x.status == "active"
                     and fuzz.token_set_ratio(x.statement.lower(), statement.lower()) >= 90), None)
        if same is not None:  # the learner restated a known learning: that confirms it
            confirm(same)
            continue
        learning = Learning(
            id=new_id("lrn"), status="active", scope=str(item.get("scope") or "general")[:64],
            statement=statement, evidence=list(item.get("evidence") or []), effect=item.get("effect"),
            confidence=min(1.0, max(0.0, float(item.get("confidence") or 0.5))),
            applies_to=list(item.get("applies_to") or []), source="learner",
            created_at=at, last_confirmed_at=at)
        s.add(learning)
        active[learning.id] = learning
        added.append(learning.id)
    return {"added": added, "confirmed": sorted(set(confirmed)), "retired": retired}
