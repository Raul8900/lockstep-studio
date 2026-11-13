'use strict';
/* Scene 10 — THE TAKEAWAY (2:26–2:42)
   A GPU is not a faster CPU. It does one thing to an ocean of data, all at
   once. Give it that and it is unstoppable; give it anything else and the
   CPU still wins. Ends on the mental model in one line.                    */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const B = 'payoff';
  const c = {
    so: at(B, 'so'), gpu: at(B, 'gpu'), isnt: at(B, "isn't"), faster: at(B, 'faster'), cpu: at(B, 'cpu'), cpuEnd: at(B, 'cpu', 1, 't1'),
    its: at(B, "it's"), machine: at(B, 'machine'), one: at(B, 'one'), thing: at(B, 'thing'), ocean: at(B, 'ocean'), data: at(B, 'data'),
    all: at(B, 'all'), once: at(B, 'once'), onceEnd: at(B, 'once', 1, 't1'),
    give: at(B, 'give'), that: at(B, 'that'), unstoppable: at(B, 'unstoppable'), unstoppableEnd: at(B, 'unstoppable', 1, 't1'),
    give2: at(B, 'give', 2), anything: at(B, 'anything'), elseW: at(B, 'else'), your: at(B, 'your'), cpu2: at(B, 'cpu', 2), still: at(B, 'still'), wins: at(B, 'wins'), winsEnd: at(B, 'wins', 1, 't1'),
  };
  const S0 = beatOf(B).t0 - 0.5;
  const tOcean = [c.its - 0.45, c.its + 0.25];                // typography lifts, ocean arrives
  const tFlash = c.all;                                       // the whole field changes at once
  const tChaos = [c.anything - 0.1, c.elseW + 0.5];
  const tEnd = [c.winsEnd + 0.15, c.winsEnd + 0.75];
  const HZ = 800;                                             // horizon of the data ocean

  sfx(S0 + 0.1, 'whoosh', 0.8);
  sfx(c.gpu, 'thump', 0.8); sfx(c.isnt, 'deny', 0.9); sfx(c.cpu, 'thump', 0.7);
  sfx(tOcean[0], 'whoosh', 0.9); sfx(tOcean[0] + 0.2, 'swell', 0.8, { dur: 2.6 });
  sfx(c.one, 'blip', 0.8);
  sfx(tFlash - 0.5, 'riser', 0.9, { dur: 0.5 }); sfx(tFlash, 'impact', 1.0); sfx(tFlash + 0.02, 'fire', 0.9);
  for (let k = 0; k < 4; k++) sfx(c.unstoppable + k * 0.24, 'thump', 0.85);
  sfx(c.unstoppable, 'chime', 0.8);
  sfx(tChaos[0], 'stall', 1.0); sfx(c.elseW, 'rip', 0.6);
  sfx(c.cpu2, 'thump', 0.8); sfx(c.wins, 'chime', 1.0);
  sfx(tEnd[0], 'whoosh', 0.7); sfx(tEnd[0] + 0.3, 'impact', 0.9); sfx(tEnd[1] + 0.2, 'swell', 0.6, { dur: 1.6 });

  function ocean(ctx, t, A) {
    /* a perspective field of data points, full-bleed down to the bottom edge */
    if (A <= 0.003) return;
    const flip = tw(t, tFlash, tFlash + 0.12, E.out2);          // violet -> cyan, everywhere at the same instant
    const flash = pulse(t, tFlash, 0.03, 0.7);
    const beatK = Math.max(0, Math.floor((t - c.unstoppable) / 0.24));
    const beat = t >= c.unstoppable && t < tChaos[0] ? Math.exp(-((t - c.unstoppable) - beatK * 0.24) / 0.09) : 0;
    const chaos = tw(t, tChaos[0], tChaos[1], E.io2);
    const calm = tw(t, tEnd[0], tEnd[1], E.io2);
    const ROWS = 30, COLS = 41;
    ctx.save(); ctx.globalAlpha *= A;
    for (let j = 0; j < ROWS; j++) {
      const v = j / (ROWS - 1), depth = Math.pow(v, 1.7);
      const y0 = HZ + (H + 40 - HZ) * depth;
      const spread = 300 + 1150 * depth, sz = 3 + 9 * depth;
      const rowA = clamp(0.25 + v * 6) * (0.45 + 0.55 * (1 - 0.5 * calm));
      for (let i = 0; i < COLS; i++) {
        const u = i / (COLS - 1) * 2 - 1;
        let x = 540 + u * spread;
        let y = y0 + Math.sin(u * 5.5 + t * 1.5 + v * 8) * (4 + 16 * depth) * (1 - 0.6 * flip * (1 - chaos));
        let hex = COL.violet, a = rowA;
        if (chaos > 0) {                                        // every point wants something different
          const h1 = hash2(i * 1.7, j * 2.9), h2 = hash2(i * 3.1 + 5, j * 1.3 + 2);
          x += (h1 - 0.5) * 150 * depth * chaos + Math.sin(t * (2 + h2 * 5) + h1 * 9) * 14 * chaos;
          y += (h2 - 0.5) * 130 * depth * chaos;
          const pal = [COL.amber, COL.coral, COL.violet, COL.mint, COL.dim];
          hex = pal[Math.floor(h1 * 4.999)];
          ctx.fillStyle = mixHex(COL.cyan, hex, chaos, 1); a *= 1 - 0.35 * chaos;
        } else {
          const lvl = 0.55 + 0.45 * hash2(i + Math.floor(t * 3 + j), j) * (1 - flip);
          ctx.fillStyle = flip > 0 ? mixHex(COL.violet, beat > 0.3 ? '#FFFFFF' : COL.cyan, flip, 1) : mixHex(COL.violetDeep, COL.violet, lvl, 1);
        }
        ctx.globalAlpha = A * clamp(a * (1 + 0.6 * flash + 0.5 * beat));
        const s2 = sz * (1 + 0.5 * flash + 0.35 * beat);
        ctx.fillRect(x - s2 / 2, y - s2 / 2, s2, s2);
      }
    }
    ctx.restore();
    if (flash > 0.01) { glow(ctx, 540, HZ + 200, 900, COL.cyan, 0.5 * flash); line(ctx, 0, HZ + 4, W, HZ + 4, rgba(COL.white, flash), 4); }
    /* horizon haze */
    const gr = ctx.createLinearGradient(0, HZ - 40, 0, HZ + 150);
    gr.addColorStop(0, rgba(COL.bg1, 0)); gr.addColorStop(0.35, rgba(flip > 0.5 && chaos < 0.5 ? COL.cyanDeep : COL.violetDeep, 0.35 * A)); gr.addColorStop(1, rgba(COL.bg1, 0));
    ctx.fillStyle = gr; ctx.fillRect(0, HZ - 40, W, 190);
  }

  addScene(B, function (ctx, t) {
    const lift = tw(t, tOcean[0], tOcean[1], E.io3);
    const endP = tw(t, tEnd[0], tEnd[1], E.io3);

    /* ----- A: GPU != a faster CPU ----- */
    const typA = 1 - lift;
    if (typA > 0.003) withAlpha(ctx, typA, () => {
      ctx.save(); ctx.translate(0, -lift * 160);
      const g = tw(t, S0 - 0.3, S0 + 0.3, E.outBackSoft);
      const br = Math.sin(t * 3.4);
      glow(ctx, 540, 560, 420 + 30 * br, COL.cyan, (0.2 + 0.1 * br) * clamp(g));
      text(ctx, 'GPU', 540, 640 + (1 - g) * 40, { size: 250 + 3 * br, weight: 900, family: F.disp, color: COL.cyan, align: 'center', alpha: clamp(g * 1.5), ls: -6 });
      const ne = E.outBack(prog(t, c.isnt - 0.08, c.isnt + 0.28));
      if (ne > 0) {
        ctx.save(); ctx.translate(540, 780); ctx.rotate(0.035 * Math.sin(t * 5.2)); ctx.scale(ne, ne);
        glow(ctx, 0, 0, 170, COL.coral, 0.45);
        text(ctx, '≠', 0, 58, { size: 190, weight: 900, family: F.disp, color: COL.coral, align: 'center' });
        ctx.restore();
      }
      riseText(ctx, 'a faster CPU', 540, 1000, prog(t, c.faster - 0.12, c.faster + 0.22), { size: 124, weight: 900, family: F.disp, color: COL.amber, align: 'center', ls: -2 });
      riseText(ctx, 'different machine · different job', 540, 1086, prog(t, c.cpu + 0.2, c.cpu + 0.6), { size: 30, weight: 700, family: F.mono, color: COL.dim, align: 'center', ls: 2, rise: 14 });
      ctx.restore();
    });

    /* ----- B: one thing, an ocean of data, all at once ----- */
    const oc = lift * (1 - 0.72 * endP);
    ocean(ctx, t, oc);
    if (lift > 0.003) {
      const chaos = tw(t, tChaos[0], tChaos[1], E.io2);
      const flash = pulse(t, tFlash, 0.03, 0.7);
      const mid = prog(lift, 0.55, 1) * (1 - endP);
      /* the two contenders, side by side above the horizon */
      const gy = 566, gpuOn = 1 - 0.75 * chaos, cpuOn = tw(t, c.your - 0.1, c.cpu2 + 0.2, E.out3);
      withAlpha(ctx, mid, () => {
        const split = tw(t, tChaos[0] - 0.3, tChaos[0] + 0.3, E.io3);       // GPU slides left to make room for the CPU
        const gx = lerp(540, 300, split);
        chipIcon(ctx, gx, gy, 210, { color: COL.cyan, label: 'GPU', power: (0.55 + 0.45 * tw(t, c.thing, tFlash)) * gpuOn + 0.4 * flash, cells: 8,
          cell: (cc, r) => (chaos > 0.5 ? 0.12 : 0.3 + 0.7 * hash(cc * 3 + r * 5 + Math.floor(t * 10))) });
        withAlpha(ctx, split, () => chipIcon(ctx, 780, gy, 210, { color: COL.amber, label: 'CPU', power: 0.3 + 0.7 * cpuOn, cells: 2,
          cell: (cc, r) => 0.3 + 0.6 * hash(cc + r * 2 + Math.floor(t * 7)) }));
        /* one instruction fanned out over the whole field */
        const beam = tw(t, c.one - 0.1, c.thing + 0.2, E.out3) * (1 - chaos);
        if (beam > 0) {
          instr(ctx, 'f(x)', gx, gy + 160, { w: 170, h: 60, color: COL.white, alpha: beam, hot: 0.4 + 0.6 * flash, size: 34 });
          ctx.save(); ctx.globalAlpha *= 0.3 * beam + 0.5 * flash;
          const gr = ctx.createLinearGradient(0, gy + 192, 0, HZ + 260);
          gr.addColorStop(0, rgba(COL.white, 0.9)); gr.addColorStop(1, rgba(COL.cyan, 0));
          ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(gx - 60, gy + 192); ctx.lineTo(gx + 60, gy + 192); ctx.lineTo(1080, HZ + 260); ctx.lineTo(0, HZ + 260); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
        /* verdicts */
        const win1 = E.outBack(prog(t, c.unstoppable - 0.05, c.unstoppable + 0.3)) * (1 - chaos);
        if (win1 > 0) { ctx.save(); ctx.translate(gx, gy - 152); ctx.scale(win1, win1);
          pill(ctx, 'SAME WORK × OCEAN OF DATA', 0, 0, { size: 26, bg: 'rgba(4,26,18,0.97)', color: COL.mint, stroke: COL.mint, ls: 2, h: 54, r: 14 }); ctx.restore(); }
        const lose = prog(t, tChaos[0] + 0.1, tChaos[0] + 0.5) * chaos;
        pill(ctx, 'BRANCHY · ONE-OFF · TANGLED', 540, gy - 152, { size: 26, bg: 'rgba(30,18,4,0.97)', color: COL.amber, stroke: COL.amber, alpha: lose * (1 - prog(t, c.cpu2 - 0.2, c.cpu2 + 0.1)), ls: 2, h: 54, r: 14 });
        const win2 = E.outBack(prog(t, c.wins - 0.05, c.wins + 0.3));
        if (win2 > 0) { ctx.save(); ctx.translate(780, gy - 152); ctx.scale(win2, win2);
          pill(ctx, 'CPU WINS', 0, 0, { size: 30, bg: 'rgba(30,18,4,0.97)', color: COL.amber, stroke: COL.amber, ls: 4, h: 58, r: 14 }); ctx.restore();
          ring(ctx, 780, gy, 130 + 60 * (1 - pulse(t, c.wins, 0.05, 0.8)), COL.amber, 5, pulse(t, c.wins, 0.05, 0.8)); }
      });
      /* upward streaks while the GPU is in its element */
      const rush = win(t, c.unstoppable - 0.1, tChaos[0], 0.25, 0.3);
      streaks(ctx, t, { alpha: 0.5 * rush, seed: 31, n: 30, dir: -1, y0: HZ - 100, y1: H + 100, color: COL.cyan });
      const aao = pulse(t, tFlash + 0.05, 0.08, 1.6) * (1 - prog(t, c.give - 0.2, c.give));
      if (aao > 0.01) text(ctx, 'ALL AT ONCE', 540, HZ + 150, { size: 84, weight: 900, family: F.disp, color: COL.white, align: 'center', alpha: clamp(aao * 1.5), ls: 4, stroke: 'rgba(4,8,12,0.7)', strokeW: 10 });
    }

    /* ----- C: end card — the model in one line ----- */
    if (endP > 0.003) withAlpha(ctx, endP, () => {
      const y = 704 + (1 - endP) * 40;
      glow(ctx, 540, 840, 720, COL.cyan, 0.13);
      text(ctx, 'ONE INSTRUCTION.', 540, y, { size: 96, weight: 900, family: F.disp, color: COL.white, align: 'center', ls: -1 });
      text(ctx, 'MANY THREADS.', 540, y + 108, { size: 96, weight: 900, family: F.disp, color: COL.cyan, align: 'center', ls: -1 });
      const p2 = prog(t, tEnd[1] - 0.1, tEnd[1] + 0.3);
      line(ctx, 540 - 230 * p2, y + 168, 540 + 230 * p2, y + 168, rgba(COL.lineHi, 0.9), 3);
      riseText(ctx, 'How fast? That depends on the work.', 540, y + 232, p2, { size: 40, weight: 700, color: COL.text, align: 'center', rise: 16 });
      const chips = [['IDENTICAL UNITS', COL.cyan], ['WARPS OF 32', COL.amber], ['FED BY MEMORY', COL.violet]];
      const wds = chips.map((k) => measure(ctx, k[0], 26, 700, F.mono, 2) + 44);
      let x = 540 - (wds.reduce((a, b) => a + b, 0) + 2 * 18) / 2;
      chips.forEach(([name, hex], i) => {
        const p = E.outBack(prog(t, tEnd[1] + 0.15 + i * 0.12, tEnd[1] + 0.45 + i * 0.12));
        if (p > 0) { ctx.save(); ctx.translate(x + wds[i] / 2, y + 320); ctx.scale(p, p);
          pill(ctx, name, 0, 0, { size: 26, bg: rgba(hex, 0.14), color: hex, stroke: rgba(hex, 0.9), ls: 2, h: 54, r: 14, padX: 22 }); ctx.restore(); }
        x += wds[i] + 18;
      });
    });
  }, { type: 'zoomOut', fx: 540, fy: 800, z: 0.6, zb: 1.3, bx: 540, by: 760 });
});
