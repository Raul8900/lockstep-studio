'use strict';
/* Scene 4 — INSIDE THE CHIP (0:43–0:55)
   Dive into the die: one block, stamped out again and again. Three vendors,
   three names for it. A flagship card has 170.                             */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const B = 'architecture';
  const c = {
    zoom: at(B, 'zoom'), chip: at(B, 'chip'), find: at(B, 'find'), one: at(B, 'one'), block: at(B, 'block'),
    stamped: at(B, 'stamped'), again: at(B, 'again'), again2: at(B, 'again', 2), againEnd: at(B, 'again', 2, 't1'),
    nvidia: at(B, 'nvidia'), streaming: at(B, 'streaming'), multi: at(B, 'multiprocessor'),
    amd: at(B, 'amd'), compute: at(B, 'compute'), unitEnd: at(B, 'unit', 1, 't1'),
    flagship: at(B, 'flagship'), hundred: at(B, 'hundred'), seventy: at(B, 'seventy'), seventyEnd: at(B, 'seventy', 1, 't1'),
  };
  const S0 = beatOf(B).t0 - 0.5;
  const HERO = { c: 4, r: 6 };
  const ringOf = (cc, r) => Math.max(Math.abs(cc - HERO.c), Math.abs(r - HERO.r));   // 0..10
  const stampT = (cc, r) => c.stamped - 0.05 + ringOf(cc, r) * 0.118 + hash2(cc, r) * 0.05;
  const tNames = c.nvidia - 0.35, tNamesOut = c.flagship - 0.08;
  const tCount0 = c.flagship + 0.38, tCount1 = c.seventy + 0.25;
  const order = [];            // serpentine counting order for the "170" sweep
  for (let r = 0; r < GRID.rows; r++) for (let k = 0; k < GRID.cols; k++) order.push([r % 2 ? GRID.cols - 1 - k : k, r]);
  const orderIdx = {}; order.forEach((o, i) => { orderIdx[o[0] + '_' + o[1]] = i; });

  sfx(S0 + 0.05, 'whoosh', 1.0);
  sfx(c.one, 'blip', 0.8);
  for (let k = 0; k < 11; k++) sfx(c.stamped - 0.05 + k * 0.118, 'stamp', 0.75 - k * 0.03, { pitch: 1 - k * 0.02 });
  sfx(tNames, 'slide', 0.6, { dur: 0.4 });
  sfx(c.nvidia, 'blip', 0.65, { pitch: 1.0 }); sfx(c.amd, 'blip', 0.65, { pitch: 1.12 }); sfx(c.amd + 0.5, 'blip', 0.4, { pitch: 1.26 });
  sfx(tNamesOut, 'whoosh', 0.6);
  sfx(tCount0, 'count', 0.8, { dur: tCount1 - tCount0 });
  sfx(tCount1, 'impact', 1.0);

  const [hx, hy, hw, hh] = gridTile(HERO.c, HERO.r);
  const heroC = [hx + hw / 2, hy + hh / 2];

  addScene(B, function (ctx, t) {
    /* camera: arrive still diving, ease out; push toward the hero tile for the names; pull back for the count */
    const dive = 1 + 0.5 * (1 - tw(t, S0 - 0.3, c.find + 0.2, E.out3));
    const nameZ = tw(t, tNames, tNames + 0.6, E.io3) * (1 - tw(t, tNamesOut, tNamesOut + 0.5, E.io3));
    const zoom = dive, fx = 540, fy = 792, camDx = 0, camDy = 0;
    const scanY = lerp(GRID.y - 80, GRID.y + GRID.h + 80, prog(t, S0 - 0.1, c.one - 0.1));
    const countP = prog(t, tCount0, tCount1);
    const nCount = Math.round(170 * E.io2(countP));
    const dimForCount = tw(t, tCount0 - 0.2, tCount0 + 0.4);

    withCam(ctx, { fx, fy, zoom, dx: camDx, dy: camDy }, () => {
      /* die outline */
      const dieA = prog(t, S0 - 0.45, S0 - 0.05);
      glow(ctx, 540, 792, 900, COL.cyan, 0.1 * dieA);
      fillRR(ctx, GRID.x - 26, GRID.y - 26, GRID.w + 52, GRID.h + 52, 30, rgba('#070C13', 0.9 * dieA));
      strokeRR(ctx, GRID.x - 26, GRID.y - 26, GRID.w + 52, GRID.h + 52, 30, rgba(COL.cyan, 0.4 * dieA), 2.5);

      drawGrid(ctx, t, (cc, r) => {
        const isHero = cc === HERO.c && r === HERO.r;
        const st = stampT(cc, r);
        if (isHero) {
          const born = E.outBack(prog(t, c.one - 0.12, c.one + 0.25));
          const beat = 0.5 + 0.5 * Math.sin(t * 5);
          return { a: 1, s: lerp(1, 1.12, born) , l: lerp(0.05, 0.75 + 0.25 * beat, clamp(born)), hex: nameZ > 0.3 ? COL.white : COL.cyan };
        }
        if (t < st) {                                           // unlit silicon, swept by a scan line on arrival
          const [, ty, , th2] = gridTile(cc, r);
          const sweep = Math.exp(-Math.abs(ty + th2 / 2 - scanY) / 70);
          return { a: (0.42 + 0.5 * sweep) * prog(t, S0 - 0.45, S0 - 0.05), l: 0.03 + 0.55 * sweep, stripes: sweep > 0.25 };
        }
        const p = prog(t, st, st + 0.3), press = E.outBack(p);
        let L = 0.26 + 0.7 * (1 - p) + 0.1 * hash2(cc + Math.floor(t * 3), r);
        let hex = COL.cyan, a = 1;
        if (countP > 0) {                                      // counting sweep
          const idx = orderIdx[cc + '_' + r];
          const lit = idx < nCount;
          L = lit ? 0.5 + 0.5 * pulse(t, tCount0 + (tCount1 - tCount0) * Math.sqrt(idx / 170) * 0.985, 0.03, 0.5) : 0.1;
          a = lerp(1, lit ? 0.75 : 0.45, dimForCount);
        }
        a *= 1 - 0.62 * nameZ;                                 // recede behind the magnified tile + name card
        return { a, s: lerp(1.3, 1, press), l: L, hex, dy: (1 - press) * -10 };
      });
      /* scan line */
      const sa = win(t, S0 - 0.1, c.one - 0.1, 0.2, 0.2);
      if (sa > 0) { glow(ctx, 540, scanY, 520, COL.cyan, 0.16 * sa); line(ctx, GRID.x - 20, scanY, GRID.x + GRID.w + 20, scanY, rgba(COL.white, 0.85), 3, sa); }
      /* hero tile ring */
      if (nameZ > 0.02) strokeRR(ctx, hx - 6, hy - 6, hw + 12, hh + 12, 11, rgba(COL.white, nameZ), 3.5);
    });

    /* magnified copy of the one block lifts out of the die */
    if (nameZ > 0.01) {
      const BIG = { x: 250, y: 470, w: 580, h: 262 };
      const e = nameZ;
      const mx = lerp(hx, BIG.x, e), my = lerp(hy, BIG.y, e), mw = lerp(hw, BIG.w, e), mh = lerp(hh, BIG.h, e);
      withAlpha(ctx, clamp(nameZ * 2.5), () => {
        for (const [ax, ay, bx, by] of [[hx, hy, mx, my], [hx + hw, hy, mx + mw, my], [hx, hy + hh, mx, my + mh], [hx + hw, hy + hh, mx + mw, my + mh]])
          line(ctx, ax, ay, bx, by, rgba(COL.white, 0.35), 1.5);
        glow(ctx, mx + mw / 2, my + mh / 2, mw * 0.8, COL.cyan, 0.3);
        fillRR(ctx, mx, my, mw, mh, 24 * e + 6, 'rgba(7,18,27,0.97)');
        strokeRR(ctx, mx, my, mw, mh, 24 * e + 6, rgba(COL.white, 0.95), 3.5);
        if (e > 0.6) {
          const a2 = prog(e, 0.6, 1);
          withAlpha(ctx, a2, () => {
            tag(ctx, 'ONE COMPUTE BLOCK', mx + 30, my + 48, { size: 25, color: COL.white });
            text(ctx, '1 of 170', mx + mw - 30, my + 48, { size: 25, weight: 700, family: F.mono, color: COL.cyan, align: 'right', ls: 1 });
            /* four groups of execution lanes pulsing in step */
            for (let g2 = 0; g2 < 4; g2++) {
              drawLanes(ctx, mx + 30 + g2 * ((mw - 60 + 16) / 4), my + 76, (mw - 60 + 16) / 4 - 16, mh - 112, 16, (i) => {
                const ph = ((t * 1.5 + g2 * 0.25) % 1);
                return { hex: COL.cyan, base: 0.2, head: ph, len: 0.45 };
              }, { gap: 2.5, r: 2 });
            }
          });
        }
      });
    }
    /* headline while the tiles stamp in */
    const hA = win(t, c.one - 0.1, tNames - 0.1, 0.3, 0.3);
    if (hA > 0) {
      const done = Math.min(170, 1 + order.filter((o) => t >= stampT(o[0], o[1])).length);
      fillRR(ctx, 250, 1118, 580, 86, 22, rgba('#060B12', 0.9 * hA));
      strokeRR(ctx, 250, 1118, 580, 86, 22, rgba(COL.cyan, 0.7 * hA), 2.5);
      text(ctx, 'ONE BLOCK', 282, 1173, { size: 36, weight: 800, family: F.mono, color: COL.white, alpha: hA, ls: 3 });
      text(ctx, '× ' + (t < c.stamped ? 1 : done), 800, 1175, { size: 46, weight: 900, family: F.disp, color: COL.cyan, alpha: hA, align: 'right' });
    }

    /* three vendors, three names, one idea */
    const cardP = tw(t, tNames, tNames + 0.5, E.out3) * (1 - tw(t, tNamesOut, tNamesOut + 0.35, E.in2));
    if (cardP > 0.005) {
      const X = 70, Y = 806, CW = 836, CH = 372;
      withAlpha(ctx, cardP, () => {
        ctx.save(); ctx.translate(0, (1 - cardP) * 60);
        /* leader from the highlighted tile */
        polyline(ctx, [[540, 734], [540, Y]], rgba(COL.white, 0.9), 3, prog(t, tNames + 0.3, tNames + 0.6));
        panel(ctx, X, Y, CW, CH, { r: 28, fill: 'rgba(8,13,21,0.95)', stroke: rgba(COL.lineHi, 0.9), lw: 2.5 });
        tag(ctx, 'SAME BLOCK · THREE NAMES', X + 36, Y + 52, { size: 24, color: COL.dim });
        const rows = [
          { v: 'NVIDIA', n: 'Streaming Multiprocessor', s: 'SM', t: c.nvidia - 0.15, hot: [c.streaming, c.multi + 0.9], col: COL.mint },
          { v: 'AMD', n: 'Compute Unit', s: 'CU', t: c.amd - 0.15, hot: [c.compute - 0.1, c.unitEnd + 0.3], col: COL.coral },
          { v: 'INTEL', n: 'Xe-core', s: '', t: c.amd + 0.5, hot: [c.unitEnd + 0.1, c.unitEnd + 0.75], col: COL.cyan },
        ];
        rows.forEach((r, i) => {
          const p = E.out3(prog(t, r.t, r.t + 0.35));
          if (p <= 0) return;
          const y = Y + 92 + i * 92, hot = win(t, r.hot[0], r.hot[1], 0.15, 0.4);
          withAlpha(ctx, p, () => {
            ctx.save(); ctx.translate((1 - p) * 40, 0);
            fillRR(ctx, X + 24, y, CW - 48, 78, 18, mixHex('#101926', r.col, 0.06 + 0.16 * hot, 1));
            strokeRR(ctx, X + 24, y, CW - 48, 78, 18, rgba(r.col, 0.3 + 0.7 * hot), 2.5);
            pill(ctx, r.v, X + 44, y + 39, { size: 25, bg: rgba(r.col, 0.2), color: r.col, stroke: rgba(r.col, 0.9), align: 'left', ls: 2, h: 46, r: 12 });
            text(ctx, r.n, X + 212, y + 52, { size: 41, weight: 800, family: F.disp, color: COL.white });
            if (r.s) text(ctx, r.s, X + CW - 52, y + 52, { size: 36, weight: 800, family: F.mono, color: r.col, align: 'right', ls: 2 });
            ctx.restore();
          });
        });
        ctx.restore();
      });
    }

    /* "a hundred and seventy" */
    if (countP > 0) {
      const a = prog(t, tCount0, tCount0 + 0.25);
      const hit = pulse(t, tCount1, 0.05, 0.7);
      withAlpha(ctx, a, () => {
        glow(ctx, 540, 770, 560, '#04080D', 1); glow(ctx, 540, 770, 420, '#04080D', 1);
        ctx.save(); ctx.globalCompositeOperation = 'source-over';
        fillRR(ctx, 216, 598, 648, 372, 40, 'rgba(5,9,15,0.9)');
        strokeRR(ctx, 216, 598, 648, 372, 40, rgba(COL.amber, 0.55 + 0.45 * hit), 3);
        ctx.restore();
        text(ctx, String(nCount), 540, 838 - 6 * hit, { size: 250 + 14 * hit, weight: 900, family: F.disp, color: COL.amber, align: 'center', ls: -6 });
        text(ctx, 'COMPUTE UNITS', 540, 906, { size: 38, weight: 800, family: F.mono, color: COL.white, align: 'center', ls: 6 });
        text(ctx, 'on one GeForce RTX 5090', 540, 946, { size: 27, weight: 600, color: COL.dim, align: 'center' });
      });
    }
  }, { type: 'zoomIn', fx: 540, fy: 1012, z: 3.6, zb: 0.5, bx: 540, by: 792 });
});
