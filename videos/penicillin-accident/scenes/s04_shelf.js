'use strict';
/* Scene 4 — SHELF: "Fleming called it penicillin. But he could barely make any, and for ten
   years, almost nobody paid attention."
   Fleming (cut out of his photograph) stands in front of the first page of his 1929 paper; the
   camera drifts down the page while he stays put — parallax. Ten years count up; IGNORED lands.  */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { fleming: at('shelf', 'fleming'), pen: at('shelf', 'penicillin'), barely: at('shelf', 'barely'), ten: at('shelf', 'ten'),
    years: at('shelf', 'years'), nobody: at('shelf', 'nobody'), end: at('shelf', 'attention', 1, 't1') };
  const paper = useImage('paper-1929');                       // first page, British Journal of Experimental Pathology, 1929 — CC BY 4.0
  const fleming = useImage('fleming-dish', { cutout: true }); // cut out with lockstep cutout

  sfx(c.fleming - 0.3, 'whoosh', 0.5);
  sfx(c.pen, 'chime', 0.45);
  sfx(c.ten, 'count', 0.5);
  sfx(c.nobody, 'stamp', 0.9);

  addScene('shelf', function (ctx, t) {
    const s0 = at('shelf', 'fleming') - 0.5;
    const pic = photoPath(ctx, paper, t, [[s0, { z: 1.9, x: 0.5, y: 0.17 }], [c.pen + 0.3, { z: 2.2, x: 0.5, y: 0.19 }], [c.end + 0.6, { z: 1.25, x: 0.5, y: 0.45 }]]);
    if (pic) {
      const k = tw(t, c.pen - 0.1, c.pen + 0.4, E.lin) * (1 - tw(t, c.barely - 0.2, c.barely + 0.2));
      if (k > 0) { const [x, y] = pic.at(0.5, 0.183); ctx.save(); ctx.globalAlpha = 0.3 * k; ctx.fillStyle = COL.accent; ctx.fillRect(x - 0.36 * pic.w * k, y - 0.012 * pic.h, 0.72 * pic.w * k, 0.03 * pic.h); ctx.restore(); }
    }
    spotlight(ctx, 330, 1300, 420, { p: tw(t, c.barely - 0.3, c.barely + 0.3, E.lin), dark: 0.35 });
    cutout(ctx, fleming, tw(t, s0, c.end + 0.6, E.lin), { x: 330, y: 1960, h: 1250, depth: 1.8, drift: [-60, 0], in: tw(t, c.barely - 0.4, c.barely + 0.2, E.lin) });
    withAlpha(ctx, 1 - tw(t, c.nobody - 0.2, c.nobody + 0.1), () =>
      bigNumber(ctx, 10, 770, 540, { p: tw(t, c.ten - 0.05, c.ten + 0.5, E.lin), label: 'years', size: 230, color: 'alert', labelColor: 'alert' }));
    stamp(ctx, 'IGNORED', 720, 560, { p: tw(t, c.nobody - 0.02, c.nobody + 0.6, E.lin), size: 110, t });
  });
});
