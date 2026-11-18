'use strict';
/* Scene 2 — DRIFT: "Every year it drifts almost four centimetres further out, pushed by the
   tides it raises on Earth."
   A 3D Earth and Moon wrapped in NASA's maps. The Moon slides outward along its orbit; the
   ocean's bulge leans towards it; the number lands on "four".                                  */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { every: at('drift', 'every'), four: at('drift', 'four'), out: at('drift', 'out'), pushed: at('drift', 'pushed'), tides: at('drift', 'tides'), earth: at('drift', 'earth') };
  const moonAt = (t) => lerp(4.0, 5.1, tw(t, c.every, c.out + 0.4, E.ioSine));       // not to scale: the drift, exaggerated
  const moonAngle = (t) => 0.55 + 0.035 * t;

  const space = world3d(async (T, w) => {
    w.background('#000000');
    const sun = w.sun({ dir: [-2, 3, 5], intensity: 3.0, shadow: false });
    w.ambient(COL.subject, 0.12);
    /* stars: fixed points, placed with the seeded rng (never Math.random) */
    const r = rng(7), pos = [];
    for (let i = 0; i < 1500; i++) { const a = r() * TAU, z = r() * 2 - 1, k = Math.sqrt(1 - z * z), d = 60; pos.push(Math.cos(a) * k * d, z * d, Math.sin(a) * k * d); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    w.add(new T.Points(g, new T.PointsMaterial({ color: 0xffffff, size: 0.12, sizeAttenuation: true })));
    /* Earth, tilted, with the ocean's bulge as a faint shell */
    const earth = w.add(new T.Mesh(new T.SphereGeometry(1, 96, 64), w.mat('#ffffff', { map: await w.texture('earth-map'), roughness: 0.85 })));
    earth.rotation.z = 0.41;
    const bulge = w.add(new T.Mesh(new T.SphereGeometry(1.02, 64, 48), new T.MeshStandardMaterial({ color: new T.Color(COL.subject), transparent: true, opacity: 0.0, roughness: 0.3 })));
    const moon = w.add(new T.Mesh(new T.SphereGeometry(0.27, 64, 48), w.mat('#ffffff', { map: await w.texture('moon-map'), roughness: 1 })));
    return (t) => {
      const a = moonAngle(t), d = moonAt(t);
      moon.position.set(Math.cos(a) * d, 0.15, -Math.sin(a) * d);
      moon.rotation.y = -a;
      earth.rotation.y = t * 0.25;
      const k = tw(t, c.tides - 0.2, c.tides + 0.6, E.out3);
      bulge.material.opacity = 0.32 * k;
      bulge.scale.set(1 + 0.16 * k, 1, 1);
      bulge.rotation.y = a + 0.35;                  // the bulge runs a little ahead of the Moon: that lead is what pushes it
    };
  });

  sfx(c.four - 0.05, 'impact', 0.55);
  sfx(c.tides - 0.1, 'swell', 0.45);

  /* a vertical frame: the camera sits behind the Earth, looking past it at the Moon, so the Earth
     fills the bottom of the frame and the Moon hangs above it — and shrinks away as it drifts */
  const behind = (tk, back, up, side, ahead) => {
    const a = moonAngle(tk), u = [Math.cos(a), 0, -Math.sin(a)], s2 = [Math.sin(a), 0, Math.cos(a)];
    return { from: [-u[0] * back + s2[0] * side, up, -u[2] * back + s2[2] * side], to: [u[0] * ahead, 0, u[2] * ahead] };
  };
  addScene('drift', function (ctx, t) {
    const cam = camPath(t, [
      [c.every - 0.6, Object.assign(behind(c.every - 0.6, 6.0, 5.0, 0.6, 2.0), { fov: 42 })],
      [c.out + 0.5, Object.assign(behind(c.out + 0.5, 3.2, 3.6, 0.3, 1.6), { fov: 38 })],
      [c.earth + 0.7, Object.assign(behind(c.earth + 0.7, 2.6, 2.6, 1.0, 1.8), { fov: 38 })],
    ]);
    const v = view3d(ctx, space, t, cam);
    /* the number between the Moon and the Earth, gone once the line moves on to why */
    withAlpha(ctx, 1 - tw(t, c.pushed - 0.15, c.pushed + 0.25), () =>
      bigNumber(ctx, 3.8, CX, 700, { p: tw(t, c.four - 0.1, c.four + 0.9, E.lin), suffix: ' cm', label: 'further every year', t, hit: c.four + 0.7 }));
    if (v) {
      const [x, y, front] = v.project([Math.cos(moonAngle(t) + 0.35) * 1.15, 0, -Math.sin(moonAngle(t) + 0.35) * 1.15]);
      if (front) pointer(ctx, x, y, clamp(x + 150, 120, 640), clamp(y - 230, 420, 1100), 'OCEAN TIDE', { p: tw(t, c.tides, c.tides + 0.7, E.lin), color: 'subject', size: 46, t });
    }
  });
});
