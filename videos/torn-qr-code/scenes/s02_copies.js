'use strict';
/* Scene 2 — ATTEMPT 1: COPIES
   "So what's the rest? A backup copy? Smudge one letter, and the two copies disagree.
    Which one's right? Copies can't tell you. Reed-Solomon codes, from 1960, do something smarter."
   Two printed cards; a smudge turns STILL into STALL; the scanner hops between them; FAILED.
   Then the name of the better idea slams in. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    rest: at('copies', 'rest'),
    backup: at('copies', 'backup'),
    copy: at('copies', 'copy'),
    smudge: at('copies', 'smudge'),
    letter: at('copies', 'letter'),
    copies: at('copies', 'copies'),
    disagree: at('copies', 'disagree'),
    which: at('copies', 'which'),
    right: at('copies', 'right'),
    cant: at('copies', "can't"),
    you: at('copies', 'you'),
    rs: at('copies', 'reed-solomon'),
    from: at('copies', 'from'),
    year: at('copies', '1960'),
    smarter: at('copies', 'smarter'),
  };
  const S0 = beatOf('copies').t0 - 0.5;
  const leave = c.rs - 0.32;                         // the cards slide away just before the name
  const hops = [c.which - 0.05, c.which + 0.25, c.right - 0.02, c.right + 0.3];

  sfx(S0 - 0.05, 'slide', 0.45);
  sfx(c.backup - 0.06, 'blip', 0.45);
  sfx(c.copy + 0.12, 'stamp', 0.6);
  sfx(c.smudge - 0.05, 'splash', 0.55);
  sfx(c.letter - 0.04, 'flip', 0.5);
  sfx(c.disagree - 0.06, 'deny', 0.55);
  hops.forEach((h, i) => sfx(h, 'tick', 0.38, { pitch: 1 + (i % 2) * 0.15 }));
  sfx(c.you - 0.06, 'stamp', 0.65);
  sfx(leave, 'whoosh', 0.55);
  sfx(c.rs - 0.05, 'impact', 0.6);
  sfx(c.year - 0.05, 'count', 0.4, { dur: 0.45 });
  sfx(c.smarter + 0.1, 'chime', 0.6);

  addScene('copies', function (ctx, t) {
    const out = tw(t, leave, leave + 0.35, E.in3);        // the attempt leaves to the left
    const zoom = lerp(1, 1.06, tw(t, S0, leave, E.io2));

    if (out < 1) withCam(ctx, { fx: CX, fy: 800, zoom, dx: -W * 0.9 * out, dy: 6 * Math.sin(t * 0.9) }, () => {
      tagPill(ctx, 'ATTEMPT 1', CX, 452, COL.accent, 1);
      /* a marker swipe under the guess while the copy settles */
      const sw = tw(t, c.copy + 0.3, c.copy + 0.95, E.io3);
      if (sw > 0) { const wq = measure(ctx, 'A BACKUP COPY?', 80, 400, F.disp); highlighter(ctx, CX - wq / 2 - 6, 498, wq + 12, 76, COL.accent, sw, 0.35); }
      riseText(ctx, 'A BACKUP COPY?', CX, 560, tw(t, c.backup - 0.1, c.backup + 0.25), { size: 80, weight: 400, family: F.disp, color: COL.ink, align: 'center' });

      const drop = tw(t, c.copy - 0.08, c.copy + 0.3, E.outBack);
      const morph = tw(t, c.letter - 0.05, c.letter + 0.25);
      const shake = pulse(t, c.disagree, 0.04, 0.45);
      const yB = lerp(CC.yA, CC.yB, drop);
      const drift = 3 * Math.sin(t * 1.4);
      if (drop > 0) copyCard(ctx, yB + drift, 'COPY', COL.accent, { morph, smudge: tw(t, c.smudge - 0.06, c.smudge + 0.25), shake, alpha: clamp(drop * 3) });
      copyCard(ctx, CC.yA - drift, 'MESSAGE', COL.data, { shake: shake * 0.8 });

      /* the two copies disagree */
      const ne = tw(t, c.disagree - 0.06, c.disagree + 0.22, E.outBack);
      if (ne > 0) {
        const y = (CC.yA + CC.h + CC.yB) / 2;
        ctx.save(); ctx.translate(CX, y); ctx.scale(ne, ne);
        dot(ctx, 5, 5, 46, COL.ink, 0.9); dot(ctx, 0, 0, 46, COL.alert); ring(ctx, 0, 0, 46, COL.ink, 3);
        text(ctx, '≠', 0, 22, { size: 64, weight: 800, family: F.ui, color: COL.panel, align: 'center' });
        ctx.restore();
      }

      /* the scanner hops between them: which one is right? */
      const hopA = win(t, c.which - 0.25, c.you + 0.6, 0.15, 0.2);
      if (hopA > 0) {
        let k = 0; for (const h of hops) if (t >= h) k++;
        const onB = k % 2 === 1;
        const y0 = onB ? CC.yB : CC.yA;
        const jump = pulse(t, hops[Math.max(0, k - 1)], 0.02, 0.25);
        withAlpha(ctx, hopA, () => {
          brackets(ctx, CC.x, y0 + 4 * jump, CC.x + CC.w, y0 + CC.h, { p: 1, k: 0.4, col: COL.accent, loose: 18, lw: 7, arm: 46 });
          const q = 1 + 0.12 * jump;
          ctx.save(); ctx.translate(CC.x + CC.w - 6, y0 - 4); ctx.scale(q, q);
          dot(ctx, 4, 4, 30, COL.ink, 0.9); dot(ctx, 0, 0, 30, COL.accent);
          text(ctx, '?', 0, 14, { size: 42, weight: 800, family: F.ui, color: COL.panel, align: 'center' });
          ctx.restore();
        });
      }
      stampLabel(ctx, 'FAILED', CX + 150, 880, tw(t, c.you - 0.08, c.you + 0.18, E.lin), { col: COL.alert, size: 64, rot: -0.12 });
    });

    /* the better idea, by name */
    const name = tw(t, c.rs - 0.12, c.rs + 0.2, E.lin);
    if (name > 0) {
      const z2 = lerp(1, 1.05, prog(t, c.rs, beatOf('copies').t1 + 0.6));
      withCam(ctx, { fx: CX, fy: 800, zoom: z2 }, () => {
        tag(ctx, 'ATTEMPT 2', CX, 610, { align: 'center', color: COL.subject, alpha: tw(t, c.rs + 0.2, c.rs + 0.5), size: 28 });
        bigWord(ctx, 'REED–SOLOMON', CX, 740, name, { maxW: 900, max: 150, family: F.disp, weight: 400, color: COL.subject });
        riseText(ctx, 'IRVING REED  &  GUSTAVE SOLOMON', CX, 860, tw(t, c.rs + 0.35, c.rs + 0.7), { size: 30, weight: 700, family: F.mono, color: COL.ink, align: 'center', ls: 2 });
        const yr = tw(t, c.year - 0.25, c.year + 0.25, E.out3);
        if (yr > 0) {
          const n = Math.round(lerp(1900, 1960, yr));
          ctx.save(); ctx.translate(CX, 975); const s = 1 + 0.08 * pulse(t, c.year + 0.25, 0.04, 0.4); ctx.scale(s, s);
          text(ctx, String(n), 0, 0, { size: 104, weight: 400, family: F.disp, color: COL.accent, align: 'center', alpha: clamp(yr * 3) });
          ctx.restore();
        }
        const ul = tw(t, c.smarter - 0.1, c.smarter + 0.35, E.out3);
        if (ul > 0) {
          const w = 760;
          fillRR(ctx, CX - w / 2 + 6, 1038 + 6, w * ul, 12, 3, COL.ink);
          fillRR(ctx, CX - w / 2, 1038, w * ul, 12, 3, COL.subject);
        }
      });
    }
  }, { type: 'slideLeft' });
});
