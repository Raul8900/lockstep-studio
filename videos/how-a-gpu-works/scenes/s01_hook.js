'use strict';
/* Scene 1 — HOOK (0:00–0:08)
   "This chip has over twenty thousand cores. And not one of them can think
    for itself. That's exactly why it's so fast."
   Hero shot of the die in 2.5D. The lights first flicker independently, then
   snap into lock-step — the visual thesis of the whole video.               */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    twenty: at('hook', 'twenty'), cores: at('hook', 'cores'), coresEnd: at('hook', 'cores', 1, 't1'),
    and: at('hook', 'and'), one: at('hook', 'one'), think: at('hook', 'think'), itselfEnd: at('hook', 'itself', 1, 't1'),
    thats: at('hook', "that's"), fast: at('hook', 'fast'), fastEnd: at('hook', 'fast', 1, 't1'),
  };
  const sync0 = c.and + 0.1;                 // lights fall into step
  const beatLen = 0.46;                      // lock-step pulse period
  const burst = c.thats;

  sfx(0.02, 'boot', 1.0);
  sfx(0.3, 'count', 0.8, { dur: c.cores - 0.3 });
  sfx(c.cores, 'impact', 0.9);
  for (let k = 0; k < 5; k++) sfx(sync0 + k * beatLen, 'thump', 0.75 - k * 0.05);
  sfx(sync0 - 0.25, 'lock', 0.7);
  sfx(burst - 0.45, 'riser', 0.8, { dur: 0.45 });
  sfx(burst, 'whoosh', 1.0);
  sfx(c.fast, 'impact', 1.0);

  const P = new Proj({ cx: 540, cy: 900, scale: 1.1, yaw: -0.6, pitch: 1.0 });

  addScene('hook', function (ctx, t) {
    const m = tw(t, sync0 - 0.05, sync0 + 0.3, E.io3);           // 0 = independent, 1 = lock-step
    const k = Math.max(0, Math.floor((t - sync0) / beatLen));
    const beat = t < sync0 ? 0 : Math.exp(-((t - sync0) - k * beatLen) / 0.16);
    const b = tw(t, burst, burst + 0.5, E.out3);                  // speed burst
    const punch = pulse(t, burst + 0.05, 0.1, 0.9);

    /* slow continuous push-in + orbit */
    const drift = prog(t, 0, 8.6);
    P.set({ cx: 540, cy: lerp(930, 905, E.io2(drift)), scale: lerp(1.06, 1.2, E.out2(drift)) * (1 + 0.05 * punch),
      yaw: lerp(-0.74, -0.44, E.io2(drift)), pitch: lerp(1.03, 0.96, drift) });

    const power = 0.85 + 0.25 * b + 0.2 * beat * m;
    drawChip(ctx, P, t, {
      power,
      tile: (col, row) => {
        const id = row * 10 + col;
        const flick = hash(id * 3.3 + Math.floor(t * 9 + hash(id) * 9));                    // independent flicker
        const indep = 0.14 + 0.72 * flick * flick;
        const wave = Math.exp(-(((t - sync0) - k * beatLen) - row * 0.012) / 0.18);          // whole die together, top row first
        const locked = 0.2 + 0.8 * (t - sync0 - k * beatLen >= row * 0.012 ? wave : 0.12);
        return { l: lerp(indep, locked, m) * (1 + 0.5 * b), hex: COL.cyan };
      },
      pillars: (col, row) => {
        const id = row * 10 + col;
        if (hash(id * 7.7) > 0.46) return null;
        const indep = 22 + 82 * (0.5 + 0.5 * Math.sin(t * (2.2 + 5 * hash(id * 1.3)) + hash(id * 2.9) * TAU));
        const locked = 26 + 92 * beat;
        const hh = lerp(indep, locked, m) * (1 + 0.6 * b);
        return { h: hh, a: 0.55 + 0.45 * lerp(hash(id * 4.1), beat, m), hex: hash(id * 5.5) > 0.8 ? COL.violet : COL.cyan };
      },
    });

    /* shock ring on the die plane when the burst hits */
    const rp = prog(t, burst, burst + 0.9);
    if (rp > 0 && rp < 1) {
      const R = 60 + 330 * E.out3(rp);
      P.quad(ctx, -R, -R, R, R, 14);
      ctx.strokeStyle = rgba(COL.white, Math.pow(1 - rp, 2) * 0.9); ctx.lineWidth = 5 * (1 - rp) + 1; ctx.stroke();
    }
    streaks(ctx, t, { alpha: 0.75 * b * (1 - prog(t, c.fastEnd + 0.1, c.fastEnd + 0.7)), seed: 11, n: 44 });

    /* headline number */
    const cnt = Math.round(21760 * E.out4(prog(t, -0.7, c.cores + 0.05)));
    const numA = 1 - prog(t, burst + 0.15, burst + 0.6);
    const hit = pulse(t, c.cores + 0.05, 0.06, 0.6);
    withAlpha(ctx, numA, () => {
      text(ctx, fmt(cnt), 540, 530 - 6 * hit, { size: 176 + 10 * hit, weight: 900, family: F.disp, color: COL.amber, align: 'center', ls: -4 });
      /* "CORES" picks up quotation marks the moment the narration undercuts it */
      const q = tw(t, c.one - 0.1, c.one + 0.25, E.outBack);
      const coresW = measure(ctx, 'CORES', 60, 800, F.disp, 18);
      text(ctx, 'CORES', 540 + 9, 610, { size: 60, weight: 800, family: F.disp, color: COL.white, align: 'center', ls: 18 });
      if (q > 0) {
        text(ctx, '“', 540 - coresW / 2 - 26, 618, { size: 84 * q, weight: 900, family: F.disp, color: COL.coral, align: 'center' });
        text(ctx, '”', 540 + coresW / 2 + 24, 618, { size: 84 * q, weight: 900, family: F.disp, color: COL.coral, align: 'center' });
      }
      const s1 = 1 - prog(t, c.one - 0.2, c.one + 0.05);
      text(ctx, 'IN ONE CHIP  ·  GEFORCE RTX 5090', 540, 664, { size: 25, weight: 700, family: F.mono, color: COL.dim, align: 'center', ls: 3, alpha: s1 * prog(t, 0.5, 1.0) });
      riseText(ctx, 'NOT ONE THINKS FOR ITSELF', 540, 664, prog(t, c.think - 0.15, c.think + 0.2), { size: 27, weight: 800, family: F.mono, color: COL.coral, align: 'center', ls: 3, rise: 14 });
    });
    /* burst line replaces the number */
    const w2 = prog(t, burst + 0.2, burst + 0.55);
    if (w2 > 0) {
      const e = E.outBack(w2);
      withAlpha(ctx, clamp(w2 * 2), () => {
        ctx.save(); ctx.translate(540, 560); ctx.scale(lerp(0.7, 1, e), lerp(0.7, 1, e));
        text(ctx, 'THAT’S THE TRICK', 0, 0, { size: 88, weight: 900, family: F.disp, color: COL.white, align: 'center', ls: 1 });
        text(ctx, 'LOCKSTEP  →  SPEED', 0, 62, { size: 30, weight: 800, family: F.mono, color: COL.cyan, align: 'center', ls: 5 });
        ctx.restore();
      });
    }
  }, { type: 'fade' });
});
