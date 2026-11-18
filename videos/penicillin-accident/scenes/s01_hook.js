'use strict';
/* Scene 1 — HOOK: "In 1928, a scientist came back from holiday to a pile of dirty dishes.
   One of them was about to change the world."
   One photograph, one continuous camera path: the whole lab → Fleming's face → the dishes on his
   bench → the one dish in his hands, punched in on "world".                                   */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { year: at('hook', '1928'), sci: at('hook', 'scientist'), pile: at('hook', 'pile'), dishes: at('hook', 'dishes'),
    one: at('hook', 'one'), world: at('hook', 'world'), end: at('hook', 'world', 1, 't1') };
  const lab = useImage('fleming-colour');            // Fleming at his bench, about 1943 — Imperial War Museum, public domain

  sfx(0, 'swell', 0.6);
  sfx(c.year + 0.6, 'thump', 0.6);
  sfx(c.pile - 0.25, 'whoosh', 0.5);
  sfx(c.one - 0.1, 'blip', 0.5);
  sfx(c.world, 'impact', 0.7);

  addScene('hook', function (ctx, t) {
    withCam(ctx, { zoom: punch(t, c.world, 0.06, 0.6), fx: CX, fy: H / 2 }, () => {
      const pic = photoPath(ctx, lab, t, [
        [0, { z: 1.08, x: 0.46, y: 0.42 }],
        [c.sci + 0.3, { z: 1.7, x: 0.33, y: 0.27 }],
        [c.dishes + 0.2, { z: 1.9, x: 0.66, y: 0.6 }],
        [c.one + 0.35, { z: 2.7, x: 0.63, y: 0.58 }],
        [c.end + 0.6, { z: 3.0, x: 0.63, y: 0.58 }],
      ]);
      if (pic) circleIt(ctx, ...pic.at(0.635, 0.585), 210, 120, { p: tw(t, c.one - 0.05, c.one + 0.55, E.lin), color: 'accent', seed: 4 });
    });
    withAlpha(ctx, 1 - tw(t, c.sci - 0.2, c.sci + 0.1), () =>
      bigNumber(ctx, 1928, CX, 600, { p: tw(t, c.year - 0.05, c.year + 0.8, E.lin), sep: false, count: false, size: 240 }));
    nameTag(ctx, 'Alexander Fleming', "St Mary's Hospital, London", 80, 1020, { p: tw(t, c.sci, c.sci + 0.5, E.lin) * (1 - tw(t, c.pile - 0.2, c.pile + 0.1)) });
  });
});
