'use strict';
/* Scene 9 — THE TAKEAWAY
   "So the tap is the last step, not the test. It cares how you got there."

   The same widget and the same path as the hook. The tap lands at its end (the last step); the whole path
   lights up as the test (THE TEST); the box ticks at "got", and the takeaway holds on the end card, still moving. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    so: at('payoff', 'so'),
    tap: at('payoff', 'tap'),
    step: at('payoff', 'step'),
    not: at('payoff', 'not'),
    test: at('payoff', 'test'),
    cares: at('payoff', 'cares'),
    got: at('payoff', 'got'),
    there: at('payoff', 'there'),
  };
  const WX = 150, WY = 706, WW = 780, WH = 190, BOXS = 120;
  const BX = WX + 30 + BOXS / 2, BY = WY + WH / 2;
  const START = { x: 118, y: 1126 };
  const PATH = handPath(START.x, START.y, BX + 16, BY + 14, { bend: 0.22, wob: 10 });
  const L = polyLen(PATH);
  const REST = 0.56;

  sfx(c.tap, 'lock', 0.9);
  sfx(c.step, 'blip', 0.5);
  sfx(c.test, 'swell', 0.5, { dur: 1.0 });
  sfx(c.got, 'chime', 0.6);
  sfx(c.there, 'impact', 0.45);

  addScene('payoff', function (ctx, t) {
    const frac = REST + (1 - REST) * tw(t, c.so - 0.5, c.tap - 0.03, E.out3);
    const lit = prog(t, c.not, c.not + 0.5);
    const sheen = (t * 0.16) % 1;
    const tick = tw(t, c.got, c.got + 0.4, E.out3);

    /* the trail, lit as the test */
    polyline(ctx, PATH, COL.lineHi, 3, frac);
    polyline(ctx, PATH, COL.cyan, 6, frac, lit);
    polySeg(ctx, PATH, COL.cyan, 4, sheen * 0.9, sheen * 0.9 + 0.08, 0.5 * (1 - lit));
    const mid = polyAt(PATH, 0.5 * L);
    riseText(ctx, 'THE TEST', mid[0] + 40, mid[1] - 30, prog(t, c.test, c.test + 0.3), { size: 40, weight: 900, family: F.mono, color: COL.white, align: 'left', ls: 3 });

    /* the widget and the cursor */
    drawWidget(ctx, WX, WY, WW, WH, { p: tick, hot: lit, boxS: BOXS });
    const cur = polyAt(PATH, frac * L);
    drawCursor(ctx, cur[0], cur[1], 1.3);

    /* the last step: the tap */
    const rk = prog(t, c.tap, c.tap + 0.55);
    if (rk > 0 && rk < 1) ring(ctx, BX, BY, 40 + 120 * E.out3(rk), COL.cyan, 6 * (1 - rk) + 1, (1 - rk) * 0.9);
    riseText(ctx, 'LAST STEP', 300, 672, prog(t, c.step, c.step + 0.3), { size: 30, weight: 800, family: F.mono, color: COL.cyan, align: 'center', ls: 3 });

    /* the takeaway, on the end card */
    riseText(ctx, 'HOW YOU GOT THERE', 540, 560, prog(t, c.there, c.there + 0.3), { size: 72, weight: 900, family: F.disp, color: COL.white, align: 'center', ls: -1 });
  }, { type: 'fade' });
});
