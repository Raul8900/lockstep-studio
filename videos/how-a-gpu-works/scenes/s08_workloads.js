'use strict';
/* Scene 8 — PIXELS & AI (1:58–2:15)
   Why the design pays off. A 4K frame: 8,294,400 pixels, each running the
   same small program on different data. A neural network: mostly matrix
   multiplication, i.e. vast numbers of identical multiply-adds.            */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const B = 'workloads';
  const c = {
    now: at(B, 'now'), clicks: at(B, 'clicks'), k4: at(B, '4k'), frame: at(B, 'frame'), eight: at(B, 'eight'), million: at(B, 'million'),
    pixels: at(B, 'pixels'), each: at(B, 'each'), same: at(B, 'same'), program: at(B, 'program'), different: at(B, 'different'), data: at(B, 'data'),
    perfect: at(B, 'perfect'), perfectEnd: at(B, 'perfect', 1, 't1'),
    neural: at(B, 'neural'), network: at(B, 'network'), mostly: at(B, 'mostly'), giant: at(B, 'giant'), matrix: at(B, 'matrix'), mult: at(B, 'multiplications'),
    billions: at(B, 'billions'), identical: at(B, 'identical'), madds: at(B, 'multiply-adds'), also: at(B, 'also'), perfect2: at(B, 'perfect', 2),
  };
  const S0 = beatOf(B).t0 - 0.5;
  const tSwap = [c.neural - 0.6, c.neural - 0.05];           // rendering part leaves, AI part enters

  /* ---------- the frame: a procedurally shaded image at 96 x 52 "pixels" ---------- */
  const IW = 96, IH = 52, FR = { x: 70, y: 478, w: 940 }; FR.px = FR.w / IW; FR.h = IH * FR.px;
  const TC = 12, TR2 = 13;                                   // 8 x 4 pixel tiles = one warp of 32 pixels
  const mixc = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  function shade(u, v) {
    /* sunset over water: sky gradient, sun, three ridges, reflection */
    const hz = 0.6, sun = [0.66, 0.4];
    const sky = (vv) => { const k = clamp(vv / hz); return k < 0.55 ? mixc([24, 14, 66], [128, 44, 122], k / 0.55) : mixc([128, 44, 122], [255, 150, 70], (k - 0.55) / 0.45); };
    const ridge = (uu, f, p, base, amp) => base + amp * (Math.sin(uu * f + p) * 0.6 + Math.sin(uu * f * 2.3 + p * 1.7) * 0.3 + Math.sin(uu * f * 5.1 + p * 0.6) * 0.1);
    const scene = (uu, vv) => {
      let col = sky(vv);
      const d = Math.hypot((uu - sun[0]) * 1.85, vv - sun[1]);
      col = mixc(col, [255, 226, 150], clamp(1 - d / 0.3) * 0.55);
      if (d < 0.085) col = [255, 244, 214];
      const layers = [[5, 1.0, 0.2, 0.07, [70, 34, 96]], [8, 2.2, 0.13, 0.055, [44, 22, 70]], [12, 4.0, 0.075, 0.04, [20, 12, 40]]];
      for (const [f, p, base, amp, cc] of layers) if (vv > hz - ridge(uu, f, p, base, amp)) col = cc;
      return col;
    };
    if (v <= hz) return scene(u, v);
    const rv = hz - (v - hz) * 1.15, wob = Math.sin(v * 95) * 0.012 * (v - hz) * 6;
    let col = mixc(scene(u + wob, rv), [10, 8, 30], 0.42);
    const dx = Math.abs(u - sun[0] + wob * 2);
    if (dx < 0.05 + (v - hz) * 0.16 && Math.sin(v * 150) > -0.2) col = mixc(col, [255, 200, 120], 0.55 * clamp(1 - dx / (0.05 + (v - hz) * 0.16)));
    return col;
  }
  const IMG = makeCanvas(Math.round(FR.w), Math.round(FR.h));
  const PIX = [];
  { const g = IMG.getContext('2d');
    for (let j = 0; j < IH; j++) for (let i = 0; i < IW; i++) {
      const col = shade((i + 0.5) / IW, (j + 0.5) / IH).map((x) => Math.round(clamp(x, 0, 255)));
      PIX.push(col);
      g.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
      g.fillRect(Math.floor(i * FR.px), Math.floor(j * FR.px), Math.ceil(FR.px), Math.ceil(FR.px));
    } }
  const tRev0 = S0 + 0.1, tRev1 = c.data + 0.15;
  const revT = (cc, r) => tRev0 + (tRev1 - tRev0) * clamp((r + cc * 0.42 + hash2(cc, r) * 1.6) / (TR2 + TC * 0.42 + 1.6));
  const LP = { i: 58, j: 17 };                               // loupe sample (sun's edge): 4 x 2 pixels
  const hexOf = (col) => '#' + col.map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();

  /* ---------- AI part ---------- */
  const NN = { xs: [150, 383, 617, 850], n: [5, 7, 7, 4], y0: 486, y1: 700 };
  const nodeY = (l, k) => lerp(NN.y0, NN.y1, NN.n[l] === 1 ? 0.5 : k / (NN.n[l] - 1) * 0.86 + 0.07 + (7 - NN.n[l]) * 0.0);
  const MAT = { y: 808, s: 264, xa: 70, xb: 408, xc: 746, n: 8 };
  const SEL = { i: 2, j: 5 };
  const tOne = c.billions - 0.05, tAll = c.identical + 0.15;

  sfx(S0 + 0.1, 'whoosh', 0.8); sfx(c.clicks, 'lock', 1.0);
  sfx(tRev0, 'data', 0.7, { dur: tRev1 - tRev0 });
  sfx(c.eight, 'count', 0.7, { dur: c.pixels - c.eight + 0.3 }); sfx(c.pixels + 0.3, 'impact', 0.8);
  sfx(c.same, 'blip', 0.7); sfx(c.different, 'blip', 0.7, { pitch: 1.2 });
  sfx(c.perfect, 'chime', 1.0); sfx(c.perfect + 0.02, 'stamp', 0.8);
  sfx(tSwap[0], 'whoosh', 0.8);
  sfx(c.giant, 'slide', 0.7, { dur: 0.5 }); sfx(c.matrix, 'thump', 0.7);
  for (let k = 0; k < 8; k++) sfx(tOne + k * 0.07, 'tick', 0.5, { pitch: 0.9 + k * 0.06 });
  sfx(tAll, 'data', 0.8, { dur: 1.5 }); sfx(tAll, 'riser', 0.6, { dur: 1.5 });
  sfx(c.also, 'chime', 1.0); sfx(c.also + 0.02, 'stamp', 0.8);

  function fitStamp(ctx, t, t0, x, y) {
    const p = E.outBack(prog(t, t0 - 0.05, t0 + 0.3));
    if (p <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.06); ctx.scale(p, p);
    glow(ctx, 0, 0, 330, COL.mint, 0.35);
    fillRR(ctx, -236, -54, 472, 108, 22, 'rgba(4,26,18,0.96)'); strokeRR(ctx, -236, -54, 472, 108, 22, COL.mint, 5);
    check(ctx, -178, 2, 34, COL.mint, prog(t, t0, t0 + 0.3), 10);
    text(ctx, 'PERFECT FIT', 32, 19, { size: 52, weight: 900, family: F.disp, color: COL.white, align: 'center', ls: 2 });
    ctx.restore();
  }

  function renderPart(ctx, t) {
    /* header */
    const hIn = tw(t, S0 - 0.3, S0 + 0.3, E.out3);
    text(ctx, '4K FRAME', FR.x, 448 + (1 - hIn) * 20, { size: 70, weight: 900, family: F.disp, color: COL.white, alpha: hIn, ls: -1 });
    text(ctx, '3840 × 2160', SAFE.r, 444, { size: 34, weight: 700, family: F.mono, color: COL.dim, align: 'right', alpha: hIn * prog(t, c.k4 - 0.1, c.k4 + 0.2), ls: 1 });

    /* frame */
    withAlpha(ctx, hIn, () => {
      fillRR(ctx, FR.x - 8, FR.y - 8, FR.w + 16, FR.h + 16, 14, '#04070B');
      ctx.drawImage(IMG, FR.x, FR.y);
      const tw2 = FR.w / TC, th2 = FR.h / TR2;
      for (let r = 0; r < TR2; r++) for (let cc = 0; cc < TC; cc++) {
        const rt = revT(cc, r), x = FR.x + cc * tw2, y = FR.y + r * th2;
        if (t < rt) {
          ctx.fillStyle = '#070C13'; ctx.fillRect(x, y, tw2 + 0.5, th2 + 0.5);
          ctx.strokeStyle = 'rgba(60,90,125,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, tw2 - 1, th2 - 1);
          if (rt - t < 0.16) { ctx.fillStyle = rgba(COL.cyan, 0.5 * (1 - (rt - t) / 0.16)); ctx.fillRect(x, y, tw2, th2); }   // warp about to shade this tile
        } else if (t - rt < 0.22) {
          ctx.fillStyle = rgba('#FFFFFF', 0.85 * (1 - (t - rt) / 0.22)); ctx.fillRect(x, y, tw2, th2);
        } else if (t > tRev1) {                                 // frame after frame: the next pass sweeps through
          const key = (r + cc * 0.42) / (TR2 + TC * 0.42), u = ((t - tRev1) / 1.3) % 1, dd = Math.abs(key - u);
          if (dd < 0.07) { ctx.fillStyle = rgba('#FFFFFF', 0.3 * (1 - dd / 0.07)); ctx.fillRect(x, y, tw2, th2); }
        }
      }
      strokeRR(ctx, FR.x - 8, FR.y - 8, FR.w + 16, FR.h + 16, 14, rgba(COL.cyan, 0.8), 3);
    });
    /* a small first-touch: 32 pixels drop into 32 lanes ("now it clicks") */
    const clk = pulse(t, c.clicks, 0.06, 0.8);
    if (clk > 0.01) strokeRR(ctx, FR.x - 8 - 14 * (1 - clk), FR.y - 8 - 14 * (1 - clk), FR.w + 16 + 28 * (1 - clk), FR.h + 16 + 28 * (1 - clk), 18, rgba(COL.white, clk), 4);

    /* the same small program */
    const pA = prog(t, c.each - 0.3, c.each);
    const same = pulse(t, c.same, 0.08, 1.4);
    const py = 1012;
    withAlpha(ctx, pA, () => {
      panel(ctx, 444, py, 566, 186, { r: 22, accent: COL.cyan, accentA: 0.45 + 0.55 * same });
      tag(ctx, 'THE SAME SMALL PROGRAM', 468, py + 40, { size: 22, color: same > 0.3 ? COL.white : COL.cyan });
      text(ctx, 'for every pixel:', 468, py + 90, { size: 29, weight: 500, family: F.mono, color: COL.dim });
      text(ctx, '  color = shade(pixel)', 468, py + 136, { size: 31, weight: 700, family: F.mono, color: COL.white });
      text(ctx, '32 pixels per warp, in lockstep', 468, py + 170, { size: 21, weight: 600, family: F.mono, color: COL.dim, ls: 0.5 });
    });
    /* pixel count */
    const cA = prog(t, c.eight - 0.2, c.eight + 0.1);
    const n = Math.round(8294400 * E.out3(prog(t, c.eight, c.pixels + 0.3))), hit = pulse(t, c.pixels + 0.3, 0.05, 0.6);
    withAlpha(ctx, cA, () => {
      panel(ctx, 70, py, 358, 186, { r: 22, accent: COL.amber, accentA: 0.5 + 0.5 * hit });
      text(ctx, fmt(n), 404, py + 96, { size: 68, weight: 900, family: F.disp, color: COL.amber, align: 'right', ls: -2 });
      text(ctx, 'PIXELS', 404, py + 140, { size: 30, weight: 800, family: F.mono, color: COL.white, align: 'right', ls: 5 });
      text(ctx, 'in every frame', 404, py + 170, { size: 22, weight: 600, color: COL.dim, align: 'right' });
    });

    /* loupe: neighbouring pixels, different data */
    const lp = E.out3(prog(t, c.different - 0.3, c.different + 0.1));
    if (lp > 0) {
      const sx = FR.x + (LP.i + 2) * FR.px, sy = FR.y + (LP.j + 1) * FR.px;
      const bx = 96, by = 742, cell = 106;
      withAlpha(ctx, lp, () => {
        strokeRR(ctx, FR.x + LP.i * FR.px - 3, FR.y + LP.j * FR.px - 3, 4 * FR.px + 6, 2 * FR.px + 6, 4, COL.white, 3);
        line(ctx, sx - 2 * FR.px, sy + FR.px, bx + 4 * cell, by, rgba(COL.white, 0.7), 2);
        line(ctx, sx - 2 * FR.px, sy + FR.px, bx, by, rgba(COL.white, 0.4), 2);
        fillRR(ctx, bx - 12, by - 46, 4 * cell + 24, 2 * cell + 58, 16, 'rgba(5,9,15,0.95)');
        strokeRR(ctx, bx - 12, by - 46, 4 * cell + 24, 2 * cell + 58, 16, COL.white, 2.5);
        tag(ctx, 'EACH PIXEL · ITS OWN DATA', bx + 2, by - 14, { size: 21, color: COL.white });
        for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) {
          const col = PIX[(LP.j + j) * IW + LP.i + i];
          const pp = E.outBack(prog(t, c.different - 0.2 + (i + j * 4) * 0.035, c.different + 0.05 + (i + j * 4) * 0.035));
          fillRR(ctx, bx + i * cell + 3 + (1 - pp) * 30, by + j * cell + 3 + (1 - pp) * 30, (cell - 6) * pp, (cell - 6) * pp, 8, `rgb(${col[0]},${col[1]},${col[2]})`);
          const lum = col[0] * 0.3 + col[1] * 0.59 + col[2] * 0.11;
          text(ctx, hexOf(col), bx + i * cell + cell / 2, by + j * cell + cell / 2 + 7, { size: 19, weight: 800, family: F.mono, color: lum > 140 ? '#10131A' : COL.white, align: 'center', alpha: pp });
        }
      });
    }
    fitStamp(ctx, t, c.perfect, 700, 600);
  }

  function aiPart(ctx, t) {
    const hIn = tw(t, tSwap[0] + 0.2, tSwap[1] + 0.2, E.out3);
    text(ctx, 'NEURAL NETWORK', 70, 448 + (1 - hIn) * 20, { size: 62, weight: 900, family: F.disp, color: COL.white, alpha: hIn, ls: -1 });
    /* network glyph: every bundle of connections between two layers is one matrix */
    withAlpha(ctx, hIn, () => {
      const hot = (l) => 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 5 - l * 1.4));
      for (let l = 0; l < 3; l++) {
        const bundle = pulse(t, c.matrix + l * 0.12, 0.06, 1.0);
        for (let a = 0; a < NN.n[l]; a++) for (let b = 0; b < NN.n[l + 1]; b++) {
          const x0 = NN.xs[l], y0 = nodeY(l, a), x1 = NN.xs[l + 1], y1 = nodeY(l + 1, b);
          line(ctx, x0, y0, x1, y1, rgba(bundle > 0.05 ? COL.white : COL.cyan, 0.1 + 0.3 * bundle), 1.5);
          const ph = (t * 0.9 + hash2(a * 3 + l, b * 7)) % 1;
          if (hash2(a + l * 5, b) > 0.55) dot(ctx, lerp(x0, x1, ph), lerp(y0, y1, ph), 3.5, COL.cyan, 0.9 * Math.sin(Math.PI * ph));
        }
        const wa = prog(t, c.matrix - 0.1 + l * 0.12, c.matrix + 0.15 + l * 0.12);
        pill(ctx, 'matrix ' + (l + 1), (NN.xs[l] + NN.xs[l + 1]) / 2, NN.y1 + 28, { size: 22, bg: 'rgba(5,10,16,0.95)', color: COL.cyan, stroke: rgba(COL.cyan, 0.9), alpha: wa, ls: 1, h: 38 });
      }
      for (let l = 0; l < 4; l++) for (let k = 0; k < NN.n[l]; k++) {
        const y = nodeY(l, k);
        glow(ctx, NN.xs[l], y, 30, COL.cyan, 0.35 * hot(l));
        dot(ctx, NN.xs[l], y, 13, mixHex('#0E2A38', COL.cyan, hot(l), 1)); ring(ctx, NN.xs[l], y, 13, COL.cyan, 2.5, 0.9);
      }
    });

    /* A x B = C */
    const mIn = (k) => E.out3(prog(t, c.giant - 0.1 + k * 0.12, c.giant + 0.4 + k * 0.12));
    const cs = MAT.s / MAT.n;
    const selA = win(t, tOne, tAll + 0.1, 0.12, 0.25);
    const passN = Math.floor((t - tAll) / 0.5);
    const drawMat = (x, k, name, cellFn) => {
      const p = mIn(k); if (p <= 0) return;
      withAlpha(ctx, p, () => {
        ctx.save(); ctx.translate(0, (1 - p) * 50);
        fillRR(ctx, x - 10, MAT.y - 10, MAT.s + 20, MAT.s + 20, 14, 'rgba(8,13,21,0.92)');
        /* brackets */
        for (const sd of [0, 1]) { const bx = sd ? x + MAT.s + 10 : x - 10, dir = sd ? -1 : 1;
          polyline(ctx, [[bx + dir * 14, MAT.y - 10], [bx, MAT.y - 10], [bx, MAT.y + MAT.s + 10], [bx + dir * 14, MAT.y + MAT.s + 10]], COL.white, 3.5); }
        for (let j = 0; j < MAT.n; j++) for (let i = 0; i < MAT.n; i++) {
          const v = cellFn(i, j);
          fillRR(ctx, x + i * cs + 2.5, MAT.y + j * cs + 2.5, cs - 5, cs - 5, 5, v);
        }
        text(ctx, name, x + MAT.s / 2, MAT.y - 24, { size: 24, weight: 800, family: F.mono, color: COL.dim, align: 'center', ls: 2 });
        ctx.restore();
      });
    };
    drawMat(MAT.xa, 0, 'WEIGHTS', (i, j) => {
      const base = 0.2 + 0.6 * hash2(i * 1.3 + 7, j * 2.1 + Math.max(0, passN));
      return j === SEL.j && selA > 0 ? mixHex(COL.violetDeep, COL.white, 0.35 + 0.5 * selA, 1) : mixHex('#161230', COL.violet, base, 1);
    });
    drawMat(MAT.xb, 1, 'INPUTS', (i, j) => {
      const base = 0.2 + 0.6 * hash2(i * 3.3 + 1, j * 1.7 + Math.max(0, passN) * 3);
      return i === SEL.i && selA > 0 ? mixHex(COL.amberDeep, COL.white, 0.35 + 0.5 * selA, 1) : mixHex('#2A1B06', COL.amber, base, 1);
    });
    drawMat(MAT.xc, 2, 'OUTPUTS', (i, j) => {
      if (i === SEL.i && j === SEL.j && t >= tOne + 0.56 && t < tAll) return mixHex(COL.cyan, COL.white, pulse(t, tOne + 0.56, 0.04, 0.5), 1);
      if (t < tAll) return 'rgba(30,44,60,0.7)';
      const rowT = tAll + passN * 0.5 + j * 0.045;             // a whole row at a time, pass after pass
      const done = t >= rowT;
      const v = 0.25 + 0.7 * hash2(i * 2.9 + (done ? passN : passN - 1) * 5.1, j * 1.3);
      return done || passN > 0 ? mixHex('#0B2530', COL.cyan, clamp(v + 0.6 * pulse(t, rowT, 0.02, 0.25)), 1) : 'rgba(30,44,60,0.7)';
    });
    const op = mIn(1);
    text(ctx, '×', (MAT.xa + MAT.s + MAT.xb) / 2, MAT.y + MAT.s / 2 + 20, { size: 60, weight: 800, family: F.disp, color: COL.white, align: 'center', alpha: op });
    text(ctx, '=', (MAT.xb + MAT.s + MAT.xc) / 2, MAT.y + MAT.s / 2 + 20, { size: 60, weight: 800, family: F.disp, color: COL.white, align: 'center', alpha: mIn(2) });

    /* one output cell = a row times a column = 8 multiply-adds */
    const sA = prog(t, tOne - 0.15, tOne + 0.1);
    if (sA > 0) {
      const y = 1100;
      withAlpha(ctx, sA, () => {
        panel(ctx, 70, y, 940, 100, { r: 20, accent: COL.cyan, accentA: 0.5 });
        for (let k = 0; k < 8; k++) {
          const on = t >= tAll ? 0.6 + 0.4 * hash(k + Math.floor(t * 14)) : clamp((t - (tOne + k * 0.07)) / 0.08);
          const x = 92 + k * 72;
          fillRR(ctx, x, y + 18, 60, 64, 10, mixHex('#101A26', COL.cyan, 0.12 + 0.6 * on, 1));
          text(ctx, 'a·b', x + 30, y + 60, { size: 24, weight: 800, family: F.mono, color: on > 0.5 ? COL.white : COL.dim, align: 'center' });
          if (k < 7) text(ctx, '+', x + 66, y + 59, { size: 22, weight: 800, family: F.mono, color: COL.dim, align: 'center' });
        }
        const cnt = t < tAll ? Math.min(8, Math.max(0, Math.floor((t - tOne) / 0.07) + 1)) : 8 * Math.pow(10, 8.7 * E.in2(prog(t, tAll, c.also - 0.2)));
        const str = cnt < 1e9 ? fmt(cnt) : (cnt / 1e9).toFixed(1) + ' billion';
        text(ctx, str, 906, y + 54, { size: cnt < 1e9 ? 44 : 40, weight: 900, family: F.disp, color: COL.amber, align: 'right', ls: -0.5 });
        text(ctx, 'MULTIPLY-ADDS', 906, y + 84, { size: 20, weight: 800, family: F.mono, color: COL.dim, align: 'right', ls: 2.5 });
      });
    }
    fitStamp(ctx, t, c.also, 540, 600);
  }

  addScene(B, function (ctx, t) {
    const sw = tw(t, tSwap[0], tSwap[1], E.io3);
    if (sw < 1) withAlpha(ctx, 1 - sw, () => { ctx.save(); ctx.translate(0, -sw * 120); renderPart(ctx, t); ctx.restore(); });
    if (sw > 0) withAlpha(ctx, sw, () => { ctx.save(); ctx.translate(0, (1 - sw) * 120); aiPart(ctx, t); ctx.restore(); });
  }, { type: 'zoomIn', fx: 540, fy: 450, z: 2.4, zb: 0.7, bx: 540, by: 740 });
});
