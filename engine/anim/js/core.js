'use strict';
/* =====================================================================
   core.js — constants, maths, easing, colour, drawing primitives, 2.5D
   projection. Everything here is pure: output depends only on arguments,
   so any frame can be rendered independently by any worker.
   ===================================================================== */

const W = 1080, H = 1920, FPS = 30;
const TAU = Math.PI * 2;

/* Safe areas for Reels / Shorts interface overlays. Essential content stays inside SAFE and
   left of RIGHT_COL below RIGHT_COL_Y; captions live in CAP. */
const SAFE = { l: 70, r: 1010, t: 270, b: 1470 };
const RIGHT_COL = 890, RIGHT_COL_Y = 1000;
const CONTENT = { x: 70, y: 372, w: 940, h: 838 };   // main diagram zone
const CX = 540;

const COL = {
  bg0: '#04060A', bg1: '#080C13', bg2: '#0B111B',
  panel: '#0D141F', panelHi: '#152032', line: '#24364E', lineHi: '#3A5578',
  white: '#F3F8FF', text: '#DCE6F3', dim: '#8494AC', faint: '#44566E',
  cyan: '#27E1FF', violet: '#A073FF', amber: '#FFA91E', coral: '#FF5F70', mint: '#4DFFB5',
  cyanDeep: '#0B6E86', violetDeep: '#4B2FA0', amberDeep: '#8A5A08',
};
const F = { disp: 'Inter Display', ui: 'Inter', mono: 'JetBrains Mono' };
/* CSS font shorthand with fallbacks, so a missing family degrades instead of dropping to a serif */
const fontCSS = (weight, size, family) => `${weight} ${size}px "${family}", ${family === F.mono ? '"DejaVu Sans Mono", monospace' : '"Inter", "DejaVu Sans", sans-serif'}`;

/* ---------- maths ---------- */
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => (b === a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));
const smooth = (t) => t * t * (3 - 2 * t);
const E = {
  lin: (t) => t,
  in2: (t) => t * t,
  out2: (t) => 1 - (1 - t) * (1 - t),
  io2: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  in3: (t) => t * t * t,
  out3: (t) => 1 - Math.pow(1 - t, 3),
  io3: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out4: (t) => 1 - Math.pow(1 - t, 4),
  out5: (t) => 1 - Math.pow(1 - t, 5),
  io5: (t) => (t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2),
  inExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outBackSoft: (t) => { const c1 = 1.05, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outElastic: (t) => (t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1),
  ioSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
};
/* tween: eased progress of t through [a,b] */
const tw = (t, a, b, e = E.io3) => e(prog(t, a, b));
/* pulse: 0 -> 1 -> 0 around time c with attack/decay */
const pulse = (t, c, attack = 0.08, decay = 0.5) =>
  t < c - attack ? 0 : t < c ? (t - (c - attack)) / attack : Math.exp(-(t - c) / (decay / 3));
/* window: 1 inside [a,b] with soft edges */
const win = (t, a, b, fi = 0.25, fo = 0.25) => clamp((t - a) / fi) * clamp((b - t) / fo);

/* deterministic pseudo-random */
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123; return x - Math.floor(x); }
function hash2(a, b) { const x = Math.sin(a * 12.9898 + b * 78.233 + 4.1414) * 43758.5453123; return x - Math.floor(x); }
function rng(seed) {
  let s = seed >>> 0;
  return function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- colour ---------- */
const _hex = {};
function hexRGB(hex) {
  let c = _hex[hex];
  if (!c) { const n = parseInt(hex.slice(1), 16); c = _hex[hex] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  return c;
}
function rgba(hex, a = 1) { const c = hexRGB(hex); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
function mixHex(h1, h2, t, a = 1) {
  const A = hexRGB(h1), B = hexRGB(h2);
  return `rgba(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))},${a})`;
}

/* ---------- alpha-safe state helpers ---------- */
function withAlpha(ctx, a, fn) {
  if (a <= 0.002) return;
  ctx.save(); ctx.globalAlpha *= clamp(a); fn(); ctx.restore();
}
/* camera: zoom about (fx,fy) then pan */
function withCam(ctx, o, fn) {
  const { fx = CX, fy = H / 2, zoom = 1, dx = 0, dy = 0, rot = 0 } = o;
  ctx.save();
  ctx.translate(fx + dx, fy + dy);
  if (rot) ctx.rotate(rot);
  ctx.scale(zoom, zoom);
  ctx.translate(-fx, -fy);
  fn();
  ctx.restore();
}

/* ---------- primitives ---------- */
function rr(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function fillRR(ctx, x, y, w, h, r, fill) { rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); }
function strokeRR(ctx, x, y, w, h, r, stroke, lw = 2) { rr(ctx, x, y, w, h, r); ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }

/* standard dark glass panel */
function panel(ctx, x, y, w, h, o = {}) {
  const { r = 22, fill = rgba(COL.panel, 0.9), stroke = rgba(COL.lineHi, 0.55), lw = 2, accent = null, accentA = 0.9 } = o;
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  if (accent) {              // glowing edge in an accent colour
    rr(ctx, x, y, w, h, r);
    ctx.strokeStyle = rgba(accent, accentA); ctx.lineWidth = lw + 1; ctx.stroke();
  }
}

function setFont(ctx, size, weight = 600, family = F.ui) { ctx.font = fontCSS(weight, size, family); }
function text(ctx, str, x, y, o = {}) {
  const { size = 36, weight = 600, family = F.ui, color = COL.white, align = 'left', base = 'alphabetic',
    alpha = 1, ls = 0, stroke = null, strokeW = 0, maxW = undefined } = o;
  if (alpha <= 0.002) return 0;
  const ga = ctx.globalAlpha;
  ctx.globalAlpha = ga * clamp(alpha);
  ctx.font = fontCSS(weight, size, family);
  ctx.textAlign = align; ctx.textBaseline = base;
  ctx.letterSpacing = ls ? ls + 'px' : '0px';
  if (stroke) { ctx.lineJoin = 'round'; ctx.strokeStyle = stroke; ctx.lineWidth = strokeW; ctx.strokeText(str, x, y, maxW); }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y, maxW);
  const wdt = ctx.measureText(str).width;
  ctx.letterSpacing = '0px';
  ctx.globalAlpha = ga;
  return wdt;
}
function measure(ctx, str, size, weight = 600, family = F.ui, ls = 0) {
  ctx.font = fontCSS(weight, size, family);
  ctx.letterSpacing = ls ? ls + 'px' : '0px';
  const w = ctx.measureText(str).width;
  ctx.letterSpacing = '0px';
  return w;
}
/* small caps mono tag, e.g. "WARP SCHEDULER" */
function tag(ctx, str, x, y, o = {}) {
  return text(ctx, str, x, y, Object.assign({ size: 24, weight: 700, family: F.mono, color: COL.dim, ls: 2.5 }, o));
}
/* pill label with background */
function pill(ctx, str, x, y, o = {}) {
  const { size = 28, weight = 700, family = F.mono, color = COL.bg0, bg = COL.cyan, padX = 18, h = null, align = 'center',
    alpha = 1, ls = 1, r = null, stroke = null } = o;
  if (alpha <= 0.002) return 0;
  const wdt = measure(ctx, str, size, weight, family, ls) + padX * 2;
  const hh = h || Math.round(size * 1.62);
  const x0 = align === 'center' ? x - wdt / 2 : align === 'right' ? x - wdt : x;
  const ga = ctx.globalAlpha; ctx.globalAlpha = ga * clamp(alpha);
  rr(ctx, x0, y - hh / 2, wdt, hh, r == null ? hh / 2 : r);
  ctx.fillStyle = bg; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  ctx.globalAlpha = ga;
  text(ctx, str, x0 + wdt / 2, y + size * 0.36, { size, weight, family, color, align: 'center', alpha, ls });
  return wdt;
}

function line(ctx, x0, y0, x1, y1, color, lw = 2, alpha = 1, dash = null) {
  if (alpha <= 0.002) return;
  const ga = ctx.globalAlpha; ctx.globalAlpha = ga * clamp(alpha);
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.stroke();
  if (dash) ctx.setLineDash([]);
  ctx.globalAlpha = ga;
}
/* polyline drawn up to fraction p of its length */
function polyLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
function polyAt(pts, d) {
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (d <= seg || i === pts.length - 1) { const k = seg ? clamp(d / seg) : 0; return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]; }
    d -= seg;
  }
  return pts[pts.length - 1];
}
function polyline(ctx, pts, color, lw = 2, p = 1, alpha = 1, dash = null) {
  if (alpha <= 0.002 || p <= 0) return;
  const L = polyLen(pts), target = L * clamp(p);
  const ga = ctx.globalAlpha; ctx.globalAlpha = ga * clamp(alpha);
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc + seg <= target) { ctx.lineTo(pts[i][0], pts[i][1]); acc += seg; }
    else { const k = seg ? (target - acc) / seg : 0; ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)); break; }
  }
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.stroke();
  if (dash) ctx.setLineDash([]);
  ctx.globalAlpha = ga;
}

/* portion of a polyline between fractions p0..p1 of its length (moving trails) */
function polySeg(ctx, pts, color, lw, p0, p1, alpha = 1) {
  if (alpha <= 0.002 || p1 <= p0) return;
  const L = polyLen(pts), a = L * clamp(p0), b = L * clamp(p1);
  const ga = ctx.globalAlpha; ctx.globalAlpha = ga * clamp(alpha);
  ctx.beginPath();
  let acc = 0, started = false;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const s0 = acc, s1 = acc + seg;
    if (s1 >= a && s0 <= b && seg > 0) {
      const k0 = clamp((a - s0) / seg), k1 = clamp((b - s0) / seg);
      const x0 = lerp(pts[i - 1][0], pts[i][0], k0), y0 = lerp(pts[i - 1][1], pts[i][1], k0);
      const x1 = lerp(pts[i - 1][0], pts[i][0], k1), y1 = lerp(pts[i - 1][1], pts[i][1], k1);
      if (!started) { ctx.moveTo(x0, y0); started = true; }
      ctx.lineTo(x1, y1);
    }
    acc = s1;
  }
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.globalAlpha = ga;
}
function arrowHead(ctx, x, y, ang, size, color, alpha = 1) {
  if (alpha <= 0.002) return;
  const ga = ctx.globalAlpha; ctx.globalAlpha = ga * clamp(alpha);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - size * Math.cos(ang - 0.45), y - size * Math.sin(ang - 0.45));
  ctx.lineTo(x - size * Math.cos(ang + 0.45), y - size * Math.sin(ang + 0.45));
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  ctx.globalAlpha = ga;
}

/* additive glow sprite */
const _glow = {};
function glowSprite(hex) {
  if (!_glow[hex]) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, rgba(hex, 1)); gr.addColorStop(0.22, rgba(hex, 0.5));
    gr.addColorStop(0.55, rgba(hex, 0.13)); gr.addColorStop(1, rgba(hex, 0));
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    _glow[hex] = c;
  }
  return _glow[hex];
}
function glow(ctx, x, y, r, hex, a = 1) {
  if (a <= 0.003 || r <= 0) return;
  const ga = ctx.globalAlpha, op = ctx.globalCompositeOperation;
  ctx.globalAlpha = ga * clamp(a); ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(glowSprite(hex), x - r, y - r, 2 * r, 2 * r);
  ctx.globalCompositeOperation = op; ctx.globalAlpha = ga;
}
function dot(ctx, x, y, r, color, alpha = 1) {
  if (alpha <= 0.003) return;
  const ga = ctx.globalAlpha; ctx.globalAlpha = ga * clamp(alpha);
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = color; ctx.fill();
  ctx.globalAlpha = ga;
}
function ring(ctx, x, y, r, color, lw = 3, alpha = 1) {
  if (alpha <= 0.003 || r <= 0) return;
  const ga = ctx.globalAlpha; ctx.globalAlpha = ga * clamp(alpha);
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke();
  ctx.globalAlpha = ga;
}
/* checkmark / cross drawn with progress p */
function check(ctx, x, y, s, color, p = 1, lw = 10) {
  polyline(ctx, [[x - s * 0.5, y], [x - s * 0.12, y + s * 0.38], [x + s * 0.55, y - s * 0.42]], color, lw, p);
}
function cross(ctx, x, y, s, color, p = 1, lw = 10) {
  polyline(ctx, [[x - s, y - s], [x + s, y + s]], color, lw, clamp(p * 2));
  polyline(ctx, [[x + s, y - s], [x - s, y + s]], color, lw, clamp(p * 2 - 1));
}

/* number formatting */
const fmt = (n) => Math.round(n).toLocaleString('en-US');

/* text that fades + rises in */
function riseText(ctx, str, x, y, p, o = {}) {
  if (p <= 0) return;
  const e = E.out3(clamp(p));
  text(ctx, str, x, y + (1 - e) * (o.rise == null ? 26 : o.rise), Object.assign({}, o, { alpha: (o.alpha == null ? 1 : o.alpha) * e }));
}

/* ---------- 2.5D projection ----------
   World: x right, y "south" in the chip plane, z up out of the chip.
   yaw rotates about z, pitch tilts the plane away from the viewer.      */
class Proj {
  constructor(o) { this.set(o); }
  set(o) {
    this.cx = o.cx; this.cy = o.cy; this.scale = o.scale;
    this.yaw = o.yaw || 0; this.pitch = o.pitch || 0; this.k = o.k == null ? 0.00055 : o.k;
    this.cyaw = Math.cos(this.yaw); this.syaw = Math.sin(this.yaw);
    this.cp = Math.cos(this.pitch); this.sp = Math.sin(this.pitch);
    return this;
  }
  pt(x, y, z = 0) {
    const X = x * this.cyaw - y * this.syaw;
    const Y = x * this.syaw + y * this.cyaw;
    const depth = Y * this.sp + z * this.cp * 0.0;       // depth along view for perspective
    const s = this.scale / (1 - depth * this.k);
    return [this.cx + X * s, this.cy + (Y * this.cp - z * this.sp) * s, s];
  }
  quad(ctx, x0, y0, x1, y1, z = 0) {
    const a = this.pt(x0, y0, z), b = this.pt(x1, y0, z), c = this.pt(x1, y1, z), d = this.pt(x0, y1, z);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath();
  }
  /* extruded slab: draws the side faces that face the viewer, then the top */
  slab(ctx, x0, y0, x1, y1, z0, z1, top, side, edge = null, lw = 1.5) {
    const corners = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    const normals = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    for (let i = 0; i < 4; i++) {
      const n = normals[i];
      const ny = n[0] * this.syaw + n[1] * this.cyaw;      // rotated normal, +y faces viewer
      if (ny <= 0.001 || this.sp <= 0.001) continue;
      const p = corners[i], q = corners[(i + 1) % 4];
      const a = this.pt(p[0], p[1], z1), b = this.pt(q[0], q[1], z1), c = this.pt(q[0], q[1], z0), d = this.pt(p[0], p[1], z0);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath();
      ctx.fillStyle = typeof side === 'function' ? side(ny) : side; ctx.fill();
    }
    this.quad(ctx, x0, y0, x1, y1, z1);
    ctx.fillStyle = top; ctx.fill();
    if (edge) { ctx.strokeStyle = edge; ctx.lineWidth = lw; ctx.stroke(); }
  }
}
