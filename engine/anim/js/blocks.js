'use strict';
/* =====================================================================
   blocks.js — ready-made explainer blocks that take on the video's look:
   charts, numbers, comparisons, lists, timelines, quotes, pointers, flows.

   `lockstep catalog <video>` draws every block in the video's look
   (out/catalog.jpg); `lockstep catalog <video> barChart …` draws a block's
   build-in as a strip. reference/blocks.md lists them with examples.

   Every block
     - is a pure function of its arguments, like everything a scene draws;
     - builds in with o.p from 0 to 1: key it to the words that introduce it,
         barChart(ctx, 130, 430, 820, 620, bars, { p: tw(t, c.bars, c.bars + 1.4, E.lin) })
     - takes colour roles ('subject', 'accent', 'data', 'good', 'alert', 'ink'),
       never values; series take subject, accent, data, good, alert in turn;
     - draws its cards and lines in the look's own shape language: corner radius,
       outline and hard or soft shadow from style.json "shape", and hand-drawn
       outlines when the look sets "shape": { "line": "rough" };
     - keeps its text at 24 px or more, and returns its geometry, so a scene can
       hang a label, an arrow or a camera move on any part of it.
   ===================================================================== */

const SERIES = ['subject', 'accent', 'data', 'good', 'alert'];

/* ---------- helpers (numText, stagger and blockCard are useful in scenes too) ---------- */
const _bCol = (c, fallback) => (c == null ? fallback : COL[c] || c);
const _bSeries = (i, o) => { const l = (o && o.colors) || SERIES; return _bCol(l[i % l.length]); };
const _bRough = (o) => (o && o.rough != null ? !!o.rough : STYLE.shape.line === 'rough');
const _bP = (o) => (o.p == null ? 1 : clamp(o.p));

/* the share of a group's build-in that belongs to item i of n: items start one after another
   and overlap (spread 0: all together; towards 1: strictly one after another) */
function stagger(p, i, n, spread = 0.55) {
  if (n <= 1) return clamp(p);
  return clamp((p - (spread * i) / (n - 1)) / (1 - spread));
}
/* a number as text: thousands separators, prefix and suffix; decimals from o.decimals, else
   from the final value o.of (so a count-up to 3.5 shows 0.0, 0.1 … 3.5) */
function numText(v, o = {}) {
  const ref = o.of == null ? v : o.of;
  const d = o.decimals != null ? o.decimals : Math.abs(ref % 1) > 1e-9 ? Math.min(2, (String(ref).split('.')[1] || '').length) : 0;
  return (o.prefix || '') + Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) + (o.suffix || '');
}
/* a card in the look's shape language: radius, outline, shadow — or hand-drawn */
function blockCard(ctx, x, y, w, h, o = {}) {
  const S = STYLE.shape, a = o.alpha == null ? 1 : o.alpha;
  if (a <= 0.003 || w <= 0 || h <= 0) return;
  ctx.save(); ctx.globalAlpha *= clamp(a);
  if (_bRough(o)) {
    const lw = Math.max(3, S.stroke || 3), seed = o.seed || 1, fill = o.fill || rgba(COL.panel, S.panelAlpha == null ? 0.9 : S.panelAlpha);
    if (S.shadow && (S.shadow.dx || S.shadow.dy)) {
      const sc = _bCol(S.shadow.color, rgba(COL.white, 0.9));
      roughRect(ctx, x + (S.shadow.dx || 0), y + (S.shadow.dy || 0), w, h, sc, 1, { fill: sc, seed: seed + 2, wobble: 3, overshoot: 0 });
    }
    roughRect(ctx, x, y, w, h, o.accent || rgba(COL.white, 0.8), o.accent ? lw + 1.5 : lw, { fill, seed, wobble: 3, overshoot: 7 });
  } else {
    panel(ctx, x, y, w, h, { r: o.r, fill: o.fill, accent: o.accent || null, accentA: 0.95 });
  }
  ctx.restore();
}
/* a line in the look's language: crisp, or hand-drawn */
function _bPath(ctx, pts, color, lw, p = 1, o = {}) {
  if (p <= 0) return;
  if (_bRough(o)) roughLine(ctx, pts, color, lw, { p, seed: o.seed || 3, wobble: o.wobble || 2.5, alpha: o.alpha == null ? 1 : o.alpha });
  else polyline(ctx, pts, color, lw, p, o.alpha == null ? 1 : o.alpha);
}
/* the largest size (≤ size, ≥ min) at which str fits maxW */
function _bFit(ctx, str, maxW, size, weight = 600, family = F.ui, min = 24) {
  const w = measure(ctx, str, size, weight, family);
  return w <= maxW ? size : Math.max(min, Math.floor((size * maxW) / w));
}
/* words broken into lines no wider than maxW */
function _bWrap(ctx, str, maxW, size, weight = 600, family = F.ui) {
  const lines = []; let cur = '';
  for (const w of String(str).split(/\s+/).filter(Boolean)) {
    const next = cur ? cur + ' ' + w : w;
    if (cur && measure(ctx, next, size, weight, family) > maxW) { lines.push(cur); cur = w; } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}
/* a rectangle with its top corners rounded (a bar standing on a baseline) */
function _bTopRound(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h));
  ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h); ctx.closePath();
}
/* the first d pixels of a polyline */
function _bCut(pts, d) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (d <= seg) { const k = seg ? d / seg : 0; out.push([lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]); return out; }
    out.push(pts[i]); d -= seg;
  }
  return out;
}
/* a small solid triangle centred on (x, y), its tip pointing along angle ang (0 right, -π/2 up) */
function _bTri(ctx, x, y, s, ang, color, alpha = 1) {
  if (alpha <= 0.003) return;
  const c = Math.cos(ang), d = Math.sin(ang), pt = (u, v) => [x + u * c - v * d, y + u * d + v * c];
  ctx.save(); ctx.globalAlpha *= clamp(alpha); ctx.beginPath();
  const a = pt(s * 0.6, 0), b = pt(-s * 0.45, s * 0.62), e = pt(-s * 0.45, -s * 0.62);
  ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(e[0], e[1]); ctx.closePath();
  ctx.fillStyle = color; ctx.fill(); ctx.restore();
}

/* ---------- charts ---------- */

/* Vertical bars that grow one after another; values count up above them; labels below.
   bars: [{ label, value, color }] or plain numbers. o: p, hi (the index singled out), max,
   prefix / suffix / decimals, color (role of the bars), labelSize, valueSize, gap.
   Returns each bar's box { x, y, w, h, cx }. */
function barChart(ctx, x, y, w, h, bars, o = {}) {
  const items = bars.map((b) => (typeof b === 'number' ? { value: b } : b)), n = items.length;
  const p = _bP(o), hi = o.hi == null ? -1 : o.hi;
  const max = o.max || Math.max(...items.map((b) => b.value), 1e-9);
  const ls = o.labelSize || 30, vs = o.valueSize || 40;
  const base = y + h - ls * 1.9, top = y + vs * 1.5;
  const gap = o.gap == null ? 0.34 : o.gap, bw = w / (n + (n - 1) * gap), step = bw * (1 + gap);
  const r = Math.min(STYLE.shape.radius, bw * 0.22), rough = _bRough(o);
  _bPath(ctx, [[x - 14, base], [x + w + 14, base]], rgba(COL.ink, 0.55), Math.max(3, STYLE.shape.stroke || 3), E.out3(clamp(p * 4)), { seed: 11 });
  const out = [];
  for (let i = 0; i < n; i++) {
    const b = items[i], k = stagger(p, i, n), e = E.out3(k), bx = x + i * step;
    const bh = Math.max(0, (base - top) * (b.value / max) * e), focus = hi < 0 || i === hi;
    const col = _bCol(b.color, i === hi ? COL.accent : _bCol(o.color, COL.subject));
    const a = clamp(k * 4) * (focus ? 1 : 0.42);
    if (i === hi && bh > 0) glow(ctx, bx + bw / 2, base - bh * 0.5, Math.max(bw, bh) * 0.7, col, 0.26 * e);
    if (bh > 0.5 && a > 0.003) {
      ctx.save(); ctx.globalAlpha *= a;
      if (rough) roughRect(ctx, bx, base - bh, bw, bh, col, 3.5, { fill: rgba(col, 0.8), seed: 20 + i, wobble: 2.5, overshoot: 4 });
      else { _bTopRound(ctx, bx, base - bh, bw, bh, r); ctx.fillStyle = col; ctx.fill(); }
      ctx.restore();
    }
    const fin = numText(b.value, Object.assign({}, o, { of: b.value }));
    if (k > 0.02) {
      text(ctx, numText(b.value * e, Object.assign({}, o, { of: b.value })), bx + bw / 2, base - bh - vs * 0.42, {
        size: _bFit(ctx, fin, step * 0.98, vs, 800, F.disp), weight: 800, family: F.disp,
        color: i === hi ? COL.accent : COL.ink, align: 'center', alpha: clamp(k * 3) * (focus ? 1 : 0.6) });
    }
    if (b.label) {
      text(ctx, b.label, bx + bw / 2, base + ls * 1.3, { size: _bFit(ctx, b.label, step * 0.96, ls), weight: 600,
        color: focus ? COL.text : COL.dim, align: 'center', alpha: clamp(p * 3) });
    }
    out.push({ x: bx, y: base - bh, w: bw, h: bh, cx: bx + bw / 2 });
  }
  return out;
}

/* Horizontal bars, one row per item: a ranking or a top-N list. Label above each bar, the
   value at its end. items: [{ label, value, color }]. o: p, hi, max, rank (numbers 1, 2, 3 …),
   sort (largest first), rowH, barH, prefix / suffix / decimals, color.
   Returns each bar's box { x, y, w, h, cy }. */
function rankBars(ctx, x, y, w, items, o = {}) {
  const list = o.sort ? [...items].sort((a, b) => b.value - a.value) : items, n = list.length;
  const p = _bP(o), hi = o.hi == null ? -1 : o.hi, rough = _bRough(o);
  const max = o.max || Math.max(...list.map((d) => d.value), 1e-9);
  const rowH = o.rowH || 122, ls = o.labelSize || 32, vs = o.valueSize || 36, bh = o.barH || 34;
  const rw = o.rank ? 70 : 0;
  const vw = Math.max(...list.map((d) => measure(ctx, numText(d.value, Object.assign({}, o, { of: d.value })), vs, 800, F.disp))) + 24;
  const L = w - rw - vw, out = [];
  for (let i = 0; i < n; i++) {
    const d = list[i], k = stagger(p, i, n, 0.5), e = E.out3(k), ry = y + i * rowH;
    const focus = hi < 0 || i === hi, col = _bCol(d.color, i === hi ? COL.accent : _bCol(o.color, COL.subject));
    const a = clamp(k * 3) * (focus ? 1 : 0.5), by = ry + ls * 1.4, len = Math.max(bh * 0.9, L * (d.value / max) * e);
    if (a <= 0.003) { out.push({ x: x + rw, y: by, w: 0, h: bh, cy: by + bh / 2 }); continue; }
    if (o.rank) text(ctx, String(i + 1), x, by + bh / 2 + 17, { size: 48, weight: 800, family: F.disp, color: i === hi ? COL.accent : COL.dim, alpha: a });
    text(ctx, d.label, x + rw, ry + ls * 0.95, { size: _bFit(ctx, d.label, L, ls), weight: 600, color: COL.text, alpha: a });
    ctx.save(); ctx.globalAlpha *= a;
    if (rough) roughRect(ctx, x + rw, by, len, bh, col, 3, { fill: rgba(col, 0.8), seed: 40 + i, wobble: 2, overshoot: 3 });
    else { fillRR(ctx, x + rw, by, L, bh, bh / 2, rgba(COL.ink, 0.07)); fillRR(ctx, x + rw, by, len, bh, Math.min(bh / 2, STYLE.shape.radius), col); }
    ctx.restore();
    if (i === hi) glow(ctx, x + rw + len, by + bh / 2, 70, col, 0.35 * e);
    text(ctx, numText(d.value * e, Object.assign({}, o, { of: d.value })), x + rw + len + 18, by + bh / 2 + vs * 0.36,
      { size: vs, weight: 800, family: F.disp, color: i === hi ? COL.accent : COL.ink, alpha: a });
    out.push({ x: x + rw, y: by, w: len, h: bh, cy: by + bh / 2 });
  }
  return out;
}

/* A line that draws itself left to right with its current value riding on the tip.
   values: numbers, evenly spaced. o: p, color, min, max, area (false: no fill under the line),
   grid (number of guide lines), xLabels (strings spread under the axis), marks ([{ i, label }]
   flagged as the line passes them), prefix / suffix / decimals, tip (false: no riding value).
   Returns { pts, tip }. */
function lineChart(ctx, x, y, w, h, values, o = {}) {
  const n = values.length, p = _bP(o), col = _bCol(o.color, COL.subject), ls = o.labelSize || 28;
  const lo = o.min != null ? o.min : Math.min(0, ...values), top = o.max != null ? o.max : Math.max(...values) * 1.1;
  const pb = y + h - (o.xLabels ? ls * 2 : 0), pt = y + 70;
  const X = (i) => x + (w * i) / Math.max(1, n - 1), Y = (v) => pb - ((pb - pt) * (v - lo)) / (top - lo || 1);
  const pts = values.map((v, i) => [X(i), Y(v)]);
  const g = o.grid == null ? 3 : o.grid, ga = clamp(p * 4);
  for (let j = 1; j <= g; j++) { const gy = pb - ((pb - pt) * j) / g; line(ctx, x, gy, x + w, gy, rgba(COL.ink, 0.14), 2, ga, [6, 10]); }
  _bPath(ctx, [[x, pb], [x + w, pb]], rgba(COL.ink, 0.5), 3, ga, { seed: 13 });
  if (o.xLabels) {
    const m = o.xLabels.length;
    o.xLabels.forEach((s, j) => text(ctx, s, x + (w * j) / Math.max(1, m - 1), pb + ls * 1.45, { size: ls, weight: 600, family: F.mono,
      color: COL.dim, align: j === 0 ? 'left' : j === m - 1 ? 'right' : 'center', alpha: ga }));
  }
  const L = polyLen(pts), e = E.io2(clamp(p)), d = L * e, tip = polyAt(pts, d);
  if (e > 0 && o.area !== false) {
    const part = _bCut(pts, d), gr = ctx.createLinearGradient(0, pt, 0, pb);
    gr.addColorStop(0, rgba(col, STYLE.mode === 'light' ? 0.22 : 0.3)); gr.addColorStop(1, rgba(col, 0));
    ctx.save(); ctx.beginPath(); ctx.moveTo(part[0][0], pb);
    for (const q of part) ctx.lineTo(q[0], q[1]);
    ctx.lineTo(part[part.length - 1][0], pb); ctx.closePath(); ctx.fillStyle = gr; ctx.fill(); ctx.restore();
  }
  _bPath(ctx, pts, col, o.lw || 6, e, { seed: 5 });
  for (const m of o.marks || []) {
    const mx = X(m.i), my = Y(values[m.i]), k = clamp((tip[0] - mx) / 70);
    if (k <= 0) continue;
    line(ctx, mx, my, mx, pb, rgba(COL.ink, 0.45), 2, k, [5, 7]);
    dot(ctx, mx, my, 9, COL.accent, k);
    pill(ctx, m.label, mx, my - 44, { bg: COL.accent, size: 24, alpha: k });
  }
  if (e > 0 && o.tip !== false) {
    const f = ((tip[0] - x) / w) * (n - 1), i0 = Math.min(n - 1, Math.floor(f)), v = lerp(values[i0], values[Math.min(n - 1, i0 + 1)], f - i0);
    glow(ctx, tip[0], tip[1], 70, col, 0.45); dot(ctx, tip[0], tip[1], 11, col); ring(ctx, tip[0], tip[1], 19, col, 3, 0.6);
    const s = numText(v, Object.assign({}, o, { of: values[n - 1] })), pw = measure(ctx, s, 30, 700, F.mono, 1) + 36;
    pill(ctx, s, clamp(tip[0], x + pw / 2, x + w - pw / 2), tip[1] - 50, { bg: col, size: 30 });
  }
  return { pts, tip };
}

/* A ring of parts that sweeps round; one part can be pulled out. parts: [{ label, value, color }].
   o: p, hi, thick (ring width), center: { value, label, prefix, suffix } counting up in the
   middle, legend (false: none; else a list under the ring with each part's share), colors.
   Returns each part: { mid (outer point at its middle), a0, a1, color }. */
function donutChart(ctx, cx, cy, r, parts, o = {}) {
  const p = _bP(o), hi = o.hi == null ? -1 : o.hi, n = parts.length, tot = parts.reduce((s, d) => s + d.value, 0) || 1;
  const th = o.thick || r * 0.34, gapA = n > 1 ? 0.04 : 0, sweep = TAU * E.io3(clamp(p * 1.2));
  const out = [];
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.strokeStyle = rgba(COL.ink, 0.08); ctx.lineWidth = th; ctx.stroke(); ctx.restore();
  let a = -Math.PI / 2;
  for (let i = 0; i < n; i++) {
    const d = parts[i], span = (d.value / tot) * TAU, a0 = a + gapA / 2, a1 = a + span - gapA / 2, end = Math.min(a1, -Math.PI / 2 + sweep);
    const col = _bCol(d.color, _bSeries(i, o)), focus = hi < 0 || i === hi;
    const pop = i === hi ? 16 * E.outBack(clamp(p * 2.2 - 1.2)) : 0, mid = (a0 + a1) / 2, ox = Math.cos(mid) * pop, oy = Math.sin(mid) * pop;
    if (end > a0) {
      ctx.save(); ctx.globalAlpha *= focus ? 1 : 0.42;
      ctx.beginPath(); ctx.arc(cx + ox, cy + oy, r, a0, end);
      ctx.strokeStyle = col; ctx.lineWidth = th + (i === hi ? 12 : 0); ctx.lineCap = 'butt'; ctx.stroke(); ctx.restore();
    }
    out.push({ mid: [cx + Math.cos(mid) * (r + th / 2 + pop), cy + Math.sin(mid) * (r + th / 2 + pop)], a0, a1, color: col });
    a += span;
  }
  if (o.center) {
    const c = o.center, k = E.out3(clamp(p * 1.3)), vs = c.size || Math.round(r * 0.46), lift = c.label ? vs * 0.2 : 0;
    text(ctx, numText(c.value * k, Object.assign({}, c, { of: c.value })), cx, cy + vs * 0.35 - lift, { size: vs, weight: 800, family: F.disp, color: COL.ink, align: 'center', alpha: clamp(p * 2) });
    if (c.label) text(ctx, c.label, cx, cy + vs * 0.35 - lift + 48, { size: 30, weight: 600, color: COL.dim, align: 'center', alpha: clamp(p * 2) });
  }
  if (o.legend !== false) {
    const lw = o.legendW || Math.max(2 * r + th, 620), lx = cx - lw / 2, ly = cy + r + th / 2 + 84, rowH = 60;
    parts.forEach((d, i) => {
      const k = clamp(stagger(p, i, n, 0.5) * 3), focus = hi < 0 || i === hi, yy = ly + i * rowH;
      dot(ctx, lx + 15, yy - 11, 13, out[i].color, k * (focus ? 1 : 0.45));
      text(ctx, d.label, lx + 48, yy, { size: 32, weight: 600, color: focus ? COL.text : COL.dim, alpha: k });
      text(ctx, Math.round((d.value / tot) * 100) + '%', lx + lw, yy, { size: 32, weight: 800, family: F.disp, color: focus ? COL.ink : COL.dim, align: 'right', alpha: k });
    });
  }
  return out;
}

/* A ring that fills to a share with the percentage counting up inside. value: 0..1.
   o: p, color, thick, label (under the number), decimals. Returns the tip of the arc. */
function progressRing(ctx, cx, cy, r, value, o = {}) {
  const p = _bP(o), col = _bCol(o.color, COL.accent), th = o.thick || r * 0.17, e = E.io3(p), v = clamp(value) * e;
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.strokeStyle = rgba(COL.ink, 0.1); ctx.lineWidth = th; ctx.stroke(); ctx.restore();
  const a1 = -Math.PI / 2 + TAU * v, tip = [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r];
  if (v > 0.001) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, a1); ctx.strokeStyle = col; ctx.lineWidth = th; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore();
    glow(ctx, tip[0], tip[1], th * 2.2, col, 0.5 * e);
  }
  const vs = o.size || Math.round(r * 0.5), lift = o.label ? vs * 0.18 : 0;
  text(ctx, numText(clamp(value) * 100 * e, { suffix: '%', decimals: o.decimals || 0 }), cx, cy + vs * 0.35 - lift,
    { size: vs, weight: 800, family: F.disp, color: COL.ink, align: 'center', alpha: clamp(p * 3) });
  if (o.label) text(ctx, o.label, cx, cy + vs * 0.35 - lift + 46, { size: 30, weight: 600, color: COL.dim, align: 'center', alpha: clamp(p * 3) });
  return tip;
}

/* A dial from low to high whose needle swings to the value (0..1) and settles.
   o: p, zones ([{ to: 0.55, color: 'good' }, …]), label (under the hub, in the colour of the
   zone the needle ends in), minLabel, maxLabel, thick. Returns { tip, angle }. */
function gaugeMeter(ctx, cx, cy, r, value, o = {}) {
  const zones = o.zones || [{ to: 0.55, color: 'good' }, { to: 0.8, color: 'accent' }, { to: 1, color: 'alert' }];
  const p = _bP(o), th = o.thick || r * 0.2, a = clamp(p * 4), sweep = clamp(p * 2.2), gap = 0.025;
  let from = 0, zoneCol = _bCol(zones[zones.length - 1].color);
  for (const z of zones) {
    const a0 = Math.PI + Math.PI * from + (from > 0 ? gap : 0), a1 = Math.PI + Math.PI * z.to - (z.to < 1 ? gap : 0), end = Math.min(a1, Math.PI + Math.PI * sweep);
    if (end > a0) { ctx.save(); ctx.globalAlpha *= a; ctx.beginPath(); ctx.arc(cx, cy, r, a0, end); ctx.strokeStyle = _bCol(z.color); ctx.lineWidth = th; ctx.lineCap = 'butt'; ctx.stroke(); ctx.restore(); }
    if (value <= z.to && value >= from) zoneCol = _bCol(z.color);
    from = z.to;
  }
  for (let i = 0; i <= 10; i++) {
    const ang = Math.PI + (Math.PI * i) / 10, r0 = r - th / 2 - 14, r1 = r0 - (i % 5 === 0 ? 26 : 14);
    line(ctx, cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0, cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1, rgba(COL.ink, 0.5), 3, a);
  }
  const v = value * E.outBack(clamp((p - 0.3) / 0.7)), ang = Math.PI + Math.PI * clamp(v, -0.03, 1.03), L = r - th * 0.15;
  const tip = [cx + Math.cos(ang) * L, cy + Math.sin(ang) * L], nx = -Math.sin(ang), ny = Math.cos(ang);
  if (p > 0.3) {
    ctx.save(); ctx.globalAlpha *= a; ctx.beginPath();
    ctx.moveTo(tip[0], tip[1]); ctx.lineTo(cx + nx * 11, cy + ny * 11); ctx.lineTo(cx - nx * 11, cy - ny * 11); ctx.closePath();
    ctx.fillStyle = COL.ink; ctx.fill(); ctx.restore();
  }
  dot(ctx, cx, cy, 18, COL.ink, a); dot(ctx, cx, cy, 7, COL.bgMid, a);
  if (o.minLabel) text(ctx, o.minLabel, cx - r, cy + 50, { size: 26, weight: 600, family: F.mono, color: COL.dim, align: 'center', alpha: a });
  if (o.maxLabel) text(ctx, o.maxLabel, cx + r, cy + 50, { size: 26, weight: 600, family: F.mono, color: COL.dim, align: 'center', alpha: a });
  if (o.label) text(ctx, o.label, cx, cy + 92, { size: 46, weight: 800, family: F.disp, color: zoneCol, align: 'center', alpha: clamp((p - 0.7) / 0.3) });
  return { tip, angle: ang };
}

/* A grid of units with some of them lit: "1 in 4", "38 of 100". n units, k lit (the first k,
   or o.pick: a list of unit indices). o: p (the lit units fill in turn), icon (a Lucide name;
   dots without one), cols, color, label (a line under the grid). Returns the grid's box. */
function unitChart(ctx, x, y, w, n, k, o = {}) {
  const p = _bP(o), cols = o.cols || Math.min(n, 10), cell = w / cols, rows = Math.ceil(n / cols), col = _bCol(o.color, COL.accent);
  const lit = o.pick || Array.from({ length: k }, (_, i) => i), name = o.icon && ICONS[o.icon] ? o.icon : null, s = cell * 0.72;
  const appear = clamp(p * 4), fill = clamp((p - 0.25) / 0.75);
  for (let i = 0; i < n; i++) {
    const cx = x + (i % cols + 0.5) * cell, cy = y + (Math.floor(i / cols) + 0.5) * cell, j = lit.indexOf(i);
    const kk = j < 0 ? 0 : stagger(fill, j, lit.length, 0.7), pop = 1 + 0.12 * Math.sin(Math.PI * clamp(kk * 1.4));
    const c = kk > 0 ? mixHex(COL.faint, col, E.out3(kk)) : COL.faint, a = appear * clamp(appear * n - i * 0.6);
    if (a <= 0.003) continue;
    if (kk > 0.5) glow(ctx, cx, cy, s * 0.9, col, 0.18 * kk);
    if (name) icon(ctx, name, cx, cy, s * pop, c, { lw: 2.2, alpha: a });
    else dot(ctx, cx, cy, s * 0.36 * pop, c, a);
  }
  const gh = rows * cell;
  if (o.label) {
    const ls = _bFit(ctx, o.label, w, o.labelSize || 64, 800, F.disp, 32);
    text(ctx, o.label, x + w / 2, y + gh + ls * 1.15, { size: ls, weight: 800, family: F.disp, color: col, align: 'center', alpha: clamp((p - 0.5) * 3) });
  }
  return { x, y, w, h: gh, cell };
}

/* ---------- numbers and comparisons ---------- */

/* A card with one big number that counts up, its label, and optionally an icon and a change
   (o.delta: '+12%' — up in good, down in alert; o.deltaGood: false when up is bad).
   o: p, color (of the number), icon, prefix / suffix / decimals, align ('left' | 'center'),
   hi (outline in the number's colour), size, labelSize. Returns the card's box. */
function statTile(ctx, x, y, w, h, value, label, o = {}) {
  const p = _bP(o), e = E.out3(clamp(p * 1.25)), a = clamp(p * 4), col = _bCol(o.color, COL.accent);
  const dy = (1 - E.out3(clamp(p * 3))) * 34, pad = Math.min(44, w * 0.08), center = o.align === 'center';
  blockCard(ctx, x, y + dy, w, h, { alpha: a, accent: o.hi ? col : null, seed: o.seed || 4 });
  const tx = center ? x + w / 2 : x + pad, align = center ? 'center' : 'left';
  let top = y + dy + pad;
  if (o.icon && ICONS[o.icon]) {
    icon(ctx, o.icon, center ? x + w / 2 : x + pad + 30, top + 30, 60, col, { alpha: a, p: clamp(p * 2) });
    top += 76;
  }
  const fin = numText(value, Object.assign({}, o, { of: value }));
  const ls = _bFit(ctx, label, w - 2 * pad, o.labelSize || 32);
  const room = y + dy + h - pad - ls * 1.5 - top;
  const size = Math.max(40, Math.min(o.size || room * 0.95, fitSize(ctx, fin, w - 2 * pad, 220, 800, F.disp)));
  text(ctx, numText(value * e, Object.assign({}, o, { of: value })), tx, top + room * 0.5 + size * 0.36, { size, weight: 800, family: F.disp, color: col, align, alpha: a });
  text(ctx, label, tx, y + dy + h - pad, { size: ls, weight: 600, color: COL.text, align, alpha: a });
  if (o.delta) {                               // a tag with a triangle: up or down, good or bad
    const s = String(o.delta).trim(), up = !/^[-−]/.test(s), good = o.deltaGood === false ? !up : up, txt = s.replace(/^[+\-−]\s*/, '');
    const da = clamp((p - 0.55) * 4), tw2 = measure(ctx, txt, 26, 700, F.mono, 1), pw = tw2 + 72, ph = 44, px = x + w - pad - pw, py = y + dy + pad;
    if (da > 0.003) {
      ctx.save(); ctx.globalAlpha *= da; fillRR(ctx, px, py, pw, ph, ph / 2, good ? COL.good : COL.alert); ctx.restore();
      _bTri(ctx, px + 27, py + ph / 2 + (up ? 1 : -1), 17, up ? -Math.PI / 2 : Math.PI / 2, COL.onAccent, da);
      text(ctx, txt, px + 46, py + ph / 2 + 9.5, { size: 26, weight: 700, family: F.mono, color: COL.onAccent, alpha: da, ls: 1 });
    }
  }
  return { x, y: y + dy, w, h };
}

/* Two cards side by side with a VS badge: a showdown. a, b: { title, rows: [strings], icon,
   color }. o: p (cards slide in, then their rows), win ('a' | 'b': the other card dims),
   winLabel (text of the winner's tag, false for none), badge (text, 'VS'), titleSize.
   Returns both cards' boxes. */
function versusCards(ctx, x, y, w, h, a, b, o = {}) {
  const p = _bP(o), gap = o.gap || 48, cw = (w - gap) / 2, out = [];
  [a, b].forEach((s, j) => {
    const k = E.out3(stagger(p, j, 2, 0.35)), cx0 = x + j * (cw + gap) + (1 - k) * (j ? 80 : -80);
    const won = o.win === (j ? 'b' : 'a'), lost = !!o.win && !won, col = _bCol(s.color, j ? COL.accent : COL.subject);
    const ca = clamp(k * 2.5), al = ca * (lost ? 0.45 : 1);     // a dimmed card stays solid; its content fades
    blockCard(ctx, cx0, y, cw, h, { alpha: ca, accent: won ? col : null, seed: 3 + j });
    let yy = y + 60;
    if (s.icon && ICONS[s.icon]) { icon(ctx, s.icon, cx0 + cw / 2, yy + 40, 84, col, { alpha: al, p: clamp(k * 1.6), lw: 1.8 }); yy += 112; }
    const ts = _bFit(ctx, s.title, cw - 48, o.titleSize || 50, 800, F.disp, 28);
    text(ctx, s.title, cx0 + cw / 2, yy + ts * 0.78, { size: ts, weight: 800, family: F.disp, color: col, align: 'center', alpha: al });
    yy += ts * 0.78 + 62;
    (s.rows || []).forEach((r, i) => {
      const kr = clamp((p - 0.42 - i * 0.09) * 5) * (lost ? 0.5 : 1), rs = _bFit(ctx, r, cw - 84, 32);
      dot(ctx, cx0 + 38, yy - rs * 0.32, 6, col, kr);
      text(ctx, r, cx0 + 58, yy, { size: rs, weight: 600, color: COL.text, alpha: kr });
      yy += 60;
    });
    if (won && o.winLabel !== false) pill(ctx, o.winLabel || 'WINS', cx0 + cw / 2, y, { bg: col, size: 26, alpha: clamp((p - 0.75) * 5) });
    out.push({ x: cx0, y, w: cw, h });
  });
  const bk = E.outBack(clamp((p - 0.3) * 3));
  if (bk > 0) {
    const bx = x + w / 2, by = y + h * 0.5, br = 50 * bk;
    dot(ctx, bx, by, br + 8, COL.bgMid); dot(ctx, bx, by, br, COL.accent);
    text(ctx, o.badge || 'VS', bx, by + 13 * bk, { size: Math.max(1, 36 * bk), weight: 900, family: F.disp, color: COL.onAccent, align: 'center' });
  }
  return out;
}

/* Before and after in one card, split by a divider that can wipe across (animate o.split from
   1 to 0.5 to reveal the right side). left, right: { tag, value, sub, color }. o: p, split.
   Returns the divider's x. */
function splitCompare(ctx, x, y, w, h, left, right, o = {}) {
  const p = _bP(o), split = o.split == null ? 0.5 : clamp(o.split), sx = x + w * split, a = clamp(p * 3);
  const R = _bRough(o) ? 0 : STYLE.shape.radius;
  blockCard(ctx, x, y, w, h, { alpha: a, seed: 6 });
  const side = (s, j) => {
    const cx = x + w * (j ? 0.75 : 0.25), col = _bCol(s.color, j ? COL.good : COL.alert), hw = w / 2 - 56;
    ctx.save(); ctx.globalAlpha *= a; rr(ctx, x, y, w, h, R); ctx.clip();
    ctx.beginPath(); if (j) ctx.rect(sx, y, x + w - sx, h); else ctx.rect(x, y, sx - x, h); ctx.clip();
    ctx.fillStyle = rgba(col, STYLE.mode === 'light' ? 0.1 : 0.12); ctx.fillRect(x, y, w, h);
    if (s.tag) text(ctx, s.tag, cx, y + 78, { size: 28, weight: 700, family: F.mono, color: COL.dim, align: 'center', ls: 3 });
    const vs = _bFit(ctx, String(s.value), hw, o.valueSize || 130, 800, F.disp, 40);
    text(ctx, String(s.value), cx, y + h * 0.56, { size: vs, weight: 800, family: F.disp, color: col, align: 'center' });
    if (s.sub) text(ctx, s.sub, cx, y + h * 0.56 + 70, { size: _bFit(ctx, s.sub, hw, 32), weight: 600, color: COL.text, align: 'center' });
    ctx.restore();
  };
  side(left, 0); side(right, 1);
  if (a > 0.003) {
    line(ctx, sx, y + 18, sx, y + h - 18, COL.ink, 4, a);
    dot(ctx, sx, y + h / 2, 30, COL.ink, a);
    _bTri(ctx, sx - 10, y + h / 2, 13, Math.PI, COL.bgMid, a); _bTri(ctx, sx + 10, y + h / 2, 13, 0, COL.bgMid, a);
  }
  return sx;
}

/* A quotation that appears word by word, with its source. o: p, size, card (false: none),
   color (of the quote mark). Returns the card's box. */
function quoteCard(ctx, x, y, w, quote, who, o = {}) {
  const p = _bP(o), size = o.size || 50, pad = 58, lh = Math.round(size * 1.3), col = _bCol(o.color, COL.accent);
  const lines = _bWrap(ctx, quote, w - 2 * pad, size, 700, F.disp);
  const h = pad + 92 + lines.length * lh + (who ? 84 : 10) + pad * 0.4, a = clamp(p * 4);
  if (o.card !== false) blockCard(ctx, x, y, w, h, { alpha: a, seed: 8 });
  text(ctx, '“', x + pad - 8, y + pad + 112, { size: 190, weight: 900, family: F.disp, color: col, alpha: a });
  const words = lines.map((l) => l.split(' ')), total = words.reduce((s, l) => s + l.length, 0), sp = measure(ctx, ' ', size, 700, F.disp);
  let j = 0;
  words.forEach((ws, li) => {
    let wx = x + pad;
    const wy = y + pad + 92 + li * lh + size * 0.8;
    for (const wd of ws) {
      const k = clamp((p * 1.3 - 0.12) * total - j);
      text(ctx, wd, wx, wy + (1 - E.out3(k)) * 10, { size, weight: 700, family: F.disp, color: COL.ink, alpha: k });
      wx += measure(ctx, wd, size, 700, F.disp) + sp; j++;
    }
  });
  if (who) text(ctx, '— ' + who, x + pad, y + h - pad * 0.95, { size: 28, weight: 600, family: F.mono, color: COL.dim, alpha: clamp((p - 0.82) * 6) });
  return { x, y, w, h };
}

/* ---------- lists, time and process ---------- */

/* Numbered steps that appear one by one, joined by a line; o.active lights one step and the
   steps before it get a tick. items: strings or { title, sub }. o: p, active, done (false:
   keep numbers on finished steps), rowH, color, t (the active badge breathes).
   Returns each badge's centre. */
function stepList(ctx, x, y, w, items, o = {}) {
  const list = items.map((s) => (typeof s === 'string' ? { title: s } : s)), n = list.length;
  const p = _bP(o), act = o.active == null ? -1 : o.active, hasSub = list.some((s) => s.sub);
  const rowH = o.rowH || (hasSub ? 152 : 116), R = o.badge || 36, col = _bCol(o.color, COL.subject), bx = x + R, out = [];
  for (let i = 0; i < n; i++) {
    const k = stagger(p, i, n, 0.6), cy = y + i * rowH + R;
    if (i > 0) {
      const py = cy - rowH + R + 10, len = (rowH - 2 * R - 20) * E.io2(clamp(k * 2.2));
      if (len > 0) _bPath(ctx, [[bx, py], [bx, py + len]], rgba(COL.ink, 0.28), 4, 1, { seed: 30 + i });
    }
    out.push([bx, cy]);
    if (k <= 0) continue;
    const s = list[i], focus = act < 0 || i === act, done = o.done !== false && act >= 0 && i < act;
    const e = E.outBack(clamp(k * 1.6)), ba = clamp(k * 3) * (focus || done ? 1 : 0.45), bc = i === act ? COL.accent : done ? COL.good : col;
    if (i === act) { glow(ctx, bx, cy, R * 3, COL.accent, 0.32 * ba); ring(ctx, bx, cy, R + 11 + (o.t != null ? 2.5 * Math.sin(o.t * 3.2) : 0), COL.accent, 3, 0.55 * ba); }
    dot(ctx, bx, cy, R * e, bc, ba);
    if (done) check(ctx, bx, cy + 2, R * 0.78, COL.onAccent, clamp(k * 2), 6);
    else text(ctx, String(i + 1), bx, cy + R * 0.38, { size: Math.round(R * 1.05), weight: 800, family: F.disp, color: COL.onAccent, align: 'center', alpha: ba });
    const tx = x + 2 * R + 32 - (1 - E.out3(k)) * 26, ta = clamp(k * 2.5) * (focus ? 1 : 0.5), ts = _bFit(ctx, s.title, w - 2 * R - 32, o.titleSize || 40, 700, F.disp);
    text(ctx, s.title, tx, cy + (s.sub ? -4 : ts * 0.36), { size: ts, weight: 700, family: F.disp, color: focus ? COL.ink : COL.dim, alpha: ta });
    if (s.sub) text(ctx, s.sub, tx, cy + 42, { size: _bFit(ctx, s.sub, w - 2 * R - 32, 30), weight: 500, color: COL.dim, alpha: ta });
  }
  return out;
}

/* Rows that get a tick or a cross as they appear: myths and facts, a checklist, pros and cons.
   items: [{ text, ok }] (ok true: tick in good, false: cross in alert, null: an empty box).
   o: p, strike (struck-through text on crossed rows), rowH, size. Returns each mark's centre. */
function checkList(ctx, x, y, w, items, o = {}) {
  const n = items.length, p = _bP(o), rowH = o.rowH || 108, S = 58, rough = _bRough(o), out = [];
  for (let i = 0; i < n; i++) {
    const it = items[i], k = stagger(p, i, n, 0.55), ry = y + i * rowH, a = clamp(k * 4), m = clamp(k * 2.2 - 0.8);
    const mx = x + S / 2, my = ry + S / 2;
    out.push([mx, my]);
    if (a <= 0.003) continue;
    if (rough) roughRect(ctx, x, ry, S, S, rgba(COL.ink, 0.7), 3, { seed: 50 + i, wobble: 2, overshoot: 3, alpha: a });
    else { ctx.save(); ctx.globalAlpha *= a; strokeRR(ctx, x, ry, S, S, Math.min(12, STYLE.shape.radius), rgba(COL.ink, 0.55), 3); ctx.restore(); }
    if (it.ok === true) check(ctx, mx, my + 2, S * 0.64, COL.good, m, 8);
    else if (it.ok === false) cross(ctx, mx, my, S * 0.26, COL.alert, m, 8);
    const ts = _bFit(ctx, it.text, w - S - 30, o.size || 38), tx = x + S + 30, ty = my + ts * 0.36;
    const struck = o.strike && it.ok === false;
    text(ctx, it.text, tx, ty, { size: ts, weight: 600, color: struck ? COL.dim : COL.ink, alpha: a });
    if (struck && m > 0) line(ctx, tx - 4, my + 2, tx - 4 + (measure(ctx, it.text, ts, 600, F.ui) + 8) * m, my + 2, COL.alert, 4, a);
  }
  return out;
}

/* Dated events on an axis that draws itself; each event pops in as the line reaches it.
   events: [{ at: '1903', text: 'First flight' }]. o: p, active (index lit), vertical (down the
   left side, one event per row: more room for text, better in 9:16), rowH, color.
   Returns each event's point on the axis. */
function timelineAxis(ctx, x, y, w, events, o = {}) {
  const n = events.length, p = _bP(o), act = o.active == null ? -1 : o.active, col = _bCol(o.color, COL.subject), out = [];
  if (o.vertical) {
    const rowH = o.rowH || 150, ax = x + 24, y1 = y + (n - 1) * rowH, head = y - 20 + (y1 - y + 60) * E.io2(clamp(p * 1.1));
    _bPath(ctx, [[ax, y - 20], [ax, Math.max(y - 20, head)]], rgba(COL.ink, 0.45), 4, 1, { seed: 60 });
    events.forEach((ev, i) => {
      const ey = y + i * rowH, k = clamp((head - ey) / 70), e = E.outBack(k), focus = act < 0 || i === act, a = clamp(k * 3) * (focus ? 1 : 0.5);
      out.push([ax, ey]);
      if (k <= 0) return;
      if (i === act) glow(ctx, ax, ey, 70, COL.accent, 0.4 * k);
      dot(ctx, ax, ey, (i === act ? 17 : 12) * e, i === act ? COL.accent : col, a);
      text(ctx, ev.at, ax + 44, ey - 8, { size: 30, weight: 700, family: F.mono, color: i === act ? COL.accent : col, alpha: a, ls: 1 });
      const ts = _bFit(ctx, ev.text, w - 70, o.size || 38, 700, F.disp);
      text(ctx, ev.text, ax + 44 + (1 - E.out3(k)) * 20, ey + 40, { size: ts, weight: 700, family: F.disp, color: focus ? COL.ink : COL.dim, alpha: a });
    });
    return out;
  }
  const head = x + w * E.io2(clamp(p * 1.1)), step = (w - 80) / Math.max(1, n - 1), ex = (i) => x + 40 + i * step;
  _bPath(ctx, [[x, y], [Math.max(x, head), y]], rgba(COL.ink, 0.45), 4, 1, { seed: 61 });
  if (p >= 0.9) arrowHead(ctx, x + w + 4, y, 0, 16, rgba(COL.ink, 0.45), clamp((p - 0.9) * 10));
  events.forEach((ev, i) => {
    const xx = ex(i), k = clamp((head - xx) / 70), e = E.outBack(k), focus = act < 0 || i === act, a = clamp(k * 3) * (focus ? 1 : 0.5);
    out.push([xx, y]);
    if (k <= 0) return;
    if (i === act) glow(ctx, xx, y, 80, COL.accent, 0.4 * k);
    dot(ctx, xx, y, (i === act ? 17 : 12) * e, i === act ? COL.accent : col, a);
    const ds = _bFit(ctx, ev.at, step * 0.95, 34, 700, F.mono);
    text(ctx, ev.at, xx, y - 40 - (1 - E.out3(k)) * 14, { size: ds, weight: 700, family: F.mono, color: i === act ? COL.accent : col, align: 'center', alpha: a });
    const ts = o.size || 31, lines = _bWrap(ctx, ev.text, step * 0.94, ts, 600, F.ui);
    lines.slice(0, 3).forEach((l, li) => text(ctx, l, xx, y + 64 + li * ts * 1.25 + (1 - E.out3(k)) * 14, { size: ts, weight: 600, color: focus ? COL.text : COL.dim, align: 'center', alpha: a }));
  });
  return out;
}

/* Steps of a process as boxes joined by arrows, with a dot travelling along them; o.active
   lights one box. nodes: [{ label, sub, icon }]. o: p, active, dir ('down': stacked, the 9:16
   way; 'right': in a row, for 2–4 short labels), boxH, gap, t (moves the travelling dot), color.
   Returns each box { x, y, w, h }. */
function flowChain(ctx, x, y, w, nodes, o = {}) {
  const n = nodes.length, dir = o.dir || 'down', p = _bP(o), act = o.active == null ? -1 : o.active, col = _bCol(o.color, COL.subject);
  const gap = o.gap || (dir === 'down' ? 66 : 72), down = dir === 'down';
  const bw = down ? w : (w - gap * (n - 1)) / n, bh = o.boxH || (down ? 124 : 230), out = [];
  for (let i = 0; i < n; i++) out.push({ x: down ? x : x + i * (bw + gap), y: down ? y + i * (bh + gap) : y, w: bw, h: bh });
  for (let i = 0; i < n - 1; i++) {
    const A = out[i], B = out[i + 1], ka = clamp(stagger(p, i + 1, n, 0.6) * 1.6);
    const a0 = down ? [A.x + A.w / 2, A.y + A.h + 10] : [A.x + A.w + 10, A.y + A.h / 2], a1 = down ? [B.x + B.w / 2, B.y - 12] : [B.x - 12, B.y + B.h / 2];
    if (ka <= 0) continue;
    const end = [lerp(a0[0], a1[0], ka), lerp(a0[1], a1[1], ka)];
    _bPath(ctx, [a0, end], rgba(COL.ink, 0.5), 4, 1, { seed: 70 + i });
    if (ka > 0.9) arrowHead(ctx, a1[0], a1[1], down ? Math.PI / 2 : 0, 16, rgba(COL.ink, 0.5), (ka - 0.9) * 10);
    if (o.t != null && p >= 1) {
      const u = (o.t * 0.9 + i * 0.37) % 1;
      dot(ctx, lerp(a0[0], a1[0], u), lerp(a0[1], a1[1], u), 7, COL.accent, Math.sin(Math.PI * u));
    }
  }
  nodes.forEach((nd, i) => {
    const b = out[i], k = stagger(p, i, n, 0.6), e = E.out3(k), focus = act < 0 || i === act, ca = clamp(k * 3), a = ca * (focus ? 1 : 0.5);
    if (ca <= 0.003) return;
    const by = b.y + (1 - e) * 26, ic = i === act ? COL.accent : col;
    if (i === act) glow(ctx, b.x + b.w / 2, by + b.h / 2, Math.max(b.w, b.h) * 0.6, COL.accent, 0.22 * a);
    blockCard(ctx, b.x, by, b.w, b.h, { alpha: ca, accent: i === act ? COL.accent : null, seed: 7 + i });
    const hasIcon = nd.icon && ICONS[nd.icon];
    if (down) {
      if (hasIcon) icon(ctx, nd.icon, b.x + 66, by + b.h / 2, 58, ic, { alpha: a, p: clamp(k * 1.5) });
      const lx = b.x + (hasIcon ? 124 : 40), ls = _bFit(ctx, nd.label, b.w - (lx - b.x) - 30, o.size || 40, 700, F.disp);
      text(ctx, nd.label, lx, by + b.h / 2 + (nd.sub ? -6 : ls * 0.36), { size: ls, weight: 700, family: F.disp, color: COL.ink, alpha: a });
      if (nd.sub) text(ctx, nd.sub, lx, by + b.h / 2 + 38, { size: _bFit(ctx, nd.sub, b.w - (lx - b.x) - 30, 28), weight: 500, color: COL.dim, alpha: a });
    } else {
      if (hasIcon) icon(ctx, nd.icon, b.x + b.w / 2, by + 74, 70, ic, { alpha: a, p: clamp(k * 1.5) });
      const ls = _bFit(ctx, nd.label, b.w - 24, o.size || 34, 700, F.disp);
      text(ctx, nd.label, b.x + b.w / 2, by + (hasIcon ? 158 : b.h / 2 + ls * 0.36), { size: ls, weight: 700, family: F.disp, color: COL.ink, align: 'center', alpha: a });
      if (nd.sub) text(ctx, nd.sub, b.x + b.w / 2, by + (hasIcon ? 196 : b.h / 2 + 44), { size: _bFit(ctx, nd.sub, b.w - 24, 26), weight: 500, color: COL.dim, align: 'center', alpha: a });
    }
  });
  return out;
}

/* ---------- pointing ---------- */

/* A label that points at something: a dot on the target, an elbowed leader line, the label on
   a plate. Draws itself in that order with o.p. o: color, size, t (the target ring breathes).
   Returns the label's box. */
function labelPointer(ctx, tx, ty, lx, ly, label, o = {}) {
  const p = _bP(o), col = _bCol(o.color, COL.accent), size = o.size || 30;
  const kd = E.outBack(clamp(p * 4)), kl = clamp((p - 0.2) / 0.45), kp = E.out3(clamp((p - 0.6) / 0.4));
  if (kd > 0) {
    glow(ctx, tx, ty, 46, col, 0.35 * clamp(p * 4));
    dot(ctx, tx, ty, 14 * kd, COL.bgMid);                 // a halo, so the dot shows on a fill of its own colour
    dot(ctx, tx, ty, 9 * kd, col);
    ring(ctx, tx, ty, (19 + (o.t != null ? 3 * Math.sin(o.t * 4) : 0)) * kd, col, 3, 0.7);
  }
  const right = lx >= tx, kx = lx + (right ? -34 : 34);
  _bPath(ctx, [[tx, ty], [kx, ly], [lx, ly]], col, 3, kl, { seed: 80 });
  const pw = measure(ctx, label, size, 700, F.mono, 1) + 36, ph = Math.round(size * 1.62);
  pill(ctx, label, lx + (right ? 1 : -1) * (1 - kp) * 16, ly, { bg: col, size, align: right ? 'left' : 'right', alpha: kp });
  return { x: right ? lx : lx - pw, y: ly - ph / 2, w: pw, h: ph };
}

/* ---------- the catalog: one demo per block, drawn by `lockstep catalog` ----------
   Demos are illustrations with made-up numbers, laid out in the content zone
   (x 70–1010, y 372–1210). Each demo is a usage example as well.                     */
const BLOCK_CATALOG = {
  barChart: { about: 'compare a few amounts; bars grow in turn, values count up, one can be singled out',
    demo: (ctx, p) => barChart(ctx, 120, 420, 840, 700, [{ label: 'Mon', value: 32 }, { label: 'Tue', value: 45 }, { label: 'Wed', value: 28 }, { label: 'Thu', value: 61 }, { label: 'Fri', value: 40 }], { p, hi: 3, suffix: ' min' }) },
  rankBars: { about: 'a ranking or top-N list: one row per item, label above its bar, value at the end',
    demo: (ctx, p) => rankBars(ctx, 110, 440, 860, [{ label: 'Walking', value: 420 }, { label: 'Cycling', value: 310 }, { label: 'Running', value: 260 }, { label: 'Swimming', value: 180 }, { label: 'Yoga', value: 120 }], { p, rank: true, hi: 0, suffix: ' kcal' }) },
  lineChart: { about: 'a change over time: the line draws itself with its value riding on the tip; events flagged as it passes',
    demo: (ctx, p) => lineChart(ctx, 120, 420, 840, 700, [3, 4, 4.5, 6, 5.5, 7, 9, 12, 15, 21, 30], { p, xLabels: ['2015', '2020', '2025'], marks: [{ i: 6, label: 'launch' }], suffix: 'k' }) },
  donutChart: { about: 'parts of a whole: segments sweep round, one pulled out, total in the middle, shares listed',
    demo: (ctx, p) => donutChart(ctx, 540, 650, 190, [{ label: 'Rent', value: 40 }, { label: 'Food', value: 25 }, { label: 'Travel', value: 15 }, { label: 'Everything else', value: 20 }], { p, hi: 0, center: { value: 40, suffix: '%', label: 'on rent' } }) },
  progressRing: { about: 'one share of a whole, as a ring that fills while the percentage counts up',
    demo: (ctx, p) => progressRing(ctx, 540, 790, 250, 0.72, { p, label: 'charged' }) },
  gaugeMeter: { about: 'a level on a scale (risk, speed, strength): the needle swings to its value and settles',
    demo: (ctx, p) => gaugeMeter(ctx, 540, 900, 330, 0.78, { p, label: 'HIGH', minLabel: 'low', maxLabel: 'high' }) },
  unitChart: { about: 'a proportion as countable units ("1 in 4"): the lit ones fill in turn',
    demo: (ctx, p) => unitChart(ctx, 130, 420, 820, 40, 10, { p, icon: 'user', cols: 8, label: '1 in 4' }) },
  statTile: { about: 'one big number that counts up, with its label, an icon and a change',
    demo: (ctx, p) => { statTile(ctx, 90, 500, 430, 520, 8.4, 'kilometres walked', { p: stagger(p, 0, 2), icon: 'footprints', delta: '+12%', suffix: ' km' }); statTile(ctx, 560, 500, 430, 520, 342, 'calories', { p: stagger(p, 1, 2), icon: 'flame', color: 'alert', delta: '-4%', deltaGood: false }); } },
  versusCards: { about: 'a showdown: two cards slide in, a VS badge pops, the winner lights and the other dims',
    demo: (ctx, p) => versusCards(ctx, 90, 470, 900, 600, { title: 'Coffee', icon: 'coffee', rows: ['Fast boost', 'Sharp crash', 'Bitter'] }, { title: 'Green tea', icon: 'leaf', rows: ['Gentle lift', 'Steady focus', 'Grassy'] }, { p, win: 'b' }) },
  splitCompare: { about: 'before and after in one card; the divider can wipe across to reveal the second side',
    demo: (ctx, p) => splitCompare(ctx, 90, 500, 900, 560, { tag: 'BEFORE', value: '4 h', sub: 'to finish' }, { tag: 'AFTER', value: '6 min', sub: 'to finish' }, { p, split: lerp(1, 0.5, E.io3(clamp((p - 0.35) / 0.65))) }) },
  quoteCard: { about: 'a quotation that appears word by word, with its source',
    demo: (ctx, p) => quoteCard(ctx, 90, 470, 900, 'The best explanation is the one your audience can repeat to a friend.', 'a rule for explainers', { p }) },
  stepList: { about: 'numbered steps that appear in turn; the current one lit, the ones before ticked',
    demo: (ctx, p) => stepList(ctx, 110, 440, 860, [{ title: 'Pick one idea', sub: 'the thing to be remembered' }, { title: 'Find the picture', sub: 'one image that carries it' }, { title: 'Say it in a line', sub: 'then cut that line in half' }, { title: 'Show, then tell', sub: 'the picture lands on the word' }], { p, active: 2, t: 2 }) },
  checkList: { about: 'myths and facts, a checklist, pros and cons: each row gets a tick or a cross',
    demo: (ctx, p) => checkList(ctx, 120, 470, 840, [{ text: 'Fits in one sentence', ok: true }, { text: 'Every number sourced', ok: true }, { text: 'Jargon left unexplained', ok: false }, { text: 'Ends on the payoff', ok: true }, { text: 'Longer than it needs', ok: false }], { p, strike: true }) },
  timelineAxis: { about: 'dated events on an axis that draws itself; each pops in as the line reaches it',
    demo: (ctx, p) => timelineAxis(ctx, 90, 760, 900, [{ at: '1903', text: 'First powered flight' }, { at: '1969', text: 'People on the Moon' }, { at: '1990', text: 'Space telescope' }, { at: '2021', text: 'A helicopter on Mars' }], { p, active: 3 }) },
  'timelineAxis.vertical': { about: 'the same, down the left side: a row per event, more room for words',
    demo: (ctx, p) => timelineAxis(ctx, 130, 470, 800, [{ at: '1903', text: 'First powered flight' }, { at: '1969', text: 'People on the Moon' }, { at: '1990', text: 'A telescope in orbit' }, { at: '2021', text: 'A helicopter on Mars' }], { p, active: 3, vertical: true, rowH: 165 }) },
  flowChain: { about: 'a process as boxes joined by arrows, stacked for 9:16; a dot keeps travelling along',
    demo: (ctx, p, t) => flowChain(ctx, 150, 430, 780, [{ label: 'Sunlight', sub: 'energy arrives', icon: 'sun' }, { label: 'Leaf', sub: 'catches it', icon: 'leaf' }, { label: 'Sugar', sub: 'stores it', icon: 'candy' }, { label: 'Growth', sub: 'spends it', icon: 'sprout' }], { p, active: 1, t }) },
  'flowChain.right': { about: 'the same in a row, for two to four short steps',
    demo: (ctx, p, t) => flowChain(ctx, 90, 640, 900, [{ label: 'Input', icon: 'keyboard' }, { label: 'Think', icon: 'brain' }, { label: 'Output', icon: 'monitor' }], { p, dir: 'right', active: 1, t }) },
  labelPointer: { about: 'labels that point at parts of a picture: target dot, elbowed leader, label on a plate',
    demo: (ctx, p, t) => {
      const cx = 420, cy = 800, a = clamp(p * 3);
      ring(ctx, cx, cy, 300, COL.subject, 6, a); dot(ctx, cx, cy, 296, rgba(COL.subject, 0.08), a);
      ring(ctx, cx, cy, 190, COL.data, 6, a); dot(ctx, cx, cy, 186, rgba(COL.data, 0.1), a);
      dot(ctx, cx, cy, 90, COL.accent, a * 0.9);
      labelPointer(ctx, cx + 240, cy - 160, 760, 520, 'CRUST', { p: stagger(p, 0, 3, 0.5), color: 'subject', t });
      labelPointer(ctx, cx + 150, cy + 60, 780, 860, 'MANTLE', { p: stagger(p, 1, 3, 0.5), color: 'data', t });
      labelPointer(ctx, cx + 30, cy + 40, 700, 1120, 'CORE', { p: stagger(p, 2, 3, 0.5), color: 'accent', t });
    } },
};

/* `render.js <video> catalog` boots the page in this mode: one scene that draws whichever demo
   window.CATALOG_NOW = { name, p, t } names, with no captions and no progress bar */
function setupCatalog() {
  DATA.words = []; DATA.takes = []; DATA.beats = [{ id: 'catalog', title: 'Catalog', t0: 0, t1: 4 }];
  DATA.meta = { duration: 4 }; DATA.dur = 4; CAPS = [];
  addScene('catalog', function (ctx, t) {
    const c = window.CATALOG_NOW, b = c && BLOCK_CATALOG[c.name];
    if (b) b.demo(ctx, c.p == null ? 1 : c.p, c.t == null ? t : c.t);
  });
}
