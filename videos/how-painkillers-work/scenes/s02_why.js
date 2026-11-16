'use strict';
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  // WHY IT SEEMS TRUE: the ankle improves, and the imagined route from the tablet draws itself.
  const c = {
    swallow: at('why', 'swallow'),
    feels: at('why', 'feels'),
    better: at('why', 'better'),
    pill: at('why', 'pill'),
    there: at('why', 'there', 1, 't1'),
  };
  const pillH = art('pill', { treat: 'tint', colors: ['subject'] });
  const A = ANAT_AT.ankle;
  const P0 = [800, 586];
  const ROUTE = anatCurve(P0, [720, 760], [A.x, A.y], 60);
  const ROUTE_LEN = polyLen(ROUTE);

  sfx(c.swallow, 'pop', 0.6);
  sfx(c.pill, 'whoosh', 0.45);
  sfx(c.feels, 'chime', 0.6);

  addScene('why', function (ctx, t) {
    const pop = prog(t, c.swallow - 0.1, c.swallow + 0.3);
    const draw = tw(t, c.pill - 0.5, c.there, E.io3);
    const ok = tw(t, c.feels - 0.1, c.better + 0.25, E.outBack);
    const R = 50 + 3 * Math.sin(t * 5);

    anatRoute(ctx, 0.2, 0);
    anatBody(ctx, 1, 0.95);
    ring(ctx, A.x, A.y, R, COL.ink, 3, 1);
    line(ctx, A.x - R - 18, A.y, A.x - R + 10, A.y, COL.ink, 3, 1);
    line(ctx, A.x + R - 10, A.y, A.x + R + 18, A.y, COL.ink, 3, 1);
    line(ctx, A.x, A.y - R - 18, A.x, A.y - R + 10, COL.ink, 3, 1);
    line(ctx, A.x, A.y + R - 10, A.x, A.y + R + 18, COL.ink, 3, 1);

    polyline(ctx, ROUTE, COL.subject, 3.5, draw, 0.9, [10, 9]);
    const pp = polyAt(ROUTE, draw * ROUTE_LEN);
    drawArt(ctx, pillH, pp[0], pp[1], 120, { p: pop });
    check(ctx, A.x + 84, A.y - 70, 66, COL.good, ok, 9);

    tag(ctx, 'WHY IT SEEMS TRUE', 90, 400, { align: 'left', color: COL.accent, size: 26 });
  }, { type: 'slideLeft' });
});
