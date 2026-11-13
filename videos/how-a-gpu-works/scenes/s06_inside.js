'use strict';
/* Scene 6 — INSIDE ONE UNIT (1:20–1:40)
   Myth bust: 21,760 "cores" are not tiny CPUs, they are arithmetic lanes in
   lock-step. Then the unit's anatomy, top to bottom: warp scheduler ->
   register file -> execution lanes -> shared memory. A stalled warp is
   swapped for another at zero cost because registers never leave the chip. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const B = 'inside';
  const c = {
    so: at(B, 'so'), twenty: at(B, 'twenty'), cores: at(B, 'cores'), arent: at(B, "aren't"), tiny: at(B, 'tiny'), cpus: at(B, 'cpus'), cpusEnd: at(B, 'cpus', 1, 't1'),
    theyre: at(B, "they're"), lanes: at(B, 'lanes'), arithmetic: at(B, 'arithmetic'), marching: at(B, 'marching'), lockstep: at(B, 'lockstep'), lockstepEnd: at(B, 'lockstep', 1, 't1'),
    inside: at(B, 'inside'), unit: at(B, 'unit'), scheduler: at(B, 'scheduler'), juggles: at(B, 'juggles'), dozens: at(B, 'dozens'), warps: at(B, 'warps'),
    every: at(B, 'every'), keeps: at(B, 'keeps'), registers: at(B, 'registers'), chip: at(B, 'chip'),
    so2: at(B, 'so', 2), warp: at(B, 'warp'), stalls: at(B, 'stalls'), memory: at(B, 'memory'), another: at(B, 'another'), takes: at(B, 'takes'),
    instantly: at(B, 'instantly'), zero: at(B, 'zero'), cost: at(B, 'cost'), costEnd: at(B, 'cost', 1, 't1'),
  };
  const S0 = beatOf(B).t0 - 0.5;
  const tBuild = [c.inside - 0.35, c.unit + 0.35];           // lanes shrink into the unit diagram

  /* ---------- myth-bust layout ---------- */
  const MC = { cols: 8, rows: 5, s: 100, gx: 17, gy: 14, x0: 80, y0: 624 };
  const mcPos = (i, j) => [MC.x0 + i * (MC.s + MC.gx), MC.y0 + j * (MC.s + MC.gy)];
  const ROWS_Y = [672, 806, 940, 1074], ROW_H = 108;         // four rows of 32 lanes (= 128 lanes, one unit)

  /* ---------- unit diagram layout ---------- */
  const PX = 70, PW = 940;
  const SCH = { y: 384, h: 180 }, REGP = { y: 582, h: 186 }, LNP = { y: 786, h: 226 }, MEMP = { y: 1030, h: 170 };
  const CARD = { w: 96, h: 90, gap: 15 };
  const cardX = (k) => PX + (PW - (8 * CARD.w + 7 * CARD.gap)) / 2 + k * (CARD.w + CARD.gap);
  const WCOL = [COL.cyan, COL.mint, COL.amber, COL.violet, COL.cyan, COL.mint, COL.violet, COL.cyan];

  /* ---------- scheduler timeline ---------- */
  const STALL = 2;                                            // the warp that will wait on memory
  const tStallPick = c.warp - 0.2, tStall = c.stalls, tSwap = tStall + 0.34, tBack = c.zero + 0.45, tReady = tBack + 0.55;
  const ORDER = [0, 3, 1, 5, 4, 7, 6, 3, 0, 5, 1, 7, 4, 6, 3, 5, 0, 1, 7, 4, 6, 3, 5, 0];
  const JUG0 = c.scheduler - 0.2, STEP = 0.3;
  function activeAt(t) {
    /* returns {k, t0}: which warp issues now and since when */
    if (t < JUG0) return { k: -1, t0: 0 };
    if (t >= tStallPick && t < tSwap) return { k: STALL, t0: tStallPick };
    const base = t < tStallPick ? JUG0 : tSwap;
    const n = Math.floor((t - base) / STEP);
    let k = ORDER[(n + (t < tStallPick ? 0 : 5)) % ORDER.length];
    if (k === STALL && t < tReady) k = 3;
    return { k, t0: base + n * STEP };
  }

  /* ---------- sound ---------- */
  sfx(S0 + 0.1, 'whoosh', 0.7);
  sfx(S0 + 0.15, 'thump', 0.7);
  sfx(c.arent, 'deny', 0.9); sfx(c.arent + 0.3, 'rip', 0.7);
  sfx(c.lanes, 'chime', 0.5);
  for (let k = 0; k < 4; k++) sfx(c.marching + k * 0.42, 'thump', 0.75);
  sfx(tBuild[0], 'whoosh', 0.8);
  for (let k = 0; k < 4; k++) sfx(tBuild[0] + 0.25 + k * 0.14, 'pop', 0.5, { pitch: 0.9 + k * 0.1 });
  for (let n = 0; JUG0 + n * STEP < tStallPick - 0.05; n++) sfx(JUG0 + n * STEP, 'tick', 0.38, { pitch: 0.9 + (n % 4) * 0.08 });
  sfx(c.registers, 'blip', 0.7);
  sfx(tStall, 'stall', 0.95);
  sfx(tSwap, 'lock', 0.9);
  for (let n = 0; tSwap + n * STEP < c.zero - 0.1; n++) sfx(tSwap + n * STEP + 0.01, 'tick', 0.38, { pitch: 1 + (n % 4) * 0.08 });
  sfx(c.zero, 'impact', 0.8); sfx(c.zero + 0.05, 'chime', 0.7);
  sfx(tReady, 'blip', 0.6);

  function miniCore(ctx, x, y, s, t, id, brainA, brainDrop, bodyA) {
    if (bodyA <= 0.003) return;
    const ga = ctx.globalAlpha; ctx.globalAlpha = ga * bodyA;
    fillRR(ctx, x, y, s, s, 14, 'rgba(12,19,29,0.95)');
    strokeRR(ctx, x, y, s, s, 14, rgba(COL.lineHi, 0.9), 2);
    /* arithmetic half */
    fillRR(ctx, x + 10, y + s * 0.6, s - 20, s * 0.3, 7, rgba(COL.cyan, 0.55 + 0.4 * Math.pow(Math.sin(t * 3.6), 2)));
    ctx.globalAlpha = ga;
    /* "brain": private control logic each real CPU core would need */
    if (brainA > 0.003) {
      ctx.save(); ctx.globalAlpha = ga * brainA * bodyA;
      ctx.translate(x + s / 2, y + s * 0.3 + brainDrop * 160); ctx.rotate(brainDrop * (hash(id) - 0.5) * 2.4);
      const blink = hash(id * 3.3 + Math.floor(t * 7 + hash(id * 9) * 7)) > 0.5 ? 1 : 0.45;
      fillRR(ctx, -s / 2 + 10, -s * 0.2, s - 20, s * 0.4, 7, rgba(COL.amber, 0.3 + 0.55 * blink));
      text(ctx, '?', 0, 13, { size: 36, weight: 800, family: F.mono, color: '#1A1203', align: 'center' });
      ctx.restore();
    }
  }

  function lockstepRows(ctx, t, A, squeeze) {
    /* four rows of 32 lanes; each row moves as one, rows fire one after another */
    if (A <= 0.003) return;
    const period = 0.84;
    withAlpha(ctx, A, () => {
      for (let r = 0; r < 4; r++) {
        /* the rows settle straight down into the unit's lane panel (no sideways shuffle) */
        const y = lerp(ROWS_Y[r], LNP.y + 58 + r * 38, squeeze), h = lerp(ROW_H, 32, squeeze);
        const x = lerp(86, PX + 24, squeeze), w = lerp(908, PW - 48, squeeze);
        const ph = ((t - c.marching) / period - r * 0.25);
        const u = ph - Math.floor(ph);
        const on = t >= c.lanes ? 1 : 0;
        drawLanes(ctx, x, y, w, h, 32, () => ({ hex: COL.cyan, base: 0.22, head: on && u < 0.6 ? E.out2(u / 0.6) : null, len: 0.5 }), { gap: lerp(4, 2, squeeze), r: lerp(6, 2, squeeze) });
        tag(ctx, '32 LANES', x, y - 10, { size: 20, color: COL.dim, alpha: (1 - squeeze) * prog(t, c.lanes, c.lanes + 0.3) });
      }
    });
  }

  function unitDiagram(ctx, t, A) {
    if (A <= 0.003) return;
    const act = activeAt(t);
    const stalled = t >= tStall && t < tReady;
    withAlpha(ctx, A, () => {
      const pin = (k) => E.out3(prog(t, tBuild[0] + 0.25 + k * 0.14, tBuild[0] + 0.7 + k * 0.14));
      /* ----- warp scheduler ----- */
      const p0 = pin(0);
      withAlpha(ctx, p0, () => {
        panel(ctx, PX, SCH.y, PW, SCH.h, { r: 24, accent: COL.amber, accentA: 0.55 });
        tag(ctx, 'WARP SCHEDULER', PX + 26, SCH.y + 40, { size: 24, color: COL.amber });
        const note = 1 - prog(t, c.zero - 0.2, c.zero);
        text(ctx, 'dozens of warps live here', PX + PW - 26, SCH.y + 40, { size: 24, weight: 600, color: COL.dim, align: 'right', alpha: note * prog(t, c.dozens - 0.1, c.dozens + 0.2) });
        for (let k = 0; k < 8; k++) {
          const x = cardX(k), y = SCH.y + 62;
          const isAct = act.k === k, isStall = k === STALL && stalled;
          const hex = isStall ? COL.amber : WCOL[k];
          const hot = isAct ? 0.55 + 0.45 * pulse(t, act.t0, 0.04, 0.35) : 0;
          if (hot > 0) glow(ctx, x + CARD.w / 2, y + CARD.h / 2, 110, hex, 0.5 * hot);
          fillRR(ctx, x, y - 8 * hot, CARD.w, CARD.h, 14, mixHex('#111A27', hex, 0.1 + 0.5 * hot, 1));
          strokeRR(ctx, x, y - 8 * hot, CARD.w, CARD.h, 14, rgba(isAct ? COL.white : hex, isAct ? 1 : 0.6), isAct ? 3.5 : 2);
          text(ctx, 'W' + k, x + CARD.w / 2, y + 40 - 8 * hot, { size: 32, weight: 800, family: F.mono, color: isAct ? COL.white : hex, align: 'center' });
          if (isStall) {            // waiting spinner
            ctx.save(); ctx.translate(x + CARD.w / 2, y + 66); ctx.rotate(t * 5);
            ctx.strokeStyle = COL.amber; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 1.4); ctx.stroke(); ctx.restore();
          } else {
            text(ctx, isAct ? 'RUN' : 'READY', x + CARD.w / 2, y + 74 - 8 * hot, { size: 18, weight: 700, family: F.mono, color: isAct ? COL.white : COL.dim, align: 'center', ls: 2 });
          }
        }
        const z = E.outBack(prog(t, c.zero - 0.05, c.zero + 0.3));
        if (z > 0) {
          ctx.save(); ctx.translate(PX + PW - 190, SCH.y + 34); ctx.rotate(-0.045); ctx.scale(z, z);
          pill(ctx, 'SWITCH COST  0', 0, 0, { size: 28, bg: 'rgba(4,26,18,0.97)', color: COL.mint, stroke: COL.mint, ls: 2, h: 52, r: 12 });
          ctx.restore();
        }
      });
      /* ----- register file ----- */
      const p1 = pin(1);
      withAlpha(ctx, p1, () => {
        const regHot = win(t, c.keeps, c.so2 - 0.1, 0.3, 0.5);
        panel(ctx, PX, REGP.y, PW, REGP.h, { r: 24, accent: COL.violet, accentA: 0.45 + 0.5 * regHot });
        tag(ctx, 'REGISTER FILE', PX + 26, REGP.y + 40, { size: 24, color: COL.violet });
        text(ctx, 'every thread’s registers stay on-chip', PX + PW - 26, REGP.y + 40, { size: 24, weight: 600, color: regHot > 0.3 ? COL.white : COL.dim, align: 'right', alpha: prog(t, c.registers - 0.15, c.registers + 0.2) });
        for (let k = 0; k < 8; k++) {
          const x = cardX(k), y = REGP.y + 60, isAct = act.k === k, isStall = k === STALL && stalled;
          const hex = isStall ? COL.amber : WCOL[k];
          const wave = pulse(t, c.registers + k * 0.07, 0.05, 0.6);
          line(ctx, x + CARD.w / 2, SCH.y + SCH.h - 28, x + CARD.w / 2, y, rgba(hex, isAct || isStall ? 0.9 : 0.25), 2);
          for (let j = 0; j < 4; j++) for (let i = 0; i < 8; i++) {          // 32 register sets: one per thread
            const lvl = (isAct ? 0.85 : isStall ? 0.7 : 0.22) + 0.6 * wave;
            ctx.fillStyle = mixHex('#151B28', hex, clamp(lvl * (0.7 + 0.3 * hash(k * 40 + j * 8 + i + Math.floor(t * (isAct ? 12 : 0))))), 1);
            ctx.fillRect(x + 2 + i * 11.6, y + j * 26, 9.4, 21);
          }
        }
      });
      /* ----- execution lanes ----- */
      const p2 = pin(2);
      withAlpha(ctx, p2, () => {
        panel(ctx, PX, LNP.y, PW, LNP.h, { r: 24, accent: COL.cyan, accentA: 0.6 });
        tag(ctx, 'EXECUTION LANES', PX + 26, LNP.y + 40, { size: 24, color: COL.cyan });
        const busy = prog(t, c.another - 0.2, c.another + 0.1);
        text(ctx, 'kept busy', PX + PW - 26, LNP.y + 40, { size: 24, weight: 700, color: COL.mint, align: 'right', alpha: busy });
      });
      if (t >= tBuild[1] - 0.05) {
        const u = act.k < 0 ? 2 : (t - act.t0) / 0.26;
        const hex = act.k < 0 ? COL.cyan : (act.k === STALL && t >= tStall ? COL.amber : WCOL[act.k]);
        for (let g = 0; g < 4; g++) {
          drawLanes(ctx, PX + 24 + g * ((PW - 48 + 16) / 4), LNP.y + 56, (PW - 48 + 16) / 4 - 16, 150, 32,
            () => ({ hex, base: 0.2, head: u >= 0 && u <= 1 ? E.out2(u) : null, len: 0.55 }), { gap: 2, r: 2 });
        }
      }
      /* ----- shared memory ----- */
      const p3 = pin(3);
      withAlpha(ctx, p3, () => {
        panel(ctx, PX, MEMP.y, PW, MEMP.h, { r: 24, accent: COL.violet, accentA: 0.5 });
        tag(ctx, 'SHARED MEMORY · L1 CACHE', PX + 26, MEMP.y + 40, { size: 24, color: COL.violet });
        for (let j = 0; j < 2; j++) for (let i = 0; i < 28; i++) {
          const on = hash(i * 5 + j * 11 + Math.floor(t * 2.5 + i * 0.3)) > 0.72;
          fillRR(ctx, PX + 26 + i * 31.9, MEMP.y + 62 + j * 44, 25, 34, 5, rgba(COL.violet, on ? 0.7 : 0.16));
        }
        text(ctx, 'L2 · VRAM  ↓', PX + PW - 26, MEMP.y + 40, { size: 24, weight: 700, family: F.mono, color: COL.dim, align: 'right' });
      });

      /* ----- the stalled warp's request goes down for data and returns ----- */
      const lx = cardX(STALL) + CARD.w / 2;
      const down = prog(t, tStall - 0.1, c.memory + 0.35);
      if (down > 0 && t < tReady + 0.3) {
        const yA = LNP.y + LNP.h - 10, yB = H + 60;
        const back = prog(t, tBack - 0.6, tBack + 0.1);
        const y = back > 0 ? lerp(yB, yA, E.out2(back)) : lerp(yA, yB, E.in2(down));
        line(ctx, lx, yA, lx, 1210, rgba(COL.amber, 0.5 * (1 - prog(t, tReady, tReady + 0.3))), 3, 1, [7, 9]);
        if (y < 1215) { glow(ctx, lx, y, 42, back > 0 ? COL.violet : COL.amber, 0.9); fillRR(ctx, lx - 12, y - 12, 24, 24, 6, back > 0 ? COL.violet : COL.amber); }
        const wl = win(t, tStall + 0.05, tReady, 0.2, 0.3);
        pill(ctx, 'W2 WAITING ON MEMORY', lx + 196, MEMP.y + MEMP.h + 2, { size: 22, bg: 'rgba(30,18,4,0.96)', color: COL.amber, stroke: rgba(COL.amber, 0.9), alpha: wl * (1 - prog(t, c.zero - 0.3, c.zero)), ls: 1 });
      }
    });
  }

  addScene(B, function (ctx, t) {
    const build = tw(t, tBuild[0], tBuild[1], E.io3);
    const mythA = 1 - prog(build, 0, 0.5);

    if (mythA > 0.003) withAlpha(ctx, mythA, () => {
      /* headline */
      const nIn = tw(t, S0 - 0.35, S0 + 0.25, E.out3);
      text(ctx, '21,760', 540, 486 + (1 - nIn) * 30, { size: 150, weight: 900, family: F.disp, color: COL.amber, align: 'center', alpha: nIn, ls: -3 });
      text(ctx, '“CORES”', 540, 566, { size: 62, weight: 800, family: F.disp, color: COL.white, align: 'center', alpha: win(t, S0 - 0.3, c.cores - 0.2, 0.3, 0.2), ls: 6 });
      const s1 = win(t, c.cores - 0.2, c.arent - 0.05, 0.25, 0.15);
      text(ctx, 'tiny CPUs?', 540, 566, { size: 62, weight: 800, family: F.disp, color: COL.white, align: 'center', alpha: s1 });
      const s2 = win(t, c.arent - 0.05, c.theyre - 0.05, 0.15, 0.25);
      if (s2 > 0) {
        text(ctx, 'tiny CPUs', 540, 566, { size: 62, weight: 800, family: F.disp, color: COL.dim, align: 'center', alpha: s2 });
        const st = E.out3(prog(t, c.arent, c.arent + 0.3));
        line(ctx, 540 - 170, 548, 540 - 170 + 340 * st, 548, COL.coral, 8, s2);
        text(ctx, 'NO', 540 + 230, 566, { size: 54, weight: 900, family: F.disp, color: COL.coral, align: 'center', alpha: s2 * prog(t, c.arent + 0.2, c.arent + 0.4) });
      }
      const s3 = prog(t, c.theyre - 0.05, c.lanes + 0.1);
      text(ctx, 'lanes of arithmetic', 540, 566, { size: 62, weight: 800, family: F.disp, color: COL.cyan, align: 'center', alpha: s3 });
      text(ctx, '170 units × 128 lanes, in lockstep', 540, 610, { size: 28, weight: 700, family: F.mono, color: COL.dim, align: 'center', alpha: prog(t, c.arithmetic + 0.3, c.arithmetic + 0.7), ls: 1 });

      /* tiny "CPUs": each with a private brain that blinks on its own */
      const lanesIn = tw(t, c.theyre - 0.1, c.lanes + 0.45, E.io3);
      const drop = E.in2(prog(t, c.arent + 0.1, c.arent + 0.95));
      if (lanesIn < 1) {
        for (let j = 0; j < MC.rows; j++) for (let i = 0; i < MC.cols; i++) {
          const [x, y] = mcPos(i, j), id = j * MC.cols + i;
          const p = E.outBack(prog(t, S0 - 0.25 + (i + j) * 0.05, S0 + 0.1 + (i + j) * 0.05));
          if (p <= 0) continue;
          ctx.save(); ctx.translate(x + MC.s / 2, y + MC.s / 2 + 26); ctx.scale(p, p); ctx.translate(-MC.s / 2, -MC.s / 2);
          miniCore(ctx, 0, 0, MC.s, t, id, 1 - prog(drop, 0.5, 1), drop, 1 - lanesIn);
          ctx.restore();
        }
        if (s2 > 0) cross(ctx, 540, 930, 250, rgba(COL.coral, 0.85 * s2 * (1 - prog(t, c.cpusEnd, c.theyre))), prog(t, c.arent + 0.05, c.arent + 0.45), 16);
      }
    });

    /* four rows of lanes in lock-step; later they fold into the unit diagram */
    const lanesIn = tw(t, c.theyre - 0.1, c.lanes + 0.45, E.io3);
    lockstepRows(ctx, t, lanesIn * (1 - prog(build, 0.6, 0.95)), build);
    withCam(ctx, { fx: 540, fy: 792, zoom: 1 + 0.03 * prog(t, tBuild[1], c.costEnd + 0.5) }, () => unitDiagram(ctx, t, prog(build, 0.2, 0.75)));
  }, { type: 'zoomOut', fx: 540, fy: 800, z: 0.5, zb: 1.4, bx: 540, by: 800 });
});
