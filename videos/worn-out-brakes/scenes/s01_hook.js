'use strict';
/* HOOK — "To certify a new jet, Boeing grinds its brakes down until they're worn out. Then it tries
   to stop the plane with them."
   A carbon brake stack on a bench, a cutting wheel throwing sparks across it, the gauge of brake
   left draining to 2%; then the jet waiting at the end of a night runway. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { grinds: at('hook', 'grinds'), worn: at('hook', 'worn'), then: at('hook', 'then'), stop: at('hook', 'stop'), plane: at('hook', 'plane') };
  brakeWorld();
  const aw = airfieldWorld();
  sfx(0, 'rip', 0.45);
  sfx(c.grinds - 0.05, 'rip', 0.5);
  sfx(c.worn, 'stamp', 0.6);
  sfx(c.then - 0.2, 'whoosh', 0.5);
  sfx(c.plane, 'thump', 0.45);
  addScene('hook', function (ctx, t) {
    shots(ctx, t, [
      { at: 0, draw: (ctx, t) => hookBench(ctx, t) },
      { at: c.then - 0.15, cut: 'flash', draw: (ctx, t) => {
        view3d(ctx, aw, t, camPath(t, [[c.then - 0.15, { from: [78, 10.5, -40], to: [-2.5, 1.5, -2.6], fov: 38 }],
          [beatOf('normal').t0, { from: [68, 8, -33], to: [-2.5, 1.6, -2.6], fov: 38 }]], { ease: E.lin }));
      } },
    ], { end: beatOf('normal').t0 - 0.5 });
  });
});
