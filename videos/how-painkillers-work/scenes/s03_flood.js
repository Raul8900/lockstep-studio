'use strict';
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  // THE FLOOD: the tablet dissolves into the blood, the molecules ride one loop round the
  // whole body, their level peaks, and every organ on the route lights up in turn.
  const c = {
    pill: at('flood', 'pill'),
    dissolves: at('flood', 'dissolves'),
    blood1: at('flood', 'blood'),
    its: at('flood', 'its'),
    peaks: at('flood', 'peaks'),
    hours: at('flood', 'hours'),
    sticks: at('flood', 'sticks'),
    proteins: at('flood', 'proteins'),
    so: at('flood', 'so'),
    blood3: at('flood', 'blood', 3),
    reaches: at('flood', 'reaches'),
    every: at('flood', 'every'),
    organ: at('flood', 'organ'),
  };
  const pillH = glyph('pill', 'subject');
  const P0 = [800, 586];
  const N = 16;
  const RATE = 0.035;

  sfx(c.pill, 'pop', 0.5);
  sfx(c.dissolves, 'splash', 0.6);
  sfx(c.its, 'tick', 0.5);
  sfx(c.peaks, 'blip', 0.6);
  sfx(c.sticks, 'stamp', 0.4);
  sfx(c.blood3, 'thump', 0.5);
  sfx(c.reaches, 'thump', 0.5);
  sfx(c.every, 'thump', 0.5);
  sfx(c.organ, 'thump', 0.6);

  addScene('flood', anatScene('flood', function (ctx, t) {
    const A = ANAT_AT.ankle;
    const dis = 1 - prog(t, c.dissolves - 0.05, c.dissolves + 0.3);
    const band = 0.16 * tw(t, c.so, c.so + 0.4);

    anatRoute(ctx, 0.45 + 0.4 * tw(t, c.blood1, c.blood1 + 0.4), band);
    anatBody(ctx, 1, 0.95);
    anatGlow(ctx, A.x, A.y, 80, 0.1);
    anatStomach(ctx, 0.85, COL.data, 3.4);
    anatKidneys(ctx, 0.85, COL.data, 3.2);

    if (dis > 0.01) {
      drawGlyph(ctx, pillH, P0[0], P0[1], 120 * (0.4 + 0.6 * dis), { alpha: dis });
    }

    for (let k = 0; k < N; k++) {
      const a = prog(t, c.blood1 + k * 0.02, c.blood1 + 0.35 + k * 0.02);
      if (a <= 0) continue;
      const q = anatOnLoop(k / N + RATE * Math.max(0, t - c.blood1));
      dot(ctx, lerp(P0[0], q[0], a), lerp(P0[1], q[1], a), 7, COL.subject, a);
      const sp = prog(t, c.sticks + k * 0.03, c.proteins + k * 0.03);
      if (sp > 0 && k % 3 === 0) {
        ring(ctx, q[0], q[1], 15, COL.data, 2.4, sp);
      }
    }

    const organs = [
      { p: ANAT_AT.stomach, k: c.blood3 },
      { p: ANAT_AT.kidneyL, k: c.reaches },
      { p: ANAT_AT.kidneyR, k: c.reaches },
      { p: ANAT_AT.head, k: c.every },
      { p: ANAT_AT.ankle, k: c.organ },
    ];
    organs.forEach(function (o) {
      const pl = pulse(t, o.k, 0.1, 0.55);
      if (pl > 0.01) ring(ctx, o.p.x, o.p.y, 22 + 34 * pl, COL.data, 3, pl);
    });

    const chart = tw(t, c.its, c.hours + 0.1);
    if (chart > 0) {
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const u = i / 40;
        pts.push([90 + 180 * u, 600 - 110 * Math.exp(-Math.pow((u - 0.5) / 0.25, 2))]);
      }
      line(ctx, 90, 600, 270, 600, COL.dim, 2, chart);
      polyline(ctx, pts, COL.accent, 4, chart, 1);
      dot(ctx, 180, 490, 7, COL.accent, tw(t, c.peaks, c.peaks + 0.3));
      text(ctx, '1–2 HOURS', 180, 462, {
        size: 28, weight: 700, family: F.mono, color: COL.accent, align: 'center',
        alpha: tw(t, c.peaks, c.hours + 0.2)
      });
    }

    tag(ctx, 'THE FLOOD', 90, 400, { align: 'left', color: COL.accent, size: 26 });
  }), { type: 'zoomOut', fx: ANAT_AT.ankle.x, fy: ANAT_AT.ankle.y });
});
