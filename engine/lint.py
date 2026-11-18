#!/usr/bin/env python3
"""Check a video's scenes before anything is rendered: `lockstep lint <video>`.

  python3 engine/lint.py <video-dir> [--static] [--json] [--strict] [--step N] [--runtime-json FILE]

Reads scenes/*.js and components.js for mistakes that otherwise show up minutes into a build,
then draws a frame every 0.2 s (`render.js lint`; skipped with --static) and checks where every
piece of scene text lands. Errors stop `lockstep build`. Each warning needs a decision: fix it,
or mark it as intended. --strict counts warnings as errors.

  error  boot, draw        the page does not start, or a frame throws
  error  narration         no narration yet, or script.py says something the recording does not
  error  captions          caption_phrases.json does not match the narration
  error  nondeterministic  Math.random(), Date or performance.now() in scene code
  error  cue               at('beat', 'word', n), or sayText's beat, from or to, that does not resolve
  error  sound             a sound cue type the mixer does not know
  error  icon              an icon name (icon(ctx, 'x', …) or { icon: 'x' }) not in assets/icons/names.txt
  error  media             useImage / useVideo / w.model / w.sky / w.texture naming something not taken into
                           media/ (or its file missing), a cut-out not made yet, or media without a licence
                           a video can use
  error  transition        a shader transition 'gl:Name' that does not exist
  warn   typed-time        a time typed in seconds, which drifts when the narration is re-recorded
  warn   hex-colour        a colour typed as a value instead of a role (COL.subject, ...)
  warn   legacy-colour     COL.cyan, COL.white ...: the role names say what a colour means
  warn   colour-role       { color: 'acent' }: a colour option that is neither a role nor a colour
  warn   top-band, bottom-band, side-margin, right-column
                           scene text under the platform's interface (the safe-zone overlay)
  warn   under-captions    scene text where the captions are drawn
  warn   small-text        text under 20 px on screen
  warn   low-contrast      a label drawn over something in its own colour (an icon, a line, a glow)
  warn   off-frame         text cut off by the edge of the frame
  warn   text-overlap      two different texts drawn over each other

Layout warnings count only when they hold for three samples in a row (0.4 s at the default step)
while the text stays put (text sliding, popping or zooming through a zone is animation), and only
for text with a letter or a digit in it (a dash or a dot drawn as a glyph is decoration).
--runtime-json reads a saved `render.js <video> lint` result instead of drawing the frames again.

To mark a finding as intended, end its line with `// lint-ignore` (or `// lint-ignore rule ...`),
or list it in video.json, optionally narrowed to a text or a file:
  "lint": {"ignore": ["legacy-colour", {"rule": "text-overlap", "text": "LIVER"}, {"rule": "hex-colour", "file": "components.js"}]}
"""
import difflib
import json
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import ENGINE, REPO, load_config, load_script, project_dir  # noqa: E402

ROOT = project_dir()
ARGS = sys.argv[2:]
AS_JSON, STRICT, STATIC_ONLY = "--json" in ARGS, "--strict" in ARGS, "--static" in ARGS
STEP = int(ARGS[ARGS.index("--step") + 1]) if "--step" in ARGS else 6
RT_JSON = ARGS[ARGS.index("--runtime-json") + 1] if "--runtime-json" in ARGS else None

MIN_PX = 20          # on a phone the frame is shown at about a third of its size
LOW_SHARE = 0.05     # share of a label's box where its colour is under 2:1 against what is behind it
MIN_RUN = 3          # samples in a row (0.4 s at the default step) before a layout finding counts
SETTLED_PX = 30      # text that moves further than this between samples is passing through, not placed
LEGACY = {"white": "ink", "cyan": "subject", "amber": "accent", "violet": "data", "coral": "alert", "mint": "good",
          "cyanDeep": "subjectDeep", "violetDeep": "dataDeep", "amberDeep": "accentDeep"}
ROLES = "COL.subject, COL.accent, COL.data, COL.alert, COL.good, COL.ink"
SOUNDS = sorted(set(re.findall(r'typ == "(\w+)"', (ENGINE / "audio/make_audio.py").read_text())))
ICONS = set((REPO / "assets/icons/names.txt").read_text().split())
GL_NAMES = {x["name"].lower(): x["name"] for x in json.load(open(ENGINE / "anim/vendor/gl-transitions/transitions.json"))["transitions"]}
_CORE = (ENGINE / "anim/js/core.js").read_text()
COL_KEYS = (set(re.findall(r"\b(\w+):\s*'#[0-9A-Fa-f]{6}'", _CORE.split("const COL = {")[1].split("};")[0]))
            | set(re.findall(r"\b(\w+):\s*'", _CORE.split("const ROLE_ALIAS = {")[1].split("};")[0])) | {"onAccent"})

findings = []


def add(level, rule, message, where="", text=None, t=None):
    findings.append({"level": level, "rule": rule, "where": where, "message": message, "text": text, "t": t})


def suggest(word, pool, n=3):
    m = difflib.get_close_matches(word, sorted(set(pool)), n=n, cutoff=0.6)
    return f" — did you mean {' or '.join(repr(x) for x in m)}?" if m else ""


def clean(w):
    return re.sub(r"^[^a-z0-9]+|[^a-z0-9]+$", "", w.lower())


def mmss(t):
    t = round(t, 1)
    return f"{int(t // 60)}:{t % 60:04.1f}"


def order(f):
    """errors first; code findings by file and line, then frame findings by time"""
    file, _, line = f["where"].rpartition(":") if f["t"] is None else ("", "", "")
    return (f["level"] != "error", f["t"] is not None, file or f["where"], int(line) if line.isdigit() else 0, f["t"] or 0)


# ------------------------------------------------------------------ reading the scene code
def mask_js(src):
    """Two copies of src, same length, newlines kept: `code` with comments and the insides of
    strings and regular expressions blanked, `txt` with only comments blanked."""
    code, txt, n, i, prev = list(src), list(src), len(src), 0, ""

    def blank(arr, a, b):
        for k in range(a, min(b, n)):
            if arr[k] != "\n":
                arr[k] = " "
    while i < n:
        c = src[i]
        if c == "/" and src.startswith("//", i):
            j = src.find("\n", i)
            j = n if j < 0 else j
            blank(code, i, j), blank(txt, i, j)
            i = j
            continue
        if c == "/" and src.startswith("/*", i):
            j = src.find("*/", i + 2)
            j = n if j < 0 else j + 2
            blank(code, i, j), blank(txt, i, j)
            i = j
            continue
        if c in "'\"`":
            j = i + 1
            while j < n and src[j] != c and not (c != "`" and src[j] == "\n"):
                j += 2 if src[j] == "\\" else 1
            blank(code, i + 1, j)
            i, prev = j + 1, c
            continue
        if c == "/" and (prev == "" or prev in "(,=:[!&|?{};+-*%<>~^"):      # a regular expression
            j, cls = i + 1, False
            while j < n and src[j] != "\n":
                if src[j] == "\\":
                    j += 2
                    continue
                if src[j] == "[":
                    cls = True
                elif src[j] == "]":
                    cls = False
                elif src[j] == "/" and not cls:
                    break
                j += 1
            blank(code, i + 1, j), blank(txt, i + 1, j)
            i, prev = j + 1, "/"
            continue
        if not c.isspace():
            prev = c
        i += 1
    return "".join(code), "".join(txt)


def call_args(code, txt, open_pos):
    """The arguments of the call whose '(' is at open_pos, as source text."""
    depth, start, args = 0, open_pos + 1, []
    for i in range(open_pos, len(code)):
        ch = code[i]
        if ch in "([{":
            depth += 1
        elif ch in ")]}":
            depth -= 1
            if depth == 0:
                last = txt[start:i].strip()
                return args + ([last] if last else [])
        elif ch == "," and depth == 1:
            args.append(txt[start:i].strip())
            start = i + 1
    return args


def lit(arg):
    """The value of a plain string literal, else None."""
    m = re.fullmatch(r"(['\"`])([^'\"`\\$]*)\1", arg or "")
    return m.group(2) if m else None


class Source:
    def __init__(self, path):
        self.rel = str(path.relative_to(ROOT))
        self.src = path.read_text(encoding="utf-8")
        self.code, self.txt = mask_js(self.src)
        self.ignores = {}
        for no, line in enumerate(self.src.split("\n"), 1):
            m = re.search(r"//\s*lint-ignore\b(.*)$", line)
            if m:
                self.ignores[no] = set(re.findall(r"[\w-]+", m.group(1))) or {"*"}

    def line(self, pos):
        return self.src.count("\n", 0, pos) + 1

    def calls(self, name):
        for m in re.finditer(r"(?<![\w.$])" + re.escape(name) + r"\s*\(", self.code):
            yield m.start(), call_args(self.code, self.txt, m.end() - 1)

    def flag(self, level, rule, pos, message):
        no = self.line(pos)
        ig = self.ignores.get(no, set())
        if "*" in ig or rule in ig:
            return
        add(level, rule, message, f"{self.rel}:{no}")


# ------------------------------------------------------------------ static checks
def check_static(sources, words):
    by_beat = {}
    for w in words or []:
        by_beat.setdefault(w["beat"], []).append(clean(w["w"]))
    credits = json.load(open(ROOT / "media/credits.json")) if (ROOT / "media/credits.json").exists() else {}
    grouped = {}       # (rule, file) -> [line numbers]  for the colour rules, reported once per file

    for s in sources:
        for pat, what in ((r"\bMath\.random\s*\(", "Math.random()"), (r"\bDate\.now\s*\(", "Date.now()"),
                          (r"\bnew\s+Date\b", "new Date()"), (r"\bperformance\.now\s*\(", "performance.now()")):
            for m in re.finditer(pat, s.code):
                s.flag("error", "nondeterministic", m.start(), f"{what} makes every render different: use rng(seed) or hash(n) for chance, and t for time")

        if words is not None:
            for pos, a in s.calls("at"):
                beat, word = (lit(a[0]), lit(a[1])) if len(a) >= 2 else (None, None)
                if beat is None or word is None:
                    continue
                nth = int(a[2]) if len(a) > 2 and a[2].isdigit() else 1
                call = f"at('{beat}', '{word}'{', ' + str(nth) if len(a) > 2 and a[2].isdigit() else ''})"
                if beat not in by_beat:
                    s.flag("error", "cue", pos, f"{call}: there is no beat '{beat}'{suggest(beat, by_beat)} (beats: {', '.join(by_beat)})")
                elif word != clean(word):
                    s.flag("error", "cue", pos, f"{call}: cue words are matched in lower case without punctuation — write '{clean(word)}'")
                else:
                    n = by_beat[beat].count(word)
                    if n == 0:
                        other = [b for b, ws in by_beat.items() if word in ws]
                        s.flag("error", "cue", pos, f"{call}: '{word}' is not spoken in '{beat}'{suggest(word, by_beat[beat])}"
                               + (f" It is spoken in {', '.join(other)}." if other else "") + f" (lockstep words {ROOT.name} {beat} lists the beat's words)")
                    elif n < nth:
                        s.flag("error", "cue", pos, f"{call}: '{word}' is spoken only {n} time{'s' if n > 1 else ''} in '{beat}'")

            for pos, a in s.calls("sayText"):                 # sayText(ctx, t, 'beat', x, y, w, { from, to, fromN, toN })
                beat = lit(a[2]) if len(a) >= 3 else None
                if beat is None:
                    continue
                if beat not in by_beat:
                    s.flag("error", "cue", pos, f"sayText(…, '{beat}', …): there is no beat '{beat}'{suggest(beat, by_beat)} (beats: {', '.join(by_beat)})")
                    continue
                opts = a[6] if len(a) >= 7 else ""
                for key in ("from", "to"):
                    m = re.search(r"(?<![\w$])" + key + r"\s*:\s*(['\"])([^'\"]*)\1", opts)
                    if not m:
                        continue
                    word = m.group(2)
                    nm = re.search(r"(?<![\w$])" + key + r"N\s*:\s*(\d+)", opts)
                    nth = int(nm.group(1)) if nm else 1
                    if word != clean(word):
                        s.flag("error", "cue", pos, f"sayText {key}: '{word}': cue words are matched in lower case without punctuation — write '{clean(word)}'")
                    elif by_beat[beat].count(word) < nth:
                        s.flag("error", "cue", pos, f"sayText {key}: '{word}' is not spoken{' ' + str(nth) + ' times' if nth > 1 else ''} in '{beat}'{suggest(word, by_beat[beat])}"
                               f" (lockstep words {ROOT.name} {beat} lists the beat's words)")

        for pos, a in s.calls("sfx"):
            typ = lit(a[1]) if len(a) >= 2 else None
            if typ is not None and typ not in SOUNDS:
                s.flag("error", "sound", pos, f"sound '{typ}' does not exist{suggest(typ, SOUNDS)} (sounds: {', '.join(SOUNDS)})")

        for pos, a in s.calls("icon"):
            name = lit(a[1]) if len(a) >= 2 else None
            if name is not None and name not in ICONS:
                s.flag("error", "icon", pos, f"icon '{name}' is not in the bundled set{suggest(name, ICONS)} (lockstep icons <word> searches it)")

        for m in re.finditer(r"(?<![\w$.])icon\s*:\s*(['\"])([^'\"]+)\1", s.txt):
            if m.group(2) not in ICONS:
                s.flag("error", "icon", m.start(), f"icon '{m.group(2)}' is not in the bundled set{suggest(m.group(2), ICONS)} (lockstep icons <word> searches it)")
        for m in re.finditer(r"(?<![\w$.])colors?\s*:\s*(\[[^\]]*\]|(['\"])[^'\"]*\2)", s.txt):
            for _, v in re.findall(r"(['\"])([^'\"]*)\1", m.group(1)):
                if v not in COL_KEYS and not re.match(r"^(#|rgba?\(|hsla?\()", v):
                    s.flag("warn", "colour-role", m.start(), f"colour '{v}' is neither a role nor a colour{suggest(v, COL_KEYS)} "
                           "(roles: subject, accent, data, good, alert, ink, text, dim, panel …)")

        for m in re.finditer(r"(['\"`])gl:([\w-]+)\1", s.txt):
            if m.group(2).lower() not in GL_NAMES:
                s.flag("error", "transition", m.start(), f"'gl:{m.group(2)}' is not a shader transition"
                       f"{suggest(m.group(2), GL_NAMES.values())} (lockstep transitions --all shows them)")

        for fn, kinds in (("useImage", ("photo",)), ("useVideo", ("video",)), ("w.model", ("model",)), ("w.sky", ("hdri",)), ("w.texture", ("photo", "texture"))):
            for pos, a in s.calls(fn):
                name = lit(a[0]) if a else None
                if name is None:
                    continue
                base = name.split("/")[0]
                e = credits.get(base)
                if not e:
                    s.flag("error", "media", pos, f"{fn}('{name}'): nothing called '{base}' has been taken into media/{suggest(base, credits)}"
                           f" — lockstep find {ROOT.name} {kinds[0]} \"…\", then lockstep take (media/credits.json lists what there is)")
                elif e.get("kind") not in kinds:
                    s.flag("error", "media", pos, f"{fn}('{name}'): '{base}' is a {e.get('kind')}, not a {' or '.join(kinds)}")
                elif fn == "useImage" and len(a) > 1 and re.search(r"\bcutout\s*:\s*true", a[1]) and not e.get("cutout"):
                    s.flag("error", "media", pos, f"useImage('{name}', {{ cutout: true }}): no cut-out made yet — lockstep cutout {ROOT.name} {base}")

        for pos, a in list(s.calls("prog")) + list(s.calls("tw")):
            if len(a) >= 3 and a[0] == "t":
                typed = [x for x in a[1:3] if re.fullmatch(r"\d+(?:\.\d+)?", x) and float(x) >= 2]
                if typed:
                    fn = "tw" if s.code.startswith("tw", pos) else "prog"
                    s.flag("warn", "typed-time", pos, f"{fn}(t, {a[1]}, {a[2]}): {typed[0]} s is typed in, and drifts when the narration is re-recorded — anchor it to a word: at('beat', 'word') ± offset")
        for m in re.finditer(r"(?<![\w.$])t\s*(?:>=|<=|>|<)\s*(\d+(?:\.\d+)?)(?![\w.])|(?<![\w.$])(\d+(?:\.\d+)?)\s*(?:>=|<=|>|<)\s*t(?![\w$])", s.code):
            v = m.group(1) or m.group(2)
            if float(v) >= 2:
                s.flag("warn", "typed-time", m.start(), f"'{m.group(0).strip()}': {v} s is typed in, and drifts when the narration is re-recorded — compare t with a cue from at()")

        for m in re.finditer(r"(['\"`])(#[0-9a-fA-F]{8}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})\1", s.txt):
            h = m.group(2)[1:7] if len(m.group(2)) > 4 else "".join(ch * 2 for ch in m.group(2)[1:4])
            if h[0:2].lower() == h[2:4].lower() == h[4:6].lower():
                continue                          # black, white and greys are style-neutral (a 3D material's white base, a night sky)
            grouped.setdefault(("hex-colour", s), []).append((m.start(), m.group(2)))
        for m in re.finditer(r"(['\"`])rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)", s.txt):
            if not (m.group(2) == m.group(3) == m.group(4)):          # greys (shadows, scrims) are style-neutral
                grouped.setdefault(("hex-colour", s), []).append((m.start(), f"rgb({m.group(2)}, {m.group(3)}, {m.group(4)})"))
        for m in re.finditer(r"\bCOL\.(" + "|".join(LEGACY) + r")\b", s.code):
            grouped.setdefault(("legacy-colour", s), []).append((m.start(), m.group(1)))

    for (rule, s), hits in grouped.items():
        kept = [(s.line(p), v) for p, v in hits if not ({"*", rule} & s.ignores.get(s.line(p), set()))]
        if not kept:
            continue
        lines = sorted({no for no, _ in kept})
        at_lines = ", ".join(map(str, lines[:8])) + (", …" if len(lines) > 8 else "")
        if rule == "hex-colour":
            vals = sorted({v for _, v in kept})
            msg = (f"{len(kept)} colour{'s' if len(kept) > 1 else ''} typed as values ({', '.join(vals[:4])}{', …' if len(vals) > 4 else ''}) "
                   f"on line{'s' if len(lines) > 1 else ''} {at_lines}: use roles ({ROLES}) so the style decides")
        else:
            names = sorted({v for _, v in kept})
            msg = (f"{len(kept)} legacy colour name{'s' if len(kept) > 1 else ''} on line{'s' if len(lines) > 1 else ''} {at_lines}: "
                   + ", ".join(f"COL.{n} → COL.{LEGACY[n]}" for n in names))
        add("warn", rule, msg, f"{s.rel}:{lines[0]}")


# ------------------------------------------------------------------ the project around the scenes
def narration_differs():
    """Why the recorded narration (data/takes.json) no longer matches script.py, or None.
    Compares what is spoken, in which beat, and the pauses — not file dates, which a git checkout resets."""
    try:
        script = load_script(ROOT)
        rec = json.load(open(ROOT / "data/takes.json"))
    except Exception as e:      # noqa: BLE001 — any failure here is the message
        return f"script.py or data/takes.json cannot be read ({type(e).__name__}: {e})"
    want = []
    for beat in script.BEATS:
        for text, pause in beat["takes"]:
            plain = re.sub(r"\[([^\]]+)\]\(/[^)]*/\)", r"\1", re.sub(r"\{p:([0-9.]+)\}", "", text.replace("*", "")))
            want.append((beat["id"], re.sub(r"\s+", " ", plain).strip(), round(float(pause), 3)))
    have = [(t["beat"], t["text"], round(float(t["pause_after"]), 3)) for t in rec["takes"]]
    for i, (w, h) in enumerate(zip(want, have)):
        if w != h:
            what = "says" if w[1] != h[1] else "is in beat" if w[0] != h[0] else "pauses"
            return (f"script.py has changed since the narration was recorded: take {i + 1} {what} "
                    f"{(w[1] if what == 'says' else w[0] if what == 'is in beat' else str(w[2]) + ' s')!r}, the recording "
                    f"{(h[1] if what == 'says' else h[0] if what == 'is in beat' else str(h[2]) + ' s')!r}")
    if len(want) != len(have):
        return f"script.py has {len(want)} takes, the recording {len(have)}"
    titles = [(b["id"], b["title"]) for b in script.BEATS]
    if titles != [(b["id"], b["title"]) for b in rec["beats"]]:
        return "a beat id or title in script.py differs from the recording"
    return None


def check_project():
    words_path = ROOT / "data/words.json"
    if not words_path.exists():
        add("error", "narration", f"no narration recorded yet: lockstep voice {ROOT.name}", "data/words.json")
        return None
    stale = narration_differs()
    if stale:
        add("error", "narration", stale + f": lockstep voice {ROOT.name} records it again", "script.py")
    words = json.load(open(words_path))
    if not (ROOT / "caption_phrases.json").exists():
        add("error", "captions", f"no caption_phrases.json: lockstep captions {ROOT.name} --draft, then edit it", "caption_phrases.json")
    else:
        r = subprocess.run([sys.executable, str(ENGINE / "make_captions.py"), str(ROOT)], capture_output=True, text=True)
        if r.returncode != 0:
            add("error", "captions", " ".join((r.stderr or r.stdout).strip().splitlines()[-2:]) or "caption_phrases.json does not match the narration", "caption_phrases.json")
    cp = ROOT / "media/credits.json"
    credits = json.load(open(cp)) if cp.exists() else {}
    missing = []
    for name, e in credits.items():
        lic = (e.get("licence") or "").lower()
        if not lic or not (e.get("page") or e.get("source") == "added"):
            add("error", "media", f"{name}: no licence or source page recorded — every picture, clip and model needs both", "media/credits.json")
        elif re.search(r"\bnc\b|non-?commercial|\bnd\b|no-?deriv", lic):
            add("error", "media", f"{name}: licence '{e['licence']}' does not allow this use (non-commercial or no-derivatives) — choose another", "media/credits.json")
        elif "sa" in re.findall(r"[a-z]+", lic):
            add("warn", "media", f"{name}: '{e['licence']}' is share-alike — the whole video then falls under it; prefer CC0, public domain or CC BY", "media/credits.json")
        if not (ROOT / "media" / e.get("file", "")).exists():
            missing.append(name)
    if missing:
        add("error", "media", f"{len(missing)} file(s) in media/credits.json are not on disk ({', '.join(missing[:5])}{', …' if len(missing) > 5 else ''})"
            f" — lockstep media {ROOT.name} restore downloads them again", "media/")
    for f in sorted((ROOT / "media").glob("*")) if (ROOT / "media").exists() else []:
        if f.name == "credits.json" or f.name.endswith(".cut.png"):
            continue
        if not any(f.name == e.get("file") or f.name == Path(e.get("file", "")).parts[0] for e in credits.values()):
            add("error", "media", f"media/{f.name} has no entry in media/credits.json: where it came from and its licence must be known"
                f" (lockstep media {ROOT.name} add <file> --as <name> --licence …)", f"media/{f.name}")
    return words


# ------------------------------------------------------------------ what the frames show
def check_runtime(static_cue_errors):
    if RT_JSON:
        r = subprocess.CompletedProcess([], 0, Path(RT_JSON).read_text(), "")
    else:
        r = subprocess.run(["node", str(ENGINE / "render.js"), str(ROOT), "lint", "--step", str(STEP)], capture_output=True, text=True)
    lines = r.stdout.strip().splitlines()
    try:
        rt = json.loads(lines[-1])
    except (IndexError, json.JSONDecodeError):
        add("error", "boot", (r.stderr.strip().splitlines() or ["render.js lint failed"])[-1])
        return
    if rt.get("boot_error"):
        msg = rt["boot_error"]
        if not (static_cue_errors and "cue not found" in msg):      # already reported with its file and line
            add("error", "boot", msg.split("\n")[0][:400])
        return

    scenes, step_t = rt["scenes"], rt["step"] / rt["fps"]
    scene_at = lambda t: next((s["id"] for s in reversed(scenes) if t >= s["t0"]), scenes[0]["id"])  # noqa: E731

    errs = {}
    for e in rt["errors"]:
        errs.setdefault(e["error"], []).append(e["t"])
    for msg, ts in errs.items():
        span = mmss(ts[0]) + (f"–{mmss(ts[-1])}" if len(ts) > 1 else "")
        add("error", "draw", f"a frame throws: {msg}", f"{span} ({scene_at(ts[0])})", t=ts[0])

    reported = {f["message"].split("'")[1] for f in findings if f["rule"] == "sound" and "'" in f["message"]}
    for typ in sorted({c["type"] for c in rt["sfx"]} - set(SOUNDS) - reported):
        t = next(c["t"] for c in rt["sfx"] if c["type"] == typ)
        add("error", "sound", f"sound '{typ}' does not exist{suggest(typ, SOUNDS)} (sounds: {', '.join(SOUNDS)})", f"{mmss(t)} ({scene_at(t)})", t=t)

    S, R, W, H, cz = rt["safe"], rt["right"], rt["W"], rt["H"], rt["cap_zone"]
    runs = {}                                    # (rule, text) -> [(t, detail)]

    def hit(rule, text, t, detail, box):
        runs.setdefault((rule, text), []).append((t, detail, box))
    for t, items, *rest in rt["samples"]:
        caps_hidden = bool(rest and rest[0])
        vis = [it for it in items if it[6] >= 0.5 and it[5] >= 4 and it[3] - it[1] >= 1 and it[4] - it[2] >= 1 and re.search(r"\w", it[0])]
        for s, x0, y0, x1, y1, px, a, colour, outlined, low in vis:
            if px < MIN_PX:
                hit("small-text", s, t, f"{px:.0f} px", ((x0 + x1) / 2, (y0 + y1) / 2, px))
            if low is not None and low >= LOW_SHARE:
                hit("low-contrast", s, t, f"{low:.0%} of its box", ((x0 + x1) / 2, (y0 + y1) / 2, px))
            if x0 < -4 or y0 < -4 or x1 > W + 4 or y1 > H + 4:
                hit("off-frame", s, t, f"box x {x0:.0f}–{x1:.0f}, y {y0:.0f}–{y1:.0f}", ((x0 + x1) / 2, (y0 + y1) / 2, px))
            elif y0 < S["t"]:
                hit("top-band", s, t, f"top at y {y0:.0f}", ((x0 + x1) / 2, (y0 + y1) / 2, px))
            elif y1 > S["b"]:
                hit("bottom-band", s, t, f"bottom at y {y1:.0f}", ((x0 + x1) / 2, (y0 + y1) / 2, px))
            elif x0 < S["l"] - 2 or x1 > S["r"] + 2:
                hit("side-margin", s, t, f"x {x0:.0f}–{x1:.0f}", ((x0 + x1) / 2, (y0 + y1) / 2, px))
            elif x1 > R["x"] and y1 > R["y"]:
                hit("right-column", s, t, f"right edge x {x1:.0f}, bottom y {y1:.0f}", ((x0 + x1) / 2, (y0 + y1) / 2, px))
            if cz and not caps_hidden and x0 < cz["x1"] and x1 > cz["x0"] and y0 < cz["y1"] and y1 > cz["y0"]:
                hit("under-captions", s, t, f"y {y0:.0f}–{y1:.0f}", ((x0 + x1) / 2, (y0 + y1) / 2, px))
        for i in range(len(vis)):
            for j in range(i + 1, len(vis)):
                A, B = vis[i], vis[j]
                if A[0] == B[0]:
                    continue                     # the same words twice: a shadow, an echo, a counter
                iw, ih = min(A[3], B[3]) - max(A[1], B[1]), min(A[4], B[4]) - max(A[2], B[2])
                if iw < 4 or ih < 4:
                    continue
                small = min((A[3] - A[1]) * (A[4] - A[2]), (B[3] - B[1]) * (B[4] - B[2]))
                if iw * ih > 0.15 * small:
                    pair = tuple(sorted((A[0], B[0])))
                    hit("text-overlap", pair, t, f"near ({(max(A[1], B[1]) + iw / 2):.0f}, {(max(A[2], B[2]) + ih / 2):.0f})",
                        ((A[1] + A[3] + B[1] + B[3]) / 4, (A[2] + A[4] + B[2] + B[4]) / 4, min(A[5], B[5])))

    what = {
        "small-text": lambda s, d: f'"{s}" is {d} high on screen: 24 px or more reads on a phone',
        "low-contrast": lambda s, d: f'"{s}" sits on something drawn in nearly its own colour ({d}): move it clear, or give it a plate or an outline',
        "off-frame": lambda s, d: f'"{s}" is cut off by the edge of the frame ({d})',
        "top-band": lambda s, d: f'"{s}" is under the top of the app (keep it below y {S["t"]}; {d})',
        "bottom-band": lambda s, d: f'"{s}" is under the description and buttons (keep it above y {S["b"]}; {d})',
        "side-margin": lambda s, d: f'"{s}" is outside the side margins (keep it within x {S["l"]}–{S["r"]}; {d})',
        "right-column": lambda s, d: f'"{s}" is under the like and share buttons (right of x {R["x"]} below y {R["y"]}; {d})',
        "under-captions": lambda s, d: f'"{s}" is where the captions are drawn (y {cz["y0"]:.0f}–{cz["y1"]:.0f}; {d})',
        "text-overlap": lambda s, d: f'"{s[0]}" and "{s[1]}" overlap {d}',
    }
    def settled(run):
        """the longest chain of samples in which some instance of the text stays put"""
        times = sorted({h[0] for h in run})
        best = chain = 1
        for a, b in zip(times, times[1:]):
            A, B = [h[2] for h in run if h[0] == a], [h[2] for h in run if h[0] == b]
            still = any(abs(p[0] - q[0]) + abs(p[1] - q[1]) < SETTLED_PX and abs(p[2] - q[2]) < 3 for p in A for q in B)
            chain = chain + 1 if still else 1
            best = max(best, chain)
        return best

    for (rule, text), hs in runs.items():
        hs.sort(key=lambda h: h[0])
        run = [hs[0]]
        for h in hs[1:] + [None]:
            if h is not None and h[0] - run[-1][0] <= step_t * 1.5:
                run.append(h)
                continue
            if settled(run) >= MIN_RUN:
                t0, t1 = run[0][0], run[-1][0]
                short = (lambda x: x if len(x) <= 40 else x[:37] + "…")
                label = tuple(short(x) for x in text) if isinstance(text, tuple) else short(text)
                add("warn", rule, what[rule](label, run[0][1]), f"{mmss(t0)}–{mmss(t1)} ({scene_at(t0)})",
                    text=list(text) if isinstance(text, tuple) else text, t=t0)
            if h is not None:
                run = [h]


# ------------------------------------------------------------------ ignoring, reporting
def ignored(f, rules):
    for r in rules:
        if isinstance(r, str):
            if r == f["rule"]:
                return True
            continue
        if r.get("rule") not in (None, f["rule"]):
            continue
        if r.get("file") and r["file"] not in f["where"]:
            continue
        if r.get("text"):
            texts = f["text"] if isinstance(f["text"], list) else [f["text"] or f["message"]]
            if not any(r["text"] in x for x in texts):
                continue
        return True
    return False


def main():
    words = check_project()
    files = ([ROOT / "components.js"] if (ROOT / "components.js").exists() else []) + sorted((ROOT / "scenes").glob("*.js"))
    check_static([Source(p) for p in files], words)
    cue_errors = any(f["rule"] == "cue" for f in findings)
    if not STATIC_ONLY and words is not None and not any(f["rule"] == "captions" for f in findings):
        check_runtime(cue_errors)

    rules = (load_config(ROOT).get("lint") or {}).get("ignore") or []
    kept = [f for f in findings if not ignored(f, rules)]
    n_ign = len(findings) - len(kept)
    kept.sort(key=order)
    n_err = sum(f["level"] == "error" for f in kept)
    n_warn = len(kept) - n_err
    if AS_JSON:
        print(json.dumps({"errors": n_err, "warnings": n_warn, "ignored": n_ign, "findings": kept}, indent=1, ensure_ascii=False))
    else:
        print(f"lint {ROOT.name}: {n_err} error{'s' if n_err != 1 else ''}, {n_warn} warning{'s' if n_warn != 1 else ''}"
              + (f"  ({n_ign} ignored by video.json)" if n_ign else "") + ("" if not STATIC_ONLY else "  (code only: no frames drawn)"))
        for f in kept:
            print(f"  {f['level']:<5}  {f['rule']:<16} {f['where']}")
            print(f"         {f['message']}")
    sys.exit(1 if n_err or (STRICT and n_warn) else 0)


main()
