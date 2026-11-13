'use strict';
/* Scene 5 — THREADS & WARPS (0:56–1:20)
   A million copies of f(x) = threads -> packed into blocks -> a block lands
   on one unit -> sliced into warps of 32 -> one instruction stream, fetched
   once and executed by all 32 threads on their own data (SIMT) -> rowing crew. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const B = 'warps';
  const c = {
    each: at(B, 'each'), fn: at(B, 'function'), thread: at(B, 'thread'), threads: at(B, 'threads'), packed: at(B, 'packed'),
    blocks: at(B, 'blocks'), block: at(B, 'block'), lands: at(B, 'lands'), unit: at(B, 'unit'), slices: at(B, 'slices'),
    squads: at(B, 'squads'), n32: at(B, 'thirty-two'), called: at(B, 'called'), warps: at(B, 'warps'), warpsEnd: at(B, 'warps', 1, 't1'),
    heres: at(B, "here's"), trick: at(B, 'trick'), warp: at(B, 'warp'), shares: at(B, 'shares'), instr: at(B, 'instruction'), stream: at(B, 'stream'),
    fetched: at(B, 'fetched'), once: at(B, 'once'), all: at(B, 'all'), n32b: at(B, 'thirty-two', 2), execute: at(B, 'execute'),
    together: at(B, 'together'), each4: at(B, 'each', 4), own: at(B, 'own'), data: at(B, 'data'), dataEnd: at(B, 'data', 1, 't1'),
    like: at(B, 'like'), rowing: at(B, 'rowing'), crew: at(B, 'crew'), oneCall: at(B, 'one', 3), call: at(B, 'call'),
    n32c: at(B, 'thirty-two', 3), oars: at(B, 'oars'), oarsEnd: at(B, 'oars', 1, 't1'),
  };
  const S0 = beatOf(B).t0 - 0.5;

  /* ---------- phase timing ---------- */
  const tPack = [c.packed - 0.1, c.blocks + 0.25];
  const tLand = [c.lands - 0.3, c.unit + 0.2];
  const tSlice = [c.slices - 0.05, c.squads + 0.4];
  const tLanes = [c.heres - 0.35, c.trick + 0.45];
  const tBoat = [c.like - 0.3, c.rowing + 0.25];
  const HERO_B = 2;                                 // block that we follow (left column, middle row)

  /* ---------- geometry ---------- */
  const GX0 = 86, GW = 908;                         // dot field / lanes x range
  const fieldPos = (i, j) => [GX0 + 14 + i * (GW - 28) / 31, 556 + j * 27];                     // 32 x 24 uniform
  const blockRect = (b) => [86 + (b % 2) * 468, 548 + Math.floor(b / 2) * 222, 440, 196];
  const blockPos = (b, li, lj) => { const [x, y, w, h] = blockRect(b); return [x + 22 + li * (w - 44) / 15, y + 26 + lj * (h - 52) / 7]; };
  const miniRect = (b) => [70 + b * 160, 392, 140, 84];
  const miniPos = (b, li, lj) => { const [x, y, w, h] = miniRect(b); return [x + 14 + li * (w - 28) / 15, y + 16 + lj * (h - 32) / 7]; };
  const UNIT = { x: 70, y: 544, w: 940, h: 652 };
  const unitPos = (li, lj) => [UNIT.x + 62 + li * (UNIT.w - 124) / 15, UNIT.y + 120 + lj * (UNIT.h - 190) / 7];
  const WARP_Y = [686, 806, 926, 1046];
  const warpPos = (k) => [GX0 + 12.25 + (k % 32) * (GW - 24.5) / 31, WARP_Y[Math.floor(k / 32)]];
  const LANE = { y0: 812, y1: 1096, headY: 786, dataY: 1108, dataH: 78 };
  const laneCx = (i) => laneX(GX0, GW, 32, i, 4);

  /* instruction cycles: [label, time fetched, time executed] */
  const CYC = [
    ['LOAD', c.fetched - 0.05, c.all + 0.05],
    ['MUL', c.n32b + 0.42, c.execute + 0.12],
    ['ADD', c.together + 0.2, c.each4 + 0.1],
    ['STORE', c.own + 0.05, c.data + 0.3],
  ];
  const QUEUE = ['LOAD', 'MUL', 'ADD', 'STORE', 'LOAD', 'MUL'];
  /* per-thread data: x -> 2x -> 2x+1 */
  const xVal = (i) => 1 + Math.floor(hash(i * 5.71 + 2.2) * 9);
  const valAt = (i, n) => (n <= 0 ? null : n === 1 ? xVal(i) : n === 2 ? xVal(i) * 2 : xVal(i) * 2 + 1);

  /* rowing strokes (catch times) */
  const STROKES = [c.rowing + 0.2, c.oneCall + 0.05, c.n32c + 0.1, c.oarsEnd + 0.25];

  /* ---------- sound ---------- */
  sfx(S0 + 0.1, 'whoosh', 0.7);
  sfx(c.thread, 'blip', 0.8);
  sfx(tPack[0], 'slide', 0.6, { dur: 0.8 }); sfx(c.blocks + 0.2, 'lock', 0.6);
  sfx(tLand[0], 'whoosh', 0.7); sfx(tLand[1], 'thump', 0.8);
  sfx(c.slices, 'slice', 0.9); sfx(c.slices + 0.25, 'slice', 0.7); sfx(c.slices + 0.5, 'slice', 0.6);
  sfx(c.warps, 'chime', 0.6);
  sfx(tLanes[0], 'whoosh', 0.6);
  sfx(c.instr, 'blip', 0.6);
  CYC.forEach((cy, k) => { sfx(cy[1], 'tick', 0.7, { pitch: 1 + k * 0.08 }); sfx(cy[2], 'thump', 0.95); sfx(cy[2] + 0.02, 'fire', 0.7, { pitch: 1 + k * 0.06 }); });
  sfx(tBoat[0], 'whoosh', 0.7);
  STROKES.slice(0, 3).forEach((s, k) => { sfx(s - 0.12, 'call', 0.6, { pitch: 1 + k * 0.04 }); sfx(s, 'splash', 0.8); });

  function drawDots(ctx, t) {
    const pack = tw(t, tPack[0], tPack[1], E.io3);
    const land = tw(t, tLand[0], tLand[1], E.io3);
    const slice = tw(t, tSlice[0], tSlice[1], E.io3);
    const lanes = tw(t, tLanes[0], tLanes[1], E.io3);
    const appear = prog(t, S0 - 0.4, S0 + 0.45);
    for (let j = 0; j < 24; j++) for (let i = 0; i < 32; i++) {
      const b = Math.floor(j / 8) * 2 + Math.floor(i / 16), li = i % 16, lj = j % 8, k = lj * 16 + li;
      const hero = b === HERO_B;
      const a0 = clamp(appear * 2.2 - hash2(i, j) * 1.2);
      if (a0 <= 0) continue;
      let p = fieldPos(i, j), q = blockPos(b, li, lj);
      let x = lerp(p[0], q[0], pack), y = lerp(p[1], q[1], pack), r = 5.2, a = a0, hex = COL.cyan;
      if (land > 0) {
        const d = hero ? unitPos(li, lj) : miniPos(b, li, lj);
        const st = clamp(land * 1.25 - (hero ? 0 : 0.12 + 0.03 * b));
        const e = E.io3(st);
        x = lerp(x, d[0], e); y = lerp(y, d[1], e); r = lerp(r, hero ? 9 : 2.3, e);
      }
      if (hero && slice > 0) {
        const d = warpPos(k), w = Math.floor(k / 32);
        const e = E.io3(clamp(slice * 1.3 - w * 0.1));
        x = lerp(x, d[0], e); y = lerp(y, d[1], e); r = lerp(r, 8, e);
        hex = t > c.slices ? [COL.cyan, COL.mint, COL.violet, COL.amber][w] : COL.cyan;
        if (lanes > 0) {
          if (w === 0) { x = lerp(x, laneCx(k % 32), lanes); y = lerp(y, LANE.headY, lanes); r = lerp(r, 9, lanes); hex = COL.cyan; }
          else a *= 1 - clamp(lanes * 2);
        }
      } else if (!hero && lanes > 0) a *= 1 - clamp(lanes * 1.6);
      const tw2 = 0.6 + 0.4 * hash2(i * 3.1 + Math.floor(t * 4 + hash2(i, j) * 4), j);
      if (a <= 0.003) continue;
      ctx.globalAlpha = a * tw2; ctx.fillStyle = hex;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawStream(ctx, t, A) {
    /* one instruction queue -> one fetch/decode -> a bus across all 32 lanes */
    if (A <= 0) return;
    withAlpha(ctx, A, () => {
      const cx = 540;
      let consumed = 0; for (const cy of CYC) if (t >= cy[1]) consumed++;
      const shift = consumed === 0 ? 0 : consumed - 1 + E.out3(prog(t, CYC[consumed - 1][1], CYC[consumed - 1][1] + 0.28));
      /* queue channel */
      fillRR(ctx, cx - 100, 384, 200, 250, 18, 'rgba(9,14,22,0.9)');
      strokeRR(ctx, cx - 100, 384, 200, 250, 18, rgba(COL.amber, 0.45), 2);
      ctx.save(); rr(ctx, cx - 100, 384, 200, 250, 18); ctx.clip();
      for (let q = 0; q < QUEUE.length; q++) {
        const y = 600 - (q - shift) * 66;
        if (y < 340 || y > 680) continue;
        instr(ctx, QUEUE[q], cx, y, { w: 164, h: 54, color: COL.amber, alpha: clamp((y - 370) / 40) * clamp((660 - y) / 30), size: 28 });
      }
      ctx.restore();
      /* fetch + decode box */
      let hot = 0, label = '';
      for (const cy of CYC) { if (t >= cy[1]) { label = cy[0]; hot = Math.max(pulse(t, cy[1] + 0.2, 0.08, 0.5), pulse(t, cy[2], 0.05, 0.6)); } }
      glow(ctx, cx, 684, 220, COL.amber, 0.35 * hot);
      fillRR(ctx, cx - 170, 648, 340, 72, 16, mixHex('#141B26', COL.amber, 0.12 + 0.5 * hot, 1));
      strokeRR(ctx, cx - 170, 648, 340, 72, 16, rgba(COL.amber, 0.9), 3);
      if (label) {
        const pop = E.outBack(prog(t, CYC[consumed - 1][1] + 0.12, CYC[consumed - 1][1] + 0.4));
        text(ctx, label, cx, 698, { size: 40 * pop, weight: 800, family: F.mono, color: COL.white, align: 'center', ls: 2 });
      } else text(ctx, 'FETCH + DECODE', cx, 695, { size: 26, weight: 800, family: F.mono, color: COL.amber, align: 'center', ls: 2 });
      /* bus + 32 drops */
      let fire = 0; for (const cy of CYC) fire = Math.max(fire, pulse(t, cy[2], 0.04, 0.55));
      const busC = mixHex(COL.amberDeep, COL.white, fire, 1);
      line(ctx, cx, 720, cx, 752, busC, 5 + 3 * fire);
      line(ctx, laneCx(0), 752, laneCx(31), 752, busC, 5 + 3 * fire);
      for (let i = 0; i < 32; i++) line(ctx, laneCx(i), 752, laneCx(i), 772, busC, 2.5 + 2 * fire);
      if (fire > 0.02) glow(ctx, cx, 752, 620, COL.amber, 0.22 * fire);

      /* left: what is shared; right: the tally */
      const sA = prog(t, c.shares - 0.1, c.shares + 0.3);
      text(ctx, 'ONE', 70, 452, { size: 76, weight: 900, family: F.disp, color: COL.amber, alpha: sA });
      text(ctx, 'instruction', 70, 498, { size: 36, weight: 700, color: COL.white, alpha: sA });
      text(ctx, 'stream', 70, 540, { size: 36, weight: 700, color: COL.white, alpha: sA });
      const f1 = prog(t, c.once - 0.15, c.once + 0.2), f2 = prog(t, c.n32b - 0.15, c.n32b + 0.2);
      const tx = 1010;
      text(ctx, 'fetched', tx - 112, 440, { size: 30, weight: 600, color: COL.dim, align: 'right', alpha: f1 });
      text(ctx, '×1', tx, 448, { size: 64, weight: 900, family: F.disp, color: COL.amber, align: 'right', alpha: f1 });
      text(ctx, 'executed', tx - 150, 522, { size: 30, weight: 600, color: COL.dim, align: 'right', alpha: f2 });
      text(ctx, '×32', tx, 530, { size: 64, weight: 900, family: F.disp, color: COL.cyan, align: 'right', alpha: f2 });
      const simt = prog(t, c.together - 0.1, c.together + 0.3);
      if (simt > 0) {
        pill(ctx, 'SIMT', 70, 606, { size: 34, weight: 800, bg: rgba(COL.cyan, 0.16), color: COL.cyan, stroke: rgba(COL.cyan, 0.9), align: 'left', alpha: simt, ls: 5, h: 58, r: 14 });
        text(ctx, 'single instruction,', 70, 668, { size: 27, weight: 600, family: F.mono, color: COL.dim, alpha: simt });
        text(ctx, 'multiple threads', 70, 702, { size: 27, weight: 600, family: F.mono, color: COL.dim, alpha: simt });
      }
    });
  }

  function drawLaneBank(ctx, t, A) {
    if (A <= 0) return;
    withAlpha(ctx, A, () => {
      let nDone = 0; for (const cy of CYC) if (t >= cy[2] + 0.42) nDone++;
      drawLanes(ctx, GX0, LANE.y0, GW, LANE.y1 - LANE.y0, 32, (i) => {
        let head = null;
        for (const cy of CYC) { const u = (t - cy[2]) / 0.5; if (u >= 0 && u <= 1) head = E.out2(u); }
        return { hex: COL.cyan, base: 0.2, head, len: 0.42 };
      }, { gap: 4, r: 6 });
      /* per-thread data cells */
      const own = prog(t, c.own - 0.2, c.own + 0.2);
      for (let i = 0; i < 32; i++) {
        const x = laneCx(i), v = valAt(i, nDone);
        let flash = 0; for (const cy of CYC) flash = Math.max(flash, pulse(t, cy[2] + 0.42, 0.04, 0.5));
        const lvl = v == null ? 0.08 : 0.25 + 0.6 * (v / 19);
        fillRR(ctx, x - 12.2, LANE.dataY, 24.4, LANE.dataH, 5, mixHex('#141026', COL.violet, clamp(lvl + 0.4 * flash), 1));
        strokeRR(ctx, x - 12.2, LANE.dataY, 24.4, LANE.dataH, 5, rgba(COL.violet, 0.45 + 0.5 * own), 1.5);
        if (v != null) {
          ctx.save(); ctx.translate(x + 7, LANE.dataY + LANE.dataH / 2); ctx.rotate(-Math.PI / 2);
          text(ctx, String(v), 0, 0, { size: 21, weight: 800, family: F.mono, color: COL.white, align: 'center' });
          ctx.restore();
        }
      }
      text(ctx, '32 threads', GX0, 1220, { size: 27, weight: 700, family: F.mono, color: COL.cyan, alpha: prog(t, c.warp, c.warp + 0.3), ls: 1 });
      text(ctx, '32 different values', GX0 + GW, 1220, { size: 27, weight: 700, family: F.mono, color: COL.violet, align: 'right', alpha: own, ls: 1 });
    });
  }

  function drawBoat(ctx, t, A) {
    if (A <= 0) return;
    const cx = 540, top = 444, bot = 1128;
    /* stroke phase: 0..1 within the current stroke; drive = first 40 % */
    let si = -1; for (let k = 0; k < STROKES.length; k++) if (t >= STROKES[k]) si = k;
    const s0 = si < 0 ? STROKES[0] - 0.9 : STROKES[si], s1 = si < 0 ? STROKES[0] : si + 1 < STROKES.length ? STROKES[si + 1] : STROKES[si] + 0.9;
    const u = clamp((t - s0) / (s1 - s0));
    const ang = u < 0.38 ? lerp(-0.55, 0.6, E.io2(u / 0.38)) : lerp(0.6, -0.55, E.io2((u - 0.38) / 0.62));   // + = blade toward stern
    const drive = u < 0.38 ? Math.sin(Math.PI * u / 0.38) : 0;
    const travel = (t - STROKES[0]) * 150 + 60 * (si + (u < 0.38 ? E.io2(u / 0.38) : 1));                   // water passing by
    withAlpha(ctx, A, () => {
      /* water streaks drifting down past the hull */
      for (let k = 0; k < 46; k++) {
        const x = 90 + hash(k * 3.7) * 900; if (Math.abs(x - cx) < 70) continue;
        const y = 420 + ((hash(k * 9.1) * 820 + travel) % 820);
        const a = 0.12 + 0.2 * hash(k * 5.3);
        line(ctx, x, y, x, y + 26 + 40 * hash(k * 2.2), rgba(COL.cyan, a * clamp((y - 420) / 60) * clamp((1240 - y) / 60)), 2.5);
      }
      /* oars: 16 per side, all at the same angle */
      for (let i = 0; i < 16; i++) {
        const y = top + 88 + i * 37;
        for (const sd of [-1, 1]) {
          const x0 = cx + sd * 30, len = 290;
          const x1 = x0 + sd * Math.cos(ang) * len, y1 = y + Math.sin(ang) * len;
          line(ctx, x0, y, x1, y1, rgba(COL.cyan, 0.95), 4);
          /* blade */
          ctx.save(); ctx.translate(x1, y1); ctx.rotate(Math.atan2(Math.sin(ang), sd * Math.cos(ang)));
          fillRR(ctx, -4, -9, 44, 18, 8, drive > 0.1 ? COL.white : COL.cyan); ctx.restore();
          if (drive > 0.15) glow(ctx, x1 + sd * 20, y1, 46, COL.cyan, 0.55 * drive);
        }
      }
      /* hull */
      ctx.beginPath();
      ctx.moveTo(cx, top); ctx.quadraticCurveTo(cx + 44, top + 150, cx + 40, top + 380); ctx.quadraticCurveTo(cx + 40, bot - 110, cx + 16, bot);
      ctx.lineTo(cx - 16, bot); ctx.quadraticCurveTo(cx - 40, bot - 110, cx - 40, top + 380); ctx.quadraticCurveTo(cx - 44, top + 150, cx, top); ctx.closePath();
      ctx.fillStyle = '#0B1721'; ctx.fill(); ctx.strokeStyle = rgba(COL.cyan, 0.95); ctx.lineWidth = 3.5; ctx.stroke();
      for (let i = 0; i < 16; i++) { const y = top + 88 + i * 37; dot(ctx, cx - 14, y, 7.5, COL.white, 0.95); dot(ctx, cx + 14, y, 7.5, COL.white, 0.95); }
      /* cox at the stern + the call travelling up the boat */
      const coxY = bot - 34;
      dot(ctx, cx, coxY, 13, COL.amber);
      for (let k = 0; k < 3; k++) {
        const call = STROKES[k] - 0.12, q = prog(t, call, call + 0.5);
        if (q > 0 && q < 1) {
          ctx.save(); ctx.globalAlpha *= (1 - q) * 0.95; ctx.strokeStyle = COL.amber; ctx.lineWidth = 5;
          for (let n = 0; n < 2; n++) { ctx.beginPath(); ctx.arc(cx, coxY, 40 + 520 * q + n * 26, -Math.PI * 0.72, -Math.PI * 0.28); ctx.stroke(); }
          ctx.restore();
        }
      }
      const lab = prog(t, c.oneCall - 0.15, c.oneCall + 0.15);
      const plate = (x, y, big, small, hex, bg, a) => withAlpha(ctx, a, () => {
        fillRR(ctx, x - 150, y - 50, 300, 100, 18, bg); strokeRR(ctx, x - 150, y - 50, 300, 100, 18, rgba(hex, 0.95), 2.5);
        text(ctx, big, x, y - 4, { size: 36, weight: 900, family: F.disp, color: hex, align: 'center', ls: 2 });
        text(ctx, small, x, y + 32, { size: 24, weight: 600, family: F.mono, color: COL.text, align: 'center' });
      });
      plate(cx - 300, coxY + 26, '1 CALL', '= one instruction', COL.amber, 'rgba(26,17,4,0.97)', lab);
      const lab2 = prog(t, c.n32c - 0.15, c.n32c + 0.15);
      plate(cx + 300, top + 8, '32 OARS', '= 32 threads', COL.cyan, 'rgba(4,20,27,0.97)', lab2);
    });
  }

  addScene(B, function (ctx, t) {
    const pack = tw(t, tPack[0], tPack[1], E.io3);
    const land = tw(t, tLand[0], tLand[1], E.io3);
    const slice = tw(t, tSlice[0], tSlice[1], E.io3);
    const lanes = tw(t, tLanes[0], tLanes[1], E.io3);
    const boat = tw(t, tBoat[0], tBoat[1], E.io3);
    const pre = 1 - boat;

    /* ----- headline (top) ----- */
    const h1 = win(t, S0 - 0.3, c.threads - 0.15, 0.3, 0.3) * (1 - land);
    if (h1 > 0) {
      const sw = prog(t, c.thread - 0.2, c.thread + 0.1);
      text(ctx, 'f(x)', 70, 470, { size: 84, weight: 800, family: F.mono, color: COL.white, alpha: h1 });
      text(ctx, '× 1,000,000', 300, 468, { size: 64, weight: 900, family: F.disp, color: COL.cyan, alpha: h1 * (1 - sw) });
      text(ctx, '= 1 thread each', 300, 468, { size: 60, weight: 900, family: F.disp, color: COL.cyan, alpha: h1 * sw });
      text(ctx, 'one copy of the function + its own data', 70, 520, { size: 29, weight: 600, color: COL.dim, alpha: h1 * sw });
    }
    const h2 = win(t, c.threads - 0.1, tLand[0] + 0.1, 0.3, 0.3);
    if (h2 > 0) {
      text(ctx, 'THREADS', 70, 470, { size: 92, weight: 900, family: F.disp, color: COL.white, alpha: h2, ls: -1 });
      text(ctx, '→ BLOCKS', 520, 470, { size: 92, weight: 900, family: F.disp, color: COL.cyan, alpha: h2 * prog(t, c.packed, c.packed + 0.3), ls: -1 });
    }

    if (pre > 0.003) withAlpha(ctx, pre, () => {
      /* block outlines once threads are packed */
      const bo = prog(t, c.blocks - 0.15, c.blocks + 0.25) * (1 - prog(land, 0.05, 0.5));
      if (bo > 0) for (let b = 0; b < 6; b++) {
        const [x, y, w, h] = blockRect(b);
        strokeRR(ctx, x, y, w, h, 18, rgba(b === HERO_B ? COL.white : COL.cyan, 0.75 * bo), b === HERO_B ? 3.5 : 2.5);
        tag(ctx, 'BLOCK ' + b, x + 16, y - 10, { size: 21, color: b === HERO_B ? COL.white : COL.dim, alpha: bo });
      }
      /* row of compute units; each block lands on one */
      const ua = prog(land, 0.0, 0.4) * (1 - lanes);
      if (ua > 0) for (let b = 0; b < 6; b++) {
        const [x, y, w, h] = miniRect(b), hero = b === HERO_B;
        fillRR(ctx, x, y, w, h, 12, rgba('#0A121C', 0.9 * ua));
        strokeRR(ctx, x, y, w, h, 12, rgba(hero ? COL.white : COL.cyan, (hero ? 0.95 : 0.55) * ua), hero ? 3 : 2);
        tag(ctx, 'UNIT ' + (b + 1), x + w / 2, y + h + 26, { size: 19, color: hero ? COL.white : COL.dim, alpha: ua, align: 'center' });
      }
      /* the unit we follow, drawn large */
      const U = prog(land, 0.25, 0.85) * (1 - lanes);
      if (U > 0) {
        const [mx, my, mw] = miniRect(HERO_B);
        line(ctx, mx, my + 84, UNIT.x, UNIT.y, rgba(COL.white, 0.3 * U), 1.5); line(ctx, mx + mw, my + 84, UNIT.x + UNIT.w, UNIT.y, rgba(COL.white, 0.3 * U), 1.5);
        fillRR(ctx, UNIT.x, UNIT.y, UNIT.w, UNIT.h, 28, rgba('#08101A', 0.86 * U));
        strokeRR(ctx, UNIT.x, UNIT.y, UNIT.w, UNIT.h, 28, rgba(COL.white, 0.85 * U), 3);
        tag(ctx, 'ONE COMPUTE UNIT', UNIT.x + 30, UNIT.y + 50, { size: 25, color: COL.white, alpha: U });
        text(ctx, 'block 2 · 128 threads', UNIT.x + UNIT.w - 30, UNIT.y + 50, { size: 25, weight: 600, family: F.mono, color: COL.dim, align: 'right', alpha: U * (1 - slice) });
      }
      /* slicing cuts + warp labels */
      if (slice > 0 && lanes < 1) {
        const la = 1 - lanes;
        for (let w = 0; w < 4; w++) {
          const y = WARP_Y[w], p = prog(t, c.slices + w * 0.16, c.slices + w * 0.16 + 0.35);
          const hex = [COL.cyan, COL.mint, COL.violet, COL.amber][w];
          if (w > 0) { const cut = prog(t, c.slices + (w - 1) * 0.25, c.slices + (w - 1) * 0.25 + 0.22); line(ctx, UNIT.x + 20, y - 60, UNIT.x + 20 + (UNIT.w - 40) * cut, y - 60, rgba(COL.white, 0.9 * (1 - prog(t, c.squads + 0.5, c.squads + 1.1)) * la), 3); }
          const ra = prog(slice, 0.55, 1) * la * (w === 0 ? 1 : 1);
          strokeRR(ctx, GX0 - 8, y - 26, GW + 16, 52, 26, rgba(hex, 0.75 * ra), 2.5);
          tag(ctx, 'WARP ' + w, GX0 + 4, y - 38, { size: 22, color: hex, alpha: ra });
          text(ctx, '32', GX0 + GW + 6, y - 36, { size: 30, weight: 900, family: F.disp, color: hex, align: 'right', alpha: ra * prog(t, c.n32 - 0.1, c.n32 + 0.2 + w * 0.06) });
        }
        const wl = prog(t, c.warps - 0.15, c.warps + 0.2) * la;
        text(ctx, 'WARP', UNIT.x + UNIT.w - 30, UNIT.y + 58, { size: 50, weight: 900, family: F.disp, color: COL.white, align: 'right', alpha: wl });
        text(ctx, 'NVIDIA: warp · AMD: wavefront', UNIT.x + UNIT.w / 2, UNIT.y + UNIT.h - 26, { size: 25, weight: 600, family: F.mono, color: COL.dim, align: 'center', alpha: wl, ls: 1 });
      }
      drawDots(ctx, t);
      drawStream(ctx, t, lanes);
      drawLaneBank(ctx, t, lanes);
    });
    drawBoat(ctx, t, boat);
  }, { type: 'fade' });
});
