'use strict';
/* Scene 2 — THE OLD TEST
   "For years, the test was reading wobbly letters. In twenty thirteen, Google said its risk analysis covers
   everything you do around a challenge, not only the answer you type. In twenty fourteen, the checkbox
   arrived, and many people passed with one click."

   A: the old challenge, a card of distorted letters (coral: friction).
   B: the card shrinks to the middle of a ring of signal dots; the typed answer is one dot among them.
   C: the checkbox arrives, many ticks land, one click.                                                      */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    years: at('old', 'years'),
    wobbly: at('old', 'wobbly'),
    inTwenty: at('old', 'in'),
    everything: at('old', 'everything'),
    around: at('old', 'around'),
    answer: at('old', 'answer'),
    fourteen: at('old', '2014'),
    many: at('old', 'many'),
    one: at('old', 'one'),
    click: at('old', 'click'),
  };
  const CARD = { cx: 540, cy: 720, w: 700, h: 250 };
  const LETTERS = ['R', '7', 'k', 'Q', '2'];
  const N_SIG = 22;

  sfx(c.years, 'tick', 0.4);
  sfx(c.wobbly, 'deny', 0.35);
  sfx(c.everything, 'pop', 0.5);
  for (let k = 0; k < N_SIG; k++) sfx(c.everything + 0.02 + k * 0.03, 'tick', 0.32, { pitch: 1 + (k % 5) * 0.05 });
  sfx(c.answer, 'blip', 0.6);
  sfx(c.fourteen, 'stamp', 0.7);
  for (let k = 0; k < 12; k++) sfx(c.many + k * 0.035, 'tick', 0.35);
  sfx(c.click, 'lock', 0.9);

  addScene('old', function (ctx, t) {
    ambient(ctx, t);
    /* ---- A and B: the card, then the ring of signals ---- */
    const gAB = 1 - tw(t, c.fourteen - 0.5, c.fourteen - 0.05);       // leaves before the checkbox arrives
    const s = lerp(1, 0.56, tw(t, c.inTwenty, c.inTwenty + 0.5, E.io3)); // shrinks as "in twenty thirteen" is said
    const cx = CARD.cx, cy = CARD.cy;
    withAlpha(ctx, gAB, () => {
      const w = CARD.w * s, h = CARD.h * s;
      panel(ctx, cx - w / 2, cy - h / 2, w, h, { r: 26 * s, accent: COL.coral, accentA: 0.85 });
      LETTERS.forEach((ch, i) => {
        const x = cx + (i - 2) * 96 * s;
        const y = cy - 26 * s + Math.sin(t * 2.3 + i * 1.7) * 6 * s;
        ctx.save();
        ctx.translate(x, y); ctx.rotate(Math.sin(t * 1.7 + i) * 0.18);
        text(ctx, ch, 0, 0, { size: 124 * s, weight: 900, family: F.disp, color: COL.coral, align: 'center', base: 'middle' });
        ctx.restore();
      });
      const iy = cy + 98 * s;                                          // the answer field
      fillRR(ctx, cx - 230 * s, iy - 42 * s, 460 * s, 84 * s, 16 * s, rgba(COL.lineHi, 0.55));
      if (Math.floor(t * 2) % 2 === 0) line(ctx, cx - 200 * s, iy - 22 * s, cx - 200 * s, iy + 22 * s, COL.white, 3);
      tag(ctx, 'TYPE THE LETTERS', cx, cy - 160 * s, { align: 'center', color: COL.dim, alpha: prog(t, c.years - 0.2, c.years + 0.3) });

      /* B: the signals orbit the challenge; the typed answer is one dot among them */
      const dim = 1 - 0.55 * prog(t, c.answer - 0.5, c.answer + 0.2);
      for (let k = 0; k < N_SIG; k++) {
        const a0 = tw(t, c.everything + 0.02 + k * 0.03, c.everything + 0.27 + k * 0.03, E.outBack);
        if (a0 <= 0) continue;
        const ang = (k * TAU) / N_SIG + t * 0.05;
        const R = (240 + 26 * hash(k)) * lerp(0.9, 1, a0);
        dot(ctx, cx + Math.cos(ang) * R, cy + Math.sin(ang) * R, (7 + 3 * hash(k + 9)) * clamp(a0), COL.violet, clamp(a0) * dim);
      }
      riseText(ctx, 'AROUND THE CHALLENGE', 540, 430, prog(t, c.around, c.around + 0.3), { size: 40, weight: 900, family: F.mono, color: COL.violet, align: 'center', ls: 3 });
      const ap = prog(t, c.answer, c.answer + 0.3);
      ring(ctx, cx, iy, 62 + 6 * pulse(t, c.answer, 0.08, 0.5), COL.white, 4, ap);
      riseText(ctx, 'ANSWER', 540, 1110, prog(t, c.answer, c.answer + 0.3), { size: 30, weight: 800, family: F.mono, color: COL.white, align: 'center', ls: 3 });
    });

    /* ---- C: the checkbox arrives; many pass; one click ---- */
    const inBox = tw(t, c.fourteen - 0.05, c.fourteen + 0.35, E.outBack);
    if (inBox > 0) {
      const size = 240 * lerp(0.82, 1, clamp(inBox));
      const hot = prog(t, c.click - 0.05, c.click + 0.3);
      glow(ctx, 540, 760, 320, COL.cyan, (0.12 + 0.10 * Math.sin(t * 1.6)) * inBox);   // the waiting box breathes
      drawBox(ctx, 540, 760, size, { p: tw(t, c.click - 0.05, c.click + 0.35, E.out3), hot, alpha: clamp(inBox * 1.5) });
      const cr = prog(t, c.click, c.click + 0.55);
      if (cr > 0 && cr < 1) ring(ctx, 540, 760, 60 + 140 * E.out3(cr), COL.cyan, 6 * (1 - cr) + 1, (1 - cr) * 0.9);
      for (let k = 0; k < 12; k++) {
        const col = k % 4, row = Math.floor(k / 4);
        check(ctx, 300 + col * 160, 960 + row * 66, 34, COL.mint, prog(t, c.many + k * 0.035, c.many + k * 0.035 + 0.25), 6);
      }
      riseText(ctx, 'MANY PASSED', 540, 1180, prog(t, c.many, c.many + 0.3), { size: 26, weight: 800, family: F.mono, color: COL.white, align: 'center', ls: 3 });
      riseText(ctx, 'ONE CLICK', 540, 470, prog(t, c.one, c.one + 0.3), { size: 60, weight: 900, family: F.disp, color: COL.white, align: 'center' });
    }
  }, { type: 'zoomIn', fx: 540, fy: 760, z: 2.2 });
});
