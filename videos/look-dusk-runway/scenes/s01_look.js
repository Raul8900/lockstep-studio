'use strict';
/* Scene 1 — LOOK: a look test for film worlds, no narration.
   Dusk after rain. An airliner rejects its take-off and stands on the brakes: spoilers up,
   reversers open, spray off the wheels, the brakes starting to glow. The camera sits low at
   the runway's edge on a long lens, handheld, and the aircraft comes at it out of the haze. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const V0 = 64, A = 4.4, Z0 = -430;                        // m/s at t = 0, braking m/s², position at t = 0
  const zAt = (t) => Z0 + V0 * t - 0.5 * A * t * t;
  const vAt = (t) => V0 - A * t;
  const SUN = [-0.36, -0.03, -0.93];
  const CAM = [-19.5, 0.95, -38];
  let ac = null, af = null, spray = null, sunL = null;

  const world = world3d(async (T, w) => {
    await w.atmosphere({
      sun: SUN, sunColor: [22, 7.5, 2.0], zenith: [0.004, 0.012, 0.05], horizon: [0.05, 0.05, 0.08], ground: [0.02, 0.02, 0.022],
      sunSize: 0.0095, clouds: 0.36, cloudHeight: 2400, cloudScale: 1100, wind: [0.0012, 0.0004], stars: 0.25,
      haze: { density: 0.0008, falloff: 0.045, tint: [0.55, 0.62, 0.9], sunScatter: 0.006 }, env: 1.0,
    });
    sunL = w.sun({ dir: [SUN[0] * 300, 3, SUN[2] * 300], intensity: 0.25, color: '#ff9a5c', area: 34 });
    sunL.shadow.camera.far = 700; sunL.shadow.mapSize.set(2048, 2048);
    af = await airfield(T, w, { far: -3000, end: 60 });
    ac = await airliner(T, w, {});
    spray = w.puffs(150, { lit: [1.1, 0.6, 0.35], shade: [0.035, 0.04, 0.055], light: [-SUN[0], -SUN[1] + 0.25, -SUN[2]], glow: [0.0, 0.0, 0.0] });
    return (t) => {
      const z = zAt(t), heat = 520 + 95 * (t + 2);
      ac.pose({ z, x: 0.6, dist: z + 2000, spoilers: 1, reverse: 1, heat, pitch: 0.011, sink: 0.05 });
      af.update(z - 1.3, zAt(-2) - 1.3);
      sunL.position.set(SUN[0] * 300, 3, z + SUN[2] * 300); sunL.target.position.set(0, 0, z); sunL.target.updateMatrixWorld();
      /* spray and rubber smoke: puffs born at the tyres every 40 ms, left behind in the air */
      const dt = 0.04, kNow = Math.floor((t + 3) / dt);
      let n = 0;
      for (const gx of [3.5, -2.3]) {
        for (let j = 0; j < 75; j++) {
          const k = kNow - j, tb = k * dt - 3, age = t - tb;
          if (age < 0 || age > 3) { spray.set(n++, [0, -1000, 0], 0.001, 0); continue; }
          const s = hash1(k * 7.31 + gx), s2 = hash1(k * 3.17 + gx * 2.1);
          const zc = zAt(tb) - 1.3 + vAt(tb) * 0.12 * (1 - Math.exp(-age * 3));
          const at = [gx + (s - 0.5) * 1.2 + 0.7 * age, 0.25 + 0.55 * age + 0.6 * s2 * age, zc - age * 1.5];
          spray.set(n++, at, 0.9 + 2.6 * age + s * 0.6, 0.5 * Math.exp(-age / 1.1) * clamp(age * 6), s);
        }
      }
      spray.commit();
    };
  }, { film: { samples: 16, shutter: 0.5, aperture: 0.07, focus: 300, bloom: 0.55, threshold: 2.5, knee: 0.8, halation: 0.05, streak: 0.025, streakThreshold: 12, bloomScatter: 0.6,
               vignette: 0.45, aberration: 0.006, grain: 0.045, saturation: 1.05, contrast: 1.08, exposure: 1.15, lift: [0.004, 0.006, 0.012], gain: [1.0, 0.98, 0.96], flare: 0.15 } });

  /* the camera: low at the runway edge, a long lens that widens a little as the aircraft comes,
     handheld, focus pulled to stay on the nose */
  const cam = (t) => {
    const z = zAt(t), tgt = [0.6, 2.6, z + 8];
    const sh = handheld(t, 0.16 * (0.6 + 0.4 * clamp(1 - (z + 130) / 300)), 3, 0.7);
    const fov = lerp(24, 30, tw(t, 0, 6, E.ioSine));
    const dx = tgt[0] - CAM[0], dz = tgt[2] - CAM[2];
    return { from: CAM, to: [tgt[0] + sh[0] * 6, tgt[1] + 14 + sh[1] * 6, tgt[2]], fov, focus: Math.hypot(dx, dz) - 12 };
  };

  addScene('look', function (ctx, t) {
    view3d(ctx, world, t, cam);
  });
});

/* a seeded random number for a whole-number key (deterministic) */
function hash1(x) { const s = Math.sin(x * 12.9898) * 43758.5453; return s - Math.floor(s); }
