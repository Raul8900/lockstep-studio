'use strict';
/* Scene 3 — THE HAND-OFF (0:30–0:42)
   The program keeps running on the CPU. It copies data into the GPU's own
   memory, then sends one small function with one order: run it a million
   times. Data flows top to bottom along the bus.                           */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const B = 'dispatch';
  const c = {
    doesnt: at(B, "doesn't"), program: at(B, 'program'), the: at(B, 'the'), cpu: at(B, 'cpu'), does: at(B, 'does'),
    copies: at(B, 'copies'), data: at(B, 'data'), memory: at(B, 'memory'), memoryEnd: at(B, 'memory', 1, 't1'),
    then: at(B, 'then'), sends: at(B, 'sends'), one: at(B, 'one'), fn: at(B, 'function'), order: at(B, 'order'),
    run: at(B, 'run', 2), million: at(B, 'million'), times: at(B, 'times'), timesEnd: at(B, 'times', 1, 't1'),
  };
  const S0 = beatOf(B).t0 - 0.5;

  /* geometry */
  const WIN = { x: 70, y: 404, w: 548, h: 300 };
  const CPUc = { x: 822, y: 548, s: 236 };
  const GPUc = { x: 540, y: 1012, s: 300 };
  const RAIL = 786;                                   // y of the horizontal bus rail
  const VR = [{ x: 96, y: 880 }, { x: 824, y: 880 }]; // VRAM stacks (left, right), 160 wide
  const busDown = [[CPUc.x, CPUc.y + CPUc.s / 2 + 14], [CPUc.x, RAIL]];
  const toLeft = [[CPUc.x, CPUc.y + 132], [CPUc.x, RAIL], [VR[0].x + 80, RAIL], [VR[0].x + 80, VR[0].y - 6]];
  const toRight = [[CPUc.x, CPUc.y + 132], [CPUc.x, RAIL], [VR[1].x + 80, RAIL], [VR[1].x + 80, VR[1].y - 6]];
  const toGpu = [[CPUc.x, CPUc.y + 132], [CPUc.x, RAIL], [GPUc.x, RAIL], [GPUc.x, GPUc.y - GPUc.s / 2 - 10]];

  const CODE = ['load(scene)', 'update(physics)', 'if (enemy.near) dodge()', 'gpu.upload(data)', 'gpu.run(shade, 1e6)', 'present(frame)'];
  const tCopy0 = c.copies, tCopy1 = c.memoryEnd + 0.35;
  const tCard0 = c.sends - 0.1, tCard1 = c.order + 0.55;
  const tRun = c.run;

  sfx(S0 + 0.1, 'whoosh', 0.7);
  sfx(c.doesnt, 'deny', 0.6);
  sfx(c.cpu, 'thump', 0.8);
  sfx(tCopy0, 'data', 0.8, { dur: tCopy1 - tCopy0 });
  sfx(c.memoryEnd, 'blip', 0.6);
  sfx(tCard0, 'pop', 0.7);
  sfx(tCard0 + 0.1, 'slide', 0.6, { dur: tCard1 - tCard0 });
  sfx(tCard1, 'lock', 0.8);
  sfx(tRun, 'count', 0.8, { dur: c.times - tRun + 0.2 });
  sfx(c.times + 0.25, 'impact', 1.0);

  function drawWindow(ctx, t) {
    panel(ctx, WIN.x, WIN.y, WIN.w, WIN.h, { r: 20, fill: 'rgba(10,16,25,0.94)', stroke: rgba(COL.lineHi, 0.7) });
    fillRR(ctx, WIN.x, WIN.y, WIN.w, 46, 20, 'rgba(26,38,56,0.9)');
    ctx.fillStyle = 'rgba(26,38,56,0.9)'; ctx.fillRect(WIN.x, WIN.y + 24, WIN.w, 22);
    for (let i = 0; i < 3; i++) dot(ctx, WIN.x + 28 + i * 26, WIN.y + 23, 7, [COL.coral, COL.amber, COL.mint][i], 0.85);
    text(ctx, 'your_program', WIN.x + WIN.w - 22, WIN.y + 32, { size: 23, weight: 600, family: F.mono, color: COL.dim, align: 'right', ls: 1 });
    /* which line is executing */
    let lineNo;
    if (t < tCopy0 - 0.15) lineNo = Math.floor(((t - S0) * 3.2)) % 3;
    else if (t < tCard0 - 0.1) lineNo = 3;
    else lineNo = 4;
    for (let i = 0; i < CODE.length; i++) {
      const y = WIN.y + 86 + i * 37, on = i === lineNo;
      if (on) { fillRR(ctx, WIN.x + 10, y - 27, WIN.w - 20, 36, 8, rgba(i >= 3 ? COL.cyan : COL.amber, 0.2)); fillRR(ctx, WIN.x + 10, y - 27, 5, 36, 2, i >= 3 ? COL.cyan : COL.amber); }
      text(ctx, String(i + 1), WIN.x + 34, y, { size: 22, weight: 500, family: F.mono, color: COL.faint, align: 'right' });
      text(ctx, CODE[i], WIN.x + 52, y, { size: 26, weight: on ? 700 : 500, family: F.mono, color: on ? COL.white : i >= 3 ? rgba(COL.cyan, 0.75) : COL.dim });
    }
  }

  function vram(ctx, v, fill, t) {
    /* four stacked memory chips filling from the bottom */
    for (let i = 0; i < 4; i++) {
      const y = v.y + i * 62, lvl = clamp(fill * 4 - (3 - i));
      fillRR(ctx, v.x, y, 160, 50, 10, 'rgba(14,20,32,0.95)');
      if (lvl > 0) { ctx.save(); rr(ctx, v.x, y, 160, 50, 10); ctx.clip(); ctx.fillStyle = rgba(COL.violet, 0.55 + 0.2 * Math.sin(t * 6 + i)); ctx.fillRect(v.x, y, 160 * lvl, 50); ctx.restore(); }
      strokeRR(ctx, v.x, y, 160, 50, 10, rgba(COL.violet, 0.45 + 0.5 * clamp(fill * 2)), 2.5);
      for (let k = 0; k < 5; k++) ctx.fillStyle = rgba(COL.violet, 0.35), ctx.fillRect(v.x + 18 + k * 28, y + 50, 10, 6);
    }
    text(ctx, 'VRAM', v.x + 80, v.y + 4 * 62 + 28, { size: 26, weight: 800, family: F.mono, color: COL.violet, align: 'center', ls: 4 });
  }

  addScene(B, function (ctx, t) {
    const inP = tw(t, S0 - 0.2, S0 + 0.5, E.out3);
    const copyP = prog(t, tCopy0, tCopy1);
    const cardP = tw(t, tCard0, tCard1, E.io2);
    const runP = prog(t, tRun, c.times + 0.3);
    const gpuPower = 0.22 + 0.2 * copyP + 0.58 * tw(t, tCard1 - 0.1, tRun + 0.4, E.out3);

    /* ---- bus ---- */
    const busA = prog(t, S0 + 0.2, S0 + 0.7);
    polyline(ctx, [[CPUc.x, CPUc.y + 132], [CPUc.x, RAIL]], rgba(COL.lineHi, 0.9), 8, busA);
    polyline(ctx, [[VR[0].x + 80, RAIL], [VR[1].x + 80, RAIL]], rgba(COL.lineHi, 0.9), 8, busA);
    for (const x of [VR[0].x + 80, GPUc.x, VR[1].x + 80]) polyline(ctx, [[x, RAIL], [x, x === GPUc.x ? GPUc.y - 160 : VR[0].y - 6]], rgba(COL.lineHi, 0.9), 8, busA);
    pill(ctx, 'PCIe LINK', 640, RAIL - 34, { size: 22, bg: 'rgba(12,18,28,0.95)', color: COL.dim, stroke: rgba(COL.lineHi, 0.8), alpha: busA, ls: 3 });

    /* ---- program window + CPU ---- */
    withAlpha(ctx, inP, () => {
      drawWindow(ctx, t);
      /* window is attached to the CPU */
      line(ctx, WIN.x + WIN.w, WIN.y + 150, CPUc.x - CPUc.s / 2 - 20, CPUc.y, rgba(COL.amber, 0.7), 3, 1, [8, 8]);
      const beat = 0.5 + 0.5 * Math.sin(t * 9);
      const hot = pulse(t, c.cpu, 0.08, 1.4);
      chipIcon(ctx, CPUc.x, CPUc.y, CPUc.s, { color: COL.amber, label: 'CPU', power: 0.7 + 0.3 * beat * (t < tCopy0 ? 1 : 0.4) + 0.4 * hot, cells: 2,
        cell: (cc, r) => 0.25 + 0.6 * hash(cc + r * 2 + Math.floor(t * 7)) });
      if (hot > 0.01) ring(ctx, CPUc.x, CPUc.y, CPUc.s * 0.6 + 120 * (1 - hot), COL.amber, 5, hot);
    });
    pill(ctx, 'RUNS YOUR PROGRAM', CPUc.x, WIN.y - 2, { size: 22, bg: rgba(COL.amber, 0.16), color: COL.amber, stroke: rgba(COL.amber, 0.85), alpha: win(t, c.the - 0.1, tCard0, 0.3, 0.4), ls: 2 });

    /* ---- GPU + its memory ---- */
    withAlpha(ctx, inP, () => {
      vram(ctx, VR[0], copyP * 0.92, t); vram(ctx, VR[1], clamp(copyP * 1.05 - 0.14) * 0.92, t);
      chipIcon(ctx, GPUc.x, GPUc.y, GPUc.s, { color: COL.cyan, label: 'GPU', power: gpuPower, cells: 8,
        cell: (cc, r) => (gpuPower < 0.5 ? 0.12 : 0.2 + 0.8 * hash(cc * 3 + r * 5 + Math.floor(t * 10 + cc))) });
    });
    const idle = win(t, c.doesnt - 0.1, c.the + 0.5, 0.25, 0.4);
    if (idle > 0) {
      pill(ctx, 'NOT RUNNING YOUR PROGRAM', GPUc.x, 1196, { size: 23, bg: 'rgba(40,12,18,0.95)', color: COL.coral, stroke: rgba(COL.coral, 0.9), alpha: idle, ls: 2 });
      cross(ctx, GPUc.x, GPUc.y, 62, rgba(COL.coral, 0.9 * idle), prog(t, c.doesnt, c.doesnt + 0.35), 10);
    }
    text(ctx, 'the GPU’s own memory', GPUc.x, 1192, { size: 28, weight: 600, color: COL.violet, align: 'center', alpha: win(t, c.memory - 0.3, tCard0 + 0.6, 0.3, 0.4) });

    /* ---- data packets streaming into VRAM ---- */
    if (copyP > 0 && t < tCopy1 + 0.6) {
      const routes = [toLeft, toRight];
      for (let k = 0; k < 26; k++) {
        const born = tCopy0 + k * (tCopy1 - tCopy0 - 0.7) / 26;
        const u = (t - born) / 0.75;
        if (u <= 0 || u >= 1) continue;
        const rt = routes[k % 2], pos = polyAt(rt, polyLen(rt) * E.io2(u));
        glow(ctx, pos[0], pos[1], 34, COL.violet, 0.8);
        fillRR(ctx, pos[0] - 11, pos[1] - 11, 22, 22, 5, COL.violet);
      }
      pill(ctx, 'COPY DATA', 360, RAIL - 34, { size: 22, bg: rgba(COL.violet, 0.18), color: COL.violet, stroke: rgba(COL.violet, 0.9), alpha: win(t, tCopy0, tCopy1, 0.25, 0.3), ls: 3 });
    }

    /* ---- the function card travels to the GPU ---- */
    if (t >= tCard0 - 0.05) {
      const pos = polyAt(toGpu, polyLen(toGpu) * cardP);
      const born = E.outBack(prog(t, tCard0 - 0.05, tCard0 + 0.3));
      const absorbed = prog(t, tRun - 0.05, tRun + 0.3);
      const cw = 318, ch = 104;
      const cx = clamp(pos[0], SAFE.l + cw / 2 + 4, SAFE.r - cw / 2 - 4);
      withAlpha(ctx, born * (1 - absorbed), () => {
        ctx.save(); ctx.translate(cx, pos[1]); ctx.scale(lerp(0.4, 1, born) * (1 - 0.4 * absorbed), lerp(0.4, 1, born) * (1 - 0.4 * absorbed));
        glow(ctx, 0, 0, 230, COL.white, 0.4);
        fillRR(ctx, -cw / 2, -ch / 2, cw, ch, 18, 'rgba(240,247,255,0.97)');
        fillRR(ctx, -cw / 2 + 10, -ch / 2 + 10, 122, ch - 20, 12, '#0A1420');
        text(ctx, 'f(x)', -cw / 2 + 71, 15, { size: 44, weight: 800, family: F.mono, color: COL.cyan, align: 'center' });
        text(ctx, 'one small', -cw / 2 + 146, -8, { size: 27, weight: 700, color: '#0A1420' });
        text(ctx, 'function', -cw / 2 + 146, 26, { size: 31, weight: 900, family: F.disp, color: '#0A1420' });
        ctx.restore();
      });
    }

    /* ---- the order: run it a million times ---- */
    if (t >= tRun - 0.05) {
      const a = prog(t, tRun - 0.05, tRun + 0.2);
      const n = Math.round(Math.pow(10, 6 * E.out2(prog(t, tRun, c.times + 0.25))));
      const hit = pulse(t, c.times + 0.25, 0.05, 0.6);
      /* copies bursting out of the GPU */
      const burst = prog(t, tRun + 0.1, c.times + 0.5);
      for (let k = 0; k < 150; k++) {
        const ang = hash(k * 1.7) * TAU, rad = (120 + 520 * hash(k * 3.1)) * E.out3(clamp(burst * 1.4 - hash(k * 7.7) * 0.4));
        const x = GPUc.x + Math.cos(ang) * rad, y = GPUc.y + Math.sin(ang) * rad * 0.62;
        if (rad < 10) continue;
        const aa = clamp(burst * 3 - hash(k * 7.7)) * (1 - prog(rad, 380, 640)) * 0.9;
        fillRR(ctx, x - 9, y - 6, 18, 12, 3, rgba(hash(k * 9.9) > 0.5 ? COL.white : COL.cyan, aa));
      }
      withAlpha(ctx, a, () => {
        const y = GPUc.y - GPUc.s / 2 - 66;
        glow(ctx, GPUc.x, y, 330, COL.cyan, 0.3 + 0.4 * hit);
        fillRR(ctx, GPUc.x - 330, y - 50, 660, 100, 26, 'rgba(6,14,22,0.96)');
        strokeRR(ctx, GPUc.x - 330, y - 50, 660, 100, 26, rgba(COL.cyan, 0.95), 3.5);
        text(ctx, 'RUN', GPUc.x - 296, y + 20, { size: 54, weight: 900, family: F.disp, color: COL.cyan, ls: 2 });
        text(ctx, '×', GPUc.x - 152, y + 19, { size: 54, weight: 700, family: F.disp, color: COL.dim });
        text(ctx, fmt(n), GPUc.x + 300, y + 21, { size: 62 + 5 * hit, weight: 900, family: F.disp, color: COL.white, align: 'right', ls: -1 });
      });
    }
  }, { type: 'zoomOut', fx: 540, fy: 848, z: 0.42, zb: 1.3, bx: 540, by: 1012 });
});
