'use strict';
/* =====================================================================
   components.js (how-a-gpu-works) — components specific to this video:
   the GPU die in 2.5D and the top-down grid of compute units.
   ===================================================================== */

/* ---------- GPU chip in 2.5D ----------
   World units: package 600 x 600, portrait die with a 10 x 17 array of
   identical compute tiles (170, as on a GeForce RTX 5090).                */
const CHIP = { pk: 300, dieX: 176, dieY: 244, gx0: -152, gy0: -196, gw: 304, gh: 392, cols: 10, rows: 17, z: 12 };
function chipTile(c, r) {
  const tw = CHIP.gw / CHIP.cols, th = CHIP.gh / CHIP.rows;
  return [CHIP.gx0 + c * tw, CHIP.gy0 + r * th, tw, th];
}

function drawChip(ctx, P, t, o = {}) {
  const { power = 1, tile = null, pillars = null, accent = COL.cyan, detail = 1, pads = true } = o;
  const c0 = P.pt(0, 0, 0);
  glow(ctx, c0[0], c0[1] + 30 * P.scale, 620 * P.scale, accent, 0.2 * power);
  glow(ctx, c0[0], c0[1] + 60 * P.scale, 380 * P.scale, COL.violet, 0.1 * power);

  /* package substrate */
  P.slab(ctx, -CHIP.pk, -CHIP.pk, CHIP.pk, CHIP.pk, -18, 0, '#0A131B',
    (ny) => (ny > 0.6 ? '#070D14' : '#04080D'), rgba('#44688C', 0.9), 2);
  P.quad(ctx, -278, -278, 278, 278, 0.2); ctx.strokeStyle = rgba('#2C4863', 0.6); ctx.lineWidth = 1.5; ctx.stroke();

  if (pads && detail > 0.3) {
    /* gold contact pads along the package edge */
    ctx.fillStyle = rgba(COL.amber, 0.5 * detail);
    for (let i = 0; i < 26; i++) {
      const u = -250 + i * 20;
      for (const s of [-1, 1]) {
        P.quad(ctx, u, s * 286 - 5, u + 11, s * 286 + 5, 0.3); ctx.fill();
        P.quad(ctx, s * 286 - 5, u, s * 286 + 5, u + 11, 0.3); ctx.fill();
      }
    }
    /* decoupling capacitors */
    for (let i = 0; i < 14; i++) {
      const side = i % 2 ? 1 : -1, v = -210 + Math.floor(i / 2) * 68;
      P.slab(ctx, side * 232 - 11, v, side * 232 + 11, v + 26, 0, 9, '#1A2733', '#0B1219', rgba('#55708C', 0.55), 1);
    }
    /* fan-out traces from the die */
    ctx.strokeStyle = rgba(accent, 0.16 * detail); ctx.lineWidth = 1.2;
    for (let i = 0; i < 18; i++) {
      const u = -160 + i * 19;
      for (const s of [-1, 1]) {
        const a = P.pt(u, s * CHIP.dieY, 0.3), b = P.pt(u * 1.25, s * 272, 0.3);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
    }
  }

  /* die */
  P.slab(ctx, -CHIP.dieX, -CHIP.dieY, CHIP.dieX, CHIP.dieY, 0, CHIP.z, '#070C13',
    (ny) => (ny > 0.6 ? '#0C2530' : '#06131A'), rgba(accent, 0.25 + 0.55 * power), 2);
  /* cache / IO bands top and bottom */
  for (const s of [-1, 1]) {
    const y0 = s > 0 ? 204 : -234;
    P.quad(ctx, -152, y0, 152, y0 + 30, CHIP.z + 0.3);
    ctx.fillStyle = rgba(COL.violet, 0.16 + 0.22 * power); ctx.fill();
    ctx.strokeStyle = rgba(COL.violet, 0.5 * power); ctx.lineWidth = 1; ctx.stroke();
  }
  /* compute tiles */
  for (let r = 0; r < CHIP.rows; r++) {
    for (let c = 0; c < CHIP.cols; c++) {
      const [x, y, tw2, th2] = chipTile(c, r);
      let L = 0.25, hex = accent;
      if (tile) { const v = tile(c, r); if (typeof v === 'number') L = v; else { L = v.l; hex = v.hex || accent; } }
      L = clamp(L) * power;
      P.quad(ctx, x + 1.8, y + 1.6, x + tw2 - 1.8, y + th2 - 1.6, CHIP.z + 0.5);
      ctx.fillStyle = mixHex('#0C202B', hex, 0.08 + 0.92 * L, 1);
      ctx.fill();
      if (L > 0.55) { ctx.strokeStyle = rgba('#FFFFFF', (L - 0.55) * 1.2); ctx.lineWidth = 1; ctx.stroke(); }
    }
  }
  /* light pillars rising from tiles */
  if (pillars) {
    const list = [];
    for (let r = 0; r < CHIP.rows; r++) for (let c = 0; c < CHIP.cols; c++) {
      const v = pillars(c, r); if (!v || v.h <= 1) continue;
      const [x, y, tw2, th2] = chipTile(c, r);
      const a = P.pt(x + tw2 / 2, y + th2 / 2, CHIP.z + 1), b = P.pt(x + tw2 / 2, y + th2 / 2, CHIP.z + 1 + v.h);
      list.push([a, b, v]);
    }
    list.sort((p, q) => p[0][1] - q[0][1]);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (const [a, b, v] of list) {
      const gr = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
      gr.addColorStop(0, rgba(v.hex || accent, 0.85 * v.a * power)); gr.addColorStop(1, rgba(v.hex || accent, 0));
      ctx.strokeStyle = gr; ctx.lineWidth = (v.w || 3.2) * P.scale;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      glow(ctx, a[0], a[1], 15 * P.scale, v.hex || accent, 0.55 * v.a * power);
    }
    ctx.restore();
  }
}

/* ---------- compute-unit grid, top-down, portrait 10 x 17 ---------- */
const GRID = { x: 70, y: 384, w: 940, h: 816, cols: 10, rows: 17, gap: 8 };
function gridTile(c, r) {
  const cw = (GRID.w + GRID.gap) / GRID.cols, rh = (GRID.h + GRID.gap) / GRID.rows;
  return [GRID.x + c * cw, GRID.y + r * rh, cw - GRID.gap, rh - GRID.gap];
}
function drawGrid(ctx, t, fn) {
  for (let r = 0; r < GRID.rows; r++) for (let c = 0; c < GRID.cols; c++) {
    const [x, y, w, h] = gridTile(c, r);
    const v = fn ? fn(c, r, x, y, w, h) : { l: 0.3 };
    if (!v || v.a === 0) continue;
    const a = v.a == null ? 1 : v.a, s = v.s == null ? 1 : v.s, hex = v.hex || COL.cyan, L = clamp(v.l == null ? 0.3 : v.l);
    if (a <= 0.003) continue;
    const ga = ctx.globalAlpha; ctx.globalAlpha = ga * clamp(a);
    const cx = x + w / 2, cy = y + h / 2 + (v.dy || 0), ww = w * s, hh = h * s;
    rr(ctx, cx - ww / 2, cy - hh / 2, ww, hh, 7 * s);
    ctx.fillStyle = mixHex('#0C1C28', hex, 0.07 + 0.55 * L, 1); ctx.fill();
    ctx.strokeStyle = rgba(hex, 0.3 + 0.7 * L); ctx.lineWidth = 1.6; ctx.stroke();
    /* lane stripes inside the tile: 4 groups */
    if (v.stripes !== false && s > 0.6) {
      ctx.fillStyle = rgba(hex, 0.16 + 0.6 * L);
      const n = 8, sw = (ww - 16) / n;
      for (let i = 0; i < n; i++) {
        const k = v.stripe ? v.stripe(i) : 1;
        ctx.globalAlpha = ga * clamp(a) * clamp(k);
        ctx.fillRect(cx - ww / 2 + 8 + i * sw + 1.5, cy - hh / 2 + 8, sw - 3, hh - 16);
      }
    }
    ctx.globalAlpha = ga;
  }
}
