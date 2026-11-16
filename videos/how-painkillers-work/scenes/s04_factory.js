'use strict';
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  // THE FACTORY: hurt tissue switches on COX-2 and makes prostaglandins; the nerves
  // become more sensitive; the drug blocks every factory at once; the camera pulls out
  // to show "everywhere", then zooms back to the ankle, where the most is removed.
  const c = {
    hurt: at('factory', 'hurt'),
    cox2: at('factory', 'cox-2'),
    prost: at('factory', 'prostaglandins'),
    nerves: at('factory', 'nerves'),
    sensitive: at('factory', 'sensitive'),
    ibu: at('factory', 'ibuprofen'),
    blocks: at('factory', 'blocks'),
    removes: at('factory', 'removes'),
    most: at('factory', 'most'),
  };
  sfx(c.hurt, 'swell', 0.35, { dur: 1.0 });
  sfx(c.cox2, 'blip', 0.6);
  sfx(c.prost, 'pop', 0.5);
  sfx(c.nerves, 'tick', 0.5);
  sfx(c.sensitive, 'thump', 0.6);
  sfx(c.ibu, 'data', 0.5, { dur: 0.6 });
  sfx(c.blocks, 'deny', 0.7);
  sfx(c.blocks, 'impact', 0.6);
  sfx(c.removes, 'whoosh', 0.5);

  addScene('factory', anatScene('factory', function (ctx, t) {
    const A = ANAT_AT.ankle;
    const z0 = lerp(1.9, 1.35, tw(t, 24.0, 26.5));
    const z1 = lerp(z0, 1.0, tw(t, 33.2, 34.4));
    const zoom = lerp(z1, 1.28, tw(t, 38.2, 40.8));
    const pl = tw(t, 33.2, 34.4) * (1 - tw(t, 38.2, 40.8));
    const TX = lerp(A.x, 540, pl);
    const TY = lerp(A.y, 800, pl);

    withCam(ctx, { fx: TX, fy: TY, zoom: zoom, dx: 540 - TX, dy: 800 - TY }, function () {
      anatBody(ctx, 1, 0.95);
      anatRoute(ctx, 0.3, 0);
      anatGlow(ctx, A.x, A.y, 110, 0.32 * prog(t, c.hurt, c.hurt + 0.6));

      ANAT_NERVES.forEach(function (path, k) {
        const grow = tw(t, c.nerves + k * 0.05, c.nerves + 0.4 + k * 0.05);
        const thick = lerp(2, 5.5, tw(t, c.sensitive - 0.1, c.sensitive + 0.3));
        polyline(ctx, path, COL.data, thick, grow, 1);
      });

      ANAT_FACTORIES_ANKLE.forEach(function (f, k) {
        anatFactory(ctx, f[0], f[1], 46, COL.accent, tw(t, c.cox2 + k * 0.06, c.cox2 + 0.3 + k * 0.06));
      });
      text(ctx, 'COX-2', 600, 1080, {
        size: 30, weight: 700, family: F.mono, color: COL.accent, align: 'left',
        alpha: tw(t, c.cox2, c.cox2 + 0.3)
      });

      for (let i = 0; i < 12; i++) {
        const g = prog(t, c.prost + i * 0.03, c.prost + 0.8 + i * 0.03);
        if (g <= 0) continue;
        const keep = (i < 3) ? 1 : 1 - 0.85 * tw(t, c.removes - 0.1, c.most + 0.2);
        const rem = 1 - keep;
        const pos = anatMarkPos(i, E.out3(g));
        const src = ANAT_FACTORIES_ANKLE[i % 3];
        dot(ctx, lerp(pos[0], src[0], rem), lerp(pos[1], src[1], rem), 5.5, COL.accent, (1 - rem) * g);
      }

      for (let k = 0; k < 6; k++) {
        const a = prog(t, c.ibu + k * 0.05, c.ibu + 0.7 + k * 0.05);
        const from = anatOnLoop(k / 6 + 0.2);
        const to = ANAT_FACTORIES_ANKLE[k % 3];
        dot(ctx, lerp(from[0], to[0], a), lerp(from[1], to[1], a), 7, COL.subject,
            prog(t, c.ibu + k * 0.05, c.ibu + 0.2 + k * 0.05));
      }

      ANAT_FACTORIES_ORGANS.forEach(function (f) {
        anatFactory(ctx, f.x, f.y, 34, COL.accent, tw(t, c.ibu, c.ibu + 0.3));
      });

      const bp = prog(t, c.blocks - 0.02, c.blocks + 0.2);
      ANAT_FACTORIES_ANKLE.forEach(function (f) { anatBlock(ctx, f[0], f[1], 46, bp, 1); });
      ANAT_FACTORIES_ORGANS.forEach(function (f) { anatBlock(ctx, f.x, f.y, 34, bp, 1); });
    });

    withAlpha(ctx, prog(t, c.blocks, c.blocks + 0.3), function () {
      tag(ctx, 'BLOCKED', 90, 440, { align: 'left', color: COL.subject, size: 26 });
    });
    tag(ctx, 'THE FACTORY', 90, 400, { align: 'left', color: COL.accent, size: 26 });
  }), { type: 'zoomIn', fx: ANAT_AT.ankle.x, fy: ANAT_AT.ankle.y });
});
