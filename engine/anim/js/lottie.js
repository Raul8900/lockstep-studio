'use strict';
/* =====================================================================
   lottie.js — Lottie animations: designer-made vector motion (JSON),
   played frame-accurately on the narration's clock by lottie-web (MIT,
   vendor/lottie_canvas.min.js).

   Files live in the video's lottie/ folder with their credits in
   lottie/credits.json (bin/lockstep lottie-search / lottie-get).

   In a scene's SETUP code (not inside the draw function):
     const bee = useLottie('bee');                                   // lottie/bee.json
     const pop = useLottie('confetti', { recolor: 'nearest', colors: ['accent', 'subject', 'good'], res: 900 });
   In the draw function:
     drawLottie(ctx, bee, t, x, y, 320, { at: c.bee, loop: true });  // starts on the word "bee", loops
     drawLottie(ctx, pop, t, 540, 800, 900, { at: c.wins, peak: 18 });  // its frame 18 lands on "wins"

   Every file is parsed, recoloured and given its own off-screen canvas once,
   before frame 0. A frame is drawn by seeking the animation to an exact
   (fractional) frame, so frames stay pure functions of time.
   ===================================================================== */

const LOTTIE_PLAYER = window.lottie;        // lottie-web; our API uses other names to leave it alone
const LOT_SPECS = new Map();                // handle -> spec
const LOT = new Map();                      // handle -> { anim, canvas, ip, op, fr, w, h, markers, spec, maxDrawn }
const LOT_RECOLOR = ['none', 'tint', 'palette', 'nearest'];
let LOT_LOCKED = false;

/* Declare a Lottie file; returns a handle. Options override style.json -> lottie:
   recolor ('none' | 'tint' | 'palette' | 'nearest' | { "#hex": colour }), colors, res (px, longest side),
   crop (true: trim the empty margin around what the animation actually draws), dir (default 'lottie'). */
function useLottie(name, opts = {}) {
  const d = STYLE.lottie;
  const spec = {
    name: String(name).replace(/\.json$/, ''),
    dir: opts.dir || 'lottie',
    recolor: opts.recolor || d.recolor,
    colors: opts.colors || d.colors || null,
    res: Math.round(opts.res || d.res),
    crop: !!opts.crop,
  };
  if (typeof spec.recolor === 'string' && !LOT_RECOLOR.includes(spec.recolor)) throw new Error(`useLottie('${name}'): recolor must be ${LOT_RECOLOR.join(', ')} or a { "#hex": colour } map`);
  if (spec.recolor === 'tint' && !spec.colors) spec.colors = ['ink'];
  if ((spec.recolor === 'palette' || spec.recolor === 'nearest') && !(spec.colors && spec.colors.length >= 2)) {
    throw new Error(`useLottie('${name}'): recolor '${spec.recolor}' needs colors: two or more palette roles or hex values`);
  }
  const handle = JSON.stringify(spec);
  if (!LOT_SPECS.has(handle)) {
    if (LOT_LOCKED) throw new Error(`useLottie('${name}') called after loading: declare Lottie files in the scene's setup code, not inside the draw function`);
    LOT_SPECS.set(handle, spec);
  }
  return handle;
}

/* ---------- recolouring (applied to the JSON before the player sees it) ---------- */
function lotHex(v) { const c = lotHexOrNull(v); if (!c) throw new Error(`Lottie recolour: "${v}" is not a palette role or #hex colour`); return c; }
function lotHexOrNull(v) { const c = COL[v] || v; return typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c) ? c : null; }
const lotRGB = (hex) => hexRGB(hex).map((x) => x / 255);
function lotLab(rgb) {
  const lin = rgb.map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  const X = (0.4124 * lin[0] + 0.3576 * lin[1] + 0.1805 * lin[2]) / 0.95047, Y = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  const Z = (0.0193 * lin[0] + 0.1192 * lin[1] + 0.9505 * lin[2]) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
const lotDist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function lotColorFn(spec) {
  const r = spec.recolor;
  if (r === 'none') return null;
  if (r === 'tint') { const c = lotRGB(lotHex(spec.colors[0])); return () => c; }
  if (r === 'palette') {                                   // light/dark ramp through 2-3 colours (print / duotone looks)
    const C = spec.colors.map((c) => lotRGB(lotHex(c)));
    return (rgb) => {
      const L = smooth(clamp(0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]));
      const [a, b, k] = C.length >= 3 ? (L < 0.5 ? [C[0], C[1], L * 2] : [C[1], C[2], (L - 0.5) * 2]) : [C[0], C[1], L];
      return [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * k);
    };
  }
  if (r === 'nearest') {                                   // each colour becomes the closest palette colour
    const C = spec.colors.map((c) => lotRGB(lotHex(c))), Lab = C.map(lotLab);
    return (rgb) => { const l = lotLab(rgb); let best = 0; for (let i = 1; i < C.length; i++) if (lotDist(l, Lab[i]) < lotDist(l, Lab[best])) best = i; return C[best]; };
  }
  /* { "#hex": colour }: colours close to a key (ΔE < 18) take its value, the rest stay */
  const keys = Object.keys(r).map((k) => [lotLab(lotRGB(lotHex(k))), lotRGB(lotHex(r[k]))]);
  return (rgb) => { const l = lotLab(rgb); for (const [kl, to] of keys) if (lotDist(l, kl) < 18) return to; return rgb; };
}
function lotRecolor(node, fn) {
  if (Array.isArray(node)) { for (const x of node) lotRecolor(x, fn); return; }
  if (!node || typeof node !== 'object') return;
  const rgba = (v) => (Array.isArray(v) && v.length >= 3 ? fn(v.slice(0, 3)).concat(v.slice(3)) : v);
  const prop = (p, f) => {
    if (!p || p.k == null) return;
    if (Array.isArray(p.k) && typeof p.k[0] === 'number') p.k = f(p.k);
    else if (Array.isArray(p.k)) for (const kf of p.k) { if (kf.s) kf.s = f(kf.s); if (kf.e) kf.e = f(kf.e); }
  };
  if ((node.ty === 'fl' || node.ty === 'st') && node.c) prop(node.c, rgba);
  if ((node.ty === 'gf' || node.ty === 'gs') && node.g && node.g.k) {
    const n = node.g.p;
    prop(node.g.k, (v) => { const o = v.slice(); for (let i = 0; i < n && i * 4 + 3 < o.length; i++) { const c = fn(o.slice(i * 4 + 1, i * 4 + 4)); o[i * 4 + 1] = c[0]; o[i * 4 + 2] = c[1]; o[i * 4 + 3] = c[2]; } return o; });
  }
  if (node.ty === 1 && typeof node.sc === 'string' && /^#[0-9a-fA-F]{6}$/.test(node.sc)) {
    node.sc = '#' + fn(lotRGB(node.sc)).map((x) => Math.round(clamp(x) * 255).toString(16).padStart(2, '0')).join('');
  }
  if (node.t && node.t.d && Array.isArray(node.t.d.k)) {
    for (const kf of node.t.d.k) if (kf.s) { if (Array.isArray(kf.s.fc)) kf.s.fc = rgba(kf.s.fc); if (Array.isArray(kf.s.sc)) kf.s.sc = rgba(kf.s.sc); }
  }
  for (const k in node) if (node[k] && typeof node[k] === 'object') lotRecolor(node[k], fn);
}

/* ---------- loading (once, before frame 0) ---------- */
async function loadOneLottie(spec) {
  if (!LOTTIE_PLAYER) throw new Error('the Lottie player (vendor/lottie_canvas.min.js) did not load');
  const url = `project/${spec.dir}/${encodeURIComponent(spec.name)}.json`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`no Lottie file ${spec.dir}/${spec.name}.json in this video — get one with: bin/lockstep lottie-search / lottie-get`);
  const json = await r.json();
  const fn = lotColorFn(spec);
  if (fn) lotRecolor(json, fn);
  const k = spec.res / Math.max(json.w, json.h);
  const canvas = makeCanvas(Math.max(2, Math.round(json.w * k)), Math.max(2, Math.round(json.h * k)));
  const anim = LOTTIE_PLAYER.loadAnimation({
    renderer: 'canvas', loop: false, autoplay: false, animationData: json,
    rendererSettings: { context: canvas.getContext('2d'), clearCanvas: true, preserveAspectRatio: 'xMidYMid meet' },
  });
  anim.setSubframe(true);
  await new Promise((res) => { if (anim.isLoaded) res(); else anim.addEventListener('DOMLoaded', res); });
  const images = (json.assets || []).filter((a) => a.p && !a.layers).length;
  if (images) {
    await new Promise((res, rej) => {
      const ok = () => anim.imagePreloader && anim.imagePreloader.loadedImages();
      if (ok()) return res();
      anim.addEventListener('loaded_images', res);
      setTimeout(() => (ok() ? res() : rej(new Error(`Lottie ${spec.name}: its ${images} embedded image(s) did not load`))), 15000);
    });
  }
  const markers = {};
  for (const m of json.markers || []) markers[m.cm] = { start: m.tm, dur: m.dr };
  /* the part of the canvas drawn on: the whole frame, or with crop the union of what 36 sampled frames draw */
  let box = { x: 0, y: 0, w: canvas.width, h: canvas.height };
  if (spec.crop) {
    const g = canvas.getContext('2d');
    let x0 = canvas.width, y0 = canvas.height, x1 = -1, y1 = -1;
    for (let i = 0; i < 36; i++) {
      anim.goToAndStop((json.op - json.ip - 0.001) * i / 35, true);
      const d = g.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let y = 0; y < canvas.height; y += 2) for (let x = 0; x < canvas.width; x += 2) {
        if (d[(y * canvas.width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
    }
    if (x1 >= 0) {
      const pad = Math.round(0.04 * Math.max(x1 - x0, y1 - y0)) + 2;
      x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(canvas.width, x1 + pad + 2); y1 = Math.min(canvas.height, y1 + pad + 2);
      box = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }
  }
  return { anim, canvas, box, ip: json.ip, op: json.op, fr: json.fr, w: json.w, h: json.h, markers, spec, maxDrawn: 0 };
}
async function loadLotties() {
  await Promise.all([...LOT_SPECS.entries()].map(async ([h, spec]) => { LOT.set(h, await loadOneLottie(spec)); }));
  LOT_LOCKED = true;
}

/* timing facts for a handle: { fr, ip, op, frames, duration (s), w, h, markers } */
function lottieInfo(h) {
  const L = LOT.get(h) || (() => { throw new Error('lottieInfo: unknown handle — declare it with useLottie() in the setup'); })();
  return { fr: L.fr, ip: L.ip, op: L.op, frames: L.op - L.ip, duration: (L.op - L.ip) / L.fr, w: L.w, h: L.h, markers: L.markers };
}
/* the frame a handle shows at time t with these timing options (to freeze it at a moment: { frame: lottieFrameAt(h, stop, opts) }) */
function lottieFrameAt(h, t, o = {}) {
  const L = LOT.get(h);
  if (!L) throw new Error('lottieFrameAt: unknown handle');
  return lottieFrame(L, t, o);
}
/* the animation frame shown at time t, or null when it should not be drawn */
function lottieFrame(L, t, o) {
  if (o.frame != null) return o.frame;
  let a = L.ip, b = L.op;
  if (o.segment) {
    const m = L.markers[o.segment];
    if (!m) throw new Error(`Lottie ${L.spec.name}: no marker "${o.segment}" (markers: ${Object.keys(L.markers).join(', ') || 'none'})`);
    a = m.start; b = m.start + Math.max(1, m.dur);
  }
  if (o.from != null) a = o.from;
  if (o.to != null) b = o.to;
  const len = Math.max(0.001, b - a), at = o.at || 0, speed = o.speed == null ? 1 : o.speed;
  let f = (t - at) * speed * L.fr + ((o.peak == null ? a : o.peak) - a);
  if (o.loop) return a + (((f % len) + len) % len);
  if (f < 0 && o.before === 'hide') return null;
  if (f > len && o.after === 'hide') return null;
  return a + clamp(f, 0, len - 0.001);
}

/* ---------- drawing ----------
   size: width in px of the animation's own frame — or of its content box with crop — (height follows).
   (x, y) is the centre, or with anchor 'bottom' the middle of the box's bottom edge.
   Timing: at (seconds; when the animation starts), speed, loop, peak (the frame that lands on `at`),
   segment (a marker name), from/to (frames), frame (explicit), before/after: 'hide'.
   Look: p (0..1 pop-in), alpha, rot (radians), flipX, squash (+ wide / − tall), dy.          */
function drawLottie(ctx, h, t, x, y, size, o = {}) {
  const L = LOT.get(h);
  if (!L) throw new Error('Lottie not loaded — declare it with useLottie() in the scene setup code');
  const { rot = 0, alpha = 1, flipX = false, squash = 0, anchor = 'center', p = 1, ease = E.outBack, dy = 0 } = o;
  if (alpha <= 0.003 || p <= 0 || size <= 0) return;
  const f = lottieFrame(L, t, o);
  if (f == null) return;
  L.anim.goToAndStop(f - L.ip, true);
  const pop = p >= 1 ? 1 : Math.max(0, ease(clamp(p)));
  const B = L.box, w = size, hh = size * B.h / B.w;
  L.maxDrawn = Math.max(L.maxDrawn, w * pop * (1 + 0.25 * Math.abs(squash)) * L.canvas.width / B.w);
  ctx.save();
  ctx.globalAlpha *= clamp(alpha) * (p < 1 ? clamp(p * 3) : 1);
  ctx.translate(x, y + dy);
  if (rot) ctx.rotate(rot);
  ctx.scale((flipX ? -1 : 1) * (1 + 0.25 * squash) * pop, (1 - 0.25 * squash) * pop);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(L.canvas, B.x, B.y, B.w, B.h, -w / 2, anchor === 'bottom' ? -hh : -hh / 2, w, hh);
  ctx.restore();
}

/* ---------- preview sheet: `lockstep lottie-sheet` / `lottie-search` ----------
   each file as a filmstrip of evenly spaced frames, in the video's look */
function setupLottieSheet(o) {
  DATA.words = []; DATA.takes = [];
  DATA.beats = [{ id: 'sheet', title: 'Lottie', t0: 0.5, t1: 1 }];
  DATA.meta = { duration: 2 }; DATA.dur = 2;
  CAPS = [];
  const hs = o.names.map((n) => useLottie(n, Object.assign(o.dir ? { dir: o.dir } : {}, o.crop ? { crop: true } : {})));
  addScene('sheet', (ctx) => drawLottieSheet(ctx, o, hs));
}
function drawLottieSheet(ctx, o, hs) {
  const n = hs.length, cols = Math.max(3, Math.min(8, o.frames || 6));
  const cw = 1000 / cols, rowH = Math.min(260, 1780 / Math.max(1, n));
  const size = Math.min(cw - 12, rowH - 44);
  for (let r = 0; r < n; r++) {
    const L = LOT.get(hs[r]), y0 = 70 + r * rowH;
    const label = `${o.labels && o.labels[r] ? o.labels[r] : L.spec.name} · ${((L.op - L.ip) / L.fr).toFixed(1)} s · ${Math.round(L.fr)} fps`;
    text(ctx, label, 40, y0 + 22, { size: 22, weight: 600, family: F.mono, color: COL.text, maxW: 1000 });
    for (let c = 0; c < cols; c++) {
      const frame = L.ip + (L.op - L.ip - 0.001) * c / (cols - 1);
      fillRR(ctx, 40 + c * cw + 3, y0 + 34, cw - 6, rowH - 40, 8, rgba(COL.ink, 0.04));
      drawLottie(ctx, hs[r], 0, 40 + (c + 0.5) * cw, y0 + 34 + (rowH - 40) / 2, size * Math.min(1, L.box.w / L.box.h), { frame });
    }
  }
}
