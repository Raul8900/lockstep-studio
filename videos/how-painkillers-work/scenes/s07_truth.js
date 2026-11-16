'use strict';
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  // THE TRUTH: the crosshair returns, empty, and is crossed out; the factories are
  // busiest at the ankle; the block covers every factory at once; then the end card.
  const c = {
    doesnt: at('truth', "doesn't"),
    doesnt2: at('truth', "doesn't", 2),
    busiest: at('truth', 'busiest'),
    shuts: at('truth', 'shuts'),
    end: at('truth', 'reaches', 1, 't1'),
  };
  sfx(c.doesnt, 'deny', 0.6);
  sfx(c.busiest, 'lock', 0.6);
  sfx(c.shuts, 'impact', 0.6);
  sfx(c.doesnt2, 'deny', 0.5);
  sfx(c.end + 0.2, 'chime', 0.7);

  addScene('truth', function (ctx, t) {
    const A = ANAT_AT.ankle;
    const card = prog(t, c.end + 0.1, c.end + 0.6);
    const bodyA = 1 - 0.92 * card;

    anatBody(ctx, 1, 0.95 * bodyA);
    anatRoute(ctx, 0.25 * bodyA, 0.12 * bodyA);
    anatGlow(ctx, A.x, A.y, 100, 0.3 * prog(t, c.busiest, c.busiest + 0.4) * bodyA);

    const xr = prog(t, c.doesnt, c.doesnt + 0.5);
    if (xr > 0 && bodyA > 0) {
      withAlpha(ctx, bodyA, function () {
        ring(ctx, A.x, A.y, 52, COL.ink, 3, 1 - xr * 0.3);
        cross(ctx, A.x, A.y, 110, COL.alert, xr, 9);
      });
    }

    ANAT_FACTORIES_ANKLE.forEach(function (f) { anatFactory(ctx, f[0], f[1], 46, COL.accent, bodyA); });
    ANAT_FACTORIES_ORGANS.forEach(function (f) { anatFactory(ctx, f.x, f.y, 34, COL.accent, bodyA); });
    const bp = prog(t, c.shuts, c.shuts + 0.25);
    ANAT_FACTORIES_ANKLE.forEach(function (f) { anatBlock(ctx, f[0], f[1], 46, bp, bodyA); });
    ANAT_FACTORIES_ORGANS.forEach(function (f) { anatBlock(ctx, f.x, f.y, 34, bp, bodyA); });

    for (let i = 0; i < 12; i++) {
      const g = prog(t, c.busiest + i * 0.02, c.busiest + 0.7 + i * 0.02);
      if (g <= 0) continue;
      const pos = anatMarkPos(i, E.out3(g));
      dot(ctx, pos[0], pos[1], 5.5, COL.accent, g * bodyA * 0.9);
    }
    anatDrug(ctx, t, 12, 0.03, 0, 7, 0.7 * bodyA);

    if (card > 0) {
      text(ctx, 'READ THE LABEL.', 540, 880, {
        size: 92, weight: 800, family: F.disp, color: COL.ink, align: 'center', alpha: card
      });
      text(ctx, 'Ask a pharmacist about your stomach and kidneys.', 540, 960, {
        size: 34, weight: 500, family: F.ui, color: COL.dim, align: 'center', alpha: card, maxW: 820
      });
    }

    tag(ctx, 'THE TRUTH', 90, 400, { align: 'left', color: COL.ink, size: 26 });
  }, { type: 'zoomOut', fx: 540, fy: 800 });
});
