'use strict';
/* =====================================================================
   backdrops.js — the backdrop library. style.json picks one:
       "backdrop": { "type": "aurora", "colors": ["subject", "data"], "strength": 1 }
   Every backdrop takes its colours from the palette (role names or hex),
   is a pure function of time, moves slowly, and has no fine animated
   texture — fast full-frame change costs bitrate and distracts.
   A video that needs something else defines window.drawBackdrop(ctx, t)
   in its own components.js.
   ===================================================================== */
const bdCol = (c, fallback) => (c ? (COL[c] || c) : fallback);
const _bdCache = {};

const BACKDROPS = {
  /* the original look: fog, drifting dot lattice, perspective floor, vertical traces */
  circuit: (ctx, t) => backdropCircuit(ctx, t),

  /* the gradient alone */
  solid(ctx) { backdropBase(ctx); backdropFlush(ctx); },

  /* large soft colour fields drifting slowly.  colors, strength (1), speed (1) */
  aurora(ctx, t, o) {
    const q = backdropBase(ctx);
    const cols = (o.colors || ['subject', 'data', 'accent']).map((c) => bdCol(c));
    const k = o.strength == null ? 1 : o.strength, sp = o.speed == null ? 1 : o.speed;
    for (let i = 0; i < 4; i++) {
      const x = 540 + 430 * Math.sin(t * 0.07 * sp + i * 1.9), y = 960 + 780 * Math.cos(t * 0.05 * sp + i * 2.4 + 1);
      glow(q, x / 4, y / 4, (720 + 160 * Math.sin(t * 0.09 * sp + i)) / 4, cols[i % cols.length], 0.17 * k);
    }
    backdropFlush(ctx);
  },

  /* paper: fixed grain and fibres, optional ruled lines, a slow drifting wash.  grain (1), lines (px, 0 = none), wash (role) */
  paper(ctx, t, o) {
    backdropBase(ctx); backdropFlush(ctx);
    let tex = _bdCache.paper;
    if (!tex) {
      tex = _bdCache.paper = makeCanvas(W / 2, H / 2);
      const g = tex.getContext('2d'), r = rng(77), ink = hexRGB(COL.white);
      for (let i = 0; i < 5200; i++) { g.fillStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},${0.02 + 0.05 * r()})`; g.fillRect(r() * W / 2, r() * H / 2, 1 + r() * 1.6, 1 + r() * 1.6); }
      g.lineWidth = 0.7;
      for (let i = 0; i < 520; i++) {
        const x = r() * W / 2, y = r() * H / 2, a = r() * TAU, l = 6 + r() * 22;
        g.strokeStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},${0.02 + 0.04 * r()})`;
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 3 * r(), y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
      }
    }
    ctx.save(); ctx.globalAlpha = o.grain == null ? 1 : o.grain; ctx.drawImage(tex, 0, 0, W, H); ctx.restore();
    if (o.lines) {
      ctx.fillStyle = rgba(bdCol(o.lineColor, COL.cyan), 0.16);
      for (let y = 300; y < H; y += o.lines) ctx.fillRect(0, y, W, 2);
    }
    glow(ctx, 540 + 320 * Math.sin(t * 0.08), 760 + 420 * Math.cos(t * 0.06), 900, bdCol(o.wash, COL.amber), 0.05);
  },

  /* graph paper / blueprint grid, drifting diagonally.  cell (54), color (role), strength (1) */
  grid(ctx, t, o) {
    backdropBase(ctx); backdropFlush(ctx);
    const cell = o.cell || 54, c = bdCol(o.color, COL.cyan), k = o.strength == null ? 1 : o.strength;
    const off = (t * 5) % (cell * 4);
    for (let i = -4; i * cell < W + cell * 4; i++) {
      const x = i * cell + off, major = ((i % 4) + 4) % 4 === 0;
      ctx.fillStyle = rgba(c, (major ? 0.15 : 0.06) * k); ctx.fillRect(x, 0, major ? 2 : 1, H);
    }
    for (let j = -4; j * cell < H + cell * 4; j++) {
      const y = j * cell + off, major = ((j % 4) + 4) % 4 === 0;
      ctx.fillStyle = rgba(c, (major ? 0.15 : 0.06) * k); ctx.fillRect(0, y, W, major ? 2 : 1);
    }
  },

  /* field of dots whose size follows a slow wave (print / comic feel).  spacing (38), color (role), strength (1) */
  halftone(ctx, t, o) {
    backdropBase(ctx); backdropFlush(ctx);
    const sp = o.spacing || 38, c = bdCol(o.color, COL.cyan), k = o.strength == null ? 1 : o.strength;
    ctx.fillStyle = rgba(c, 0.2 * k);
    ctx.beginPath();
    for (let j = 0; j * sp < H + sp; j++) for (let i = 0; i * sp < W + sp; i++) {
      const x = i * sp + (j % 2) * sp / 2, y = j * sp;
      const r = 1.5 + 7.5 * (0.5 + 0.5 * Math.sin(x * 0.0055 + y * 0.004 + t * 0.45)) * (0.35 + 0.65 * y / H);
      ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU);
    }
    ctx.fill();
  },

  /* a dark stage: one spotlight from above, a pool of light on the floor, drifting dust.  color (role), strength (1) */
  stage(ctx, t, o) {
    const q = backdropBase(ctx);
    const c = bdCol(o.color, COL.white), k = o.strength == null ? 1 : o.strength, br = 1 + 0.06 * Math.sin(t * 0.7);
    glow(q, 540 / 4, 120 / 4, 1500 / 4 * br, c, 0.14 * k);
    glow(q, 540 / 4, 820 / 4, 760 / 4 * br, c, 0.1 * k);
    q.save(); q.translate(540 / 4, 1260 / 4); q.scale(1, 0.24); glow(q, 0, 0, 640 / 4, c, 0.3 * k); q.restore();
    backdropFlush(ctx);
    for (let i = 0; i < 26; i++) {
      const x = 540 + (hash(i * 3.1) - 0.5) * 900 + 30 * Math.sin(t * 0.3 + i), y = ((hash(i * 7.7) * 1500 - t * (8 + 14 * hash(i))) % 1500 + 1500) % 1500 + 150;
      dot(ctx, x, y, 1.5 + 2.5 * hash(i * 1.3), c, 0.12 * k * (0.4 + 0.6 * Math.sin(t * 0.9 + i * 2) ** 2));
    }
  },

  /* slowly turning rays from one point (poster / retro).  color (role), cy (900), rays (14), strength (1) */
  sunburst(ctx, t, o) {
    backdropBase(ctx); backdropFlush(ctx);
    const n = o.rays || 14, cx = 540, cy = o.cy || 900, R = 2400, c = bdCol(o.color, COL.amber), k = o.strength == null ? 1 : o.strength;
    ctx.fillStyle = rgba(c, 0.09 * k);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a0 = t * 0.03 + i * TAU / n, a1 = a0 + TAU / n / 2;
      ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(a0), cy + R * Math.sin(a0)); ctx.lineTo(cx + R * Math.cos(a1), cy + R * Math.sin(a1)); ctx.closePath();
    }
    ctx.fill();
  },

  /* flat, hard-edged shapes drifting (cut-paper / flat illustration).  colors, strength (1) */
  blobs(ctx, t, o) {
    backdropBase(ctx); backdropFlush(ctx);
    const cols = (o.colors || ['subject', 'accent', 'data']).map((c) => bdCol(c)), k = o.strength == null ? 1 : o.strength;
    for (let i = 0; i < 7; i++) {
      const x = 540 + (hash(i * 2.3) - 0.5) * 1100 + 60 * Math.sin(t * 0.11 + i * 1.7);
      const y = 200 + hash(i * 5.9) * 1600 + 80 * Math.cos(t * 0.09 + i * 2.2);
      dot(ctx, x, y, 170 + 190 * hash(i * 9.4), mixHex(COL.bgMid, cols[i % cols.length], 0.16 * k, 1));
    }
  },
};
