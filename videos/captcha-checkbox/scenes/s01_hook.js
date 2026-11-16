'use strict';
/* Scene 1 — HOOK
   "You tap a box that says you're not a robot. Researchers say the test started before your finger got there."

   The widget sits in the middle of the frame. The cursor is already on its way at frame 0 and lands on the
   box at "tap". The path it took is drawn from where it started: at "started" the trail lights up from that
   start (STARTED HERE), a pulse runs back along it, and the box ticks after "robot".
   Nothing in frame 0 is faded in: the cursor is mid-path and the trail is already there.                    */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    tap: at('hook', 'tap'),
    robot: at('hook', 'robot'),
    started: at('hook', 'started'),
    there: at('hook', 'there'),
  };
  const WX = 150, WY = 706, WW = 780, WH = 190, BOXS = 120;
  const BX = WX + 30 + BOXS / 2, BY = WY + WH / 2;          // centre of the box
  const START = { x: 118, y: 1126 };                          // where the test started
  const PATH = handPath(START.x, START.y, BX + 16, BY + 14, { bend: 0.22, wob: 10 });
  const L = polyLen(PATH);
  const REST = 0.56;                                          // the cursor is already this far along at frame 0

  sfx(c.tap, 'lock', 0.9);
  sfx(c.started, 'blip', 0.5);
  sfx(c.robot + 0.04, 'chime', 0.55);
  sfx(c.there, 'impact', 0.45);

  addScene('hook', function (ctx, t) {
    ambient(ctx, t);
    const frac = REST + (1 - REST) * tw(t, 0, c.tap - 0.03, E.out3);   // approaches, lands on the tap
    const lit = prog(t, c.started, c.started + 0.45);                    // trail lights on "started"
    const pulse2 = prog(t, c.started, c.there - 0.02);                   // a pulse runs back along the trail
    const sheen = (t * 0.16) % 1;                                        // idle: a slow sheen along the path
    const tick = tw(t, c.robot + 0.04, c.robot + 0.42, E.out3);
    const spin = Math.max(0, t - c.tap) * 1.6;

    /* the trail: dim up to the cursor, cyan once it lights */
    polyline(ctx, PATH, COL.lineHi, 3, frac);
    polyline(ctx, PATH, COL.cyan, 6, frac, lit);
    polySeg(ctx, PATH, COL.cyan, 4, sheen * 0.9, sheen * 0.9 + 0.08, 0.5 * (1 - lit));
    const gp = polyAt(PATH, ((t * 0.35) % 1) * L);                      // a soft light travels along the trail
    glow(ctx, gp[0], gp[1], 90, COL.cyan, 0.3);
    if (pulse2 > 0 && pulse2 < 1) polySeg(ctx, PATH, COL.white, 8, Math.max(0, pulse2 - 0.1), pulse2, 0.95);

    /* where the test started */
    const sa = prog(t, c.started - 0.05, c.started + 0.25);
    ring(ctx, START.x, START.y, 26 + 4 * Math.sin(t * 3), COL.cyan, 4, sa);
    dot(ctx, START.x, START.y, 9, COL.cyan, sa);
    tag(ctx, 'STARTED HERE', START.x + 40, START.y + 8, { color: COL.cyan, size: 28, weight: 800, alpha: sa });

    /* the widget and the cursor */
    drawWidget(ctx, WX, WY, WW, WH, { p: tick, hot: lit, spin, boxS: BOXS });
    const cur = polyAt(PATH, frac * L);
    drawCursor(ctx, cur[0], cur[1], 1.3);

    /* the tap */
    const rk = prog(t, c.tap, c.tap + 0.55);
    if (rk > 0 && rk < 1) ring(ctx, BX, BY, 40 + 120 * E.out3(rk), COL.cyan, 6 * (1 - rk) + 1, (1 - rk) * 0.9);
  }, { type: 'fade' });
});
