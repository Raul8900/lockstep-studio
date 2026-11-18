'use strict';
/* =====================================================================
   media.js — real imagery in the frame: photographs, paintings, maps
   and film clips taken with `lockstep take`, filling the frame and moved
   by a camera that never stops; cut-outs float in front with parallax.

   Setup code (once, in a scene's SCENE_DEFS function or components.js):
     const lab = useImage('fleming-lab');                 // media/fleming-lab.jpg
     const dish = useImage('petri-dish', { grade: false });  // keep its own colours
     const fleming = useImage('fleming', { cutout: true });  // media/fleming.cut.png (lockstep cutout)
     const pour = useVideo('pouring', { from: 2.0, to: 6.5 });  // seconds of the source clip

   Draw code (every frame):
     photo(ctx, lab, p, { move: 'in', focus: [0.62, 0.40] }); // p: 0..1 through the shot
     photoPath(ctx, lab, t, [[c.a, { z: 1.1 }], [c.b, { z: 1.8, x: 0.4, y: 0.3 }]]);   // a path, key by key
     film(ctx, pour, t - c.pour, { move: 'in' });            // clip time = scene time since the shot began
     cutout(ctx, fleming, p, { x: 540, y: 1300, h: 1200, depth: 1.8 });

   Grade: every picture and clip gets style.json "grade" (contrast, saturation, brightness,
   sepia, a tint) once, when it loads, so a video's pictures look like one film.
   ===================================================================== */

const MEDIA = new Map();                 // name -> handle
const VCACHE = new Map();                // `${name}:${index}` -> graded canvas (film frames)
let VMISS = [];                          // film frames a render wanted and did not have
let CREDITS = {};                        // media/credits.json: what each name is, where it came from
let CUR_FRAME = -1;                      // the frame being rendered (for read-ahead)

function _spec(name, kind, o) {
  if (window.READY) throw new Error(`use${kind}('${name}') called after loading: declare media in a scene's setup code, not in its draw function`);
  const key = kind + ':' + name + (o.cutout ? ':cut' : '');
  if (!MEDIA.has(key)) MEDIA.set(key, { name, kind, o, img: null, w: 0, h: 0, frames: 0, last: 0 });
  return MEDIA.get(key);
}
/* a photograph, painting, print or map from media/ */
function useImage(name, o = {}) { return _spec(name, 'Image', o); }
/* a film clip from media/; from/to: seconds of the source to use (frames are extracted once, at 30 fps) */
function useVideo(name, o = {}) { return _spec(name, 'Video', o); }

function _file(name, kind, o) {
  const c = CREDITS[name];
  if (kind === 'Image' && o.cutout) return `${name}.cut.png`;
  if (c) return c.file;
  return kind === 'Video' ? `${name}.mp4` : `${name}.jpg`;
}
function _gradeFilter(o) {
  if (o.grade === false) return 'none';
  const G = Object.assign({}, STYLE.grade, o.grade || {});
  const parts = [];
  if (G.contrast !== 1) parts.push(`contrast(${G.contrast})`);
  if (G.saturate !== 1) parts.push(`saturate(${G.saturate})`);
  if (G.brightness !== 1) parts.push(`brightness(${G.brightness})`);
  if (G.sepia) parts.push(`sepia(${G.sepia})`);
  return parts.join(' ') || 'none';
}
/* draws src into a new canvas with the grade (and the style's tint) applied */
function _graded(src, w, h, o) {
  const c = makeCanvas(w, h), g = c.getContext('2d');
  g.filter = _gradeFilter(o);
  g.drawImage(src, 0, 0, w, h);
  g.filter = 'none';
  const G = Object.assign({}, STYLE.grade, o.grade || {});
  if (o.grade !== false && G.tint && G.tintAmount > 0) {
    g.globalCompositeOperation = 'source-atop'; g.globalAlpha = G.tintAmount;
    g.fillStyle = COL[G.tint] || G.tint; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  }
  return c;
}
const _loadImg = (src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('could not load ' + src)); im.src = src; });

/* boot: every declared picture loaded and graded; every clip's frames extracted by the server */
async function loadMedia() {
  if (!MEDIA.size && !(typeof WORLDS !== 'undefined' && WORLDS.length)) return;
  CREDITS = await fetch('project/media/credits.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  const videos = [];
  await Promise.all([...MEDIA.values()].map(async (m) => {
    const file = _file(m.name, m.kind, m.o);
    if (m.kind === 'Image') {
      const im = await _loadImg('project/media/' + file).catch(() => {
        throw new Error(`no picture media/${file}${m.o.cutout ? ` — make it with: lockstep cutout <video> ${m.name}` : ' — take one with lockstep find / take'}`);
      });
      m.w = im.naturalWidth; m.h = im.naturalHeight;
      m.img = m.o.cutout ? im : _graded(im, m.w, m.h, m.o);
    } else videos.push({ name: m.name, file, from: m.o.from || 0, to: m.o.to == null ? null : m.o.to, focus: m.o.focus || [0.5, 0.5] });
  }));
  if (videos.length) {
    const r = await fetch('/prepare-media', { method: 'POST', body: JSON.stringify(videos) });
    if (!r.ok) throw new Error('preparing film clips failed: ' + (await r.text()));
    const info = await r.json();
    for (const m of MEDIA.values()) if (m.kind === 'Video') {
      const i = info[m.name];
      if (!i || i.error) throw new Error(`film clip ${m.name}: ${i ? i.error : 'not prepared'}`);
      Object.assign(m, { frames: i.frames, w: i.w, h: i.h });
    }
  }
  if (typeof load3D === 'function') await load3D();       // world3d.js: three.js and the 3D worlds
}

/* one film frame, if loaded; otherwise the render notes the miss (renderFrameReady loads it and draws again) */
function _videoFrame(m, idx) {
  idx = Math.max(0, Math.min(m.frames - 1, idx));
  const k = m.name + ':' + idx, im = VCACHE.get(k);
  if (!im) VMISS.push([m, idx]);
  else { VCACHE.delete(k); VCACHE.set(k, im); }                 // most recently used last
  m.last = idx;
  return im || VCACHE.get(m.name + ':' + (m.shown == null ? -1 : m.shown)) || null;
}
async function _loadFrames(list) {
  await Promise.all(list.map(async ([m, idx]) => {
    const k = m.name + ':' + idx;
    if (VCACHE.has(k)) return;
    const im = await _loadImg(`project/out/media/${m.name}/${String(idx + 1).padStart(5, '0')}.jpg`);
    VCACHE.set(k, _graded(im, im.naturalWidth, im.naturalHeight, m.o));
  }));
  while (VCACHE.size > 160) VCACHE.delete(VCACHE.keys().next().value);       // oldest first
}
/* Render frame i with every film frame it needs: draw, load what was missing, draw again.
   The last pass always has every frame, so the output does not depend on timing. */
async function renderFrameReady(i) {
  CUR_FRAME = i;
  for (let pass = 0; pass < 4; pass++) {
    VMISS = [];
    renderFrame(i);
    if (!VMISS.length) break;
    await _loadFrames(VMISS);
  }
  const ahead = [];                                    // the next frames of every clip on screen, for the next render
  for (const m of MEDIA.values()) if (m.kind === 'Video' && m.lastFrameAt === i) for (let k = 1; k <= 3; k++) ahead.push([m, m.last + k]);
  if (ahead.length) _loadFrames(ahead.filter(([m, x]) => x < m.frames)).catch(() => {});
}

/* ---------- the camera on a picture ---------- */
/* Where a w × h source lands when it covers the frame, zoomed by z about focus (fx, fy) — the
   point of the source (0..1) that sits at the frame's centre — and kept from showing an edge. */
function _cover(w, h, z, fx, fy) {
  const s = Math.max(W / w, H / h) * z, dw = w * s, dh = h * s;
  let x = W / 2 - fx * dw, y = H / 2 - fy * dh;
  x = Math.min(0, Math.max(W - dw, x)); y = Math.min(0, Math.max(H - dh, y));
  return [x, y, dw, dh];
}
/* the camera's path through a shot: o.move — 'in' (default), 'out', 'left', 'right', 'up', 'down',
   'still' — or o.from / o.to: { z, x, y } (zoom, focus x, focus y); o.focus: the point moved to */
function _camera(p, o) {
  const f = o.focus || [0.5, 0.45], amt = o.amount == null ? 1 : o.amount, e = (o.ease || E.ioSine)(clamp(p));
  if (o.from || o.to) {
    const a = Object.assign({ z: 1, x: f[0], y: f[1] }, o.from), b = Object.assign({ z: 1, x: f[0], y: f[1] }, o.to);
    return { z: lerp(a.z, b.z, e), x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e) };
  }
  const d = 0.08 * amt;
  switch (o.move || 'in') {
    case 'out': return { z: 1 + 0.16 * amt - 0.14 * amt * e, x: f[0], y: f[1] };
    case 'left': return { z: 1.18, x: f[0] + d - 2 * d * e, y: f[1] };
    case 'right': return { z: 1.18, x: f[0] - d + 2 * d * e, y: f[1] };
    case 'up': return { z: 1.18, x: f[0], y: f[1] + d - 2 * d * e };
    case 'down': return { z: 1.18, x: f[0], y: f[1] - d + 2 * d * e };
    case 'still': return { z: 1.02, x: f[0], y: f[1] };
    default: return { z: 1.02 + 0.14 * amt * e, x: f[0], y: f[1] };            // 'in'
  }
}
function _drawCovered(ctx, src, w, h, cam, o) {
  const [x, y, dw, dh] = _cover(w, h, cam.z, cam.x, cam.y);
  const a = o.alpha == null ? 1 : o.alpha;
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= clamp(a); ctx.imageSmoothingQuality = 'high';
  if (o.shake) { ctx.translate(Math.sin(o.shake[1] * 37.1) * o.shake[0], Math.cos(o.shake[1] * 29.3) * o.shake[0]); }
  ctx.drawImage(src, x, y, dw, dh);
  ctx.restore();
  return { x, y, w: dw, h: dh, at: (u, v) => [x + u * dw, y + v * dh] };
}

/* A picture filling the frame, the camera moving through it over the shot (p: 0..1).
   Returns where the picture landed, with at(u, v): the frame position of a point of the picture —
   to pin a label or an arrow to something in it. */
function photo(ctx, m, p, o = {}) {
  if (!m.img) return null;
  return _drawCovered(ctx, m.img, m.w, m.h, _camera(p, o), o);
}

/* A picture with a camera path through it: keys [[time, { z, x, y }], …] — zoom and the point of
   the picture (0..1) at the frame's centre — eased between neighbours (o.ease, E.ioSine), holding
   before the first and after the last. One continuous move from the overview to the face to the
   detail, each arrival timed to its word. Returns what photo() returns. */
function photoPath(ctx, m, t, keys, o = {}) {
  if (!m.img) return null;
  let cam = keys[keys.length - 1][1];
  if (t <= keys[0][0]) cam = keys[0][1];
  else for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, A] = keys[i - 1], [t1, B] = keys[i], e = (B.ease || o.ease || E.ioSine)(prog(t, t0, t1));
      cam = { z: lerp(A.z || 1, B.z || 1, e), x: lerp(A.x == null ? 0.5 : A.x, B.x == null ? 0.5 : B.x, e), y: lerp(A.y == null ? 0.5 : A.y, B.y == null ? 0.5 : B.y, e) };
      break;
    }
  }
  return _drawCovered(ctx, m.img, m.w, m.h, { z: cam.z || 1, x: cam.x == null ? 0.5 : cam.x, y: cam.y == null ? 0.5 : cam.y }, o);
}

/* A film clip filling the frame. local: seconds since the shot began (scene time − its start).
   o.speed (1), o.loop (false: the last frame holds), o.move / o.from / o.to as for photo (default:
   a gentle push-in), o.dur: the shot's length, so the camera's move spans it (default 4 s). */
function film(ctx, m, local, o = {}) {
  if (!m.frames) return null;
  let idx = Math.floor(Math.max(0, local) * (o.speed || 1) * FPS);
  if (o.loop) idx = idx % m.frames;
  const im = _videoFrame(m, idx);
  m.lastFrameAt = CUR_FRAME;
  if (!im) return null;
  m.shown = Math.min(m.frames - 1, Math.max(0, idx));
  const cam = _camera(local / (o.dur || 4), Object.assign({ amount: 0.5 }, o));
  return _drawCovered(ctx, im, im.width, im.height, cam, o);
}

/* A cut-out (a subject with its background removed: lockstep cutout) standing in the frame.
   x, y: where its feet (bottom centre) stand; h: its height on screen; depth (1): how much more than
   the picture behind it the camera's move shifts it — 1.5–2.5 reads as standing in front; p: the
   shot's progress; o.drift: [dx, dy] px over the shot; o.in: 0..1 rises and fades it in; o.shadow. */
function cutout(ctx, m, p, o = {}) {
  if (!m.img) return null;
  const hh = o.h || 1100, ww = hh * m.w / m.h, e = E.ioSine(clamp(p)), dep = o.depth == null ? 1.6 : o.depth;
  const drift = o.drift || [-40, 0], kin = o.in == null ? 1 : E.out3(clamp(o.in));
  const x = (o.x == null ? CX : o.x) + (e - 0.5) * drift[0] * dep, y = (o.y == null ? H - 120 : o.y) + (e - 0.5) * drift[1] * dep + (1 - kin) * 80;
  const sc = 1 + 0.06 * dep * e * (o.grow == null ? 1 : o.grow);
  ctx.save(); ctx.globalAlpha *= clamp(kin * (o.alpha == null ? 1 : o.alpha));
  ctx.translate(x, y); ctx.scale(sc * (o.flip ? -1 : 1), sc);
  if (o.shadow !== false) { ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18; }
  ctx.drawImage(m.img, -ww / 2, -hh, ww, hh);
  ctx.restore();
  return { x: x - ww * sc / 2, y: y - hh * sc, w: ww * sc, h: hh * sc };
}

/* ---------- shots ---------- */
/* The shot on screen at time t, from a list in order: [{ at: start time, draw(ctx, t, p, local) }].
   Each runs until the next one starts (the last until `end`, default the scene's end): p is its
   progress 0..1, local the seconds since it began. A cut is a new entry; o.cut: 'flash' | 'whip'
   gives the cut a 0.15 s accent. Returns the index of the shot drawn. */
function shots(ctx, t, list, o = {}) {
  let k = 0;
  for (let i = 0; i < list.length; i++) if (t >= list[i].at) k = i;
  const s = list[k], end = k + 1 < list.length ? list[k + 1].at : (o.end != null ? o.end : s.at + 4);
  const local = t - s.at, p = clamp(local / Math.max(0.01, end - s.at));
  s.draw(ctx, t, p, local, end - s.at);
  const cutType = s.cut || o.cut;
  if (k > 0 && cutType && local < 0.18) {
    const f = 1 - local / 0.18;
    ctx.save();
    if (cutType === 'flash') { ctx.globalAlpha = 0.85 * f * f; ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H); }
    else if (cutType === 'dip') { ctx.globalAlpha = f * f; ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  }
  return k;
}

/* a quick zoom punch on a word: a scale factor ≥ 1 for time t, peaking just after t0 */
const punch = (t, t0, amt = 0.08, dur = 0.5) => 1 + amt * (t < t0 ? 0 : Math.exp(-(t - t0) / (dur * 0.35)) * clamp((t - t0) / 0.06));
/* camera shake: an [amplitude px, phase] pair for photo()/film() o.shake, decaying after t0 */
const shake = (t, t0, amp = 14, dur = 0.6) => [t < t0 ? 0 : amp * Math.max(0, 1 - (t - t0) / dur), t * 30];

/* ---------- `render.js <video> look` ----------
   One 2-second scene per picture or film clip in media/credits.json, drawn through the grade with
   a line of captions on it (one key word in the key colour), before any narration exists. */
const LOOK_ITEMS = [];
async function setupLook() {
  CREDITS = await fetch('project/media/credits.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  const ws = ['Captions', 'sit', 'here,', 'one', 'key', 'word'], phrases = [];
  DATA.words = []; DATA.takes = []; DATA.beats = [];
  for (const [name, c] of Object.entries(CREDITS)) {
    if (!['photo', 'video'].includes(c.kind)) continue;
    const k = LOOK_ITEMS.length, h = c.kind === 'video' ? useVideo(name, { from: 0, to: 3 }) : useImage(name);
    const cut = c.cutout ? useImage(name, { cutout: true }) : null;
    LOOK_ITEMS.push({ name, about: [c.kind, c.licence, c.source, c.cutout ? 'cut-out on the right' : ''].filter(Boolean).join(' · ') });
    ws.forEach((w, j) => DATA.words.push({ w, t0: k * 2 + 0.6 + j * 0.12, t1: k * 2 + 0.7 + j * 0.12, beat: 'look' + k, take: k, cls: w === 'key' ? 'k' : null }));
    phrases.push('Captions sit here,', 'one key word');
    DATA.beats.push({ id: 'look' + k, title: name, t0: k * 2 + 0.5, t1: k * 2 + 1.9 });
    addScene('look' + k, (ctx, t) => {
      if (c.kind === 'video') film(ctx, h, t - k * 2, { dur: 2 }); else photo(ctx, h, (t - k * 2) / 2);
      if (cut) cutout(ctx, cut, 0.5, { x: 760, y: 1700, h: 900 });
    }, { type: 'cut' });
  }
  DATA.meta = { duration: Math.max(2, LOOK_ITEMS.length * 2) }; DATA.dur = DATA.meta.duration;
  CAPS = DATA.words.length ? buildCaptions(DATA.words, phrases) : [];
  if (!LOOK_ITEMS.length) { DATA.beats = [{ id: 'empty', title: 'empty', t0: 0.5, t1: 1.5 }]; addScene('empty', () => {}); }
}
