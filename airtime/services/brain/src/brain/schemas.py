"""The output JSON Schema of each role, passed to `claude -p --json-schema`.

These are contract F (airtime/contracts/role-outputs.schema.json) made stricter and
self-contained (no $ref), with descriptions that guide the model. tests/test_schemas.py checks that
every canned output satisfies both these schemas and the contract.
"""

S = {"type": "string"}
N = {"type": "number"}
STRS = {"type": "array", "items": S}
SCORE = {"type": "number", "minimum": 0, "maximum": 100}
MARKET = {"type": "string", "pattern": "^[A-Z]{2}$", "description": "Two-letter market code"}
LANG = {"type": "string", "pattern": "^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$"}


def _obj(required: list[str], props: dict, **extra) -> dict:
    return {"type": "object", "required": required, "properties": props, **extra}


IDEATOR = _obj(["candidates"], {
    "candidates": {
        "type": "array",
        "maxItems": 15,
        "description": "Best first, at most the input's max_candidates",
        "items": _obj(["topic", "angle", "queries", "source_items", "why"], {
            "topic": {"type": "string", "minLength": 3, "description": "The subject in a few words"},
            "angle": {"type": "string", "minLength": 3,
                      "description": "The question or surprising claim the Short opens with"},
            "queries": {
                "type": "array", "minItems": 1, "maxItems": 8,
                "items": _obj(["market", "language", "query"], {
                    "market": MARKET, "language": LANG,
                    "query": {"type": "string", "minLength": 2,
                              "description": "As people type it into YouTube search"},
                }),
            },
            "source_items": {**STRS, "description": "Titles or URLs of the input signals behind it"},
            "why": S,
        }),
    }
})

STRATEGIST = _obj(["opportunities"], {
    "opportunities": {
        "type": "array",
        "maxItems": 5,
        "description": "Ranked by priority, best first; fewer (or none) rather than weak ones",
        "items": _obj(
            ["topic", "angle", "format", "markets", "scores", "priority", "evidence", "why",
             "risks", "expires_in_days"],
            {
                "topic": S,
                "angle": S,
                "format": {"enum": ["short", "long"]},
                "markets": {
                    "type": "array", "minItems": 1, "maxItems": 10,
                    "items": _obj(["code", "weight", "evidence"], {
                        "code": MARKET,
                        "weight": {"type": "number", "minimum": 0, "maximum": 1},
                        "evidence": STRS,
                    }),
                },
                "scores": _obj(
                    ["demand", "timeliness", "competition_gap", "channel_fit",
                     "revenue_potential", "explainability"],
                    {k: SCORE for k in ("demand", "timeliness", "competition_gap", "channel_fit",
                                        "revenue_potential", "explainability")},
                ),
                "priority": SCORE,
                "evidence": {
                    "type": "array",
                    "items": _obj(["source", "title", "metric"], {
                        "source": S, "title": S, "metric": S,
                        "url": {"type": "string", "description": "Only a URL from the input or one you opened"},
                    }),
                },
                "why": S,
                "risks": STRS,
                "expires_in_days": {"type": "number", "minimum": 1},
            },
        ),
    }
})

BRIEF_WRITER = _obj(
    ["format", "duration_s", "topic", "angle", "why_now", "audience", "markets", "language",
     "tone", "hook_options", "title_options", "keywords", "must_include", "avoid",
     "visual_direction", "give_time_to", "music_mood", "competitors", "engine_request_md"],
    {
        "format": {"enum": ["short", "long"]},
        "duration_s": _obj(["target", "max"], {
            "target": {"type": "number", "exclusiveMinimum": 0},
            "max": {"type": "number", "exclusiveMinimum": 0},
        }),
        "topic": {"type": "string", "minLength": 3},
        "angle": {"type": "string", "minLength": 3},
        "why_now": S,
        "audience": S,
        "markets": {
            "type": "array", "minItems": 1,
            "items": _obj(["code", "weight"], {
                "code": MARKET, "weight": {"type": "number", "minimum": 0, "maximum": 1},
            }),
        },
        "language": LANG,
        "tone": STRS,
        "hook_options": {"type": "array", "minItems": 1, "maxItems": 5, "items": S,
                         "description": "Best first: the first line — the opening picture"},
        "title_options": {"type": "array", "minItems": 1, "maxItems": 6,
                          "items": {"type": "string", "maxLength": 100}},
        "keywords": _obj(["primary", "secondary"], {"primary": STRS, "secondary": STRS}),
        "must_include": STRS,
        "avoid": STRS,
        "visual_direction": S,
        "give_time_to": STRS,
        "music_mood": S,
        "competitors": {
            "type": "array",
            "items": _obj(["title", "url", "takeaway"], {
                "title": S,
                "url": {"type": "string", "pattern": "^https?://"},
                "views": {"type": ["integer", "null"]},
                "age_days": {"type": ["number", "null"]},
                "duration_s": {"type": ["number", "null"]},
                "takeaway": S,
            }),
        },
        "engine_request_md": {"type": "string", "minLength": 20,
                              "description": "The brief in the engine's PROMPTING.md template"},
    },
)

CRITIC = _obj(["dimensions", "review_notes", "predicted"], {
    "dimensions": {
        "type": "array",
        "minItems": 1,
        "description": "One entry per rubric dimension except technical: hook, retention, visuals, "
                       "demand, packaging, seo, accuracy, policy",
        "items": _obj(["id", "score", "evidence", "issues"], {
            "id": S, "score": SCORE, "evidence": S, "issues": STRS,
        }),
    },
    "review_notes": _obj(["summary", "notes", "keep", "engine_feedback_md"], {
        "summary": S,
        "notes": {
            "type": "array",
            "maxItems": 8,
            "items": _obj(["priority", "dimension", "at_s", "beat", "issue", "change", "expected_gain"], {
                "priority": {"type": "integer", "minimum": 1, "description": "1 = most important"},
                "dimension": S,
                "at_s": {"type": ["number", "null"], "minimum": 0},
                "beat": {"type": ["string", "null"]},
                "issue": S,
                "change": S,
                "expected_gain": {"type": ["number", "null"],
                                  "description": "Points of weighted total this change should add"},
            }),
        },
        "keep": STRS,
        "engine_feedback_md": {"type": "string", "minLength": 20},
    }),
    "predicted": _obj(["avg_view_pct", "viewed_vs_swiped_pct"], {
        "avg_view_pct": {"type": ["number", "null"], "minimum": 0, "maximum": 300},
        "viewed_vs_swiped_pct": {"type": ["number", "null"], "minimum": 0, "maximum": 100},
    }),
})

SEO = _obj(
    ["title", "title_alternates", "description", "tags", "hashtags", "category",
     "default_language", "localizations", "thumbnail", "pinned_comment", "schedule"],
    {
        "title": {"type": "string", "minLength": 3, "maxLength": 100},
        "title_alternates": {"type": "array", "maxItems": 5, "items": {"type": "string", "maxLength": 100}},
        "description": {"type": "string", "maxLength": 5000},
        "tags": STRS,
        "hashtags": {"type": "array", "maxItems": 8, "items": {"type": "string", "pattern": "^#\\S+$"}},
        "category": S,
        "default_language": LANG,
        "localizations": {
            "type": "array",
            "items": _obj(["language", "title", "description"], {
                "language": LANG,
                "title": {"type": "string", "maxLength": 100},
                "description": {"type": "string", "maxLength": 5000},
            }),
        },
        "thumbnail": {"type": ["object", "null"], "required": ["path", "why"],
                      "properties": {"path": S, "why": S}},
        "pinned_comment": {"type": ["string", "null"]},
        "schedule": {"type": ["object", "null"], "required": ["market", "why"],
                     "properties": {"market": MARKET, "why": S}},
    },
)

TRANSLATOR = _obj(["translations"], {
    "translations": {
        "type": "array",
        "items": _obj(["language", "lines"], {
            "language": LANG,
            "lines": {"type": "array", "items": _obj(["i", "text"], {"i": {"type": "integer"}, "text": S})},
        }),
    }
})

_VALUE = {"type": ["number", "string", "null"]}

ANALYST = _obj(
    ["video_id", "as_of", "verdict", "percentile_vs_channel", "primary_cause", "findings",
     "retention_drops", "actions", "hypotheses"],
    {
        "video_id": S,
        "as_of": S,
        "verdict": {"enum": ["outperforming", "on_track", "underperforming", "too_early"]},
        "percentile_vs_channel": {"type": ["number", "null"], "minimum": 0, "maximum": 100},
        "primary_cause": {"enum": ["hook", "packaging", "topic_demand", "retention_midroll",
                                   "distribution", "timing", "market_mismatch", "unknown"]},
        "findings": {
            "type": "array",
            "items": _obj(["metric", "value", "baseline", "interpretation"], {
                "metric": S, "value": _VALUE, "baseline": _VALUE, "interpretation": S,
            }),
        },
        "retention_drops": {
            "type": "array",
            "maxItems": 6,
            "items": _obj(["t_s", "drop_pct", "line_id", "beat", "on_screen"], {
                "t_s": {"type": "number", "minimum": 0},
                "drop_pct": N,
                "line_id": {"type": ["string", "null"]},
                "beat": {"type": ["string", "null"]},
                "on_screen": {"type": ["string", "null"]},
            }),
        },
        "actions": STRS,
        "hypotheses": {
            "type": "array",
            "items": _obj(["statement", "confidence"], {
                "statement": S, "confidence": {"type": "number", "minimum": 0, "maximum": 1},
            }),
        },
    },
)

LEARNER = _obj(["add", "confirm", "retire"], {
    "add": {
        "type": "array",
        "items": _obj(["scope", "statement", "evidence", "effect", "confidence", "applies_to"], {
            "scope": {"enum": ["ideator", "strategist", "brief_writer", "critic", "seo",
                               "translator", "analyst", "channel"]},
            "statement": {"type": "string", "minLength": 10},
            "evidence": STRS,
            "effect": S,
            "confidence": {"type": "number", "minimum": 0, "maximum": 1},
            "applies_to": STRS,
        }),
    },
    "confirm": {**STRS, "description": "Ids of existing learnings the new results support"},
    "retire": {"type": "array", "items": _obj(["id", "why"], {"id": S, "why": S})},
})

OUTPUT_SCHEMAS = {
    "ideator": IDEATOR,
    "strategist": STRATEGIST,
    "brief_writer": BRIEF_WRITER,
    "critic": CRITIC,
    "seo": SEO,
    "translator": TRANSLATOR,
    "analyst": ANALYST,
    "learner": LEARNER,
}
