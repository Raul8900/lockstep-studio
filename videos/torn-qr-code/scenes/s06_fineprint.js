'use strict';
/* Scene 6 — THE FINE PRINT
   "The catch: that's thirty percent of the bytes, not of the paper. These three corner squares
    aren't protected at all. They're how the scanner finds the code. Tear into one, and this
    code won't scan."
   Bytes tinted, everything else hatched; the three finder squares ringed in red; the scanner's
   locator triangle; a small rip through one square and the scan fails (verified: no decode). */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    catch: at('fineprint', 'catch'),
    thirty: at('fineprint', 'thirty'),
    bytes: at('fineprint', 'bytes'),
    not: at('fineprint', 'not'),
    paper: at('fineprint', 'paper'),
    these: at('fineprint', 'these'),
    three: at('fineprint', 'three'),
    corner: at('fineprint', 'corner'),
    squares: at('fineprint', 'squares'),
    arent: at('fineprint', "aren't"),
    protected: at('fineprint', 'protected'),
    scanner: at('fineprint', 'scanner'),
    finds: at('fineprint', 'finds'),
    tear: at('fineprint', 'tear'),
    wont: at('fineprint', "won't"),
    scan: at('fineprint', 'scan'),
  };
  const S0 = beatOf('fineprint').t0 - 0.5;
  const ST = { cx: 540, cy: 708, m: 25 };
  const half = (QN / 2 + QS) * ST.m;
  const BX = [ST.cx - half, ST.cy - half, ST.cx + half, ST.cy + half];
  const FIND = [[3.5, 3.5], [17.5, 3.5], [3.5, 17.5]].map(([x, y]) => qScreen(ST.cx, ST.cy, ST.m, x, y));
  const ringT = [c.three - 0.06, c.corner - 0.06, c.squares - 0.06];
  const rip = c.tear - 0.05, fail = c.wont - 0.06;
  const yA = 1098, yB = 1166;

  sfx(S0 + 0.02, 'thump', 0.45);
  sfx(c.catch - 0.06, 'stamp', 0.55);
  sfx(c.bytes - 0.08, 'slide', 0.32, { dur: 0.4 });
  sfx(c.paper - 0.08, 'slide', 0.32, { dur: 0.4 });
  ringT.forEach((r, i) => sfx(r, 'pop', 0.45, { pitch: 1 + i * 0.1 }));
  sfx(c.arent - 0.05, 'deny', 0.42);
  sfx(c.scanner - 0.1, 'blip', 0.38);
  sfx(c.finds - 0.04, 'lock', 0.42);
  sfx(rip - 0.03, 'rip', 0.8);
  sfx(rip + 0.1, 'whoosh', 0.45);
  sfx(rip + 0.45, 'stall', 0.45);
  sfx(fail, 'deny', 0.6);

  addScene('fineprint', function (ctx, t) {
    const push = tw(t, c.these - 0.2, c.tear, E.io3) * (1 - tw(t, c.tear + 0.2, c.wont + 0.2, E.io3) * 0.6);
    const hit = pulse(t, rip + 0.02, 0.03, 0.35);
    const torn = t >= rip;
    const fly = prog(t, rip, rip + 0.9), e = E.in2(fly);
    const tint = tw(t, c.bytes - 0.1, c.bytes + 0.2) * (1 - tw(t, c.these - 0.1, c.these + 0.3));
    const hatch = tw(t, c.paper - 0.1, c.paper + 0.2) * (1 - tw(t, c.these - 0.1, c.these + 0.3));
    const failK = tw(t, fail, fail + 0.25);

    withCam(ctx, { fx: FIND[0][0] + 60, fy: FIND[0][1] + 80, zoom: 1 + 0.07 * push + 0.03 * hit, dx: 7 * hit * Math.sin(t * 95) }, () => {
      drawSticker(ctx, {
        cx: ST.cx, cy: ST.cy + 3 * Math.sin(t * 1.1), m: ST.m, rot: 0.004 * Math.sin(t * 0.8),
        byteTint: tint, fnTint: hatch,
        finder: torn, fpiece: torn ? { dx: -260 * e - 10, dy: -420 * e - 8, rot: -0.2 - 0.9 * e, alpha: 1 - prog(fly, 0.6, 1) } : null,
      });
      /* the three corner squares, ringed */
      for (let i = 0; i < 3; i++) {
        const p = tw(t, ringT[i], ringT[i] + 0.25, E.outBack), gone = i === 0 && torn;
        if (p <= 0.01) continue;
        const [x, y] = FIND[i], r = 4.4 * ST.m * (1 + 0.03 * Math.sin(t * 5 + i));
        ctx.save(); if (gone) ctx.setLineDash([12, 9]);
        ring(ctx, x, y, r * clamp(p), COL.alert, 7, clamp(p * 2));
        ctx.restore();
      }
      /* the scanner's locator: a right triangle joining the three squares */
      const loc = tw(t, c.scanner - 0.15, c.finds + 0.1, E.io3);
      if (loc > 0) {
        const pts = [FIND[1], FIND[0], FIND[2]];
        if (!torn) polyline(ctx, pts, COL.subject, 6, loc);
        else {
          polyline(ctx, pts, COL.alert, 5, 1, 1 - 0.5 * failK, [14, 10]);
        }
        for (const [x, y] of FIND) {
          const a = clamp(loc * 2);
          line(ctx, x - 26, y, x + 26, y, COL.subject, 4, a); line(ctx, x, y - 26, x, y + 26, COL.subject, 4, a);
        }
      }
      /* the scanner searches, then gives up */
      const search = torn ? 1 - failK : 0;
      const jx = search * 9 * Math.sin(t * 23), jy = search * 7 * Math.cos(t * 19);
      const col = failK > 0.5 ? COL.alert : COL.subject;
      brackets(ctx, BX[0], BX[1], BX[2], BX[3], { p: 1, k: torn ? 0.2 : 0.5, col, loose: 26 + 14 * search, lw: 8, arm: 64, jx, jy });
    });

    /* the words under the code */
    stampLabel(ctx, 'THE FINE PRINT', CX, yA - 10, tw(t, c.catch - 0.08, c.catch + 0.18, E.lin) * (1 - tw(t, c.thirty - 0.1, c.thirty + 0.1)), { col: COL.alert, size: 50, rot: -0.04 });
    const l1 = win(t, c.thirty - 0.05, c.these - 0.1, 0.15, 0.2);
    if (l1 > 0) {
      const b = tw(t, c.bytes - 0.1, c.bytes + 0.2), pp = tw(t, c.paper - 0.1, c.paper + 0.2);
      text(ctx, '30% OF THE BYTES', CX, yA + 10, { size: 54, weight: 400, family: F.disp, color: COL.subject, align: 'center', alpha: l1 * clamp(b * 2 + 0.25) });
      text(ctx, 'BYTES = 47% OF THIS CODE · HATCHED = NOT BYTES', CX, yB + 10, { size: 25, weight: 700, family: F.mono, color: COL.dim, align: 'center', ls: 1, alpha: l1 * pp });
    }
    const l2 = win(t, c.arent - 0.1, c.scanner - 0.2, 0.15, 0.2);
    if (l2 > 0) text(ctx, 'NO BACKUP', CX, yA + 10, { size: 58, weight: 400, family: F.disp, color: COL.alert, align: 'center', alpha: l2 });
    const l3 = win(t, c.scanner - 0.1, c.tear - 0.15, 0.15, 0.15);
    if (l3 > 0) text(ctx, 'HOW THE SCANNER FINDS IT', CX, yA + 10, { size: 48, weight: 400, family: F.disp, color: COL.subject, align: 'center', alpha: l3 });
    readout(ctx, CX, yA, 'NO CODE FOUND', false, tw(t, fail, fail + 0.3, E.lin));
  }, { type: 'cut' });
});
