'use strict';
/* =====================================================================
   kit3d.js — things built in code for a 3D world: no downloaded models, no
   generated imagery. Everything here is three.js shapes, materials and maths,
   posed from t, so it renders the same every time.

   Inside world3d(async (T, w) => { … }) every helper below is on w:

     w.studio({ color: 'bg', floor: '#1b2230' })        a seamless stage: floor, fog, soft key light, shadows
     const cell = w.capsule(0.6, 2.2, 'good', { at: [0, 1.2, 0], toon: true })    a shape, placed
     const word = w.label('3.8 cm', { size: 0.5, color: 'accent' })                text standing in the world
     const path = w.line([[0, 0, 0], [2, 1, 0], [4, 0, 0]], { color: 'accent' })   a tube that draws itself on
     const dots = w.instances(new T.SphereGeometry(0.05, 12, 8), w.glow('good'), 400)
     const pic = await w.picture('fleming-lab', { width: 2.4, at: [0, 1.6, -2] })  a real photograph, framed, in the world

     return (t) => {                                   // set every pose from t
       cell.rotation.y = t * 0.4;
       word.scale.setScalar(pop3(t, c.num));
       path.draw(tw(t, c.a, c.b));
     };

   There are no human figures in the kit on purpose: people built from shapes look cheap. The hero
   of a video is a thing (the cell, the dish, the Moon); real people appear in real photographs.
   ===================================================================== */

/* a scale that pops from 0 to 1 at t0 (overshooting a little), for things that appear */
const pop3 = (t, t0, d = 0.45) => (t <= t0 ? 0.0001 : Math.max(0.0001, E.outBack(clamp((t - t0) / d))));

/* ---------- the kit ---------- */
function kit3d(T, w) {
  const scene = w.scene;
  const col = (c, fb) => new T.Color(c == null ? fb : (COL[c] || c));
  const _toonRamp = (() => { const d = new Uint8Array([70, 70, 70, 255, 160, 160, 160, 255, 255, 255, 255, 255]); const t = new T.DataTexture(d, 3, 1, T.RGBAFormat); t.minFilter = t.magFilter = T.NearestFilter; t.needsUpdate = true; return t; })();
  const toon = (c, o = {}) => new T.MeshToonMaterial(Object.assign({ color: col(c, '#ffffff'), gradientMap: _toonRamp }, o));
  const material = (c, o = {}) => (o.glow ? w.glow(c, o.glow === true ? 2 : o.glow) : o.toon ? toon(c) : w.mat(c, o.mat || {}));
  const place = (mesh, o = {}) => {
    if (o.at) mesh.position.set(o.at[0], o.at[1], o.at[2]);
    if (o.rot) mesh.rotation.set(o.rot[0], o.rot[1], o.rot[2]);
    mesh.traverse((m) => { if (m.isMesh) { m.castShadow = o.shadow !== false; m.receiveShadow = o.shadow !== false; } });
    (o.parent || scene).add(mesh);
    if (o.outline) outline(mesh, o.outline === true ? '#000000' : o.outline);
    return mesh;
  };
  /* a dark inverted shell round a mesh: the cartoon outline */
  function outline(obj, color = '#000000', thick = 0.04) {
    const m = new T.MeshBasicMaterial({ color: col(color), side: T.BackSide });
    const shells = [];
    obj.traverse((o) => { if (o.isMesh && !o.userData.shell) shells.push(o); });
    for (const o of shells) {
      const s = new T.Mesh(o.geometry, m); s.userData.shell = true;
      o.geometry.computeBoundingSphere();
      s.scale.setScalar(1 + thick / Math.max(0.05, o.geometry.boundingSphere.radius));
      o.add(s);
    }
    return obj;
  }
  const kit = {
    toon, outline,
    /* shapes, placed: o.at, o.rot, o.toon, o.glow, o.outline, o.parent, o.mat (extra material settings) */
    box(size, c, o = {}) { return place(new T.Mesh(new T.BoxGeometry(size[0], size[1], size[2]), material(c, o)), o); },
    ball(r, c, o = {}) { return place(new T.Mesh(new T.SphereGeometry(r, 48, 32), material(c, o)), o); },
    cyl(r, h, c, o = {}) { return place(new T.Mesh(new T.CylinderGeometry(o.r2 == null ? r : o.r2, r, h, 48), material(c, o)), o); },
    capsule(r, len, c, o = {}) { return place(new T.Mesh(new T.CapsuleGeometry(r, len, 12, 32), material(c, o)), o); },
    cone(r, h, c, o = {}) { return place(new T.Mesh(new T.ConeGeometry(r, h, 48), material(c, o)), o); },
    torus(r, tube, c, o = {}) { return place(new T.Mesh(new T.TorusGeometry(r, tube, 24, 64), material(c, o)), o); },
    group(o = {}) { return place(new T.Group(), o); },

    /* a seamless stage for motion graphics: the floor runs into fog of the same colour, so there is no
       horizon; soft image-based light, a key light with soft shadows. o.color (background), o.floor */
    studio(o = {}) {
      const bg = o.color == null ? STYLE.bg : (COL[o.color] || o.color);
      w.background(bg); w.fog(bg, o.near || 9, o.far || 32);
      w.room(o.env == null ? 0.55 : o.env);
      w.ground({ color: o.floor || mixToHex(bg, '#ffffff', 0.06), roughness: 0.95 });
      w.sun({ dir: o.light || [3, 7, 4], intensity: o.intensity || 2.2, area: o.area || 8 });
      w.ambient('#ffffff', 0.15);
    },

    /* text standing in the world (a card that always faces the camera unless o.flat): size is its
       height in metres; o.color, o.weight, o.font (F.disp), o.outline (dark rim, default on) */
    label(str, o = {}) {
      const px = 160, font = fontCSS(o.weight || 900, px, o.font || F.disp), c = document.createElement('canvas'), g = c.getContext('2d');
      g.font = font; const tw0 = Math.ceil(g.measureText(str).width) + 60;
      c.width = tw0; c.height = Math.round(px * 1.45);
      g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
      if (o.outline !== false) { g.strokeStyle = 'rgba(0,0,0,0.85)'; g.lineWidth = px * 0.12; g.strokeText(str, tw0 / 2, c.height / 2); }
      g.fillStyle = o.color == null ? COL.ink : (COL[o.color] || o.color); g.fillText(str, tw0 / 2, c.height / 2);
      const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 8;
      const h = o.size || 0.4, wd = h * c.width / c.height;
      const obj = o.flat
        ? new T.Mesh(new T.PlaneGeometry(wd, h), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: T.DoubleSide }))
        : new T.Sprite(new T.SpriteMaterial({ map: tex, depthWrite: false }));
      if (!o.flat) obj.scale.set(wd, h, 1);
      obj.userData.baseScale = [obj.scale.x, obj.scale.y];
      return place(obj, Object.assign({ shadow: false }, o));
    },

    /* a tube along points that draws itself on: line.draw(k), k 0..1. o.color, o.radius, o.glow */
    line(points, o = {}) {
      const curve = new T.CatmullRomCurve3(points.map((p) => new T.Vector3(p[0], p[1], p[2])), false, 'catmullrom', o.tension == null ? 0.5 : o.tension);
      const segs = o.segments || 200, geo = new T.TubeGeometry(curve, segs, o.radius || 0.025, 10, false);
      const mesh = place(new T.Mesh(geo, o.glow === false ? w.mat(o.color || 'accent') : w.glow(o.color || 'accent', o.glow || 1.6)), Object.assign({ shadow: false }, o));
      const per = geo.index.count / segs;
      mesh.draw = (k) => { geo.setDrawRange(0, Math.round(segs * clamp(k)) * per); return mesh; };
      mesh.curve = curve; mesh.draw(o.drawn == null ? 1 : o.drawn);
      return mesh;
    },

    /* an arrow from a to b that grows from a: arrow.grow(k) */
    arrow(a, b, o = {}) {
      const g = new T.Group(), A = new T.Vector3(...a), B = new T.Vector3(...b), d = B.clone().sub(A), L = d.length(), r = o.radius || 0.04;
      const mat = o.glow ? w.glow(o.color || 'accent', o.glow) : w.mat(o.color || 'accent');
      const shaft = new T.Mesh(new T.CylinderGeometry(r, r, 1, 16), mat), head = new T.Mesh(new T.ConeGeometry(r * 2.6, r * 6, 20), mat);
      g.add(shaft); g.add(head);
      g.position.copy(A); g.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize());
      g.grow = (k) => {
        const len = Math.max(0.0001, L * clamp(k)), hl = Math.min(r * 6, len);
        shaft.scale.set(1, Math.max(0.0001, len - hl), 1); shaft.position.y = (len - hl) / 2;
        head.position.y = len - hl / 2; head.scale.setScalar(k <= 0 ? 0.0001 : 1);
        return g;
      };
      g.grow(o.grown == null ? 1 : o.grown);
      return place(g, Object.assign({ shadow: false }, o, { at: null }));
    },

    /* many copies of one shape, each placed every frame: dots.set(i, [x, y, z], scale, [rx, ry, rz]) then dots.commit() */
    instances(geo, mat, n) {
      const mesh = new T.InstancedMesh(geo, mat, n), m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), p = new T.Vector3(), s = new T.Vector3();
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.set = (i, pos, sc = 1, rot = null) => {
        p.set(pos[0], pos[1], pos[2]); q.setFromEuler(rot ? e.set(rot[0], rot[1], rot[2]) : e.set(0, 0, 0));
        if (Array.isArray(sc)) s.set(sc[0], sc[1], sc[2]); else s.setScalar(Math.max(0.0001, sc));
        mesh.setMatrixAt(i, m.compose(p, q, s));
      };
      mesh.commit = () => { mesh.instanceMatrix.needsUpdate = true; };
      for (let i = 0; i < n; i++) mesh.set(i, [0, -1000, 0], 0.0001);
      mesh.commit();
      scene.add(mesh);
      return mesh;
    },

    /* a real photograph from media/ as a framed board in the world (graded like every picture):
       o.width (metres), o.at, o.rot, o.frame (colour; false for none) */
    async picture(name, o = {}) {
      const file = CREDITS[name] && CREDITS[name].file ? 'project/media/' + CREDITS[name].file : `project/media/${name}.jpg`;
      const im = await new Promise((res, rej) => { const x = new Image(); x.onload = () => res(x); x.onerror = () => rej(new Error('no picture ' + file + ' — take one with lockstep find / take')); x.src = file; });
      const c = _graded(im, im.naturalWidth, im.naturalHeight, {});
      const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 8;
      const wd = o.width || 2, ht = wd * im.naturalHeight / im.naturalWidth, g = new T.Group();
      g.add(new T.Mesh(new T.PlaneGeometry(wd, ht), new T.MeshBasicMaterial({ map: tex, toneMapped: false })));
      if (o.frame !== false) { const f = new T.Mesh(new T.BoxGeometry(wd + 0.08, ht + 0.08, 0.04), w.mat(o.frame || '#f2efe8')); f.position.z = -0.025; g.add(f); }
      g.size = [wd, ht];
      return place(g, o);
    },
  };
  return kit;
}
