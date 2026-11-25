'use strict';
/* HOOK — "In 1940, a brand-new bridge in Washington State started to dance. Locals called it
   Galloping Gertie, and people drove across just to feel it bounce."
   The whole bridge from the air, already moving; then down to the deck, a car riding the waves. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { year: at('hook', '1940'), bridge: at('hook', 'bridge'), wa: at('hook', 'washington'), dance: at('hook', 'dance'),
    locals: at('hook', 'locals'), gertie: at('hook', 'gertie'), drove: at('hook', 'drove'), bounce: at('hook', 'bounce') };
  const world = bridgeWorld();
  sfx(0, 'swell', 0.5);
  sfx(c.dance - 0.1, 'whoosh', 0.45);
  sfx(c.locals - 0.25, 'whoosh', 0.5);
  sfx(c.gertie, 'stamp', 0.7);
  addScene('hook', function (ctx, t) {
    shots(ctx, t, [
      { at: 0, draw: (ctx, t) => {
        view3d(ctx, world, t, camPath(t, [[0, { from: [17, 11, 17], to: [0, 2, 0], fov: 40 }], [c.locals, { from: [11.5, 6.5, 12], to: [-1, 2.2, 0], fov: 38 }]], { ease: E.lin }));
        withAlpha(ctx, 1 - tw(t, c.bridge - 0.2, c.bridge + 0.2), () => bigNumber(ctx, 1940, CX, 560, { p: tw(t, c.year - 0.05, c.year + 0.6, E.lin), sep: false, count: false, size: 230 }));
        nameTag(ctx, 'Tacoma Narrows Bridge', 'Washington State', 80, 1040, { p: tw(t, c.wa - 0.2, c.wa + 0.4, E.lin) });
      } },
      { at: c.locals - 0.2, cut: 'flash', draw: (ctx, t) => {
        { const x = carX(t), d = deckAt(x + 1, t);                   // a chase camera riding the deck behind the car
          view3d(ctx, world, t, { from: [x - 2.6, d.y + 0.75, 0.25], to: [x + 3.5, d.y + 0.25, 0.1], fov: 46 }); }
        stamp(ctx, 'GALLOPING GERTIE', CX, 520, { p: tw(t, c.gertie - 0.05, c.gertie + 0.5, E.lin), color: 'accent', size: 74, angle: -0.08 });
      } },
    ], { end: beatOf('ribbon').t0 - 0.5 });
  });
});
