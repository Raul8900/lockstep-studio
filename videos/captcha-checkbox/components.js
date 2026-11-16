'use strict';
/* =====================================================================
   components.js (captcha-checkbox) — drawing code shared by this video's
   scenes: the checkbox widget, the cursor and its paths, the bell-shaped
   speed curve, data labels, the score scale, the puzzle icon, the browser
   window, the cookie, and the on-screen caveat stamp.

   Every function is a pure function of its arguments: no Math.random(),
   no Date, no state carried from one frame to the next.
   ===================================================================== */

/* ---------- the checkbox -------------------------------------------------
   cx, cy = centre; s = side length; p = tick progress 0..1 (mint);
   hot = 0..1 cyan highlight; spin = loading-arc phase in turns (0 = none). */
function drawBox(ctx, cx, cy, s, o = {}) {
  const { p = 0, hot = 0, alpha = 1, spin = 0, color = COL.cyan, tickColor = COL.mint } = o;
  withAlpha(ctx, alpha, () => {
    const x = cx - s / 2, y = cy - s / 2, r = s * 0.14;
    if (hot > 0.01) glow(ctx, cx, cy, s * 1.1, COL.cyan, 0.32 * hot);
    fillRR(ctx, x, y, s, s, r, rgba(COL.panel, 0.95));
    strokeRR(ctx, x, y, s, s, r, rgba(color, 0.55 + 0.45 * hot), 4 + 2 * hot);
    if (spin > 0 && p < 0.99) {
      ctx.save();
      ctx.strokeStyle = rgba(COL.cyan, 0.9); ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(cx, cy, s * 0.2, spin * TAU, spin * TAU + 1.7 * (1 - p)); ctx.stroke();
      ctx.restore();
    }
    check(ctx, cx, cy + s * 0.02, s * 0.56, tickColor, p, s * 0.075);
  });
}

/* the "I'm not a robot" widget: a dark panel, the box on the left, the label beside it.
   Returns the box centre so scenes can aim the cursor at it. */
function drawWidget(ctx, x, y, w, h, o = {}) {
  const { p = 0, hot = 0, spin = 0, label = "I'M NOT A ROBOT", alpha = 1, boxS = 120 } = o;
  const cx = x + 30 + boxS / 2, cy = y + h / 2;
  withAlpha(ctx, alpha, () => {
    panel(ctx, x, y, w, h, { r: 28, accent: COL.cyan, accentA: 0.35 + 0.5 * hot });
    drawBox(ctx, cx, cy, boxS, { p, hot, spin });
    text(ctx, label, x + 30 + boxS + 36, cy, { size: 42, weight: 800, family: F.ui, color: COL.white, align: 'left', base: 'middle' });
  });
  return { cx, cy };
}

/* ---------- the cursor ---------------------------------------------------- */
const CURSOR_SHAPE = [[0, 0], [0, 27], [6.2, 21.2], [11.2, 31.6], [15.4, 29.6], [10.6, 19.4], [18.4, 19.4]];
/* arrow pointer; (x, y) is its tip */
function drawCursor(ctx, x, y, s = 1.2, alpha = 1) {
  withAlpha(ctx, alpha, () => {
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(CURSOR_SHAPE[0][0], CURSOR_SHAPE[0][1]);
    for (let i = 1; i < CURSOR_SHAPE.length; i++) ctx.lineTo(CURSOR_SHAPE[i][0], CURSOR_SHAPE[i][1]);
    ctx.closePath();
    ctx.fillStyle = '#081018'; ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2 / s; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
  });
}

/* a hand's reach from A to B: a bent curve with small, deterministic irregularities.
   It is not a ruler line, and it is not random: the same arguments always give the same path. */
function handPath(ax, ay, bx, by, o = {}) {
  const { bend = 0.2, wob = 9, n = 140 } = o;
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const c1x = ax + dx * 0.3 + nx * L * bend, c1y = ay + dy * 0.3 + ny * L * bend;
  const c2x = ax + dx * 0.72 - nx * L * bend * 0.35, c2y = ay + dy * 0.72 - ny * L * bend * 0.35;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, v = 1 - u;
    const x = v * v * v * ax + 3 * v * v * u * c1x + 3 * v * u * u * c2x + u * u * u * bx;
    const y = v * v * v * ay + 3 * v * v * u * c1y + 3 * v * u * u * c2y + u * u * u * by;
    const w = wob * Math.sin(Math.PI * u) * (0.65 * Math.sin(u * 41) + 0.35 * Math.sin(u * 17 + 1.3));
    pts.push([x + nx * w, y + ny * w]);
  }
  return pts;
}

/* ---------- speed against time ---------------------------------------------
   A reaching hand's speed is bell-shaped: slow, fast, slow (the minimum-jerk
   profile of Flash and Hogan, 1985). Normalised so its peak is 1.            */
const bellV = (u) => (30 * u * u * (1 - u) * (1 - u)) / 1.875;
const steadyV = () => 0.7;                       // one steady speed, drawn flat
/* points of a speed curve f(u), u = 0..1, drawn in a box with base (x0, y0), width w, height h */
function speedPts(f, x0, y0, w, h, n = 160) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const u = i / n; pts.push([x0 + u * w, y0 - h * f(u)]); }
  return pts;
}
function speedAxes(ctx, x0, y0, w, h, p = 1, alpha = 1) {
  if (p <= 0) return;
  withAlpha(ctx, alpha, () => {
    line(ctx, x0, y0, x0 + w * clamp(p), y0, rgba(COL.lineHi, 0.85), 3);
    line(ctx, x0, y0, x0, y0 - (h + 40) * clamp(p), rgba(COL.lineHi, 0.85), 3);
  });
}

/* ---------- labels --------------------------------------------------------- */
/* a data label (signals, data families): violet by default; p = appear progress */
function dataTag(ctx, str, x, y, p, color = COL.violet, size = 26) {
  if (p <= 0) return;
  const e = E.out3(clamp(p));
  pill(ctx, str, x, y + (1 - e) * 22, { bg: rgba(color, 0.2), color: COL.white, size, stroke: rgba(color, 0.85), alpha: e });
}
/* an on-screen caveat: what is reported, what is not confirmed, what is a simulation */
function caveat(ctx, str, cx, cy, p, color = COL.coral) {
  if (p <= 0) return;
  withAlpha(ctx, clamp(p), () => {
    const w = measure(ctx, str, 24, 700, F.mono, 2.5) + 44;
    strokeRR(ctx, cx - w / 2, cy - 23, w, 46, 23, rgba(color, 0.9), 2.5);
    tag(ctx, str, cx, cy + 8, { align: 'center', color: color, size: 24 });
  });
}

/* ---------- the score scale -------------------------------------------------
   0 at the left, 1 at the right. Coral (bot) to mint (good interaction).      */
const SCALE = { x0: 150, x1: 930, y: 760 };
const scaleX = (v) => SCALE.x0 + (SCALE.x1 - SCALE.x0) * clamp(v);
function scaleBar(ctx, p = 1, alpha = 1) {
  if (p <= 0) return;
  withAlpha(ctx, alpha * clamp(p), () => {
    const gr = ctx.createLinearGradient(SCALE.x0, 0, SCALE.x1, 0);
    gr.addColorStop(0, rgba(COL.coral, 0.9));
    gr.addColorStop(0.5, rgba(COL.lineHi, 0.9));
    gr.addColorStop(1, rgba(COL.mint, 0.95));
    fillRR(ctx, SCALE.x0, SCALE.y - 12, SCALE.x1 - SCALE.x0, 24, 12, gr);
  });
}
function needle(ctx, v, color = COL.white, alpha = 1) {
  const x = scaleX(v);
  withAlpha(ctx, alpha, () => {
    line(ctx, x, SCALE.y - 74, x, SCALE.y + 74, color, 5);
    dot(ctx, x, SCALE.y, 16, color);
    glow(ctx, x, SCALE.y, 90, '#FFFFFF', 0.35);
  });
}

/* ---------- the puzzle --------------------------------------------------------
   A 3 x 3 image-puzzle sheet with its top-right piece missing. */
function puzzleIcon(ctx, cx, cy, s, p, color = COL.coral) {
  if (p <= 0) return;
  withAlpha(ctx, clamp(p), () => {
    const g = s / 3, x0 = cx - s / 2, y0 = cy - s / 2;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const x = x0 + c * g + 5, y = y0 + r * g + 5;
      if (r === 0 && c === 2) {
        ctx.save(); ctx.setLineDash([9, 8]);
        strokeRR(ctx, x, y, g - 10, g - 10, 12, rgba(color, 0.7), 3);
        ctx.restore();
        continue;
      }
      fillRR(ctx, x, y, g - 10, g - 10, 12, rgba(color, 0.16));
      strokeRR(ctx, x, y, g - 10, g - 10, 12, rgba(color, 0.85), 3);
    }
  });
}

/* ---------- the browser window -------------------------------------------------
   Flat window: a tab bar with three dots, an address bar, and a column of history rows.
   hist = 0..1: how many rows are lit. */
function browserWin(ctx, x, y, w, h, p = 1, o = {}) {
  const { hist = 1, color = COL.violet, rowAlpha = 1, scroll = 0 } = o;
  if (p <= 0) return;
  withAlpha(ctx, clamp(p), () => {
    panel(ctx, x, y, w, h, { r: 22, accent: color, accentA: 0.75 });
    fillRR(ctx, x + 2, y + 2, w - 4, 58, 20, rgba(color, 0.2));
    dot(ctx, x + 36, y + 31, 9, rgba(COL.coral, 0.9));
    dot(ctx, x + 62, y + 31, 9, rgba(COL.amber, 0.9));
    dot(ctx, x + 88, y + 31, 9, rgba(COL.mint, 0.9));
    fillRR(ctx, x + 26, y + 78, w - 52, 42, 14, rgba(COL.lineHi, 0.55));
    /* history rows scroll slowly up inside the list area and wrap, so they never leave the window */
    const span = h - 180;
    for (let i = 0; i < 9; i++) {
      const off = ((i * 62 - scroll) % span + span) % span;
      if (off > span - 34) continue;
      const ry = y + 150 + off;
      const a = clamp(hist * 6 - i) * rowAlpha;
      if (a <= 0) continue;
      withAlpha(ctx, a, () => {
        dot(ctx, x + 46, ry, 9, rgba(color, 0.9));
        fillRR(ctx, x + 72, ry - 12, (w - 150) * (0.55 + 0.4 * hash(i + 3)), 24, 10, rgba(COL.dim, 0.45));
      });
    }
  });
}

/* ---------- the cookie ---------------------------------------------------------
   A round biscuit with chocolate chips. The name is printed under it by the scene. */
function cookieIcon(ctx, cx, cy, r, p, color = COL.violet) {
  if (p <= 0) return;
  withAlpha(ctx, clamp(p), () => {
    glow(ctx, cx, cy, r * 2.2, COL.violet, 0.5);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU);
    ctx.fillStyle = rgba(COL.violet, 0.28); ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = rgba(color, 0.95); ctx.stroke();
    const chips = [[-0.42, -0.2], [0.1, -0.42], [0.38, 0.05], [-0.1, 0.1], [0.18, 0.42], [-0.5, 0.36]];
    for (const [u, v] of chips) dot(ctx, cx + u * r, cy + v * r, r * 0.11, COL.white, 0.9);
  });
}

/* ---------- people as dots ---------------------------------------------------
   One small square per participant, lit row by row. lit = 0..1. */
function dotField(ctx, x0, y0, w, h, cols, rows, lit, color = COL.amber) {
  const cw = w / cols, rh = h / rows, n = cols * rows, on = clamp(lit) * n;
  for (let k = 0; k < n; k++) {
    const r = Math.floor(k / cols), c = k % cols;
    const a = clamp(on - k);
    const x = x0 + c * cw + cw * 0.22, y = y0 + r * rh + rh * 0.22;
    ctx.fillStyle = a > 0 ? rgba(color, 0.35 + 0.6 * a) : rgba(COL.lineHi, 0.35);
    ctx.fillRect(x, y, cw * 0.56, rh * 0.56);
  }
}

/* a slow, large drift of soft light across the diagram zone. It keeps the frame moving through the
   pauses between sentences, so no stretch reads as frozen. A pure function of t. */
function ambient(ctx, t) {
  const breathe1 = 0.16 + 0.14 * Math.sin(t * 1.8);
  const breathe2 = 0.14 + 0.12 * Math.sin(t * 1.5 + 1.3);
  glow(ctx, 540 + 300 * Math.sin(t * 0.61), 880 + 110 * Math.cos(t * 0.43), 320, COL.cyan, breathe1);
  glow(ctx, 540 - 280 * Math.sin(t * 0.52), 700 + 90 * Math.sin(t * 0.37), 300, COL.violet, breathe2);
}

/* a simple person: a head and a rounded body, centred on (cx, cy) */
function personIcon(ctx, cx, cy, s, p, color = COL.white) {
  if (p <= 0) return;
  withAlpha(ctx, clamp(p), () => {
    ctx.beginPath(); ctx.arc(cx, cy - s * 0.42, s * 0.22, 0, TAU);
    ctx.fillStyle = rgba(color, 0.9); ctx.fill();
    fillRR(ctx, cx - s * 0.4, cy - s * 0.12, s * 0.8, s * 0.62, s * 0.36, rgba(color, 0.9));
  });
}
