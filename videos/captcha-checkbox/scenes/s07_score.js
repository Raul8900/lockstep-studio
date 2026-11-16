'use strict';
/* Scene 7 — THE SCORE
   "Version three has no checkbox at all. It returns a score from zero to one. One means very likely a good
   interaction. Zero means very likely a bot. Each site sets its own cutoff, and Google suggests starting at
   point five. But a score can be pushed. In twenty nineteen, researchers trained an AI agent to move and click
   in a simulator they built. It reached a score of point nine about ninety-seven percent of the time.
   The simulator isn't the live site."

   A: the checkbox goes; a score scale appears. B: the scale, 0 (bot) to 1 (good), the needle sweeps across.
   C: the cutoff, set by each site, starting at 0.5. D: an agent in a simulator. E: about 97%, not the live site. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    version: at('score', 'version'),
    checkbox: at('score', 'checkbox'),
    score: at('score', 'score'),
    zero: at('score', 'zero'),
    one: at('score', 'one'),
    one2: at('score', 'one', 2),
    zero2: at('score', 'zero', 2),
    site: at('score', 'site'),
    point: at('score', '0.5'),
    five: at('score', '0.5'),
    but: at('score', 'but'),
    trained: at('score', 'trained'),
    nineteen: at('score', '2019'),
    agent: at('score', 'agent'),
    built: at('score', 'built'),
    simulator: at('score', 'simulator'),
    reached: at('score', 'reached'),
    point2: at('score', '0.9'),
    nine: at('score', '0.9', 1, 't1'),
    ninety: at('score', '97'),
    isnt: at('score', "isn't"),
  };
  /* the simulator's plane: a tilted grid in 2.5D, and the agent's path across it */
  const P = new Proj({ cx: 540, cy: 900, scale: 1.5, yaw: -0.55, pitch: 1.0 });
  const AP = [[-180, 170], [-120, 110], [-60, 150], [-10, 50], [50, 90], [110, -20], [150, -110]];
  const APS = AP.map((q) => P.pt(q[0], q[1], 0).slice(0, 2));
  const APS_L = polyLen(APS);
  const TGT = P.pt(150, -110, 0);

  sfx(c.version, 'blip', 0.5);
  sfx(c.checkbox, 'deny', 0.7);
  sfx(c.zero, 'tick', 0.4);
  sfx(c.one, 'tick', 0.5);
  sfx(c.site, 'pop', 0.4);
  sfx(c.point, 'impact', 0.5);
  sfx(c.but, 'whoosh', 0.45);
  sfx(c.trained, 'data', 0.35, { dur: 0.6 });
  sfx(c.built, 'lock', 0.6);
  sfx(c.reached, 'riser', 0.4, { dur: 0.6 });
  sfx(c.ninety, 'impact', 0.6);
  sfx(c.isnt, 'deny', 0.5);

  addScene('score', function (ctx, t) {
    ambient(ctx, t);
    /* A: the checkbox is gone; the version is three */
    const boxGate = 1 - tw(t, c.checkbox - 0.3, c.checkbox + 0.3);
    riseText(ctx, 'VERSION 3', 540, 470, prog(t, c.version, c.version + 0.3), { size: 72, weight: 900, family: F.disp, color: COL.amber, align: 'center', alpha: 1 - tw(t, c.but - 0.5, c.but - 0.1) });
    withAlpha(ctx, boxGate, () => drawBox(ctx, 540, 700, 230, { hot: 0 }));
    withAlpha(ctx, 1 - tw(t, c.checkbox + 0.4, c.checkbox + 0.9), () => cross(ctx, 540, 700, 110, COL.coral, prog(t, c.checkbox, c.checkbox + 0.35), 12));
    riseText(ctx, 'NO CHECKBOX', 540, 1010, prog(t, c.checkbox + 0.1, c.checkbox + 0.4), { size: 36, weight: 900, family: F.mono, color: COL.coral, align: 'center', ls: 3, alpha: 1 - tw(t, c.score - 0.7, c.score - 0.3) });

    /* the simulator (D) fades before the scale returns (E) */
    const simGate = tw(t, c.but - 0.4, c.but + 0.1) * (1 - tw(t, c.reached - 0.3, c.reached + 0.05));
    const showScale = Math.max(
      tw(t, c.checkbox + 0.5, c.checkbox + 0.9) * (1 - tw(t, c.but - 0.4, c.but + 0.1)),
      tw(t, c.reached - 0.3, c.reached + 0.2));
    /* the needle: sweeps 0 to 1 while the score is named, then rests; in E it settles at 0.9 */
    const v = t < c.reached ? tw(t, c.score, c.one, E.io3) : 1 - 0.1 * tw(t, c.point2, c.nine, E.io3);
    withAlpha(ctx, showScale, () => {
      const tri = Math.abs(((t / 2.0) % 1) * 2 - 1);                           // a triangle wave: the light never stops changing
      glow(ctx, 540, SCALE.y, 540, COL.cyan, 0.06 + 0.16 * tri);               // the scale's light breathes
      scaleBar(ctx, 1, 1);
      needle(ctx, v, COL.white, 1);
      text(ctx, '0.0', SCALE.x0, SCALE.y - 74, { size: 30, weight: 800, family: F.mono, color: COL.amber, align: 'center', base: 'middle' });
      text(ctx, '1.0', SCALE.x1, SCALE.y - 74, { size: 30, weight: 800, family: F.mono, color: COL.amber, align: 'center', base: 'middle' });
      riseText(ctx, 'BOT', SCALE.x0, SCALE.y + 74, prog(t, c.zero, c.zero + 0.3), { size: 32, weight: 900, family: F.mono, color: COL.coral, align: 'center', ls: 2 });
      riseText(ctx, 'GOOD INTERACTION', 1000, SCALE.y + 74, prog(t, c.one, c.one + 0.3), { size: 32, weight: 900, family: F.mono, color: COL.mint, align: 'right', ls: 2 });
      ring(ctx, SCALE.x1, SCALE.y, 30 + 18 * pulse(t, c.one2, 0.1, 0.5), COL.mint, 4, 0.8 * prog(t, c.one2 - 0.1, c.one2 + 0.1));
      ring(ctx, SCALE.x0, SCALE.y, 30 + 18 * pulse(t, c.zero2, 0.1, 0.5), COL.coral, 4, 0.8 * prog(t, c.zero2 - 0.1, c.zero2 + 0.1));
    });

    /* C: each site sets its own cutoff; Google suggests starting at 0.5 */
    const cutP = prog(t, c.point, c.point + 0.3);
    const showC = tw(t, c.checkbox + 0.5, c.checkbox + 0.9) * (1 - tw(t, c.but - 0.4, c.but + 0.1));
    withAlpha(ctx, showC, () => {
      riseText(ctx, 'EACH SITE SETS ITS OWN', 540, 560, prog(t, c.site, c.site + 0.3), { size: 30, weight: 800, family: F.mono, color: COL.white, align: 'center', ls: 2 });
      const mx = scaleX(0.5);
      line(ctx, mx, SCALE.y - 110, mx, SCALE.y - 110 + 220 * cutP, COL.amber, 5);
      riseText(ctx, 'START 0.5', mx, SCALE.y - 130, prog(t, c.five, c.five + 0.3), { size: 32, weight: 900, family: F.mono, color: COL.amber, align: 'center', ls: 2 });
    });

    /* D: the agent learns to move and click in a simulator */
    withAlpha(ctx, simGate, () => {
      const pc = P.pt(0, 0, 0);
      glow(ctx, pc[0], pc[1], 260, COL.violet, 0.10 + 0.08 * Math.sin(t * 1.4));   // the simulator's light breathes
      for (let i = -200; i <= 200; i += 50) {
        const a = P.pt(i, -200, 0), b = P.pt(i, 200, 0);
        line(ctx, a[0], a[1], b[0], b[1], rgba(COL.violet, 0.35), 2);
        const e = P.pt(-200, i, 0), f = P.pt(200, i, 0);
        line(ctx, e[0], e[1], f[0], f[1], rgba(COL.violet, 0.35), 2);
      }
      const pa = tw(t, c.but, c.built, E.io3);
      polyline(ctx, APS, COL.white, 3, pa, 0.5);
      const ag = polyAt(APS, pa * APS_L);
      glow(ctx, ag[0], ag[1], 60, '#FFFFFF', 0.5);
      dot(ctx, ag[0], ag[1], 11, COL.white);
      riseText(ctx, 'AGENT', ag[0] - 30, ag[1] - 40, prog(t, c.agent, c.agent + 0.3), { size: 26, weight: 800, family: F.mono, color: COL.white, align: 'center', ls: 2 });
      fillRR(ctx, TGT[0] - 22, TGT[1] - 22, 44, 44, 10, rgba(COL.cyan, 0.2 * prog(t, c.built, c.built + 0.3)));
      strokeRR(ctx, TGT[0] - 22, TGT[1] - 22, 44, 44, 10, rgba(COL.cyan, prog(t, c.built, c.built + 0.3)), 3);
      riseText(ctx, 'SIMULATOR', 540, 520, prog(t, c.simulator, c.simulator + 0.3), { size: 34, weight: 900, family: F.mono, color: COL.violet, align: 'center', ls: 3 });
      riseText(ctx, '2019', 540, 470, prog(t, c.nineteen, c.nineteen + 0.3), { size: 60, weight: 900, family: F.disp, color: COL.amber, align: 'center' });
    });

    /* E: about ninety-seven percent, in the simulator, not the live site */
    riseText(ctx, 'ABOUT 97%', 540, 1010, prog(t, c.ninety, c.ninety + 0.3), { size: 150, weight: 900, family: F.disp, color: COL.amber, align: 'center', ls: -2 });
    caveat(ctx, 'SIMULATOR, NOT THE LIVE SITE', 540, 1140, prog(t, c.isnt, c.isnt + 0.3), COL.coral);
  }, { type: 'zoomIn', fx: 540, fy: 860, z: 2.4 });
});
