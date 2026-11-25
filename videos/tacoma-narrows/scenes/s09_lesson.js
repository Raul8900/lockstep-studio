'use strict';
/* LESSON — "That's why big bridges are now tested in wind tunnels before they're built. So they never
   learn to dance." A streamlined deck sitting still in a wind tunnel; then the bridge, still, from
   the air — the opening shot, calm. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { tested: at('lesson', 'tested'), tunnels: at('lesson', 'tunnels'), so: at('lesson', 'so'), dance: at('lesson', 'dance'), start: beatOf('lesson').t0 - 0.5 };
  const world = bridgeWorld(), section = sectionWorld();
  sfx(c.start, 'whoosh', 0.45);
  sfx(c.tunnels, 'chime', 0.5);
  sfx(c.so - 0.3, 'whoosh', 0.5);
  sfx(c.dance + 0.3, 'swell', 0.5);
  addScene('lesson', function (ctx, t) {
    shots(ctx, t, [
      { at: 0, draw: (ctx, t) => view3d(ctx, section, t, camPath(t, [[c.start, { from: [5.5, 3.6, 5.5], to: [0, 1.7, 0], fov: 40 }], [c.so, { from: [7.2, 2.6, 2.4], to: [0, 1.75, 0], fov: 38 }]], { ease: E.lin })) },
      { at: c.so - 0.3, cut: 'dip', draw: (ctx, t) => view3d(ctx, world, t, camPath(t, [[c.so - 0.3, { from: [9, 5, 10], to: [0, 2.4, 0], fov: 40 }], [DATA.dur, { from: [18, 12, 19], to: [0, 2.6, 0], fov: 40 }]], { ease: E.lin })) },
    ], { end: DATA.dur });
  });
});
