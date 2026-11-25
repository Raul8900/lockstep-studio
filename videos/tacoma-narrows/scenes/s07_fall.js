'use strict';
/* FALL — "Around eleven, the deck tore loose and fell into the water." The real film again: the
   centre span dropping into the Narrows, timed so the splash lands on "fell". */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { fell: at('fall', 'fell'), start: beatOf('fall').t0 - 0.5 };
  const from = 110.5 - (c.fell - c.start);                   // the splash, 1:50.5 into the film, lands on "fell"
  const reel = useVideo('collapse-1940', { from, to: from + 9, fit: 'contain' });
  sfx(c.fell - 0.05, 'impact', 1.0);
  sfx(c.fell + 0.05, 'splash', 0.8);
  addScene('fall', function (ctx, t) {
    film(ctx, reel, t - c.start, { dur: 3.7, push: 0.08, y: 800, shake: shake(t, c.fell, 12, 0.6) });
  });
});
