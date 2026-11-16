'use strict';
/* =====================================================================
   components.js — the anatomy plate: the body, the bloodstream route, the
   organs and the enzyme factories. Shared by every scene of this video.
   Pure functions of their arguments: no Math.random(), no Date, no state
   carried between frames. Coordinates are in the 1080 x 1920 frame.
   Roles: ink = the body; subject = the drug and its route; accent = the
   enzyme factories and the prostaglandin marks (inflamed tissue, numbers);
   data = organs; alert = costs and limits; good = relief.
   ===================================================================== */

// Half of the body outline (front view): from the neck, down the left side,
// to the centre line at the crotch. The right half is its mirror image.
const ANAT_LEFT = [
  [512, 540], [468, 556], [438, 578], [418, 630], [400, 720], [384, 820], [372, 900],
  [404, 910], [420, 826], [434, 740], [452, 672], [462, 748], [458, 840], [456, 930],
  [460, 1000], [470, 1070], [482, 1130], [488, 1176], [480, 1200], [512, 1204],
  [530, 1190], [534, 1130], [538, 1060], [540, 1000]
];
const ANAT_RIGHT = ANAT_LEFT.map(function (p) { return [1080 - p[0], p[1]]; });
const ANAT_HEAD = { x: 540, y: 470, r: 64 };

// Places on the body.
const ANAT_AT = {
  ankle:   { x: 486, y: 1168 },   // the sprained ankle (the left leg)
  ankleR:  { x: 594, y: 1168 },   // the other ankle
  stomach: { x: 506, y: 735 },
  kidneyL: { x: 500, y: 842 },
  kidneyR: { x: 580, y: 842 },
  head:    { x: 540, y: 440 }
};

// The bloodstream route: a single loop around the whole body (an ellipse).
const ANAT_LOOP = (function () {
  const pts = [];
  for (let i = 0; i <= 180; i++) {
    const a = -Math.PI / 2 + (i / 180) * Math.PI * 2;
    pts.push([540 + 300 * Math.cos(a), 796 + 414 * Math.sin(a)]);
  }
  return pts;
})();
const ANAT_LOOP_LEN = polyLen(ANAT_LOOP);

// The point on the route at fraction f of its length (wraps around).
function anatOnLoop(f) {
  const g = ((f % 1) + 1) % 1;
  return polyAt(ANAT_LOOP, g * ANAT_LOOP_LEN);
}

// The body outline, drawn on with progress p (0..1).
function anatBody(ctx, p, alpha) {
  if (alpha <= 0) return;
  withAlpha(ctx, alpha, function () {
    polyline(ctx, ANAT_LEFT, COL.ink, 3.2, clamp(p), 1);
    polyline(ctx, ANAT_RIGHT, COL.ink, 3.2, clamp(p), 1);
    ctx.strokeStyle = COL.ink;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(ANAT_HEAD.x, ANAT_HEAD.y, ANAT_HEAD.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(p), false);
    ctx.stroke();
  });
}

// The route: a dashed thin line, plus an optional translucent band (the blood).
function anatRoute(ctx, alpha, band) {
  if (alpha <= 0) return;
  withAlpha(ctx, alpha, function () {
    if (band > 0) polyline(ctx, ANAT_LOOP, COL.subject, 28, 1, band);
    polyline(ctx, ANAT_LOOP, COL.subject, 2.2, 1, 0.55, [7, 9]);
  });
}

// Drug molecules moving round the route: n dots, speed in loops per second.
function anatDrug(ctx, t, n, rate, phase, r, alpha) {
  if (alpha <= 0) return;
  for (let k = 0; k < n; k++) {
    const q = anatOnLoop(k / n + rate * t + phase);
    dot(ctx, q[0], q[1], r, COL.subject, alpha);
  }
}

// An enzyme factory (COX): a small machine with two chimneys.
function anatFactory(ctx, x, y, s, color, alpha) {
  if (alpha <= 0) return;
  withAlpha(ctx, alpha, function () {
    const h = s * 0.6;
    strokeRR(ctx, x - s / 2, y - h / 2, s, h, 3, color, 2.6);
    strokeRR(ctx, x - s * 0.28, y - h / 2 - s * 0.32, s * 0.18, s * 0.34, 2, color, 2.6);
    strokeRR(ctx, x + s * 0.1, y - h / 2 - s * 0.32, s * 0.18, s * 0.34, 2, color, 2.6);
    dot(ctx, x, y, s * 0.14, color, 1);
  });
}

// The block: a bar laid across a factory (drawn on with progress p).
function anatBlock(ctx, x, y, s, p, alpha) {
  if (p <= 0 || alpha <= 0) return;
  const half = s * 0.85 * clamp(p);
  line(ctx, x - half, y, x + half, y, COL.subject, 5, clamp(p) * alpha);
}

// The stomach (a J-shaped outline) in a given colour.
const ANAT_STOMACH = [[492, 700], [530, 696], [552, 716], [548, 748], [530, 768], [506, 774], [490, 758], [494, 728], [492, 700]];
function anatStomach(ctx, alpha, color, lw) {
  if (alpha <= 0) return;
  polyline(ctx, ANAT_STOMACH, color, lw, 1, alpha);
}

// The stomach's protective lining, as an arc on its left (drawn on with p).
function anatShield(ctx, p, color, lw, alpha) {
  if (p <= 0 || alpha <= 0) return;
  withAlpha(ctx, alpha, function () {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(521, 736, 52, Math.PI * 0.55, Math.PI * (0.55 + clamp(p)), false);
    ctx.stroke();
  });
}

// The kidneys as two bean outlines.
function anatKidneys(ctx, alpha, color, lw) {
  if (alpha <= 0) return;
  withAlpha(ctx, alpha, function () {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.ellipse(ANAT_AT.kidneyL.x, ANAT_AT.kidneyL.y, 18, 26, 0.3, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(ANAT_AT.kidneyR.x, ANAT_AT.kidneyR.y, 18, 26, -0.3, 0, TAU);
    ctx.stroke();
  });
}

// Blood flow into each kidney. It slows after tCut (the drug cuts the flow).
const ANAT_KIDNEY_PATH_L = [[540, 760], [520, 800], [504, 828]];
const ANAT_KIDNEY_PATH_R = ANAT_KIDNEY_PATH_L.map(function (p) { return [1080 - p[0], p[1]]; });
function anatFlowPhase(t, tCut, slow) {
  if (t <= tCut) return 0.5 * t;
  const k = clamp((t - tCut) / 0.5);
  return 0.5 * tCut + 0.5 * (t - tCut) * (1 - slow * (0.5 + 0.5 * k));
}
function anatFlowDots(ctx, path, phase, n, color, r, alpha) {
  if (alpha <= 0) return;
  const L = polyLen(path);
  for (let k = 0; k < n; k++) {
    const f = ((k / n + phase) % 1 + 1) % 1;
    const q = polyAt(path, f * L);
    dot(ctx, q[0], q[1], r, color, alpha);
  }
}

// A soft warm glow (the inflamed, hurt tissue).
function anatGlow(ctx, x, y, r, a) {
  if (a > 0) glow(ctx, x, y, r, COL.accent, a);
}

// The nerves round the sore ankle: short paths that thicken when sensitised.
const ANAT_NERVES = [
  [[420, 1120], [404, 1148], [392, 1186]],
  [[552, 1120], [568, 1148], [582, 1186]],
  [[446, 1076], [428, 1052], [416, 1024]],
  [[526, 1076], [544, 1052], [554, 1024]]
];

// The factories used across the video: the sore ankle's three, plus one each
// for the stomach, both kidneys, the head and the other ankle.
const ANAT_FACTORIES_ANKLE = [[466, 1110], [506, 1110], [486, 1150]];
const ANAT_FACTORIES_ORGANS = [
  { x: 540, y: 744 },
  { x: ANAT_AT.kidneyL.x, y: ANAT_AT.kidneyL.y + 40 },
  { x: ANAT_AT.kidneyR.x, y: ANAT_AT.kidneyR.y + 40 },
  { x: ANAT_AT.head.x, y: ANAT_HEAD.y + 0 },
  ANAT_AT.ankleR
];

// Prostaglandin marks thrown off by the factories: a fixed set of 12 whose
// spread is a pure function of their index i.
function anatMarkPos(i, grow) {
  const src = ANAT_FACTORIES_ANKLE[i % 3];
  const a = hash(i + 1) * TAU;
  const d = (30 + 74 * hash(i + 7)) * clamp(grow);
  return [src[0] + Math.cos(a) * d, src[1] + Math.sin(a) * d];
}

// A quadratic curve from a to b, bent by a control point c (for the myth route).
function anatCurve(a, c, b, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    pts.push([
      (1 - s) * (1 - s) * a[0] + 2 * (1 - s) * s * c[0] + s * s * b[0],
      (1 - s) * (1 - s) * a[1] + 2 * (1 - s) * s * c[1] + s * s * b[1]
    ]);
  }
  return pts;
}

// Idle motion for every scene: a slow push-in across its beat plus a gentle breathing of
// the whole picture about the body's centre, so no pause is a still frame.
function anatScene(id, draw) {
  return function (ctx, t) {
    const b = beatOf(id);
    const k = prog(t, b.t0 - 0.5, b.t1 + 0.5);
    const z = (1 + 0.035 * k) * (1 + 0.012 * Math.sin(TAU * t / 2.8));
    withCam(ctx, { fx: 540, fy: 800, zoom: z }, function () { draw(ctx, t); });
  };
}
