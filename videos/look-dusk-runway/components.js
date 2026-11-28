'use strict';
/* =====================================================================
   components.js — a narrow-body twin-jet airliner and an airfield at dusk, built in code for a film
   world (engine/anim/js/film3d.js). No downloaded models, no generated imagery.

   The aircraft's shape is measured, not guessed: every station below was read off three-view
   reference drawings of a common narrow-body (A320 class) and checked against its published
   dimensions (length 37.6 m, span 35.8 m with sharklets, fuselage 3.95 m wide and 4.14 m tall,
   wheelbase 12.6 m, track 7.6 m). The look is clean and stylised: matt paint, a simple livery,
   no rivets, no grime, no clear coat.

   Coordinates: the drawings measure x aft from the middle of the fuselage and y up from its axis
   line; here z points forward, y up from the runway, and the main gear sits at z = 0.

     const ac = await airliner(T, w, { … })    ac.object, ac.pose(state)
     const af = await airfield(T, w, { … })    runway, grass, lights, signs, the far landscape
   ===================================================================== */

const XR = (xr) => -xr - 1.13;       // drawing station (m aft) → z forward of the main gear
const YR = (yr) => yr + 4.39;        // drawing height → height above the runway

/* NACA 4-digit section, x 0..1 along the chord → [upper, lower] height / chord */
function naca(x, th, cam) {
  const yt = 5 * th * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4);
  const p = 0.4, yc = x < p ? cam / (p * p) * (2 * p * x - x * x) : cam / ((1 - p) ** 2) * ((1 - 2 * p) + 2 * p * x - x * x);
  return [yc + yt, yc - yt];
}

/* the wing's planform, in drawing coordinates: span s (m from the centreline) → leading edge x,
   chord, chord-line height, thickness. Root LE x −6.98 (hidden in the body), −5.95 at the body side
   (s 2), a straight unswept trailing edge at x 0.1 out to the kink (s 6.4), the tip at s 16.3 */
const WING = [
  { s: 0, x: -6.98, c: 7.08, y: -1.30, th: 0.15 },
  { s: 2.0, x: -5.95, c: 6.05, y: -1.30, th: 0.15 },
  { s: 6.4, x: -3.67, c: 3.77, y: -0.81, th: 0.135 },
  { s: 16.3, x: 1.45, c: 1.60, y: 0.30, th: 0.11 },
];
const WCAM = 0.022;
function wingAt(s) {
  let i = 0; while (i < WING.length - 2 && s > WING[i + 1].s) i++;
  const p = WING[i], q = WING[i + 1], k = Math.min(1, Math.max(0, (s - p.s) / (q.s - p.s)));
  const L = (a, b) => a + (b - a) * k;
  return { x: L(p.x, q.x), c: L(p.c, q.c), y: L(p.y, q.y), th: L(p.th, q.th) };
}
/* a point on the wing's skin: span s, chord fraction xc, upper or lower → [x, y] in drawing coordinates */
function wingSkin(s, xc, upper) { const W = wingAt(s), a = naca(xc, W.th, WCAM); return [W.x + xc * W.c, W.y + (upper ? a[0] : a[1]) * W.c]; }

/* GLSL shared by the paint shaders: a rounded box's distance, and an antialiasing width */
const AC_GLSL = /* glsl */`
float sdRBox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
float aaw(float d){ return max(fwidth(d), 0.004); }
`;

async function airliner(T, w, o = {}) {
  const root = new T.Group(); w.scene.add(root);
  const body = new T.Group(); root.add(body);

  /* ---------- the fuselage, lofted through measured sections (x, top, bottom, half-width, height of
     the widest point). The nose is blunt and rises to the windscreen, the belly deepens under the wing
     box, the tail cone sweeps up ---------- */
  const SECTIONS = [
    [-18.80, -0.86, -0.86, 0.00, -0.86], [-18.75, -0.66, -1.07, 0.20, -0.86], [-18.50, -0.33, -1.36, 0.49, -0.82],
    [-18.25, -0.13, -1.53, 0.68, -0.80], [-18.00, 0.01, -1.64, 0.83, -0.77], [-17.75, 0.14, -1.73, 0.97, -0.74],
    [-17.50, 0.26, -1.81, 1.10, -0.70], [-17.25, 0.50, -1.87, 1.21, -0.66], [-17.00, 0.74, -1.92, 1.32, -0.62],
    [-16.50, 1.14, -2.00, 1.52, -0.56], [-16.00, 1.37, -2.07, 1.64, -0.49], [-15.50, 1.54, -2.12, 1.75, -0.44],
    [-15.00, 1.66, -2.17, 1.83, -0.38], [-14.00, 1.82, -2.24, 1.91, -0.28], [-13.00, 1.895, -2.276, 1.976, -0.18],
    [-12.00, 1.92, -2.28, 1.99, -0.10], [-7.50, 1.92, -2.28, 1.99, -0.10], [-5.50, 1.92, -2.47, 1.99, -0.10],
    [0.50, 1.92, -2.47, 1.99, -0.10], [2.50, 1.92, -2.28, 1.99, -0.10], [7.00, 1.92, -2.28, 1.99, -0.10],
    [8.00, 1.916, -2.064, 1.967, -0.01], [9.00, 1.905, -1.927, 1.917, 0.05], [10.00, 1.884, -1.759, 1.822, 0.13],
    [11.00, 1.84, -1.555, 1.70, 0.20], [12.00, 1.78, -1.34, 1.57, 0.27], [13.00, 1.72, -1.11, 1.38, 0.33],
    [14.00, 1.66, -0.86, 1.20, 0.40], [15.00, 1.60, -0.60, 1.00, 0.50], [16.00, 1.55, -0.36, 0.85, 0.60],
    [17.00, 1.50, -0.05, 0.72, 0.74], [17.50, 1.447, 0.13, 0.60, 0.79], [18.00, 1.344, 0.31, 0.48, 0.83],
    [18.50, 1.218, 0.49, 0.35, 0.85], [18.80, 1.00, 0.70, 0.12, 0.85],
  ];
  const fairing = (x) => Math.max(0, Math.min(1, (x + 10) / 3, (5 - x) / 3));   // the wing-to-body fairing's wider belly
  const fusGeo = w.loft(SECTIONS.map(([x, top, bot, hw, yw]) => ({ z: XR(x), top: YR(top), bot: YR(bot), hw, yw: YR(yw), e: 2.15, eb: 2.15 + 0.9 * fairing(x) })), { samples: 320, segments: 144 });
  const paint = w.surface({
    color: '#ffffff', roughness: 0.42, metalness: 0, bump: 0, key: 'fuselage',
    glsl: {
      pars: AC_GLSL,
      albedo: /* glsl */`
        float xr = -L.z - 1.13, yr = L.y - 4.39, sd = abs(L.x);
        vec3 white = vec3(0.80), grey = vec3(0.32, 0.335, 0.36), navy = vec3(0.012, 0.03, 0.095), orange = vec3(0.90, 0.33, 0.04);
        base = white; rough = 0.42;
        /* a grey belly, and the fin's navy sweeping down over the tail cone with an orange edge */
        float a1 = aaw(yr);
        base = mix(base, grey, smoothstep(-1.0 + a1, -1.0 - a1, yr));
        float sw = 1.95 - 0.30 * (xr - 9.5);
        base = mix(base, orange, smoothstep(sw - 0.22 - a1, sw - 0.22 + a1, yr));
        base = mix(base, navy, smoothstep(sw - 0.12 - a1, sw - 0.12 + a1, yr));
        /* cabin windows: one row a side, 0.23 by 0.33 m on a 0.533 m pitch */
        float u = (xr + 12.9) / 0.533, k = floor(u + 0.5), fx = (u - k) * 0.533;
        float dw = sdRBox(vec2(fx, yr - 0.40), vec2(0.115, 0.165), 0.07);
        float row = step(-0.5, k) * step(k, 42.5) * step(0.8, sd);
        float win = row * smoothstep(aaw(dw), -aaw(dw), dw);
        base = mix(base, vec3(0.022, 0.03, 0.04), win); rough = mix(rough, 0.12, win);
        /* doors, front and rear: an outline and a small window */
        for (int i = 0; i < 2; i++) {
          vec2 c = i == 0 ? vec2(-13.78, 0.49) : vec2(10.86, 0.535); vec2 hb = i == 0 ? vec2(0.50, 1.07) : vec2(0.48, 1.115);
          float dd = sdRBox(vec2(xr, yr) - c, hb, 0.16);
          float ln = smoothstep(0.014 + aaw(dd), 0.014, abs(dd)) * step(0.8, sd);
          base *= 1.0 - 0.55 * ln;
          float dwn = length(vec2(xr, yr) - (c + vec2(0.0, 0.55))) - 0.11;
          float wn = smoothstep(aaw(dwn), -aaw(dwn), dwn) * step(0.8, sd);
          base = mix(base, vec3(0.022, 0.03, 0.04), wn); rough = mix(rough, 0.12, wn);
        }
        /* the flight deck windows: the windscreen and two side windows a side, between x −17.41 and
           −15.51, over a sill at 0.22 m, the rear top corner cut back */
        float wtop = 0.82 - max(0.0, xr + 15.75) * 0.6;
        float dws = min(min(xr + 17.41, -15.51 - xr), min(yr - 0.22, wtop - yr));
        float glass = smoothstep(-aaw(dws), aaw(dws), dws - 0.035);
        float frame = smoothstep(-aaw(dws), aaw(dws), dws) - glass;
        float post = (1.0 - smoothstep(0.035, 0.035 + aaw(xr), abs(xr + 16.88))) * step(0.45, sd)
                   + (1.0 - smoothstep(0.03, 0.03 + aaw(xr), abs(xr + 16.17))) * step(0.45, sd)
                   + (1.0 - smoothstep(0.03, 0.03 + aaw(sd), sd)) * step(xr, -16.88);
        post = clamp(post, 0.0, 1.0);
        glass *= 1.0 - post;
        base = mix(base, vec3(0.10), frame * (1.0 - post));
        base = mix(base, vec3(0.018, 0.026, 0.036), glass); rough = mix(rough, 0.08, glass);
      `,
    },
  });
  const fus = new T.Mesh(fusGeo, paint); fus.castShadow = true; fus.receiveShadow = true; body.add(fus);

  /* ---------- wings: the measured planform, kinked trailing edge, dihedral from the body side ---------- */
  const greyPaint = (key, c = 0.56) => w.surface({
    color: '#ffffff', roughness: 0.5, metalness: 0, bump: 0, key,
    glsl: { pars: AC_GLSL, albedo: /* glsl */`
      base = vec3(${c.toFixed(3)});
      float d = abs(UV.y - 0.5);                                   // 0 at the leading edge, 0.5 at the trailing edge
      base = mix(base, vec3(${(c + 0.1).toFixed(3)}), smoothstep(0.035, 0.02, d));
      base *= mix(0.93, 1.0, step(UV.y, 0.5));                     // the underside a touch darker
      float xc = 0.5 - 0.5 * cos(3.14159 * (1.0 - 2.0 * d));       // chord fraction
      float hinge = 1.0 - smoothstep(0.004, 0.004 + aaw(xc), abs(xc - 0.8));
      base *= 1.0 - 0.35 * hinge; rough = 0.5; ` },
  });
  const wingMat = greyPaint('wing', 0.56);
  const plainGrey = w.mat('#a7abb0', { roughness: 0.5 });
  const spoilerMat = w.mat('#9da1a6', { roughness: 0.5, side: T.DoubleSide });
  const W0 = WING[0];
  const wingStations = WING.map((p) => ({ s: p.s, le: p.x - W0.x, c: p.c, y: p.y - W0.y, thick: p.th, twist: p.s > 6.4 ? 0.04 * (p.s - 6.4) / 9.9 : 0 }));
  const wings = [];
  for (const sgn of [1, -1]) {
    const g = new T.Group(); g.position.set(0, YR(W0.y), XR(W0.x)); body.add(g);
    const m = new T.Mesh(w.wing({ stations: wingStations, camber: WCAM, mirror: sgn < 0, spanSegs: 48, chordSegs: 48 }), wingMat);
    m.castShadow = m.receiveShadow = true; g.add(m);
    /* the sharklet: a short blended knee, then the blade raked back, about 2.3 m tall */
    const tip = wingAt(16.3);
    const k1 = new T.Group(); k1.position.set(sgn * 16.25, YR(tip.y) - YR(W0.y), -(tip.x - W0.x)); k1.rotation.z = sgn * 0.55; g.add(k1);
    k1.add(new T.Mesh(w.wing({ stations: [{ s: 0, le: 0, c: 1.6, thick: 0.1 }, { s: 0.6, le: 0.24, c: 1.42, thick: 0.095 }], camber: 0, mirror: sgn < 0, spanSegs: 6, chordSegs: 32 }), wingMat));
    const k2 = new T.Group(); k2.position.set(sgn * 0.58, 0, -0.24); k2.rotation.z = sgn * 0.47; k1.add(k2);
    const blade = new T.Mesh(w.wing({ stations: [{ s: 0, le: 0, c: 1.42, thick: 0.095 }, { s: 2.3, le: 2.0, c: 0.6, thick: 0.08 }], camber: 0, mirror: sgn < 0, spanSegs: 12, chordSegs: 32 }), wingMat);
    blade.castShadow = true; k2.add(blade);
    /* spoilers: five panels a side on the upper skin ahead of the flaps, hinged at their front edge */
    const spoilers = [];
    for (const [s0, s1] of [[4.48, 6.19], [6.25, 7.95], [8.0, 9.7], [9.75, 11.36], [11.41, 13.06]]) {
      const P = (s, xc) => { const q = wingSkin(s, xc, true); return new T.Vector3(sgn * s, YR(q[1]) + 0.012, XR(q[0])); };
      const A = P(s0, 0.6), B = P(s1, 0.6), C = P(s1, 0.79), D = P(s0, 0.79);
      const pg = new T.BufferGeometry().setFromPoints([new T.Vector3(), B.clone().sub(A), C.clone().sub(A), new T.Vector3(), C.clone().sub(A), D.clone().sub(A)]);
      pg.computeVertexNormals();
      const hinge = new T.Group(); hinge.position.copy(A); body.add(hinge);
      const pm = new T.Mesh(pg, spoilerMat); pm.castShadow = true; hinge.add(pm);
      spoilers.push({ hinge, axis: B.clone().sub(A).normalize(), sgn });
    }
    /* flap-track fairings: the canoes under the trailing edge */
    for (const s of [4.85, 8.25, 11.9]) {
      const q = wingSkin(s, 0.55, false), Wq = wingAt(s);
      const pod = new T.Mesh(w.lathe([[0, 0.02], [0.35, 0.12], [1.1, 0.16], [1.9, 0.12], [2.5, 0.02]], { segments: 32, samples: 40, squash: 1.35 }), plainGrey);
      pod.position.set(sgn * s, YR(q[1]) - 0.08, XR(Wq.x + 0.5 * Wq.c) - 2.5); pod.castShadow = true; body.add(pod);
    }
    wings.push({ group: g, spoilers, sgn });
  }

  /* ---------- tail: the stabilisers and the fin with its dorsal fillet ---------- */
  const tailMat = greyPaint('tail', 0.62);
  for (const sgn of [1, -1]) {
    const st = new T.Mesh(w.wing({ stations: [{ s: 0, le: 0, c: 3.78, y: 0 }, { s: 6.32, le: 3.92, c: 1.25, y: 1.0 }], thick: 0.1, camber: 0, mirror: sgn < 0, spanSegs: 24, chordSegs: 36 }), tailMat);
    st.position.set(0, YR(0.54), XR(12.72)); st.castShadow = true; body.add(st);
  }
  const finMat = w.surface({
    color: '#ffffff', roughness: 0.42, metalness: 0, bump: 0, key: 'fin',
    glsl: { pars: AC_GLSL, albedo: /* glsl */`
      base = vec3(0.012, 0.03, 0.095);
      float v = -L.z - 0.864 * L.x;                                // metres aft of the leading-edge line
      float b = abs(v - 1.55) - 0.2;
      base = mix(base, vec3(0.90, 0.33, 0.04), smoothstep(aaw(b), -aaw(b), b));
      rough = 0.42; ` },
  });
  /* fin: LE from x 10.89 at the root (y 1.75) to 16.16 at the top (y 7.85), TE 16.46 to 17.96 */
  const fin = new T.Mesh(w.wing({ stations: [{ s: -0.5, le: -0.432, c: 5.88 }, { s: 6.1, le: 5.27, c: 1.8 }], thick: 0.1, camber: 0, spanSegs: 30, chordSegs: 40 }), finMat);
  fin.rotation.z = Math.PI / 2; fin.position.set(0, YR(1.75), XR(10.89)); fin.castShadow = true; body.add(fin);
  /* the dorsal fillet: a low fairing running forward to x 7 */
  const fillet = new T.Mesh(w.wing({ stations: [{ s: -0.3, le: -4.89, c: 10.4 }, { s: 0.2, le: -3.2, c: 8.8 }, { s: 0.75, le: 0.7, c: 4.9 }], thick: 0.05, camber: 0, spanSegs: 10, chordSegs: 40 }), finMat);
  fillet.rotation.z = Math.PI / 2; fillet.position.set(0, YR(1.75), XR(10.89)); body.add(fillet);

  /* ---------- engines: high-bypass turbofans under the wing, x −7.5 to −2.35, 2.32 m across ---------- */
  const nacMat = w.surface({
    color: '#ffffff', roughness: 0.42, metalness: 0, bump: 0, key: 'nacelle', side: T.DoubleSide, uniforms: { uRev: { value: 0 } },
    glsl: { pars: AC_GLSL, albedo: /* glsl */`
      base = vec3(0.012, 0.03, 0.095); rough = 0.42;
      float r = length(L.xy);
      float lip = clamp(smoothstep(7.15, 7.3, L.z) + step(r, 0.97) * step(5.0, L.z), 0.0, 1.0);
      base = mix(base, vec3(0.62, 0.63, 0.65), lip); rough = mix(rough, 0.3, lip);
      base = mix(base, vec3(0.03), step(r, 0.9) * step(L.z, 6.6));      // inside the duct
      /* the reverser doors' openings, once they swing out */
      float a = mod(atan(L.y, L.x) - 0.7854, 1.5708) - 0.7854;
      float hole = step(abs(a), 0.55) * step(abs(L.z - 4.45), 0.5) * step(1.0, r) * step(0.01, uRev);
      base = mix(base, vec3(0.015), hole); ` },
  });
  const greyMetal = w.mat('#9a9da2', { roughness: 0.45, metalness: 0.3 });
  const darkMetal = w.mat('#2b2d31', { roughness: 0.5, metalness: 0.4 });
  const patch = (R, a0, a1, z0, z1, na = 12) => {          // a curved panel on a cylinder about z
    const pos = [], idx = [];
    for (let i = 0; i <= na; i++) { const a = a0 + (a1 - a0) * i / na; pos.push(R * Math.cos(a), R * Math.sin(a), z0, R * Math.cos(a), R * Math.sin(a), z1); }
    for (let i = 0; i < na; i++) { const b = i * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
  };
  const engines = [];
  for (const sgn of [1, -1]) {
    const e = new T.Group(); e.position.set(sgn * 5.62, YR(-2.28), XR(0)); body.add(e);   // engine z = −x
    const nac = new T.Mesh(w.lathe([[3.61, 0.96], [3.9, 1.04], [4.5, 1.10], [5.5, 1.13], [6.5, 1.13], [7.1, 1.11], [7.38, 1.06], [7.5, 0.98], [7.44, 0.91], [7.2, 0.875], [6.6, 0.86], [5.0, 0.86], [3.75, 0.88]], { segments: 96, samples: 140 }), nacMat);
    nac.castShadow = true; e.add(nac);
    const fan = new T.Mesh(new T.CircleGeometry(0.86, 64), w.surface({ color: '#ffffff', roughness: 0.5, bump: 0, key: 'fan', glsl: { albedo: /* glsl */`
      float a = atan(L.y, L.x) + uT * 9.0; float bl = smoothstep(0.3, 0.5, abs(fract(a * 24.0 / 6.2832) - 0.5) * 2.0);
      base = mix(vec3(0.03), vec3(0.16), bl * smoothstep(0.25, 0.4, length(L.xy))); rough = 0.5; ` } }));
    fan.position.z = 6.5; e.add(fan);
    e.add(new T.Mesh(w.lathe([[6.45, 0.3], [6.7, 0.25], [6.92, 0.13], [7.04, 0.0]], { segments: 48, samples: 30 }), darkMetal));
    const core = new T.Mesh(w.lathe([[3.9, 0.86], [3.6, 0.80], [3.2, 0.72], [2.7, 0.6], [2.42, 0.5], [2.35, 0.47]], { segments: 64, samples: 50 }), greyMetal);
    core.castShadow = true; e.add(core);
    e.add(new T.Mesh(w.lathe([[2.45, 0.42], [2.2, 0.3], [1.95, 0.12], [1.85, 0.0]], { segments: 48, samples: 30 }), darkMetal));
    /* four pivoting reverser doors: closed they sit flush (hidden), open their front edges swing out */
    const doors = [];
    for (let k = 0; k < 4; k++) {
      const ph = Math.PI / 4 + k * Math.PI / 2, R = 1.15, zm = 4.45;
      const pivot = new T.Group(); pivot.position.set(Math.cos(ph) * R, Math.sin(ph) * R, zm); e.add(pivot);
      const dm = new T.Mesh(patch(R + 0.01, ph - 0.55, ph + 0.55, zm - 0.5, zm + 0.5), nacMat); dm.position.set(-Math.cos(ph) * R, -Math.sin(ph) * R, -zm); dm.visible = false; pivot.add(dm);
      doors.push({ pivot, mesh: dm, axis: new T.Vector3(-Math.sin(ph), Math.cos(ph), 0) });
    }
    /* the pylon, from the top of the nacelle up into the wing */
    const sh = new T.Shape();
    [[-6.64, -1.14], [-6.2, -0.98], [-5.0, -0.86], [-3.9, -0.80], [-0.56, -0.78], [-0.56, -0.95], [-1.6, -1.30], [-2.6, -1.62], [-3.4, -1.40], [-3.61, -1.22], [-5.5, -1.17]]
      .forEach(([x, y], i) => { if (i) sh.lineTo(XR(x), YR(y)); else sh.moveTo(XR(x), YR(y)); });
    const pyG = new T.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, curveSegments: 4 });
    pyG.rotateY(-Math.PI / 2); pyG.translate(0.15, 0, 0);
    const py = new T.Mesh(pyG, plainGrey); py.position.x = sgn * 5.62; py.castShadow = true; body.add(py);
    engines.push({ group: e, fan, doors, sgn });
  }

  /* ---------- landing gear: two-wheel main legs under the wing roots, a two-wheel nose leg ---------- */
  const tyreMat = w.mat('#1b1c1e', { roughness: 0.85 });
  const strutMat = w.mat('#b4b7bb', { roughness: 0.35, metalness: 0.5 });
  const hubMat = w.mat('#a2a5aa', { roughness: 0.45, metalness: 0.3 });
  const holeMat = w.mat('#2a2c30', { roughness: 0.6 });
  const doorMat = w.mat('#c3c6ca', { roughness: 0.5 });
  const brakeMats = [];
  const tyre = (r, wdt) => { const g = w.lathe([[-wdt / 2, r * 0.58], [-wdt / 2, r * 0.84], [-wdt * 0.4, r * 0.97], [0, r], [wdt * 0.4, r * 0.97], [wdt / 2, r * 0.84], [wdt / 2, r * 0.58]], { segments: 64, samples: 40 }); g.rotateY(Math.PI / 2); return g; };
  const gears = [];
  const mkGear = (x, z, r, wdt, spread, legTop, brake) => {
    const g = new T.Group(); g.position.set(x, 0, z); root.add(g);
    const oleo = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 0.9, 20), strutMat); oleo.position.y = r + 0.45; g.add(oleo);
    const leg = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, legTop - r - 0.75, 20), strutMat); leg.position.y = (legTop + r + 0.75) / 2; leg.castShadow = true; g.add(leg);
    const axle = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, spread * 2, 12), strutMat); axle.rotation.z = Math.PI / 2; axle.position.y = r; g.add(axle);
    const wheels = [];
    for (const dx of [-spread, spread]) {
      const wg = new T.Group(); wg.position.set(dx, r, 0); g.add(wg);
      const ty = new T.Mesh(tyre(r, wdt), tyreMat); ty.castShadow = ty.receiveShadow = true; wg.add(ty);
      const hub = new T.Mesh(new T.CylinderGeometry(r * 0.56, r * 0.56, wdt * 0.92, 32), hubMat); hub.rotation.z = Math.PI / 2; wg.add(hub);
      for (let i = 0; i < 5; i++) {                                    // dark holes in the hub, so the turning shows
        const hole = new T.Mesh(new T.CircleGeometry(r * 0.1, 16), holeMat);
        const an = i * TAU / 5; hole.position.set(Math.sign(dx) * wdt * 0.47, Math.cos(an) * r * 0.33, Math.sin(an) * r * 0.33); hole.rotation.y = Math.sign(dx) * Math.PI / 2; wg.add(hole);
      }
      wheels.push(wg);
    }
    let bm = null;
    if (brake) {
      bm = w.surface({ color: '#ffffff', roughness: 0.6, bump: 0, key: 'brake', uniforms: { uHeat: { value: new T.Vector3(0, 0, 0) } }, glsl: { albedo: /* glsl */`
        float rings = step(0.5, fract(L.y * 22.0)); base = mix(vec3(0.07), vec3(0.13), rings);
        emit = uHeat * (0.7 + 0.3 * rings); ` } });
      const stack = new T.Mesh(new T.CylinderGeometry(r * 0.5, r * 0.5, spread * 2 - wdt - 0.04, 40), bm); stack.rotation.z = Math.PI / 2; stack.position.y = r; g.add(stack);
      brakeMats.push(bm);
    }
    gears.push({ group: g, wheels, r, brake: bm });
    return g;
  };
  for (const sgn of [1, -1]) {
    const g = mkGear(sgn * 3.87, 0, 0.545, 0.38, 0.44, YR(-1.35), true);
    /* the side stay, and the door on the leg */
    const a = new T.Vector3(0, 1.9, 0), b = new T.Vector3(-sgn * 1.6, YR(-1.55), 0.15);
    const stay = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, a.distanceTo(b), 12), strutMat);
    stay.position.copy(a).add(b).multiplyScalar(0.5); stay.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize()); g.add(stay);
    const door = new T.Mesh(new T.BoxGeometry(0.03, 1.5, 0.95), doorMat); door.position.set(sgn * 0.22, 2.15, 0); door.castShadow = true; g.add(door);
  }
  const nlg = mkGear(0, XR(-13.65), 0.375, 0.26, 0.36, YR(-2.2), false);
  { const d = new T.Mesh(new T.BoxGeometry(0.03, 1.0, 1.3), doorMat); for (const s of [1, -1]) { const m = d.clone(); m.position.set(s * 0.55, 1.75, -0.1); nlg.add(m); } }

  /* ---------- the aircraft's own lights: nav, strobes, beacons, landing and taxi ---------- */
  const lightsAt = [];
  const L0 = (at, color, size, blink) => { lightsAt.push(at); return { at: [0, -1000, 0], color, size, blink }; };
  const tipY = YR(wingAt(16.3).y + 0.08), tipZ = (dx) => XR(wingAt(16.3).x + dx);
  const LAND = o.landing || [420, 400, 350];
  const ll = wingSkin(4.2, 0.12, false);
  const list = [
    L0([5.0, YR(ll[1]) - 0.05, XR(ll[0])], LAND, 0.14), L0([-5.0, YR(ll[1]) - 0.05, XR(ll[0])], LAND, 0.14),   // landing lights under the wing roots
    L0([0.12, 1.55, XR(-13.85)], [260, 250, 220], 0.09), L0([-0.12, 1.55, XR(-13.85)], [260, 250, 220], 0.09),   // taxi lights on the nose leg
    L0([16.4, tipY, tipZ(0.25)], [40, 2, 1], 0.07), L0([-16.4, tipY, tipZ(0.25)], [2, 34, 9], 0.07),          // red left, green right
    L0([16.4, tipY, tipZ(0.9)], [500, 500, 520], 0.08, { period: 1.2, on: 0.05, phase: 0.3 }),                    // strobes
    L0([-16.4, tipY, tipZ(0.9)], [500, 500, 520], 0.08, { period: 1.2, on: 0.05, phase: 0.3 }),
    L0([0, YR(1.97), XR(-3.0)], [90, 5, 2], 0.08, { period: 1.0, on: 0.12, phase: 0.0 }),                          // beacons
    L0([0, YR(-2.52), XR(-1.0)], [90, 5, 2], 0.08, { period: 1.0, on: 0.12, phase: 0.5 }),
    L0([0, YR(0.86), XR(18.86)], [40, 40, 40], 0.06),                                                             // tail
  ];
  const pts = w.lights(list, { min: 1.6 });
  /* light from the landing lights onto the runway ahead */
  const spots = [];
  for (const sx of [5.0, -5.0]) {
    const s = new T.SpotLight(0xfff2dd, o.spot == null ? 2500 : o.spot, 400, 0.2, 0.7, 2); s.position.set(sx, YR(ll[1]) - 0.1, XR(ll[0]));
    s.target.position.set(sx * 1.5, 0, XR(ll[0]) + 80); root.add(s); root.add(s.target); spots.push(s);
  }
  const brakeLights = gears.filter((g) => g.brake).map((g) => { const p = new T.PointLight(0xff5a1a, 0, 6, 2); p.position.set(0, g.r, 0); g.group.add(p); return p; });

  const tmpV = new T.Vector3();
  /* pose the aircraft: s { z (where the main gear is), x, dist (metres rolled, turns the wheels),
     spoilers 0..1, reverse 0..1, heat (kelvin of the brakes), pitch (nose down, radians), sink (m) } */
  function pose(s) {
    root.position.set(s.x || 0, 0, s.z);
    body.rotation.x = s.pitch || 0;                                   // about the main gear: the nose dips under braking
    body.position.y = -(s.sink || 0);
    for (const wg of wings) for (const sp of wg.spoilers) sp.hinge.quaternion.setFromAxisAngle(sp.axis, sp.sgn * 0.85 * (s.spoilers || 0));
    for (const e of engines) for (const d of e.doors) { d.mesh.visible = (s.reverse || 0) > 0.01; d.pivot.quaternion.setFromAxisAngle(d.axis, 0.6 * (s.reverse || 0)); }
    nacMat.uniforms.uRev.value = s.reverse || 0;
    for (const g of gears) for (const wl of g.wheels) wl.rotation.x = (s.dist || 0) / g.r;
    const K = s.heat || 300, hot = Math.max(0, (K - 650) / 600);
    const bb = blackbody(Math.max(800, K)), I = 10 * Math.pow(hot, 2.2);
    for (const m of brakeMats) m.uniforms.uHeat.value.set(bb[0] * I, bb[1] * I, bb[2] * I);
    for (const p of brakeLights) { p.color.setRGB(bb[0], bb[1], bb[2]); p.intensity = 20 * Math.pow(hot, 2.2); }
    root.updateMatrixWorld(true);
    lightsAt.forEach((l, i) => { tmpV.set(l[0], l[1], l[2]).applyMatrix4(body.matrixWorld); pts.set(i, [tmpV.x, tmpV.y, tmpV.z]); });
  }
  return { object: root, body, pose, gears, wings, engines, spots, paint };
}

/* ---------- the airfield: a 45 m runway, mostly dry, a faint damp sheen in broad patches ---------- */
async function airfield(T, w, o = {}) {
  const HALF = 22.5, Z0 = o.far || -3000, Z1 = o.end || 400, SHEEN = o.sheen == null ? 0.22 : o.sheen;
  const mirror = SHEEN > 0 ? w.mirror({ y: 0, res: 0.5 }) : null;
  const U = Object.assign({ uGearZ: { value: -1e6 }, uBrakeZ: { value: -1e6 }, uGearX: { value: new T.Vector4(3.43, 4.31, -3.43, -4.31) }, uSheen: { value: SHEEN } }, mirror ? mirror.uniforms : {});
  const runwayMat = w.surface({
    color: '#ffffff', roughness: 0.8, bump: 0, key: 'runway' + (mirror ? 'M' : ''), uniforms: U,
    glsl: {
      pars: (mirror ? mirror.glsl : '') + AC_GLSL,
      albedo: /* glsl */`
        vec2 q = P.xz; float ax = abs(P.x), dz = ${Z1.toFixed(1)} - P.z;
        base = vec3(0.095, 0.096, 0.10) * (0.88 + 0.2 * fbm4(q * 0.045)) * (0.95 + 0.08 * vnoise(q * 1.1));
        /* rubber laid down in the touchdown zones of both ends, in streaks along the runway */
        float tz = smoothstep(1200.0, 700.0, min(dz, P.z + ${(-Z0).toFixed(1)}));
        float rub = smoothstep(10.0, 3.0, ax) * tz * (0.5 + 0.5 * fbm4(vec2(P.x * 0.7, P.z * 0.015)));
        base *= 1.0 - 0.4 * rub;
        /* this aircraft's fresh tyre marks behind its main wheels while it brakes */
        float sk = 0.0;
        for (int i = 0; i < 4; i++) { float gx = uGearX[i]; float lane = smoothstep(0.2, 0.1, abs(P.x - gx));
          sk += lane * step(uBrakeZ, P.z) * step(P.z, uGearZ) * (0.35 + 0.3 * vnoise(vec2(P.z * 0.4, gx))); }
        base *= 1.0 - 0.6 * clamp(sk, 0.0, 1.0);
        /* paint: edge lines, the centreline (30 m stripes, 20 m gaps), threshold, touchdown-zone bars, aiming point */
        float paint = 0.0;
        paint += step(abs(ax - 21.6), 0.45);
        paint += step(ax, 0.45) * step(fract(P.z / 50.0), 0.6) * step(60.0, dz);
        paint += step(6.0, dz) * step(dz, 36.0) * step(3.0, ax) * step(ax, 20.0) * step(0.5, fract((ax - 3.0) / 3.6));
        for (int b = 0; b < 4; b++) { float zs = b == 0 ? 150.0 : b == 1 ? 300.0 : b == 2 ? 450.0 : 600.0; float nb = b < 2 ? 3.0 : 2.0;
          float inZ = step(zs, dz) * step(dz, zs + 22.5);
          for (int j = 0; j < 3; j++) { if (float(j) >= nb) break; float x0 = 3.0 + float(j) * 3.3; paint += inZ * step(x0, ax) * step(ax, x0 + 1.8); } }
        paint += step(400.0, dz) * step(dz, 445.0) * step(6.0, ax) * step(ax, 15.0);
        paint = clamp(paint, 0.0, 1.0) * (0.85 + 0.15 * fbm4(q * 1.5));
        base = mix(base, vec3(0.70), paint * (1.0 - 0.5 * rub));
        rough = mix(0.8, 0.6, paint) - 0.12 * fbm4(q * 0.02 + 4.0);
      `,
      light: mirror ? /* glsl */`
        float ndv = clamp(dot(N, V), 0.0, 1.0);
        float fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
        float damp = smoothstep(0.35, 0.7, fbm4(P.xz * 0.012 + 7.0));
        outgoingLight = mix(outgoingLight, mirror(P, N, 0.55), fres * uSheen * (0.35 + 0.65 * damp));
      ` : '',
    },
  });
  const runway = new T.Mesh(new T.PlaneGeometry(HALF * 2, Z1 - Z0, 1, 1), runwayMat);
  runway.rotation.x = -Math.PI / 2; runway.position.set(0, 0, (Z0 + Z1) / 2); runway.receiveShadow = true; w.scene.add(runway);

  /* grass, paved shoulders, and two taxiways off the runway with yellow lines */
  const TWY = o.taxiways || [[1, -170], [-1, -520]];
  const groundMat = w.surface({
    color: '#ffffff', roughness: 0.95, bump: 0, key: 'ground', uniforms: { uTwy: { value: new T.Vector4(TWY[0][0], TWY[0][1], TWY[1][0], TWY[1][1]) } },
    glsl: { pars: AC_GLSL, albedo: /* glsl */`
      vec2 q = P.xz; float ax = abs(P.x);
      float n = fbm4(q * 0.08), n2 = vnoise(q * 0.9);
      base = mix(vec3(0.09, 0.15, 0.045), vec3(0.17, 0.18, 0.07), n) * (0.88 + 0.2 * n2);
      rough = 0.95;
      float shoulder = step(ax, 30.0);
      float twy = 0.0, tline = 0.0;
      for (int i = 0; i < 2; i++) { float sx = i == 0 ? uTwy.x : uTwy.z, tz = i == 0 ? uTwy.y : uTwy.w;
        float on = step(0.0, P.x * sx) * step(abs(P.z - tz), 11.5);
        twy = max(twy, on);
        tline = max(tline, on * step(abs(P.z - tz), 0.08) * step(31.0, ax));
        tline = max(tline, on * step(abs(abs(P.z - tz) - 10.9), 0.07) * step(31.0, ax)); }
      vec3 asph = vec3(0.10, 0.10, 0.103) * (0.9 + 0.15 * fbm4(q * 0.05));
      base = mix(base, asph, max(shoulder, twy)); rough = mix(rough, 0.8, max(shoulder, twy));
      base = mix(base, vec3(0.75, 0.55, 0.06), tline);
    ` },
  });
  const ground = new T.Mesh(new T.PlaneGeometry(9000, 9000, 1, 1), groundMat);
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.02, -1500); ground.receiveShadow = true; w.scene.add(ground);
  if (mirror) mirror.hide(runway).hide(ground);

  /* ---------- lights: runway edges on their fittings, centreline, the far end and its approach
     lights, the taxiways' blue edges, the town beyond ---------- */
  const L = [];
  const r = rng(11);
  const fitMat = w.mat('#c9a21c', { roughness: 0.5 });
  const capMat = w.mat('#e8e3d0', { roughness: 0.2, emissive: new T.Color('#ffd9a0'), emissiveIntensity: 0.6 });
  const fitN = Math.ceil((Z1 - Z0) / 60) * 2 + 4;
  const fitI = new T.InstancedMesh(new T.CylinderGeometry(0.05, 0.07, 0.34, 10), fitMat, fitN), capI = new T.InstancedMesh(new T.CylinderGeometry(0.11, 0.11, 0.12, 14), capMat, fitN);
  let fi = 0; const mm = new T.Matrix4();
  for (let z = Z0; z <= Z1; z += 60) for (const x of [24, -24]) {
    L.push({ at: [x, 0.42, z], color: [40, 33, 22], size: 0.1 });
    mm.makeTranslation(x, 0.17, z); fitI.setMatrixAt(fi, mm); mm.makeTranslation(x, 0.4, z); capI.setMatrixAt(fi, mm); fi++;
  }
  fitI.count = capI.count = fi; fitI.castShadow = true; w.scene.add(fitI); w.scene.add(capI);
  for (let z = Z0 + 7.5; z <= Z1; z += 15) { const dz = Z1 - z; const red = dz < 300 || (dz < 900 && Math.round(z / 15) % 2 === 0); L.push({ at: [0, 0.03, z], color: red ? [34, 2, 1] : [24, 23, 20], size: 0.06 }); }
  for (let x = -21; x <= 21; x += 3) L.push({ at: [x, 0.3, Z0 - 1], color: [45, 3, 1], size: 0.1 });
  for (let i = 0; i < 24; i++) {
    const z = Z0 - 60 - i * 30, y = 0.5 + i * 0.28;
    for (const x of [-3, -1.5, 0, 1.5, 3]) L.push({ at: [x, y, z], color: [20, 18, 15], size: 0.1 });
    L.push({ at: [0, y + 0.5, z], color: [500, 500, 560], size: 0.12, blink: { period: 0.5, on: 0.03, phase: 0.5 - (i / 24) * 0.5 } });
  }
  for (const [sx, tz] of TWY) for (let x = 32; x < 600; x += 30) for (const dzt of [-11.8, 11.8]) L.push({ at: [sx * x, 0.35, tz + dzt], color: [3, 6, 30], size: 0.09 });
  for (let i = 0; i < 220; i++) {
    const a = -0.9 + r() * 1.9, d = 2600 + r() * 2600, warm = r() < 0.8;
    L.push({ at: [Math.sin(a) * d, 1 + r() * 18, -Math.cos(a) * d - 1200], color: warm ? [30, 16, 5].map((v) => v * (0.4 + r())) : [15, 18, 22], size: 0.35 + r() * 0.5 });
  }
  const pts = w.lights(L, { min: 1.6 });

  /* ---------- distance-remaining boards: thousands of feet left, white on black, both faces ---------- */
  try { await document.fonts.load('800 200px Inter'); } catch (e) { /* the system face stands in */ }
  const boardTex = (n) => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
    g.fillStyle = '#0b0b0c'; g.fillRect(0, 0, 256, 128); g.fillStyle = '#f2f2ee'; g.font = '800 104px Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(n), 128, 70); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
  };
  const legMat = w.mat('#3a3c40', { roughness: 0.6 }), boxMat = w.mat('#111214', { roughness: 0.55 });
  const total = Math.round((Z1 - Z0) / 304.8);
  for (let n = 1; n < total - 1; n++) {
    const z = Z1 - n * 304.8;
    for (const sx of [1, -1]) {
      const g = new T.Group(); g.position.set(sx * 37.5, 0, z); w.scene.add(g);
      const box = new T.Mesh(new T.BoxGeometry(2.4, 1.2, 0.3), boxMat); box.position.y = 1.25; box.castShadow = true; g.add(box);
      for (const [face, num] of [[1, total - n], [-1, n]]) {
        const tx = boardTex(num);
        const pl = new T.Mesh(new T.PlaneGeometry(2.3, 1.1), new T.MeshStandardMaterial({ map: tx, emissiveMap: tx, emissive: new T.Color('#ffffff'), emissiveIntensity: 0.25, roughness: 0.5 }));
        pl.position.set(0, 1.25, face * 0.152); if (face < 0) pl.rotation.y = Math.PI; g.add(pl);
      }
      for (const lx of [-0.9, 0.9]) { const lg = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.7, 8), legMat); lg.position.set(lx, 0.35, 0); g.add(lg); }
    }
  }

  /* ---------- the far landscape: a tree line, hangars, a tower ---------- */
  const dark = w.mat('#141a10', { roughness: 1 });
  {
    const N = 720, R0 = 2000, pos = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * TAU, x = Math.sin(a) * R0, z = -Math.cos(a) * R0 - 900;
      const hh = 9 + 16 * Math.pow(Math.abs(Math.sin(i * 0.37) * 0.5 + Math.sin(i * 0.11 + 1.3) * 0.5), 1.4) + 6 * r();
      pos.push(x, -2, z, x, hh, z);
      if (i < N) { const b = i * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new T.Mesh(g, dark); m.material.side = T.DoubleSide; w.scene.add(m);
  }
  const hangarMat = w.mat('#6d737b', { roughness: 0.7 });
  for (const [x, z, wd, ht, dp] of [[320, -520, 70, 22, 60], [410, -650, 90, 26, 70], [300, -760, 50, 16, 40], [-380, -900, 60, 18, 50], [520, -980, 40, 14, 40]]) {
    const b = new T.Mesh(new T.BoxGeometry(wd, ht, dp), hangarMat); b.position.set(x, ht / 2, z); b.castShadow = true; w.scene.add(b);
  }
  {
    const tw = new T.Group(); tw.position.set(470, 0, -860); w.scene.add(tw);
    const shaft = new T.Mesh(new T.CylinderGeometry(3.2, 4.2, 38, 24), w.mat('#a4a6aa', { roughness: 0.6 })); shaft.position.y = 19; tw.add(shaft);
    const cab = new T.Mesh(new T.CylinderGeometry(6.2, 5.0, 5.5, 8), w.mat('#1d2a30', { roughness: 0.15, emissive: new T.Color('#5fc7a0'), emissiveIntensity: 0.25 }));
    cab.position.y = 41; tw.add(cab);
    const capm = new T.Mesh(new T.CylinderGeometry(6.6, 6.6, 1.2, 8), w.mat('#2a2c30', { roughness: 0.5 })); capm.position.y = 44.3; tw.add(capm);
  }
  return {
    runway, ground, mirror, lights: pts,
    update(gearZ, brakeZ) { U.uGearZ.value = gearZ; U.uBrakeZ.value = brakeZ; },
  };
}
