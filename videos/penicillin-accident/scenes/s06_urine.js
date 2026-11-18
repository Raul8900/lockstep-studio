'use strict';
/* Scene 6 — URINE: "They were so desperate, they pulled it back out of his urine to use it again.
   It wasn't enough. He died."
   The extraction flasks of 1943, the camera pushing in; the light closes in on "enough" and the
   frame goes dark on "died". Plain and quiet: no stamp, no flourish.                            */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { desperate: at('urine', 'desperate'), pulled: at('urine', 'pulled'), urine: at('urine', 'urine'), again: at('urine', 'again'),
    enough: at('urine', 'enough'), died: at('urine', 'died'), end: at('urine', 'died', 1, 't1') };
  const flasks = useImage('extraction');           // extracting penicillin, England, 1943 — Imperial War Museum, public domain

  sfx(c.pulled - 0.1, 'slide', 0.4);
  sfx(c.urine, 'blip', 0.35);
  sfx(c.died, 'thump', 0.45);

  addScene('urine', function (ctx, t) {
    const pic = photoPath(ctx, flasks, t, [[at('urine', 'they') - 0.5, { z: 1.15, x: 0.42, y: 0.25 }], [c.urine + 0.2, { z: 1.7, x: 0.45, y: 0.45 }], [c.end + 1, { z: 2.1, x: 0.48, y: 0.5 }]]);
    if (pic) pointer(ctx, ...pic.at(0.47, 0.55), 540, 520, 'RECOVERED, REUSED', { p: tw(t, c.urine - 0.1, c.urine + 0.5, E.lin) * (1 - tw(t, c.enough - 0.3, c.enough)), color: 'accent', size: 40, t });
    spotlight(ctx, CX, 860, 420, { p: tw(t, c.enough - 0.2, c.enough + 0.4, E.lin), dark: 0.7 });
    const k = tw(t, c.died - 0.1, c.end + 0.5, E.io2);                           // the frame goes dark
    if (k > 0) { ctx.save(); ctx.globalAlpha = 0.85 * k; ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  });
});
