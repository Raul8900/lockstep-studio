'use strict';
/* =====================================================================
   components.js — a narrow-body airliner and a wet airfield at dusk, built in
   code for a film world (engine/anim/js/film3d.js). No downloaded models, no
   generated imagery: shapes from maths, looks from shaders.

     const ac = await airliner(T, w, { … })    the aircraft: ac.object, ac.pose(t, state)
     const af = await airfield(T, w, { … })    runway, grass, lights, the far landscape
   ===================================================================== */

/* GLSL shared by the aircraft's skins: panel seams, rivets, grime */
const AC_GLSL = /* glsl */`
float seam(float x, float period, float w){ float f = abs(fract(x / period + 0.5) - 0.5) * period; return 1.0 - smoothstep(0.0, w, f); }
`;

async function airliner(T, w, o = {}) {
  const root = new T.Group(); w.scene.add(root);
  const body = new T.Group(); root.add(body);
  const AX = o.axisY || 3.15;                      // fuselage axis above the ground
  body.position.y = AX;
  const R = 1.9;

  /* ---------- the fuselage: a body of revolution, the tail swept up, the nose drooping a little ---------- */
  const fusGeo = w.lathe([[-19.7, 0.04], [-19.3, 0.32], [-17.6, 0.82], [-15.2, 1.36], [-12.2, 1.8], [-9.5, 1.9], [0, 1.9], [11.5, 1.9], [14.2, 1.86], [15.8, 1.72], [17.1, 1.47], [18.2, 1.12], [19.05, 0.7], [19.55, 0.3], [19.72, 0.02]], {
    segments: 128, samples: 220,
    sag: (z) => (z < -9.5 ? Math.pow((-9.5 - z) / 10.2, 1.7) * 1.15 : 0) - (z > 15.2 ? Math.pow((z - 15.2) / 4.5, 2) * 0.32 : 0),
  });
  const paint = w.surface({
    color: '#ffffff', roughness: 0.32, metalness: 0.0, clearcoat: 0.7, clearcoatRoughness: 0.12, bump: 1,
    key: 'fuselage',
    uniforms: { uCabin: { value: new T.Vector3(...(o.cabin || [2.4, 1.6, 0.85])) } },
    glsl: {
      pars: AC_GLSL,
      albedo: /* glsl */`
        float ang = atan(L.y, L.x);                                   // around the fuselage
        float s = L.z;                                                // along it, metres from the middle
        vec3 white = vec3(0.80, 0.80, 0.79), belly = vec3(0.50, 0.52, 0.55), blue = vec3(0.012, 0.035, 0.11), amber = vec3(0.75, 0.38, 0.05);
        base = white;
        float yb = L.y;
        base = mix(base, belly, smoothstep(-0.55, -0.75, yb));          // grey belly
        float stripeY = 0.02;                                         // the cheat line under the windows
        base = mix(base, blue, smoothstep(0.03, 0.0, abs(yb - stripeY + 0.0) - 0.07) * step(-14.5, s) * step(s, 16.8));
        base = mix(base, amber, smoothstep(0.012, 0.0, abs(yb + 0.11) - 0.022) * step(-14.5, s) * step(s, 16.8));
        /* seams: frames every 0.51 m, stringers every 0.6 m around; rivet rows */
        float fr = seam(s, 2.04, 0.012), st = seam(ang * ${R.toFixed(2)}, 1.25, 0.010);
        float riv = step(0.93, hash12(floor(vec2(s * 12.0, ang * ${R.toFixed(2)} * 12.0)))) * max(seam(s, 0.51, 0.025), seam(ang * ${R.toFixed(2)}, 0.6, 0.02));
        h = -0.0012 * max(fr, st) + 0.0004 * riv;
        base *= 1.0 - 0.18 * max(fr, st);
        /* grime: streaks running back from the belly and the wing root, the paint gone a little matt */
        float gr = fbm(vec2(s * 0.35, ang * 3.0)) * smoothstep(-0.2, -1.6, yb);
        base *= 1.0 - 0.22 * gr;
        rough = 0.26 + 0.3 * gr + 0.08 * fbm(vec2(s, ang * 8.0));
        /* passenger windows: one row each side, doors left out */
        float side = abs(L.x) - 1.15;
        float wy = (yb - 0.46) / 0.19;
        float pitch = 0.508; float k = floor((s + 0.2) / pitch); float fx = (fract((s + 0.2) / pitch) - 0.5) * pitch / 0.13;
        bool door = (s > 13.0 && s < 14.6) || (s < -12.3 && s > -13.9) || (s > -0.6 && s < 0.4);
        float win = (side > 0.0 && s > -12.0 && s < 13.0 && !door) ? 1.0 - smoothstep(0.85, 1.0, length(pow(abs(vec2(fx, wy)), vec2(2.4)))) : 0.0;
        if (win > 0.0) { float lit = step(0.18, hash11(k * 3.7 + sign(L.x))) * (0.75 + 0.5 * hash11(k * 1.9));
          base = mix(base, vec3(0.01), win); rough = mix(rough, 0.05, win); h += -0.002 * win;
          emit += uCabin * lit * win * smoothstep(1.0, 0.2, length(vec2(fx, wy))); }
        /* the cockpit windscreen: a dark band round the nose with its posts */
        float cz = (s - 16.95) / 1.2, cy = (yb - 0.62 + 0.25 * cz) / 0.24;
        float wind = (s > 16.0 && s < 18.25 && abs(cy) < 1.0 && abs(L.x) < 1.45) ? 1.0 : 0.0;
        float post = smoothstep(0.03, 0.0, abs(fract(atan(L.x, L.y + 0.4) * 1.6 + 0.5) - 0.5) - 0.0);
        wind *= 1.0 - 0.9 * post * step(abs(L.x), 1.2);
        base = mix(base, vec3(0.004, 0.006, 0.01), wind); rough = mix(rough, 0.03, wind); metal = mix(metal, 0.0, wind);
        /* doors: outlines */
        float dl = (abs(L.x) > 1.0 && yb > -0.6 && yb < 1.35) ? max(step(abs(s - 13.8) - 0.55, 0.0) * (1.0 - step(abs(s - 13.8) - 0.53, 0.0)), step(abs(s + 13.1) - 0.55, 0.0) * (1.0 - step(abs(s + 13.1) - 0.53, 0.0))) : 0.0;
        base *= 1.0 - 0.5 * dl; h -= 0.0015 * dl;
      `,
    },
  });
  const fus = new T.Mesh(fusGeo, paint); fus.castShadow = true; fus.receiveShadow = true; body.add(fus);

  /* ---------- wings, with winglets and spoiler panels ---------- */
  const wingMat = w.surface({
    color: '#c9ccd0', roughness: 0.38, metalness: 0.35, clearcoat: 0.2, bump: 1, key: 'wing',
    glsl: {
      pars: AC_GLSL,
      albedo: /* glsl */`
        float sp = UV.x, ch = UV.y;                                     // span 0..1, around the section 0..1 (0.5 = leading edge)
        base = vec3(0.70, 0.71, 0.72);
        float le = smoothstep(0.06, 0.0, abs(ch - 0.5));               // the bare-metal leading edge
        base = mix(base, vec3(0.80, 0.80, 0.82), le); metal = mix(metal, 0.95, le); rough = mix(rough, 0.18, le);
        float sm = max(seam(P.x + P.z * 0.4, 1.9, 0.01), seam(ch * 9.0, 1.0, 0.012));
        base *= 1.0 - 0.2 * sm; h = -0.001 * sm;
        float gr = fbm(vec2(sp * 18.0, ch * 30.0)); rough += 0.15 * gr; base *= 0.92 + 0.1 * gr;
        float walk = smoothstep(0.004, 0.0, abs(ch - 0.32) - 0.002) * step(sp, 0.35);  // walkway line
        base = mix(base, vec3(0.08), walk);
      `,
    },
  });
  const wingGeo = (mirror) => w.wing({ span: 15.6, root: 6.9, tip: 1.5, sweep: 0.48, dihedral: 0.105, thick: 0.13, camber: 0.022, twist: 0.04, mirror, spanSegs: 40, chordSegs: 48 });
  const WROOT = { x: 1.05, y: -1.15, z: 3.4 };
  const wings = [];
  for (const sgn of [1, -1]) {
    const g = new T.Group(); g.position.set(WROOT.x * sgn, WROOT.y, WROOT.z); body.add(g);
    const m = new T.Mesh(wingGeo(sgn < 0), wingMat); m.castShadow = m.receiveShadow = true; g.add(m);
    /* the winglet at the tip, blended up */
    const tipX = 15.6, tipY = Math.tan(0.105) * 15.6, tipZ = -Math.tan(0.48) * 15.6;
    const wl = new T.Mesh(w.wing({ span: 2.3, root: 1.45, tip: 0.55, sweep: 0.75, thick: 0.1, camber: 0, mirror: sgn < 0, spanSegs: 10, chordSegs: 24 }), wingMat);
    wl.position.set(tipX * sgn - 0.05 * sgn, tipY, tipZ - 0.1); wl.rotation.z = sgn * 1.25; wl.castShadow = true; g.add(wl);
    /* spoilers: four panels on the upper surface, hinged at their front edge */
    const spoilers = [];
    for (let i = 0; i < 4; i++) {
      const x0 = 2.4 + i * 2.25, c = 6.9 + (1.5 - 6.9) * (x0 / 15.6), le = Math.tan(0.48) * x0;
      const hinge = new T.Group(); hinge.position.set(x0 * sgn + 1.0 * sgn, Math.tan(0.105) * x0 + 0.07 * c * 0.9 + 0.06, -(le + c * 0.58));
      hinge.rotation.y = sgn * 0.48 * 0.55;
      const p = new T.Mesh(new T.BoxGeometry(2.1, 0.05, c * 0.2), wingMat); p.position.z = -c * 0.1; p.castShadow = true; hinge.add(p);
      g.add(hinge); spoilers.push(hinge);
    }
    wings.push({ group: g, spoilers, sgn, tip: [WROOT.x * sgn + tipX * sgn, WROOT.y + tipY + 0.15, WROOT.z + tipZ - 0.7] });
  }

  /* ---------- tail: fin and stabilisers ---------- */
  const finMat = w.surface({
    color: '#0a1838', roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.1, key: 'fin',
    glsl: { pars: AC_GLSL, albedo: /* glsl */`
      base = vec3(0.010, 0.030, 0.095);
      float band = smoothstep(0.012, 0.0, abs(UV.x - 0.42 + (UV.y - 0.5) * 0.4) - 0.05);
      base = mix(base, vec3(0.75, 0.38, 0.05), band);
      float sm = seam(UV.x * 7.0, 1.0, 0.015); base *= 1.0 - 0.2 * sm; h = -0.001 * sm;
      rough = 0.28 + 0.1 * fbm(UV * vec2(10.0, 40.0)); ` },
  });
  const fin = new T.Mesh(w.wing({ span: 7.1, root: 6.3, tip: 2.0, sweep: 0.66, thick: 0.11, camber: 0, spanSegs: 24, chordSegs: 40 }), finMat);
  fin.rotation.z = Math.PI / 2; fin.position.set(0, 1.45, -11.6); fin.castShadow = true; body.add(fin);
  for (const sgn of [1, -1]) {
    const st = new T.Mesh(w.wing({ span: 6.6, root: 3.7, tip: 1.2, sweep: 0.58, dihedral: 0.12, thick: 0.1, camber: 0, mirror: sgn < 0, spanSegs: 20, chordSegs: 30 }), wingMat);
    st.position.set(0.4 * sgn, 0.75, -14.5); st.castShadow = true; body.add(st);
  }

  /* ---------- engines: nacelle, fan, spinner, the reverser sleeve that slides back ---------- */
  const nacMat = w.surface({
    color: '#d9dbde', roughness: 0.3, metalness: 0.1, clearcoat: 0.6, key: 'nacelle',
    glsl: { pars: AC_GLSL, albedo: /* glsl */`
      base = vec3(0.78, 0.78, 0.79);
      float lip = smoothstep(1.85, 2.05, L.z);  base = mix(base, vec3(0.75, 0.76, 0.8), lip); metal = mix(metal, 1.0, lip); rough = mix(rough, 0.12, lip);
      float inner = step(length(L.xy), 0.86) * step(1.4, L.z); base = mix(base, vec3(0.05), inner);
      float sm = seam(L.z, 1.3, 0.01); base *= 1.0 - 0.15 * sm; h = -0.001 * sm;
      float soot = smoothstep(-1.0, -2.6, L.z) * fbm(vec2(atan(L.y, L.x) * 4.0, L.z * 2.0)); base *= 1.0 - 0.5 * soot; rough += 0.3 * soot; ` },
  });
  const darkMetal = w.mat('#1b1d21', { roughness: 0.35, metalness: 0.9 });
  const engines = [];
  for (const sgn of [1, -1]) {
    const e = new T.Group(); e.position.set(5.1 * sgn, -2.0, 3.6); body.add(e);
    const front = new T.Mesh(w.lathe([[-0.6, 1.02], [0.6, 1.04], [1.6, 1.02], [2.05, 0.97], [2.3, 0.88], [2.33, 0.82], [2.2, 0.79], [1.6, 0.8]], { segments: 96, samples: 80 }), nacMat);
    front.material.side = T.DoubleSide; front.castShadow = true; e.add(front);
    const sleeve = new T.Mesh(w.lathe([[-2.55, 0.42], [-2.2, 0.62], [-1.4, 0.88], [-0.6, 1.02]], { segments: 96, samples: 60 }), nacMat);
    sleeve.castShadow = true; e.add(sleeve);
    const cascade = new T.Mesh(new T.CylinderGeometry(0.98, 1.0, 0.95, 64, 1, true), w.surface({ color: '#101114', roughness: 0.6, metalness: 0.8, key: 'cascade', glsl: { albedo: /* glsl */`
      float g = step(0.5, fract(atan(L.x, L.z) * 9.5)) * step(0.5, fract(L.y * 7.0)); base = mix(vec3(0.02), vec3(0.12), g); h = 0.002 * g; ` } }));
    cascade.rotation.x = Math.PI / 2; cascade.position.z = -1.05; e.add(cascade);
    const fan = new T.Mesh(new T.CircleGeometry(0.8, 64), w.surface({ color: '#0d0e10', roughness: 0.45, metalness: 0.9, key: 'fan', glsl: { albedo: /* glsl */`
      float a = atan(L.y, L.x) + uT * 22.0; float bl = smoothstep(0.35, 0.5, abs(fract(a * 24.0 / 6.2832) - 0.5) * 2.0); base = mix(vec3(0.05), vec3(0.32, 0.33, 0.36), bl * smoothstep(0.12, 0.3, length(L.xy))); metal = 0.95; rough = 0.3; ` } }));
    fan.position.z = 1.62; e.add(fan);
    const spin = new T.Mesh(w.lathe([[0, 0.3], [0.25, 0.28], [0.5, 0.18], [0.7, 0.0]], { segments: 48, samples: 30 }), w.mat('#1a1b1e', { roughness: 0.2, metalness: 0.8 }));
    spin.position.z = 1.6; e.add(spin);
    const core = new T.Mesh(w.lathe([[-3.4, 0.05], [-3.2, 0.32], [-2.6, 0.48], [-2.3, 0.5]], { segments: 64, samples: 30 }), darkMetal);
    core.castShadow = true; e.add(core);
    const pylon = new T.Mesh(new T.BoxGeometry(0.28, 1.0, 4.2), wingMat); pylon.position.set(0, 1.25, -0.4); pylon.rotation.x = -0.12; pylon.castShadow = true; e.add(pylon);
    engines.push({ group: e, sleeve, fan, sgn });
  }

  /* ---------- landing gear, with brake stacks that glow as they heat ---------- */
  const tyreMat = w.surface({ color: '#151515', roughness: 0.78, key: 'tyre', glsl: { albedo: /* glsl */`
    base = vec3(0.018, 0.018, 0.019); float tread = step(0.5, fract(atan(L.y, L.z) * 18.0)) * step(abs(L.x), 0.13);
    h = 0.003 * tread; rough = 0.7 + 0.2 * fbm(vec2(atan(L.y, L.z) * 6.0, L.x * 10.0)); ` } });
  const strutMat = w.mat('#b9bcc0', { roughness: 0.25, metalness: 0.95 });
  const hubMat = w.mat('#8e9196', { roughness: 0.4, metalness: 0.85 });
  const brakeMats = [];
  const tyre = (r, wdt) => { const g = w.lathe([[-wdt / 2, r * 0.55], [-wdt / 2, r * 0.82], [-wdt * 0.42, r * 0.97], [0, r], [wdt * 0.42, r * 0.97], [wdt / 2, r * 0.82], [wdt / 2, r * 0.55]], { segments: 64, samples: 40 }); g.rotateY(Math.PI / 2); return g; };
  const gears = [];
  const mkGear = (x, z, r, wdt, legTop, two = true, brake = true) => {
    const g = new T.Group(); g.position.set(x, 0, z); root.add(g);
    const axleY = r;
    const leg = new T.Mesh(new T.CylinderGeometry(0.11, 0.13, legTop - axleY, 20), strutMat); leg.position.y = (legTop + axleY) / 2; leg.castShadow = true; g.add(leg);
    const wheels = [];
    for (const dx of two ? [-1, 1] : [0]) {
      const wg = new T.Group(); wg.position.set(dx * (wdt * 0.5 + 0.18), axleY, 0); g.add(wg);
      const ty = new T.Mesh(tyre(r, wdt), tyreMat); ty.castShadow = ty.receiveShadow = true; wg.add(ty);
      const hub = new T.Mesh(new T.CylinderGeometry(r * 0.52, r * 0.52, wdt * 0.9, 32), hubMat); hub.rotation.z = Math.PI / 2; wg.add(hub);
      wheels.push(wg);
    }
    let bm = null;
    if (brake) {
      bm = w.surface({ color: '#2a2622', roughness: 0.6, metalness: 0.7, key: 'brake', uniforms: { uHeat: { value: new T.Vector3(0, 0, 0) } }, glsl: { albedo: /* glsl */`
        float rings = step(0.5, fract(L.x * 26.0)); base = mix(vec3(0.08), vec3(0.16), rings);
        emit = uHeat * (0.75 + 0.5 * fbm(vec2(atan(L.y, L.z) * 3.0, L.x * 20.0))) * (0.6 + 0.4 * rings); ` } });
      const stack = new T.Mesh(new T.CylinderGeometry(r * 0.5, r * 0.5, 0.36, 40), bm); stack.rotation.z = Math.PI / 2; stack.position.y = axleY; g.add(stack);
      brakeMats.push(bm);
    }
    gears.push({ group: g, wheels, r, brake: bm });
    return g;
  };
  mkGear(2.9, -1.3, 0.57, 0.38, AX - 1.25, true, true);
  mkGear(-2.9, -1.3, 0.57, 0.38, AX - 1.25, true, true);
  mkGear(0, 14.4, 0.36, 0.25, AX - 1.7, true, false);

  /* ---------- the aircraft's own lights ---------- */
  const lightsAt = [];
  const L0 = (at, color, size, blink) => { lightsAt.push({ local: at }); return { at: [0, -1000, 0], color, size, blink }; };
  const tipL = wings.find((x) => x.sgn > 0).tip, tipR = wings.find((x) => x.sgn < 0).tip;
  const LAND = o.landing || [1600, 1500, 1300];
  const list = [
    L0([3.4, AX - 0.95, 2.45], LAND, 0.16), L0([-3.4, AX - 0.95, 2.45], LAND, 0.16),                       // landing lights, wing roots
    L0([0, 1.1, 14.75], [700, 650, 560], 0.11),                                                            // taxi light on the nose gear
    L0([tipL[0], AX + tipL[1], tipL[2]], [60, 2, 1], 0.08), L0([tipR[0], AX + tipR[1], tipR[2]], [2, 50, 12], 0.08),   // red left, green right
    L0([tipL[0], AX + tipL[1], tipL[2] - 0.3], [900, 900, 950], 0.1, { period: 1.2, on: 0.05, phase: 0.3 }), // strobes
    L0([tipR[0], AX + tipR[1], tipR[2] - 0.3], [900, 900, 950], 0.1, { period: 1.2, on: 0.05, phase: 0.3 }),
    L0([0, AX + 1.95, 2.0], [140, 6, 3], 0.1, { period: 1.0, on: 0.12, phase: 0.0 }),                       // beacons
    L0([0, AX - 1.95, -3.0], [140, 6, 3], 0.1, { period: 1.0, on: 0.12, phase: 0.5 }),
    L0([0, AX + 1.25, -19.6], [60, 60, 60], 0.08),                                                         // tail
  ];
  const pts = w.lights(list, { min: 2.0 });
  /* real light from the landing lights, so the runway ahead lights up and the gear casts shadows */
  const spots = [];
  for (const sx of [3.4, -3.4]) {
    const s = new T.SpotLight(0xfff2dd, o.spot || 9000, 600, 0.16, 0.6, 2); s.position.set(sx, AX - 0.95, 2.4);
    s.castShadow = sx > 0; if (s.castShadow) { s.shadow.mapSize.set(1024, 1024); s.shadow.bias = -0.0002; s.shadow.camera.near = 1; s.shadow.camera.far = 300; }
    s.target.position.set(sx * 2.2, 0, 70); root.add(s); root.add(s.target); spots.push(s);
  }
  const brakeLights = gears.filter((g) => g.brake).map((g) => { const p = new T.PointLight(0xff5a1a, 0, 8, 2); p.position.set(0, g.r, 0); g.group.add(p); return p; });

  const tmpV = new T.Vector3();
  /* pose the aircraft: s { z (nose-forward position of the reference point), x, speed (m/s), dist
     (metres rolled, for the wheels), spoilers 0..1, reverse 0..1, heat (kelvin of the brakes), t } */
  function pose(s) {
    root.position.set(s.x || 0, 0, s.z);
    body.rotation.x = -(s.pitch || 0);                                        // nose down under braking
    body.position.y = AX - (s.sink || 0);
    for (const wg of wings) wg.spoilers.forEach((h, i) => { h.rotation.x = -(s.spoilers || 0) * (0.72 - i * 0.05); });
    for (const e of engines) { e.sleeve.position.z = -0.85 * (s.reverse || 0); }
    for (const g of gears) for (const wl of g.wheels) wl.rotation.x = (s.dist || 0) / g.r;
    const K = s.heat || 300, hot = Math.max(0, (K - 650) / 600);
    const bb = blackbody(Math.max(800, K)), I = 14 * Math.pow(hot, 2.2);
    for (const m of brakeMats) m.uniforms.uHeat.value.set(bb[0] * I, bb[1] * I, bb[2] * I);
    for (const p of brakeLights) { p.color.setRGB(bb[0], bb[1], bb[2]); p.intensity = 40 * Math.pow(hot, 2.2); }
    root.updateMatrixWorld(true);
    lightsAt.forEach((l, i) => { tmpV.set(l.local[0], l.local[1] - (s.sink || 0), l.local[2]).applyMatrix4(root.matrixWorld); pts.set(i, [tmpV.x, tmpV.y, tmpV.z]); });
  }
  return { object: root, body, pose, gears, wings, engines, spots, AX };
}

/* ---------- the airfield ---------- */
async function airfield(T, w, o = {}) {
  const HALF = 22.5, Z0 = o.far || -3000, Z1 = o.end || 60;
  const mirror = w.mirror({ y: 0, res: 0.5 });
  const U = Object.assign({ uGearZ: { value: -1e6 }, uBrakeZ: { value: -1e6 }, uGearX: { value: new T.Vector4(2.45, 3.35, -2.45, -3.35) }, uEdgeCol: { value: new T.Vector3(...(o.edgeCol || [26, 20, 12])) } }, mirror.uniforms);
  const lightPools = /* glsl */`
    vec3 pools(vec3 P){                                          // light from the nearest edge lights, worked out, not rendered
      vec3 e = vec3(0.0);
      float k0 = floor(P.z / 60.0);
      for (int i = -1; i <= 2; i++) for (int sd = 0; sd < 2; sd++) {
        vec3 lp = vec3(sd == 0 ? 24.0 : -24.0, 0.4, (k0 + float(i)) * 60.0);
        vec3 d = lp - P; float d2 = dot(d, d); e += uEdgeCol * (0.4 / sqrt(d2)) / (d2 + 0.3);
      }
      return e;
    }`;
  const runwayMat = w.surface({
    color: '#202124', roughness: 0.8, bump: 1, key: 'runway', uniforms: U,
    glsl: {
      pars: mirror.glsl + lightPools,
      albedo: /* glsl */`
        vec2 q = P.xz; float ax = abs(P.x);
        float n1 = fbm(q * 0.06), n2 = fbm(q * 0.7 + 3.1);
        vec3 vo = voronoi(q * 34.0);
        base = vec3(0.060, 0.061, 0.064) * (0.72 + 0.55 * n1) * (0.85 + 0.3 * n2);
        base *= 0.82 + 0.45 * smoothstep(0.32, 0.0, vo.x) * vo.z;                       // aggregate
        vec2 cell = floor(q / vec2(7.5, 23.0)); float ph = hash12(cell);
        if (ph > 0.88) base *= mix(0.7, 1.3, hash12(cell + 3.0));                       // repaired slabs
        vec3 cr = voronoi(q * 0.16 + fbm(q * 0.04) * 2.0);
        float crack = smoothstep(0.03, 0.0, cr.y) * step(0.5, fbm(q * 0.025 + 1.0));
        base *= 1.0 - 0.6 * crack;                                                       // sealed cracks
        float rub = smoothstep(10.0, 2.5, ax) * (0.45 + 0.55 * fbm(vec2(P.x * 0.8, P.z * 0.02)));
        base *= 1.0 - 0.45 * rub;                                                        // rubber from thousands of landings
        /* skid marks: old ones, and this aircraft's, laid down behind its wheels while it brakes */
        float sk = 0.0;
        for (int i = 0; i < 4; i++) { float gx = uGearX[i]; float lane = smoothstep(0.2, 0.05, abs(P.x - gx));
          sk += lane * step(0.55, fbm(vec2(gx * 3.0, P.z * 0.012))) * 0.6;
          sk += lane * step(uBrakeZ, P.z) * step(P.z, uGearZ) * (0.55 + 0.45 * vnoise(vec2(P.z * 0.4, gx))); }
        base *= 1.0 - 0.7 * clamp(sk, 0.0, 1.0);
        /* paint: edge lines, the centreline, touchdown-zone bars and the aiming point (for the far end of this runway) */
        float paint = 0.0;
        paint += step(abs(ax - 21.6), 0.45);
        paint += step(ax, 0.45) * step(fract(P.z / 60.0), 0.6);
        float dz = ${(Z1).toFixed(1)} - P.z;
        for (int b = 0; b < 4; b++) { float zs = (b == 0 ? 150.0 : b == 1 ? 300.0 : b == 2 ? 450.0 : 600.0); float nb = b < 2 ? 3.0 : 2.0;
          float inZ = step(zs, dz) * step(dz, zs + 22.5);
          for (int j = 0; j < 3; j++) { if (float(j) >= nb) break; float x0 = 3.0 + float(j) * 3.3; paint += inZ * step(x0, ax) * step(ax, x0 + 1.8); } }
        paint += step(400.0, dz) * step(dz, 445.0) * step(6.0, ax) * step(ax, 15.0);
        paint = clamp(paint, 0.0, 1.0);
        float wear = smoothstep(0.25, 0.75, fbm(q * 1.8) + 0.25 * vnoise(q * 30.0));
        float pm = paint * (0.35 + 0.65 * wear) * (1.0 - 0.6 * rub);
        base = mix(base, vec3(0.62, 0.62, 0.6), pm);
        /* wet: the runway is damp after rain, with standing water in the dips */
        float damp = 0.55;
        wet = smoothstep(0.6, 0.7, fbm(q * 0.03 + 4.0) + 0.12 * vnoise(q * 0.4));
        wet = max(wet, smoothstep(0.25, 0.05, abs(P.x - 2.9) - 0.3) * 0.0);
        base *= mix(1.0, 0.55, max(wet, damp * 0.6));
        rough = mix(0.82, 0.7, pm);
        rough = mix(rough, 0.62 + 0.25 * fbm(q * 0.25 + 2.0), damp);          // damp in patches: the sky's sheen breaks up
        rough = mix(rough, 0.035, wet);
        h = -0.004 * smoothstep(0.35, 0.0, vo.x) * (1.0 - wet) - 0.006 * crack * (1.0 - wet) + 0.0012 * pm + 0.0015 * vnoise(q * 9.0) * (1.0 - wet);
        wet = max(wet, damp * 0.35);
      `,
      light: /* glsl */`
        outgoingLight += base * pools(P);
        float ndv = clamp(dot(N, V), 0.0, 1.0);
        float fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
        vec3 refl = mirror(P, N, 1.0 - smoothstep(0.3, 1.0, wet) * 0.85);
        float wetK = smoothstep(0.3, 1.0, wet);
        outgoingLight = mix(outgoingLight, refl, clamp(fres * (0.12 + 0.75 * wetK) + wetK * 0.12, 0.0, 0.9));
      `,
    },
  });
  const len = Z1 - Z0;
  runwayMat.envMapIntensity = 0.45;                                // asphalt: the sky sheen kept low, the puddles carry the reflection
  const runway = new T.Mesh(new T.PlaneGeometry(HALF * 2, len, 1, 1), runwayMat);
  runway.rotation.x = -Math.PI / 2; runway.position.set(0, 0.0, (Z0 + Z1) / 2); runway.receiveShadow = true; w.scene.add(runway);

  const grassMat = w.surface({
    color: '#2c3320', roughness: 0.95, bump: 1, key: 'grass', uniforms: U,
    glsl: {
      pars: mirror.glsl + lightPools,
      albedo: /* glsl */`
        vec2 q = P.xz; float ax = abs(P.x);
        float n = fbm(q * 0.15), n2 = fbm(q * 2.2), n3 = vnoise(q * 40.0);
        base = mix(vec3(0.030, 0.042, 0.018), vec3(0.075, 0.070, 0.035), n) * (0.75 + 0.5 * n2) * (0.8 + 0.4 * n3);
        float shoulder = smoothstep(26.5, 25.5, ax);                                 // gravel shoulder
        vec3 gv = voronoi(q * 9.0);
        base = mix(base, vec3(0.11, 0.105, 0.1) * (0.7 + 0.6 * gv.z), shoulder);
        rough = mix(0.97, 0.75, shoulder);
        h = mix(0.03 * n2 + 0.01 * n3, 0.008 * smoothstep(0.4, 0.0, gv.x), shoulder);
        wet = smoothstep(0.6, 0.72, fbm(q * 0.02 + 9.0)) * 0.6;
        rough = mix(rough, 0.08, wet); base *= mix(1.0, 0.6, wet);
      `,
      light: /* glsl */`
        outgoingLight += base * pools(P);
        float ndv = clamp(dot(N, V), 0.0, 1.0);
        float fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
        outgoingLight = mix(outgoingLight, mirror(P, N, 0.3), fres * wet);
      `,
    },
  });
  const ground = new T.Mesh(new T.PlaneGeometry(9000, 9000, 1, 1), grassMat);
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.02, -1500); ground.receiveShadow = true; w.scene.add(ground);
  mirror.hide(runway).hide(ground);

  /* ---------- lights: edges, centreline, the far end, approach lights with the running strobe ---------- */
  const L = [];
  const r = rng(11);
  for (let z = Z0; z <= Z1; z += 60) for (const x of [24, -24]) L.push({ at: [x, 0.38, z], color: [52, 44, 30], size: 0.12 });
  for (let z = Z0 + 7.5; z <= Z1; z += 15) { const red = z < Z0 + 300 || (z < Z0 + 900 && Math.round(z / 15) % 2 === 0); L.push({ at: [0, 0.03, z], color: red ? [50, 3, 2] : [36, 34, 30], size: 0.07 }); }
  for (let x = -21; x <= 21; x += 3) L.push({ at: [x, 0.3, Z0 - 1], color: [70, 4, 2], size: 0.12 });            // runway end, seen from the runway: red
  for (let i = 0; i < 24; i++) {                                                                                // approach lights and their strobe
    const z = Z0 - 60 - i * 30, y = 0.5 + i * 0.28;
    for (const x of [-3, -1.5, 0, 1.5, 3]) L.push({ at: [x, y, z], color: [28, 26, 22], size: 0.12 });
    L.push({ at: [0, y + 0.5, z], color: [900, 900, 1000], size: 0.15, blink: { period: 0.5, on: 0.03, phase: 0.5 - (i / 24) * 0.5 } });
  }
  for (let i = 0; i < 260; i++) {                                                                               // the town beyond the field
    const a = -0.9 + r() * 1.9, d = 2600 + r() * 2600, warm = r() < 0.8;
    L.push({ at: [Math.sin(a) * d, 1 + r() * 18, -Math.cos(a) * d - 1200], color: warm ? [60, 32, 10].map((v) => v * (0.4 + r())) : [30, 36, 44], size: 0.35 + r() * 0.5 });
  }
  const pts = w.lights(L, { min: 2.0 });

  /* ---------- the far landscape: a tree line, hangars, a tower ---------- */
  const dark = w.mat('#0a0d08', { roughness: 1 });
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
  const hangarMat = w.surface({ color: '#30343a', roughness: 0.7, metalness: 0.4, key: 'hangar', glsl: { albedo: /* glsl */`
    base = vec3(0.16, 0.17, 0.19) * (0.8 + 0.3 * fbm(P.xz * 0.05)); float rib = step(0.5, fract(P.x * 0.8 + P.z * 0.8)); base *= 0.9 + 0.1 * rib;
    float win = step(0.7, fract(P.y * 0.25)) * step(0.4, fract((P.x + P.z) * 0.3)) * step(P.y, 9.0) * step(1.5, P.y) * step(0.55, hash12(floor(vec2((P.x + P.z) * 0.3, P.y * 0.25))));
    emit = vec3(2.6, 1.7, 0.9) * win; ` } });
  for (const [x, z, wd, ht, dp] of [[320, -520, 70, 22, 60], [410, -650, 90, 26, 70], [300, -760, 50, 16, 40], [-380, -900, 60, 18, 50], [520, -980, 40, 14, 40]]) {
    const b = new T.Mesh(new T.BoxGeometry(wd, ht, dp), hangarMat); b.position.set(x, ht / 2, z); b.castShadow = true; w.scene.add(b);
  }
  {
    const tw = new T.Group(); tw.position.set(470, 0, -860); w.scene.add(tw);
    const shaft = new T.Mesh(new T.CylinderGeometry(3.2, 4.2, 38, 24), w.mat('#9a9ca0', { roughness: 0.6 })); shaft.position.y = 19; tw.add(shaft);
    const cab = new T.Mesh(new T.CylinderGeometry(6.2, 5.0, 5.5, 8), w.surface({ color: '#111', roughness: 0.05, metalness: 0.2, key: 'cab', glsl: { albedo: /* glsl */` base = vec3(0.02); emit = vec3(0.35, 0.8, 0.6) * 0.8; ` } }));
    cab.position.y = 41; tw.add(cab);
    const capm = new T.Mesh(new T.CylinderGeometry(6.6, 6.6, 1.2, 8), w.mat('#2a2c30', { roughness: 0.5 })); capm.position.y = 44.3; tw.add(capm);
  }
  return {
    runway, ground, mirror, lights: pts,
    update(gearZ, brakeZ) { U.uGearZ.value = gearZ; U.uBrakeZ.value = brakeZ; },
  };
}
