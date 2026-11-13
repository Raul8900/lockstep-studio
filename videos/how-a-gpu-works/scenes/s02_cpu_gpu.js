'use strict';
/* Scene 2 — CPU vs GPU (0:08–0:30)
   CPU: a few cores whose silicon mostly goes to prediction, caching and
   control, so ONE task finishes fast. GPU: strip most of that out, keep the
   arithmetic, copy it thousands of times.                                  */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const B = 'cpu_gpu';
  const c = {
    cpu: at(B, 'cpu'), decisions: at(B, 'decisions'), few: at(B, 'few'), cores: at(B, 'cores'), each: at(B, 'each'),
    silicon: at(B, 'silicon'), prediction: at(B, 'prediction'), caching: at(B, 'caching'), control: at(B, 'control'),
    finish: at(B, 'finish'), task: at(B, 'task'), fast: at(B, 'fast'), possibleEnd: at(B, 'possible', 1, 't1'),
    gpu: at(B, 'gpu'), opposite: at(B, 'opposite'), strips: at(B, 'strips'), cleverness: at(B, 'cleverness'),
    out: at(B, 'out'), spends: at(B, 'spends'), raw: at(B, 'raw'), arithmetic: at(B, 'arithmetic'),
    copied: at(B, 'copied'), thousands: at(B, 'thousands'), times: at(B, 'times'), timesEnd: at(B, 'times', 1, 't1'),
  };

  /* ---- decision tree geometry ---- */
  const LY = [612, 772, 932, 1092];
  const LX = [[540], [320, 760], [210, 430, 650, 870], [155, 265, 375, 485, 595, 705, 815, 925]];
  const paths = [{ t: c.cpu + 0.08, ch: [1, 0, 1] }, { t: c.cpu + 0.95, ch: [0, 1, 1] }];
  const HOP = 0.4;
  const nodeIdx = (ch, lvl) => { let i = 0; for (let k = 0; k < lvl; k++) i = i * 2 + ch[k]; return i; };

  /* ---- CPU die ---- */
  const DIE = { x: 230, y: 524, w: 620, h: 620 };
  const coreRect = (k) => { const col = k % 2, row = Math.floor(k / 2); return [DIE.x + 30 + col * 290, DIE.y + 34 + row * 143, 270, 124]; };
  const ZOOM_CORE = 2;                                    // the core we dive into
  const FP = { x: 70, y: 548, w: 940, h: 600 };           // floor-plan rect when zoomed in
  const REG = {                                           // normalised regions of one core
    pred: [0, 0, 0.562, 0.405], cache: [0.578, 0, 0.422, 0.648],
    ctrl: [0, 0.428, 0.562, 0.572], alu: [0.578, 0.672, 0.422, 0.328],
  };
  const tZoom0 = c.each - 0.1, tZoom1 = c.each + 0.85;
  const tFlip = c.gpu - 0.12;
  const tStrip = { pred: c.strips, cache: c.strips + 0.36, ctrl: c.cleverness - 0.12 };
  const tCenter0 = c.out + 0.25, tCenter1 = c.spends + 0.35;
  const S0 = beatOf(B).t0 - 0.5;
  const dupT = (k) => c.copied + k * 0.235;               // k = 0..5  ->  2,4,8,16,32,64 per side
  const tFinal = dupT(5) + 0.32;

  /* ---- sound cues ---- */
  sfx(S0 - 0.1, 'whoosh', 0.7);
  for (const p of paths) for (let k = 0; k < 3; k++) sfx(p.t + k * HOP, 'tick', 0.55, { pitch: 0.9 + k * 0.12 });
  sfx(paths[0].t + 3 * HOP, 'blip', 0.6); sfx(paths[1].t + 3 * HOP, 'blip', 0.6);
  for (let k = 0; k < 8; k++) sfx(c.few + k * 0.085, 'pop', 0.42, { pitch: 0.8 + k * 0.05 });
  sfx(tZoom0, 'whoosh', 0.75);
  sfx(c.prediction, 'blip', 0.7, { pitch: 1.0 }); sfx(c.caching, 'blip', 0.7, { pitch: 1.12 }); sfx(c.control, 'blip', 0.7, { pitch: 1.26 });
  sfx(c.task, 'zip', 0.9); sfx(c.task + 0.5, 'chime', 0.55);
  sfx(tFlip, 'flip', 0.9);
  sfx(tStrip.pred, 'rip', 0.8); sfx(tStrip.cache, 'rip', 0.75); sfx(tStrip.ctrl, 'rip', 0.8);
  sfx(c.raw, 'thump', 0.7);
  for (let k = 0; k < 6; k++) sfx(dupT(k), 'pop', 0.6, { pitch: 0.8 + k * 0.16 });
  sfx(c.copied - 0.3, 'riser', 0.7, { dur: 1.5 });
  sfx(tFinal, 'impact', 0.95);

  function diamond(ctx, x, y, s, hot, a) {
    if (a <= 0) return;
    const ga = ctx.globalAlpha; ctx.globalAlpha = ga * a;
    if (hot > 0) glow(ctx, x, y, s * 2.6, COL.amber, 0.6 * hot);
    ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath();
    ctx.fillStyle = mixHex('#141C28', COL.amber, 0.12 + 0.8 * hot, 1); ctx.fill();
    ctx.strokeStyle = rgba(COL.amber, 0.65 + 0.35 * hot); ctx.lineWidth = 3; ctx.stroke();
    ctx.globalAlpha = ga;
    text(ctx, '?', x, y + 12, { size: 34, weight: 800, family: F.mono, color: hot > 0.5 ? COL.bg0 : COL.amber, align: 'center', alpha: a });
  }

  function drawTree(ctx, t, A) {
    if (A <= 0) return;
    const grow = prog(t, S0 - 0.3, S0 + 0.5);
    withAlpha(ctx, A, () => {
      /* edges */
      for (let l = 0; l < 3; l++) for (let i = 0; i < LX[l].length; i++) for (let s = 0; s < 2; s++) {
        const x0 = LX[l][i], y0 = LY[l], x1 = LX[l + 1][i * 2 + s], y1 = LY[l + 1];
        let hot = 0;
        for (const p of paths) {
          if (nodeIdx(p.ch, l) === i && p.ch[l] === s) hot = Math.max(hot, clamp((t - (p.t + l * HOP)) / 0.25) * (1 - 0.55 * prog(t, p.t + l * HOP + 0.6, p.t + l * HOP + 1.6)));
        }
        const pe = clamp(grow * 3.4 - l);
        polyline(ctx, [[x0, y0 + 30], [x0, y0 + 62], [x1, y1 - 62], [x1, y1 - 30]], hot > 0 ? mixHex(COL.faint, COL.amber, hot, 1) : rgba(COL.faint, 0.9), hot > 0 ? 3 + 3 * hot : 3, pe);
      }
      /* nodes */
      for (let l = 0; l < 3; l++) for (let i = 0; i < LX[l].length; i++) {
        let hot = 0;
        for (const p of paths) if (nodeIdx(p.ch, l) === i) hot = Math.max(hot, pulse(t, p.t + l * HOP, 0.06, 0.7));
        diamond(ctx, LX[l][i], LY[l], 30, hot, clamp(grow * 3.4 - l + 0.4));
      }
      /* leaves */
      for (let i = 0; i < 8; i++) {
        let hot = 0;
        for (const p of paths) if (nodeIdx(p.ch, 3) === i) hot = Math.max(hot, clamp((t - (p.t + 3 * HOP)) / 0.2));
        const a = clamp(grow * 3.4 - 2.6), x = LX[3][i], y = LY[3];
        withAlpha(ctx, a, () => {
          if (hot > 0) glow(ctx, x, y, 80, COL.mint, 0.45 * hot);
          fillRR(ctx, x - 42, y - 26, 84, 52, 10, mixHex('#111926', COL.mint, 0.5 * hot, 1));
          strokeRR(ctx, x - 42, y - 26, 84, 52, 10, hot > 0 ? rgba(COL.mint, 0.9) : rgba(COL.faint, 0.9), 2.5);
          if (hot > 0) check(ctx, x, y, 26, COL.white, hot, 6);
        });
      }
      /* travelling packets */
      for (const p of paths) {
        const u = (t - p.t) / HOP;
        if (u < -0.1 || u > 3.05) continue;
        const l = clamp(Math.floor(u), 0, 2), f = E.io2(clamp(u - l));
        const x0 = LX[l][nodeIdx(p.ch, l)], x1 = LX[l + 1][nodeIdx(p.ch, l + 1)];
        const pos = polyAt([[x0, LY[l]], [x0, LY[l] + 62], [x1, LY[l + 1] - 62], [x1, LY[l + 1]]], f * (124 + Math.hypot(x1 - x0, LY[l + 1] - LY[l] - 124)));
        glow(ctx, pos[0], pos[1], 46, COL.white, 0.9); dot(ctx, pos[0], pos[1], 9, COL.white);
      }
    });
  }

  function regionRect(R, key) { const n = REG[key]; return [R.x + n[0] * R.w, R.y + n[1] * R.h, n[2] * R.w, n[3] * R.h]; }

  function drawRegion(ctx, t, R, key, lit, o = {}) {
    const [x, y, w, h] = regionRect(R, key);
    const k = R.w / FP.w;                                   // scale of detail
    const hex = key === 'alu' ? COL.cyan : COL.amber;
    const { dx = 0, dy = 0, rot = 0, a = 1, detail = 1 } = o;
    if (a <= 0.003) return;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.translate(x + w / 2 + dx, y + h / 2 + dy); ctx.rotate(rot); ctx.translate(-w / 2, -h / 2);
    if (lit > 0.02) glow(ctx, w / 2, h / 2, Math.max(w, h) * 0.75, hex, 0.2 * lit);
    rr(ctx, 0, 0, w, h, 18 * k);
    ctx.fillStyle = mixHex('#0E1622', hex, 0.06 + 0.2 * lit, 0.96); ctx.fill();
    ctx.strokeStyle = rgba(hex, 0.3 + 0.7 * lit); ctx.lineWidth = 2 + 1.5 * lit; ctx.stroke();
    const d = detail * clamp((R.w - 420) / 380);
    if (d > 0.02) {
      const names = { pred: ['BRANCH', 'PREDICTION'], cache: ['CACHE'], ctrl: ['OUT-OF-ORDER', 'CONTROL'], alu: ['ARITHMETIC'] };
      const subs = { pred: 'guesses what comes next', cache: 'keeps data close', ctrl: 'reorders work on the fly', alu: 'the actual math' };
      const la = d * (0.5 + 0.5 * lit);
      names[key].forEach((s, i) => text(ctx, s, 26 * k, (50 + i * 38) * k, { size: 31 * k, weight: 800, family: F.mono, color: lit > 0.4 ? COL.white : hex, alpha: la, ls: 2 }));
      text(ctx, subs[key], 26 * k, (50 + names[key].length * 38 + 2) * k, { size: 25 * k, weight: 500, family: F.ui, color: COL.dim, alpha: d * lit });
      ctx.globalAlpha *= d * (0.35 + 0.65 * lit);
      if (key === 'pred') {                                  // branch history bits
        for (let i = 0; i < 12; i++) {
          const on = hash(i * 3.1 + Math.floor(t * 5 + i * 0.37)) > 0.5;
          fillRR(ctx, (26 + i * 40) * k, h - 72 * k, 30 * k, 30 * k, 6 * k, on ? rgba(COL.amber, 0.9) : rgba(COL.amber, 0.16));
        }
      } else if (key === 'cache') {                          // memory cells
        for (let r = 0; r < 5; r++) for (let q = 0; q < 6; q++) {
          const on = hash(r * 7 + q * 3 + Math.floor(t * 3 + r * 0.6)) > 0.6;
          fillRR(ctx, (26 + q * 58) * k, (150 + r * 44) * k, 48 * k, 34 * k, 6 * k, on ? rgba(COL.amber, 0.75) : rgba(COL.amber, 0.14));
        }
      } else if (key === 'ctrl') {                           // reorder queue
        for (let r = 0; r < 3; r++) {
          for (let q = 0; q < 9; q++) fillRR(ctx, (26 + q * 54) * k, (190 + r * 46) * k, 44 * k, 32 * k, 6 * k, rgba(COL.amber, 0.13));
          const pos = (t * (1.6 + r * 0.7) + r * 2.3) % 8.3;
          fillRR(ctx, (26 + pos * 54) * k, (190 + r * 46) * k, 44 * k, 32 * k, 6 * k, rgba(COL.amber, 0.85));
        }
      } else {                                               // arithmetic unit
        text(ctx, '+ × −', w - 26 * k, h - 34 * k, { size: 62 * k, weight: 800, family: F.mono, color: COL.cyan, align: 'right' });
      }
    }
    ctx.restore();
  }

  function drawDupGrid(ctx, t) {
    /* the arithmetic block subdividing: 1 -> 4 -> 16 -> ... -> 4096 copies */
    let level = 0, q = 1;
    for (let k = 0; k < 6; k++) if (t >= dupT(k)) { level = k + 1; q = E.out3(prog(t, dupT(k), dupT(k) + 0.2)); }
    const n = Math.pow(2, level);
    const breathe = n === 1 ? Math.sin(t * 4.2) : 0;                       // the lone block breathes while it waits to be copied
    const S = lerp(264, 600, E.io2(prog(t, c.copied - 0.05, dupT(5) + 0.25))) * (1 + 0.022 * breathe);
    const cx = 540, cy = 848, x0 = cx - S / 2, y0 = cy - S / 2, cs = S / n;
    const gN = Math.max(1.1, cs * 0.14), gP = Math.max(1.1, cs * 2 * 0.14);
    const gapAt = (i) => (i === 0 || i === n ? 0 : i % 2 === 1 ? gN * q : lerp(gP, gN, q));
    glow(ctx, cx, cy, S * 0.95, COL.cyan, 0.3);
    const flash = pulse(t, tFinal, 0.05, 0.7);
    for (let j = 0; j < n; j++) {
      const ya = y0 + j * cs + gapAt(j) / 2, yb = y0 + (j + 1) * cs - gapAt(j + 1) / 2;
      for (let i = 0; i < n; i++) {
        const xa = x0 + i * cs + gapAt(i) / 2, xb = x0 + (i + 1) * cs - gapAt(i + 1) / 2;
        const f = hash2(i * 1.7 + Math.floor(t * 6 + hash2(i, j) * 6), j * 2.3);
        const L = n === 1 ? 0.55 + 0.14 * breathe : 0.34 + 0.5 * f * f + 0.4 * flash;
        ctx.fillStyle = mixHex('#0B2530', COL.cyan, clamp(L), 1);
        if (n <= 8) { rr(ctx, xa, ya, xb - xa, yb - ya, Math.min(16, cs * 0.12)); ctx.fill(); }
        else ctx.fillRect(xa, ya, xb - xa, yb - ya);
      }
    }
    if (n === 1) {
      strokeRR(ctx, x0, y0, S, S, 18, rgba(COL.cyan, 0.95), 3.5);
      const rp = (t * 0.9) % 1;                                              // slow radiating outline
      strokeRR(ctx, x0 - 46 * rp, y0 - 46 * rp, S + 92 * rp, S + 92 * rp, 18 + 20 * rp, rgba(COL.cyan, 0.5 * (1 - rp)), 2.5);
      text(ctx, '+ × −', cx, cy + 26, { size: 74, weight: 800, family: F.mono, color: COL.white, align: 'center' });
    }
    return { n, S, cx, cy };
  }

  addScene(B, function (ctx, t) {
    const isGpu = t >= tFlip + 0.2;
    /* ----- title (flips CPU -> GPU) ----- */
    const fp = prog(t, tFlip, tFlip + 0.4);
    const sy = Math.abs(Math.cos(Math.PI * fp));
    const tin = tw(t, S0 - 0.35, S0 + 0.2, E.out3);
    ctx.save(); ctx.translate(SAFE.l, 470); ctx.scale(1, Math.max(0.02, sy)); ctx.translate(0, (1 - tin) * 30);
    text(ctx, isGpu ? 'GPU' : 'CPU', 0, 0, { size: 132, weight: 900, family: F.disp, color: isGpu ? COL.cyan : COL.amber, alpha: tin, ls: -2 });
    ctx.restore();

    /* right-hand status line next to the title */
    const sub1 = win(t, c.decisions - 0.25, c.few - 0.1, 0.3, 0.25);
    text(ctx, 'built for', SAFE.r, 420, { size: 38, weight: 600, color: COL.dim, align: 'right', alpha: sub1 });
    text(ctx, 'decisions', SAFE.r, 472, { size: 54, weight: 800, family: F.disp, color: COL.white, align: 'right', alpha: sub1 });
    const sub2 = win(t, c.few, tZoom0 + 0.2, 0.3, 0.3);
    text(ctx, 'a few', SAFE.r, 420, { size: 38, weight: 600, color: COL.dim, align: 'right', alpha: sub2 });
    text(ctx, 'brilliant cores', SAFE.r, 472, { size: 54, weight: 800, family: F.disp, color: COL.white, align: 'right', alpha: sub2 });

    /* ----- A: decision tree ----- */
    drawTree(ctx, t, 1 - prog(t, c.few - 0.3, c.few + 0.1));

    /* ----- B: die with 8 cores, then dive into one ----- */
    const zp = tw(t, tZoom0, tZoom1, E.io3);
    const dieA = prog(t, c.few - 0.15, c.few + 0.15) * (1 - prog(zp, 0.08, 0.5));
    if (dieA > 0) {
      const [zx, zy, zw, zh] = coreRect(ZOOM_CORE);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 504, W, 716); ctx.clip();          // keep the dive clear of the title and the caption band
      withAlpha(ctx, dieA, () => withCam(ctx, { fx: zx + zw / 2, fy: zy + zh / 2, zoom: lerp(1, 3.3, zp), dx: (540 - zx - zw / 2) * zp, dy: (848 - zy - zh / 2) * zp }, () => {
        glow(ctx, 540, 834, 620, COL.amber, 0.14);
        fillRR(ctx, DIE.x, DIE.y, DIE.w, DIE.h, 30, 'rgba(11,17,26,0.95)');
        strokeRR(ctx, DIE.x, DIE.y, DIE.w, DIE.h, 30, rgba(COL.amber, 0.6), 3);
        for (let k = 0; k < 8; k++) {
          const [x, y, w, h] = coreRect(k);
          const p = E.outBack(prog(t, c.few + k * 0.085, c.few + k * 0.085 + 0.3));
          if (p <= 0) continue;
          ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(p, p);
          fillRR(ctx, -w / 2, -h / 2, w, h, 16, mixHex('#131C28', COL.amber, 0.1, 1));
          strokeRR(ctx, -w / 2, -h / 2, w, h, 16, rgba(COL.amber, k === ZOOM_CORE ? 0.6 + 0.4 * zp : 0.6), 2.5);
          text(ctx, 'CORE ' + (k + 1), -w / 2 + 18, -h / 2 + 40, { size: 26, weight: 800, family: F.mono, color: COL.amber, ls: 2, alpha: 1 - zp });
          fillRR(ctx, -w / 2 + 18, 4, 130, 36, 8, rgba(COL.amber, 0.16 + 0.16 * (0.5 + 0.5 * Math.sin(t * 5 + k * 1.3))));
          fillRR(ctx, -w / 2 + 158, 4, 94, 36, 8, rgba(COL.amber, 0.1 + 0.14 * (0.5 + 0.5 * Math.sin(t * 6.3 + k * 2.1))));
          ctx.restore();
        }
      }));
      ctx.restore();
    }

    /* ----- floor plan of one core ----- */
    const fpA = prog(zp, 0.22, 0.7) * (1 - prog(t, tCenter1 - 0.1, tCenter1 + 0.1));
    if (fpA > 0) {
      const [zx, zy, zw, zh] = coreRect(ZOOM_CORE);
      const e = E.out3(prog(zp, 0.25, 1));
      const R = { x: lerp(zx, FP.x, e), y: lerp(zy, FP.y, e), w: lerp(zw, FP.w, e), h: lerp(zh, FP.h, e) };
      const litOf = (tc) => 0.18 + 0.82 * tw(t, tc - 0.1, tc + 0.25, E.out3);
      const strip = (key, dirx, diry, rot) => {
        const p = E.in2(prog(t, tStrip[key], tStrip[key] + 0.7));
        return { dx: dirx * 900 * p, dy: diry * 900 * p, rot: rot * p, a: 1 - prog(p, 0.45, 1) };
      };
      withAlpha(ctx, fpA, () => {
        drawRegion(ctx, t, R, 'pred', litOf(c.prediction), strip('pred', -1.0, -0.08, -0.3));
        drawRegion(ctx, t, R, 'cache', litOf(c.caching), strip('cache', 0.95, -0.3, 0.3));
        drawRegion(ctx, t, R, 'ctrl', litOf(c.control), strip('ctrl', -0.8, 0.65, 0.3));
        /* arithmetic block: small, and later the only survivor */
        const mv = tw(t, tCenter0, tCenter1, E.io3);
        const [ax, ay, aw, ah] = regionRect(R, 'alu');
        const tx = 540 - 132, ty = 848 - 132, ts = 264;
        const rx = lerp(ax, tx, mv), ry = lerp(ay, ty, mv), rw = lerp(aw, ts, mv), rh = lerp(ah, ts, mv);
        const aluLit = 0.3 + 0.7 * Math.max(tw(t, c.task + 0.3, c.task + 0.5), prog(t, tStrip.pred, tStrip.pred + 0.4));
        glow(ctx, rx + rw / 2, ry + rh / 2, Math.max(rw, rh) * 0.8, COL.cyan, 0.22 * aluLit);
        rr(ctx, rx, ry, rw, rh, 18);
        ctx.fillStyle = mixHex('#0E1622', COL.cyan, 0.08 + 0.3 * aluLit, 0.97); ctx.fill();
        ctx.strokeStyle = rgba(COL.cyan, 0.4 + 0.6 * aluLit); ctx.lineWidth = 3; ctx.stroke();
        const dA = clamp((R.w - 420) / 380);
        text(ctx, 'ARITHMETIC', rx + 26, ry + 50, { size: 31, weight: 800, family: F.mono, color: aluLit > 0.6 ? COL.white : COL.cyan, ls: 2, alpha: dA * (1 - mv) });
        text(ctx, 'the actual math', rx + 26, ry + 90, { size: 25, weight: 500, color: COL.dim, alpha: dA * (1 - mv) * prog(t, c.control + 0.5, c.control + 0.9) });
        text(ctx, '+ × −', lerp(rx + rw - 26, 540, mv), lerp(ry + rh - 34, 848 + 26, mv), { size: lerp(62, 74, mv), weight: 800, family: F.mono, color: mv > 0.5 ? COL.white : COL.cyan, align: mv > 0.5 ? 'center' : 'right', alpha: dA });

        /* one task racing through the core: a comet, so no line is left over the labels */
        const u = prog(t, c.task - 0.05, c.task + 0.5);
        if (u > 0 && u < 1 && t < tFlip) {
          const route = [[R.x - 40, R.y + 214], [R.x + 264, R.y + 214], [R.x + 264, R.y + 414], [R.x + 740, R.y + 414], [R.x + 740, R.y + 520], [R.x + R.w + 60, R.y + 520]];
          const L = polyLen(route), e2 = E.io2(u);
          polySeg(ctx, route, rgba(COL.white, 0.95), 6, e2 - 0.2, e2);
          const pos = polyAt(route, L * e2); glow(ctx, pos[0], pos[1], 74, COL.white, 1); dot(ctx, pos[0], pos[1], 11, COL.white);
        }
        const done = pulse(t, c.task + 0.5, 0.05, 1.2);
        if (done > 0.01 && t < tFlip) { const [qx, qy, qw, qh] = regionRect(R, 'alu'); ring(ctx, qx + qw / 2, qy + qh / 2, 40 + 150 * (1 - done), COL.white, 4, done); }
      });
    }

    /* silicon budget bar: where a CPU core's area goes */
    const barA = win(t, c.control + 0.45, tFlip - 0.1, 0.4, 0.3);
    if (barA > 0) {
      const bx = 470, bw = 540, by = 452, g = E.out3(prog(t, c.control + 0.45, c.control + 1.1));
      text(ctx, 'decision machinery', bx, 432, { size: 26, weight: 700, family: F.mono, color: COL.amber, alpha: barA, ls: 1 });
      text(ctx, 'math', bx + bw, 432, { size: 26, weight: 700, family: F.mono, color: COL.cyan, alpha: barA, align: 'right', ls: 1 });
      withAlpha(ctx, barA, () => {
        fillRR(ctx, bx, by, bw * 0.86 * g, 22, 8, COL.amber);
        fillRR(ctx, bx + bw * 0.86 + 8, by, (bw * 0.14 - 8) * g, 22, 8, COL.cyan);
      });
    }
    const optA = win(t, c.opposite - 0.1, c.strips + 0.2, 0.3, 0.4);
    if (optA > 0) {
      text(ctx, 'makes the', SAFE.r, 420, { size: 38, weight: 600, color: COL.dim, align: 'right', alpha: optA });
      text(ctx, 'opposite bet', SAFE.r, 472, { size: 54, weight: 800, family: F.disp, color: COL.white, align: 'right', alpha: optA });
    }

    /* goal pills */
    pill(ctx, 'GOAL  ·  FINISH ONE TASK FAST', 540, 1186, { size: 27, bg: rgba(COL.amber, 0.16), color: COL.amber, stroke: rgba(COL.amber, 0.8), alpha: win(t, c.task + 0.35, tFlip, 0.3, 0.25), ls: 2 });
    pill(ctx, 'GOAL  ·  MAXIMUM THROUGHPUT', 540, 1186, { size: 27, bg: rgba(COL.cyan, 0.14), color: COL.cyan, stroke: rgba(COL.cyan, 0.8), alpha: prog(t, c.thousands + 0.1, c.thousands + 0.45), ls: 2 });

    /* ----- E: the arithmetic block, copied thousands of times ----- */
    if (t >= tCenter1 - 0.1) {
      const a = prog(t, tCenter1 - 0.1, tCenter1 + 0.1);
      withAlpha(ctx, a, () => {
        const g = drawDupGrid(ctx, t);
        const lab = win(t, c.raw - 0.1, c.copied - 0.05, 0.25, 0.2);
        text(ctx, 'RAW ARITHMETIC', 540, 664, { size: 34, weight: 800, family: F.mono, color: COL.cyan, align: 'center', alpha: lab, ls: 5 });
        text(ctx, 'and almost nothing else', 540, 1044, { size: 32, weight: 600, color: COL.dim, align: 'center', alpha: lab * prog(t, c.raw + 0.3, c.raw + 0.7) });
        /* copy counter */
        if (t >= c.copied) {
          const fin = t >= tFinal;
          const val = fin ? 21760 : g.n * g.n;
          const hit = pulse(t, fin ? tFinal : dupT(Math.round(Math.log2(g.n)) - 1), 0.04, 0.35);
          text(ctx, '×' + fmt(val), SAFE.r, 468 - 4 * hit, { size: 84 + 8 * hit, weight: 900, family: F.disp, color: fin ? COL.amber : COL.white, align: 'right', ls: -1 });
          text(ctx, fin ? 'ARITHMETIC LANES' : 'COPIES', SAFE.r, 512, { size: 25, weight: 700, family: F.mono, color: COL.dim, align: 'right', ls: 3 });
        }
      });
    }
  }, { type: 'zoomOut', fx: 540, fy: 900, z: 0.5, zb: 1.35, bx: 540, by: 800 });
});
