'use strict';
/* TWIST — the mechanism, given time. "Then the motion changed. The bounce turned into a twist. As the
   deck tilted, the wind caught it at an angle and pushed it further. Every twist fed the next one.
   The wind was pumping energy in faster than the bridge could lose it."
   Along the deck as it starts to twist; then the deck end-on in the wind, the push drawn as an
   arrow and the energy filling a ring; then the whole bridge writhing. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { changed: at('twist', 'changed'), twist: at('twist', 'twist'), as: at('twist', 'as'), tilted: at('twist', 'tilted'),
    angle: at('twist', 'angle'), pushed: at('twist', 'pushed'), every: at('twist', 'every'), energy: at('twist', 'energy'),
    faster: at('twist', 'faster'), lose: at('twist', 'lose'), end: beatOf('film').t0 - 0.5 };
  const world = bridgeWorld(), section = sectionWorld();
  sfx(c.twist, 'rip', 0.4);
  sfx(c.as - 0.3, 'whoosh', 0.5);
  sfx(c.pushed, 'thump', 0.5);
  sfx(c.every, 'tick', 0.4); sfx(c.every + 0.65, 'tick', 0.45); sfx(c.every + 1.3, 'tick', 0.5);
  sfx(c.energy - 0.6, 'riser', 0.5);
  sfx(c.faster + 0.5, 'whoosh', 0.55);
  addScene('twist', function (ctx, t) {
    shots(ctx, t, [
      { at: 0, draw: (ctx, t) => view3d(ctx, world, t, camPath(t, [[beatOf('twist').t0 - 0.5, { from: [12.5, 4.4, 0], to: [-2, 2.1, 0], fov: 36 }], [c.as, { from: [11.2, 4.1, 0], to: [-2, 2.0, 0], fov: 38 }]], { ease: E.lin })) },
      { at: c.as - 0.3, cut: 'flash', draw: (ctx, t) => {
        view3d(ctx, section, t, camPath(t, [[c.as - 0.3, { from: [6.6, 2.1, 0.6], to: [0, 1.75, 0], fov: 40 }], [c.faster, { from: [5.6, 2.4, -1.2], to: [0, 1.7, 0], fov: 40 }]], { ease: E.lin }));
        ringGauge(ctx, CX, 470, 150, tw(t, c.every - 0.2, c.lose, E.in2) * 0.95, { p: tw(t, c.every - 0.3, c.every + 0.4, E.lin), color: 'accent', label: 'energy in', show: (k) => numText(Math.round(k * 100), { suffix: '%' }), ticks: 40 });
      } },
      { at: c.faster + 0.5, cut: 'flash', draw: (ctx, t) => view3d(ctx, world, t, camPath(t, [[c.faster + 0.5, { from: [7.4, 3.4, 4.8], to: [4, 2.1, 0], fov: 40 }], [c.end, { from: [6.4, 3.0, 4.2], to: [4, 2.1, 0], fov: 38 }]]), { shake: null }) },
    ], { end: c.end });
  });
});
