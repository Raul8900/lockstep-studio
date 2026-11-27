'use strict';
/* DOUBT — "In 1977, not everyone believed it. So the Navy's test satellite, NTS-2, flew with the fix
   built in, but switched off. They'd only turn it on if Einstein turned out to be right."
   Over the Earth's limb: 1977; NTS-2 (a generic satellite, named); the RELATIVITY FIX switch, OFF. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = osCues(), t0 = c.doubt.t0 - 0.5, end = c.proof.t0 - 0.5;
  const y77 = at('doubt', '1977'), navy = at('doubt', "navy's"), off = at('doubt', 'off'), turn = at('doubt', 'turn');
  const world = testWorld();
  sfx(t0 + 0.1, 'whoosh', 0.4);
  sfx(y77, 'thump', 0.6);
  sfx(navy - 0.3, 'whoosh', 0.4);
  sfx(c.nts, 'blip', 0.55);
  sfx(c.fix - 0.3, 'slide', 0.4);
  sfx(off, 'deny', 0.6);
  sfx(turn, 'tick', 0.6); sfx(turn + 0.6, 'tick', 0.5); sfx(turn + 1.2, 'tick', 0.45);
  const face = (t) => { const ry = -0.35 + 0.04 * (t - c.doubt.t0); return v3.add(TW.SAT, rotY([0, 0, 0.34], ry)); };
  addScene('doubt', function (ctx, t) {
    shots(ctx, t, [
      { at: 0, draw: (ctx, t) => {
        view3d(ctx, world, t, camPath(t, [[t0, { from: [0.6, 0.9, 7.4], to: [0, 0.0, 0], fov: 40 }], [navy - 0.4, { from: [0.3, 0.7, 5.6], to: [0, 0.1, 0], fov: 40 }]]));
        topShade(ctx, 1, 700);
        bigNumber(ctx, 1977, CX, 470, { p: prog(t, y77 - 0.05, y77 + 0.6), count: false, sep: false, size: 230, color: 'ink', t, hit: y77 });
      } },
      { at: navy - 0.4, cut: 'flash', draw: (ctx, t) => {
        const k = tw(t, navy - 0.4, c.fix - 0.4, E.io2), f = face(t);
        const v = view3d(ctx, world, t, { from: v3.lerp([0.3, 1.5, 2.6], [0.6, 1.25, 2.1], k), to: v3.add(TW.SAT, [0.1, 0, 0]), fov: 36 });
        nameTag(ctx, 'NTS-2', 'U.S. Navy test satellite, 1977', 70, 400, { p: prog(t, c.nts - 0.1, c.nts + 0.6), color: 'accent', size: 64 });
        if (!v) return;
        const [fx, fy] = v.project(f);
        pointer(ctx, fx, fy, fx + 200, fy + 380, 'atomic clock', { p: prog(t, c.nts + 0.4, c.nts + 1.0), color: 'alert', t, size: 40 });
      } },
      { at: c.fix - 0.4, cut: 'flash', draw: (ctx, t) => {
        const k = tw(t, c.fix - 0.4, end, E.io2);
        view3d(ctx, world, t, { from: v3.lerp([1.35, 0.25, 2.5], [1.0, 0.75, 5.0], k), to: v3.lerp([0.55, -0.42, 0.65], [0.1, 0.1, 0.2], k), fov: lerp(34, 40, k) });
        topShade(ctx, 1, 640);
        nameTag(ctx, 'RELATIVITY FIX', 'built in, but switched off', 70, 400, { p: prog(t, c.fix, c.fix + 0.6), color: 'alert', size: 60 });
        stamp(ctx, 'OFF', 790, 1230, { p: prog(t, off - 0.05, off + 0.5) * (1 - tw(t, turn - 0.3, turn)), size: 130 });
        withAlpha(ctx, tw(t, turn - 0.2, turn + 0.3), () => {
          text(ctx, 'ON only if Einstein is right', CX, 1300, { size: 52, weight: 800, family: F.disp, color: COL.good, align: 'center' });
        });
      } },
    ], { end });
  });
});
