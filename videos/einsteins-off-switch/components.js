'use strict';
/* components.js — the worlds of “Einstein's Off Switch”, built in code and shared by the scenes.

   spaceWorld()  near-Earth space: the Earth (NASA Blue Marble map) with a glowing atmosphere and a
                 blue location dot on Lucknow; the hero GPS satellite with its clock face; three more
                 satellites whose radio pulses (shells of light) meet on the dot; the full constellation
                 (24 satellites, six planes at 55°) for the payoff.
   sheetWorld()  the mechanism: a spacetime sheet with the Earth in its well and the satellite riding
                 high on the rim, speed streaks behind it, and a stack of 45 one-microsecond plates of
                 which 7 fly off, leaving 38.
   cityWorld()   the stakes at street level: a night city of boxes, the blue dot, a pulse of light
                 racing 11 km and the dot drifting the same distance.
   testWorld()   1977: the test satellite NTS-2 (a generic satellite, labelled by name only) over the
                 Earth's limb, with a big switch in orbit: RELATIVITY FIX, OFF → ON.

   Everything is a pure function of t. Cues come from the narration via at(); they are looked up
   lazily, from the scenes' setup code. Units: the Earth's radius is 1 in spaceWorld.             */

const OS = { RS: 4.2, LAT: 26.85, LON: 80.95 };

/* ---------- cues, looked up once ---------- */
let _OC = null;
function osCues() {
  if (_OC) return _OC;
  const b = (id) => beatOf(id);
  _OC = {
    hook: b('hook'), phone: b('phone'), einstein: b('einstein'), stakes: b('stakes'), doubt: b('doubt'), proof: b('proof'), payoff: b('payoff'),
    wrong: at('hook', 'wrong'), purpose: at('hook', 'purpose'),
    timing: at('phone', 'timing'), up: at('phone', 'up'), light: at('phone', 'light'), clock: at('phone', 'clock'), puts: at('phone', 'puts'),
    gravity: at('einstein', 'gravity'), fast: at('einstein', 'fast'), fortyfive: at('einstein', 'forty-five'), moving: at('einstein', 'moving'),
    seven: at('einstein', 'seven'), net: at('einstein', 'net'), thirtyeight: at('einstein', 'thirty-eight'), every: at('einstein', 'every'),
    nothing: at('stakes', 'nothing'), speed: at('stakes', 'speed'), eleven: at('stakes', 'eleven'), ignore: at('stakes', 'ignore'), drifts: at('stakes', 'drifts'), sday: at('stakes', 'day'),
    believed: at('doubt', 'believed'), nts: at('doubt', 'nts-2'), fix: at('doubt', 'fix'), switched: at('doubt', 'switched'), right: at('doubt', 'right'),
    twenty: at('proof', 'twenty'), uncorrected: at('proof', 'uncorrected'), predicted: at('proof', 'predicted'), matched: at('proof', 'matched'),
    percent: at('proof', 'percent'), flipped: at('proof', 'flipped'),
    tuned: at('payoff', 'tuned'), wrong2: at('payoff', 'wrong'), sky: at('payoff', 'sky'), finds: at('payoff', 'finds'), test: at('payoff', 'test'),
  };
  return _OC;
}

/* ---------- shared pieces ---------- */
/* additive rim glow: atmospheres, light shells, halos */
function fresnelMat(T, color, power = 2.5, k = 1, side) {
  return new T.ShaderMaterial({
    uniforms: { c: { value: new T.Color(COL[color] || color) }, p: { value: power }, k: { value: k } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 c; uniform float p; uniform float k; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), p); gl_FragColor = vec4(c * f * k, clamp(f * k, 0.0, 1.0)); }',
    transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: side == null ? T.FrontSide : side,
  });
}
/* seeded stars on a big sphere */
function addStars(T, w, n = 2200, d = 90, seed = 11) {
  const r = rng(seed), pos = [], col = [];
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, z = r() * 2 - 1, k = Math.sqrt(1 - z * z), b = 0.45 + 0.55 * r() ** 3;
    pos.push(Math.cos(a) * k * d, z * d, Math.sin(a) * k * d); col.push(b, b, b * (0.9 + 0.2 * r()));
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
  return w.add(new T.Points(g, new T.PointsMaterial({ size: 0.22, sizeAttenuation: true, vertexColors: true, fog: false })));
}
/* solar cells: a canvas texture of blue cells and silver grid lines */
let _cellTex = null;
function cellTexture(T) {
  if (_cellTex) return _cellTex;
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#0d1b3d'; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 16; i++) for (let j = 0; j < 8; j++) {
    const v = 0.85 + 0.3 * hash2(i, j);
    g.fillStyle = `rgb(${Math.round(22 * v)},${Math.round(52 * v)},${Math.round(118 * v)})`;
    g.fillRect(i * 32 + 2, j * 32 + 2, 28, 28);
  }
  g.strokeStyle = '#9aa7b8'; g.lineWidth = 2;
  for (let i = 0; i <= 16; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, 256); g.stroke(); }
  for (let j = 0; j <= 8; j++) { g.beginPath(); g.moveTo(0, j * 32); g.lineTo(512, j * 32); g.stroke(); }
  _cellTex = new T.CanvasTexture(c); _cellTex.colorSpace = T.SRGBColorSpace; _cellTex.anisotropy = 8;
  return _cellTex;
}
/* a satellite built from shapes. +z faces the Earth (antennas); the clock face is on −z.
   Returns the group with .clock(angle, glow, color) to pose the clock hand. */
function makeSat(T, w, o = {}) {
  const g = new T.Group();
  const gold = w.mat('#C8932B', { metalness: 0.9, roughness: 0.3 });
  const dark = w.mat('#2B3038', { metalness: 0.6, roughness: 0.5 });
  const white = w.mat('#E8E6E0', { roughness: 0.6 });
  const panel = new T.MeshStandardMaterial({ map: cellTexture(T), metalness: 0.35, roughness: 0.28 });
  const add = (m, p, r) => { if (p) m.position.set(p[0], p[1], p[2]); if (r) m.rotation.set(r[0], r[1], r[2]); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  add(new T.Mesh(new T.BoxGeometry(0.17, 0.2, 0.17), gold));
  /* foil wrinkles: a few slightly offset gold plates */
  for (let i = 0; i < 4; i++) add(new T.Mesh(new T.BoxGeometry(0.172, 0.04, 0.172), gold), [0, -0.08 + i * 0.053, 0], [0, 0.02 * (hash(i + 3) - 0.5), 0]);
  for (const s of [-1, 1]) {
    add(new T.Mesh(new T.CylinderGeometry(0.008, 0.008, 0.16, 8), dark), [s * 0.165, 0, 0], [0, 0, Math.PI / 2]);
    add(new T.Mesh(new T.BoxGeometry(0.46, 0.006, 0.19), panel), [s * 0.47, 0, 0], [Math.PI / 2, 0, 0]);
    add(new T.Mesh(new T.BoxGeometry(0.47, 0.012, 0.012), dark), [s * 0.47, 0.098, 0]);
    add(new T.Mesh(new T.BoxGeometry(0.47, 0.012, 0.012), dark), [s * 0.47, -0.098, 0]);
  }
  /* antenna array on the Earth face */
  add(new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.012, 24), white), [0, 0, 0.09], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 9; i++) {
    const a = (TAU * i) / 8, r0 = i === 8 ? 0 : 0.048;
    add(new T.Mesh(new T.CylinderGeometry(0.008, 0.011, 0.05, 8), white), [Math.cos(a) * r0, Math.sin(a) * r0, 0.12], [Math.PI / 2, 0, 0]);
  }
  /* the clock face on −z: 60 ticks, a glowing rim and a hand */
  let hand = null, rim = null, tickMat = null;
  if (o.clock !== false) {
    const face = add(new T.Mesh(new T.CylinderGeometry(0.075, 0.075, 0.006, 40), new T.MeshBasicMaterial({ color: 0x05070c })), [0, 0, -0.088], [Math.PI / 2, 0, 0]);
    face.castShadow = false;
    tickMat = new T.MeshBasicMaterial({ color: new T.Color('#ffffff'), toneMapped: false });
    for (let i = 0; i < 60; i++) {
      const a = (TAU * i) / 60, big = i % 5 === 0, rr = big ? 0.058 : 0.062;
      const m = add(new T.Mesh(new T.BoxGeometry(0.003, big ? 0.016 : 0.008, 0.003), tickMat), [Math.cos(a) * rr, Math.sin(a) * rr, -0.093], [0, 0, a + Math.PI / 2]);
      m.castShadow = false;
    }
    rim = add(new T.Mesh(new T.TorusGeometry(0.074, 0.0045, 8, 64), new T.MeshBasicMaterial({ color: new T.Color(COL.accent), toneMapped: false })), [0, 0, -0.092]);
    hand = new T.Group(); hand.position.set(0, 0, -0.095); g.add(hand);
    const hm = new T.Mesh(new T.BoxGeometry(0.004, 0.056, 0.003), new T.MeshBasicMaterial({ color: new T.Color(COL.accent), toneMapped: false }));
    hm.position.y = 0.026; hand.add(hm);
  }
  g.clock = (angle, color) => {
    if (!hand) return;
    hand.rotation.z = -angle;
    if (color) { rim.material.color.set(COL[color] || color); hand.children[0].material.color.set(COL[color] || color); }
  };
  return g;
}
/* integrate f from a to b (fixed steps): a clock whose rate changes, as a pure function of t */
function integ(f, a, b, step = 1 / 60) {
  if (b <= a) return 0;
  let s = 0;
  for (let x = a; x < b; x += step) s += f(Math.min(b, x + step / 2)) * Math.min(step, b - x);
  return s;
}
/* a round clock dial drawn on the frame: hand angle in radians from 12 o'clock */
function dial(ctx, x, y, r, angle, o = {}) {
  const col = COL[o.color] || o.color || COL.accent, a = o.alpha == null ? 1 : o.alpha;
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 24;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = 'rgba(6,9,16,0.78)'; ctx.fill();
  ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.stroke();
  for (let i = 0; i < 60; i++) {
    const q = -Math.PI / 2 + (TAU * i) / 60, big = i % 5 === 0, r0 = r - 12, r1 = r0 - (big ? 22 : 10);
    line(ctx, x + Math.cos(q) * r0, y + Math.sin(q) * r0, x + Math.cos(q) * r1, y + Math.sin(q) * r1, big ? '#FFFFFF' : 'rgba(255,255,255,0.5)', big ? 4 : 2);
  }
  const q = -Math.PI / 2 + angle;
  if (o.ghost != null) { const g2 = -Math.PI / 2 + o.ghost; line(ctx, x, y, x + Math.cos(g2) * (r - 30), y + Math.sin(g2) * (r - 30), 'rgba(255,255,255,0.35)', 6); }
  ctx.shadowColor = col; ctx.shadowBlur = 18;
  line(ctx, x, y, x + Math.cos(q) * (r - 26), y + Math.sin(q) * (r - 26), col, 7);
  ctx.shadowBlur = 0;
  dot(ctx, x, y, 10, '#FFFFFF');
  if (o.label) text(ctx, o.label, x, y + r + 58, { size: 40, weight: 800, family: F.disp, color: '#FFFFFF', align: 'center', ls: 2 });
  ctx.restore();
}
/* a frequency readout whose digits roll from one value to another, left to right */
function readout(ctx, from, to, x, y, k, o = {}) {
  const a = o.alpha == null ? 1 : o.alpha;
  if (a <= 0.003) return;
  const size = o.size || 74, chars = [], n = Math.max(from.length, to.length);
  for (let i = 0; i < n; i++) {
    const f = from[i] || ' ', g = to[i] || ' ';
    const ki = clamp(k * (n + 4) - i * 0.9);
    let ch = ki >= 1 ? g : ki <= 0 ? f : (f === g ? g : String(Math.floor(hash2(i, Math.floor((o.t || 0) * 24)) * 10)));
    chars.push({ ch, changed: f !== g && ki > 0 });
  }
  const s = chars.map((c) => c.ch).join('') + (o.unit || ' MHz');
  const wd = measure(ctx, s, size, 700, F.mono);
  ctx.save(); ctx.globalAlpha *= a;
  ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 26;
  fillRR(ctx, x - wd / 2 - 34, y - size * 0.95, wd + 68, size * 1.45, 18, 'rgba(6,9,16,0.72)');
  ctx.shadowBlur = 0;
  let cx = x - wd / 2;
  for (const c of chars) {
    const cw = measure(ctx, c.ch, size, 700, F.mono);
    text(ctx, c.ch, cx, y, { size, weight: 700, family: F.mono, color: c.changed ? (COL[o.hot] || COL.accent) : '#FFFFFF' });
    cx += cw;
  }
  text(ctx, o.unit || ' MHz', cx, y, { size, weight: 700, family: F.mono, color: 'rgba(255,255,255,0.7)' });
  if (o.label) text(ctx, o.label, x, y - size * 1.25, { size: 34, weight: 800, family: F.disp, color: '#FFFFFF', align: 'center', ls: 3, alpha: 0.9 });
  ctx.restore();
}

/* ---------- spaceWorld: the Earth, the dot, the hero, the signals, the constellation ---------- */
const earthAngle = (t) => Math.PI + 0.10 + 0.0025 * t;
function latLon(lat, lon, r = 1) {
  const phi = ((lon + 180) / 360) * TAU, th = ((90 - lat) / 180) * Math.PI;
  return [-r * Math.cos(phi) * Math.sin(th), r * Math.cos(th), r * Math.sin(phi) * Math.sin(th)];
}
const rotY = (p, a) => [p[0] * Math.cos(a) + p[2] * Math.sin(a), p[1], -p[0] * Math.sin(a) + p[2] * Math.cos(a)];
const v3 = { add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  len: (a) => Math.hypot(a[0], a[1], a[2]), norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], lerp: (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)] };
/* the blue dot (Lucknow) in world space */
const dotAt = (t, r = 1.004) => rotY(latLon(OS.LAT, OS.LON, r), earthAngle(t));
/* the hero's orbit: a plane through the point above the dot */
const _U = () => v3.norm(dotAt(0));
const _V = () => v3.norm(v3.cross(_U(), v3.norm([0.35, 1, -0.2])));
const heroAngle = (t) => -0.32 + 0.0085 * t;
function heroAt(t) { const a = heroAngle(t), u = _U(), v = _V(); return v3.mul(v3.add(v3.mul(u, Math.cos(a)), v3.mul(v, Math.sin(a))), OS.RS); }
/* three more satellites in view of the dot (with the hero: the four whose signals meet) */
function signalSatAt(i, t) {
  if (i === 0) return heroAt(t);
  const u = _U(), v = _V(), wv = v3.norm(v3.cross(u, v));
  const offs = [[0, 0], [0.62, 0.48], [-0.55, 0.62], [0.08, -0.72]][i];
  const a = offs[0] + 0.006 * t * (i % 2 ? 1 : -1), b = offs[1];
  const d = v3.norm(v3.add(v3.add(v3.mul(u, Math.cos(a) * Math.cos(b)), v3.mul(v, Math.sin(a) * Math.cos(b))), v3.mul(wv, Math.sin(b))));
  return v3.mul(d, OS.RS);
}
/* the 24-satellite constellation: six planes at 55°, four in each */
function constAt(i, t) {
  const pl = Math.floor(i / 4), j = i % 4, raan = (pl * 60 + 10) * Math.PI / 180, inc = 55 * Math.PI / 180;
  const th = (j * 90 + pl * 22) * Math.PI / 180 + 0.035 * t;
  let p = [Math.cos(th) * OS.RS, 0, Math.sin(th) * OS.RS];
  p = [p[0], -p[2] * Math.sin(inc), p[2] * Math.cos(inc)];
  return rotY(p, raan);
}

let _SW = null;
function spaceWorld() {
  if (_SW) return _SW;
  const c = osCues();
  /* when the signal pulses run, when they arrive at the dot, and when the constellation shows */
  const P = 1.6, VS = 2.4;
  const pulseWindows = [[c.timing - 1.2, c.light], [c.finds - 2.4, DATA.dur + 1]];
  const constOn = (t) => tw(t, c.wrong2 - 0.3, c.sky + 0.4);
  _SW = world3d(async (T, w) => {
    w.background('#02040A');
    w.room(0.22);
    w.sun({ dir: [6, 2.2, 7], intensity: 3.1, shadow: false, color: '#FFF4E2' });
    w.ambient('#7A9CC8', 0.06);
    addStars(T, w);
    const earth = new T.Group(); w.add(earth);
    const map = await w.texture('earth-map');
    const globe = new T.Mesh(new T.SphereGeometry(1, 128, 96), w.mat('#ffffff', { map, roughness: 0.82, metalness: 0.0 }));
    earth.add(globe);
    w.add(new T.Mesh(new T.SphereGeometry(1.018, 96, 72), fresnelMat(T, '#5AA8FF', 2.6, 1.25)));
    w.add(new T.Mesh(new T.SphereGeometry(1.07, 64, 48), fresnelMat(T, '#3C7BFF', 4.5, 0.55, T.BackSide)));
    /* the blue dot: a glowing bead, a halo that breathes, a ring that flashes on each arrival */
    const dotG = new T.Group(); w.add(dotG);
    const bead = new T.Mesh(new T.SphereGeometry(0.014, 24, 16), new T.MeshBasicMaterial({ color: new T.Color(COL.subject), toneMapped: false }));
    const halo = new T.Mesh(new T.RingGeometry(0.02, 0.028, 48), new T.MeshBasicMaterial({ color: new T.Color(COL.subject), transparent: true, side: T.DoubleSide, toneMapped: false, depthWrite: false }));
    const flash = new T.Mesh(new T.RingGeometry(0.02, 0.03, 48), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, side: T.DoubleSide, toneMapped: false, depthWrite: false }));
    const ghost = new T.Mesh(new T.RingGeometry(0.012, 0.018, 40), new T.MeshBasicMaterial({ color: new T.Color(COL.alert), transparent: true, side: T.DoubleSide, toneMapped: false, depthWrite: false }));
    dotG.add(bead); dotG.add(halo); dotG.add(flash); dotG.add(ghost);
    /* satellites */
    const hero = makeSat(T, w); w.add(hero);
    const others = [1, 2, 3].map(() => { const s = makeSat(T, w, { clock: false }); s.scale.setScalar(0.7); w.add(s); return s; });
    const cons = []; for (let i = 0; i < 24; i++) { const s = makeSat(T, w, { clock: false }); s.scale.setScalar(0.55); w.add(s); cons.push(s); }
    /* orbit rings for the constellation */
    const ringMat = new T.MeshBasicMaterial({ color: new T.Color(COL.data), transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
    for (let pl = 0; pl < 6; pl++) {
      const r = new T.Mesh(new T.TorusGeometry(OS.RS, 0.006, 6, 256), ringMat);
      const g = new T.Group(); g.add(r); r.rotation.x = Math.PI / 2;
      g.rotation.order = 'YXZ'; g.rotation.y = (pl * 60 + 10) * Math.PI / 180; g.rotation.x = -55 * Math.PI / 180;
      w.add(g);
    }
    /* the light shells: 4 satellites × 3 pulses in flight */
    const shells = [];
    for (let i = 0; i < 12; i++) { const m = new T.Mesh(new T.SphereGeometry(1, 64, 48), fresnelMat(T, COL.subject, 3.2, 0.0)); m.visible = false; w.add(m); shells.push(m); }
    /* a thin glowing thread from each signal satellite to the dot */
    const threadMat = new T.MeshBasicMaterial({ color: new T.Color(COL.subject), transparent: true, opacity: 0, toneMapped: false, depthWrite: false, blending: T.AdditiveBlending });
    const threads = [0, 1, 2, 3].map(() => { const m = new T.Mesh(new T.CylinderGeometry(0.0035, 0.0035, 1, 6), threadMat); w.add(m); return m; });
    const Y = new T.Vector3(0, 1, 0), Q = new T.Quaternion(), V = new T.Vector3();
    const place = (obj, p, look) => { obj.position.set(p[0], p[1], p[2]); obj.lookAt(look[0], look[1], look[2]); };

    return (t) => {
      earth.rotation.y = earthAngle(t);
      const d = dotAt(t), dn = v3.norm(d);
      dotG.position.set(d[0], d[1], d[2]); dotG.lookAt(d[0] * 2, d[1] * 2, d[2] * 2);
      halo.scale.setScalar(1 + 0.35 * (0.5 + 0.5 * Math.sin(t * 4)));
      halo.material.opacity = 0.75;
      /* the 30 cm ghost: a second ring beside the dot while "puts you thirty centimetres off" */
      const gk = tw(t, c.puts - 0.2, c.puts + 0.4) * (1 - tw(t, c.einstein.t0 - 1.0, c.einstein.t0 - 0.5));
      ghost.position.set(0.045 * gk, 0.0, 0.001); ghost.material.opacity = gk;
      ghost.scale.setScalar(gk > 0 ? 1 : 0.0001);
      /* satellites */
      const hp = heroAt(t); place(hero, hp, [0, 0, 0]); hero.rotateZ(0.6);
      hero.clock(TAU * (t / 2.0));
      others.forEach((s, k) => { place(s, signalSatAt(k + 1, t), [0, 0, 0]); s.rotateZ(1.1 * k); });
      const ck = constOn(t);
      cons.forEach((s, i) => { const p = constAt(i, t); place(s, p, [0, 0, 0]); s.scale.setScalar(Math.max(0.0001, 0.55 * E.outBack(clamp(ck * 1.6 - (i % 4) * 0.12)))); });
      ringMat.opacity = 0.55 * ck;
      /* pulses: each train arrives together at the dot at tk = W0 + P k */
      let n = 0, threadK = 0, arrive = 0;
      for (const [w0, w1] of pulseWindows) {
        if (t < w0 - 3 || t > w1 + 3) continue;
        threadK = Math.max(threadK, win(t, w0, w1, 0.5, 0.6));
        for (let k = 0; k < 40; k++) {
          const tk = w0 + 1.6 + P * k;
          if (tk > w1 + 2.5) break;
          arrive = Math.max(arrive, pulse(t, tk, 0.05, 0.6) * (tk < w1 + 1.0 ? 1 : 0));
          for (let i = 0; i < 4 && n < shells.length; i++) {
            const sp = signalSatAt(i, tk), dist = v3.len(v3.sub(sp, dotAt(tk))), te = tk - dist / VS, r = (t - te) * VS;
            if (r <= 0.02 || r > dist + 0.25 || te > w1) continue;
            const m = shells[n++]; m.visible = true;
            m.position.set(sp[0], sp[1], sp[2]); m.scale.setScalar(r);
            m.material.uniforms.k.value = 0.9 * clamp((dist + 0.25 - r) / 0.5) * clamp(r / 0.3);
          }
        }
      }
      for (; n < shells.length; n++) shells[n].visible = false;
      flash.scale.setScalar(1 + 5 * (1 - arrive)); flash.material.opacity = arrive;
      threadMat.opacity = 0.28 * threadK;
      threads.forEach((m, i) => {
        const a = signalSatAt(i, t), b = d, mid = v3.lerp(a, b, 0.5), dir = v3.sub(b, a);
        m.position.set(mid[0], mid[1], mid[2]); m.scale.set(1, v3.len(dir), 1);
        Q.setFromUnitVectors(Y, V.set(dir[0], dir[1], dir[2]).normalize()); m.quaternion.copy(Q);
        m.visible = threadK > 0.01;
      });
    };
  });
  return _SW;
}
/* a camera just outside the hero, looking back at it with the Earth behind */
function heroCam(t, back = 0.9, side = 0.35, up = 0.25, fov = 34, look = [0, 0, 0]) {
  const h = heroAt(t), n = v3.norm(h), s = v3.norm(v3.cross(n, [0, 1, 0])), u = v3.norm(v3.cross(s, n));
  const from = v3.add(v3.add(v3.add(h, v3.mul(n, back)), v3.mul(s, side)), v3.mul(u, up));
  return { from, to: v3.add(h, look), fov };
}
/* a camera looking down at the dot from a height above it */
function dotCam(t, height = 2.2, tilt = 0.6, fov = 30, side = 0.0) {
  const d = dotAt(t), n = v3.norm(d), s = v3.norm(v3.cross(n, [0, 1, 0])), u = v3.norm(v3.cross(s, n));
  const from = v3.add(v3.add(v3.add(d, v3.mul(n, height)), v3.mul(u, -tilt * height)), v3.mul(s, side));
  return { from, to: d, fov };
}

/* ---------- sheetWorld: gravity as a well, speed as streaks, the day's drift as plates ---------- */
const SH = { RS: 4.4 };
const sheetY = (r) => -2.6 / Math.sqrt(1 + (r / 1.25) ** 2) + 0.35;
const sheetSat = (t) => { const a = 0.75 - 0.1 * (t - osCues().einstein.t0); return [Math.cos(a) * SH.RS, sheetY(SH.RS) + 0.42, Math.sin(a) * SH.RS]; };
let _SH = null;
function sheetWorld() {
  if (_SH) return _SH;
  const c = osCues();
  _SH = world3d(async (T, w) => {
    w.background('#03050B');
    w.room(0.25);
    w.sun({ dir: [4, 6, 5], intensity: 2.6, shadow: false });
    addStars(T, w, 1600, 80, 21);
    /* the sheet: a warped plane with a glowing grid */
    const gc = document.createElement('canvas'); gc.width = gc.height = 256; const gg = gc.getContext('2d');
    gg.fillStyle = '#000000'; gg.fillRect(0, 0, 256, 256); gg.strokeStyle = '#ffffff'; gg.lineWidth = 5; gg.strokeRect(0, 0, 256, 256);
    const gt = new T.CanvasTexture(gc); gt.wrapS = gt.wrapT = T.RepeatWrapping; gt.repeat.set(28, 28); gt.anisotropy = 16;
    const geo = new T.PlaneGeometry(30, 30, 220, 220); geo.rotateX(-Math.PI / 2);
    const pa = geo.attributes.position;
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i); pa.setY(i, sheetY(Math.hypot(x, z))); }
    geo.computeVertexNormals();
    const sheet = new T.Mesh(geo, new T.MeshStandardMaterial({ color: new T.Color('#0A1226'), emissive: new T.Color(COL.data), emissiveMap: gt, emissiveIntensity: 0.9, roughness: 0.6, transparent: true, opacity: 0.96 }));
    w.add(sheet);
    w.fog('#03050B', 9, 24);
    /* the Earth in the well */
    const map = await w.texture('earth-map');
    const earth = w.add(new T.Mesh(new T.SphereGeometry(0.85, 96, 64), w.mat('#ffffff', { map, roughness: 0.85 })));
    earth.position.set(0, sheetY(0) + 0.82, 0);
    w.add(new T.Mesh(new T.SphereGeometry(0.87, 64, 48), fresnelMat(T, '#5AA8FF', 2.6, 1.2))).position.copy(earth.position);
    /* the orbit, drawn on the rim */
    const orbitPts = []; for (let i = 0; i <= 160; i++) { const a = (TAU * i) / 160; orbitPts.push([Math.cos(a) * SH.RS, sheetY(SH.RS) + 0.42, Math.sin(a) * SH.RS]); }
    w.line(orbitPts, { color: 'accent', radius: 0.012, glow: 1.2 });
    const sat = makeSat(T, w); sat.scale.setScalar(2.3); w.add(sat);
    /* speed streaks behind the satellite */
    const NS = 70, streak = w.instances(new T.BoxGeometry(0.02, 0.02, 1), new T.MeshBasicMaterial({ color: new T.Color('#ffffff'), transparent: true, opacity: 0.85, toneMapped: false }), NS);
    /* the day's drift: 45 one-microsecond plates; the top 7 fly away */
    const NP = 45, plateH = 0.055, plates = w.instances(new T.BoxGeometry(0.62, plateH * 0.78, 0.62), new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), NP);
    const green = new T.Color(COL.good), red = new T.Color(COL.alert), gold = new T.Color(COL.accent), tmp = new T.Color();
    for (let i = 0; i < NP; i++) plates.setColorAt(i, green);
    const base = plateBase;
    return (t) => {
      earth.rotation.y = 0.4 + 0.15 * t;
      const sp = sheetSat(t), a = Math.atan2(sp[2], sp[0]);
      sat.position.set(sp[0], sp[1], sp[2]); sat.lookAt(0, sp[1] - 0.6, 0);
      const fastK = tw(t, c.fast - 0.3, c.fast + 0.3);
      sat.clock(TAU * (t / 2.0) + TAU * 0.55 * integ((x) => tw(x, c.fast - 0.3, c.fast + 0.3) - 0.16 * tw(x, c.moving, c.moving + 0.6), c.einstein.t0, t), fastK > 0.5 ? 'good' : null);
      /* streaks trail along the orbit, from "moving" */
      const sk = tw(t, c.moving - 0.2, c.moving + 0.5) * (1 - tw(t, c.net + 0.6, c.net + 1.4));
      for (let i = 0; i < NS; i++) {
        const lag = 0.12 + 0.55 * hash(i), r = SH.RS + (hash(i + 70) - 0.5) * 0.7, y = sp[1] + (hash(i + 140) - 0.5) * 0.6;
        const ph = (t * 1.8 + hash(i + 210)) % 1, aa = a + lag + ph * 0.25;
        streaks(streak, i, [Math.cos(aa) * r, y, Math.sin(aa) * r], aa, sk * (1 - ph));
      }
      streak.commit();
      /* plates */
      const b = base(t);
      for (let i = 0; i < NP; i++) {
        const appear = c.fortyfive - 0.1 + i * 0.022, pk = E.outBack(clamp((t - appear) / 0.25));
        let p = [b[0], b[1] + i * plateH, b[2]], sc = pk, rot = [0, 0.2 * t, 0];
        const top = i >= NP - 7;
        if (top) {
          const rk = tw(t, c.seven - 0.1, c.seven + 0.25), fly = tw(t, c.seven + 0.35, c.seven + 1.4, E.in2);
          plates.setColorAt(i, tmp.copy(green).lerp(red, rk));
          p = [p[0] + fly * (2.2 + hash(i) * 1.5), p[1] + fly * (1.2 + hash(i + 9)), p[2] + fly * 1.5];
          rot = [fly * 3 * hash(i + 2), 0.2 * t + fly * 4, fly * 2];
          sc = pk * (1 - fly);
        } else {
          const gk = tw(t, c.thirtyeight - 0.15, c.thirtyeight + 0.3);
          plates.setColorAt(i, tmp.copy(green).lerp(gold, gk));
          sc = pk * (1 + 0.08 * pulse(t, c.thirtyeight + i * 0.012, 0.05, 0.3));
        }
        plates.set(i, p, [sc, 1, sc], rot);
      }
      plates.commit(); plates.instanceColor.needsUpdate = true;
    };
    function streaks(inst, i, p, aa, k) { inst.set(i, p, [1, 1, Math.max(0.0001, k * 0.9)], [0, -aa, 0]); }
  });
  return _SH;
}
/* where the plate stack stands, for overlays */
function plateBase(t) {
  const s = sheetSat(t), out = v3.norm([s[0], 0, s[2]]), tang = v3.norm(v3.cross([0, 1, 0], out));
  return v3.add(v3.add([s[0] * 0.8, s[1] - 0.2, s[2] * 0.8], v3.mul(tang, 1.35)), [0, 0, 0]);
}
function plateTop(t, n = 38) { const b = plateBase(t); return [b[0], b[1] + n * 0.055, b[2]]; }

/* ---------- cityWorld: 11 km at street level ---------- */
const CT = { CELL: 0.95, N: 44, Y0: 0 };
const cityStart = [0.3, 0.12, 5.5], cityEnd = [0.3, 0.12, -6.5];
let _CW = null;
function cityWorld() {
  if (_CW) return _CW;
  const c = osCues();
  _CW = world3d(async (T, w) => {
    w.background('#04060D'); w.fog('#04060D', 9, 30);
    w.room(0.18);
    w.sun({ dir: [-4, 8, 3], intensity: 0.7, color: '#9FB6E0', shadow: false });
    w.ambient('#5A6E9A', 0.35);
    const ground = w.add(new T.Mesh(new T.PlaneGeometry(120, 120), w.mat('#090D16', { roughness: 0.95 })));
    ground.rotation.x = -Math.PI / 2;
    /* buildings on a grid with streets every 4 blocks; a seeded skyline taller towards the centre */
    const N = CT.N, bmat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, metalness: 0.1 });
    const blds = w.instances(new T.BoxGeometry(1, 1, 1), bmat, N * N), tmp = new T.Color(), r = rng(5);
    let k = 0;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const x = (i - N / 2) * CT.CELL, z = (j - N / 2) * CT.CELL;
      const street = i % 5 === 0 || j % 5 === 0 || Math.abs(x - 0.3) < 0.5;
      if (street) { blds.set(k, [0, -50, 0], 0.0001); blds.setColorAt(k++, tmp.set('#000000')); continue; }
      const cen = Math.exp(-((x - 0.3) ** 2 + z * z) / 60), h = 0.12 + (0.25 + 2.6 * cen) * r() ** 2.2;
      blds.set(k, [x, h / 2, z], [CT.CELL * 0.78, h, CT.CELL * 0.78]);
      const v = 0.07 + 0.08 * r();
      blds.setColorAt(k++, tmp.setRGB(v * 0.85, v * 0.95, v * 1.35));
    }
    blds.commit(); blds.instanceColor.needsUpdate = true;
    /* lit windows: tiny emissive dots on the faces facing the camera */
    const NWIN = 2600, wins = w.instances(new T.BoxGeometry(0.05, 0.035, 0.01), new T.MeshBasicMaterial({ color: new T.Color('#FFD89A'), toneMapped: false }), NWIN), rw = rng(9);
    for (let i = 0; i < NWIN; i++) {
      const gi = Math.floor(rw() * N), gj = Math.floor(rw() * N), x = (gi - N / 2) * CT.CELL, z = (gj - N / 2) * CT.CELL;
      if (gi % 5 === 0 || gj % 5 === 0 || Math.abs(x - 0.3) < 0.5) { wins.set(i, [0, -50, 0], 0.0001); continue; }
      const cen = Math.exp(-((x - 0.3) ** 2 + z * z) / 60), hmax = 0.12 + (0.25 + 2.6 * cen) * 0.5;
      wins.set(i, [x + (rw() - 0.5) * 0.6, 0.06 + rw() * hmax, z + CT.CELL * 0.39 + 0.006], rw() < 0.7 ? 1 : 0.0001);
    }
    wins.commit();
    /* street lights: glowing lines along the avenues */
    for (let i = 0; i < N; i += 5) {
      const x = (i - N / 2) * CT.CELL;
      w.add(new T.Mesh(new T.BoxGeometry(0.03, 0.01, N * CT.CELL), new T.MeshBasicMaterial({ color: new T.Color('#3D5A8A'), toneMapped: false }))).position.set(x, 0.01, -CT.CELL / 2);
      w.add(new T.Mesh(new T.BoxGeometry(N * CT.CELL, 0.01, 0.03), new T.MeshBasicMaterial({ color: new T.Color('#3D5A8A'), toneMapped: false }))).position.set(-CT.CELL / 2, 0.01, x);
    }
    /* the avenue the light races down, then the dot drifts down */
    const track = w.line([cityStart, [0.3, 0.12, -0.5], cityEnd], { color: 'subject', radius: 0.03, glow: 2.2, tension: 0 });
    const lightLine = w.line([[0.3, 0.9, 5.5], [0.3, 0.9, -0.5], [0.3, 0.9, -6.5]], { color: 'accent', radius: 0.02, glow: 2.6, tension: 0 });
    const bolt = w.ball(0.09, 'accent', { glow: 6 });
    /* the real position (stays) and the drifting dot */
    const home = w.add(new T.Mesh(new T.TorusGeometry(0.26, 0.022, 10, 64), new T.MeshBasicMaterial({ color: new T.Color(COL.good), toneMapped: false })));
    home.rotation.x = Math.PI / 2; home.position.set(cityStart[0], 0.03, cityStart[2]);
    const dot = w.ball(0.13, 'subject', { glow: 4 });
    const beam = w.add(new T.Mesh(new T.CylinderGeometry(0.05, 0.12, 3, 16, 1, true), new T.MeshBasicMaterial({ color: new T.Color(COL.subject), transparent: true, opacity: 0.25, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false })));
    const halo = w.add(new T.Mesh(new T.RingGeometry(0.2, 0.26, 48), new T.MeshBasicMaterial({ color: new T.Color(COL.subject), transparent: true, side: T.DoubleSide, toneMapped: false, depthWrite: false })));
    halo.rotation.x = -Math.PI / 2;
    return (t) => {
      const lk = tw(t, c.speed - 0.2, c.eleven + 0.5, E.io2);
      lightLine.draw(lk);
      const bp = v3.lerp([0.3, 0.9, 5.5], [0.3, 0.9, -6.5], lk);
      bolt.position.set(bp[0], bp[1], bp[2]); bolt.scale.setScalar(lk > 0.001 && lk < 0.999 ? 1 : 0.0001);
      lightLine.material.opacity = 1;
      const dk = tw(t, c.drifts - 0.2, c.sday + 0.4, E.io2);
      track.draw(dk);
      const dp = v3.lerp(cityStart, cityEnd, dk);
      dot.position.set(dp[0], dp[1] + 0.06 * Math.sin(t * 3), dp[2]);
      beam.position.set(dp[0], 1.5, dp[2]);
      halo.position.set(dp[0], 0.02, dp[2]); halo.scale.setScalar(1 + 0.4 * (0.5 + 0.5 * Math.sin(t * 4)));
      home.scale.setScalar(tw(t, c.ignore - 0.2, c.ignore + 0.3) > 0 ? 1 + 0.06 * Math.sin(t * 5) : 0.0001);
    };
  });
  return _CW;
}

/* ---------- testWorld: NTS-2 and the switch ---------- */
const TW = { SAT: [-0.55, 0.95, 0], SW: [0.62, -0.62, 0.7] };
let _TW = null;
function switchK(t) { const c = osCues(); return tw(t, c.flipped + 0.02, c.flipped + 0.28, E.outBack); }
function testWorld() {
  if (_TW) return _TW;
  const c = osCues();
  _TW = world3d(async (T, w) => {
    w.background('#02040A');
    w.room(0.25);
    w.sun({ dir: [-6, 4, 6], intensity: 3.0, color: '#FFF1DC', area: 4 });
    w.ambient('#6E8CC0', 0.08);
    addStars(T, w, 2000, 80, 31);
    /* the Earth's limb below, at dawn */
    const map = await w.texture('earth-map');
    const earth = w.add(new T.Mesh(new T.SphereGeometry(9, 160, 120), w.mat('#ffffff', { map, roughness: 0.85 })));
    earth.position.set(0, -10.4, -2); earth.rotation.set(0.5, 2.2, 0);
    w.add(new T.Mesh(new T.SphereGeometry(9.12, 128, 96), fresnelMat(T, '#5AA8FF', 2.8, 1.4))).position.copy(earth.position);
    w.add(new T.Mesh(new T.SphereGeometry(9.6, 96, 72), fresnelMat(T, '#3C7BFF', 5, 0.6, T.BackSide))).position.copy(earth.position);
    /* NTS-2 (generic): an octagonal drum, four solar paddles, antennas, a clock face */
    const sat = w.group({ at: TW.SAT });
    const silver = w.mat('#B9BEC6', { metalness: 0.85, roughness: 0.28 }), gold = w.mat('#C8932B', { metalness: 0.9, roughness: 0.3 });
    const panel = new T.MeshStandardMaterial({ map: cellTexture(T), metalness: 0.35, roughness: 0.28 });
    const drum = new T.Mesh(new T.CylinderGeometry(0.36, 0.36, 0.42, 8), silver); sat.add(drum);
    const band = new T.Mesh(new T.CylinderGeometry(0.365, 0.365, 0.12, 8), gold); band.position.y = 0.12; sat.add(band);
    for (let i = 0; i < 4; i++) {
      const a = (TAU * i) / 4 + TAU / 16, arm = new T.Group(); arm.rotation.y = a; sat.add(arm);
      const p = new T.Mesh(new T.BoxGeometry(0.62, 0.006, 0.3), panel); p.position.x = 0.72; p.rotation.x = 0.35; arm.add(p);
      const s = new T.Mesh(new T.CylinderGeometry(0.01, 0.01, 0.12, 6), silver); s.rotation.z = Math.PI / 2; s.position.x = 0.38; arm.add(s);
    }
    for (let i = 0; i < 6; i++) { const r = new T.Mesh(new T.CylinderGeometry(0.008, 0.008, 0.36, 6), silver); const a = (TAU * i) / 6; r.position.set(Math.cos(a) * 0.12, -0.38, Math.sin(a) * 0.12); sat.add(r); }
    const face = new T.Group(); face.position.set(0, 0.0, 0); sat.add(face);
    const fr = 0.15, fz = 0.33;
    const faceDisc = new T.Mesh(new T.CircleGeometry(fr, 40), new T.MeshBasicMaterial({ color: 0x05070c })); faceDisc.position.z = fz; face.add(faceDisc);
    const tickMat = new T.MeshBasicMaterial({ color: new T.Color('#ffffff'), toneMapped: false });
    for (let i = 0; i < 60; i++) { const a = (TAU * i) / 60, big = i % 5 === 0, m = new T.Mesh(new T.BoxGeometry(0.005, big ? 0.03 : 0.014, 0.004), tickMat); m.position.set(Math.cos(a) * fr * 0.82, Math.sin(a) * fr * 0.82, fz + 0.004); m.rotation.z = a + Math.PI / 2; face.add(m); }
    const rimMat = new T.MeshBasicMaterial({ color: new T.Color(COL.alert), toneMapped: false });
    const rim = new T.Mesh(new T.TorusGeometry(fr, 0.009, 8, 64), rimMat); rim.position.z = fz + 0.004; face.add(rim);
    const hand = new T.Group(); hand.position.z = fz + 0.008; face.add(hand);
    const hm = new T.Mesh(new T.BoxGeometry(0.008, fr * 0.8, 0.004), rimMat); hm.position.y = fr * 0.4; hand.add(hm);
    /* the switch: a base, a lever on a pivot, OFF and ON plates, a status lamp, a sign */
    const sw = w.group({ at: TW.SW, rot: [0.35, -0.35, 0] });
    w.box([1.1, 0.16, 0.56], '#262B33', { parent: sw, mat: { metalness: 0.7, roughness: 0.4 } });
    w.box([0.7, 0.03, 0.12], '#0D1015', { parent: sw, at: [0, 0.09, 0] });
    for (const s of [-1, 1]) w.box([0.06, 0.06, 0.4], '#8C939C', { parent: sw, at: [s * 0.5, 0.1, 0], mat: { metalness: 0.9, roughness: 0.3 } });
    const pivot = new T.Group(); pivot.position.set(0, 0.1, 0); sw.add(pivot);
    const leverMat = w.mat('#C9CED6', { metalness: 0.9, roughness: 0.25 });
    const lev = new T.Mesh(new T.CylinderGeometry(0.035, 0.045, 0.55, 20), leverMat); lev.position.y = 0.275; pivot.add(lev);
    const knobMat = new T.MeshStandardMaterial({ color: new T.Color(COL.alert), emissive: new T.Color(COL.alert), emissiveIntensity: 0.6, roughness: 0.35 });
    const knob = new T.Mesh(new T.SphereGeometry(0.1, 32, 24), knobMat); knob.position.y = 0.58; pivot.add(knob);
    const off = w.label('OFF', { size: 0.14, color: 'alert', flat: true, parent: sw, at: [0.38, 0.087, 0.2], rot: [-Math.PI / 2, 0, 0] });
    const on = w.label('ON', { size: 0.14, color: 'good', flat: true, parent: sw, at: [-0.38, 0.087, 0.2], rot: [-Math.PI / 2, 0, 0] });
    const lampMat = new T.MeshBasicMaterial({ color: new T.Color(COL.alert), toneMapped: false });
    const lamp = new T.Mesh(new T.SphereGeometry(0.05, 20, 16), lampMat); lamp.position.set(0, 0.12, -0.2); sw.add(lamp);
    const red = new T.Color(COL.alert), green = new T.Color(COL.good), gold2 = new T.Color(COL.accent), tmp = new T.Color();
    return (t) => {
      sat.rotation.set(0.08 * Math.sin(t * 0.3), -0.35 + 0.04 * t - 0.04 * c.doubt.t0, 0.05 * Math.sin(t * 0.21 + 1));
      const k = switchK(t);
      /* the clock runs fast and unchecked; after the flip it is corrected (gold) */
      hand.rotation.z = -TAU * (t / 1.4);
      rimMat.color.copy(tmp.copy(red).lerp(gold2, clamp(k)));
      pivot.rotation.z = lerp(-0.62, 0.62, k);
      knobMat.color.copy(tmp.copy(red).lerp(green, clamp(k))); knobMat.emissive.copy(knobMat.color);
      lampMat.color.copy(tmp.copy(red).lerp(green, clamp(k)));
      lamp.scale.setScalar(1 + 0.25 * pulse(t, c.flipped + 0.2, 0.05, 0.6) + (k < 0.5 ? 0.12 * (0.5 + 0.5 * Math.sin(t * 6)) : 0));
      off.material.opacity = 1 - 0.7 * k; on.material.opacity = 0.3 + 0.7 * k;
    };
  });
  return _TW;
}

/* ---------- cameras ---------- */
/* a camera at target + dir·dist (dir need not be unit), looking at target */
function camAt(target, dir, dist, fov = 40, roll = 0) {
  const n = v3.norm(dir);
  return { from: v3.add(target, v3.mul(n, dist)), to: target, fov, roll };
}
/* a frame of reference at the dot: n out of the ground, e east-ish, u north-ish */
function dotFrame(t) {
  const d = dotAt(t), n = v3.norm(d), e = v3.norm(v3.cross([0, 1, 0], n)), u = v3.norm(v3.cross(n, e));
  return { d, n, e, u };
}
/* the satellite on the sheet, and a camera that rides with it */
function sheetCam(t, back = 3.2, up = 1.6, side = 0.0, fov = 38, lookUp = 0.4) {
  const s = sheetSat(t), out = v3.norm([s[0], 0, s[2]]), tang = v3.norm(v3.cross([0, 1, 0], out));
  const from = v3.add(v3.add(v3.add(s, v3.mul(out, back)), [0, up, 0]), v3.mul(tang, side));
  return { from, to: v3.add(s, [-out[0] * 0.9, lookUp, -out[2] * 0.9]), fov };
}
/* a soft dark band behind text at the top of the frame, for legibility over bright 3D */
function topShade(ctx, a = 1, h = 640) {
  if (a <= 0.003) return;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, `rgba(0,0,0,${0.6 * a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, h);
}
