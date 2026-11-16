'use strict';
/* Scene 8 — THE LIMITS
   "A twenty twenty-three study ran for thirteen months with more than thirty-six hundred people. Its authors
   judged the checkbox costly, with close to no security gain, and say it should be retired. Nobody outside
   Google knows how the signals are weighted. So every study tests from the outside."

   A: thirteen months, and more than 3,600 people (a field of dots).
   B: the authors' judgement: costly, close to no security gain, and retire it (a crossed-out box).
   C: the signals' weights are not published; every study tests from outside.                              */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    twentyThree: at('limits', 'twenty-three'),
    thirteen: at('limits', 'thirteen'),
    months: at('limits', 'months'),
    more: at('limits', 'more'),
    thirtySix: at('limits', 'thirty-six'),
    people: at('limits', 'people'),
    authors: at('limits', 'authors'),
    judged: at('limits', 'judged'),
    costly: at('limits', 'costly'),
    close: at('limits', 'close'),
    security: at('limits', 'security'),
    say: at('limits', 'say'),
    retired: at('limits', 'retired'),
    nobody: at('limits', 'nobody'),
    outside: at('limits', 'outside'),
    weighted: at('limits', 'weighted'),
    tests: at('limits', 'tests'),
    outside2: at('limits', 'outside', 2),
  };

  sfx(c.thirteen, 'count', 0.5, { dur: 0.5 });
  sfx(c.more, 'data', 0.35, { dur: 1.2 });
  sfx(c.thirtySix, 'impact', 0.55);
  sfx(c.authors, 'blip', 0.4);
  sfx(c.costly, 'deny', 0.5);
  sfx(c.say, 'slice', 0.5);
  sfx(c.retired, 'stamp', 0.6);
  sfx(c.nobody, 'whoosh', 0.4);
  sfx(c.weighted, 'deny', 0.5);
  sfx(c.outside2, 'tick', 0.4);

  addScene('limits', function (ctx, t) {
    /* A: thirteen months, and more than 3,600 people */
    const gA = 1 - tw(t, c.authors - 0.6, c.authors - 0.1);
    withAlpha(ctx, gA, () => {
      riseText(ctx, '13 MONTHS', 540, 470, prog(t, c.thirteen, c.thirteen + 0.3), { size: 64, weight: 900, family: F.disp, color: COL.amber, align: 'center' });
      for (let i = 0; i < 13; i++) {
        const a = prog(t, c.thirteen + i * 0.035, c.thirteen + i * 0.035 + 0.12);
        fillRR(ctx, 150 + i * 60, 520, 52, 22, 6, rgba(COL.amber, 0.2 + 0.7 * a));
      }
      dotField(ctx, 150, 600, 780, 420, 60, 60, prog(t, c.more - 0.2, c.people + 0.1), COL.amber);
      riseText(ctx, '3,600+', 540, 1140, prog(t, c.thirtySix, c.thirtySix + 0.3), { size: 150, weight: 900, family: F.disp, color: COL.amber, align: 'center', ls: -2 });
    });

    /* B: the authors' judgement */
    const gB = tw(t, c.authors - 0.5, c.authors - 0.1) * (1 - tw(t, c.nobody - 0.7, c.nobody - 0.3));
    withAlpha(ctx, gB, () => {
      riseText(ctx, "THE AUTHORS' VIEW", 540, 470, prog(t, c.authors, c.authors + 0.3), { size: 40, weight: 900, family: F.mono, color: COL.white, align: 'center', ls: 3 });
      drawBox(ctx, 330, 760, 210, { hot: prog(t, c.costly - 0.2, c.costly + 0.4) });
      riseText(ctx, 'COSTLY', 330, 600, prog(t, c.costly, c.costly + 0.3), { size: 34, weight: 900, family: F.mono, color: COL.coral, align: 'center', ls: 2 });
      cross(ctx, 330, 760, 120, COL.coral, prog(t, c.say, c.say + 0.35), 14);
      riseText(ctx, 'RETIRE IT', 330, 1000, prog(t, c.retired, c.retired + 0.3), { size: 34, weight: 900, family: F.mono, color: COL.coral, align: 'center', ls: 2 });
      riseText(ctx, 'SECURITY GAIN', 600, 700, prog(t, c.security, c.security + 0.3), { size: 26, weight: 800, family: F.mono, color: COL.violet, align: 'left', ls: 2 });
      fillRR(ctx, 600, 730, 330, 26, 13, rgba(COL.lineHi, 0.5));
      fillRR(ctx, 600, 730, 330 * 0.08 * prog(t, c.close - 0.2, c.close + 0.5), 26, 13, rgba(COL.violet, 0.9));
      riseText(ctx, 'CLOSE TO NONE', 600, 820, prog(t, c.close, c.close + 0.3), { size: 30, weight: 900, family: F.mono, color: COL.coral, align: 'left', ls: 2 });
    });

    /* C: the weights are not published; studies test from outside */
    const gC = tw(t, c.nobody - 0.2, c.nobody + 0.3) * (1 - tw(t, c.nobody + 4.8, c.nobody + 5.2));
    withAlpha(ctx, gC, () => {
      riseText(ctx, 'OUTSIDE', 540, 470, prog(t, c.outside, c.outside + 0.3), { size: 60, weight: 900, family: F.disp, color: COL.white, align: 'center' });
      fillRR(ctx, 540 - 115, 720 - 115, 230, 230, 22, rgba(COL.panel, 0.95));
      strokeRR(ctx, 540 - 115, 720 - 115, 230, 230, 22, rgba(COL.violet, 0.8), 4);
      text(ctx, '?', 540, 728, { size: 170, weight: 900, family: F.disp, color: COL.coral, align: 'center', base: 'middle' });
      for (let k = 0; k < 8; k++) {
        const ang = (k * TAU) / 8 + t * 0.22;
        dot(ctx, 540 + Math.cos(ang) * 210, 720 + Math.sin(ang) * 210, 11, COL.violet, 0.9);
      }
      for (let k = 0; k < 6; k++) {
        const q = tw(t, c.tests + k * 0.05, c.outside2 + k * 0.05, E.io3);
        if (q <= 0) continue;
        const ang = (k * TAU) / 6 + 0.3;
        const r = lerp(430, 300, q);
        dot(ctx, 540 + Math.cos(ang) * r, 720 + Math.sin(ang) * r, 8, COL.white, clamp(q * 2));
      }
      pill(ctx, 'WEIGHTS NOT PUBLISHED', 540, 1080, { bg: rgba(COL.coral, 0.22), color: COL.white, size: 28, stroke: rgba(COL.coral, 0.9), alpha: prog(t, c.weighted, c.weighted + 0.3) });
    });
  }, { type: 'zoomOut', fx: 540, fy: 760, z: 0.45 });
});
