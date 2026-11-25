'use strict';
/* WIND — "On November seventh, four months after it opened, a steady wind of about forty miles an
   hour began to blow." Low over the water, looking up; the streaks thicken. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { nov: at('wind', 'november'), forty: at('wind', 'forty'), blow: at('wind', 'blow'), end: beatOf('twist').t0 - 0.5 };
  const world = bridgeWorld();
  sfx(c.nov - 0.3, 'whoosh', 0.5);
  sfx(c.forty, 'impact', 0.55);
  sfx(c.blow - 0.6, 'riser', 0.4);
  addScene('wind', function (ctx, t) {
    view3d(ctx, world, t, camPath(t, [[beatOf('wind').t0 - 0.5, { from: [2.5, 0.7, 10], to: [0, 3.4, 0], fov: 42 }], [c.end, { from: [6.5, 1.0, 7.5], to: [1, 3.0, 0], fov: 40 }]], { ease: E.lin }));
    nameTag(ctx, 'November 7, 1940', 'four months after opening', 80, 470, { p: tw(t, c.nov - 0.1, c.nov + 0.5, E.lin) * (1 - tw(t, c.forty - 0.4, c.forty)) });
    bigNumber(ctx, 40, CX, 620, { p: tw(t, c.forty - 0.05, c.forty + 0.8, E.lin), suffix: ' mph', label: 'a steady wind', size: 220 });
  });
});
