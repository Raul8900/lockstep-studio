'use strict';
/* FILM — "This is real film from that morning." The Tacoma Fire Department's 1940 film (public
   domain): the deck twisting, seen from the shore. Shown whole, as a print. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { real: at('film', 'real'), start: beatOf('film').t0 - 0.5 };
  const reel = useVideo('collapse-1940', { from: 54, to: 61, fit: 'contain' });
  sfx(c.start, 'slide', 0.4);
  addScene('film', function (ctx, t) {
    film(ctx, reel, t - c.start, { dur: 3, push: 0.06, y: 800 });
    nameTag(ctx, 'Tacoma, 7 November 1940', 'film: Tacoma Fire Department', 80, 330, { p: tw(t, c.real - 0.1, c.real + 0.5, E.lin) });
  });
});
