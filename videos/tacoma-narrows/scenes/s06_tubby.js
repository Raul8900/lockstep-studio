'use strict';
/* TUBBY — "One man fled his car on the bridge, with his daughter's dog, Tubby, still inside."
   Back in the world: the abandoned car rolling with the deck. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { car: at('tubby', 'car'), dog: at('tubby', 'dog'), tubby: at('tubby', 'tubby'), start: beatOf('tubby').t0 - 0.5, end: beatOf('fall').t0 - 0.5 };
  const world = bridgeWorld();
  sfx(c.start, 'whoosh', 0.45);
  sfx(c.tubby, 'blip', 0.55);
  addScene('tubby', function (ctx, t) {
    const v = view3d(ctx, world, t, camPath(t, [[c.start, { from: [8.4, 4.2, 5.4], to: [3.6, 2.2, 0.2], fov: 34 }], [c.end, { from: [7.0, 3.4, 4.2], to: [3.6, 2.1, 0.2], fov: 32 }]], { ease: E.lin }));
    if (v) {
      const d = deckAt(carX(t), t), [x, y] = v.project([carX(t), d.y + 0.3, 0.2 * Math.cos(d.th)]);
      pointer(ctx, x, y, clamp(x - 140, 420, 900), 560, 'TUBBY', { p: tw(t, c.tubby - 0.1, c.tubby + 0.5, E.lin), color: 'accent', size: 52, t });
    }
  });
});
