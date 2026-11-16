'use strict';
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  // THE MYTH: the tablet flies straight to the sore ankle, the crosshair locks, then shatters.
  const c = {
    knows: at('hook', 'knows'),
    hurts: at('hook', 'hurts'),
    doesnt: at('hook', "doesn't"),
  };
  const pillH = art('pill', { treat: 'tint', colors: ['subject'] });

  sfx(c.knows - 0.25, 'whoosh', 0.5);
  sfx(c.hurts, 'lock', 0.8);
  sfx(c.doesnt - 0.45, 'riser', 0.5, { dur: 0.45 });
  sfx(c.doesnt, 'impact', 0.9);
  sfx(c.doesnt, 'deny', 0.5);

  addScene('hook', anatScene('hook', function (ctx, t) {
    const A = ANAT_AT.ankle;
    const fly = tw(t, c.knows - 0.2, c.hurts, E.io3);
    const lock = tw(t, c.hurts - 0.15, c.hurts + 0.25, E.outBack);
    const sh = tw(t, c.doesnt - 0.02, c.doesnt + 0.55, E.outExpo);
    const gone = 1 - prog(t, c.doesnt - 0.04, c.doesnt + 0.12);
    const px = lerp(800, A.x, fly);
    const py = lerp(586, A.y, fly);
    const R = 50 + 3 * Math.sin(t * 5);

    anatRoute(ctx, 0.35 + 0.3 * sh, 0);
    anatBody(ctx, 1, 0.95);
    anatGlow(ctx, A.x, A.y, 90, 0.12 * (1 - sh));

    if (gone > 0.01) {
      drawArt(ctx, pillH, px, py, 120, { alpha: gone, rot: fly * 0.8 });
    }
    if (lock > 0.01 && sh < 1) {
      withAlpha(ctx, lock * (1 - sh), function () {
        ring(ctx, A.x, A.y, R, COL.ink, 3, 1);
        line(ctx, A.x - R - 18, A.y, A.x - R + 10, A.y, COL.ink, 3, 1);
        line(ctx, A.x + R - 10, A.y, A.x + R + 18, A.y, COL.ink, 3, 1);
        line(ctx, A.x, A.y - R - 18, A.x, A.y - R + 10, COL.ink, 3, 1);
        line(ctx, A.x, A.y + R - 10, A.x, A.y + R + 18, COL.ink, 3, 1);
      });
    }
    if (sh > 0) {
      for (let k = 0; k < 8; k++) {
        const a = k * Math.PI / 4 + 0.2;
        const r0 = 50 + 40 * sh;
        const r1 = 50 + 130 * sh;
        line(ctx, A.x + Math.cos(a) * r0, A.y + Math.sin(a) * r0,
             A.x + Math.cos(a) * r1, A.y + Math.sin(a) * r1, COL.ink, 3, 1 - sh * 0.8);
      }
      for (let k = 0; k < 8; k++) {
        const q = anatOnLoop(k / 8 + 0.06);
        dot(ctx, lerp(A.x, q[0], sh), lerp(A.y, q[1], sh), 8, COL.subject, clamp(sh * 1.5));
      }
      anatDrug(ctx, t, 8, 0.03, 0.06, 7, sh * 0.9);
    }
    tag(ctx, 'THE MYTH', 90, 400, { align: 'left', color: COL.accent, size: 26 });
  }), { type: 'fade' });
});
