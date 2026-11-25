'use strict';
/* MYTH — "For decades, textbooks blamed resonance, the wind matching the bridge's rhythm. It wasn't.
   The bridge made its own rhythm, and the wind kept feeding it."
   The section again: first the textbook picture (wind in gusts, in time with the swing), crossed
   out; then the truth: a steady wind, and the swing still growing from it. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { resonance: at('myth', 'resonance'), rhythm: at('myth', 'rhythm'), wasnt: at('myth', "wasn't"), own: at('myth', 'own'),
    feeding: at('myth', 'feeding'), start: beatOf('myth').t0 - 0.5, end: beatOf('lesson').t0 - 0.5 };
  const section = sectionWorld();
  sfx(c.start, 'whoosh', 0.45);
  sfx(c.resonance, 'stamp', 0.6);
  sfx(c.wasnt, 'deny', 0.8);
  addScene('myth', function (ctx, t) {
    view3d(ctx, section, t, camPath(t, [[c.start, { from: [4.8, 3.2, 4.2], to: [0, 1.7, 0], fov: 40 }], [c.end, { from: [6.4, 2.3, -1.5], to: [0, 1.7, 0], fov: 40 }]], { ease: E.lin }));
    const k = tw(t, c.resonance - 0.05, c.resonance + 0.5, E.lin);
    stamp(ctx, 'RESONANCE', CX, 470, { p: k, color: 'data', size: 92, angle: -0.06 });
    const s = tw(t, c.wasnt - 0.05, c.wasnt + 0.35, E.out3);
    if (s > 0) withAlpha(ctx, 1, () => polyline(ctx, [[CX - 330, 520], [CX + 330, 420]], COL.alert, 16, s));
    nameTag(ctx, 'The real cause: flutter', 'the swing feeds itself from a steady wind', 80, 1040, { p: tw(t, c.own - 0.1, c.own + 0.5, E.lin) });
  });
});
