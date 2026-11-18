'use strict';
/* =====================================================================
   overlays.js — graphics drawn on top of a picture, a film clip or a 3D
   world: a number that counts up, a ring that fills, a label pinned to
   something in the picture, a hand-drawn circle or arrow, a spotlight, a
   stamp, a name tag.

   Each one
     - reads on any picture: white or a colour role, with a soft dark shadow;
     - builds in with o.p from 0 to 1 — key it to the word that introduces it:
         bigNumber(ctx, 200000000, CX, 760, { p: tw(t, c.lives, c.lives + 1.2, E.lin), label: 'lives saved' })
     - takes colour roles ('accent', 'alert', 'good', 'subject', 'ink'), never values;
     - is a pure function of its arguments, like everything a scene draws.

   Pin an overlay to something in a picture with the box photo() returns:
       const at = photo(ctx, lab, p, { move: 'in' });
       circleIt(ctx, ...at.at(0.62, 0.41), 120, 90, { p: tw(t, c.mould, c.mould + 0.6) });
   ===================================================================== */

/* the share of a group's build-in that belongs to item i of n: items start one after another
   and overlap (spread 0: all together; towards 1: strictly one after another) */
function stagger(p, i, n, spread = 0.55) {
  if (n <= 1) return clamp(p);
  return clamp((p - (spread * i) / (n - 1)) / (1 - spread));
}
/* a number as text: thousands separators (o.sep: false for years), prefix and suffix; decimals
   from o.decimals, else from the final value o.of (a count-up to 3.5 shows 0.0, 0.1 … 3.5) */
function numText(v, o = {}) {
  const ref = o.of == null ? v : o.of;
  const d = o.decimals != null ? o.decimals : Math.abs(ref % 1) > 1e-9 ? Math.min(2, (String(ref).split('.')[1] || '').length) : 0;
  const s = o.sep === false ? Number(v).toFixed(d) : Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  return (o.prefix || '') + s + (o.suffix || '');
}

const _oc = (c, fallback) => (c == null ? fallback : COL[c] || c);
const _op = (o) => (o.p == null ? 1 : clamp(o.p));
/* draw fn() with the soft drop shadow that keeps overlays readable on any picture */
function _shadow(ctx, k, fn, blur = 26) {
  ctx.save();
  ctx.shadowColor = `rgba(0,0,0,${(0.8 * k).toFixed(3)})`; ctx.shadowBlur = blur; ctx.shadowOffsetY = Math.round(blur * 0.22);
  fn();
  ctx.restore();
}

/* One big number that counts up from o.from (0) as p goes 0 → 1, popping in as it starts.
   o: size (230; shrinks to fit maxW 920), color ('ink'), prefix, suffix, decimals, sep, label (a
   line under it), labelColor, count (false: no count-up, just the value), t + hit (a punch when
   it lands). Returns its box. */
function bigNumber(ctx, value, x, y, o = {}) {
  const p = _op(o);
  if (p <= 0) return null;
  const from = o.from || 0, v = o.count === false ? value : lerp(from, value, E.out3(clamp(p / 0.8)));
  const str = numText(o.count === false ? value : (Math.abs(value) >= 100 ? Math.round(v) : v), Object.assign({ of: value }, o));
  const weight = 900, family = F.disp;
  const size = Math.min(o.size || 230, fitSize(ctx, numText(value, o), o.maxW || 920, o.size || 230, weight, family));
  const pop = E.outBack(clamp(p / 0.25)), a = clamp(p / 0.12);
  const s = lerp(0.6, 1, pop) * (o.t != null && o.hit != null ? punch(o.t, o.hit, 0.07, 0.4) : 1);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  _shadow(ctx, a, () => text(ctx, str, 0, size * 0.36, { size, weight, family, color: _oc(o.color, COL.ink), align: 'center', alpha: a, ls: -size * 0.02 }), 34);
  if (o.label) {
    const ls = Math.round(size * 0.24), la = clamp((p - 0.35) / 0.3);
    _shadow(ctx, la, () => text(ctx, o.label, 0, size * 0.36 + ls * 1.5, { size: ls, weight: 800, family, color: _oc(o.labelColor, COL.ink), align: 'center', alpha: la }));
  }
  ctx.restore();
  const w = measure(ctx, str, size, weight, family);
  return { x: x - w / 2, y: y - size * 0.5, w, h: size * (o.label ? 1.5 : 1) };
}

/* A ring that fills to a share (0..1) while a value counts up inside — a timer, a dose, a
   level. o: p, color ('accent'), thick (r × 0.14), show (the text inside: a function of the
   share, e.g. (k) => numText(k * 0.3, { decimals: 1, suffix: ' s' }); default a percentage),
   label (under the ring), ticks (number of tick marks round it; 0 for none). Returns the tip. */
function ringGauge(ctx, cx, cy, r, value, o = {}) {
  const p = _op(o);
  if (p <= 0) return null;
  const col = _oc(o.color, COL.accent), th = o.thick || r * 0.14, a = clamp(p / 0.15), e = E.io3(clamp(p / 0.85)), k = clamp(value) * e;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.beginPath(); ctx.arc(cx, cy, r + th * 0.75, 0, TAU); ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = th; ctx.stroke();
  const ticks = o.ticks == null ? 60 : o.ticks;
  for (let i = 0; i < ticks; i++) {
    const ang = -Math.PI / 2 + (TAU * i) / ticks, big = i % 5 === 0, r0 = r - th * 0.5 - 10, r1 = r0 - (big ? 22 : 11);
    line(ctx, cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0, cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1, i / ticks <= k ? col : 'rgba(255,255,255,0.35)', big ? 4 : 2.5);
  }
  const a1 = -Math.PI / 2 + TAU * k, tip = [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r];
  if (k > 0.002) {
    ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, a1); ctx.strokeStyle = col; ctx.lineWidth = th; ctx.lineCap = 'round'; ctx.stroke();
    ctx.restore();
    dot(ctx, tip[0], tip[1], th * 0.34, '#FFFFFF');
  }
  ctx.restore();
  const str = o.show ? o.show(k) : numText(k * 100, { suffix: '%', decimals: 0 });
  const size = Math.min(o.size || r * 0.52, fitSize(ctx, o.show ? o.show(clamp(value)) : '100%', r * 1.45, o.size || r * 0.52, 900, F.disp));
  _shadow(ctx, a, () => text(ctx, str, cx, cy + size * 0.36 - (o.label ? size * 0.16 : 0), { size, weight: 900, family: F.disp, color: COL.ink, align: 'center', alpha: a }));
  if (o.label) _shadow(ctx, a, () => text(ctx, o.label, cx, cy + size * 0.36 + size * 0.42, { size: Math.round(size * 0.3), weight: 700, family: F.disp, color: COL.ink, align: 'center', alpha: clamp((p - 0.3) / 0.3) }));
  return tip;
}

/* A label pinned to a point of the picture: a dot on the target, a leader line, the label on a
   dark plate. (tx, ty): the target; (lx, ly): where the label sits (its near edge). Builds in
   that order with o.p. o: color ('accent'), size (40), t (the target dot breathes), plate
   (false: the text alone, shadowed). Returns the label's box. */
function pointer(ctx, tx, ty, lx, ly, label, o = {}) {
  const p = _op(o), col = _oc(o.color, COL.accent), size = o.size || 40;
  if (p <= 0) return null;
  const kd = E.outBack(clamp(p * 4)), kl = E.io3(clamp((p - 0.15) / 0.45)), kp = E.out3(clamp((p - 0.5) / 0.5));
  const right = lx >= tx, kx = lx + (right ? -30 : 30);
  _shadow(ctx, 1, () => {
    if (kd > 0) {
      dot(ctx, tx, ty, 15 * kd, '#FFFFFF');
      dot(ctx, tx, ty, 10 * kd, col);
      ring(ctx, tx, ty, (24 + (o.t != null ? 3 * Math.sin(o.t * 5) : 0)) * kd, '#FFFFFF', 3.5, 0.85);
    }
    polyline(ctx, [[tx, ty], [kx, ly], [lx, ly]], '#FFFFFF', 4.5, kl);
  }, 14);
  const weight = 800, family = F.disp, tw0 = measure(ctx, label, size, weight, family), pad = size * 0.5, ph = size * 1.55, pw = tw0 + pad * 2;
  const x0 = right ? lx : lx - pw, slide = (1 - kp) * 18 * (right ? -1 : 1);
  if (kp > 0) {
    ctx.save(); ctx.globalAlpha *= kp; ctx.translate(slide, 0);
    if (o.plate !== false) {
      _shadow(ctx, 0.8, () => fillRR(ctx, x0, ly - ph / 2, pw, ph, ph * 0.22, 'rgba(12,12,16,0.82)'), 20);
      fillRR(ctx, right ? x0 : x0 + pw - 9, ly - ph / 2, 9, ph, 4, col);
      text(ctx, label, x0 + pw / 2 + (right ? 4 : -4), ly + size * 0.36, { size, weight, family, color: '#FFFFFF', align: 'center' });
    } else {
      _shadow(ctx, 1, () => text(ctx, label, right ? lx : lx, ly + size * 0.36, { size, weight, family, color: '#FFFFFF', align: right ? 'left' : 'right' }));
    }
    ctx.restore();
  }
  return { x: x0, y: ly - ph / 2, w: pw, h: ph };
}

/* A hand-drawn ellipse drawing itself round something in the picture. o: p, color ('alert'),
   lw (10), seed, turns (1.12: the stroke overshoots its start, as a quick pen circle does). */
function circleIt(ctx, x, y, rx, ry, o = {}) {
  const p = _op(o);
  if (p <= 0) return;
  const s = o.seed || 1, turns = o.turns || 1.12, n = 64, pts = [], a0 = -2.2 + hash(s) * 0.6;
  for (let i = 0; i <= n; i++) {
    const u = i / n, ang = a0 + u * turns * TAU, wob = 1 + (hash(s * 7.1 + Math.floor(u * 9)) - 0.5) * 0.05 + 0.04 * u;
    pts.push([x + Math.cos(ang) * rx * wob, y + Math.sin(ang) * ry * wob]);
  }
  _shadow(ctx, 0.9, () => polyline(ctx, pts, _oc(o.color, COL.alert), o.lw || 10, E.out3(p)), 16);
}

/* A hand-drawn arrow from (x0, y0) to (x1, y1), bending to one side (o.bend: −0.5..0.5, 0.22),
   drawing itself on with o.p; the head lands at the end. o: color ('accent'), lw (11). */
function arrowTo(ctx, x0, y0, x1, y1, o = {}) {
  const p = _op(o);
  if (p <= 0) return;
  const bend = o.bend == null ? 0.22 : o.bend, mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0;
  const cx = mx - dy * bend, cy = my + dx * bend, pts = [];
  for (let i = 0; i <= 40; i++) { const u = i / 40, v = 1 - u; pts.push([v * v * x0 + 2 * v * u * cx + u * u * x1, v * v * y0 + 2 * v * u * cy + u * u * y1]); }
  const col = _oc(o.color, COL.accent), lw = o.lw || 11, e = E.io3(p);
  _shadow(ctx, 0.9, () => {
    polyline(ctx, pts, col, lw, e);
    if (e > 0.9) {
      const [hx, hy] = pts[40], [px, py] = pts[36];
      arrowHead(ctx, hx, hy, Math.atan2(hy - py, hx - px), lw * 3.6, col, clamp((e - 0.9) / 0.1));
    }
  }, 16);
}

/* Darkens the picture except a soft circle round (x, y): draws the eye to one spot.
   o: p (fades it in), dark (0.62), soft (the width of the edge, r × 0.45). */
function spotlight(ctx, x, y, r, o = {}) {
  const p = _op(o), k = (o.dark == null ? 0.62 : o.dark) * E.io3(p);
  if (k <= 0.003) return;
  const g = ctx.createRadialGradient(x, y, r, x, y, r + (o.soft || r * 0.45));
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${k.toFixed(3)})`);
  ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}

/* A word stamped onto the frame at an angle — DENIED, 1928, FREE — slamming down as p starts, on a
   dark see-through plate so it reads on any picture. o: color ('alert'), size (120), angle
   (−0.14 rad), plate (0.5: the plate's darkness; 0 for none). */
function stamp(ctx, str, x, y, o = {}) {
  const p = _op(o);
  if (p <= 0) return;
  const col = _oc(o.color, COL.alert), size = o.size || 120, k = clamp(p / 0.18), s = lerp(2.4, 1, E.out3(k));
  const tw0 = measure(ctx, str, size, 900, F.disp, size * 0.04), bw = tw0 + size * 0.7, bh = size * 1.32;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.angle == null ? -0.14 : o.angle); ctx.scale(s, s); ctx.globalAlpha *= clamp(k * 1.6) * 0.94;
  const plate = o.plate == null ? 0.5 : o.plate;
  if (plate > 0) fillRR(ctx, -bw / 2, -bh / 2, bw, bh, size * 0.12, `rgba(0,0,0,${plate})`);
  _shadow(ctx, 0.7, () => { strokeRR(ctx, -bw / 2, -bh / 2, bw, bh, size * 0.12, col, size * 0.085); }, 18);
  strokeRR(ctx, -bw / 2 + size * 0.13, -bh / 2 + size * 0.13, bw - size * 0.26, bh - size * 0.26, size * 0.07, col, size * 0.03);
  _shadow(ctx, 0.7, () => text(ctx, str, 0, size * 0.36, { size, weight: 900, family: F.disp, color: col, align: 'center', ls: size * 0.04 }), 18);
  ctx.restore();
}

/* A person's (or a place's) name with a line under it — "Alexander Fleming", "London, 1928" —
   sliding in from the side on a dark plate. (x, y): the plate's left edge and centre line.
   o: p, color ('accent': the bar), size (52), align ('left' | 'right': x is then the right edge). */
function nameTag(ctx, name, sub, x, y, o = {}) {
  const p = _op(o);
  if (p <= 0) return null;
  const size = o.size || 52, ss = Math.round(size * 0.58), right = o.align === 'right';
  const w1 = measure(ctx, name, size, 800, F.disp), w2 = sub ? measure(ctx, sub, ss, 600, F.ui) : 0;
  const pad = size * 0.45, bar = 10, w = Math.max(w1, w2) + pad * 2 + bar, h = size * 1.15 + (sub ? ss * 1.45 : 0) + pad * 0.6;
  const e = E.out3(clamp(p / 0.6)), x0 = right ? x - w : x, dx = (1 - e) * 60 * (right ? 1 : -1);
  ctx.save(); ctx.globalAlpha *= clamp(p / 0.3); ctx.translate(dx, 0);
  ctx.beginPath(); ctx.rect(x0 - 2, y - h / 2 - 2, (w + 4) * E.out3(clamp(p / 0.45)), h + 4); ctx.clip();
  _shadow(ctx, 0.8, () => fillRR(ctx, x0, y - h / 2, w, h, 12, 'rgba(12,12,16,0.8)'), 20);
  fillRR(ctx, right ? x0 + w - bar : x0, y - h / 2, bar, h, 4, _oc(o.color, COL.accent));
  const tx = right ? x0 + w - bar - pad : x0 + bar + pad, al = right ? 'right' : 'left', top = y - h / 2 + pad * 0.3;
  text(ctx, name, tx, top + size * 0.95, { size, weight: 800, family: F.disp, color: '#FFFFFF', align: al });
  if (sub) text(ctx, sub, tx, top + size * 1.08 + ss * 1.05, { size: ss, weight: 600, family: F.ui, color: 'rgba(255,255,255,0.78)', align: al });
  ctx.restore();
  return { x: x0, y: y - h / 2, w, h };
}
