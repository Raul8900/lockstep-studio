'use strict';
/* components.js — the two worlds of this video, built in code and shared by the scenes.

   airfieldWorld()  a night airfield: a 3.2 km runway with edge and centreline lights, markings,
                    city lights on the horizon, three fire trucks, and a 737-style twin-jet built
                    from lofted shapes: fuselage with lit cabin windows, swept wings with spoiler
                    panels that rise and flaps that droop, two engines whose rear sleeves slide back
                    to reverse, main gear with four braked wheels whose hubs glow with heat. Tyre
                    smoke, the energy flowing into the brakes, the reverser's air and the steam
                    off the gear are particles. Every pose comes from jetState(t).
   brakeWorld()     the hero close up: a carbon brake stack (rotors and stators on a torque tube,
                    piston housing, wear pin) on a bench, a cutting wheel that machines it down,
                    sparks; the discs heat graphite → cherry → orange → white. And a main wheel
                    (tyre, rim, fuse plug) whose plug melts and lets the air out.

   Units are metres. The jet's nose points +x; the runway runs along +x from its threshold at 0.
   Everything is a pure function of t.                                                           */

/* ------------------------------------------------------------------ cues and the jet's story */
let _JC = null;
function jc() {
  if (_JC) return _JC;
  const c = {
    N0: beatOf('normal').t0 - 0.5, T0: beatOf('test').t0 - 0.5, H0: beatOf('heat').t0 - 0.5,
    R0: beatOf('rule').t0 - 0.5, P0: beatOf('payoff').t0 - 0.5,
    panels: at('normal', 'panels'), dump: at('normal', 'dump'), wheels: at('normal', 'wheels'), engines: at('normal', 'engines'),
    reverse: at('normal', 'reverse'), but: at('normal', 'but'), carbon: at('normal', 'carbon'), heat1: at('normal', 'heat'),
    maximum: at('test', 'maximum'), two: at('test', 'two'), no: at('test', 'no'), seven: at('test', 'seven'),
    hits: at('test', 'hits'), kilometres: at('test', 'kilometres'), slams: at('test', 'slams'),
    thats: at('heat', "that's"), mega: at('heat', 'megajoules'), four: at('heat', 'four'), they: at('heat', 'they'),
    thirteen: at('heat', 'thirteen'), degrees: at('heat', 'degrees'), plugs: at('heat', 'plugs'), melt: at('heat', 'melt'),
    air: at('heat', 'air'), burst: at('heat', 'burst'),
    nobody: at('rule', 'nobody'), five: at('rule', 'five'), fire: at('rule', 'fire'), all: at('rule', 'all'), held: at('rule', 'held'),
    seat: at('payoff', 'seat'), worse: at('payoff', 'worse'), because: at('payoff', 'because'), certify: at('payoff', 'certify'),
  };
  c.go = c.no + 0.3;                         // brakes released for the test run
  c.reach = c.kilometres;                    // test speed reached as the number is said
  c.stop = c.R0 + 0.4;                       // the jet comes to rest as the five minutes begin
  c.VTEST = 92.6;                            // 180 kn = 333 km/h (Boeing, 737-10 test)
  c.V0 = 66; c.V1 = 30;                      // the normal landing roll, m/s, over the normal beat
  c.XN = 340;                                // where on the runway the normal landing roll is seen
  c.xs = 0.5 * c.VTEST * (c.reach - c.go) + c.VTEST * (c.slams - c.reach);   // where the brakes slam
  c.xStop = c.xs + 0.5 * c.VTEST * (c.stop - c.slams);
  _JC = c;
  return c;
}

/* where the jet is and what it is doing at time t */
function jetState(t) {
  const c = jc();
  const s = { x: 0, v: 0, spoil: 0, rev: 0, heat: 0, flaps: 0, dip: 0, idle: 1 };
  if (t < c.N0) {                                            // hook: parked at the threshold
    s.x = 0;
  } else if (t < c.T0) {                                     // a normal landing roll
    const u = t - c.N0, a = (c.V0 - c.V1) / (c.T0 - c.N0);
    s.x = c.XN + c.V0 * u - 0.5 * a * u * u; s.v = c.V0 - a * u;
    s.spoil = tw(t, c.panels - 0.15, c.panels + 0.45, E.out3);
    s.rev = tw(t, c.reverse - 0.55, c.reverse + 0.35, E.io3);
    s.heat = 0.24 * tw(t, c.carbon - 0.3, c.heat1 + 0.4, E.lin);
    s.flaps = 1; s.idle = 0.6;
  } else if (t < c.stop) {                                   // the test: accelerate, then stop
    s.flaps = 0.2;
    if (t < c.go) { s.x = 0; }
    else if (t < c.reach) {
      const a = c.VTEST / (c.reach - c.go), u = t - c.go;
      s.x = 0.5 * a * u * u; s.v = a * u; s.idle = 0;
    } else if (t < c.slams) {
      s.x = 0.5 * c.VTEST * (c.reach - c.go) + c.VTEST * (t - c.reach); s.v = c.VTEST; s.idle = 0;
    } else {
      const a = c.VTEST / (c.stop - c.slams), u = t - c.slams;
      s.x = c.xs + c.VTEST * u - 0.5 * a * u * u; s.v = c.VTEST - a * u;
      s.spoil = tw(t, c.slams, c.slams + 0.5, E.out3);
      s.dip = tw(t, c.slams, c.slams + 0.6, E.out3);
    }
    s.heat = clamp(E.in2(prog(t, c.slams, c.degrees + 0.3)) * 1.0);
  } else {                                                   // stopped, the brakes cooling very slowly
    s.x = c.xStop; s.flaps = 0.2; s.spoil = 1;
    s.heat = lerp(1, 0.8, prog(t, c.stop, DATA.dur));
    s.dip = 1 - tw(t, c.stop - 0.2, c.stop + 0.9, E.outBackSoft);
  }
  return s;
}

/* heat 0..1 → an emissive colour (graphite, dull red, cherry, orange, yellow, white) */
const HEAT_STOPS = ['#120d0b', '#4a0c03', '#a81904', '#e8480b', '#ff9a2c', '#ffe6b0'];
function heatHex(k) {
  k = clamp(k) * (HEAT_STOPS.length - 1);
  const i = Math.min(HEAT_STOPS.length - 2, Math.floor(k));
  return mixHex(HEAT_STOPS[i], HEAT_STOPS[i + 1], k - i);
}
function heatMat(mat, k, gain = 1) {
  mat.emissive.set(heatHex(k));
  mat.emissiveIntensity = gain * (k < 0.02 ? 0 : lerp(0.4, 5.5, E.in2(clamp(k))));
}

/* ------------------------------------------------------------------ geometry helpers */
/* a smooth body of revolution along x: stations [[x, cy, r], …]; ry scales the section's height */
function loftX(T, st, o = {}) {
  const n = o.seg || 40, ry = o.ry || 1, pos = [], idx = [];
  for (const [x, cy, r] of st) {
    for (let j = 0; j <= n; j++) {
      const a = (j / n) * TAU;
      pos.push(x, cy + Math.cos(a) * r * ry, Math.sin(a) * r);
    }
  }
  const row = n + 1;
  for (let i = 0; i < st.length - 1; i++) {
    for (let j = 0; j < n; j++) {
      const a = i * row + j, b = a + row;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
/* a flat outline (points in the plane's own x and y), given thickness and laid so that its y runs
   along world z and its thickness along world y (a wing seen from above) */
function plate(T, pts, thick, o = {}) {
  const sh = new T.Shape();
  pts.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)));
  sh.closePath();
  const g = new T.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: true, bevelThickness: thick * 0.35, bevelSize: Math.min(0.12, thick * 0.4), bevelSegments: 3, curveSegments: 4 });
  if (o.vertical) { g.translate(0, 0, -thick / 2); return g; }    // stays in the x–y plane (a fin)
  g.rotateX(Math.PI / 2);                                         // shape y → world z, extrusion → −y
  g.translate(0, thick, 0);
  return g;
}

/* ------------------------------------------------------------------ the airfield and the jet */
const JET = {
  GEAR_X: -1.0, GEAR_Z: 2.86, WHEEL_R: 0.57, WHEEL_DZ: 0.42,
  NOSE_X: 14.4, NOSE_R: 0.38,
  ENG_X: 6.2, ENG_Y: 1.32, ENG_Z: 4.9, ENG_R: 0.95,
  WING_Y: 1.86, DIHEDRAL: 0.1,
};
/* the four braked wheels' centres in the jet's own frame */
const mainWheels = () => {
  const out = [];
  for (const s of [-1, 1]) for (const d of [-1, 1]) out.push([JET.GEAR_X, JET.WHEEL_R, s * (JET.GEAR_Z + d * JET.WHEEL_DZ)]);
  return out;
};

let _AW = null;
function airfieldWorld() {
  if (_AW) return _AW;
  const c = jc();
  _AW = world3d(async (T, w) => {
    const NIGHT = '#060a13';
    w.background(NIGHT); w.fog(NIGHT, 70, 720);
    w.room(0.22);
    const moon = w.sun({ dir: [-30, 40, 25], intensity: 0.9, color: '#9fb4d8', area: 34 });
    w.sun({ dir: [40, 18, -30], intensity: 0.55, color: '#ffb067', shadow: false });       // sodium glow from the apron
    w.ambient('#5a6f99', 0.55);

    /* ground and runway */
    const grass = w.add(new T.Mesh(new T.PlaneGeometry(9000, 9000), w.mat('#0b120e', { roughness: 1 })));
    grass.rotation.x = -Math.PI / 2; grass.receiveShadow = true;
    const RW0 = -320, RW1 = 3300, RWW = 45;
    const asphalt = w.add(new T.Mesh(new T.PlaneGeometry(RW1 - RW0, RWW), w.mat('#1d1f22', { roughness: 0.82, metalness: 0.05 })));
    asphalt.rotation.x = -Math.PI / 2; asphalt.position.set((RW0 + RW1) / 2, 0.01, 0); asphalt.receiveShadow = true;
    const paint = new T.MeshStandardMaterial({ color: 0xdfe3e6, roughness: 0.6, emissive: 0x30343a, emissiveIntensity: 0.4 });
    const NCL = Math.floor((RW1 - 40) / 50);
    const cl = w.instances(new T.BoxGeometry(30, 0.02, 0.9), paint, NCL);
    for (let i = 0; i < NCL; i++) cl.set(i, [40 + i * 50, 0.02, 0]);
    cl.commit(); cl.castShadow = false;
    const edge = w.instances(new T.BoxGeometry(RW1 - RW0, 0.02, 0.9), paint, 2);
    edge.set(0, [(RW0 + RW1) / 2, 0.02, RWW / 2 - 1.2]); edge.set(1, [(RW0 + RW1) / 2, 0.02, -RWW / 2 + 1.2]); edge.commit(); edge.castShadow = false;
    const keys = w.instances(new T.BoxGeometry(30, 0.02, 1.8), paint, 16);       // threshold "piano keys"
    for (let i = 0; i < 16; i++) { const k = i < 8 ? i : i + 2; keys.set(i, [-25, 0.02, -RWW / 2 + 3 + k * 2.15]); }
    keys.commit(); keys.castShadow = false;
    const aim = w.instances(new T.BoxGeometry(45, 0.02, 6), paint, 2);            // aiming-point blocks
    aim.set(0, [330, 0.02, 7.5]); aim.set(1, [330, 0.02, -7.5]); aim.commit(); aim.castShadow = false;

    /* runway lights: warm edge lights every 60 m, white centreline every 30 m, green threshold */
    const bulb = new T.SphereGeometry(0.22, 10, 8);
    const NEL = Math.floor((RW1 - RW0) / 60) + 1;
    const el = w.instances(bulb, w.glow('#ffd7a0', 6), NEL * 2);
    for (let i = 0; i < NEL; i++) for (const s of [0, 1]) el.set(i * 2 + s, [RW0 + i * 60, 0.35, (s ? 1 : -1) * (RWW / 2 + 1.5)]);
    el.commit(); el.castShadow = false;
    const NCLL = Math.floor((RW1 - RW0) / 30);
    const cll = w.instances(new T.SphereGeometry(0.12, 8, 6), w.glow('#eaf2ff', 4), NCLL);
    for (let i = 0; i < NCLL; i++) cll.set(i, [RW0 + 15 + i * 30, 0.06, 1.2], [1, 0.35, 1]);
    cll.commit(); cll.castShadow = false;
    const thl = w.instances(bulb, w.glow('#5dff9a', 5), 24);
    for (let i = 0; i < 24; i++) thl.set(i, [-31, 0.3, -RWW / 2 + i * (RWW / 23)]);
    thl.commit(); thl.castShadow = false;
    /* taxiway lights: blue, along a parallel taxiway */
    const tl = w.instances(new T.SphereGeometry(0.16, 8, 6), w.glow('#4f7dff', 5), 80);
    for (let i = 0; i < 80; i++) tl.set(i, [-200 + i * 45, 0.3, -150]);
    tl.commit(); tl.castShadow = false;
    /* the city on the horizon: thousands of small lights far away, and a few towers */
    const r = rng(11), NC = 2600;
    const city = w.instances(new T.BoxGeometry(1.4, 1.4, 1.4), new T.MeshBasicMaterial({ color: 0xffc27a, fog: false }), NC);
    for (let i = 0; i < NC; i++) {
      const side = r() < 0.7 ? -1 : 1, x = -900 + r() * 4800, z = side * (520 + r() * 700), h = r() < 0.08 ? 2 + r() * 30 : r() * 3;
      city.set(i, [x, h, z], 0.5 + r() * 1.3);
    }
    city.commit(); city.castShadow = false;
    city.material.color.multiplyScalar(0.55);

    /* --- the jet --- */
    const jet = w.group();
    const white = w.mat('#e8ecf0', { roughness: 0.35, metalness: 0.1 });
    const grey = w.mat('#9ea6ae', { roughness: 0.45, metalness: 0.5 });
    const dark = w.mat('#15181c', { roughness: 0.5 });
    const navy = w.mat('#1d3c78', { roughness: 0.35 });
    /* fuselage: nose at +17.6, tail cone sweeping up to −21.3 */
    const fus = [[17.6, 2.7, 0.0], [17.45, 2.72, 0.45], [17.1, 2.76, 0.85], [16.5, 2.83, 1.2], [15.7, 2.9, 1.5], [14.7, 2.96, 1.72],
      [13.4, 3.0, 1.86], [12, 3.0, 1.88], [0, 3.0, 1.88], [-10, 3.0, 1.88], [-12, 3.06, 1.8], [-14, 3.2, 1.6], [-16, 3.38, 1.32],
      [-18, 3.58, 0.98], [-19.8, 3.75, 0.62], [-20.9, 3.85, 0.32], [-21.3, 3.88, 0.0]];
    const body = w.add(new T.Mesh(loftX(T, fus, { seg: 48 }), white)); jet.add(body); body.castShadow = body.receiveShadow = true;
    /* a cheatline along each side and a grey belly fairing */
    for (const s of [-1, 1]) {
      const stripe = new T.Mesh(new T.BoxGeometry(25, 0.22, 0.04), navy); stripe.position.set(0.5, 2.58, s * 1.835); stripe.rotation.x = s * 0.24; jet.add(stripe);
    }
    const belly = new T.Mesh(loftX(T, [[6, 1.55, 0.0], [5.4, 1.5, 0.9], [3, 1.42, 1.45], [-4.5, 1.45, 1.45], [-6.6, 1.55, 0.9], [-7.4, 1.65, 0.0]], { ry: 0.35 }), grey);
    jet.add(belly);
    /* windows: lit cabin windows, a dark cockpit */
    const cabin = w.glow('#ffcf8a', 1.4);
    const NW = 46, win = new T.InstancedMesh(new T.BoxGeometry(0.26, 0.36, 0.05), cabin, NW * 2), M = new T.Matrix4(), Q = new T.Quaternion();
    for (let i = 0; i < NW; i++) for (const s of [0, 1]) {
      const x = -11.6 + i * 0.53 + (i > 18 ? 0.5 : 0);
      M.compose(new T.Vector3(x, 3.27, (s ? 1 : -1) * 1.862), Q.setFromEuler(new T.Euler(s ? -0.14 : 0.14, 0, 0)), new T.Vector3(1, 1, 1));
      win.setMatrixAt(i * 2 + s, M);
    }
    jet.add(win);
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
      const cw = new T.Mesh(new T.BoxGeometry(0.5, 0.36, 0.06), w.mat('#0c1118', { roughness: 0.1, metalness: 0.6 }));
      cw.position.set(15.75 + i * 0.42, 3.55 - i * 0.07, s * (1.38 - i * 0.2)); cw.rotation.set(s * 0.6, s * (0.35 + i * 0.25), -0.25); jet.add(cw);
    }
    /* tail: fin with the airline's navy, and tailplanes */
    const fin = new T.Mesh(plate(T, [[-13.6, 4.5], [-19.6, 11.2], [-21.5, 11.2], [-21.0, 3.9]], 0.26, { vertical: true }), navy);
    fin.castShadow = true; jet.add(fin);
    const tailMark = new T.Mesh(new T.CircleGeometry(0.9, 40), w.glow('#ffb23f', 0.35));
    for (const s of [-1, 1]) { const m = tailMark.clone(); m.position.set(-18.6, 8.2, s * 0.19); m.rotation.y = s > 0 ? 0 : Math.PI; jet.add(m); }
    for (const s of [-1, 1]) {
      const tp = new T.Mesh(plate(T, [[-16.3, 0.5], [-19.9, 6.6], [-21.0, 6.6], [-20.2, 0.5]], 0.18), white);
      tp.position.set(0, 3.55, 0); tp.scale.z = s; tp.rotation.x = -s * 0.12; tp.castShadow = true; jet.add(tp);
    }

    /* wings: one builder, the left wing is its mirror image */
    const xte = (z) => (z < 6.5 ? -3.8 : lerp(-3.8, -5.5, (z - 6.5) / 10.7));          // the trailing edge
    const xle = (z) => 3.6 - (z - 1.7) * 0.47;                                        // 25° sweep
    const spoilers = [], flaps = [];
    const buildWing = (s) => {
      const g = new T.Group(); g.position.set(0, JET.WING_Y, 0); g.scale.z = s; g.rotation.x = -s * JET.DIHEDRAL; jet.add(g);
      const wing = new T.Mesh(plate(T, [[xle(1.0), 1.0], [xle(17.2), 17.2], [-6.9, 17.2], [xte(6.5), 6.5], [xte(1.0), 1.0]], 0.3), white);
      wing.castShadow = wing.receiveShadow = true; g.add(wing);
      /* blended winglet */
      const wl = new T.Mesh(plate(T, [[0, 0], [-1.5, 2.4], [-2.4, 2.4], [-2.0, 0]], 0.08, { vertical: true }), navy);
      wl.position.set(-4.95, 0.3, 17.15); wl.rotation.x = -0.2; g.add(wl);
      /* nav light at the tip: red on the left (port), green on the right */
      const nav = new T.Mesh(new T.SphereGeometry(0.12, 12, 8), w.glow(s > 0 ? '#3dff7a' : '#ff3b30', 8)); nav.position.set(-5.2, 0.35, 17.1); g.add(nav);
      /* spoiler panels hinged along a line forward of the trailing edge, rising up to 50° */
      const panel = (z0, z1) => {
        const zc = (z0 + z1) / 2, yaw = Math.atan2(xte(z1) - xte(z0), z1 - z0);
        const hinge = new T.Group(); hinge.position.set(xte(zc) + 1.3, 0.33, zc); hinge.rotation.y = yaw; g.add(hinge);
        const piv = new T.Group(); hinge.add(piv);
        const m = new T.Mesh(new T.BoxGeometry(0.95, 0.05, (z1 - z0) / Math.cos(yaw) - 0.06), white); m.position.x = -0.47; m.castShadow = true; piv.add(m);
        spoilers.push(piv);
      };
      [[2.0, 4.2], [4.25, 6.4], [6.9, 8.8], [8.85, 10.7], [10.75, 12.6]].forEach(([a, b]) => panel(a, b));
      /* flaps behind the trailing edge */
      const flap = (z0, z1) => {
        const zc = (z0 + z1) / 2, yaw = Math.atan2(xte(z1) - xte(z0), z1 - z0);
        const hinge = new T.Group(); hinge.position.set(xte(zc) + 0.05, 0.12, zc); hinge.rotation.y = yaw; g.add(hinge);
        const piv = new T.Group(); hinge.add(piv);
        const m = new T.Mesh(new T.BoxGeometry(1.15, 0.1, (z1 - z0) / Math.cos(yaw) - 0.08), grey); m.position.x = -0.55; m.castShadow = true; piv.add(m);
        flaps.push(piv);
      };
      [[1.9, 6.4], [6.6, 12.8]].forEach(([a, b]) => flap(a, b));
    };
    buildWing(1); buildWing(-1);

    /* engines: nacelle front, translating sleeve, cascade, fan, spinner, exhaust, pylon */
    const engines = [], fanMat = w.mat('#20242a', { roughness: 0.4, metalness: 0.6 });
    for (const s of [-1, 1]) {
      const e = new T.Group(); e.position.set(JET.ENG_X, JET.ENG_Y, s * JET.ENG_Z); jet.add(e);
      const R = JET.ENG_R;
      const front = new T.Mesh(loftX(T, [[0.05, 0, R * 0.86], [0, 0, R * 0.93], [-0.15, 0, R], [-1.0, 0, R * 1.05], [-2.4, 0, R * 1.03]], { ry: 0.92 }), white);
      front.material = front.material.clone(); front.material.side = T.DoubleSide; front.castShadow = true; e.add(front);
      const lip = new T.Mesh(new T.TorusGeometry(R * 0.9, 0.06, 10, 48), grey); lip.rotation.y = Math.PI / 2; lip.scale.y = 0.92; lip.position.x = 0.03; e.add(lip);
      const sleeve = new T.Group(); e.add(sleeve);
      const sl = new T.Mesh(loftX(T, [[-2.4, 0, R * 1.03], [-3.3, 0, R * 0.95], [-4.0, 0, R * 0.8], [-4.5, 0, R * 0.66]], { ry: 0.92 }), white);
      sl.material = sl.material.clone(); sl.material.side = T.DoubleSide; sl.castShadow = true; sleeve.add(sl);
      const casc = new T.Mesh(new T.CylinderGeometry(R * 0.98, R * 0.98, 0.95, 40, 1, true), w.mat('#2b2f35', { roughness: 0.7, metalness: 0.4, side: T.DoubleSide }));
      casc.rotation.z = Math.PI / 2; casc.position.x = -2.9; casc.scale.z = 0.92; e.add(casc);
      for (let k = 0; k < 9; k++) { const rib = new T.Mesh(new T.TorusGeometry(R * 0.99, 0.018, 6, 40), grey); rib.rotation.y = Math.PI / 2; rib.scale.y = 0.92; rib.position.x = -2.45 - k * 0.11; e.add(rib); }
      const face = new T.Mesh(new T.CircleGeometry(R * 0.86, 40), w.mat('#0b0d10')); face.rotation.y = Math.PI / 2; face.position.x = -0.35; e.add(face);
      const fan = new T.Group(); fan.position.x = -0.3; e.add(fan);
      for (let k = 0; k < 22; k++) { const b = new T.Mesh(new T.BoxGeometry(0.03, R * 0.78, 0.16), fanMat); b.position.y = R * 0.42; const h = new T.Group(); h.rotation.x = (k / 22) * TAU; b.rotation.y = 0.5; h.add(b); fan.add(h); }
      const spin = new T.Mesh(new T.ConeGeometry(0.26, 0.55, 32), w.mat('#d9dde2', { roughness: 0.3, metalness: 0.6 })); spin.rotation.z = -Math.PI / 2; spin.position.x = -0.05; e.add(spin);
      const spiral = new T.Mesh(new T.BoxGeometry(0.02, 0.2, 0.02), dark); spiral.position.set(-0.02, 0.05, 0); spin.add(spiral);
      const noz = new T.Mesh(new T.ConeGeometry(0.42, 1.2, 32), w.mat('#3b3f45', { roughness: 0.5, metalness: 0.6 })); noz.rotation.z = Math.PI / 2; noz.position.x = -4.9; e.add(noz);
      const pylon = new T.Mesh(new T.BoxGeometry(4.6, 0.7, 0.28), white); pylon.position.set(-2.6, R * 0.75, 0); pylon.rotation.z = -0.06; e.add(pylon);
      engines.push({ e, sleeve, fan, s });
    }
    /* landing lights and a red beacon */
    const ll = w.glow('#fff4dc', 9);
    for (const s of [-1, 1]) { const b = new T.Mesh(new T.SphereGeometry(0.16, 12, 8), ll); b.position.set(3.0, 1.95, s * 2.4); jet.add(b); }
    const beaconMat = w.glow('#ff2a1f', 6);
    for (const y of [4.92, 1.12]) { const b = new T.Mesh(new T.SphereGeometry(0.11, 12, 8), beaconMat); b.position.set(-2, y, 0); jet.add(b); }
    for (const s of [-1, 1]) {
      const spot = new T.SpotLight(0xfff1d6, 9000, 260, 0.42, 0.55, 2);
      spot.position.set(3.4, 1.9, s * 2.4); spot.target.position.set(60, 0, s * 3); jet.add(spot); jet.add(spot.target);
    }

    /* landing gear: main gear (two struts, four braked wheels), nose gear */
    const tyreMat = w.mat('#121315', { roughness: 0.85 });
    const hubs = [], wheels = [];
    for (const s of [-1, 1]) {
      const strut = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 1.75, 16), grey); strut.position.set(JET.GEAR_X, JET.WHEEL_R + 0.85, s * JET.GEAR_Z); jet.add(strut);
      const axle = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 1.05, 12), grey); axle.rotation.x = Math.PI / 2; axle.position.set(JET.GEAR_X, JET.WHEEL_R, s * JET.GEAR_Z); jet.add(axle);
      const brace = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 1.9, 10), grey); brace.position.set(JET.GEAR_X + 0.5, JET.WHEEL_R + 1.0, s * (JET.GEAR_Z - 0.45)); brace.rotation.set(s * 0.5, 0, 0.35); jet.add(brace);
      for (const d of [-1, 1]) {
        const wh = new T.Group(); wh.position.set(JET.GEAR_X, JET.WHEEL_R, s * (JET.GEAR_Z + d * JET.WHEEL_DZ)); jet.add(wh);
        const tyre = new T.Mesh(new T.TorusGeometry(0.38, 0.19, 18, 48), tyreMat); tyre.scale.z = 1.05; tyre.castShadow = true; wh.add(tyre);
        const hubMat = w.mat('#a7afb7', { roughness: 0.35, metalness: 0.7 });
        const hub = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 0.34, 32), hubMat); hub.rotation.x = Math.PI / 2; wh.add(hub);
        const glowMat = w.mat('#1a1512', { roughness: 0.6 });
        for (let k = 0; k < 6; k++) {                      // holes in the hub's face, where the hot brake shows through
          const a = (k / 6) * TAU, hole = new T.Mesh(new T.CylinderGeometry(0.055, 0.055, 0.36, 12), glowMat);
          hole.rotation.x = Math.PI / 2; hole.position.set(Math.cos(a) * 0.18, Math.sin(a) * 0.18, 0); wh.add(hole);
        }
        const cap = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 0.37, 16), grey); cap.rotation.x = Math.PI / 2; wh.add(cap);
        hubs.push({ hubMat, glowMat }); wheels.push(wh);
      }
    }
    const nstrut = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 1.0, 12), grey); nstrut.position.set(JET.NOSE_X, JET.NOSE_R + 0.5, 0); jet.add(nstrut);
    const noseWheels = [];
    for (const d of [-1, 1]) {
      const wh = new T.Group(); wh.position.set(JET.NOSE_X, JET.NOSE_R, d * 0.24); jet.add(wh);
      const ty = new T.Mesh(new T.TorusGeometry(0.25, 0.13, 14, 36), tyreMat); ty.castShadow = true; wh.add(ty);
      const hb = new T.Mesh(new T.CylinderGeometry(0.18, 0.18, 0.2, 20), grey); hb.rotation.x = Math.PI / 2; wh.add(hb);
      noseWheels.push(wh);
    }

    /* lift (up) and weight (down) arrows, shown while the spoilers work */
    const liftArrows = [], weightArrows = [];
    for (const s of [-1, 1]) for (const z of [5, 9.5, 13.5]) {
      liftArrows.push(w.arrow([-1.5 - (z - 5) * 0.4, JET.WING_Y + 0.6 + z * 0.1, s * z], [-1.5 - (z - 5) * 0.4, JET.WING_Y + 3.4 + z * 0.1, s * z], { color: 'subject', radius: 0.12, glow: 1.6, parent: jet }));
      if (z === 5) weightArrows.push(w.arrow([JET.GEAR_X, 6.4, s * JET.GEAR_Z], [JET.GEAR_X, 2.3, s * JET.GEAR_Z], { color: 'accent', radius: 0.16, glow: 1.8, parent: jet }));
    }

    /* the reverser's air: streaks blown out of the cascades and forward */
    const NA = 220, airMat = new T.MeshBasicMaterial({ color: 0xdfe9ff, transparent: true, opacity: 0.38, depthWrite: false });
    const air = w.instances(new T.BoxGeometry(0.9, 0.035, 0.035), airMat, NA); jet.add(air); air.castShadow = false;
    /* energy: glowing motes flowing from the moving jet into the four brakes */
    const NE = 360, motes = w.instances(new T.SphereGeometry(0.16, 8, 6), w.glow('#ffb23f', 5), NE); jet.add(motes); motes.castShadow = false;
    /* tyre smoke and steam stay where they were made (world frame) */
    const NS = 160, smokeMat = new T.MeshStandardMaterial({ color: 0xd8dade, transparent: true, opacity: 0.16, depthWrite: false, roughness: 1 });
    const smoke = w.instances(new T.SphereGeometry(1, 12, 10), smokeMat, NS); smoke.castShadow = false;
    const NST = 120, steamMat = new T.MeshStandardMaterial({ color: 0xc7ccd4, transparent: true, opacity: 0.12, depthWrite: false, roughness: 1 });
    const steam = w.instances(new T.SphereGeometry(1, 12, 10), steamMat, NST); steam.castShadow = false;

    /* fire trucks waiting at the edge of the light, light bars flashing */
    const trucks = [], barR = w.glow('#ff2a1f', 7), barB = w.glow('#2f6bff', 7);
    const truckAt = [[c.xStop + 12, 36, -2.6], [c.xStop - 9, 39, -2.2], [c.xStop + 30, 33, -2.9]];
    for (const [x, z, yaw] of truckAt) {
      const g = w.group({ at: [x, 0, z] }); g.rotation.y = yaw;
      w.box([8.5, 2.6, 2.6], '#b3221a', { parent: g, at: [-0.6, 1.9, 0] });
      w.box([2.4, 2.4, 2.6], '#c4271d', { parent: g, at: [4.6, 1.8, 0] });
      w.box([0.05, 0.9, 2.2], '#0d1218', { parent: g, at: [5.82, 2.35, 0] });
      w.box([8.4, 0.35, 2.66], '#e8e3d4', { parent: g, at: [-0.6, 1.25, 0] });
      for (const [xx, zz] of [[3.7, 1.25], [3.7, -1.25], [-2.4, 1.25], [-2.4, -1.25], [-4.0, 1.25], [-4.0, -1.25]]) w.cyl(0.6, 0.45, '#111214', { parent: g, at: [xx, 0.6, zz], rot: [Math.PI / 2, 0, 0] });
      const r1 = w.box([0.5, 0.25, 0.9], '#ff2a1f', { parent: g, at: [4.6, 3.15, 0.55] }), b1 = w.box([0.5, 0.25, 0.9], '#2f6bff', { parent: g, at: [4.6, 3.15, -0.55] });
      r1.material = barR; b1.material = barB;
      w.box([1.4, 0.4, 0.4], '#c9ccd0', { parent: g, at: [1.5, 3.45, 0] });                  // the roof turret
      trucks.push(g);
    }

    const V = new T.Vector3();
    return (t) => {
      const st = jetState(t);
      jet.position.set(st.x, 0, 0);
      jet.rotation.z = -0.022 * st.dip;                       // the nose dips as the brakes bite
      for (const p of spoilers) p.rotation.z = -0.87 * st.spoil;
      for (const p of flaps) p.rotation.z = 0.52 * st.flaps;
      for (const en of engines) {
        en.sleeve.position.x = -0.85 * st.rev;
        en.fan.rotation.x = t * (st.idle > 0.9 ? 9 : st.idle > 0.5 ? 18 : 36);
      }
      const roll = -st.x / JET.WHEEL_R;
      for (const wh of wheels) wh.rotation.z = roll;
      for (const wh of noseWheels) wh.rotation.z = -st.x / JET.NOSE_R;
      for (let i = 0; i < hubs.length; i++) {
        const k = st.heat * (0.92 + 0.08 * hash(i * 3.1));
        heatMat(hubs[i].glowMat, k, 1.6);
        heatMat(hubs[i].hubMat, k * 0.55, 0.35);
      }
      beaconMat.emissiveIntensity = (t % 1.0) < 0.12 ? 12 : 0.4;
      /* lift and weight: on the normal landing, while the spoilers deploy */
      const showArrows = t > c.panels - 0.4 && t < c.engines - 0.2;
      const lift = showArrows ? (1 - 0.82 * st.spoil) * tw(t, c.panels - 0.4, c.panels) : 0;
      liftArrows.forEach((a) => a.grow(lift));
      const wt = showArrows ? tw(t, c.dump, c.wheels + 0.2, E.out3) : 0;
      weightArrows.forEach((a) => a.grow(wt));
      /* reverser air */
      for (let i = 0; i < NA; i++) {
        const en = engines[i % 2], P = 0.55, ph = hash(i * 1.7), age = (t + ph * P) % P, k = age / P;
        const ang = TAU * hash(i * 4.3), on = st.rev > 0.5 && hash(i * 9.1) < st.rev;
        const rad = JET.ENG_R * (1.05 + 2.6 * k), fwd = 4.2 * k;
        air.set(i, on ? [JET.ENG_X - 2.9 + fwd, JET.ENG_Y + Math.cos(ang) * rad * 0.92, en.s * JET.ENG_Z + Math.sin(ang) * rad] : [0, -100, 0], on ? [1 + k, 1, 1] : 0.0001, [0, -Math.sin(ang) * 0.6, Math.cos(ang) * 0.6]);
      }
      air.commit();
      /* energy motes: from all over the jet into the four wheels, while the heat line is said */
      const wl = mainWheels(), eOn = t > c.thats - 0.3 && t < c.they;
      for (let i = 0; i < NE; i++) {
        const P = 1.1, ph = hash(i * 2.9), age = (t + ph * P) % P, k = E.in2(age / P), wv = wl[i % 4];
        const sx = -16 + 32 * hash(i * 5.3), sy = 2.2 + 3.4 * hash(i * 6.1), sz = (hash(i * 7.7) - 0.5) * 30;
        const on = eOn && hash(i * 3.3) < tw(t, c.thats - 0.3, c.mega, E.lin);
        motes.set(i, on ? [lerp(sx, wv[0], k), lerp(sy, wv[1], k), lerp(sz, wv[2], k)] : [0, -100, 0], on ? 1 - 0.6 * k : 0.0001);
      }
      motes.commit();
      /* tyre smoke behind the main wheels: when the brakes slam, and a puff on the normal roll */
      for (let i = 0; i < NS; i++) {
        const L = 2.4, born = (c.slams - 0.05) + 3.0 * hash(i * 1.3), age = t - born, wv = wl[i % 4];
        const born2 = c.N0 + 0.8 * hash(i * 2.1), age2 = t - born2;
        let pos = null, sc = 0.0001;
        const at0 = (tb) => jetState(tb).x;
        if (age > 0 && age < L && t < c.stop + 3) { const k = age / L; pos = [at0(born) + wv[0] - 1 - 2 * k, 0.3 + 1.6 * k + 0.4 * hash(i), wv[2] + (wv[2] > 0 ? 1 : -1) * 1.6 * k]; sc = 0.5 + 2.2 * k; }
        else if (age2 > 0 && age2 < 1.6 && i % 3 === 0) { const k = age2 / 1.6; pos = [at0(born2) + wv[0] - 1 - 3 * k, 0.3 + 1.1 * k, wv[2]]; sc = 0.4 + 1.4 * k; }
        smoke.set(i, pos || [0, -100, 0], sc);
      }
      smoke.commit();
      smokeMat.opacity = 0.16;
      /* steam rising off the hot gear once the jet has stopped */
      for (let i = 0; i < NST; i++) {
        const L = 3.2, ph = hash(i * 8.3), age = (t + ph * L) % L, k = age / L, wv = wl[i % 4];
        const on = t > c.stop - 0.5;
        steam.set(i, on ? [c.xStop + wv[0] + (hash(i * 3) - 0.5) * 0.8 - 1.5 * k, 0.8 + 4.5 * k, wv[2] + (hash(i * 5) - 0.5) * 0.8] : [0, -100, 0], on ? 0.25 + 1.3 * k : 0.0001);
      }
      steam.commit();
      /* fire trucks: only once the jet has stopped; their bars flash */
      const tOn = t > c.R0 - 0.6;
      trucks.forEach((g) => { g.visible = tOn; });
      const ph = (t * 2.2) % 1;
      barR.emissiveIntensity = ph < 0.5 ? 9 : 0.5; barB.emissiveIntensity = ph < 0.5 ? 0.5 : 9;
      /* the moon's shadow camera follows the jet */
      moon.position.set(st.x - 30, 40, 25); moon.target.position.set(st.x, 0, 0);
      V.set(0, 0, 0);
    };
  });
  return _AW;
}

/* camera helper: a key relative to the jet's position at time tk */
function jcam(tk, from, to, fov = 40) {
  const x = jetState(tk).x;
  return { from: [x + from[0], from[1], from[2]], to: [x + to[0], to[1], to[2]], fov };
}
/* a camera that rides with the jet (relative offsets, evaluated at the current time) */
function ride(t, from, to, fov = 40) { return jcam(t, from, to, fov); }

/* ------------------------------------------------------------------ the brake, close up */
const BRK = { RO: 0.78, RI: 0.36, TH: 0.062, GAP: 0.012, N: 9, WHEEL_X: 12 };
let _BKW = null;
function brakeWorld() {
  if (_BKW) return _BKW;
  const c = jc();
  _BKW = world3d(async (T, w) => {
    const BG = '#0a0d12';
    w.background(BG); w.fog(BG, 6, 22);
    w.room(0.35);
    w.sun({ dir: [3, 6, 4], intensity: 2.2, color: '#ffe2c4', area: 5 });
    w.sun({ dir: [-5, 2, -3], intensity: 1.2, color: '#6f8fd8', shadow: false });       // cool rim light
    w.ambient('#6c7da8', 0.35);
    w.ground({ color: '#121519', y: -1.05, roughness: 0.6 });

    /* ---- the stack: axle along z ---- */
    const ring = (ro, ri, th) => {
      const sh = new T.Shape(); sh.absarc(0, 0, ro, 0, TAU, false);
      const hole = new T.Path(); hole.absarc(0, 0, ri, 0, TAU, true); sh.holes.push(hole);
      const g = new T.ExtrudeGeometry(sh, { depth: th, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 1, curveSegments: 72 });
      g.translate(0, 0, -th / 2);
      return g;
    };
    const stack = new T.Group(); w.add(stack);
    const discs = [];
    const L = BRK.N * BRK.TH + (BRK.N - 1) * BRK.GAP;
    for (let i = 0; i < BRK.N; i++) {
      const rotor = i % 2 === 1;
      const mat = w.mat(rotor ? '#2c2a28' : '#232220', { roughness: 0.62, metalness: 0.18 });
      const g = new T.Group(); g.position.z = -L / 2 + BRK.TH / 2 + i * (BRK.TH + BRK.GAP); stack.add(g);
      const d = new T.Mesh(ring(rotor ? BRK.RO : BRK.RO - 0.05, rotor ? BRK.RI + 0.05 : BRK.RI, BRK.TH), mat); d.castShadow = d.receiveShadow = true; g.add(d);
      /* drive keys: rotors on the outer edge (turn with the wheel), stators on the inner edge */
      const NK = rotor ? 16 : 12;
      for (let k = 0; k < NK; k++) {
        const a = (k / NK) * TAU, key = new T.Mesh(new T.BoxGeometry(0.07, 0.06, BRK.TH * 0.98), mat);
        const rr = rotor ? BRK.RO + 0.02 : BRK.RI - 0.02;
        key.position.set(Math.cos(a) * rr, Math.sin(a) * rr, 0); key.rotation.z = a; g.add(key);
      }
      discs.push({ g, mat, rotor });
    }
    const steel = w.mat('#8b939b', { roughness: 0.35, metalness: 0.8 });
    const tube = new T.Mesh(new T.CylinderGeometry(BRK.RI - 0.06, BRK.RI - 0.06, L + 0.5, 48, 1, true), steel);
    tube.rotation.x = Math.PI / 2; tube.material = steel.clone(); tube.material.side = T.DoubleSide; stack.add(tube);
    const housing = new T.Mesh(ring(BRK.RO - 0.02, BRK.RI - 0.06, 0.16), steel); housing.position.z = -L / 2 - 0.12; housing.castShadow = true; stack.add(housing);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU + 0.2, p = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, 0.12, 20), w.mat('#b9c0c7', { roughness: 0.3, metalness: 0.85 }));
      p.rotation.x = Math.PI / 2; p.position.set(Math.cos(a) * 0.57, Math.sin(a) * 0.57, -L / 2 - 0.26); stack.add(p);
    }
    /* the wear pin: sticks out of the housing; shorter as the stack wears */
    const pin = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, 1, 12), w.mat('#d8dde2', { roughness: 0.2, metalness: 0.9 }));
    pin.rotation.x = Math.PI / 2; stack.add(pin);
    const pinTip = new T.Mesh(new T.SphereGeometry(0.03, 12, 8), w.glow('#ffb23f', 2)); stack.add(pinTip);
    /* a stand under it */
    w.box([0.5, 0.55, 0.7], '#1c2026', { at: [0, -0.78, 0] });
    w.box([1.9, 0.08, 1.4], '#22272e', { at: [0, -1.0, 0] });

    /* ---- the cutting wheel, on an arm, sweeping across the top of the stack ---- */
    const grinder = new T.Group(); w.add(grinder);
    const gw = new T.Mesh(new T.CylinderGeometry(0.34, 0.34, 0.03, 64), w.mat('#9aa0a6', { roughness: 0.5, metalness: 0.6 }));
    gw.rotation.x = Math.PI / 2; grinder.add(gw);
    const gh = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 0.12, 20), w.mat('#2b2f35')); gh.rotation.x = Math.PI / 2; grinder.add(gh);
    const guard = new T.Mesh(new T.CylinderGeometry(0.38, 0.38, 0.1, 48, 1, true, 0, Math.PI), w.mat('#d39a2a', { roughness: 0.4, side: T.DoubleSide }));
    guard.rotation.x = Math.PI / 2; guard.rotation.y = Math.PI / 2; grinder.add(guard);
    const arm = new T.Mesh(new T.BoxGeometry(0.12, 1.3, 0.12), w.mat('#d39a2a', { roughness: 0.4 })); arm.position.set(0.1, 0.7, -0.08); arm.rotation.z = -0.15; grinder.add(arm);
    const NSP = 320, sparks = w.instances(new T.BoxGeometry(0.012, 0.012, 0.09), w.glow('#ffb347', 9), NSP); sparks.castShadow = false;
    const gZ = (tt) => lerp(-L / 2 - 0.02, L / 2 + 0.02, 0.5 - 0.5 * Math.cos(TAU * 0.33 * (tt + 1.2)));

    /* ---- the wheel with the fuse plug, at x = 12 ---- */
    const wheel = new T.Group(); wheel.position.set(BRK.WHEEL_X, 0, 0); w.add(wheel);
    const tyreRoot = new T.Group(); wheel.add(tyreRoot);
    const tyre = new T.Mesh(new T.TorusGeometry(0.43, 0.2, 28, 72), w.mat('#121315', { roughness: 0.82 }));
    tyre.scale.z = 1.25; tyre.castShadow = true; tyreRoot.add(tyre);
    const rim = new T.Mesh(new T.CylinderGeometry(0.43, 0.43, 0.46, 64), w.mat('#a9b1b9', { roughness: 0.28, metalness: 0.85 }));
    rim.rotation.x = Math.PI / 2; tyreRoot.add(rim);
    const glowFace = w.mat('#1a1512', { roughness: 0.6 });
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU, hole = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.02, 16), glowFace);
      hole.rotation.x = Math.PI / 2; hole.position.set(Math.cos(a) * 0.25, Math.sin(a) * 0.25, 0.232); tyreRoot.add(hole);
    }
    const capW = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 0.06, 24), w.mat('#d3d8dd', { roughness: 0.2, metalness: 0.9 })); capW.rotation.x = Math.PI / 2; capW.position.z = 0.25; tyreRoot.add(capW);
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * TAU, bolt = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, 0.04, 6), w.mat('#6c737a', { metalness: 0.9, roughness: 0.3 }));
      bolt.rotation.x = Math.PI / 2; bolt.position.set(Math.cos(a) * 0.36, Math.sin(a) * 0.36, 0.24); tyreRoot.add(bolt);
    }
    /* the fuse plug: a small hex plug in the rim; when hot it glows, slumps and is gone */
    const plugMat = w.mat('#c9a24a', { roughness: 0.3, metalness: 0.8 });
    const plug = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 0.05, 6), plugMat);
    plug.rotation.x = Math.PI / 2; plug.position.set(-0.16, 0.13, 0.245); tyreRoot.add(plug);
    const plugHole = new T.Mesh(new T.CircleGeometry(0.022, 16), w.mat('#050505')); plugHole.position.set(-0.16, 0.13, 0.236); tyreRoot.add(plugHole);
    const NJ = 160, jetMat = new T.MeshBasicMaterial({ color: 0xe8eef8, transparent: true, opacity: 0.5, depthWrite: false });
    const airJet = w.instances(new T.BoxGeometry(0.008, 0.008, 0.12), jetMat, NJ); airJet.castShadow = false;
    const drips = w.instances(new T.SphereGeometry(0.012, 8, 6), w.glow('#ffb23f', 6), 12); drips.castShadow = false;
    const floor2 = new T.Mesh(new T.PlaneGeometry(6, 6), w.mat('#1a1c1f', { roughness: 0.85 })); floor2.rotation.x = -Math.PI / 2; floor2.position.set(BRK.WHEEL_X, -0.63, 0); floor2.receiveShadow = true; w.add(floor2);
    const shim = w.instances(new T.SphereGeometry(1, 10, 8), new T.MeshStandardMaterial({ color: 0xc4c9d0, transparent: true, opacity: 0.08, depthWrite: false }), 40); shim.castShadow = false;

    /* the brake's heat in this world: the same story as the jet's (heat beat), plus the hook's spark */
    const heatAt = (t) => {
      if (t < c.N0) return 0;
      if (t < c.T0) return 0.24 * tw(t, c.carbon - 0.3, c.heat1 + 0.4, E.lin);
      return clamp(E.in2(prog(t, c.slams, c.degrees + 0.3)));
    };
    const wear = (t) => (t < c.N0 ? tw(t, 0.4, at('hook', 'out') + 0.2, E.io3) : 1);     // 0 new … 1 worn to 2%

    return (t) => {
      /* the stack: machined thinner in the hook; clamped (gaps close) while braking */
      const wr = wear(t), clampK = t < c.N0 ? 0 : tw(t, c.carbon - 0.3, c.carbon + 0.3);
      const th = 1 - 0.38 * wr, gap = BRK.GAP * (1 - 0.85 * clampK);
      const Ln = BRK.N * BRK.TH * th + (BRK.N - 1) * gap;
      const hk = heatAt(t), spin = t < c.N0 ? 0 : t * (t < c.slams ? 2.2 : 2.2 * (1 - tw(t, c.slams, c.R0)));
      discs.forEach((d, i) => {
        d.g.position.z = -Ln / 2 + (BRK.TH * th) / 2 + i * (BRK.TH * th + gap);
        d.g.scale.z = th;
        d.g.rotation.z = d.rotor ? spin : 0;
        const mid = 1 - Math.abs(i - (BRK.N - 1) / 2) / ((BRK.N - 1) / 2);   // the middle of the stack runs hottest
        heatMat(d.mat, clamp(hk * (0.82 + 0.18 * mid)), 1);
      });
      pin.scale.y = lerp(0.42, 0.05, wr); pin.position.set(0.55, -0.32, -Ln / 2 - 0.2 - pin.scale.y / 2);
      pinTip.position.set(0.55, -0.32, -Ln / 2 - 0.2 - pin.scale.y);
      /* the grinder: in the hook only */
      const gOn = t < c.N0;                      // the grinder works in the hook (and before it: the loop's end draws t < 0)
      grinder.visible = gOn;
      const tt = t;
      const gz = gZ(tt);
      grinder.position.set(0, BRK.RO + 0.34 - 0.008, gz);
      gw.rotation.y = -tt * 40;
      for (let i = 0; i < NSP; i++) {
        const P = 0.55, ph = hash(i * 1.37), age = (tt + ph * P) % P, born = tt - age;
        const on = gOn && born > -8;
        const vx = -(3.2 + 2.6 * hash(i * 2.11)), vy = 0.6 + 1.9 * hash(i * 3.7), vz = (hash(i * 5.9) - 0.5) * 1.6;
        const x = vx * age, y = BRK.RO + vy * age - 4.9 * age * age, z = gZ(born) + vz * age;
        sparks.set(i, on && y > -1 ? [x, y, z] : [0, -100, 0], on ? 1 : 0.0001, [0, Math.atan2(vx, vz), Math.atan2(vy - 9.8 * age, Math.hypot(vx, vz)) * 0.5]);
      }
      sparks.commit();
      /* the wheel: the fuse plug melts and the air goes */
      const hw = Math.max(hk, t > c.H0 ? 0.9 : 0);
      heatMat(glowFace, hw, 1.2);
      const melt = tw(t, c.plugs, c.melt + 0.25, E.in2), gone = t > c.melt + 0.25;
      heatMat(plugMat, gone ? 0 : 0.3 + 0.7 * melt, 0.8);
      plug.scale.set(1, gone ? 0.0001 : 1 - 0.55 * melt, 1 - 0.6 * melt);
      plug.visible = !gone;
      for (let i = 0; i < 12; i++) {
        const age = t - (c.melt - 0.1 + i * 0.05), on = age > 0 && age < 0.8;
        drips.set(i, on ? [-0.16 + (hash(i) - 0.5) * 0.03, 0.12 - 2.4 * age * age, 0.26 + 0.05 * hash(i * 2)] : [0, -100, 0], on ? 1 : 0.0001);
      }
      drips.commit();
      const deflate = tw(t, c.air - 0.1, c.burst + 0.6, E.out3);
      const jetK = gone ? 1 - 0.7 * tw(t, c.burst, c.burst + 1.2) : 0;
      for (let i = 0; i < NJ; i++) {
        const P = 0.35, age = (t + hash(i * 3.1) * P) % P, k = age / P, ang = (hash(i * 7.3) - 0.5) * 0.9, el = (hash(i * 9.7) - 0.5) * 0.7;
        const on = jetK > 0 && hash(i * 11.3) < jetK;
        const d = 0.05 + 1.3 * k;
        airJet.set(i, on ? [-0.16 + Math.sin(ang) * d * 0.5, 0.13 + Math.sin(el) * d * 0.4, 0.26 + d] : [0, -100, 0], on ? [1, 1, 1 + 2 * k] : 0.0001, [el, ang, 0]);
      }
      airJet.commit();
      tyre.scale.set(1 + 0.05 * deflate, 1 - 0.16 * deflate, 1.25 + 0.08 * deflate);
      tyreRoot.position.y = -0.6 * 0.16 * deflate * 0.55;
      for (let i = 0; i < 40; i++) {
        const P = 2.0, age = (t + hash(i * 4.4) * P) % P, k = age / P, on = t > c.H0 && hw > 0.5;
        shim.set(i, on ? [BRK.WHEEL_X + (hash(i * 2) - 0.5) * 0.6, 0.4 + 1.6 * k, (hash(i * 6) - 0.5) * 0.4] : [0, -100, 0], on ? 0.08 + 0.3 * k : 0.0001);
      }
      shim.commit();
    };
  });
  return _BKW;
}

/* ------------------------------------------------------------------ the hook's bench shot, shared
   The hook opens on it, and the payoff's last shot draws it again at t − DATA.dur (just before the
   video's start), so the end runs straight into the first frame when the Short loops. */
function hookBench(ctx, tt) {
  const c = jc(), bw = brakeWorld(), out = at('hook', 'out');
  const cam = camPath(tt, [[-3, { from: [4.1, 2.4, 4.6], to: [0, 0.1, 0], fov: 36 }],
    [0, { from: [3.6, 2.1, 4.1], to: [0, 0.1, 0], fov: 36 }],
    [c.N0, { from: [2.9, 1.75, 3.35], to: [0, 0.12, 0], fov: 36 }]], { ease: E.lin });
  view3d(ctx, bw, tt, cam);
  const wear = tw(tt, 0.4, out + 0.2, E.io3);
  ringGauge(ctx, 860, 520, 100, 1 - 0.98 * wear, { p: tw(tt, 0.25, 0.85, E.lin), color: wear > 0.8 ? 'alert' : 'accent',
    show: (k) => `${Math.round(k * 100)}%`, label: 'BRAKE LEFT', ticks: 40 });
}

/* a jolt for a hard hit: shifts and slightly zooms the frame for a moment after t0 (wrap the draw in
   ctx.save()/restore()) */
function jolt(ctx, t, t0, amp = 16, dur = 0.6) {
  const [a, ph] = shake(t, t0, amp, dur);
  if (a <= 0) return;
  const z = 1 + a / 400;
  ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
  ctx.translate(Math.sin(ph * 1.7) * a, Math.cos(ph * 2.3) * a);
}
/* a point of a 3D view on the frame, or null when it's behind the camera */
function pin(v, p) { if (!v) return null; const q = v.project(p); return q[2] ? q : null; }
