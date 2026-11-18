'use strict';
/* =====================================================================
   kit.js — drawing vocabulary beyond boxes and lines: icons, hand-drawn
   shapes, marker highlights, type that fits, motion for characters and
   speech bubbles.
   ===================================================================== */

/* ---------- icons (Lucide, ISC licence; names in assets/icons/names.txt) ----------
   icon(ctx, 'heart-pulse', cx, cy, size, color, { lw, p, alpha })
   lw is in icon units (the set is drawn on a 24-unit grid; 2 is its native weight),
   p draws the strokes on progressively.                                              */
const _iconCache = {};
function icon(ctx, name, cx, cy, size, color = COL.white, o = {}) {
  const d = ICONS[name];
  if (!d) throw new Error(`unknown icon "${name}" — see assets/icons/names.txt`);
  let ic = _iconCache[name];
  if (!ic) {
    ic = _iconCache[name] = { paths: d.map((x) => new Path2D(x)), len: d.map((x) => { const e = document.createElementNS('http://www.w3.org/2000/svg', 'path'); e.setAttribute('d', x); return e.getTotalLength(); }) };
  }
  const { lw = 2, p = 1, alpha = 1 } = o;
  if (alpha <= 0.003 || p <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  ctx.translate(cx - size / 2, cy - size / 2); ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let i = 0; i < ic.paths.length; i++) {
    if (p < 1) ctx.setLineDash([ic.len[i] * clamp(p), ic.len[i] + 1]);
    ctx.stroke(ic.paths[i]);
  }
  ctx.restore();
}

/* ---------- hand-drawn shapes ----------
   Deterministic wobble from a seed. For a "boiling" line, vary the seed a few times a
   second: seed + Math.floor(t * 6).                                                    */
function _roughPts(pts, wobble, seed) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.round(L / 46));
    for (let k = 0; k < n; k++) {
      const u = k / n, j = seed * 13.7 + i * 5.1 + k * 1.3;
      out.push([lerp(x0, x1, u) + (hash(j) - 0.5) * 2 * wobble, lerp(y0, y1, u) + (hash(j + 0.5) - 0.5) * 2 * wobble]);
    }
  }
  const e = pts[pts.length - 1]; out.push([e[0] + (hash(seed * 3.3) - 0.5) * wobble, e[1] + (hash(seed * 4.4) - 0.5) * wobble]);
  return out;
}
function _smoothPath(ctx, p) {
  ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]);
  for (let i = 1; i < p.length - 1; i++) ctx.quadraticCurveTo(p[i][0], p[i][1], (p[i][0] + p[i + 1][0]) / 2, (p[i][1] + p[i + 1][1]) / 2);
  ctx.lineTo(p[p.length - 1][0], p[p.length - 1][1]);
}
function roughLine(ctx, pts, color, lw = 5, o = {}) {
  const { seed = 1, wobble = 4, p = 1, alpha = 1 } = o;
  if (alpha <= 0.003 || p <= 0) return;
  const q = _roughPts(pts, wobble, seed), L = polyLen(q);
  ctx.save(); ctx.globalAlpha *= clamp(alpha);
  _smoothPath(ctx, q);
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (p < 1) ctx.setLineDash([L * clamp(p) * 1.02, L * 2]);
  ctx.stroke(); ctx.restore();
}
function roughRect(ctx, x, y, w, h, color, lw = 5, o = {}) {
  const k = o.overshoot == null ? 8 : o.overshoot;
  if (o.fill) { ctx.save(); ctx.globalAlpha *= clamp(o.alpha == null ? 1 : o.alpha); _smoothPath(ctx, _roughPts([[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], (o.wobble || 4) * 0.6, (o.seed || 1) + 9)); ctx.fillStyle = o.fill; ctx.fill(); ctx.restore(); }
  roughLine(ctx, [[x - k, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y - k]], color, lw, o);
}
function roughCircle(ctx, cx, cy, r, color, lw = 5, o = {}) {
  const pts = [], n = 14, s = o.seed || 1;
  for (let i = 0; i <= n + 1; i++) { const a = -1.2 + i * TAU / n, rr2 = r * (1 + (hash(s * 2.1 + i) - 0.5) * 0.07); pts.push([cx + rr2 * Math.cos(a), cy + rr2 * Math.sin(a)]); }
  roughLine(ctx, pts, color, lw, Object.assign({ wobble: 1.5 }, o));
}
/* marker swipe behind a word or a line of text; p draws it left to right */
function highlighter(ctx, x, y, w, h, color, p = 1, alpha = 0.55) {
  if (p <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha;
  if (STYLE.mode === 'light') ctx.globalCompositeOperation = 'multiply';
  ctx.beginPath();
  const ww = w * clamp(p);
  ctx.moveTo(x - 6, y + h * 0.12); ctx.lineTo(x + ww + 4, y); ctx.lineTo(x + ww + 8, y + h * 0.9); ctx.lineTo(x - 2, y + h); ctx.closePath();
  ctx.fillStyle = color; ctx.fill(); ctx.restore();
}

/* ---------- type that fits ---------- */
/* largest size (<= max) at which str fits in maxW */
function fitSize(ctx, str, maxW, max = 240, weight = 900, family = F.disp, ls = 0) {
  const w = measure(ctx, str, 100, weight, family, ls * 100 / max);
  return Math.min(max, Math.floor(100 * maxW / Math.max(1, w)));
}
/* one big word or short phrase, scaled to the width, popping in with progress p (kinetic type) */
function bigWord(ctx, str, cx, cy, p, o = {}) {
  if (p <= 0) return;
  const { maxW = 900, max = 260, weight = 900, family = F.disp, color = COL.white, ease = E.outBack, alpha = 1 } = o;
  const size = fitSize(ctx, str, maxW, max, weight, family), e = ease(clamp(p));
  ctx.save(); ctx.translate(cx, cy); ctx.scale(lerp(0.72, 1, e), lerp(0.72, 1, e));
  text(ctx, str, 0, size * 0.35, { size, weight, family, color, align: 'center', alpha: alpha * clamp(p * 2.5), ls: -size * 0.012 });
  ctx.restore();
  return size;
}

/* ---------- motion for characters and objects (pure functions of time) ----------
   Use with anything that acts: a cut-out person (cutout()), an icon, a shape from components.js. */
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
/* a jump starting at t0: crouch, stretch in the air, squash on landing. Returns { dy, squash }:
   offset y by dy, and scale x by (1 + 0.25 * squash), y by (1 - 0.25 * squash) about the feet
    */
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
