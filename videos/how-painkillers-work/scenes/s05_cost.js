'use strict';
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  // THE COST: the same block in the stomach, where its protective lining thins and
  // cracks; and in the kidneys, where the flow slows and the outline turns to alert red.
  const c = {
    stomach: at('cost', 'stomach'),
    block2: at('cost', 'block', 2),
    ulcers: at('cost', 'ulcers'),
    bleeding: at('cost', 'bleeding'),
    serious: at('cost', 'serious'),
    kidneys: at('cost', 'kidneys'),
    cut: at('cost', 'cut'),
  };
  const warnH = art('warning', { treat: 'tint', colors: ['alert'] });

  sfx(c.stomach, 'swell', 0.35, { dur: 0.8 });
  sfx(c.block2, 'deny', 0.5);
  sfx(c.ulcers, 'rip', 0.6);
  sfx(c.serious, 'stall', 0.5);
  sfx(c.kidneys, 'pop', 0.4);
  sfx(c.cut, 'deny', 0.6);

  addScene('cost', anatScene('cost', function (ctx, t) {
    const shieldIn = prog(t, c.stomach, c.stomach + 0.6);
    const thin = prog(t, c.block2, c.block2 + 0.4);
    const shieldCol = mixHex(COL.good, COL.alert, thin);
    const kidCol = mixHex(COL.data, COL.alert, prog(t, c.cut, c.cut + 0.3));
    const bp = 1;

    anatBody(ctx, 1, 0.92);
    anatRoute(ctx, 0.2, 0.08);

    ANAT_FACTORIES_ANKLE.forEach(function (f) { anatFactory(ctx, f[0], f[1], 46, COL.accent, 0.45); });
    ANAT_FACTORIES_ORGANS.forEach(function (f) { anatFactory(ctx, f.x, f.y, 34, COL.accent, 0.45); });
    ANAT_FACTORIES_ANKLE.forEach(function (f) { anatBlock(ctx, f[0], f[1], 46, bp, 0.85); });
    ANAT_FACTORIES_ORGANS.forEach(function (f) { anatBlock(ctx, f.x, f.y, 34, bp, 0.85); });

    anatStomach(ctx, 0.9, COL.data, 3.4);
    anatShield(ctx, shieldIn, shieldCol, lerp(6, 1.6, thin), 1);
    polyline(ctx, [[548, 716], [556, 726], [546, 734], [560, 744]], COL.alert, 3,
             prog(t, c.ulcers, c.ulcers + 0.3), 1);
    if (t > c.bleeding) {
      const fall = 26 * prog(t, c.bleeding, c.bleeding + 0.7);
      dot(ctx, 562, 760 + fall, 6, COL.alert, 1 - prog(t, c.bleeding + 0.4, c.bleeding + 0.9));
    }

    anatKidneys(ctx, 0.9, kidCol, 3.2);
    const kin = prog(t, c.kidneys, c.kidneys + 0.4);
    const ph = anatFlowPhase(t, c.cut, 0.75);
    anatFlowDots(ctx, ANAT_KIDNEY_PATH_L, ph, 4, COL.data, 4.5, kin);
    anatFlowDots(ctx, ANAT_KIDNEY_PATH_R, ph, 4, COL.data, 4.5, kin);

    const wp = prog(t, c.serious - 0.1, c.serious + 0.25);
    if (wp > 0) {
      drawArt(ctx, warnH, 300, 690, 92, { p: wp });
      callout(ctx, 352, 700, 470, 730, prog(t, c.serious, c.serious + 0.3), COL.alert);
    }

    withAlpha(ctx, prog(t, c.cut, c.cut + 0.4), function () {
      tag(ctx, 'IN KIDNEY PROBLEMS', 100, 880, { align: 'left', color: COL.alert, size: 24 });
    });
    tag(ctx, 'THE COST', 90, 400, { align: 'left', color: COL.alert, size: 26 });
  }), { type: 'fade' });
});
