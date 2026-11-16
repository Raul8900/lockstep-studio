'use strict';
/* Scene 5 — THE CURSOR (the longest scene)
   "A real hand never moves at one steady speed. It speeds up, peaks, and eases into the target.
   In nineteen eighty-five, Flash and Hogan modeled arm movement this way: a smooth, bell-shaped curve of speed.
   One published detector checks cursor paths against a model like that.
   In a twenty twenty-four study of reCAPTCHA version two, any cursor movement cut the number of puzzles needed
   to pass. Straight paths and curved ones were not significantly different. So is it the wobble? Google doesn't say."

   A: a flat, steady speed (coral, crossed out).  B: the hand's speed rises, peaks and eases into a target,
   and the bell curve draws with it.  C: 1985, Flash and Hogan, the bell curve.  D: a detector checks a path
   against a model.  E: the 2024 study's comparison.  F: straight versus curved.  G: the question.          */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    real: at('cursor', 'real'),
    steady: at('cursor', 'steady'),
    never: at('cursor', 'never'),
    it: at('cursor', 'it'),
    eases: at('cursor', 'eases'),
    peaks: at('cursor', 'peaks'),
    target: at('cursor', 'target'),
    nineteen: at('cursor', 'nineteen'),
    eighty: at('cursor', 'eighty-five'),
    flash: at('cursor', 'flash'),
    modeled: at('cursor', 'modeled'),
    smooth: at('cursor', 'smooth'),
    bell: at('cursor', 'bell-shaped'),
    published: at('cursor', 'published'),
    detector: at('cursor', 'detector'),
    checks: at('cursor', 'checks'),
    model: at('cursor', 'model'),
    twentyFour: at('cursor', 'twenty-four'),
    study: at('cursor', 'study'),
    any: at('cursor', 'any'),
    cut: at('cursor', 'cut'),
    puzzles: at('cursor', 'puzzles'),
    needed: at('cursor', 'needed'),
    straight: at('cursor', 'straight'),
    curved: at('cursor', 'curved'),
    significantly: at('cursor', 'significantly'),
    different: at('cursor', 'different'),
    so: at('cursor', 'so'),
    wobble: at('cursor', 'wobble'),
    doesnt: at('cursor', "doesn't"),
  };

  /* geometry */
  const GX = 150, GB = 1090, GW = 800, GH = 360;                 // speed graph: base-left, width, height
  const STEADY = speedPts(steadyV, GX, GB, GW, GH);
  const BELL = speedPts(bellV, GX, GB, GW, GH);
  const BELL_L = polyLen(BELL);
  const TRACK = handPath(170, 620, 890, 620, { bend: 0.06, wob: 5 });
  const TRACK_L = polyLen(TRACK);
  const HAND = handPath(150, 880, 930, 880, { bend: 0.12, wob: 26, n: 220 });
  const MODEL = handPath(150, 880, 930, 880, { bend: 0.12, wob: 0, n: 220 });
  const CURVE = handPath(170, 1000, 860, 790, { bend: 0.3, wob: 6, n: 200 });
  const STRAIGHT = [[170, 600], [860, 790]];
  const PEAK = [GX + GW * 0.5, GB - GH];

  sfx(c.real, 'whoosh', 0.4);
  sfx(c.never, 'deny', 0.5);
  sfx(c.it, 'zip', 0.5);
  sfx(c.peaks, 'blip', 0.6);
  sfx(c.target, 'lock', 0.7);
  sfx(c.nineteen, 'count', 0.5, { dur: 0.6 });
  sfx(c.flash, 'chime', 0.45);
  sfx(c.bell, 'swell', 0.5, { dur: 1.0 });
  sfx(c.detector, 'whoosh', 0.45);
  sfx(c.checks, 'tick', 0.45);
  sfx(c.study, 'riser', 0.35, { dur: 0.5 });
  sfx(c.cut, 'slice', 0.6);
  sfx(c.straight, 'pop', 0.45);
  sfx(c.curved, 'pop', 0.45);
  sfx(c.wobble, 'impact', 0.6);

  addScene('cursor', function (ctx, t) {
    /* the speed axes, shared by sections A to C */
    const axes = 1 - tw(t, c.detector - 0.9, c.detector - 0.5);
    speedAxes(ctx, GX, GB, GW, GH, prog(t, c.real - 0.5, c.real + 0.1), axes);
    tag(ctx, 'SPEED', GX + 14, GB - GH - 52, { color: COL.dim, size: 24, alpha: axes * prog(t, c.real - 0.2, c.real + 0.2) });
    tag(ctx, 'TIME', GX + GW, GB + 46, { align: 'right', color: COL.dim, size: 24, alpha: axes * prog(t, c.real - 0.2, c.real + 0.2) });

    /* A: one steady speed */
    const gA = 1 - tw(t, c.it - 0.5, c.it - 0.2);
    withAlpha(ctx, gA, () => {
      riseText(ctx, 'HOW A HAND MOVES', 540, 470, prog(t, c.real - 0.3, c.real + 0.2), { size: 58, weight: 900, family: F.disp, color: COL.white, align: 'center' });
      polyline(ctx, STEADY, COL.coral, 8, prog(t, c.real + 0.1, c.steady - 0.2));
      cross(ctx, 550, GB - GH * 0.7, 46, COL.coral, prog(t, c.never, c.never + 0.4), 12);
      riseText(ctx, 'ONE STEADY SPEED', GX + GW * 0.7, GB - GH * 0.7 - 44, prog(t, c.steady, c.steady + 0.3), { size: 30, weight: 800, family: F.mono, color: COL.coral, align: 'center', ls: 2 });
    });

    /* B: speeds up, peaks, eases into the target. The bell curve draws with the cursor. */
    const gB = 1 - tw(t, c.target + 0.4, c.target + 0.8);
    const pc = tw(t, c.it - 0.05, c.target, E.io3);
    const pb = prog(t, c.it - 0.05, c.target);
    withAlpha(ctx, gB, () => {
      line(ctx, 170, 620, 890, 620, rgba(COL.lineHi, 0.6), 3);
      ring(ctx, 900, 620, 36 + 6 * pulse(t, c.target, 0.08, 0.5), COL.cyan, 4, prog(t, c.eases - 0.4, c.eases));
      const cp = polyAt(TRACK, pc * TRACK_L);
      drawCursor(ctx, cp[0], cp[1], 1.2);
    });

    /* the bell curve stays on screen until section D */
    const fadeBell = 1 - tw(t, c.detector - 0.7, c.detector - 0.3);
    polyline(ctx, BELL, COL.cyan, 8, pb, fadeBell);
    if (pb > 0 && pb < 1) {
      const hd = polyAt(BELL, pb * BELL_L);
      dot(ctx, hd[0], hd[1], 10, COL.white, fadeBell);
    }
    const peakP = prog(t, c.peaks - 0.1, c.peaks + 0.3);
    riseText(ctx, 'PEAK', PEAK[0], PEAK[1] - 34, peakP, { size: 30, weight: 800, family: F.mono, color: COL.white, align: 'center', ls: 2, alpha: fadeBell });

    /* C: 1985, Flash and Hogan; the bell is their model */
    const gC = 1 - tw(t, c.detector - 0.7, c.detector - 0.3);
    withAlpha(ctx, gC, () => {
      riseText(ctx, '1985', 540, 560, prog(t, c.nineteen, c.eighty + 0.2), { size: 150, weight: 900, family: F.disp, color: COL.amber, align: 'center', ls: -2 });
      riseText(ctx, 'FLASH & HOGAN', 540, 634, prog(t, c.flash, c.flash + 0.3), { size: 44, weight: 800, family: F.ui, color: COL.white, align: 'center' });
      tag(ctx, 'MINIMUM-JERK MODEL', 540, 1150, { align: 'center', color: COL.dim, alpha: prog(t, c.smooth - 0.1, c.smooth + 0.3) });
      const bp = pulse(t, c.bell, 0.1, 0.6);
      glow(ctx, PEAK[0], PEAK[1], 150 + 60 * bp, COL.cyan, (0.25 + 0.4 * bp) * prog(t, c.modeled, c.bell));
    });

    /* D: a detector checks a cursor path against a model */
    const gD = tw(t, c.detector - 0.4, c.detector - 0.1) * (1 - tw(t, c.twentyFour - 0.9, c.twentyFour - 0.4));
    withAlpha(ctx, gD, () => {
      polyline(ctx, HAND, COL.cyan, 7, prog(t, c.detector, c.checks + 0.3));
      polyline(ctx, MODEL, COL.violet, 4, prog(t, c.model - 0.3, c.model + 0.4), 0.95, [14, 12]);
      const sx = lerp(GX, GX + 780, prog(t, c.detector, c.checks + 0.6));
      line(ctx, sx, 720, sx, 1040, rgba(COL.cyan, 0.7), 3);
      glow(ctx, sx, 880, 120, COL.cyan, 0.4 * prog(t, c.detector, c.checks));
      riseText(ctx, 'DETECTOR', 540, 700, prog(t, c.detector - 0.1, c.detector + 0.2), { size: 44, weight: 900, family: F.disp, color: COL.white, align: 'center' });
      riseText(ctx, 'MODEL OF HUMAN MOVEMENT', 540, 1000, prog(t, c.model, c.model + 0.3), { size: 30, weight: 800, family: F.mono, color: COL.violet, align: 'center', ls: 2 });
      caveat(ctx, 'BECAPTCHA-MOUSE, 2020', 540, 1110, prog(t, c.published, c.published + 0.3), COL.white);
      caveat(ctx, 'TRAINED ON PUZZLE DRAGS', 540, 1180, prog(t, c.model + 0.4, c.model + 0.8), COL.coral);
    });

    /* E: reCAPTCHA version two, the 2024 comparison: any movement cut the puzzles */
    const gE = tw(t, c.twentyFour - 0.7, c.twentyFour - 0.2) * (1 - tw(t, c.straight - 0.9, c.straight - 0.4));
    withAlpha(ctx, gE, () => {
      riseText(ctx, 'RECAPTCHA VERSION TWO', 540, 470, prog(t, c.study - 0.2, c.study + 0.3), { size: 50, weight: 900, family: F.disp, color: COL.white, align: 'center' });
      riseText(ctx, 'NO MOVEMENT', 300, 556, prog(t, c.twentyFour, c.twentyFour + 0.3), { size: 28, weight: 800, family: F.mono, color: COL.coral, align: 'center', ls: 2 });
      riseText(ctx, 'ANY MOVEMENT', 780, 556, prog(t, c.any, c.any + 0.3), { size: 28, weight: 800, family: F.mono, color: COL.cyan, align: 'center', ls: 2 });
      for (let k = 0; k < 6; k++) {
        const col = k % 2, row = Math.floor(k / 2);
        puzzleIcon(ctx, 240 + col * 120, 650 + row * 120, 100, tw(t, c.study + 0.2 + k * 0.08, c.study + 0.5 + k * 0.08), COL.coral);
      }
      for (let k = 0; k < 3; k++) puzzleIcon(ctx, 780, 650 + k * 120, 100, tw(t, c.any + 0.1 + k * 0.1, c.any + 0.4 + k * 0.1), COL.cyan);
      const ap = prog(t, c.cut - 0.3, c.cut + 0.2);
      line(ctx, 440, 770, 440 + 150 * ap, 770, rgba(COL.white, 0.85), 5);
      if (ap > 0.9) arrowHead(ctx, 600, 770, 0, 22, COL.white, clamp((ap - 0.9) * 10));
      riseText(ctx, 'CUT', 520, 720, prog(t, c.cut, c.cut + 0.3), { size: 26, weight: 800, family: F.mono, color: COL.white, align: 'center', ls: 2 });
      riseText(ctx, 'MORE PUZZLES', 300, 1040, prog(t, c.puzzles, c.puzzles + 0.3), { size: 26, weight: 800, family: F.mono, color: COL.coral, align: 'center', ls: 2 });
      riseText(ctx, 'FEWER PUZZLES', 780, 1040, prog(t, c.cut + 0.2, c.cut + 0.5), { size: 26, weight: 800, family: F.mono, color: COL.mint, align: 'center', ls: 2 });
      caveat(ctx, 'ILLUSTRATIVE, NOT TO SCALE', 540, 1130, prog(t, c.needed, c.needed + 0.3), COL.dim);
    });

    /* F: straight and curved paths: not significantly different */
    const gF = tw(t, c.straight - 0.5, c.straight - 0.1) * (1 - tw(t, c.so - 0.8, c.so - 0.3));
    withAlpha(ctx, gF, () => {
      polyline(ctx, STRAIGHT, COL.coral, 8, prog(t, c.straight, c.straight + 0.5));
      polyline(ctx, CURVE, COL.cyan, 8, prog(t, c.curved - 0.4, c.curved + 0.4));
      ring(ctx, 860, 790, 42, COL.white, 4, prog(t, c.curved + 0.2, c.curved + 0.5));
      riseText(ctx, 'STRAIGHT', 170, 560, prog(t, c.straight, c.straight + 0.3), { size: 28, weight: 800, family: F.mono, color: COL.coral, align: 'left', ls: 2 });
      riseText(ctx, 'CURVED', 170, 1050, prog(t, c.curved, c.curved + 0.3), { size: 28, weight: 800, family: F.mono, color: COL.cyan, align: 'left', ls: 2 });
      riseText(ctx, 'NOT SIGNIFICANTLY DIFFERENT', 540, 1130, prog(t, c.significantly, c.significantly + 0.3), { size: 32, weight: 800, family: F.mono, color: COL.white, align: 'center', ls: 2 });
      riseText(ctx, 'p = 0.57', 540, 1190, prog(t, c.different, c.different + 0.3), { size: 30, weight: 800, family: F.mono, color: COL.amber, align: 'center', ls: 2 });
    });

    /* G: so is it the wobble? Google doesn't say */
    const gG = tw(t, c.so - 0.2, c.so + 0.4);
    withAlpha(ctx, gG, () => {
      polyline(ctx, handPath(150, 800, 930, 800, { bend: 0.2, wob: 30, n: 220 }), COL.cyan, 4, prog(t, c.so, c.so + 0.8), 0.45);
      glow(ctx, 540, 660, 260, COL.cyan, 0.3);
      text(ctx, '?', 540, 690, { size: 320, weight: 900, family: F.disp, color: COL.cyan, align: 'center', base: 'middle' });
      riseText(ctx, 'WOBBLE', 540, 1080, prog(t, c.wobble - 0.1, c.wobble + 0.3), { size: 84, weight: 900, family: F.disp, color: COL.white, align: 'center' });
      pill(ctx, "GOOGLE DOESN'T SAY", 540, 1180, { bg: rgba(COL.coral, 0.22), color: COL.white, size: 30, stroke: rgba(COL.coral, 0.9), alpha: prog(t, c.doesnt, c.doesnt + 0.35) });
    });
  }, { type: 'fade' });
});
