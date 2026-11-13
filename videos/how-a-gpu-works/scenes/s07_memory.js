'use strict';
/* Scene 7 — MEMORY (1:40–1:58)
   A vertical tower, nearest-fastest at the top: registers -> shared memory ->
   caches -> VRAM. Data climbs to the lanes; the lanes spend much of their
   time waiting for it. Bandwidth figure: GeForce RTX 5090, 1,792 GB/s.     */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const B = 'memory';
  const c = {
    stall: at(B, 'stall'), memory: at(B, 'memory'), lot: at(B, 'lot'), registers: at(B, 'registers'), instant: at(B, 'instant'),
    small: at(B, 'small'), shared: at(B, 'shared'), scratchpad: at(B, 'scratchpad'), threads: at(B, 'threads'), trade: at(B, 'trade'), results: at(B, 'results'),
    then: at(B, 'then'), caches: at(B, 'caches'), cachesEnd: at(B, 'caches', 1, 't1'), vram: at(B, 'vram'), feeding: at(B, 'feeding'),
    over: at(B, 'over'), thousand: at(B, 'thousand'), gigabytes: at(B, 'gigabytes'), second: at(B, 'second'), secondEnd: at(B, 'second', 1, 't1'),
    often: at(B, 'often'), still: at(B, 'still'), real: at(B, 'real'), speed: at(B, 'speed'), limit: at(B, 'limit'), limitEnd: at(B, 'limit', 1, 't1'),
  };
  const S0 = beatOf(B).t0 - 0.5;
  const X = 70, WD = 940;
  const LN = { y: 384, h: 118 };
  const LV = [
    { key: 'reg', y: 526, h: 104, name: 'REGISTERS', sub: 'private to each thread', speed: 'instant', hex: COL.cyan, t: c.registers - 0.12 },
    { key: 'shm', y: 648, h: 128, name: 'SHARED MEMORY', sub: 'one scratchpad per unit', speed: 'very fast', hex: COL.mint, t: c.small - 0.1 },
    { key: 'cch', y: 794, h: 104, name: 'CACHES', sub: 'L1 in the unit · L2 for the whole chip', speed: 'fast', hex: COL.amber, t: c.then - 0.12 },
    { key: 'vrm', y: 916, h: 284, name: 'VRAM', sub: 'the GPU’s main memory', speed: 'farthest', hex: COL.violet, t: c.vram - 0.15 },
  ];
  const tFlow = c.feeding - 0.2;
  const tLimit = c.often - 0.1;

  sfx(S0 + 0.1, 'whoosh', 0.7);
  sfx(c.stall, 'stall', 0.8);
  LV.forEach((l, i) => sfx(l.t + 0.1, 'blip', 0.75, { pitch: 1.2 - i * 0.12 }));
  sfx(c.trade - 0.1, 'data', 0.5, { dur: 1.0 });
  sfx(tFlow, 'data', 0.9, { dur: c.secondEnd - tFlow });
  sfx(c.over, 'count', 0.7, { dur: c.gigabytes - c.over + 0.3 });
  sfx(c.gigabytes + 0.3, 'impact', 0.9);
  sfx(c.speed, 'stamp', 1.0); sfx(c.limit, 'stall', 0.7);

  /* fraction of lanes waiting for data over time */
  const waitFrac = (t) => (t < c.stall ? 0.1 : t < tFlow ? 0.62 : t < tLimit ? 0.34 : 0.7);

  function lanesStrip(ctx, t) {
    panel(ctx, X, LN.y, WD, LN.h, { r: 22, accent: COL.cyan, accentA: 0.6 });
    const fin0 = prog(t, c.still - 0.1, c.still + 0.25);
    tag(ctx, 'EXECUTION LANES', X + 24, LN.y + 36, { size: 23, color: COL.cyan, alpha: 1 - fin0 });
    const wf = waitFrac(t);
    let waiting = 0;
    drawLanes(ctx, X + 24, LN.y + 50, WD - 48, 52, 64, (i) => {
      const w = hash(i * 7.3 + Math.floor(t * 1.4 + hash(i) * 3)) < wf;
      if (w) waiting++;
      const ph = (t * 2.2 + hash(i * 3.1)) % 1;
      return w ? { hex: COL.amber, base: 0.32 + 0.2 * Math.sin(t * 7 + i) } : { hex: COL.cyan, base: 0.2, head: ph, len: 0.6 };
    }, { gap: 3, r: 3 });
    const a = prog(t, c.stall - 0.1, c.stall + 0.25);
    text(ctx, Math.round(waiting / 64 * 100) + '% waiting on data', X + WD - 24, LN.y + 36, { size: 24, weight: 700, family: F.mono, color: COL.amber, align: 'right', alpha: a * (1 - fin0) });
  }

  function level(ctx, t, l, i) {
    const on = tw(t, l.t, l.t + 0.35, E.out3);
    const hot = pulse(t, l.t + 0.1, 0.08, 1.2);
    const idle = prog(t, S0, S0 + 0.6);
    withAlpha(ctx, idle * (0.34 + 0.66 * on), () => {
      if (on > 0) glow(ctx, X + WD / 2, l.y + l.h / 2, WD * 0.6, l.hex, 0.1 * on + 0.2 * hot);
      rr(ctx, X, l.y, WD, l.h, 22);
      ctx.fillStyle = mixHex('#0C131D', l.hex, 0.05 + 0.1 * on + 0.12 * hot, 0.95); ctx.fill();
      ctx.strokeStyle = rgba(l.hex, 0.35 + 0.6 * on); ctx.lineWidth = 2.5 + 1.5 * hot; ctx.stroke();
      fillRR(ctx, X, l.y, 10, l.h, 5, rgba(l.hex, 0.5 + 0.5 * on));
      text(ctx, l.name, X + 34, l.y + 48, { size: 38, weight: 900, family: F.disp, color: on > 0.5 ? COL.white : l.hex, ls: 0.5 });
      text(ctx, l.sub, X + 34, l.y + 82, { size: 24, weight: 500, color: COL.dim, alpha: on });
      pill(ctx, l.speed, X + WD - 24, l.y + 36, { size: 23, bg: rgba(l.hex, 0.16), color: l.hex, stroke: rgba(l.hex, 0.85), align: 'right', alpha: on, ls: 1, h: 42 });
    });
  }

  addScene(B, function (ctx, t) {
    lanesStrip(ctx, t);
    /* distance axis on the left edge of the lower band */
    LV.forEach((l, i) => level(ctx, t, l, i));
    /* connectors between levels */
    const idle = prog(t, S0, S0 + 0.6);
    for (let i = 0; i < 4; i++) {
      const y0 = i === 0 ? LN.y + LN.h : LV[i - 1].y + LV[i - 1].h, y1 = LV[i].y;
      const on = prog(t, LV[i].t, LV[i].t + 0.3);
      for (const x of [596, 706, 816]) line(ctx, x, y0, x, y1, rgba(LV[i].hex, 0.25 + 0.6 * on), 4, idle);
    }

    /* registers: values hop to the lanes instantly */
    const rg = LV[0], rOn = prog(t, rg.t, rg.t + 0.3);
    if (rOn > 0) for (let k = 0; k < 9; k++) {
      const ph = ((t - rg.t) * 3.2 + k * 0.37) % 1, x = 460 + k * 42;
      fillRR(ctx, x - 13, rg.y + 62, 26, 26, 5, rgba(COL.cyan, 0.25 * rOn));
      if (t < c.small + 1.2) { const y = lerp(rg.y + 62, LN.y + LN.h - 6, E.out3(ph)); fillRR(ctx, x - 7, y, 14, 14, 3, rgba(COL.cyan, (1 - ph) * rOn)); }
    }

    /* shared memory: threads of a block trade results through the scratchpad */
    const sm = LV[1], sOn = prog(t, sm.t, sm.t + 0.3);
    if (sOn > 0) {
      const cellX = (k) => 470 + k * 46;
      for (let k = 0; k < 8; k++) fillRR(ctx, cellX(k) - 17, sm.y + 74, 34, 34, 7, rgba(COL.mint, (0.18 + 0.4 * pulse(t, c.trade - 0.35 + k * 0.11, 0.05, 0.6)) * sOn));
      for (let k = 0; k < 8; k++) dot(ctx, cellX(k), sm.y + 22, 7, COL.white, 0.9 * sOn * prog(t, c.threads - 0.2, c.threads + 0.1));
      const tr = prog(t, c.trade - 0.4, c.results + 0.9);
      if (tr > 0 && tr < 1) for (let k = 0; k < 8; k++) {
        const u = clamp(tr * 2.6 - k * 0.2);                  // thread k writes down, thread (k+3)%8 reads up
        if (u <= 0 || u >= 1) continue;
        const dst = (k + 3) % 8;
        const pos = u < 0.5 ? [cellX(k), lerp(sm.y + 30, sm.y + 90, E.io2(u * 2))] : [lerp(cellX(k), cellX(dst), E.io2((u - 0.5) * 2)), lerp(sm.y + 90, sm.y + 30, E.io2((u - 0.5) * 2))];
        glow(ctx, pos[0], pos[1], 26, COL.mint, 0.8); fillRR(ctx, pos[0] - 7, pos[1] - 7, 14, 14, 3, COL.white);
      }
    }

    /* caches: recently used tiles shimmer */
    const ch = LV[2], cOn = prog(t, ch.t, ch.t + 0.3);
    if (cOn > 0) for (let k = 0; k < 12; k++) {
      const on = hash(k * 3.3 + Math.floor(t * 3 + k * 0.4)) > 0.55;
      fillRR(ctx, 520 + k * 34, ch.y + 60, 27, 27, 5, rgba(COL.amber, (on ? 0.75 : 0.18) * cOn));
    }

    /* VRAM: big block of cells; a wide stream climbs to the lanes */
    const vr = LV[3], vOn = prog(t, vr.t, vr.t + 0.35);
    if (vOn > 0) {
      for (let j = 0; j < 3; j++) for (let i = 0; i < 30; i++) {
        const f = hash2(i + Math.floor(t * 2.2 + j), j * 3.7);
        ctx.fillStyle = rgba(COL.violet, (0.14 + 0.5 * f * f) * vOn);
        ctx.fillRect(X + 34 + i * 29.4, vr.y + 196 + j * 26, 23, 19);
      }
      /* bandwidth read-out */
      const n = Math.round(1792 * E.out3(prog(t, c.over - 0.1, c.gigabytes + 0.3)));
      const na = prog(t, c.over - 0.15, c.over + 0.15), hit = pulse(t, c.gigabytes + 0.3, 0.05, 0.6);
      const lim = E.outBack(prog(t, c.speed - 0.1, c.speed + 0.3));
      text(ctx, fmt(n), X + WD - 322, vr.y + 162 - 4 * hit, { size: 104 + 6 * hit, weight: 900, family: F.disp, color: lim > 0.5 ? COL.white : COL.violet, align: 'right', alpha: na, ls: -2 });
      text(ctx, 'GB/s', X + WD - 308, vr.y + 126, { size: 44, weight: 900, family: F.disp, color: COL.white, alpha: na });
      text(ctx, 'RTX 5090 · GDDR7', X + WD - 308, vr.y + 162, { size: 22, weight: 700, family: F.mono, color: COL.dim, alpha: na, ls: 1 });
      text(ctx, '32 GB', X + 34, vr.y + 150, { size: 50, weight: 900, family: F.disp, color: COL.violet, alpha: vOn * prog(t, c.vram + 0.2, c.vram + 0.5) });
      /* speed-limit ring: the bandwidth itself is the limit */
      if (lim > 0) {
        const cx = X + WD - 478, cy = vr.y + 122;
        ctx.save(); ctx.globalAlpha *= clamp(lim);
        ctx.beginPath(); ctx.ellipse(cx, cy, 262 * lim, 92 * lim, 0, 0, TAU);
        ctx.strokeStyle = COL.coral; ctx.lineWidth = 9; ctx.stroke(); ctx.restore();
        pill(ctx, 'THE REAL SPEED LIMIT', cx, vr.y + 250, { size: 25, bg: 'rgba(40,10,16,0.96)', color: COL.coral, stroke: COL.coral, alpha: prog(t, c.limit - 0.25, c.limit + 0.05), ls: 3, h: 48 });
      }
    }
    /* the stream: VRAM -> caches -> ... -> lanes, along three risers */
    if (t >= tFlow - 0.1) {
      const dens = t < tLimit ? 1 : 0.55;
      for (let k = 0; k < 54; k++) {
        const col = [596, 706, 816][k % 3] + (hash(k * 9.1) - 0.5) * 22;
        const sp = 0.55 + 0.25 * hash(k * 2.7);
        const u = ((t - tFlow) * sp + hash(k * 5.3)) % 1;
        if (t - tFlow < u / sp * 0.9 || hash(k * 1.3) > dens) continue;
        const y = lerp(vr.y + 20, LN.y + LN.h - 4, u);
        const a = clamp(u * 6) * clamp((1 - u) * 6);
        fillRR(ctx, col - 8, y - 8, 16, 16, 4, rgba(u > 0.72 ? COL.cyan : COL.violet, 0.95 * a));
        glow(ctx, col, y, 22, COL.violet, 0.5 * a);
      }
    }
    /* closing read-out: the math is ready, the data is late */
    const fin = prog(t, c.still - 0.1, c.still + 0.25);
    if (fin > 0) {
      pill(ctx, 'MATH: READY', X + 22, LN.y + 27, { size: 22, bg: 'rgba(4,20,27,0.97)', color: COL.cyan, stroke: COL.cyan, align: 'left', alpha: fin, ls: 2, h: 40 });
      pill(ctx, 'DATA: STILL ARRIVING', X + WD - 22 - 318, LN.y + 27, { size: 22, bg: 'rgba(30,18,4,0.97)', color: COL.amber, stroke: COL.amber, align: 'left', alpha: fin, ls: 2, h: 40 });
    }
  }, { type: 'panDown', d: 560 });
});
