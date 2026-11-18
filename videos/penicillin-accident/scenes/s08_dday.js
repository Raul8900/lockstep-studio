'use strict';
/* Scene 8 — D-DAY: "By D-Day, there were millions of doses."
   US troops approaching Omaha Beach on 6 June 1944 (US Coast Guard, public domain); the camera
   pushes towards the beach; the line lands as a stamp.                                         */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { dday: at('dday', 'd-day'), millions: at('dday', 'millions'), end: at('dday', 'doses', 1, 't1') };
  const beach = useImage('dday');
  sfx(c.dday - 0.3, 'whoosh', 0.6);
  sfx(c.millions, 'stamp', 0.9);
  addScene('dday', function (ctx, t) {
    photoPath(ctx, beach, t, [[at('dday', 'by') - 0.5, { z: 1.0, x: 0.5, y: 0.6 }], [c.end + 0.6, { z: 1.35, x: 0.5, y: 0.42 }]], { shake: shake(t, c.millions, 8, 0.4) });
    nameTag(ctx, 'D-Day', '6 June 1944', 80, 560, { p: tw(t, c.dday, c.dday + 0.45, E.lin) });
    stamp(ctx, 'MILLIONS OF DOSES', CX, 900, { p: tw(t, c.millions - 0.02, c.millions + 0.6, E.lin), size: 78, color: 'good', angle: -0.07 });
  });
});
