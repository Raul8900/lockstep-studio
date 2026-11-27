'use strict';
/* PROOF — "For about twenty days, the clock ran uncorrected. Einstein's math predicted how fast it
   would run. The clock matched him to within one percent. They flipped the switch."
   Twenty days tick by on the clock; the verdict board, predicted +446.5 against measured +442.5
   parts in a trillion, WITHIN 1%; the lever slams to ON and the clock rim turns gold. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = osCues(), t0 = c.proof.t0 - 0.5, end = c.payoff.t0 - 0.5;
  const days = at('proof', 'days'), math = at('proof', 'math'), sw = at('proof', 'switch');
  const world = testWorld();
  sfx(t0 + 0.1, 'whoosh', 0.35);
  for (let i = 0; i < 8; i++) sfx(c.twenty + 0.1 + i * 0.36, 'tick', 0.55, { pitch: 0.9 + 0.04 * i });
  sfx(c.predicted - 0.6, 'whoosh', 0.35);
  sfx(c.predicted, 'count', 0.45, { dur: 0.9 });
  sfx(c.matched, 'count', 0.45, { dur: 0.9 });
  sfx(c.percent - 0.9, 'riser', 0.45, { dur: 0.9 });
  sfx(c.percent, 'stamp', 0.7);
  sfx(c.flipped + 0.22, 'lock', 0.9);
  sfx(c.flipped + 0.3, 'impact', 0.6);
  sfx(c.flipped + 0.45, 'chime', 0.7);
  const face = (t) => { const ry = -0.35 + 0.04 * (t - c.doubt.t0); return v3.add(TW.SAT, rotY([0, 0, 0.34], ry)); };
  addScene('proof', function (ctx, t) {
    shots(ctx, t, [
      { at: 0, draw: (ctx, t) => {
        const f = face(t), out = v3.norm(v3.sub(f, TW.SAT)), k = tw(t, t0, c.predicted - 0.6, E.io2);
        view3d(ctx, world, t, camAt(v3.add(f, [0, -0.05, 0]), v3.add(out, [lerp(0.25, -0.15, k), 0.12, 0]), lerp(0.75, 1.15, k), 38));
        topShade(ctx, 1, 760);
        const dk = tw(t, c.twenty - 0.1, c.uncorrected + 0.6, E.io2);
        ringGauge(ctx, CX, 470, 150, dk, { p: prog(t, c.twenty - 0.2, c.twenty + 0.4), color: 'alert', label: 'uncorrected', show: (k) => `${Math.round(20 * k)} days`, size: 70 });
      } },
      { at: c.predicted - 0.6, cut: 'flash', draw: (ctx, t) => {
        view3d(ctx, world, t, { from: [0.4 + 0.08 * (t - c.predicted), 0.6, 6.2], to: [0, 0.1, 0], fov: 40 }, { alpha: 0.32 });
        text(ctx, 'clock speed-up, in parts per trillion', CX, 360, { size: 38, weight: 700, family: F.ui, color: 'rgba(255,255,255,0.75)', align: 'center', alpha: tw(t, math - 0.2, math + 0.3) });
        bigNumber(ctx, 446.5, CX, 600, { p: prog(t, c.predicted - 0.05, c.predicted + 0.9), from: 400, decimals: 1, prefix: '+', label: "Einstein's prediction", size: 180, color: 'data', labelColor: 'data' });
        bigNumber(ctx, 442.5, CX, 980, { p: prog(t, c.matched - 0.05, c.matched + 0.9), from: 400, decimals: 1, prefix: '+', label: 'measured in orbit', size: 180, color: 'ink' });
        stamp(ctx, 'WITHIN 1%', CX, 1310, { p: prog(t, c.percent - 0.05, c.percent + 0.5), color: 'good', size: 120 });
      } },
      { at: c.flipped - 0.6, cut: 'flash', draw: (ctx, t) => {
        const [sx, sy] = shake(t, c.flipped + 0.22, 14, 0.5);
        const k = tw(t, c.flipped - 0.6, end, E.io2);
        view3d(ctx, world, t, { from: v3.lerp([1.25, 0.05, 2.15], [1.15, 0.45, 3.2], k), to: [0.55, -0.4 + 0.0006 * sx * Math.sin(sy), 0.62], fov: lerp(31, 37, k) });
        const fl = pulse(t, c.flipped + 0.24, 0.03, 0.4);
        if (fl > 0) { ctx.save(); ctx.globalAlpha = 0.55 * fl; ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
        topShade(ctx, tw(t, c.flipped + 0.3, c.flipped + 0.6), 640);
        stamp(ctx, 'ON', CX, 470, { p: prog(t, c.flipped + 0.3, c.flipped + 0.8), color: 'good', size: 150, angle: -0.08 });
      } },
    ], { end });
  });
});
