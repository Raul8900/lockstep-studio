'use strict';
/* Scene 1 — THE TEAR
   "I just tore a chunk off this QR code. It still scans.
    That's because most of it isn't your message at all."
   The real hero code rips along its printed tear line, still reads STILL HERE, and a strip of
   its 26 bytes shows that only 9 are the message. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    tore: at('hook', 'tore'),
    it: at('hook', 'it'),
    scans: at('hook', 'scans'),
    scansEnd: at('hook', 'scans', 1, 't1'),
    because: at('hook', 'because'),
    most: at('hook', 'most'),
    message: at('hook', 'message'),
    all: at('hook', 'all'),
  };
  const rip = c.tore - 0.06;
  const ST = { cx: 540, cy: 692, m: 23 };
  const half = (QN / 2 + QS) * ST.m;                       // half the sticker's width in px
  const BX = [ST.cx - half, ST.cy - half, ST.cx + half, ST.cy + half];
  const STRIP = { y: 1150, cell: 28, gap: 5, split: 22 };
  const stripX0 = CX - (26 * STRIP.cell + 25 * STRIP.gap + STRIP.split) / 2;
  const cellX = (i) => stripX0 + i * (STRIP.cell + STRIP.gap) + (i >= 9 ? STRIP.split : 0);

  sfx(rip - 0.03, 'rip', 0.95);
  sfx(rip + 0.04, 'impact', 0.45);
  sfx(rip + 0.12, 'whoosh', 0.55);
  sfx(c.it - 0.2, 'tick', 0.32, { pitch: 1.2 });
  sfx(c.scans - 0.07, 'lock', 0.55);
  sfx(c.scansEnd + 0.06, 'chime', 0.6);
  for (let i = 0; i < 26; i += 2) sfx(c.because - 0.05 + i * 0.022, 'tick', 0.28, { pitch: 0.9 + i * 0.02 });
  sfx(c.message - 0.06, 'blip', 0.5);
  sfx(c.all - 0.04, 'pop', 0.45);

  addScene('hook', function (ctx, t) {
    const torn = t >= rip;
    const fly = prog(t, rip, rip + 0.95);
    const hit = pulse(t, rip + 0.02, 0.03, 0.35);
    const sweep = prog(t, c.it - 0.2, c.scans - 0.02);
    const lock = tw(t, c.scans - 0.08, c.scans + 0.22, E.outBack);
    const ok = tw(t, c.scans - 0.02, c.scans + 0.3);
    const strip = prog(t, c.because - 0.1, c.because + 0.6);
    const zoom = lerp(1, 1.035, tw(t, 0, beatOf('hook').t1 + 0.4, E.io2));

    withCam(ctx, { fx: CX, fy: 760, zoom: zoom + 0.03 * hit, dx: 7 * hit * Math.sin(t * 97), dy: 4 * hit * Math.cos(t * 83) }, () => {
      /* the sticker: floating gently, torn on "tore" */
      const rot = 0.006 * Math.sin(t * 1.3) - 0.004;
      const e = E.in2(fly);
      drawSticker(ctx, {
        cx: ST.cx + 3 * Math.sin(t * 0.9), cy: ST.cy + 4 * Math.sin(t * 1.1 + 1), m: ST.m, rot,
        hero: torn,
        cut: torn ? 0 : 1,
        piece: torn ? { dx: 18 + 330 * e, dy: 14 + 760 * e, rot: 0.15 + 1.1 * e, alpha: 1 - prog(fly, 0.55, 1) } : null,
      });
      /* the scanner */
      const col = ok > 0.5 ? COL.good : COL.subject;
      brackets(ctx, BX[0], BX[1], BX[2], BX[3], { p: 1, k: lock, col, loose: 30 + 5 * Math.sin(t * 3.1) * (1 - lock), lw: 9 });
      scanSweep(ctx, BX[0] + 20, BX[1] + 20, BX[2] - 20, BX[3] - 20, sweep, COL.subject);
    });

    /* the verdict */
    readout(ctx, CX, 1050, 'STILL HERE', true, tw(t, c.scans - 0.02, c.scans + 0.32, E.lin) * (1 + 0.025 * Math.sin(t * 4) * ok));

    /* 26 bytes: 9 message, 17 "the rest" */
    if (strip > 0) {
      const blue = tw(t, c.most - 0.08, c.most + 0.25), orange = tw(t, c.message - 0.08, c.message + 0.2), q = tw(t, c.all - 0.05, c.all + 0.25);
      for (let i = 0; i < 26; i++) {
        const p = prog(strip, i / 34, i / 34 + 0.25);
        if (p <= 0) continue;
        const msg = i < 9;
        const col = msg ? mixHex(COL.dim, COL.data, orange) : mixHex(COL.dim, COL.subject, blue);
        const x = cellX(i), e = E.outBack(clamp(p)), lift = msg ? -8 * pulse(t, c.message + i * 0.03, 0.05, 0.4) : 0;
        ctx.save(); ctx.translate(x + STRIP.cell / 2, STRIP.y + lift); ctx.scale(e, e);
        fillRR(ctx, -STRIP.cell / 2 + 3, -18 + 3, STRIP.cell, 36, 3, rgba(COL.ink, 0.85));
        fillRR(ctx, -STRIP.cell / 2, -18, STRIP.cell, 36, 3, col);
        if (!msg && q > 0) text(ctx, '?', 0, 10, { size: 24, weight: 800, family: F.ui, color: COL.panel, align: 'center', alpha: q });
        ctx.restore();
      }
      riseText(ctx, 'YOUR MESSAGE · 9', cellX(0), STRIP.y + 64, orange, { size: 26, weight: 700, family: F.mono, color: COL.data, ls: 1.5 });
      riseText(ctx, 'THE REST · 17', cellX(25) + STRIP.cell, STRIP.y + 64, q, { size: 26, weight: 700, family: F.mono, color: COL.subject, ls: 1.5, align: 'right' });
    }
  }, { type: 'fade' });
});
