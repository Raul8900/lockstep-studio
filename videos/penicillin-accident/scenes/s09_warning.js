'use strict';
/* Scene 9 — WARNING: "Fleming warned that if we misused it, bacteria would learn to resist it. He
   was right. The next miracle might already be growing in someone's dirty dishes."
   A 1944 painting of Fleming, then resistant bacteria under the microscope, then back to the
   photograph of the opening — his bench, his dishes: the callback.                            */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { warned: at('warning', 'warned'), bacteria: at('warning', 'bacteria'), resist: at('warning', 'resist'), right: at('warning', 'right'),
    next: at('warning', 'next'), miracle: at('warning', 'miracle'), growing: at('warning', 'growing'), dishes: at('warning', 'dishes'),
    end: at('warning', 'dishes', 1, 't1') };
  const painting = useImage('fleming-painting');    // Ethel Gabain, Imperial War Museum — public domain
  const mrsa = useImage('mrsa');                    // MRSA, scanning electron micrograph, NIAID — CC BY 2.0
  const lab = useImage('fleming-colour');           // the opening photograph again

  sfx(c.warned - 0.3, 'whoosh', 0.45);
  sfx(c.bacteria - 0.3, 'whoosh', 0.5);
  sfx(c.resist, 'stamp', 0.8);
  sfx(c.next - 0.4, 'riser', 0.45);
  sfx(c.dishes + 0.1, 'chime', 0.6);

  addScene('warning', function (ctx, t) {
    shots(ctx, t, [
      { at: 0, draw: (ctx, t) => photoPath(ctx, painting, t, [[at('warning', 'fleming') - 0.5, { z: 1.1, x: 0.35, y: 0.45 }], [c.bacteria, { z: 1.6, x: 0.3, y: 0.36 }]]) },
      { at: c.bacteria - 0.3, cut: 'flash', draw: (ctx, t) => {
        photoPath(ctx, mrsa, t, [[c.bacteria - 0.3, { z: 1.2, x: 0.5, y: 0.5 }], [c.right + 0.6, { z: 1.7, x: 0.55, y: 0.45 }]], { shake: shake(t, c.resist, 10, 0.4) });
        stamp(ctx, 'RESISTANT', CX, 720, { p: tw(t, c.resist - 0.02, c.resist + 0.6, E.lin), size: 120 });
      } },
      { at: c.next - 0.35, cut: 'dip', draw: (ctx, t) => {
        const pic = photoPath(ctx, lab, t, [[c.next - 0.35, { z: 1.1, x: 0.5, y: 0.5 }], [c.dishes + 0.2, { z: 2.4, x: 0.82, y: 0.7 }], [c.end + 2.5, { z: 2.6, x: 0.82, y: 0.7 }]]);
        if (pic) circleIt(ctx, ...pic.at(0.9, 0.725), 200, 120, { p: tw(t, c.dishes - 0.05, c.dishes + 0.5, E.lin), color: 'accent', seed: 9 });
      } },
    ], { end: DATA.dur });
  });
});
