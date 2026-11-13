'use strict';
/* Scene 9 — THE LIMITS (2:15–2:26)
   Divergence: when a warp's threads take different branches, each path runs
   in turn while the other threads are masked off (half idle).
   Synchronisation: threads that must wait on each other leave lanes dark.  */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const B = 'limits';
  const c = {
    but: at(B, 'but'), threads: at(B, 'threads'), disagree: at(B, 'disagree'), half: at(B, 'half'), left: at(B, 'left'), half2: at(B, 'half', 2), right: at(B, 'right'),
    and: at(B, 'and'), half3: at(B, 'half', 3), squad: at(B, 'squad'), sits: at(B, 'sits'), idle: at(B, 'idle'), others: at(B, 'others'), work: at(B, 'work'), workEnd: at(B, 'work', 1, 't1'),
    make: at(B, 'make', 2), wait: at(B, 'wait'), each: at(B, 'each'), other: at(B, 'other'), lanes: at(B, 'lanes'), go: at(B, 'go'), quiet: at(B, 'quiet'), quietEnd: at(B, 'quiet', 1, 't1'),
  };
  const S0 = beatOf(B).t0 - 0.5;
  const LX = 86, LW = 908, N = 32;
  const SEG = { a: [476, 590], bar: [606, 664], then: [680, 896], els: [912, 1128] };
  /* which way each thread branches: exactly 16 / 16, scattered */
  const rank = Array.from({ length: N }, (_, i) => [hash(i * 4.77 + 1.3), i]).sort((p, q) => p[0] - q[0]);
  const goesLeft = new Array(N).fill(false); rank.slice(0, 16).forEach((r) => { goesLeft[r[1]] = true; });
  const cx = (i) => laneX(LX, LW, N, i, 4);
  const tPtr = [c.but - 0.1, c.disagree];                    // pointer crosses the common code
  const tThen = [c.and - 0.05, c.sits + 0.25], tElse = [c.sits + 0.3, c.workEnd + 0.1];
  const tSync = [c.make - 0.45, c.make + 0.1];               // cross-fade to the synchronisation picture
  const GATE_Y = 736, WAIT_Y = 646, DONE_Y = 830, LANES_Y = [906, 1128];
  const tPass0 = c.wait - 0.15, PASS = 0.3;

  sfx(S0 + 0.1, 'whoosh', 0.7);
  sfx(c.disagree, 'deny', 1.0); sfx(c.left, 'blip', 0.6, { pitch: 0.9 }); sfx(c.right, 'blip', 0.6, { pitch: 1.2 });
  sfx(tThen[0], 'stall', 0.9); sfx(tThen[0] + 0.05, 'thump', 0.6); sfx(tElse[0], 'thump', 0.6);
  sfx(tSync[0], 'whoosh', 0.6);
  for (let k = 0; k < 9; k++) sfx(tPass0 + k * PASS, 'tick', 0.5, { pitch: 0.85 });
  sfx(c.quiet, 'stall', 1.0);

  function meter(ctx, t, value, label, hex) {
    /* how many lanes are doing useful work */
    const x = 70, y = 384, w = 940, h = 78;
    panel(ctx, x, y, w, h, { r: 20, accent: hex, accentA: 0.6 });
    tag(ctx, 'LANES DOING WORK', x + 24, y + 48, { size: 23, color: COL.dim });
    const bx = x + 320, bw = 440;
    fillRR(ctx, bx, y + 26, bw, 26, 13, 'rgba(40,52,68,0.8)');
    fillRR(ctx, bx, y + 26, Math.max(26, bw * value), 26, 13, hex);
    text(ctx, Math.round(value * 100) + '%', x + w - 24, y + 53, { size: 44, weight: 900, family: F.disp, color: hex, align: 'right', ls: -1 });
    if (label) text(ctx, label, bx + bw / 2, y + 46, { size: 20, weight: 800, family: F.mono, color: '#06090E', align: 'center', ls: 2 });
  }

  function divergence(ctx, t, A) {
    if (A <= 0.003) return;
    const split = tw(t, c.disagree - 0.05, c.disagree + 0.3, E.out3);
    const inThen = t >= tThen[0] && t < tElse[0], inElse = t >= tElse[0] && t < tElse[1];
    const util = t < tThen[0] ? 1 : lerp(1, 0.5, tw(t, tThen[0], tThen[0] + 0.35));
    withAlpha(ctx, A, () => {
      meter(ctx, t, util, '', util < 0.75 ? COL.coral : COL.cyan);
      /* segment frames */
      const segLabel = (name, y0, hex, a) => { pill(ctx, name, LX + 4, y0 + 26, { size: 22, bg: 'rgba(6,10,16,0.94)', color: hex, stroke: rgba(hex, 0.8), align: 'left', alpha: a, ls: 1.5, h: 38, r: 10 }); };
      const tA = prog(t, c.left - 0.2, c.left + 0.1), eA = prog(t, c.right - 0.2, c.right + 0.1);
      /* lanes: one tall column per thread */
      const y0 = SEG.a[0], y1 = SEG.els[1];
      const ptr = t < tPtr[1] ? lerp(SEG.a[0], SEG.bar[0], prog(t, tPtr[0], tPtr[1]))
        : t < tThen[0] ? SEG.bar[0] + 30
        : t < tElse[0] ? lerp(SEG.then[0], SEG.then[1], prog(t, tThen[0], tElse[0] - 0.05))
        : lerp(SEG.els[0], SEG.els[1], prog(t, tElse[0], tElse[1]));
      for (let i = 0; i < N; i++) {
        const x = cx(i), lw = 24.4, L = goesLeft[i];
        const hex = mixHex(COL.cyan, L ? COL.cyan : COL.violet, split, 1);
        const colHex = split > 0.5 ? (L ? COL.cyan : COL.violet) : COL.cyan;
        /* common code */
        fillRR(ctx, x - lw / 2, SEG.a[0], lw, SEG.a[1] - SEG.a[0], 5, mixHex('#0C1A26', COL.cyan, 0.28, 1));
        /* THEN path: left-goers work, right-goers are masked; ELSE path: the reverse */
        for (const [seg, mine, active, lab] of [[SEG.then, L, inThen, tA], [SEG.els, !L, inElse, eA]]) {
          rr(ctx, x - lw / 2, seg[0], lw, seg[1] - seg[0], 5);
          if (lab < 1) { ctx.globalAlpha = A * (1 - lab); ctx.fillStyle = 'rgba(22,34,48,0.85)'; ctx.fill(); ctx.strokeStyle = 'rgba(80,110,145,0.35)'; ctx.lineWidth = 1; ctx.stroke(); }
          if (lab > 0) {
            ctx.globalAlpha = A * lab;
            if (mine) { ctx.fillStyle = mixHex('#0C1A26', colHex, active ? 0.5 : 0.26, 1); ctx.fill(); }
            else { ctx.fillStyle = 'rgba(30,37,48,0.75)'; ctx.fill(); ctx.strokeStyle = 'rgba(120,135,155,0.28)'; ctx.lineWidth = 1; ctx.stroke(); }
          }
          ctx.globalAlpha = A;
        }
        /* pulse where the single instruction pointer currently is */
        const active = t < tThen[0] || (inThen && L) || (inElse && !L);
        if (active && t < tElse[1]) {
          glow(ctx, x, ptr, 26, colHex, 0.8); fillRR(ctx, x - lw / 2, ptr - 26, lw, 30, 5, COL.white);
        } else if (t >= tThen[0] && t < tElse[1]) {
          text(ctx, '–', x, ptr + 6, { size: 22, weight: 800, family: F.mono, color: 'rgba(150,165,185,0.7)', align: 'center' });
        }
        /* thread head showing which way it wants to go */
        dot(ctx, x, SEG.bar[0] + 29, 9 + (split > 0.5 && t < tElse[1] ? 1.6 * Math.sin(t * 8 + (L ? 0 : Math.PI)) : 0), hex);
        if (split > 0.4) text(ctx, L ? '‹' : '›', x, SEG.bar[0] + 37, { size: 24, weight: 900, family: F.mono, color: '#06090E', align: 'center', alpha: split });
      }
      /* the branch */
      const bh = pulse(t, c.disagree, 0.06, 0.9);
      glow(ctx, 540, SEG.bar[0] + 29, 560, COL.amber, 0.25 * bh);
      strokeRR(ctx, LX - 8, SEG.bar[0], LW + 16, 58, 29, rgba(COL.amber, 0.55 + 0.45 * bh), 3);
      pill(ctx, 'if (x > 0)', 540, SEG.bar[0] - 4, { size: 24, bg: 'rgba(26,17,4,0.97)', color: COL.amber, stroke: COL.amber, alpha: prog(t, c.threads, c.threads + 0.3), ls: 1, h: 40 });
      /* path labels */
      segLabel('THEN-PATH  ·  16 GO LEFT', SEG.then[0], COL.cyan, tA);
      segLabel('ELSE-PATH  ·  16 GO RIGHT', SEG.els[0], COL.violet, eA);
      /* the one shared instruction pointer */
      if (t < tElse[1] + 0.2) {
        line(ctx, LX - 14, ptr, LX + LW + 14, ptr, rgba(COL.white, 0.9), 2.5);
        arrowHead(ctx, LX - 4, ptr, 0, 16, COL.white);
      }
      /* idle call-out */
      const idA = win(t, c.idle - 0.25, tSync[0] + 0.1, 0.2, 0.3);
      if (idA > 0) {
        const seg = t < tElse[0] ? SEG.then : SEG.els;
        pill(ctx, 'HALF THE WARP IS MASKED OFF', 540, seg[0] + (seg[1] - seg[0]) / 2 + (t < tElse[0] ? 50 : -50), { size: 26, bg: 'rgba(40,10,16,0.96)', color: COL.coral, stroke: COL.coral, alpha: idA, ls: 2, h: 50 });
      }
    });
  }

  function sync(ctx, t, A) {
    /* one shared result, one thread through the gate at a time */
    if (A <= 0.003) return;
    const passed = clamp(Math.floor((t - tPass0) / PASS), 0, N);
    const cur = (t - tPass0) / PASS - Math.floor((t - tPass0) / PASS);
    const quiet = tw(t, c.lanes - 0.1, c.quiet + 0.3, E.io2);
    const util = lerp(1, 0.03, tw(t, tSync[1], c.wait + 0.3));
    withAlpha(ctx, A, () => {
      meter(ctx, t, util, '', COL.coral);
      text(ctx, 'ONE SHARED RESULT', 540, 520, { size: 46, weight: 900, family: F.disp, color: COL.white, align: 'center' });
      text(ctx, 'every thread needs it, so they take turns', 540, 562, { size: 28, weight: 600, color: COL.dim, align: 'center' });
      /* waiting threads */
      for (let i = 0; i < N; i++) {
        const x = cx(i);
        let y = WAIT_Y, a = 1, r = 10, hex = COL.amber;
        if (i < passed) { y = DONE_Y; hex = COL.mint; a = 0.9; }
        else if (i === passed && t >= tPass0) { const e = E.io2(cur); y = lerp(WAIT_Y, DONE_Y, e); hex = COL.white; r = 12; glow(ctx, x, y, 40, COL.white, 0.8); }
        dot(ctx, x, y, r, hex, a);
        /* lane below the gate: dark unless this thread holds the lock */
        const on = i === passed && t >= tPass0 && cur > 0.45;
        fillRR(ctx, x - 12.2, LANES_Y[0], 24.4, LANES_Y[1] - LANES_Y[0], 5, on ? mixHex('#0C1A26', COL.cyan, 0.9 * (1 - quiet), 1) : 'rgba(26,34,46,0.8)');
      }
      /* the gate with its lock */
      fillRR(ctx, LX - 8, GATE_Y - 15, LW + 16, 30, 10, 'rgba(60,24,30,0.95)');
      strokeRR(ctx, LX - 8, GATE_Y - 15, LW + 16, 30, 10, COL.coral, 3);
      pill(ctx, 'LOCK  ·  ONE AT A TIME', 540, GATE_Y, { size: 26, bg: 'rgba(40,10,16,0.98)', color: COL.coral, stroke: COL.coral, ls: 3, h: 52 });
      tag(ctx, 'WAITING', LX, WAIT_Y - 26, { size: 21, color: COL.amber });
      tag(ctx, 'DONE', LX, DONE_Y + 44, { size: 21, color: COL.mint, alpha: prog(t, tPass0 + 0.3, tPass0 + 0.6) });
      text(ctx, '31 of 32 lanes dark', 540, DONE_Y + 46, { size: 26, weight: 800, family: F.mono, color: COL.coral, align: 'center', alpha: prog(t, c.lanes - 0.1, c.lanes + 0.2), ls: 1 });
    });
  }

  addScene(B, function (ctx, t) {
    const sw = tw(t, tSync[0], tSync[1], E.io3);
    divergence(ctx, t, 1 - sw);
    sync(ctx, t, sw);
    /* the three things that break lock-step */
    const chips = [['DIVERGENCE', c.idle - 0.1], ['WAITING', c.wait], ['MEMORY', c.go]];
    chips.forEach(([name, tt], i) => {
      const p = E.outBack(prog(t, tt, tt + 0.3));
      if (p <= 0) return;
      ctx.save(); ctx.translate(70 + 156 + i * 314, 1178); ctx.scale(p, p);
      pill(ctx, name, 0, 0, { size: 25, bg: 'rgba(40,10,16,0.96)', color: COL.coral, stroke: COL.coral, ls: 2.5, h: 50, r: 12 });
      ctx.restore();
    });
  }, { type: 'panDown', d: 520 });
});
