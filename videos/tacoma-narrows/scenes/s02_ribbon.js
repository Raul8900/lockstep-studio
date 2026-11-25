'use strict';
/* RIBBON — "Its main span was over half a mile long, but its deck was only eight feet deep. In the
   wind, it rippled like a ribbon." A track along the span; then the thin edge of the deck. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { span: at('ribbon', 'span'), long: at('ribbon', 'long'), deck: at('ribbon', 'deck'), eight: at('ribbon', 'eight'),
    wind: at('ribbon', 'wind'), ribbon: at('ribbon', 'ribbon'), end: beatOf('wind').t0 - 0.5 };
  const world = bridgeWorld();
  sfx(c.span, 'slide', 0.4);
  sfx(c.deck - 0.25, 'whoosh', 0.45);
  sfx(c.eight, 'thump', 0.6);
  sfx(c.wind, 'swell', 0.45);
  addScene('ribbon', function (ctx, t) {
    shots(ctx, t, [
      { at: 0, draw: (ctx, t) => {
        const x = lerp(-9, 8.5, tw(t, beatOf('ribbon').t0 - 0.5, c.deck - 0.2, E.lin));
        view3d(ctx, world, t, { from: [x - 1.5, 4.2, 9.5], to: [x, 3.2, 0], fov: 40 });
        withAlpha(ctx, 1 - tw(t, c.deck - 0.4, c.deck - 0.2), () =>
          bigNumber(ctx, 2800, CX, 520, { p: tw(t, c.span - 0.05, c.long + 0.2, E.lin), suffix: ' ft', label: 'main span', size: 200 }));
      } },
      { at: c.deck - 0.2, cut: 'flash', draw: (ctx, t) => {
        view3d(ctx, world, t, camPath(t, [[c.deck - 0.2, { from: [-1.2, 2.25, 3.6], to: [-4.2, 2.0, 0], fov: 30 }],
          [c.wind - 0.3, { from: [-1.8, 2.3, 4.2], to: [-4.6, 2.0, 0], fov: 30 }], [c.end, { from: [-12.5, 3.6, 3.8], to: [0, 2.2, 0], fov: 36 }]]));
        withAlpha(ctx, 1 - tw(t, c.wind - 0.4, c.wind), () =>
          bigNumber(ctx, 8, CX, 560, { p: tw(t, c.eight - 0.05, c.eight + 0.5, E.lin), suffix: ' ft', label: 'deep', size: 220, color: 'accent', labelColor: 'accent' }));
      } },
    ], { end: c.end });
  });
});
