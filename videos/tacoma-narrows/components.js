'use strict';
/* components.js — the two worlds of this video, built in code and shared by the scenes:

   bridgeWorld()   the 1940 Tacoma Narrows Bridge over the water on an overcast morning: towers,
                   cables, suspenders, a deck of 64 segments that bounces in waves and then twists,
                   wind streaks, forested shores, a car. Its motion is timed from the narration.
   sectionWorld()  the deck seen end-on in the wind: the H-shaped plate-girder section tilting while
                   wind streaks bend over it, with the push of the wind shown as an arrow; later a
                   wind tunnel built round a streamlined deck.

   Both are pure functions of t. Sizes are in world units: the main span is 16 long.            */

const TN = { SPAN: 16, HALF: 8, SIDE: 6, DECK_Y: 2.0, TOWER_H: 7.2, DECK_W: 0.9, NSEG: 64, SKY: '#A7B4C0' };

/* how much the deck bounces (av) and twists (at), and how strong the wind is (wind), at time t */
function tnMotion() {
  const c = {
    dance: at('hook', 'dance'), gertie: at('hook', 'gertie'), drove: at('hook', 'drove'), span: at('ribbon', 'span'),
    rippled: at('ribbon', 'rippled'), wind: at('wind', 'wind'), blow: at('wind', 'blow'), changed: at('twist', 'changed'),
    twist: at('twist', 'twist'), lose: at('twist', 'lose'), film: beatOf('film').t0, lesson: beatOf('lesson').t0,
  };
  return {
    c,
    av: (t) => (0.07 + 0.11 * tw(t, c.dance - 0.3, c.dance + 0.8) + 0.17 * tw(t, c.rippled - 0.6, c.rippled + 0.8)) * (1 - 0.85 * tw(t, c.changed, c.twist + 0.6)) * (1 - tw(t, c.lesson - 1, c.lesson)),
    at: (t) => (0.05 + 0.22 * tw(t, c.twist - 0.4, c.twist + 0.5) + 0.5 * E.in2(tw(t, c.twist + 0.5, c.lose, E.lin))) * tw(t, c.changed, c.twist + 0.3, E.lin) * (1 - tw(t, c.lesson - 1, c.lesson)),
    wind: (t) => clamp(0.25 * tw(t, c.span, c.rippled) + 0.75 * tw(t, c.wind - 0.5, c.blow)) * (1 - tw(t, c.lesson - 1, c.lesson)),
  };
}
let _TNM = null;
const tnM = () => _TNM || (_TNM = tnMotion());
/* the deck's centre height and twist at position x (−8 … 8 on the main span) and time t */
function deckAt(x, t) {
  const m = tnM(), u = (x + TN.HALF) / TN.SPAN;
  if (u < 0 || u > 1) return { y: TN.DECK_Y, th: 0 };
  const y = TN.DECK_Y + m.av(t) * Math.sin(3 * Math.PI * u) * Math.sin(TAU * 0.55 * t - 2.2 * u);
  const th = m.at(t) * Math.sin(TAU * u) * Math.sin(TAU * 0.42 * t);
  return { y, th };
}
/* where the car is: driving across in the hook, abandoned near the quarter point afterwards */
function carX(t) {
  const c = tnM().c;
  return t < c.film ? lerp(-12.5, -1.5, tw(t, beatOf('hook').t0 + 4.3, c.span + 0.5, E.lin)) : 3.6;
}

let _BW = null;
function bridgeWorld() {
  if (_BW) return _BW;
  tnM();
  _BW = world3d(async (T, w) => {
    w.background(TN.SKY); w.fog(TN.SKY, 16, 70);
    w.room(0.65);
    w.sun({ dir: [-5, 9, 7], intensity: 1.5, area: 18 });
    w.ambient('#ffffff', 0.3);
    const water = w.add(new T.Mesh(new T.PlaneGeometry(260, 260), w.mat('#4E616E', { roughness: 0.28, metalness: 0.15 })));
    water.rotation.x = -Math.PI / 2; water.receiveShadow = true;
    /* the shores: two long wooded hills, the trees scattered on them by a seeded rng */
    const hillY = (x, z, s) => -1.6 + 4.2 * Math.sqrt(Math.max(0, 1 - ((x - s * 20) / 7.5) ** 2 - (z / 16) ** 2));
    for (const s of [-1, 1]) { const h = w.ball(1, '#465a3c', { at: [s * 20, -1.6, 0] }); h.scale.set(7.5, 4.2, 16); }
    const trees = w.instances(new T.ConeGeometry(0.32, 1.25, 7), w.mat('#2E4230'), 420), r = rng(3);
    for (let i = 0; i < 420; i++) {
      const s = i % 2 ? 1 : -1, x = s * (13.2 + r() * 9), z = (r() - 0.5) * 28, y = hillY(x, z, s);
      trees.set(i, y > 0.25 ? [x, y + 0.5, z] : [0, -50, 0], 0.7 + 0.7 * r());
    }
    trees.commit();
    /* towers, piers and anchorages */
    const steel = '#76838D', concrete = '#8E959A';
    for (const s of [-1, 1]) {
      for (const zz of [-1, 1]) w.box([0.26, TN.TOWER_H, 0.26], steel, { at: [s * TN.HALF, TN.TOWER_H / 2, zz * 0.56] });
      for (const y of [1.75, 4.4, 7.05]) w.box([0.22, 0.24, 1.36], steel, { at: [s * TN.HALF, y, 0] });
      w.box([1.3, 1.4, 2.0], concrete, { at: [s * TN.HALF, 0.5, 0] });
      w.box([1.2, 1.6, 1.8], concrete, { at: [s * (TN.HALF + TN.SIDE), 1.0, 0] });
      w.box([TN.SIDE, 0.09, TN.DECK_W], '#8A9299', { at: [s * (TN.HALF + TN.SIDE / 2), TN.DECK_Y, 0] });
      for (const zz of [-1, 1]) w.box([TN.SIDE, 0.3, 0.05], '#5D666E', { at: [s * (TN.HALF + TN.SIDE / 2), TN.DECK_Y - 0.1, zz * TN.DECK_W / 2] });
    }
    /* the main cables: a parabola between the tower tops, straight-ish back to the anchorages */
    const cableY = (x) => 2.45 + (TN.TOWER_H - 0.15 - 2.45) * (x / TN.HALF) ** 2;
    for (const zz of [-1, 1]) {
      const pts = [];
      pts.push([-(TN.HALF + TN.SIDE), 1.9, zz * 0.5]);
      for (let i = 0; i <= 40; i++) { const x = -TN.HALF + (TN.SPAN * i) / 40; pts.push([x, cableY(x), zz * 0.5]); }
      pts.push([TN.HALF + TN.SIDE, 1.9, zz * 0.5]);
      w.line(pts, { color: '#3F474F', radius: 0.045, glow: false, tension: 0 });
    }
    /* suspenders, deck slabs and girders: posed every frame */
    const NSUS = 31, sus = w.instances(new T.CylinderGeometry(0.012, 0.012, 1, 6), w.mat('#3F474F'), NSUS * 2);
    const slab = w.instances(new T.BoxGeometry((TN.SPAN / TN.NSEG) * 1.03, 0.09, TN.DECK_W), w.mat('#8A9299'), TN.NSEG);
    const gird = w.instances(new T.BoxGeometry((TN.SPAN / TN.NSEG) * 1.03, 0.3, 0.05), w.mat('#5D666E'), TN.NSEG * 2);
    const line = w.instances(new T.BoxGeometry((TN.SPAN / TN.NSEG) * 0.5, 0.005, 0.03), new T.MeshBasicMaterial({ color: 0xe8e2c8 }), TN.NSEG);
    /* wind: thin streaks flying across the span */
    const NW = 220, streak = w.instances(new T.BoxGeometry(0.045, 0.045, 2.4), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, fog: false }), NW);
    /* a car: body, cabin, wheels */
    const car = w.group();
    w.box([0.5, 0.13, 0.25], 'alert', { parent: car, at: [0, 0.14, 0] });
    w.box([0.27, 0.12, 0.21], 'alert', { parent: car, at: [-0.04, 0.26, 0] });
    for (const [x, z] of [[0.15, 0.12], [-0.15, 0.12], [0.15, -0.12], [-0.15, -0.12]]) w.cyl(0.065, 0.05, '#1c1f23', { parent: car, at: [x, 0.07, z], rot: [Math.PI / 2, 0, 0] });
    const V = new T.Vector3(), A = new T.Vector3(), B = new T.Vector3(), Y = new T.Vector3(0, 1, 0), Q = new T.Quaternion();
    const stretch = (inst, i, a, b) => {                  // a cylinder of height 1 from point a to point b
      A.set(...a); B.set(...b); V.subVectors(B, A); const L = V.length();
      Q.setFromUnitVectors(Y, V.normalize());
      const e = new T.Euler().setFromQuaternion(Q);
      inst.set(i, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], [1, L, 1], [e.x, e.y, e.z]);
    };
    return (t) => {
      const ds = TN.SPAN / TN.NSEG;
      for (let i = 0; i < TN.NSEG; i++) {
        const x = -TN.HALF + ds * (i + 0.5), d = deckAt(x, t), c = Math.cos(d.th), s = Math.sin(d.th);
        slab.set(i, [x, d.y, 0], 1, [d.th, 0, 0]);
        for (const k of [0, 1]) { const zz = (k ? 1 : -1) * TN.DECK_W / 2; gird.set(i * 2 + k, [x, d.y - 0.1 * c - zz * s, -0.1 * s + zz * c], 1, [d.th, 0, 0]); }
        line.set(i, [x, d.y + 0.05 * c, 0.05 * s], i % 2 ? 0.0001 : 1, [d.th, 0, 0]);
      }
      slab.commit(); gird.commit(); line.commit();
      for (let i = 0; i < NSUS; i++) {
        const x = -TN.HALF + (TN.SPAN * (i + 0.5)) / NSUS, d = deckAt(x, t);
        for (const k of [0, 1]) {
          const zz = (k ? 1 : -1) * 0.5, ze = (k ? 1 : -1) * TN.DECK_W / 2;
          stretch(sus, i * 2 + k, [x, cableY(x), zz], [x, d.y - ze * Math.sin(d.th), ze * Math.cos(d.th)]);
        }
      }
      sus.commit();
      const wd = tnM().wind(t);
      for (let i = 0; i < NW; i++) {
        const on = hash(i * 7.3) < wd, sp = 7 + 5 * hash(i * 1.9);
        const d = ((hash(i * 3.7) * 30 + sp * t) % 30) - 15;      // along the wind: across the span, at a slant so the streaks read from the shore
        const x0 = -14 + 28 * hash(i * 2.3);
        streak.set(i, on ? [x0 + 0.6 * d, 0.6 + 6 * hash(i * 5.1), 0.8 * d] : [0, -50, 0], on ? 1 : 0.0001, [0, Math.atan2(0.6, 0.8), 0]);
      }
      streak.commit();
      const cx = carX(t), cd = deckAt(cx, t);
      const cc = Math.cos(cd.th), cs = Math.sin(cd.th);        // the car sits in the near lane: (0, 0.045, 0.2) turned with the deck
      car.position.set(cx, cd.y + 0.045 * cc - 0.2 * cs, 0.045 * cs + 0.2 * cc);
      car.rotation.set(cd.th, 0, 0);
    };
  });
  return _BW;
}

/* the deck seen end-on: how the wind feeds the twist. mode by time: twist (growing), myth (gusts, then
   steady wind), tunnel (a streamlined deck, still, inside a wind tunnel) */
let _SW = null;
function sectionWorld() {
  if (_SW) return _SW;
  const c = { twist: at('twist', 'twist'), tilted: at('twist', 'tilted'), lose: at('twist', 'lose'), blamed: at('myth', 'blamed'),
    wasnt: at('myth', "wasn't"), tested: at('lesson', 'tested'), tunnels: at('lesson', 'tunnels') };
  /* the section's tilt: growing through the twist beat; in the myth beat, a steady swing */
  const amp = (t) => (t < c.blamed - 1 ? 0.08 + 0.5 * E.in2(tw(t, c.tilted - 0.6, c.lose + 0.3, E.lin)) : 0.42);
  const tilt = (t) => (t > c.tested - 0.4 ? 0.015 * Math.sin(TAU * 1.3 * t) : amp(t) * Math.sin(TAU * 0.5 * t));
  const gusty = (t) => t > c.blamed - 0.5 && t < c.wasnt;          // the resonance story: wind in pulses
  _SW = world3d(async (T, w) => {
    w.studio({ color: '#1C2630', floor: '#222D37', light: [4, 8, 6], intensity: 1.8 });
    const pivot = w.group({ at: [0, 1.7, 0] });
    const old = w.group({ parent: pivot });
    w.box([3.2, 0.12, 2.4], '#8A9299', { parent: old, at: [0, 0.06, 0] });                 // the road slab
    for (const zz of [-1, 1]) w.box([3.2, 0.62, 0.12], '#5D666E', { parent: old, at: [0, -0.22, zz * 1.2] });   // the plate girders
    /* a modern streamlined box-girder deck: a flattened hexagon, pointed into the wind, extruded along the span */
    const hexa = new T.Shape();
    [[0, 1.45], [0.16, 0.95], [0.16, -0.95], [0, -1.45], [-0.22, -0.95], [-0.22, 0.95]].forEach(([y, z], i) => (i ? hexa.lineTo(z, y) : hexa.moveTo(z, y)));
    hexa.closePath();
    const boxGeo = new T.ExtrudeGeometry(hexa, { depth: 3.2, bevelEnabled: false });
    boxGeo.translate(0, 0, -1.6); boxGeo.rotateY(Math.PI / 2);
    const fresh = w.group({ parent: pivot });
    const deckBox = w.add(new T.Mesh(boxGeo, w.mat('#A9B4BB', { roughness: 0.4 }))); fresh.add(deckBox);
    fresh.visible = false;
    /* a wind tunnel: square frames along the flow, a floor, and a glass wall on the far side */
    const tunnel = w.group();
    for (let i = 0; i < 6; i++) {
      const z = -3.75 + i * 1.5;
      for (const [sz, at] of [[[3.8, 0.12, 0.12], [0, 0.2, z]], [[3.8, 0.12, 0.12], [0, 3.3, z]], [[0.12, 3.2, 0.12], [-1.9, 1.75, z]], [[0.12, 3.2, 0.12], [1.9, 1.75, z]]])
        w.box(sz, '#D8E2EA', { parent: tunnel, at });
    }
    w.box([3.8, 0.04, 7.6], '#C7D3DC', { parent: tunnel, at: [0, 0.18, 0], mat: { transparent: true, opacity: 0.35 } });
    w.box([0.04, 3.1, 7.6], '#C7D3DC', { parent: tunnel, at: [-1.9, 1.75, 0], mat: { transparent: true, opacity: 0.15 } });
    tunnel.visible = false;
    const N = 150, streak = w.instances(new T.BoxGeometry(0.03, 0.03, 0.9), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }), N);
    const up = w.arrow([0.4, 0.15, 1.05], [0.4, 1.35, 1.05], { color: 'accent', radius: 0.05, glow: 1.2, parent: pivot });
    const down = w.arrow([0.4, -0.35, 1.05], [0.4, -1.55, 1.05], { color: 'accent', radius: 0.05, glow: 1.2, parent: pivot });
    const windLabel = w.label('WIND', { size: 0.34, color: 'subject', at: [0, 3.0, 2.6] });
    return (t) => {
      const th = tilt(t), om = Math.cos(TAU * 0.5 * t);           // om > 0: tilting one way, < 0 the other
      pivot.rotation.x = th;
      const streamlined = t > c.tested - 0.4;
      old.visible = !streamlined; fresh.visible = streamlined; tunnel.visible = t > c.tunnels - 0.6;
      const sp = gusty(t) ? 4 + 5 * Math.max(0, Math.sin(TAU * 0.5 * t)) : 5.5;
      for (let i = 0; i < N; i++) {
        const y0 = 0.4 + 2.7 * hash(i * 4.1), x = -1.5 + 3 * hash(i * 2.7);
        const ph = (hash(i * 9.1) * 12 + sp * t + (gusty(t) ? 0.8 * Math.sin(TAU * 0.5 * t) : 0)) % 12;
        const z = 6 - ph;                                           // the wind blows from +z (screen left) to −z (screen right)
        const near = Math.exp(-(((y0 - 1.7) / 0.7) ** 2)) * (Math.abs(z) < 2.6 ? 1 : 0.3);
        const y = y0 - z * Math.sin(th) * 0.55 * near;              // flow bends over the tilted deck
        streak.set(i, [x, y, z], 1, [-Math.sin(th) * near * 0.8, 0, 0]);
      }
      streak.commit();
      /* the wind's push on the deck's edge, in the direction it is already turning */
      const push = streamlined ? 0 : clamp(Math.abs(th) * 2.2) * tw(t, c.tilted - 0.2, c.tilted + 0.4, E.lin);
      up.grow(om > 0 ? push : 0); down.grow(om <= 0 ? push : 0);
      windLabel.visible = !streamlined || t < c.tunnels;
    };
  });
  return _SW;
}
