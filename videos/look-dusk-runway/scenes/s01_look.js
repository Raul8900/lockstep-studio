'use strict';
/* Scene 1 — LOOK: a look test for film worlds, no narration.
   Golden hour on a dry runway. An airliner rejects its take-off and stands on the brakes:
   spoilers up, reversers open. The camera stands at the runway's edge, a little ahead of where
   the aircraft will stop, on a long lens that widens as it comes. The look is clean and
   stylised: a low sun from the camera's side lights the aircraft's flank, soft shadows, matt
   paint, no heavy bloom, spray, grain or lens effects. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const V0 = 38, A = 3.0, Z0 = -331.7;                      // m/s at t = 0, braking m/s², main gear at t = 0
  const zAt = (t) => Z0 + V0 * t - 0.5 * A * t * t;
  const SUN = (() => { const v = [-0.9, 0.09, 0.1], l = Math.hypot(...v); return v.map((c) => c / l); })();
  const CAM = [-44, 1.6, -100];
  let ac = null, af = null, sunL = null;

  const world = world3d(async (T, w) => {
    await w.atmosphere({
      sun: SUN, sunColor: [11, 5.8, 2.4], zenith: [0.035, 0.11, 0.40], horizon: [1.0, 0.72, 0.46], ground: [0.06, 0.06, 0.05],
      sunSize: 0.009, clouds: 0.5, cloudHeight: 1800, cloudScale: 700, wind: [0.0012, 0.0004], stars: 0,
      haze: { density: 0.00012, falloff: 0.03, tint: [0.8, 0.74, 0.72], sunScatter: 0.004 }, env: 0.8,
    });
    sunL = w.sun({ dir: [SUN[0] * 300, SUN[1] * 300, SUN[2] * 300], intensity: 6.0, color: '#ffbf7a', area: 40 });
    sunL.shadow.camera.far = 700; sunL.shadow.mapSize.set(4096, 4096);
    af = await airfield(T, w, { far: -3000, end: 400, sheen: 0 });   // a dry runway: no mirror
    ac = await airliner(T, w, {});
    return (t) => {
      const z = zAt(t);
      ac.pose({ z, x: 0, dist: z - Z0, spoilers: 1, reverse: 1, heat: 600 + 40 * t, pitch: 0.008, sink: 0.04 });
      af.update(z, zAt(-2));
      sunL.position.set(SUN[0] * 300, SUN[1] * 300, z + SUN[2] * 300); sunL.target.position.set(0, 0, z); sunL.target.updateMatrixWorld();
    };
  }, { film: { samples: 16, shutter: 0.5, aperture: 0.02, focus: 200, exposure: 1.0, saturation: 1.12, contrast: 1.06 } });

  /* the camera: fixed at the runway edge on a long lens, framed tight on the aircraft: the frame's
     width at the aircraft closes from 26 m to 21 m as it comes, so it grows and fills the picture,
     the wingtips leaving the frame; a gentle handheld drift, focus on the aircraft */
  const cam = (t) => {
    const z = zAt(t), tgt = [0, 3.6, z + 7];
    const sh = handheld(t, 0.035, 3, 0.6);
    const k = tw(t, 0, 6, E.ioSine);
    const d = Math.hypot(tgt[0] - CAM[0], tgt[1] - CAM[1], tgt[2] - CAM[2]);
    const fov = 2 * Math.atan(lerp(26, 21, k) / 2 / d / (1080 / 1920)) * 180 / Math.PI;
    const to = [tgt[0], tgt[1] + d * Math.tan(fov * 0.06 * Math.PI / 180), tgt[2]];   // the aircraft a little below the middle
    return { from: CAM, to: [to[0] + sh[0] * d * 0.02, to[1] + sh[1] * d * 0.02, to[2]], fov, focus: d };
  };

  addScene('look', function (ctx, t) {
    view3d(ctx, world, t, cam);
  });
});
