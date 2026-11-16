'use strict';
/* =====================================================================
   art.js — illustrations: Microsoft Fluent Emoji (MIT) in three sets,
   1,595 subjects (people with five skin tones, faces, animals, food,
   objects, places, symbols). See assets/illustrations/README.md.

   In a scene's SETUP code (not inside the draw function):
     const bee  = art('honeybee');                                 // the style's default set and treatment
     const chef = art('cook', { tone: 'medium-dark' });           // a skin tone for people
     const bulb = art('light-bulb', { set: 'line', treat: 'tint', colors: ['subject'] });
     const hero = art('rocket', { res: 900 });                     // drawn larger than 600 px somewhere
   In the draw function:
     drawArt(ctx, bee, x, y, 220, { rot, flipX, squash, anchor: 'bottom', p, alpha });

   Every illustration is fetched, rasterised and treated once, before the
   first frame, so frames stay pure functions of time.
   ===================================================================== */

const ART_SPECS = new Map();      // handle -> resolved spec
const ART_IMG = new Map();        // handle -> { canvas, res, pad, spec, maxDrawn }
const ART_SETS = ['color', 'flat', 'line'];
const ART_TREATS = ['none', 'tint', 'duotone'];
const SKIN_TONES = ['light', 'medium-light', 'medium', 'medium-dark', 'dark'];
let ART_LOCKED = false;

const artColor = (v, fallback) => (v == null ? fallback : (COL[v] || v));

/* Declare an illustration; returns a handle for drawArt(). Options override the style's
   defaults (style.json -> illustrations): set, tone, treat, colors, sticker, stickerColor,
   shadow, res. */
function art(name, opts = {}) {
  const d = STYLE.illustrations;
  const spec = {
    name: String(name),
    set: opts.set || d.set,
    tone: opts.tone || null,
    treat: opts.treat || d.treat,
    colors: opts.colors || d.colors || null,
    sticker: opts.sticker != null ? opts.sticker : d.sticker,
    stickerColor: opts.stickerColor || d.stickerColor,
    shadow: opts.shadow !== undefined ? opts.shadow : d.shadow,
    res: Math.round(opts.res || d.res),
  };
  if (!ART_SETS.includes(spec.set)) throw new Error(`art('${name}'): unknown set "${spec.set}" — choose ${ART_SETS.join(', ')}`);
  if (!ART_TREATS.includes(spec.treat)) throw new Error(`art('${name}'): unknown treat "${spec.treat}" — choose ${ART_TREATS.join(', ')}`);
  if (spec.tone && !SKIN_TONES.includes(spec.tone)) throw new Error(`art('${name}'): tone must be one of ${SKIN_TONES.join(', ')}`);
  if (spec.set === 'line') spec.tone = null;                       // the line set is single-colour
  if (spec.treat === 'tint' && !spec.colors) spec.colors = ['ink'];
  if (spec.treat === 'duotone' && !(spec.colors && spec.colors.length >= 2)) throw new Error(`art('${name}'): duotone needs colors: [dark, light] (or three)`);
  const handle = JSON.stringify(spec);
  if (!ART_SPECS.has(handle)) {
    if (ART_LOCKED) throw new Error(`art('${name}') called after loading: declare illustrations in the scene's setup code, not inside the draw function`);
    ART_SPECS.set(handle, spec);
  }
  return handle;
}

/* ---------- rasterising and treatments (once, at boot) ---------- */
function artTint(cv, color) {
  const g = cv.getContext('2d');
  g.save(); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, cv.width, cv.height); g.restore();
  return cv;
}
function artCopy(cv) { const c = makeCanvas(cv.width, cv.height); c.getContext('2d').drawImage(cv, 0, 0); return c; }
function artDuotone(cv, cols) {
  const g = cv.getContext('2d'), id = g.getImageData(0, 0, cv.width, cv.height), d = id.data;
  const C = cols.map((c) => hexRGB(c));
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const L = smooth(clamp((0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255 * 1.08 - 0.04));
    let a, b, k;
    if (C.length >= 3) { if (L < 0.5) { a = C[0]; b = C[1]; k = L * 2; } else { a = C[1]; b = C[2]; k = (L - 0.5) * 2; } }
    else { a = C[0]; b = C[1]; k = L; }
    d[i] = a[0] + (b[0] - a[0]) * k; d[i + 1] = a[1] + (b[1] - a[1]) * k; d[i + 2] = a[2] + (b[2] - a[2]) * k;
  }
  g.putImageData(id, 0, 0);
  return cv;
}
/* grow a single-colour silhouette outward by about r px (blur, then threshold the alpha) */
function artDilate(sil, r, color) {
  const c = makeCanvas(sil.width, sil.height), g = c.getContext('2d');
  g.filter = `blur(${(r * 0.75).toFixed(2)}px)`;
  g.drawImage(sil, 0, 0);
  g.filter = 'none';
  const id = g.getImageData(0, 0, c.width, c.height), d = id.data;
  for (let i = 3; i < d.length; i += 4) d[i] = Math.round(255 * clamp((d[i] / 255 - 0.035) / 0.1));
  g.putImageData(id, 0, 0);
  return artTint(c, color);
}

async function rasterArt(spec) {
  const name = spec.tone ? `${spec.name}-${spec.tone}` : spec.name;
  let r = await fetch(`assets/illustrations/${spec.set}/${encodeURIComponent(name)}.svg`);
  const toned = /-(medium-light|medium-dark|light|medium|dark)$/.exec(name);
  if (!r.ok && spec.set === 'line' && toned) {                      // the line set is single-colour: no skin tones
    r = await fetch(`assets/illustrations/line/${encodeURIComponent(name.slice(0, toned.index))}.svg`);
  }
  if (!r.ok) {
    const hint = spec.tone ? ` (does "${spec.name}" have skin tones? the index lists them)` : '';
    throw new Error(`unknown illustration "${name}" in the ${spec.set} set${hint} — search with: bin/lockstep art <word>`);
  }
  const res = spec.res, sh = spec.shadow;
  const svg = (await r.text()).replace('<svg ', `<svg width="${res}" height="${res}" `);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  const img = new Image();
  img.src = url;
  await img.decode();
  URL.revokeObjectURL(url);
  const reach = (spec.sticker || 0) + (sh ? Math.max(Math.abs(sh.dx || 0), Math.abs(sh.dy || 0)) + 2 * (sh.blur || 0) : 0);
  const pad = Math.ceil(res * (reach + 0.02)), size = res + 2 * pad;
  let cv = makeCanvas(size, size);
  cv.getContext('2d').drawImage(img, pad, pad, res, res);
  if (spec.treat === 'tint') artTint(cv, artColor(spec.colors[0], COL.ink));
  else if (spec.treat === 'duotone') artDuotone(cv, spec.colors.map((c) => artColor(c)));
  if (spec.sticker > 0) {                                           // die-cut sticker border
    const border = artDilate(artTint(artCopy(cv), '#000'), spec.sticker * res, artColor(spec.stickerColor, '#FFFFFF'));
    border.getContext('2d').drawImage(cv, 0, 0);
    cv = border;
  }
  if (sh) {                                                         // drop shadow, hard or soft
    const out = makeCanvas(size, size), g = out.getContext('2d');
    const shadow = artTint(artCopy(cv), artColor(sh.color, COL.ink));
    g.save();
    g.globalAlpha = sh.alpha == null ? 0.25 : sh.alpha;
    if (sh.blur) g.filter = `blur(${(sh.blur * res).toFixed(2)}px)`;
    g.drawImage(shadow, (sh.dx || 0) * res, (sh.dy || 0) * res);
    g.restore();
    g.drawImage(cv, 0, 0);
    cv = out;
  }
  return { canvas: cv, res, pad, spec, maxDrawn: 0 };
}

async function loadArt() {
  const jobs = [...ART_SPECS.entries()].map(async ([h, spec]) => { ART_IMG.set(h, await rasterArt(spec)); });
  await Promise.all(jobs);
  ART_LOCKED = true;
}

/* ---------- drawing ----------
   (x, y) is the centre of the illustration, or with anchor 'bottom' the middle of its base
   (feet on the ground; squash and rotation then pivot there).
   size: width in px of the illustration itself (border and shadow extend beyond it).
   p: 0..1 pop-in (scale with overshoot + fade), rot: radians, flipX: mirror,
   squash: + squashed wide, − stretched tall (about ±1 is the useful range).          */
function drawArt(ctx, h, x, y, size, o = {}) {
  const A = ART_IMG.get(h);
  if (!A) throw new Error('illustration not loaded — declare it with art() in the scene setup code');
  const { rot = 0, alpha = 1, flipX = false, squash = 0, anchor = 'center', p = 1, ease = E.outBack } = o;
  if (alpha <= 0.003 || p <= 0 || size <= 0) return;
  const pop = p >= 1 ? 1 : Math.max(0, ease(clamp(p)));
  const k = size / A.res, full = A.canvas.width * k;
  A.maxDrawn = Math.max(A.maxDrawn, size * pop * (1 + 0.25 * Math.abs(squash)));
  ctx.save();
  ctx.globalAlpha *= clamp(alpha) * (p < 1 ? clamp(p * 3) : 1);
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale((flipX ? -1 : 1) * (1 + 0.25 * squash) * pop, (1 - 0.25 * squash) * pop);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(A.canvas, -full / 2, anchor === 'bottom' ? -(A.pad + A.res) * k : -full / 2, full, full);
  ctx.restore();
}

/* ---------- motion for characters and objects (pure functions of time) ---------- */
/* walking / trotting bounce: a y offset (≤ 0); speed = steps per second */
const bob = (t, o = {}) => -(o.amp == null ? 12 : o.amp) * Math.abs(Math.sin(Math.PI * (o.speed == null ? 2 : o.speed) * t + (o.phase || 0)));
/* gentle side-to-side lean: rotation in radians */
const sway = (t, o = {}) => (o.amp == null ? 0.06 : o.amp) * Math.sin(TAU * (o.speed == null ? 0.5 : o.speed) * t + (o.phase || 0));
/* idle breathing: a scale multiplier around 1 */
const breathe = (t, o = {}) => 1 + (o.amp == null ? 0.025 : o.amp) * Math.sin(TAU * (o.speed == null ? 0.4 : o.speed) * t + (o.phase || 0));
/* excited shake between from and until: rotation in radians */
function wiggle(t, o = {}) {
  const { from = -Infinity, until = Infinity, amp = 0.12, speed = 9 } = o;
  if (t < from || t > until) return 0;
  const env = Math.min(1, (t - from) / 0.08, (until - t) / 0.12);
  return amp * env * Math.sin(TAU * speed * t);
}
/* a jump starting at t0: crouch, stretch in the air, squash on landing. Returns { dy, squash }
   to pass straight into drawArt: drawArt(ctx, h, x, ground + j.dy, s, { anchor: 'bottom', squash: j.squash }) */
function hop(t, t0, o = {}) {
  const { height = 140, dur = 0.42 } = o;
  if (t < t0 - 0.08) return { dy: 0, squash: 0 };
  if (t < t0) return { dy: 0, squash: 0.6 * prog(t, t0 - 0.08, t0) };
  if (t < t0 + dur) { const u = (t - t0) / dur; return { dy: -height * 4 * u * (1 - u), squash: -0.45 * Math.sin(Math.PI * u) * (1 - u) }; }
  const l = t - t0 - dur;
  return { dy: 0, squash: 0.55 * Math.exp(-l / 0.07) * Math.cos(l * 40) };
}

/* ---------- speech and thought bubbles ----------
   body centred at (x, y), w × h; the tail points at (tx, ty). Optional text inside. */
function bubble(ctx, x, y, w, h, tx, ty, o = {}) {
  const { p = 1, alpha = 1, fill = COL.panel, stroke = COL.ink, lw = 4, r = Math.min(30, h / 2), think = false,
    text: str = null, size = 40, weight = 700, family = F.ui, color = COL.ink } = o;
  if (p <= 0 || alpha <= 0.003) return;
  const e = Math.max(0, E.outBack(clamp(p)));
  ctx.save();
  ctx.globalAlpha *= clamp(alpha) * clamp(p * 3);
  ctx.translate(tx, ty); ctx.scale(e, e); ctx.translate(-tx, -ty);       // grows out of the speaker
  const x0 = x - w / 2, y0 = y - h / 2, R = think ? h / 2 : r;
  const parts = [];
  if (think) {
    for (let i = 1; i <= 3; i++) {
      const u = 0.25 + i * 0.2, cr = Math.max(5, h * (0.055 + 0.035 * (3 - i)));
      parts.push((c) => { c.moveTo(lerp(tx, x, u) + cr, lerp(ty, y, u)); c.arc(lerp(tx, x, u), lerp(ty, y, u), cr, 0, TAU); });
    }
  } else {
    /* tail: a triangle from the side facing the speaker */
    const dx = tx - x, dy = ty - y, vert = Math.abs(dy) * w > Math.abs(dx) * h;
    const bw = Math.min(w, h) * 0.32;
    if (vert) {
      const sy = dy > 0 ? y0 + h - 2 : y0 + 2, bx = clamp(lerp(x, tx, 0.35), x0 + R + bw / 2, x0 + w - R - bw / 2);
      parts.push((c) => { c.moveTo(bx - bw / 2, sy); c.lineTo(tx, ty); c.lineTo(bx + bw / 2, sy); c.closePath(); });
    } else {
      const sx = dx > 0 ? x0 + w - 2 : x0 + 2, by = clamp(lerp(y, ty, 0.35), y0 + R + bw / 2, y0 + h - R - bw / 2);
      parts.push((c) => { c.moveTo(sx, by - bw / 2); c.lineTo(tx, ty); c.lineTo(sx, by + bw / 2); c.closePath(); });
    }
  }
  parts.push((c) => { rr(c, x0, y0, w, h, R); });
  /* strokes first at double width, fills on top: only the outline of the union remains */
  ctx.lineJoin = 'round'; ctx.strokeStyle = stroke; ctx.lineWidth = lw * 2; ctx.fillStyle = fill;
  for (const f of parts) { ctx.beginPath(); f(ctx); ctx.stroke(); }
  for (const f of parts) { ctx.beginPath(); f(ctx); ctx.fill(); }
  ctx.restore();
  if (str) {
    ctx.save(); ctx.globalAlpha *= clamp(alpha) * clamp(p * 2 - 0.4);
    ctx.translate(tx, ty); ctx.scale(e, e); ctx.translate(-tx, -ty);
    const sz = Math.min(size, fitSize(ctx, str, w - 44, size, weight, family));
    text(ctx, str, x, y + sz * 0.35, { size: sz, weight, family, color, align: 'center' });
    ctx.restore();
  }
}
