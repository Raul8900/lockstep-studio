'use strict';
/* Scene 3 — PROOF: "How do we know? Apollo astronauts walked up there. They left mirrors behind.
   And we still fire lasers at them."
   Two shots in one scene: NASA's film of the Moon walk — the real thing, so it gets time: the line,
   then a held moment (the 1.2 s pause after the take in script.py) while it plays — then the mirror
   they left (a NASA photograph), with a laser beam from the sky landing on it.                    */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = { how: at('proof', 'how'), apollo: at('proof', 'apollo'), mirrors: at('proof', 'mirrors'), fire: at('proof', 'fire'), lasers: at('proof', 'lasers'), end: at('proof', 'them', 1, 't1') };
  const walk = useVideo('apollo-moonwalk', { from: 0, to: 4 });      // media/apollo-moonwalk.mp4 — NASA, public domain
  const mirror = useImage('retroreflector');                          // media/retroreflector.jpg — NASA, public domain
  const TARGET = [0.48, 0.40];                                         // the mirror array, as a point of the photograph (0..1)

  sfx(c.mirrors - 0.32, 'whoosh', 0.5);
  sfx(c.mirrors + 0.1, 'blip', 0.6);
  sfx(c.lasers - 0.05, 'zip', 0.7);
  sfx(c.lasers + 0.25, 'chime', 0.5);

  addScene('proof', function (ctx, t) {
    shots(ctx, t, [
      { at: 0, draw: (ctx, t, p, local) => film(ctx, walk, t - (c.how - 0.5), { dur: c.mirrors - c.how, move: 'in', focus: [0.5, 0.55] }) },
      { at: c.mirrors - 0.3, cut: 'flash', draw: (ctx, t, p) => {
        const pic = photo(ctx, mirror, tw(t, c.mirrors - 0.3, DATA.dur, E.lin), { from: { z: 1.15, x: 0.45, y: 0.5 }, to: { z: 1.7, x: TARGET[0], y: TARGET[1] + 0.04 }, ease: E.ioSine });
        if (!pic) return;
        const [tx, ty] = pic.at(TARGET[0], TARGET[1]);
        laser(ctx, t, tx, ty);
        pointer(ctx, tx, ty, tx - 60, ty + 330, 'MIRROR', { p: tw(t, c.mirrors, c.mirrors + 0.6, E.lin), size: 50, t });
      } },
    ], { end: DATA.dur });
  });

  /* a green beam out of the black sky onto the mirror, drawn on from the top as "lasers" is said */
  function laser(ctx, t, tx, ty) {
    const k = tw(t, c.lasers - 0.1, c.lasers + 0.25, E.out3);
    if (k <= 0) return;
    const sx = tx + 420, sy = -40, ex = lerp(sx, tx, k), ey = lerp(sy, ty, k);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (const [lw, a] of [[34, 0.12], [14, 0.35], [5, 0.95]]) {
      ctx.strokeStyle = rgba(COL.good, a); ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    }
    ctx.restore();
    if (k >= 1) glow(ctx, tx, ty, 120 * (1 + 0.15 * Math.sin(t * 22)), COL.good, 0.9);
  }
});
