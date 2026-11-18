'use strict';
/* Scene 7 — MELON: "So the hunt moved to America, where the best penicillin mould they ever found
   turned up on a rotten cantaloupe from a market in Illinois."
   A 3D globe wrapped in NASA's Blue Marble turns from Britain to America while an arc draws from
   Oxford to Peoria; then a USDA photograph of cantaloupes, pushing in on the melon.             */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { hunt: at('melon', 'hunt'), america: at('melon', 'america'), best: at('melon', 'best'), found: at('melon', 'found'),
    rotten: at('melon', 'rotten'), cantaloupe: at('melon', 'cantaloupe'), market: at('melon', 'market'), illinois: at('melon', 'illinois'),
    end: at('melon', 'illinois', 1, 't1') };
  const melons = useImage('cantaloupe');            // cantaloupes, photo by Scott Bauer, USDA — public domain
  const OXFORD = [51.75, -1.26], PEORIA = [40.69, -89.59];
  /* a point on the globe (radius r) from latitude and longitude, matching three.js's sphere UVs */
  const ll = (lat, lon, r = 1) => {
    const phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
    return [-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th)];
  };
  const slerp = (a, b, u) => {                       // the great circle between two lat/lon points, lifted mid-way
    const A = ll(a[0], a[1]), B = ll(b[0], b[1]), d = Math.acos(clamp(A[0] * B[0] + A[1] * B[1] + A[2] * B[2], -1, 1));
    const s = Math.sin(d), ka = Math.sin((1 - u) * d) / s, kb = Math.sin(u * d) / s, lift = 1 + 0.22 * Math.sin(Math.PI * u);
    return [(A[0] * ka + B[0] * kb) * lift, (A[1] * ka + B[1] * kb) * lift, (A[2] * ka + B[2] * kb) * lift];
  };

  const globe = world3d(async (T, w) => {
    w.background('#000000');
    w.sun({ dir: [-3, 2, 4], intensity: 2.6, shadow: false });
    w.ambient('#ffffff', 0.25);
    const r = rng(5), pos = [];
    for (let i = 0; i < 1200; i++) { const a = r() * TAU, z = r() * 2 - 1, k = Math.sqrt(1 - z * z); pos.push(Math.cos(a) * k * 50, z * 50, Math.sin(a) * k * 50); }
    const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    w.add(new T.Points(sg, new T.PointsMaterial({ color: 0xffffff, size: 0.09 })));
    w.add(new T.Mesh(new T.SphereGeometry(1, 96, 64), w.mat('#ffffff', { map: await w.texture('earth-map'), roughness: 0.9 })));
    const pts = []; for (let i = 0; i <= 120; i++) pts.push(new T.Vector3(...slerp(OXFORD, PEORIA, i / 120)));
    const tube = new T.TubeGeometry(new T.CatmullRomCurve3(pts), 160, 0.011, 8, false);   // a line with thickness: drawn on by index range
    const arc = w.add(new T.Mesh(tube, w.glow('accent', 2.2)));
    const perSeg = tube.index.count / 160;
    const pin = (ll0) => { const m = w.add(new T.Mesh(new T.SphereGeometry(0.03, 16, 12), w.glow('accent', 2.5))); m.position.set(...ll(ll0[0], ll0[1], 1.005)); return m; };
    const a = pin(OXFORD), b = pin(PEORIA);
    return (t) => {
      const k = tw(t, c.hunt - 0.1, c.america + 0.3, E.io2);
      arc.geometry.setDrawRange(0, Math.round(160 * k) * perSeg);
      a.scale.setScalar(t > c.hunt - 0.2 ? 1 + 0.3 * Math.sin(t * 8) : 0.0001);
      b.scale.setScalar(k > 0.98 ? 1 + 0.3 * Math.sin(t * 8) : 0.0001);
    };
  });

  sfx(c.hunt - 0.2, 'whoosh', 0.55);
  sfx(c.america, 'blip', 0.5);
  sfx(c.best - 0.3, 'whoosh', 0.5);
  sfx(c.rotten, 'splash', 0.35);
  sfx(c.illinois, 'chime', 0.5);

  addScene('melon', function (ctx, t) {
    shots(ctx, t, [
      { at: 0, draw: (ctx, t) => {
        /* the camera swings from above Britain to above the Atlantic, looking down at both ends of the arc */
        const u = tw(t, at('melon', 'so') - 0.5, c.america + 0.4, E.ioSine), lon = lerp(-20, -46, u), lat = lerp(40, 36, u);
        view3d(ctx, globe, t, { from: ll(lat, lon, 4.6 - 0.5 * u), to: [0, 0.05, 0], fov: 40 });
      } },
      { at: c.best - 0.25, cut: 'flash', draw: (ctx, t) => {
        const pic = photoPath(ctx, melons, t, [[c.best - 0.25, { z: 1.12, x: 0.4, y: 0.45 }], [c.cantaloupe + 0.3, { z: 1.8, x: 0.72, y: 0.32 }], [c.end + 0.8, { z: 1.95, x: 0.72, y: 0.33 }]]);
        if (pic) circleIt(ctx, ...pic.at(0.74, 0.3), 260, 220, { p: tw(t, c.cantaloupe - 0.1, c.cantaloupe + 0.5, E.lin), color: 'accent', seed: 7 });
        nameTag(ctx, 'Peoria, Illinois', 'a mouldy melon from a fruit market', 80, 1060, { p: tw(t, c.illinois - 0.1, c.illinois + 0.5, E.lin) });
      } },
    ], { end: DATA.dur });
  });
});
