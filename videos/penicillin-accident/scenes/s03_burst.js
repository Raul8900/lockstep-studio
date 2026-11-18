'use strict';
/* Scene 3 — BURST: "Here's why. A bacterium lives inside a wall it keeps rebuilding as it grows.
   The mould's chemical jams the builders. The wall cracks, and the bacterium bursts."
   The one abstract idea made physical, in 3D: a rod-shaped bacterium wrapped in a wall of bricks
   that keep being laid as it grows; glowing penicillin molecules arrive and stick; bricks round
   them fall away; on "bursts" the cell blows apart. Everything is a function of t.            */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    why: at('burst', 'why'), bacterium: at('burst', 'bacterium'), wall: at('burst', 'wall'), rebuilding: at('burst', 'rebuilding'),
    grows: at('burst', 'grows'), chemical: at('burst', 'chemical'), jams: at('burst', 'jams'), builders: at('burst', 'builders'),
    cracks: at('burst', 'cracks'), bursts: at('burst', 'bursts'),
  };
  const R = 0.62, HALF = 1.15;                          // the rod: radius, half the length of its straight part (along y)
  const BW = 0.15, BH = 0.155, BT = 0.07;               // a brick: width round the rod, height along it, thickness

  /* the bricks: rings round the straight part, then shrinking rings over the two round ends */
  const bricks = [];
  const ring = (y, r, n, off, cap) => {
    for (let k = 0; k < n; k++) {
      const a = ((k + off) / n) * TAU, nx = Math.cos(a), nz = Math.sin(a);
      bricks.push({ p: [nx * r, y, nz * r], n: cap ? null : [nx, 0, nz], a, y, r });
    }
  };
  const N = Math.round(TAU * R / BW);
  for (let y = -HALF, row = 0; y <= HALF + 1e-6; y += BH, row++) ring(y, R, N, row % 2 ? 0.5 : 0, false);
  for (const s of [-1, 1]) {
    for (let k = 1; k <= 4; k++) {
      const phi = (k / 4.6) * (Math.PI / 2), r = R * Math.cos(phi), y = s * (HALF + R * Math.sin(phi));
      ring(y, r, Math.max(5, Math.round(TAU * r / BW)), k % 2 ? 0.5 : 0, true);
    }
  }
  bricks.forEach((b, i) => {
    if (!b.n) { const ln = Math.hypot(b.p[0], b.p[1] - Math.sign(b.p[1]) * HALF, b.p[2]); b.n = [b.p[0] / ln, (b.p[1] - Math.sign(b.p[1]) * HALF) / ln, b.p[2] / ln]; }
    b.h = hash(i * 1.37 + 0.2);                          // this brick's own chance
    b.late = b.h < 0.3;                                  // laid while we watch: "keeps rebuilding"
  });

  /* where the penicillin lands: eight points on the side the camera sees */
  const hits = [];
  for (let k = 0; k < 8; k++) {
    const a = 0.9 + (k / 8) * 2.2 + (hash(k * 7.1) - 0.5) * 0.3, y = -0.9 + 1.8 * hash(k * 3.3);
    hits.push({ p: [Math.cos(a) * (R + 0.1), y, Math.sin(a) * (R + 0.1)], from: [Math.cos(a) * 5 + (hash(k) - 0.5) * 3, y + (hash(k + 9) - 0.5) * 4, Math.sin(a) * 5],
      t0: c.chemical - 0.2 + k * 0.12 });
  }
  /* each brick near a hit falls when the wall cracks: the nearer, the sooner */
  for (const b of bricks) {
    let d = 9;
    for (const h of hits) d = Math.min(d, Math.hypot(b.p[0] - h.p[0], b.p[1] - h.p[1], b.p[2] - h.p[2]));
    b.fall = d < 0.5 ? c.cracks - 0.15 + d * 1.3 + b.h * 0.2 : null;
  }

  const cell = world3d(async (T, w) => {
    const deep = mixToHex(COL.subject, '#000000', 0.93);
    w.background(deep); w.fog(deep, 5, 14);
    w.room(0.3);
    w.sun({ dir: [3, 5, 6], intensity: 1.5, shadow: false });
    w.sun({ dir: [-4, 2, -5], intensity: 1.2, color: COL.good, shadow: false });     // a rim from behind
    w.ambient(COL.good, 0.12);
    const jelly = w.add(new T.Mesh(new T.CapsuleGeometry(R * 0.9, HALF * 2, 12, 40),
      new T.MeshStandardMaterial({ color: new T.Color(COL.good), emissive: new T.Color(COL.good), emissiveIntensity: 0.4, roughness: 0.35, transparent: true, opacity: 0.92 })));
    const geo = new T.BoxGeometry(BW * 0.92, BH * 0.9, BT);
    const wallMat = w.mat(mixToHex(COL.subject, '#000000', 0.25), { roughness: 0.55, metalness: 0.05 });
    const wall = w.add(new T.InstancedMesh(geo, wallMat, bricks.length));
    const pen = hits.map(() => w.add(new T.Mesh(new T.IcosahedronGeometry(0.06, 1), w.glow('accent', 1.4))));
    const m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), sc = new T.Vector3(), pos = new T.Vector3(), Z = new T.Vector3(0, 0, 1), nv = new T.Vector3();
    return (t) => {
      const grow = 1 + 0.08 * tw(t, c.wall, c.grows + 0.4);                     // the rod lengthens a little as it grows
      const boom = t - c.bursts;
      bricks.forEach((b, i) => {
        let s = 1, off = 0, drop = 0, spin = 0;
        if (b.late) s = E.outBack(clamp((t - (c.wall + b.h * (c.grows - c.wall) * 3)) / 0.25));
        if (b.fall != null && t > b.fall) { const k = t - b.fall; off = 0.25 * k; drop = 1.6 * k * k; spin = 3 * k; s *= 1 - clamp(k / 1.4); }
        if (boom > 0) { const v = (1.1 + 2.2 * b.h) * Math.exp(-boom * 0.8); off += v * boom; drop += 0.35 * boom * boom; spin += (4 + 6 * b.h) * boom; }   // debris drifts, slowing
        nv.set(b.n[0], b.n[1], b.n[2]);
        pos.set(b.p[0] + b.n[0] * off, b.p[1] * grow + b.n[1] * off - drop, b.p[2] + b.n[2] * off);
        q.setFromUnitVectors(Z, nv);
        if (spin) q.multiply(new T.Quaternion().setFromEuler(e.set(spin, spin * 0.7, 0)));
        sc.setScalar(Math.max(0.0001, s * (boom > 0 ? 1 - 0.6 * clamp(boom / 1.5) : 1)));
        m.compose(pos, q, sc);
        wall.setMatrixAt(i, m);
      });
      wall.instanceMatrix.needsUpdate = true;
      jelly.scale.set(1, grow, 1);
      const swell = tw(t, c.cracks, c.bursts, E.in3);                          // the inside pushes out through the gaps
      jelly.scale.multiplyScalar(1 + 0.12 * swell + (boom > 0 ? 0.7 * E.out3(clamp(boom / 0.4)) : 0));
      jelly.material.opacity = 0.92 * (boom > 0 ? 1 - 0.75 * clamp(boom / 0.5) : 1);   // the insides spill out as a fading cloud
      jelly.rotation.y = 0.15 * t;
      hits.forEach((h, k) => {
        const u = E.out3(clamp((t - h.t0) / 0.7)), mesh = pen[k];
        mesh.position.set(lerp(h.from[0], h.p[0], u), lerp(h.from[1], h.p[1], u) * grow, lerp(h.from[2], h.p[2], u));
        mesh.scale.setScalar(t < h.t0 ? 0.0001 : (1 + 0.25 * Math.sin(t * 9 + k)) * (boom > 0 ? 1 - clamp(boom / 0.6) : 1));
        if (boom > 0) mesh.position.multiplyScalar(1 + 2 * boom);
      });
    };
  });

  sfx(c.why - 0.1, 'whoosh', 0.5);
  for (let k = 0; k < 5; k++) sfx(c.wall + 0.2 + k * 0.28, 'tick', 0.35, { pitch: 1 + k * 0.05 });
  sfx(c.chemical, 'zip', 0.5);
  sfx(c.jams, 'lock', 0.6);
  sfx(c.cracks, 'rip', 0.6);
  sfx(c.bursts - 0.6, 'riser', 0.5);
  sfx(c.bursts, 'impact', 1.0);
  sfx(c.bursts + 0.02, 'splash', 0.6);

  addScene('burst', function (ctx, t) {
    const v = view3d(ctx, cell, t, camPath(t, [
      [c.why - 1.1, { from: [0.9, 1.2, 9.8], to: [0, -0.45, 0], fov: 40 }],
      [c.why - 0.3, { from: [0.5, 1.05, 9.1], to: [0, -0.45, 0], fov: 40, ease: E.lin }],
      [c.grows, { from: [-1.6, 1.3, 7.2], to: [0, -0.4, 0], fov: 40 }],
      [c.cracks, { from: [2.0, 0.7, 5.6], to: [0.3, -0.3, 0.3], fov: 38 }],
      [c.bursts + 0.15, { from: [1.6, 0.5, 5.0], to: [0.2, -0.3, 0.3], fov: 38 }],
      [c.bursts + 1.0, { from: [0.6, 0.9, 8.2], to: [0, -0.4, 0], fov: 42 }],
    ]));
    if (v) {
      const [wx, wy] = v.project([R, 0.55, 0.25]);
      pointer(ctx, wx, wy, 760, 470, 'WALL', { p: tw(t, c.wall, c.wall + 0.6, E.lin) * (1 - tw(t, c.chemical - 0.3, c.chemical)), color: 'subject', size: 46, t });
      const h = hits[2], [px, py] = v.project([h.p[0], h.p[1], h.p[2]]);
      pointer(ctx, px, py, Math.max(430, px - 120), 430, 'PENICILLIN', { p: tw(t, c.jams - 0.1, c.jams + 0.5, E.lin) * (1 - tw(t, c.cracks + 0.4, c.cracks + 0.8)), color: 'accent', size: 46, t });
    }
    const f = t - c.bursts;                                                    // the flash of the burst
    if (f > 0 && f < 0.25) { ctx.save(); ctx.globalAlpha = 0.45 * (1 - f / 0.25); ctx.fillStyle = COL.ink; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  });
});
