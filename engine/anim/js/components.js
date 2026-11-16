'use strict';
/* =====================================================================
   components.js — reusable graphical components available to every video.
   Topic-specific components belong in the video's own components.js,
   which is loaded after this file and before the scenes.
   ===================================================================== */

/* small flat chip icon (top-down), used in diagrams */
function chipIcon(ctx, cx, cy, s, o = {}) {
  const { color = COL.cyan, label = '', power = 1, cells = 4, sub = '', pins = 7 } = o;
  const h = s / 2;
  /* pins */
  ctx.fillStyle = rgba(color, 0.45 * (0.4 + 0.6 * power));
  for (let i = 0; i < pins; i++) {
    const u = -h + s * (i + 0.5) / pins - s * 0.028;
    ctx.fillRect(cx + u, cy - h - s * 0.075, s * 0.056, s * 0.075); ctx.fillRect(cx + u, cy + h, s * 0.056, s * 0.075);
    ctx.fillRect(cx - h - s * 0.075, cy + u, s * 0.075, s * 0.056); ctx.fillRect(cx + h, cy + u, s * 0.075, s * 0.056);
  }
  glow(ctx, cx, cy, s * 1.05, color, 0.16 * power);
  rr(ctx, cx - h, cy - h, s, s, s * 0.09); ctx.fillStyle = COL.chip; ctx.fill();
  ctx.strokeStyle = rgba(color, 0.35 + 0.6 * power); ctx.lineWidth = Math.max(2, s * 0.012); ctx.stroke();
  const inner = s * 0.72, g = inner / cells, pad = g * 0.12;
  if (cells > 0) {
    for (let r = 0; r < cells; r++) for (let c = 0; c < cells; c++) {
      const L = o.cell ? o.cell(c, r) : 0.3;
      fillRR(ctx, cx - inner / 2 + c * g + pad, cy - inner / 2 + r * g + pad, g - 2 * pad, g - 2 * pad, Math.min(6, g * 0.14),
        mixHex(COL.cell, color, clamp(0.1 + 0.9 * L * power), 1));
    }
  }
  if (label) text(ctx, label, cx, cy + s * 0.11, { size: s * 0.3, weight: 900, family: F.disp, color: COL.white, align: 'center', alpha: 0.96, stroke: 'rgba(4,8,12,0.75)', strokeW: s * 0.05 });
  if (sub) text(ctx, sub, cx, cy + h + s * 0.2, { size: Math.max(22, s * 0.085), weight: 700, family: F.mono, color: COL.dim, align: 'center', ls: 2 });
}

/* ---------- lane bank: n vertical execution lanes ----------
   fn(i) -> {hex, base (0..1 idle brightness), head (0..1 pulse position or null),
             len (pulse length 0..1), a (alpha), masked (bool)}                    */
function drawLanes(ctx, x, y, w, h, n, fn, o = {}) {
  const { gap = 4, r = 5, group = 0, groupGap = 0 } = o;
  const groups = group ? Math.ceil(n / group) : 1;
  const lw = (w - gap * (n - 1) - groupGap * (groups - 1)) / n;
  for (let i = 0; i < n; i++) {
    const v = fn(i) || {};
    const hex = v.hex || COL.cyan, a = v.a == null ? 1 : v.a;
    if (a <= 0.003) continue;
    const gx = x + i * (lw + gap) + (group ? Math.floor(i / group) * groupGap : 0);
    const ga = ctx.globalAlpha; ctx.globalAlpha = ga * clamp(a);
    const base = v.base == null ? 0.16 : v.base;
    rr(ctx, gx, y, lw, h, Math.min(r, lw / 2));
    ctx.fillStyle = v.masked ? 'rgba(40,50,64,0.55)' : mixHex(COL.well, hex, 0.1 + 0.75 * base, 1); ctx.fill();
    if (v.masked) { ctx.strokeStyle = 'rgba(120,135,155,0.35)'; ctx.lineWidth = 1.2; ctx.stroke(); }
    if (v.head != null && !v.masked) {
      const len = (v.len == null ? 0.3 : v.len) * h;
      const hy = y + v.head * (h + len) - len;
      const y0 = Math.max(y, hy), y1 = Math.min(y + h, hy + len);
      if (y1 > y0) {
        const gr = ctx.createLinearGradient(0, hy, 0, hy + len);
        gr.addColorStop(0, rgba(hex, 0)); gr.addColorStop(0.75, rgba(hex, 0.95)); gr.addColorStop(1, rgba('#FFFFFF', 1));
        ctx.save(); rr(ctx, gx, y, lw, h, Math.min(r, lw / 2)); ctx.clip();
        ctx.fillStyle = gr; ctx.fillRect(gx, y0, lw, y1 - y0); ctx.restore();
      }
    }
    ctx.globalAlpha = ga;
  }
  return lw;
}
function laneX(x, w, n, i, gap = 4, group = 0, groupGap = 0) {
  const groups = group ? Math.ceil(n / group) : 1;
  const lw = (w - gap * (n - 1) - groupGap * (groups - 1)) / n;
  return x + i * (lw + gap) + (group ? Math.floor(i / group) * groupGap : 0) + lw / 2;
}

/* ---------- instruction chip ---------- */
function instr(ctx, label, cx, cy, o = {}) {
  const { w = 150, h = 56, color = COL.amber, alpha = 1, hot = 0, size = 30 } = o;
  if (alpha <= 0.003) return;
  const ga = ctx.globalAlpha; ctx.globalAlpha = ga * clamp(alpha);
  if (hot > 0) glow(ctx, cx, cy, w * 0.9, color, 0.5 * hot);
  rr(ctx, cx - w / 2, cy - h / 2, w, h, 12);
  ctx.fillStyle = mixHex(COL.token, color, 0.14 + 0.5 * hot, 1); ctx.fill();
  ctx.strokeStyle = rgba(color, 0.7 + 0.3 * hot); ctx.lineWidth = 2.5; ctx.stroke();
  ctx.globalAlpha = ga;
  text(ctx, label, cx, cy + size * 0.36, { size, weight: 800, family: F.mono, color: hot > 0.5 ? COL.white : color, align: 'center', alpha, ls: 1 });
}

/* ---------- callout: label with leader line ---------- */
function callout(ctx, x0, y0, x1, y1, p, color = COL.white) {
  if (p <= 0) return;
  polyline(ctx, [[x0, y0], [x1, y1]], rgba(color, 0.85), 2.5, E.out3(clamp(p)));
  dot(ctx, x0, y0, 6, color, clamp(p * 3));
}

/* ---------- section title block ---------- */
function titleBlock(ctx, title, sub, p, o = {}) {
  const { x = SAFE.l, y = 452, color = COL.white, size = 96, subSize = 38, align = 'left', subColor = COL.dim } = o;
  if (p <= 0) return;
  riseText(ctx, title, x, y, p, { size, weight: 900, family: F.disp, color, align, ls: -1 });
  if (sub) riseText(ctx, sub, x, y + subSize * 1.45, clamp(p * 1.3 - 0.3), { size: subSize, weight: 600, family: F.ui, color: subColor, align });
}

/* dense streaks for speed / data rush, pure function of time */
function streaks(ctx, t, o = {}) {
  const { n = 36, alpha = 1, seed = 0, color = COL.cyan, x0 = 0, x1 = W, y0 = -200, y1 = H + 200, minV = 2200, maxV = 4200, dir = 1, lw = 3 } = o;
  if (alpha <= 0.003) return;
  ctx.save(); ctx.globalCompositeOperation = STYLE.mode === 'light' ? 'source-over' : 'lighter';
  const span = y1 - y0;
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, hash(seed + i * 3.7));
    const v = lerp(minV, maxV, hash(seed + i * 9.1));
    const len = lerp(160, 520, hash(seed + i * 5.3));
    const ph = hash(seed + i * 1.9) * span;
    let y = (t * v + ph) % (span + len);
    y = dir > 0 ? y0 + y - len : y1 - y;
    const a = alpha * lerp(0.25, 0.9, hash(seed + i * 2.3));
    const gr = ctx.createLinearGradient(0, y, 0, y + len);
    const c = hash(seed + i * 6.6) > 0.72 ? (STYLE.mode === 'light' ? COL.white : '#FFFFFF') : color;
    if (dir > 0) { gr.addColorStop(0, rgba(c, 0)); gr.addColorStop(1, rgba(c, a)); }
    else { gr.addColorStop(0, rgba(c, a)); gr.addColorStop(1, rgba(c, 0)); }
    ctx.fillStyle = gr; ctx.fillRect(x - lw / 2, y, lw * lerp(0.5, 1.4, hash(seed + i * 4.4)), len);
  }
  ctx.restore();
}
