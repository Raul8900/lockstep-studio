'use strict';
/* Scene 2 — PLATE: "A fuzzy mould had landed on it. And all around the mould, the bacteria were dead."
   Fleming lifting a dish, then a culture plate of Penicillium mould (not his plate: no free photo
   of it exists). The bacteria are drawn as dots on the agar, plainly a drawing: on "dead", the
   ones in a ring round the mould go out.                                                       */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { fuzzy: at('plate', 'fuzzy'), mould: at('plate', 'mould'), around: at('plate', 'around'), mould2: at('plate', 'mould', 2),
    bacteria: at('plate', 'bacteria'), dead: at('plate', 'dead'), end: at('plate', 'dead', 1, 't1') };
  const holding = useImage('fleming-dish');         // Fleming with a culture dish — CC BY 4.0 (media/credits.json)
  const plate = useImage('mould-plate');            // Penicillium colonies on agar — CC BY 4.0
  const CTR = [0.545, 0.41];                         // the colony the camera settles on
  /* the bacteria: dots scattered on the agar round the colony (positions in picture units) */
  const r = rng(11), dots = [];
  for (let i = 0; i < 170; i++) {
    const a = r() * TAU, d = 0.07 + Math.sqrt(r()) * 0.15;
    dots.push({ u: CTR[0] + Math.cos(a) * d * 0.84, v: CTR[1] + Math.sin(a) * d, d, k: r() });
  }

  sfx(c.fuzzy - 0.15, 'whoosh', 0.4);
  sfx(c.around - 0.3, 'whoosh', 0.5);
  for (let k = 0; k < 6; k++) sfx(c.bacteria + 0.12 + k * 0.08, 'tick', 0.3, { pitch: 1.2 - k * 0.06 });
  sfx(c.dead, 'thump', 0.7);

  addScene('plate', function (ctx, t) {
    shots(ctx, t, [
      { at: 0, draw: (ctx, t) => photoPath(ctx, holding, t, [[at('plate', 'a') - 0.5, { z: 1.15, x: 0.45, y: 0.45 }], [c.mould + 0.3, { z: 1.45, x: 0.36, y: 0.62 }], [c.around, { z: 1.55, x: 0.35, y: 0.64 }]]) },
      { at: c.around - 0.25, cut: 'flash', draw: (ctx, t) => {
        const pic = photoPath(ctx, plate, t, [[c.around - 0.25, { z: 1.25, x: 0.47, y: 0.47 }], [c.dead + 0.2, { z: 1.6, x: CTR[0], y: CTR[1] }], [c.end + 1, { z: 1.7, x: CTR[0], y: CTR[1] }]]);
        if (!pic) return;
        const show = tw(t, c.bacteria - 0.25, c.bacteria + 0.4, E.lin), die = tw(t, c.dead - 0.15, c.dead + 0.45, E.out3);
        for (const d of dots) {
          const [x, y] = pic.at(d.u, d.v), inner = d.d < 0.13;
          const a = clamp(show * 3 - d.k * 2) * (inner ? 1 - clamp(die * 2 - (0.13 - d.d) * 6) : 1);
          if (a <= 0.01) continue;
          dot(ctx, x, y, 0.0042 * pic.h, rgba(COL.accent, 0.9 * a));
        }
        circleIt(ctx, ...pic.at(CTR[0], CTR[1]), 0.135 * pic.h, 0.135 * pic.h, { p: tw(t, c.dead, c.dead + 0.5, E.lin), color: 'alert', seed: 2 });
      } },
    ], { end: DATA.dur });
  });
});
