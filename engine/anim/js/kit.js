'use strict';
/* =====================================================================
   kit.js — optional drawing vocabulary beyond boxes and lines:
   icons, hand-drawn shapes, marker highlights, type that fits, and the
   style tile used to judge a look before any scene exists.
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

/* ---------- style tile ----------
   `lockstep tile <video>` renders this: palette roles, type, panel, icons, a caption
   and the backdrop, as they will look in the video.                                   */
function setupTile() {
  const ws = ['Captions', 'look', 'like', 'this,', 'word', 'by', 'word'], cls = [null, null, null, null, 'k', null, 'n'];
  DATA.words = ws.map((w, i) => ({ w, t0: 0.6 + i * 0.3, t1: 0.86 + i * 0.3, beat: 'tile', take: 0, cls: cls[i] }));
  DATA.takes = [{ take: 0, beat: 'tile', text: ws.join(' '), t0: 0.6, t1: 2.7, pause_after: 0.5 }];
  DATA.beats = [{ id: 'tile', title: 'Style tile', t0: 0.6, t1: 2.7 }];
  DATA.meta = { duration: 4 }; DATA.dur = 4;
  CAPS = buildCaptions(DATA.words, ['Captions look', 'like this,', 'word by word']);
  const people = STYLE.illustrations.set === 'line' ? {} : { tone: 'medium-dark' };
  const arts = [art('honeybee'), art('woman-scientist', people), art('rocket')];
  addScene('tile', (ctx, t) => drawTile(ctx, t, arts));
}
function drawTile(ctx, t, arts) {
  const roles = ['subject', 'accent', 'data', 'alert', 'good'];
  tag(ctx, 'STYLE · ' + STYLE.name.toUpperCase() + (STYLE.mode === 'light' ? ' · LIGHT' : ''), CX, 400, { align: 'center' });
  const title = VIDEO.title && !/__/.test(VIDEO.title) && VIDEO.title !== 'Style preview' ? VIDEO.title : 'Headline';
  bigWord(ctx, title, CX, 478, 1, { maxW: 880, max: 140 });
  text(ctx, 'Body text explains one thing in a short line.', CX, 598, { size: 36, weight: 500, color: COL.text, align: 'center' });
  for (let i = 0; i < roles.length; i++) {
    const x = CX + (i - 2) * 178, c = COL[roles[i]];
    glow(ctx, x, 690, 110, c, 0.3); dot(ctx, x, 690, 46, c);
    tag(ctx, roles[i].toUpperCase(), x, 770, { align: 'center', size: 21 });
  }
  panel(ctx, 110, 815, 860, 225, { accent: COL.subject, accentA: 0.8 });
  pill(ctx, 'LABEL', 220, 868, { bg: COL.subject });
  pill(ctx, '21,760', 400, 868, { bg: COL.accent });
  text(ctx, 'Panel title', 150, 950, { size: 52, weight: 800, family: F.disp });
  text(ctx, 'secondary text · dim', 150, 995, { size: 29, weight: 500, color: COL.dim });
  const pts = []; for (let i = 0; i <= 18; i++) pts.push([580 + i * 18, 925 - 40 * Math.sin(i * 0.6 + t * 2) * (0.5 + 0.5 * hash(i))]);
  polyline(ctx, pts, COL.subject, 5);
  roughCircle(ctx, 900, 868, 30, COL.alert, 5, { seed: 3 });
  const names = ['lightbulb', 'heart', 'zap', 'globe'].filter((n) => ICONS[n]);
  names.forEach((n, i) => icon(ctx, n, 640 + i * 84, 1000, 50, [COL.accent, COL.alert, COL.good, COL.data][i]));
  arts.forEach((h, i) => drawArt(ctx, h, CX + (i - 1) * 230, 1150, 150));
}

/* ---------- art sheet ----------
   `lockstep art-sheet <video> <names>`: the illustrations as this video's style will draw them. */
function setupArtSheet(names) {
  DATA.words = []; DATA.takes = [];
  DATA.beats = [{ id: 'sheet', title: 'Illustrations', t0: 0.5, t1: 1 }];
  DATA.meta = { duration: 2 }; DATA.dur = 2;
  CAPS = [];
  const set = window.ARTSHEET_SET || undefined;
  const hs = names.map((n) => art(n, set ? { set } : {}));
  addScene('sheet', (ctx) => drawArtSheet(ctx, names, hs));
}
function drawArtSheet(ctx, names, hs) {
  const n = hs.length, cols = n <= 4 ? 2 : n <= 9 ? 3 : 4, rows = Math.ceil(n / cols);
  const cw = 940 / cols, ch = Math.min(cw * 1.2, 1560 / rows), size = Math.min(cw, ch) * 0.62;
  const spec = ART_SPECS.get(hs[0]);
  tag(ctx, `${spec.set.toUpperCase()} SET · ${spec.treat === 'none' ? 'AS DRAWN' : spec.treat.toUpperCase()}${spec.sticker ? ' · STICKER' : ''}${spec.shadow ? ' · SHADOW' : ''} · STYLE ${STYLE.name.toUpperCase()}`,
    CX, 150, { align: 'center' });
  for (let i = 0; i < n; i++) {
    const x = 70 + cw * ((i % cols) + 0.5), y = 210 + ch * Math.floor(i / cols) + ch * 0.45;
    drawArt(ctx, hs[i], x, y, size);
    text(ctx, names[i], x, y + size * 0.5 + 44, { size: 22, weight: 600, family: F.mono, color: COL.text, align: 'center', maxW: cw - 14 });
  }
}
