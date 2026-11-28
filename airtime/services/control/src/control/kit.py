"""The final publish kit (Lifecycle step 6): YouTube's limits, the CC BY credits, caption files.

Everything the upload needs is placed under $AIRTIME_DATA_DIR/publish/<production_id>/ so youtube
(and the owner, for a manual upload) finds it at one absolute path.
"""

from __future__ import annotations

import os
import re
import shutil
from dataclasses import dataclass
from pathlib import Path

TITLE_MAX, DESCRIPTION_MAX, TAGS_MAX, HASHTAGS_MAX = 100, 5000, 500, 15


def clean(text: object) -> str:
    """YouTube rejects < and > in titles, descriptions and tags."""
    return str(text or "").replace("<", "").replace(">", "").strip()


def title(text: object) -> str:
    text = " ".join(clean(text).split())
    return text if len(text) <= TITLE_MAX else text[: TITLE_MAX - 1].rstrip() + "…"


def tags(values: list) -> list[str]:
    """Unique tags within YouTube's 500 characters (a tag with spaces counts its quotes, plus commas)."""
    out: list[str] = []
    seen: set[str] = set()
    used = 0
    for value in values or []:
        tag = " ".join(clean(value).replace(",", " ").lstrip("#").split())
        if not tag or tag.lower() in seen:
            continue
        cost = len(tag) + (2 if " " in tag else 0) + (1 if out else 0)
        if used + cost > TAGS_MAX:
            continue
        out.append(tag)
        seen.add(tag.lower())
        used += cost
    return out


def hashtags(values: list) -> list[str]:
    out: list[str] = []
    for value in values or []:
        tag = "#" + re.sub(r"[\s#<>]+", "", str(value))
        if len(tag) > 1 and tag.lower() not in {t.lower() for t in out}:
            out.append(tag)
    return out[:HASHTAGS_MAX]  # YouTube ignores every hashtag on a video with more than 15


def description(body: object, tags_line: list[str], credits: str) -> str:
    """The body, then the hashtags, then the credits; the body is shortened, never the credits."""
    body = clean(body)
    tail = []
    if tags_line and not all(t.lower() in body.lower() for t in tags_line):
        tail.append(" ".join(tags_line))
    if credits and credits not in body:
        tail.append(credits)
    tail_text = "\n\n".join(tail)
    room = DESCRIPTION_MAX - (len(tail_text) + 2 if tail_text else 0)
    if len(body) > room:
        body = body[: max(room - 1, 0)].rstrip() + "…"
    text = f"{body}\n\n{tail_text}".strip() if tail_text else body
    return text[:DESCRIPTION_MAX]


def credits_text(handoff: dict) -> str:
    """The attribution every CC BY licence asks for (music and media), from the handoff."""
    given = clean((handoff.get("publish_kit") or {}).get("credits_text"))
    if given:
        return given
    parts = []
    if music := clean((handoff.get("music") or {}).get("credit")):
        parts.append(f"Music: {music}")
    media = ["; ".join(x for x in (m.get("title"), m.get("author"), m.get("licence"), m.get("source_url")) if x)
             for m in handoff.get("media") or []]
    if media := [clean(m) for m in media if m]:
        parts.append("Media: " + " | ".join(media))
    return "\n".join(parts)


@dataclass
class Cue:
    timing: str
    text: str


def read_srt(path: str | os.PathLike) -> list[Cue]:
    cues = []
    for block in re.split(r"\r?\n\s*\r?\n", Path(path).read_text(encoding="utf-8-sig").strip()):
        lines = block.splitlines()
        at = next((i for i, line in enumerate(lines) if "-->" in line), None)
        if at is not None:
            cues.append(Cue(lines[at].strip(), "\n".join(lines[at + 1:]).strip()))
    return cues


def write_srt(path: Path, cues: list[Cue], texts: list[str]) -> None:
    blocks = [f"{n}\n{cue.timing}\n{text}\n" for n, (cue, text) in enumerate(zip(cues, texts, strict=True), 1)]
    path.write_text("\n".join(blocks), encoding="utf-8")


def complete_translations(output: dict, count: int) -> dict[str, list[str]]:
    """{language: texts} for every language the translator returned in full (others are dropped)."""
    out = {}
    for item in output.get("translations") or []:
        lines = {line.get("i"): line.get("text") for line in item.get("lines") or [] if isinstance(line, dict)}
        texts = [lines.get(i) for i in range(count)]
        if item.get("language") and all(isinstance(t, str) and t.strip() for t in texts):
            out[item["language"]] = [t.strip() for t in texts]
    return out


def place(src: str, dst: Path) -> Path:
    """Hard-link (or copy) a file into the publish folder."""
    if dst.exists():
        dst.unlink()
    try:
        os.link(src, dst)
    except OSError:
        shutil.copy2(src, dst)
    return dst


def build(publish_dir: Path, handoff: dict, seo: dict, cues: list[Cue],
          translations: dict[str, list[str]], thumbs: list[str]) -> dict:
    """Write the publish folder and return the final kit (before scheduling)."""
    (publish_dir / "captions").mkdir(parents=True, exist_ok=True)
    hk = handoff.get("publish_kit") or {}
    video = place(handoff["video"]["path"], publish_dir / ("video" + Path(handoff["video"]["path"]).suffix))
    source_language = (handoff.get("captions") or {}).get("language") or hk.get("language") or "en"
    captions = []
    for language, texts in [(source_language, [c.text for c in cues]), *translations.items()] if cues else []:
        path = publish_dir / "captions" / f"{language}.srt"
        write_srt(path, cues, texts)
        captions.append({"language": language, "path": str(path)})
    wanted = Path(str((seo.get("thumbnail") or {}).get("path") or "")).name
    thumb = next((t for t in thumbs if Path(t).name == wanted), thumbs[0] if thumbs else None)
    thumbnail = str(place(thumb, publish_dir / ("thumbnail" + Path(thumb).suffix))) if thumb else None
    credits = credits_text(handoff)
    tags_line = hashtags(seo.get("hashtags") or hk.get("hashtags") or [])
    localizations = [
        {"language": loc["language"], "title": title(loc.get("title")),
         "description": description(loc.get("description"), [], credits)}
        for loc in seo.get("localizations") or []
        if isinstance(loc, dict) and loc.get("language") and clean(loc.get("title"))]
    return {
        "title": title(seo.get("title") or (hk.get("title_options") or [handoff["script"]["title"]])[0]),
        "title_alternates": [title(t) for t in seo.get("title_alternates") or []],
        "description": description(seo.get("description") or hk.get("description"), tags_line, credits),
        "tags": tags(seo.get("tags") or hk.get("tags") or []),
        "hashtags": tags_line,
        "category": seo.get("category") or hk.get("category"),
        "default_language": seo.get("default_language") or hk.get("language") or source_language,
        "localizations": localizations,
        "thumbnail_path": thumbnail,
        "pinned_comment": seo.get("pinned_comment") or hk.get("pinned_comment"),
        "made_for_kids": False,
        "altered_content": bool(hk.get("altered_content")),
        "credits_text": credits,
        "video_path": str(video),
        "captions": captions,
        "schedule_market": (seo.get("schedule") or {}).get("market"),
        "schedule_why": (seo.get("schedule") or {}).get("why"),
    }


def apply_edit(kit: dict, edit: dict) -> dict:
    """The owner's edit of the kit, held to the same limits."""
    kit = {**kit, **{k: v for k, v in edit.items() if v is not None}}
    credits = kit.get("credits_text") or ""
    kit["title"] = title(kit["title"])
    kit["hashtags"] = hashtags(kit.get("hashtags") or [])
    kit["description"] = description(kit.get("description"), kit["hashtags"], credits)
    kit["tags"] = tags(kit.get("tags") or [])
    kit["localizations"] = [
        {"language": loc["language"], "title": title(loc.get("title")),
         "description": description(loc.get("description"), [], credits)}
        for loc in kit.get("localizations") or [] if loc.get("language") and clean(loc.get("title"))]
    return kit


def upload_request(kit: dict, *, upload_id: str, resume_video_id: str | None, visibility: str,
                   schedule_at: str | None) -> dict:
    """POST /v1/uploads (contract H)."""
    return {
        "upload_id": upload_id, "video_path": kit["video_path"], "resume_video_id": resume_video_id,
        "title": kit["title"], "description": kit["description"], "tags": kit["tags"],
        "thumbnail_path": kit.get("thumbnail_path"), "category": kit.get("category"),
        "language": kit.get("default_language"), "made_for_kids": False,
        "altered_content": bool(kit.get("altered_content")), "playlist": None,
        "visibility": visibility, "schedule_at": schedule_at, "captions": kit.get("captions") or [],
        "localizations": kit.get("localizations") or [], "dry_run": False,
    }
