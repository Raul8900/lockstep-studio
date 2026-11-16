'use strict';
/* Scene 5 — THE REAL CODE
   "A QR code does the same trick, with bytes. This one has twenty-six bytes. Nine are your
    message. Seventeen are extra points. At two per liar, it can fix any eight. About thirty
    percent. That's why a logo can sit in the middle. It's damage, on purpose."
   The intact hero code; its 26 codewords drawn as their real 8-module bricks (standard zig-zag
   placement); 9 orange + 17 blue; any 8 can be wrong; then a logo plate stamped on top. */
(window.SCENE_DEFS = window.SCENE_DEFS || []).push(function () {
  const c = {
    qr: at('bytes', 'qr'),
    same: at('bytes', 'same'),
    bytes: at('bytes', 'bytes'),
    this: at('bytes', 'this'),
    n26: at('bytes', 'twenty-six'),
    bytes2: at('bytes', 'bytes', 2),
    nine: at('bytes', 'nine'),
    message: at('bytes', 'message'),
    seventeen: at('bytes', 'seventeen'),
    extra: at('bytes', 'extra'),
    points: at('bytes', 'points'),
    two: at('bytes', 'two'),
    liar: at('bytes', 'liar'),
    fix: at('bytes', 'fix'),
    eight: at('bytes', 'eight'),
    thirty: at('bytes', 'thirty'),
    percent: at('bytes', 'percent'),
    thats: at('bytes', "that's"),
    logo: at('bytes', 'logo'),
    middle: at('bytes', 'middle'),
    damage: at('bytes', 'damage'),
    purpose: at('bytes', 'purpose'),
    on: at('bytes', 'on'),
  };
  const S0 = beatOf('bytes').t0 - 0.5;
  const ST = { cx: 540, cy: 708, m: 25 };
  const half = (QN / 2 + QS) * ST.m;
  const BX = [ST.cx - half, ST.cy - half, ST.cx + half, ST.cy + half];
  const RED = [1, 4, 8, 11, 14, 17, 21, 24];                       // any eight: spread over the code
  const LOGO_CW = QRM.damage.logo.changed_codewords;               // the bricks the logo plate hides
  const countT = (k) => c.this + (c.n26 + 0.25 - c.this) * (1 - Math.pow(0.86, k + 1)) / (1 - Math.pow(0.86, 26));
  const plain = c.thats - 0.25;                                    // bricks fade back to a plain code

  sfx(S0 + 0.02, 'stamp', 0.5);
  sfx(c.bytes - 0.05, 'slide', 0.35, { dur: 0.5 });
  sfx(c.this, 'count', 0.42, { dur: c.n26 + 0.25 - c.this });
  sfx(c.bytes2 - 0.05, 'stamp', 0.5);
  sfx(c.nine - 0.06, 'stamp', 0.5);
  sfx(c.seventeen - 0.35, 'riser', 0.35, { dur: 0.3 });
  sfx(c.seventeen - 0.05, 'stamp', 0.55);
  sfx(c.fix - 0.08, 'deny', 0.4);
  sfx(c.thirty - 0.06, 'impact', 0.55);
  sfx(c.percent + 0.25, 'chime', 0.45);
  sfx(c.logo - 0.06, 'stamp', 0.6);
  sfx(c.middle - 0.04, 'lock', 0.45);
  sfx(c.middle + 0.25, 'chime', 0.45);
  sfx(c.damage - 0.06, 'flip', 0.4);
  sfx(c.on - 0.05, 'stamp', 0.55);

  addScene('bytes', function (ctx, t) {
    const zoom = lerp(1, 1.04, tw(t, S0, beatOf('bytes').t1 + 0.4, E.io2));
    const hitN = pulse(t, c.thirty, 0.03, 0.35), hitL = pulse(t, c.logo, 0.03, 0.3);

    const outline = tw(t, c.bytes - 0.1, c.bytes + 0.4) * (1 - tw(t, plain, plain + 0.4));
    const redOn = (i) => tw(t, c.fix - 0.1 + i * 0.045, c.fix + 0.1 + i * 0.045);
    const heal = tw(t, c.thirty - 0.05, c.thirty + 0.35);
    const fade = 1 - tw(t, plain, plain + 0.45);
    const see = tw(t, c.damage - 0.1, c.damage + 0.2);
    const bricks = (k) => {
      let col = COL.ink, a = 0;
      if (k < 9) { a = tw(t, c.nine - 0.1 + k * 0.04, c.nine + 0.15 + k * 0.04); col = COL.data; }
      else { a = tw(t, c.seventeen - 0.1 + (k - 9) * 0.025, c.seventeen + 0.15 + (k - 9) * 0.025); col = COL.subject; }
      a *= fade;
      const ri = RED.indexOf(k);
      if (ri >= 0) { const r = redOn(ri) * (1 - heal); if (r > 0) { col = mixToHex(col, COL.alert, r); a = Math.max(a, r); } }
      if (see > 0 && LOGO_CW.includes(k)) { col = COL.alert; a = Math.max(a, see); }
      const flash = pulse(t, countT(k), 0.02, 0.25);
      return { c: col, a, o: Math.max(outline, see * (LOGO_CW.includes(k) ? 1 : 0)), oc: flash > 0.05 ? COL.accent : (ri >= 0 && redOn(ri) * (1 - heal) > 0.5 ? COL.alert : COL.ink), ow: 3 + 3 * flash };
    };

    withCam(ctx, { fx: CX, fy: 760, zoom: zoom + 0.025 * hitN + 0.02 * hitL, dx: 5 * hitL * Math.sin(t * 90) }, () => {
      drawSticker(ctx, {
        cx: ST.cx, cy: ST.cy + 3 * Math.sin(t * 1.1), m: ST.m, rot: 0.004 * Math.sin(t * 0.9),
        bricks, logo: tw(t, c.logo - 0.08, c.logo + 0.22, E.lin), logoSee: see,
      });
      /* crosses on the eight "liars" */
      for (let i = 0; i < RED.length; i++) {
        const r = redOn(i) * (1 - heal);
        if (r <= 0.02) continue;
        const [x, y] = qScreen(ST.cx, ST.cy, ST.m, QCW_C[RED[i]][0], QCW_C[RED[i]][1]);
        cross(ctx, x, y, 11, COL.panel, r, 7); cross(ctx, x, y, 11, COL.alert, r, 4);
      }
      const lockK = tw(t, c.middle - 0.1, c.middle + 0.2, E.outBack);
      brackets(ctx, BX[0], BX[1], BX[2], BX[3], { p: 1, k: lockK, col: lockK > 0.5 ? COL.good : COL.subject, loose: 26, lw: 8, arm: 64 });
      stampLabel(ctx, 'ON PURPOSE', 730, 925, tw(t, c.on - 0.08, c.on + 0.18, E.lin), { col: COL.accent, size: 48, rot: -0.1 });
    });

    /* the numbers under the code */
    const yA = 1098, yB = 1166;
    const honest = win(t, c.same - 0.1, c.this - 0.15, 0.25, 0.2);
    if (honest > 0) text(ctx, 'SAME RULE · BYTE ARITHMETIC · NO PICTURE', CX, yA - 8, { size: 26, weight: 700, family: F.mono, color: COL.subject, align: 'center', ls: 1.5, alpha: honest });
    const sA = win(t, c.this - 0.05, c.fix - 0.15, 0.1, 0.15);
    if (sA > 0) {
      let k = 0; for (let i = 0; i < 26; i++) if (t >= countT(i)) k = i + 1;
      const s = 1 + 0.06 * pulse(t, c.n26 + 0.25, 0.04, 0.4);
      ctx.save(); ctx.translate(CX, yA); ctx.scale(s, s);
      text(ctx, `${k} BYTES`, 0, 18, { size: 66, weight: 400, family: F.disp, color: COL.accent, align: 'center', alpha: sA });
      ctx.restore();
    }
    const sB = win(t, c.fix - 0.15, plain, 0.12, 0.3);
    if (sB > 0) {
      const big = tw(t, c.thirty - 0.08, c.thirty + 0.2, E.outBack);
      const s = lerp(1, 1.12, big) + 0.05 * hitN;
      ctx.save(); ctx.translate(CX, yA); ctx.scale(s, s);
      const str = big > 0.02 ? 'ANY 8 OF 26 ≈ 30%' : 'FIX ANY 8';
      text(ctx, str, 0, 18, { size: 62, weight: 400, family: F.disp, color: big > 0.02 ? COL.accent : COL.alert, align: 'center', alpha: sB });
      ctx.restore();
      const why = tw(t, c.two - 0.1, c.liar + 0.2);
      text(ctx, '17 EXTRA ÷ 2 PER LIAR → 8', CX, yB + 12, { size: 28, weight: 700, family: F.mono, color: COL.subject, align: 'center', ls: 1.5, alpha: why * sB });
    }
    const leg = win(t, c.nine - 0.1, c.two - 0.2, 0.2, 0.2);
    if (leg > 0) {
      const l9 = tw(t, c.nine - 0.1, c.nine + 0.2), l17 = tw(t, c.seventeen - 0.1, c.seventeen + 0.2);
      const a = '9 MESSAGE', b = '  +  ', d = '17 EXTRA POINTS', o = { size: 30, weight: 700, family: F.mono, ls: 1.5 };
      const wa = measure(ctx, a, 30, 700, F.mono, 1.5), wb = measure(ctx, b, 30, 700, F.mono, 1.5), wd = measure(ctx, d, 30, 700, F.mono, 1.5);
      const x0 = CX - (wa + wb + wd) / 2;
      riseText(ctx, a, x0, yB + 12, l9 * leg, Object.assign({ color: COL.data }, o));
      riseText(ctx, b, x0 + wa, yB + 12, l17 * leg, Object.assign({ color: COL.dim }, o));
      riseText(ctx, d, x0 + wa + wb, yB + 12, l17 * leg, Object.assign({ color: COL.subject }, o));
    }
    readout(ctx, CX, yA, 'STILL HERE', true, tw(t, c.middle - 0.05, c.middle + 0.3, E.lin) * (1 + 0.02 * Math.sin(t * 4)));
  }, { type: 'cut' });
});
