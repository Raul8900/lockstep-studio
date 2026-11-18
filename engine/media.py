"""Find, take and credit real media from free, licensed sources.

  python3 engine/media.py find    <video> <kind> "<query>" [--sources a,b] [--n 24] [--allow-sa]
  python3 engine/media.py take    <video> <search|last> <number> [--as name]
  python3 engine/media.py add     <video> <file|url> --as name --licence "CC0" [--author ..] [--page url] [--title ..]
  python3 engine/media.py cutout  <video> <name>           the subject of a photo without its background -> media/<name>.cut.png
  python3 engine/media.py list    <video>
  python3 engine/media.py restore <video>          download every credited file that is missing
  python3 engine/media.py credits <video>          write docs/credits.md (paste it into the description)
  python3 engine/media.py sources                  which sources exist, which need a key, what they hold

kind: photo (photographs, paintings, prints, maps, illustrations), video, model (3D), hdri, texture.

`find` searches every source that holds that kind at once and tiles the candidates into one numbered
sheet, out/find/<search>.jpg, with each one's source, licence and size; out/find/<search>.json keeps
the details. Look at the sheet. `take` downloads the chosen number into media/<name> (photos scaled
to at most 2,600 px), and records where it came from, who made it and its licence in
media/credits.json — the file that lets anyone re-download everything (`restore`) and that writes the
credits for the video's description (`credits`). Media files themselves are not committed.

Licences: CC0, public domain, NASA, CC BY (credit required), the Pexels and Pixabay licences. Never
NC (non-commercial) or ND (no derivatives). Share-alike (BY-SA) would put the whole video under
BY-SA, so it is left out unless --allow-sa.

`add` brings in a file you downloaded yourself (a Kenney or Quaternius pack, your own photo) with
its licence, so it is credited like the rest. `cutout` cuts a person or object out of its photo
(IS-Net, an open background-removal model, run locally) for a scene to stand in front of another
picture with parallax.

Keys: Pexels and Pixabay are free but need a key — PEXELS_API_KEY, PIXABAY_API_KEY in the environment
(or in ~/.config/lockstep/keys.json). Without one those sources are skipped, and the others still answer.
"""
import concurrent.futures as cf
import datetime
import html
import io
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import MODELS, project_dir  # noqa: E402

UA = "lockstep-studio/0.2 (open-source explainer video tool)"
KINDS = ("photo", "video", "model", "hdri", "texture")
MAX_PX = 2600


# --------------------------------------------------------------------------- http
def get(url, headers=None, timeout=30, binary=False, tries=4):
    """GET with a polite retry: rate limits (429) and server errors wait and try again."""
    import time
    for attempt in range(tries):
        req = urllib.request.Request(url, headers=dict({"User-Agent": UA}, **(headers or {})))
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                data = r.read()
            return data if binary else json.loads(data.decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code not in (429, 500, 502, 503, 504) or attempt == tries - 1:
                raise
            wait = e.headers.get("Retry-After")
            time.sleep(min(20, float(wait)) if wait and wait.isdigit() else 2 * (attempt + 1))


def key(name):
    v = os.environ.get(name)
    if v:
        return v
    f = Path.home() / ".config/lockstep/keys.json"
    if f.exists():
        try:
            return json.load(open(f)).get(name)
        except (OSError, ValueError):
            return None
    return None


def strip_html(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", s or ""))).strip()


# --------------------------------------------------------------------------- licences
def licence_info(name, url=""):
    """Normalise a licence: (short name, allowed, needs credit, share-alike)."""
    n = (name or "").strip()
    low = n.lower().replace("_", "-")
    u = (url or "").lower()
    if any(k in low for k in ("-nc", " nc", "noncommercial", "non-commercial")) or "/by-nc" in u:
        return n or "CC BY-NC", False, True, False
    if any(k in low for k in ("-nd", " nd", "noderiv")) or "/by-nd" in u:
        return n or "CC BY-ND", False, True, False
    if low in ("cc0", "cc0 1.0", "cc-zero", "cc-0") or "publicdomain/zero" in u:
        return "CC0", True, False, False
    if "public domain" in low or low in ("pdm", "pd", "pd-old", "pd-us", "pd-usgov", "pd-usgov-nasa", "publicdomain") or "publicdomain/mark" in u:
        return "Public domain", True, False, False
    if "by-sa" in low or "by sa" in low or "/by-sa" in u:
        return n or "CC BY-SA", True, True, True
    if low.startswith("cc by") or low.startswith("cc-by") or low == "by" or "/licenses/by/" in u:
        return n or "CC BY", True, True, False
    if low in ("pexels", "pexels license"):
        return "Pexels License", True, False, False
    if low in ("pixabay", "pixabay content license"):
        return "Pixabay Content License", True, False, False
    if low.startswith("nasa"):
        return "NASA (public domain)", True, True, False
    return n or "unknown", False, True, False


def allowed(c, allow_sa):
    name, ok, _, sa = licence_info(c["licence"], c.get("licence_url", ""))
    return ok and (allow_sa or not sa)


# --------------------------------------------------------------------------- sources
class Source:
    name = ""
    kinds = ()
    needs = None          # an API key variable, or None
    about = ""

    def available(self):
        return self.needs is None or bool(key(self.needs))

    def search(self, kind, q, n):
        raise NotImplementedError

    def fetch(self, c, dest):
        """Download candidate c to dest (a path without extension); return the file written."""
        url = c["download"]
        ext = c.get("ext") or Path(urllib.parse.urlparse(url).path).suffix or ".jpg"
        data = get(url, headers=c.get("headers"), binary=True, timeout=180)
        out = dest.with_suffix(ext.lower())
        out.write_bytes(data)
        return out


class Wikimedia(Source):
    name, kinds = "wikimedia", ("photo", "video")
    about = "Wikimedia Commons: photographs, paintings, maps, diagrams, archive film; per-file licences"

    def search(self, kind, q, n):
        ft = "filetype:video" if kind == "video" else "filetype:bitmap|drawing"
        u = ("https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6"
             f"&gsrsearch={urllib.parse.quote(q + ' ' + ft)}&gsrlimit={min(n, 40)}&prop=imageinfo"
             "&iiprop=url|size|mime|extmetadata&iiurlwidth=480")
        pages = (get(u).get("query") or {}).get("pages", {})
        out = []
        for p in sorted(pages.values(), key=lambda p: p.get("index", 0)):
            ii = (p.get("imageinfo") or [{}])[0]
            em = ii.get("extmetadata", {})
            v = lambda k: strip_html((em.get(k) or {}).get("value", ""))  # noqa: E731
            mime = ii.get("mime", "")
            if kind == "video" and not mime.startswith("video"):
                continue
            if kind == "photo" and not mime.startswith("image"):
                continue
            big, fallback = ii.get("url"), None
            if kind == "photo" and ii.get("thumburl"):
                # Wikimedia serves thumbnails only at its standard widths (mediawiki.org/wiki/Common_thumbnail_sizes)
                w0 = ii.get("width", 0) or 0
                step = next((x for x in (960, 1280, 1920, 3840) if x >= min(max(w0, 1), MAX_PX)), 3840)
                if mime == "image/svg+xml" or step < w0:
                    big = re.sub(r"/\d+px-", f"/{1920 if mime == 'image/svg+xml' else step}px-", ii["thumburl"])
                elif w0 > 960:           # originals are rate-limited more often: the largest standard copy to fall back on
                    fallback = re.sub(r"/\d+px-", f"/{next(x for x in (1920, 1280, 960) if x < w0)}px-", ii["thumburl"])
            out.append(dict(source=self.name, id=str(p.get("pageid")), kind=kind, title=p["title"].replace("File:", ""),
                            author=v("Artist") or v("Credit"), licence=v("LicenseShortName") or v("License"),
                            licence_url=v("LicenseUrl"), page=ii.get("descriptionurl", ""), thumb=ii.get("thumburl") or ii.get("url"),
                            download=big, width=ii.get("width"), height=ii.get("height"),
                            duration=ii.get("duration"), ext=(".png" if mime == "image/svg+xml" else None), fallback=fallback))
        return out

    def fetch(self, c, dest):
        try:
            return super().fetch(c, dest)
        except urllib.error.HTTPError as e:
            if not c.get("fallback") or e.code not in (400, 403, 429):
                raise
            px = re.search(r"/(\d+)px-", c["fallback"])
            print(f"  (the original file was refused with {e.code}; taking Wikimedia's {px.group(1) if px else 'smaller'} px copy instead)")
            return super().fetch(dict(c, download=c["fallback"]), dest)


class NASA(Source):
    name, kinds = "nasa", ("photo", "video")
    about = "NASA Image and Video Library: spaceflight, Earth, planets, missions; generally public domain"

    def search(self, kind, q, n):
        mt = "video" if kind == "video" else "image"
        d = get(f"https://images-api.nasa.gov/search?q={urllib.parse.quote(q)}&media_type={mt}&page_size={min(n, 50)}")
        out = []
        for it in d.get("collection", {}).get("items", [])[:n]:
            data = it["data"][0]
            thumb = next((l["href"] for l in it.get("links", []) if l.get("rel") == "preview"), None)
            credit = ", ".join(x for x in (data.get("photographer"), data.get("secondary_creator"), data.get("center")) if x)
            out.append(dict(source=self.name, id=data["nasa_id"], kind=kind, title=data.get("title", ""), author=credit or "NASA",
                            licence="NASA", licence_url="https://www.nasa.gov/nasa-brand-center/images-and-media/",
                            page=f"https://images.nasa.gov/details/{urllib.parse.quote(data['nasa_id'])}", thumb=thumb,
                            download=None, note=strip_html(data.get("description", ""))[:240]))
        return out

    def fetch(self, c, dest):
        files = [i["href"] for i in get(f"https://images-api.nasa.gov/asset/{urllib.parse.quote(c['id'])}")["collection"]["items"]]
        pref = ("~orig.mp4", "~large.mp4", "~medium.mp4") if c["kind"] == "video" else ("~orig.jpg", "~large.jpg", "~orig.png", "~medium.jpg")
        url = next((f for p in pref for f in files if f.endswith(p)), files[0])
        c["download"] = url.replace("http://", "https://")
        return Source.fetch(self, c, dest)


class ArtInstitute(Source):
    name, kinds = "aic", ("photo",)
    about = "Art Institute of Chicago: public-domain paintings, prints, photographs (CC0)"

    def search(self, kind, q, n):
        d = get("https://api.artic.edu/api/v1/artworks/search?" + urllib.parse.urlencode(
            {"q": q, "query[term][is_public_domain]": "true", "limit": min(n, 40),
             "fields": "id,title,image_id,artist_display,date_display,thumbnail"}))
        out = []
        for a in d.get("data", []):
            if not a.get("image_id"):
                continue
            base = f"https://www.artic.edu/iiif/2/{a['image_id']}"
            out.append(dict(source=self.name, id=str(a["id"]), kind=kind, title=f"{a['title']} ({a.get('date_display') or ''})",
                            author=strip_html(a.get("artist_display", "")).split("\n")[0], licence="CC0",
                            licence_url="https://creativecommons.org/publicdomain/zero/1.0/",
                            page=f"https://www.artic.edu/artworks/{a['id']}", thumb=f"{base}/full/400,/0/default.jpg",
                            download=f"{base}/full/1686,/0/default.jpg", width=(a.get("thumbnail") or {}).get("width"),
                            height=(a.get("thumbnail") or {}).get("height"), ext=".jpg"))
        return out


class Cleveland(Source):
    name, kinds = "cleveland", ("photo",)
    about = "Cleveland Museum of Art open access: paintings, prints, objects (CC0)"

    def search(self, kind, q, n):
        d = get(f"https://openaccess-api.clevelandart.org/api/artworks/?q={urllib.parse.quote(q)}&cc0=1&has_image=1&limit={min(n, 40)}")
        out = []
        for a in d.get("data", []):
            im = a.get("images") or {}
            big = (im.get("print") or im.get("web") or {})
            if not big.get("url"):
                continue
            who = ", ".join(c.get("description", "") for c in (a.get("creators") or [])[:1])
            out.append(dict(source=self.name, id=str(a["id"]), kind=kind, title=f"{a['title']} ({a.get('creation_date') or ''})",
                            author=who, licence="CC0", licence_url="https://creativecommons.org/publicdomain/zero/1.0/",
                            page=a.get("url", ""), thumb=(im.get("web") or {}).get("url"), download=big["url"],
                            width=int(big.get("width") or 0), height=int(big.get("height") or 0), ext=".jpg"))
        return out


class Openverse(Source):
    name, kinds = "openverse", ("photo",)
    about = "Openverse: 800M+ openly licensed images (Flickr, museums, Wikimedia…); often slow"

    def search(self, kind, q, n):
        d = get(f"https://api.openverse.org/v1/images/?q={urllib.parse.quote(q)}&license=cc0,pdm,by&page_size={min(n, 20)}", timeout=20)
        out = []
        for r in d.get("results", []):
            lic = "CC0" if r["license"] == "cc0" else "Public domain" if r["license"] == "pdm" else f"CC {r['license'].upper()} {r.get('license_version') or ''}".strip()
            out.append(dict(source=self.name, id=r["id"], kind=kind, title=r.get("title") or "", author=r.get("creator") or "",
                            licence=lic, licence_url=r.get("license_url", ""), page=r.get("foreign_landing_url", ""),
                            thumb=r.get("thumbnail"), download=r.get("url"), width=r.get("width"), height=r.get("height")))
        return out


class Archive(Source):
    name, kinds = "archive", ("video",)
    about = "Internet Archive: public-domain and CC BY films, newsreels, educational reels"

    def search(self, kind, q, n):
        query = f"({q}) AND mediatype:movies AND (licenseurl:*publicdomain* OR licenseurl:*licenses/by/*)"
        d = get("https://archive.org/advancedsearch.php?" + urllib.parse.urlencode(
            [("q", query), ("fl[]", "identifier"), ("fl[]", "title"), ("fl[]", "licenseurl"), ("fl[]", "creator"),
             ("fl[]", "year"), ("rows", min(n, 30)), ("output", "json")]))
        out = []
        for doc in d.get("response", {}).get("docs", []):
            lu = doc.get("licenseurl", "")
            out.append(dict(source=self.name, id=doc["identifier"], kind=kind, title=f"{doc.get('title', '')} ({doc.get('year', '')})",
                            author=doc.get("creator") if isinstance(doc.get("creator"), str) else ", ".join(doc.get("creator") or []),
                            licence="Public domain" if "publicdomain" in lu else "CC BY", licence_url=lu,
                            page=f"https://archive.org/details/{doc['identifier']}", thumb=f"https://archive.org/services/img/{doc['identifier']}",
                            download=None))
        return out

    def fetch(self, c, dest):
        meta = get(f"https://archive.org/metadata/{c['id']}")
        files = [f for f in meta.get("files", []) if f.get("name", "").lower().endswith((".mp4", ".webm", ".ogv"))]
        files.sort(key=lambda f: (not f["name"].lower().endswith(".mp4"), -int(f.get("size") or 0) if int(f.get("size") or 0) < 400e6 else 1e12))
        if not files:
            raise RuntimeError("no video file in this item")
        c["download"] = f"https://archive.org/download/{c['id']}/{urllib.parse.quote(files[0]['name'])}"
        return Source.fetch(self, c, dest)


class PolyHaven(Source):
    name, kinds = "polyhaven", ("model", "hdri", "texture")
    about = "Poly Haven: photoreal 3D models, HDRI skies and textures (CC0)"
    _cache = {}

    def _list(self, t):
        if t not in self._cache:
            self._cache[t] = get(f"https://api.polyhaven.com/assets?t={t}")
        return self._cache[t]

    def search(self, kind, q, n):
        t = {"model": "models", "hdri": "hdris", "texture": "textures"}[kind]
        words = [w for w in re.findall(r"\w+", q.lower()) if len(w) > 1]
        scored = []
        for aid, a in self._list(t).items():
            hay = " " + " ".join([aid.replace("_", " "), a.get("name", "")] + a.get("tags", []) + a.get("categories", [])).lower()
            s = sum(bool(re.search(r"[\s_-]" + re.escape(w), hay)) for w in words)
            if s:
                scored.append((-s, -a.get("download_count", 0), aid, a))
        out = []
        for _, _, aid, a in sorted(scored)[:n]:
            out.append(dict(source=self.name, id=aid, kind=kind, title=a.get("name", aid), author=", ".join(a.get("authors", {})),
                            licence="CC0", licence_url="https://polyhaven.com/license", page=f"https://polyhaven.com/a/{aid}",
                            thumb=f"https://cdn.polyhaven.com/asset_img/thumbs/{aid}.png?width=320", download=None))
        return out

    def fetch(self, c, dest):
        files = get(f"https://api.polyhaven.com/files/{c['id']}")
        if c["kind"] == "hdri":
            f = files["hdri"]["2k"]["hdr"]
            out = dest.with_suffix(".hdr"); out.write_bytes(get(f["url"], binary=True, timeout=300)); return out
        if c["kind"] == "texture":
            folder = dest; folder.mkdir(parents=True, exist_ok=True)
            for m in ("Diffuse", "nor_gl", "Rough", "AO", "Displacement"):
                if m in files and "2k" in files[m]:
                    f = files[m]["2k"].get("jpg") or files[m]["2k"].get("png")
                    if f:
                        (folder / Path(urllib.parse.urlparse(f["url"]).path).name).write_bytes(get(f["url"], binary=True, timeout=300))
            return folder
        g = files["gltf"]["1k"]["gltf"]
        folder = dest; folder.mkdir(parents=True, exist_ok=True)
        main = folder / Path(urllib.parse.urlparse(g["url"]).path).name
        main.write_bytes(get(g["url"], binary=True, timeout=300))
        for rel, inc in (g.get("include") or {}).items():
            p = folder / rel; p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(get(inc["url"], binary=True, timeout=300))
        return main


class AmbientCG(Source):
    name, kinds = "ambientcg", ("texture",)
    about = "ambientCG: PBR textures — wood, paper, metal, ground, fabric (CC0)"

    def search(self, kind, q, n):
        d = get(f"https://ambientcg.com/api/v2/full_json?type=Material&q={urllib.parse.quote(q)}&limit={min(n, 30)}&include=downloadData,imageData")
        out = []
        for a in d.get("foundAssets", []):
            dl = [x for f in a.get("downloadFolders", {}).values() for c in f.get("downloadFiletypeCategories", {}).values()
                  for x in c.get("downloads", []) if x.get("attribute") == "2K-JPG"]
            imgs = a.get("previewImage", {})
            out.append(dict(source=self.name, id=a["assetId"], kind=kind, title=a.get("displayName", a["assetId"]), author="ambientCG",
                            licence="CC0", licence_url="https://docs.ambientcg.com/license/", page=f"https://ambientcg.com/view?id={a['assetId']}",
                            thumb=imgs.get("256-PNG") or imgs.get("128-PNG"), download=(dl[0]["fullDownloadPath"] if dl else None), ext=".zip"))
        return out

    def fetch(self, c, dest):
        data = get(c["download"], binary=True, timeout=300)
        folder = dest; folder.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            for m in z.namelist():
                if m.lower().endswith((".jpg", ".png")) and "/" not in m.strip("/"):
                    (folder / Path(m).name).write_bytes(z.read(m))
        return folder


class Khronos(Source):
    name, kinds = "khronos", ("model",)
    about = "Khronos glTF sample models: animated characters and showcase objects (CC0 / CC BY, per model)"
    BASE = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models"
    _index = None

    def search(self, kind, q, n):
        if Khronos._index is None:
            Khronos._index = [m for m in get(f"{self.BASE}/model-index.json") if "testing" not in m.get("tags", [])
                              and "glTF-Binary" in m.get("variants", {})]
        words = [w for w in re.findall(r"[a-z0-9]+", q.lower()) if len(w) > 1]
        hits = []
        for m in Khronos._index:
            hay = " ".join([m["name"], m.get("label", "")] + m.get("tags", [])).lower()
            sc = sum(w in hay for w in words)
            if sc:
                hits.append((-sc, m))
        out = []
        for _, m in sorted(hits, key=lambda x: x[0])[:n]:
            try:
                legal = get(f"{self.BASE}/{m['name']}/metadata.json").get("legal", [])
            except Exception:  # noqa: BLE001
                continue
            ids = {x.get("spdx") or x.get("license", "") for x in legal}
            if not ids or not ids <= {"CC0-1.0", "CC-BY-4.0", "CC-BY-3.0"}:
                lic = "unknown"
            else:
                lic = "CC BY 4.0" if "CC-BY-4.0" in ids else "CC BY 3.0" if "CC-BY-3.0" in ids else "CC0"
            who = "; ".join(f"{x.get('what', '')}: {x.get('artist', '')}".strip(": ") for x in legal)
            out.append(dict(source=self.name, id=m["name"], kind="model", title=m.get("label", m["name"]), author=who, licence=lic,
                            licence_url="", page=f"https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/{m['name']}",
                            thumb=f"{self.BASE}/{m['name']}/{m.get('screenshot', 'screenshot/screenshot.png')}",
                            download=f"{self.BASE}/{m['name']}/glTF-Binary/{m['variants']['glTF-Binary']}", note=" ".join(m.get("tags", []))))
        return out

    def fetch(self, c, dest):
        out = dest.with_suffix(".glb")
        out.write_bytes(get(c["download"], binary=True, timeout=300))
        return out


class Catalog(Source):
    """A short, checked list of rigged characters with animations — the 'recurring hero' of a 3D world."""
    name, kinds = "catalog", ("model",)
    about = "hand-checked animated characters (CC0): a robot that walks, runs, waves, jumps, dances, thumbs-up"
    ITEMS = [
        dict(id="robot-expressive", title="Expressive robot (walk, run, idle, wave, jump, dance, yes, no, thumbs-up, punch, sit, death)",
             author="Tomás Laulhé (Quaternius); morph targets by Don McCurdy", licence="CC0",
             page="https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/RobotExpressive",
             download="https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb",
             thumb="https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/screenshots/webgl_animation_skinning_morph.jpg",
             tags="robot character hero person walk run wave jump dance mascot animated"),
    ]

    def search(self, kind, q, n):
        words = [w for w in re.findall(r"[a-z0-9]+", q.lower()) if len(w) > 1]
        out = []
        for it in self.ITEMS:
            hay = (it["title"] + " " + it["tags"]).lower()
            if not words or any(w in hay for w in words):
                out.append(dict(source=self.name, kind="model", licence_url="", note=it["tags"], **{k: it[k] for k in ("id", "title", "author", "licence", "page", "download", "thumb")}))
        return out[:n]

    def fetch(self, c, dest):
        out = dest.with_suffix(".glb")
        out.write_bytes(get(c["download"], binary=True, timeout=300))
        return out


class Pexels(Source):
    name, kinds, needs = "pexels", ("photo", "video"), "PEXELS_API_KEY"
    about = "Pexels: modern stock photos and video, many vertical (free key; Pexels License)"

    def search(self, kind, q, n):
        h = {"Authorization": key(self.needs)}
        if kind == "video":
            d = get(f"https://api.pexels.com/videos/search?query={urllib.parse.quote(q)}&per_page={min(n, 40)}&orientation=portrait", headers=h)
            out = []
            for v in d.get("videos", []):
                files = sorted([f for f in v.get("video_files", []) if f.get("width") and f.get("file_type") == "video/mp4"],
                               key=lambda f: abs((f.get("height") or 0) - 1920))
                if not files:
                    continue
                out.append(dict(source=self.name, id=str(v["id"]), kind=kind, title=v.get("url", "").rstrip("/").split("/")[-1],
                                author=(v.get("user") or {}).get("name", ""), licence="Pexels", licence_url="https://www.pexels.com/license/",
                                page=v.get("url", ""), thumb=v.get("image"), download=files[0]["link"], width=files[0]["width"],
                                height=files[0]["height"], duration=v.get("duration"), ext=".mp4"))
            return out
        d = get(f"https://api.pexels.com/v1/search?query={urllib.parse.quote(q)}&per_page={min(n, 40)}", headers=h)
        return [dict(source=self.name, id=str(p["id"]), kind=kind, title=p.get("alt") or "", author=p.get("photographer", ""),
                     licence="Pexels", licence_url="https://www.pexels.com/license/", page=p.get("url", ""), thumb=p["src"]["medium"],
                     download=p["src"]["original"] + "?auto=compress&cs=tinysrgb&h=2600", width=p.get("width"), height=p.get("height"), ext=".jpg")
                for p in d.get("photos", [])]


class Pixabay(Source):
    name, kinds, needs = "pixabay", ("photo", "video"), "PIXABAY_API_KEY"
    about = "Pixabay: stock photos, illustrations, vectors and video (free key; Pixabay Content License)"

    def search(self, kind, q, n):
        k = key(self.needs)
        if kind == "video":
            d = get(f"https://pixabay.com/api/videos/?key={k}&q={urllib.parse.quote(q)}&per_page={max(3, min(n, 50))}&safesearch=true")
            out = []
            for v in d.get("hits", []):
                vs = v.get("videos", {})
                f = vs.get("large") if (vs.get("large") or {}).get("url") else vs.get("medium")
                out.append(dict(source=self.name, id=str(v["id"]), kind=kind, title=v.get("tags", ""), author=v.get("user", ""),
                                licence="Pixabay", licence_url="https://pixabay.com/service/license-summary/", page=v.get("pageURL", ""),
                                thumb=(vs.get("tiny") or {}).get("thumbnail") or f.get("thumbnail"), download=f["url"], width=f.get("width"),
                                height=f.get("height"), duration=v.get("duration"), ext=".mp4"))
            return out
        d = get(f"https://pixabay.com/api/?key={k}&q={urllib.parse.quote(q)}&per_page={max(3, min(n, 50))}&safesearch=true")
        return [dict(source=self.name, id=str(h["id"]), kind=kind, title=h.get("tags", ""), author=h.get("user", ""), licence="Pixabay",
                     licence_url="https://pixabay.com/service/license-summary/", page=h.get("pageURL", ""), thumb=h.get("webformatURL"),
                     download=h.get("largeImageURL"), width=h.get("imageWidth"), height=h.get("imageHeight"), ext=".jpg")
                for h in d.get("hits", [])]


SOURCES = [Wikimedia(), NASA(), ArtInstitute(), Cleveland(), Openverse(), Archive(), PolyHaven(), Khronos(), Catalog(), AmbientCG(),
           Pexels(), Pixabay()]
BY_NAME = {s.name: s for s in SOURCES}


# --------------------------------------------------------------------------- find
def slug(q):
    return re.sub(r"[^a-z0-9]+", "-", q.lower()).strip("-")[:48] or "search"


def find(video, kind, q, names=None, n=24, allow_sa=False):
    if kind not in KINDS:
        sys.exit(f"kind must be one of {', '.join(KINDS)}")
    srcs = [s for s in SOURCES if kind in s.kinds and (not names or s.name in names)]
    skipped = [s.name for s in srcs if not s.available()]
    srcs = [s for s in srcs if s.available()]
    per = max(4, n // max(1, len(srcs)) + 2)
    found, errors = [], []
    with cf.ThreadPoolExecutor(8) as ex:
        futs = {ex.submit(s.search, kind, q, per): s for s in srcs}
        for f in cf.as_completed(futs):
            try:
                found += f.result()
            except Exception as e:  # noqa: BLE001 — one slow or failing source must not sink the search
                errors.append(f"{futs[f].name}: {str(e)[:80]}")
    ok = [c for c in found if allowed(c, allow_sa) and c.get("thumb")]
    dropped = len(found) - len(ok)
    # relevance: the share of the query's words found in what a candidate says about itself; museum
    # searches match single words ("Alexander" -> Alexander the Great), so a candidate must match one
    words = [w for w in re.findall(r"[a-z0-9]+", q.lower()) if len(w) > 2]
    GENERIC = {"photo", "photograph", "portrait", "picture", "image", "the", "and", "with", "from", "film", "footage", "video"}
    core = [w for w in words if w not in GENERIC]
    for c in ok:
        hay = " ".join(str(c.get(k) or "") for k in ("title", "author", "note", "id")).lower()
        hay_words = set(re.findall(r"[a-z0-9]+", hay))
        hit = sum(w in hay_words or (len(w) > 4 and w in hay) for w in words)          # whole words ("fleming" is not "flemming")
        phrase = len(core) > 1 and " ".join(core) in " ".join(re.findall(r"[a-z0-9]+", hay))
        c["score"] = round(hit / max(1, len(words)) + (0.5 if phrase else 0), 2) if words else 1
    unrelated = [c for c in ok if c["score"] == 0 and c["source"] in ("aic", "cleveland")]
    ok = [c for c in ok if c not in unrelated]
    ok.sort(key=lambda c: -c["score"])
    # best matches first; within equally good matches, take turns between sources so the sheet is
    # not one source's page
    mixed = []
    for score in sorted({c["score"] for c in ok}, reverse=True):
        by = {}
        for c in ok:
            if c["score"] == score:
                by.setdefault(c["source"], []).append(c)
        while any(by.values()):
            for src in list(by):
                if by[src]:
                    mixed.append(by[src].pop(0))
    mixed = mixed[:n]
    for i, c in enumerate(mixed, 1):
        c["n"] = i
    out = video / "out/find"; out.mkdir(parents=True, exist_ok=True)
    name = slug(f"{kind}-{q}")
    json.dump({"kind": kind, "query": q, "candidates": mixed}, open(out / f"{name}.json", "w"), indent=1)
    json.dump({"last": name}, open(out / "last.json", "w"))
    sheet = out / f"{name}.jpg"
    contact_sheet(mixed, sheet, f"{kind}: {q}")
    print(f"{len(mixed)} candidates for {kind} '{q}' -> {sheet}")
    for c in mixed:
        size = f"{c['width']}x{c['height']}" if c.get("width") else ""
        dur = f" {c['duration']:.0f}s" if isinstance(c.get("duration"), (int, float)) else ""
        print(f"  {c['n']:>2}  {c['source']:<10} {licence_info(c['licence'], c.get('licence_url', ''))[0]:<22} {size:<11}{dur:<5} {c['title'][:60]}")
    if dropped:
        print(f"  ({dropped} more left out for their licence: non-commercial, no-derivatives, unknown, or share-alike without --allow-sa)")
    if unrelated:
        print(f"  ({len(unrelated)} museum results left out: none of the query's words in their titles)")
    for s in skipped:
        print(f"  ({s} skipped: set {BY_NAME[s].needs} — a free key — to search it)")
    for e in errors:
        print(f"  ({e})")
    print(f"next: look at the sheet; take one with  lockstep take {video.name} {name} <number> --as <name>")


def contact_sheet(cands, path, title):
    from PIL import Image, ImageDraw, ImageFont

    def font(s, bold=False):
        for f in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",):
            try:
                return ImageFont.truetype(f, s)
            except OSError:
                pass
        return ImageFont.load_default()
    cols, cw, ch, lab = 4, 300, 300, 46
    rows = max(1, (len(cands) + cols - 1) // cols)
    sheet = Image.new("RGB", (cols * cw, 50 + rows * (ch + lab)), (18, 18, 22))
    d = ImageDraw.Draw(sheet)
    d.text((12, 12), title, font=font(22, True), fill=(240, 240, 240))

    def thumb(c):
        try:
            return Image.open(io.BytesIO(get(c["thumb"], binary=True, timeout=25))).convert("RGB")
        except Exception:  # noqa: BLE001
            return None
    with cf.ThreadPoolExecutor(12) as ex:
        ims = list(ex.map(thumb, cands))
    f1, f2 = font(15, True), font(12)
    for i, (c, im) in enumerate(zip(cands, ims)):
        x, y = (i % cols) * cw, 50 + (i // cols) * (ch + lab)
        if im is not None:
            im.thumbnail((cw - 8, ch - 8))
            sheet.paste(im, (x + (cw - im.width) // 2, y + (ch - im.height) // 2))
        d.rectangle([x + 4, y + 4, x + 40, y + 26], fill=(0, 0, 0))
        d.text((x + 9, y + 6), str(c["n"]), font=f1, fill=(255, 220, 0))
        if c["kind"] == "video":
            d.text((x + 46, y + 6), f"▶ {c['duration']:.0f}s" if isinstance(c.get("duration"), (int, float)) else "▶", font=f1, fill=(255, 255, 255))
        lic = licence_info(c["licence"], c.get("licence_url", ""))[0]
        size = f"{c['width']}×{c['height']}" if c.get("width") else ""
        d.text((x + 6, y + ch + 2), f"{c['source']} · {lic} {size}"[:44], font=f2, fill=(170, 200, 255))
        d.text((x + 6, y + ch + 20), c["title"][:44], font=f2, fill=(220, 220, 220))
    sheet.save(path, quality=85)


# --------------------------------------------------------------------------- take / restore / credits
def credits_path(video):
    return video / "media/credits.json"


def load_credits(video):
    p = credits_path(video)
    return json.load(open(p)) if p.exists() else {}


def finish_photo(path):
    """Scale a photo to at most MAX_PX and store it as JPEG (or PNG when it has transparency)."""
    from PIL import Image
    im = Image.open(path)
    has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
    im = im.convert("RGBA" if has_alpha else "RGB")
    im.thumbnail((MAX_PX, MAX_PX))
    out = path.with_suffix(".png" if has_alpha else ".jpg")
    if out != path:
        path.unlink()
    im.save(out, **({} if has_alpha else {"quality": 92}))
    return out, im.size


USE_HINT = {"photo": "useImage('{name}')  (setup) · photo(ctx, h, p) (draw)", "video": "useVideo('{name}', {{ from, to }})  (setup) · film(ctx, h, local) (draw)",
            "model": "await w.model('{name}', {{ height: 1.8 }})  inside world3d(async (T, w) => …)",
            "hdri": "await w.sky('{name}')  inside world3d(async (T, w) => …)", "texture": "await w.texture('{name}/<map file>')  inside world3d(…)"}


def take(video, search, number, as_name=None):
    out = video / "out/find"
    if search == "last":
        search = json.load(open(out / "last.json"))["last"]
    data = json.load(open(out / f"{search}.json"))
    c = next((x for x in data["candidates"] if x["n"] == int(number)), None)
    if not c:
        sys.exit(f"no candidate {number} in {search}")
    name = re.sub(r"[^a-z0-9_-]+", "-", (as_name or slug(c["title"])).lower()).strip("-")
    media = video / "media"; media.mkdir(parents=True, exist_ok=True)
    f = BY_NAME[c["source"]].fetch(c, media / name)
    info = {}
    if c["kind"] == "photo":
        f, size = finish_photo(f); info["size"] = list(size)
    elif c["kind"] == "video":
        info.update(probe(f))
    lic, _, credit, _ = licence_info(c["licence"], c.get("licence_url", ""))
    cr = load_credits(video)
    cr[name] = {"file": str(f.relative_to(media)), "kind": c["kind"], "source": c["source"], "id": c["id"], "title": c["title"],
                "author": c.get("author", ""), "licence": lic, "licence_url": c.get("licence_url", ""), "page": c.get("page", ""),
                "download": c.get("download"), "credit_required": credit, "taken": datetime.date.today().isoformat(), **info}
    json.dump(cr, open(credits_path(video), "w"), indent=1, ensure_ascii=False)
    print(f"media/{cr[name]['file']}  ({c['source']} · {lic}{' · credit required' if credit else ''})  {info.get('size') or ''}"
          f"{(' ' + str(info.get('duration')) + ' s') if info.get('duration') else ''}")
    print("in a scene: " + USE_HINT[c["kind"]].format(name=name))


EXT_KIND = {".jpg": "photo", ".jpeg": "photo", ".png": "photo", ".webp": "photo", ".tif": "photo", ".tiff": "photo",
            ".mp4": "video", ".mov": "video", ".webm": "video", ".mkv": "video", ".glb": "model", ".gltf": "model", ".hdr": "hdri"}


def add(video, src, as_name, licence, author="", page="", title="", kind=None):
    """Bring in a file (or URL) obtained some other way, with its licence, so it is credited like the rest."""
    if not as_name or not licence:
        sys.exit('add needs --as <name> and --licence "<licence>" (for example CC0, "CC BY 4.0", "Public domain")')
    lic, ok, credit, sa = licence_info(licence)
    if not ok:
        sys.exit(f"licence {licence!r} is not one a video can use (non-commercial or no-derivatives)")
    name = re.sub(r"[^a-z0-9_-]+", "-", as_name.lower()).strip("-")
    media = video / "media"; media.mkdir(parents=True, exist_ok=True)
    ext = Path(urllib.parse.urlparse(src).path).suffix.lower()
    kind = kind or EXT_KIND.get(ext)
    if not kind:
        sys.exit(f"cannot tell what kind of media {src} is: give --kind photo|video|model|hdri|texture")
    dest = media / (name + ext)
    if re.match(r"https?://", src):
        dest.write_bytes(get(src, binary=True, timeout=600)); page = page or src
    else:
        import shutil
        shutil.copyfile(src, dest)
    info = {}
    if kind == "photo":
        dest, size = finish_photo(dest); info["size"] = list(size)
    elif kind == "video":
        info.update(probe(dest))
    cr = load_credits(video)
    cr[name] = {"file": str(dest.relative_to(media)), "kind": kind, "source": "added", "id": src, "title": title or name, "author": author,
                "licence": lic, "licence_url": "", "page": page, "download": src if re.match(r"https?://", src) else None,
                "credit_required": credit, "taken": datetime.date.today().isoformat(), **info}
    json.dump(cr, open(credits_path(video), "w"), indent=1, ensure_ascii=False)
    print(f"media/{cr[name]['file']}  ({lic}{' · share-alike: the video inherits it' if sa else ''}{' · credit required' if credit else ''})")


CUT_MODEL = "isnet-general-use.onnx"
CUT_URL = "https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx"


def cutout(video, name):
    """The subject of a photo without its background: media/<name>.cut.png (IS-Net, Apache 2.0, run locally)."""
    import numpy as np
    import onnxruntime as ort
    from PIL import Image
    cr = load_credits(video)
    e = cr.get(name)
    if not e or e["kind"] != "photo":
        sys.exit(f"no photo called {name} in media/credits.json")
    model = MODELS / "cutout" / CUT_MODEL
    if not model.exists():
        print(f"downloading the cut-out model once (~170 MB) -> {model}")
        model.parent.mkdir(parents=True, exist_ok=True)
        tmp = model.with_suffix(".part")
        tmp.write_bytes(get(CUT_URL, binary=True, timeout=900))
        tmp.rename(model)
    im = Image.open(video / "media" / e["file"]).convert("RGB")
    x = np.asarray(im.resize((1024, 1024), Image.LANCZOS)).astype(np.float32)
    x = x / max(float(x.max()), 1e-6)
    x = ((x - np.array([0.485, 0.456, 0.406], np.float32)) / np.array([1.0, 1.0, 1.0], np.float32)).transpose(2, 0, 1)[None].astype(np.float32)
    sess = ort.InferenceSession(str(model), providers=["CPUExecutionProvider"])
    pred = sess.run(None, {sess.get_inputs()[0].name: x})[0][0, 0]
    pred = (pred - pred.min()) / max(float(pred.max() - pred.min()), 1e-6)
    mask = Image.fromarray((pred * 255).astype("uint8"), "L").resize(im.size, Image.LANCZOS)
    m = np.asarray(mask).astype(np.float32) / 255
    m = np.clip((m - 0.08) / 0.84, 0, 1)                               # firm up the soft fringe
    rgba = np.dstack([np.asarray(im), (m * 255).astype("uint8")])
    ys, xs = np.where(m > 0.04)
    if not len(xs):
        sys.exit("the model found no subject in this photo")
    pad = 8
    box = (max(0, xs.min() - pad), max(0, ys.min() - pad), min(im.width, xs.max() + pad + 1), min(im.height, ys.max() + pad + 1))
    out = Image.fromarray(rgba, "RGBA").crop(box)
    f = video / "media" / f"{name}.cut.png"
    out.save(f, optimize=True)
    e["cutout"] = f.name
    json.dump(cr, open(credits_path(video), "w"), indent=1, ensure_ascii=False)
    share = float((m > 0.5).mean())
    print(f"media/{f.name}  {out.width}x{out.height}  (subject covers {share * 100:.0f}% of the photo"
          f"{' — very little: check that the cut-out is what you wanted' if share < 0.04 else ''})")
    print(f"in a scene: useImage('{name}', {{ cutout: true }})")


def probe(f):
    try:
        r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate",
                            "-show_entries", "format=duration", "-of", "json", str(f)], capture_output=True, text=True, check=True)
        d = json.loads(r.stdout)
        s = d["streams"][0]
        return {"size": [s["width"], s["height"]], "duration": round(float(d["format"]["duration"]), 2)}
    except Exception:  # noqa: BLE001
        return {}


def restore(video):
    cr, n = load_credits(video), 0
    for name, e in cr.items():
        f = video / "media" / e["file"]
        if f.exists():
            continue
        c = {"source": e["source"], "id": e["id"], "kind": e["kind"], "download": e.get("download"), "title": e["title"]}
        if e["source"] == "added":
            if not e.get("download"):
                print(f"  {name}: added from a local file — copy it back to media/{e['file']} by hand")
                continue
            f.write_bytes(get(e["download"], binary=True, timeout=600))
            got = f
        else:
            got = BY_NAME[e["source"]].fetch(c, video / "media" / name)
        if e["kind"] == "photo":
            finish_photo(got)
        n += 1
        print(f"restored media/{e['file']}")
    for name, e in cr.items():
        if e.get("cutout") and not (video / "media" / e["cutout"]).exists() and (video / "media" / e["file"]).exists():
            cutout(video, name)
    print(f"{n} file(s) restored, {len(cr) - n} already present")


def write_credits(video):
    cr = load_credits(video)
    lines = ["# Media credits", "", "Paste the lines marked *credit required* into the video's description.", ""]
    for name, e in sorted(cr.items()):
        tag = " — *credit required*" if e.get("credit_required") else ""
        who = f" by {e['author']}" if e.get("author") else ""
        lines.append(f"- **{name}**: “{e['title']}”{who}, {e['licence']}"
                     f"{(' (' + e['licence_url'] + ')') if e.get('licence_url') else ''}, {e['page']}{tag}")
    (video / "docs").mkdir(exist_ok=True)
    (video / "docs/credits.md").write_text("\n".join(lines) + "\n")
    print(f"docs/credits.md: {len(cr)} item(s), {sum(1 for e in cr.values() if e.get('credit_required'))} need a credit line")


def list_media(video):
    cr = load_credits(video)
    if not cr:
        print("no media taken yet: lockstep find <video> <kind> \"<query>\"")
    for name, e in sorted(cr.items()):
        ok = (video / "media" / e["file"]).exists()
        print(f"  {name:<22} {e['kind']:<8} {e['licence']:<22} {e['source']:<10} {'cut-out ' if e.get('cutout') else ''}"
              f"{'' if ok else 'MISSING (lockstep media <video> restore)'}")


def sources():
    for s in SOURCES:
        state = "ready" if s.available() else f"needs {s.needs}"
        print(f"  {s.name:<10} {','.join(s.kinds):<22} {state:<22} {s.about}")


def main():
    a = sys.argv[1:]
    if not a or a[0] in ("-h", "--help"):
        sys.exit(__doc__)
    cmd = a[0]
    if cmd == "sources":
        return sources()
    video = project_dir(a[1] if len(a) > 1 else None)
    opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d  # noqa: E731
    if cmd == "find":
        rest = [x for i, x in enumerate(a[2:], 2) if not x.startswith("--") and not (i > 2 and a[i - 1] in ("--sources", "--n"))]
        if len(rest) < 2:
            sys.exit('usage: find <video> <kind> "<query>"')
        names = opt("--sources").split(",") if opt("--sources") else None
        find(video, rest[0], " ".join(rest[1:]), names, int(opt("--n", 24)), "--allow-sa" in a)
    elif cmd == "take":
        rest = [x for i, x in enumerate(a[2:], 2) if not x.startswith("--") and a[i - 1] != "--as"]
        take(video, rest[0], rest[1], opt("--as"))
    elif cmd == "add":
        rest = [x for i, x in enumerate(a[2:], 2) if not x.startswith("--") and a[i - 1] not in ("--as", "--licence", "--author", "--page", "--title", "--kind")]
        if not rest:
            sys.exit('usage: add <video> <file|url> --as name --licence "CC0"')
        add(video, rest[0], opt("--as"), opt("--licence"), opt("--author", ""), opt("--page", ""), opt("--title", ""), opt("--kind"))
    elif cmd == "cutout":
        if len(a) < 3:
            sys.exit("usage: cutout <video> <name>")
        cutout(video, a[2])
    elif cmd == "list":
        list_media(video)
    elif cmd == "restore":
        restore(video)
    elif cmd == "credits":
        write_credits(video)
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
