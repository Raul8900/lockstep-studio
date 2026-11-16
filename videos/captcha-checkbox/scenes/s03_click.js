'use strict';
/* Scene 3 — THE TAP
   "The click feels like the test. It's really a request for a verdict. The evidence was gathered around it.
   If it looks human, you pass. If it can't tell, you get a puzzle."

   A: the box is tapped; the test is the big ring around it, and the click sends a request to a verdict.
   B: violet evidence dots gather round the box while the verdict waits.
   C: the verdict splits into PASS (a mint tick) and PUZZLE (coral pieces).                                  */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    click: at('click', 'click'),
    test: at('click', 'test'),
    request: at('click', 'request'),
    verdict: at('click', 'verdict'),
    evidence: at('click', 'evidence'),
    around: at('click', 'around'),
    human: at('click', 'human'),
    pass: at('click', 'pass'),
    tell: at('click', 'tell'),
    puzzle: at('click', 'puzzle'),
  };
  const BX = 540, BY = 640, BS = 230;
  const NODE = { x: 540, y: 1000, r: 60 };
  const LEFT = { x: 300, y: 1120 }, RIGHT = { x: 780, y: 1120 };
  const N_EV = 14;
  const APP = handPath(830, 1010, BX + 14, BY + 14, { bend: 0.18, wob: 6 });
  const APP_L = polyLen(APP);

  sfx(c.click, 'lock', 0.9);
  sfx(c.test, 'whoosh', 0.5);
  sfx(c.request, 'zip', 0.5);
  sfx(c.verdict, 'chime', 0.5);
  for (let k = 0; k < N_EV; k++) sfx(c.evidence + 0.02 + k * 0.035, 'tick', 0.3);
  sfx(c.human, 'chime', 0.6);
  sfx(c.pass, 'lock', 0.7);
  sfx(c.tell, 'deny', 0.7);
  sfx(c.puzzle, 'stamp', 0.6);

  addScene('click', function (ctx, t) {
    /* A: the tap, the test and the request */
    const gB = 1 - tw(t, c.evidence - 0.1, c.evidence + 0.4);            // the big ring leaves as the evidence arrives
    const cp = polyAt(APP, tw(t, c.click - 0.95, c.click - 0.12, E.out3) * APP_L);
    withAlpha(ctx, gB, () => {
      ring(ctx, BX, BY, 270 * tw(t, c.test - 0.1, c.test + 0.5, E.out3), COL.lineHi, 3, 0.9);
      tag(ctx, 'THE TEST', 760, 430, { align: 'center', color: COL.dim, alpha: prog(t, c.test, c.test + 0.3) });
    });
    const rk = prog(t, c.click, c.click + 0.5);
    if (rk > 0 && rk < 1) ring(ctx, BX, BY, 40 + 110 * E.out3(rk), COL.cyan, 6 * (1 - rk) + 1, (1 - rk) * 0.9);
    drawBox(ctx, BX, BY, BS, { hot: prog(t, c.click, c.click + 0.4) });
    if (t < c.click + 0.1) drawCursor(ctx, cp[0], cp[1], 1.3);
    const rq = prog(t, c.request, c.request + 0.5);
    line(ctx, BX, BY + BS / 2 + 14, BX, BY + BS / 2 + 14 + (NODE.y - NODE.r - (BY + BS / 2 + 14)) * rq, rgba(COL.cyan, 0.85), 4);
    if (rq > 0.95) arrowHead(ctx, BX, NODE.y - NODE.r - 2, Math.PI / 2, 20, COL.cyan, clamp((rq - 0.95) * 20));
    const np = prog(t, c.request + 0.3, c.request + 0.6);
    ring(ctx, NODE.x, NODE.y, NODE.r + 6 * pulse(t, c.verdict, 0.08, 0.5), COL.cyan, 4, np);
    text(ctx, '?', NODE.x, NODE.y + 2, { size: 60, weight: 900, family: F.disp, color: COL.cyan, align: 'center', base: 'middle', alpha: np });
    riseText(ctx, 'VERDICT', 540, 1090, prog(t, c.verdict - 0.1, c.verdict + 0.3), { size: 28, weight: 800, family: F.mono, color: COL.cyan, align: 'center', ls: 3 });

    /* B: evidence gathers round the box, then leaves as the verdict is decided */
    const gEv = 1 - tw(t, c.human - 0.5, c.human - 0.1);
    withAlpha(ctx, gEv, () => {
      for (let k = 0; k < N_EV; k++) {
        const q = tw(t, c.evidence + 0.02 + k * 0.035, c.around + 0.02 + k * 0.035, E.io3);
        if (q <= 0) continue;
        const ang = (k * TAU) / N_EV + 0.3 + t * 0.12;
        const r = lerp(430, 200, q);
        dot(ctx, BX + Math.cos(ang) * r, BY + Math.sin(ang) * r, 9 + 3 * hash(k), COL.violet, clamp(q * 2));
      }
      riseText(ctx, 'EVIDENCE', 540, 1180, prog(t, c.evidence, c.evidence + 0.3), { size: 28, weight: 800, family: F.mono, color: COL.violet, align: 'center', ls: 3 });
    });

    /* C: the verdict splits */
    const lp = prog(t, c.human - 0.3, c.human + 0.1);
    const rp = prog(t, c.tell - 0.4, c.tell - 0.05);
    line(ctx, NODE.x, NODE.y, NODE.x + (LEFT.x - NODE.x) * lp, NODE.y + (LEFT.y - NODE.y) * lp, rgba(COL.mint, 0.85), 4);
    line(ctx, NODE.x, NODE.y, NODE.x + (RIGHT.x - NODE.x) * rp, NODE.y + (RIGHT.y - NODE.y) * rp, rgba(COL.coral, 0.85), 4);
    const pass = prog(t, c.human, c.pass + 0.2);
    ring(ctx, LEFT.x, LEFT.y, 62, COL.mint, 4, pass);
    check(ctx, LEFT.x, LEFT.y, 86, COL.mint, prog(t, c.pass, c.pass + 0.35), 12);
    riseText(ctx, 'PASS', LEFT.x, 1200, prog(t, c.pass, c.pass + 0.3), { size: 30, weight: 800, family: F.mono, color: COL.mint, align: 'center', ls: 3 });
    puzzleIcon(ctx, RIGHT.x, RIGHT.y, 130, tw(t, c.tell - 0.1, c.tell + 0.3), COL.coral);
    riseText(ctx, 'PUZZLE', RIGHT.x, 1200, prog(t, c.puzzle, c.puzzle + 0.3), { size: 30, weight: 800, family: F.mono, color: COL.coral, align: 'center', ls: 3 });
  }, { type: 'zoomOut', fx: 540, fy: 1000, z: 0.45 });
});
