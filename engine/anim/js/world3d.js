'use strict';
/* =====================================================================
   world3d.js — 3D worlds in the frame, built with three.js (MIT; loaded
   only when a video builds one). Models, skies and textures come from the
   video's media/ (lockstep find … model / hdri / texture, then take), or
   are built from three.js shapes in the video's own code.

   Setup (once, in a scene's setup code). The builder runs at boot, after the
   media has loaded; it may await models, and returns the world's update
   function, called with the time before every render:

     const lab = world3d(async (T, w) => {            // T: three.js, w: this world
       w.sky('studio');                                 // media/studio.hdr; or w.room() — soft studio light, no file
       w.ground({ color: '#2a2f36' });                  // a floor that catches shadows ({ shadowOnly: true } over a photo)
       w.sun({ dir: [3, 6, 2], intensity: 2.2 });
       const bot = await w.model('robot', { height: 1.8 });       // media/robot.glb, scaled and stood on the floor
       const dish = w.add(new T.Mesh(new T.CylinderGeometry(1, 1, 0.12, 64), w.glass()));
       return (t) => {                                  // pure function of t: set every pose from t
         bot.act(t, [[0, 'Idle'], [c.walk, 'Walking'], [c.wave, 'Wave']]);   // clips by start time, blended
         bot.object.position.x = lerp(-2, 0, tw(t, c.walk, c.walk + 2));
       };
     });

   Draw (every frame):
     view3d(ctx, lab, t, { from: [0, 1.6, 6], to: [0, 1, 0], fov: 35 });
     view3d(ctx, lab, t, camPath(t, [[c.a, { from: [0, 2, 8], to: [0, 1, 0] }], [c.b, { from: [2, 1.4, 3], to: [0, 1.2, 0] }]]));
     view3d(ctx, lab, t, orbit(t, { center: [0, 1, 0], radius: 5, height: 1.8, speed: 0.15 }));

   A world is drawn with a transparent background unless it has a sky, a background colour
   (w.background('#101418')) — so a 3D object can stand in
   a photograph: draw photo() first, then view3d() over it.
   ===================================================================== */

const WORLDS = [];
let T3 = null;                        // the three.js module, once loaded
const _3 = { renderer: null, canvas: null, pmrem: null, gltf: new Map(), hdr: new Map(), tex: new Map(), room: null };

function world3d(build, o = {}) {
  if (window.READY) throw new Error('world3d() called after loading: build worlds in a scene\'s setup code, not in its draw function');
  const w = { build, o, scene: null, camera: null, update: null, ready: false, opaque: false, mixers: [] };
  WORLDS.push(w);
  return w;
}

function _mediaFile(name, ext) {
  const c = CREDITS[name];
  if (c && c.file) return 'project/media/' + c.file;
  return `project/media/${name}${ext}`;
}

/* the API a builder gets as w */
function _worldAPI(w) {
  const T = T3, scene = w.scene;
  return {
    T, scene,
    add(obj) { scene.add(obj); return obj; },
    background(color) { scene.background = new T.Color(COL[color] || color); w.opaque = true; },
    fog(color, near = 8, far = 40) { scene.fog = new T.Fog(new T.Color(COL[color] || color), near, far); },
    /* image-based light (and the background, unless o.background === false) from an HDRI in media/ */
    async sky(name, so = {}) {
      let hdr = _3.hdr.get(name);
      if (!hdr) {
        const file = _mediaFile(name, '.hdr');
        const tex = await new T.HDRLoader().loadAsync(file).catch(() => { throw new Error(`no sky ${file} — take one with: lockstep find <video> hdri "…"`); });
        tex.mapping = T.EquirectangularReflectionMapping;
        hdr = { tex, env: _3.pmrem.fromEquirectangular(tex).texture };
        _3.hdr.set(name, hdr);
      }
      scene.environment = hdr.env;
      scene.environmentIntensity = so.intensity == null ? 1 : so.intensity;
      if (so.rotate) scene.environmentRotation.y = so.rotate;
      if (so.background !== false) {
        scene.background = hdr.tex; w.opaque = true;
        scene.backgroundBlurriness = so.blur || 0;
        scene.backgroundIntensity = so.backgroundIntensity == null ? 1 : so.backgroundIntensity;
        if (so.rotate) scene.backgroundRotation.y = so.rotate;
      }
    },
    /* soft, even studio light with no file (three.js RoomEnvironment) */
    room(intensity = 1) {
      if (!_3.room) _3.room = _3.pmrem.fromScene(new T.RoomEnvironment(), 0.04).texture;
      scene.environment = _3.room; scene.environmentIntensity = intensity;
    },
    /* a directional light with soft shadows; dir: where the light comes from */
    sun(so = {}) {
      const L = new T.DirectionalLight(new T.Color(COL[so.color] || so.color || '#ffffff'), so.intensity == null ? 2 : so.intensity);
      const d = so.dir || [3, 6, 2];
      L.position.set(d[0], d[1], d[2]);
      if (so.shadow !== false) {
        L.castShadow = true;
        const s = so.area || 6;
        Object.assign(L.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 0.1, far: 60 });
        L.shadow.mapSize.set(2048, 2048); L.shadow.bias = -0.0004; L.shadow.normalBias = 0.02; L.shadow.radius = 4;
      }
      scene.add(L); scene.add(L.target);
      return L;
    },
    ambient(color = '#ffffff', intensity = 0.4) { const L = new T.HemisphereLight(new T.Color(COL[color] || color), 0x202020, intensity); scene.add(L); return L; },
    /* a floor: o.color, o.size (60), o.shadowOnly (only the shadows show: for a world over a photo) */
    ground(go = {}) {
      const m = go.shadowOnly ? new T.ShadowMaterial({ opacity: go.opacity == null ? 0.35 : go.opacity })
        : new T.MeshStandardMaterial({ color: new T.Color(COL[go.color] || go.color || '#30343a'), roughness: go.roughness == null ? 0.9 : go.roughness });
      const g = new T.Mesh(new T.PlaneGeometry(go.size || 60, go.size || 60), m);
      g.rotation.x = -Math.PI / 2; g.receiveShadow = true; g.position.y = go.y || 0;
      scene.add(g);
      return g;
    },
    /* materials that look right under image-based light */
    mat(color, mo = {}) { return new T.MeshStandardMaterial(Object.assign({ color: new T.Color(COL[color] || color), roughness: 0.45, metalness: 0 }, mo)); },
    glow(color, intensity = 2) { const c = new T.Color(COL[color] || color); return new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: intensity, roughness: 0.4 }); },
    glass(mo = {}) { return new T.MeshPhysicalMaterial(Object.assign({ color: 0xffffff, transmission: 1, roughness: 0.05, thickness: 0.4, ior: 1.45, transparent: true }, mo)); },
    /* a picture from media/ as a texture (a planet's surface, a poster on a wall) */
    async texture(name, to = {}) {
      let tex = _3.tex.get(name);
      if (!tex) {
        const file = _mediaFile(name, '.jpg');
        tex = await new T.TextureLoader().loadAsync(file).catch(() => { throw new Error(`no picture ${file}`); });
        tex.colorSpace = to.data ? T.NoColorSpace : T.SRGBColorSpace; tex.anisotropy = 8;
        _3.tex.set(name, tex);
      }
      return tex;
    },
    /* a glTF model from media/, cloned (the same model can stand in a world many times).
       o: height or size (scaled to that height / largest side, in metres), at: [x, y, z],
       turn (radians about the vertical), ground (true: stood on y = 0), shadows (true). */
    async model(name, mo = {}) {
      let g = _3.gltf.get(name);
      if (!g) {
        const file = _mediaFile(name, '.glb');
        g = await new T.GLTFLoader().loadAsync(file).catch((e) => { throw new Error(`model ${file}: ${e && e.message ? e.message : e} — take one with: lockstep find <video> model "…"`); });
        _3.gltf.set(name, g);
      }
      const root = T.SkeletonUtils.clone(g.scene), wrap = new T.Group();
      wrap.add(root);
      root.traverse((o) => { if (o.isMesh) { o.castShadow = mo.shadows !== false; o.receiveShadow = mo.shadows !== false; } });
      /* measured once, in the model's own units (bones posed first: a skinned mesh's box comes from its
         posed vertices); scaling about the origin scales the box with it */
      root.updateMatrixWorld(true);
      const box = new T.Box3().setFromObject(root, true), size = box.getSize(new T.Vector3());
      const k = mo.height ? mo.height / Math.max(1e-6, size.y) : mo.size ? mo.size / Math.max(1e-6, size.x, size.y, size.z) : 1;
      const c = box.getCenter(new T.Vector3()).multiplyScalar(k);
      root.scale.multiplyScalar(k);
      root.position.multiplyScalar(k);
      root.position.x -= c.x; root.position.z -= c.z;
      if (mo.ground !== false) root.position.y -= box.min.y * k;
      const at = mo.at || [0, 0, 0];
      wrap.position.set(at[0], at[1], at[2]);
      if (mo.turn) wrap.rotation.y = mo.turn;
      scene.add(wrap);
      const mixer = g.animations.length ? new T.AnimationMixer(root) : null;
      const actions = new Map();
      if (mixer) for (const clip of g.animations) { const a = mixer.clipAction(clip); a.play(); a.setEffectiveWeight(0); actions.set(clip.name, a); }
      const h = {
        object: wrap, clips: g.animations.map((a) => a.name),
        /* the pose at time t from a schedule [[start, clip, o?], …] in time order; each clip
           blends in over o.blend (0.25 s) and plays from its start (o.speed, o.loop: true; o.hold:
           false lets a one-shot clip end — the last frame holds) */
        act(t, schedule) {
          if (!mixer) return;
          for (const a of actions.values()) a.setEffectiveWeight(0);
          let k = -1;
          for (let i = 0; i < schedule.length; i++) if (t >= schedule[i][0]) k = i;
          const set = (i, wgt) => {
            if (i < 0 || wgt <= 0) return;
            const [t0, clip, so = {}] = schedule[i], a = actions.get(clip);
            if (!a) throw new Error(`model ${name} has no clip "${clip}"; it has: ${[...actions.keys()].join(', ')}`);
            const d = a.getClip().duration, local = Math.max(0, t - t0) * (so.speed || 1);
            a.time = so.loop === false ? Math.min(local, d - 1e-3) : local % d;
            a.setEffectiveWeight(a.getEffectiveWeight() + wgt);
          };
          if (k < 0) { set(0, 1); } else {
            const bl = (schedule[k][2] && schedule[k][2].blend) || 0.25, u = k > 0 ? clamp((t - schedule[k][0]) / bl) : 1;
            set(k, u); if (u < 1) set(k - 1, 1 - u);
          }
          mixer.update(0);
        },
      };
      return h;
    },
  };
}

/* boot: three.js loaded, every world built (models, skies and textures loaded) */
async function load3D() {
  if (!WORLDS.length) return;
  T3 = await import('/vendor/three/three.bundle.min.js');
  const canvas = makeCanvas(W, H);
  const r = new T3.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  r.setPixelRatio(1); r.setSize(W, H, false);
  r.outputColorSpace = T3.SRGBColorSpace; r.toneMapping = T3.AgXToneMapping; r.toneMappingExposure = 1;
  r.shadowMap.enabled = true; r.shadowMap.type = T3.PCFSoftShadowMap;
  _3.renderer = r; _3.canvas = canvas; _3.pmrem = new T3.PMREMGenerator(r);
  for (const w of WORLDS) {
    w.scene = new T3.Scene();
    w.camera = new T3.PerspectiveCamera(40, W / H, 0.05, 500);
    const api = _worldAPI(w);
    if (typeof kit3d === 'function') Object.assign(api, kit3d(T3, api, w));   // kit3d.js: things built in code
    w.update = (await w.build(T3, api)) || null;
    if (w.o.exposure != null) w.exposure = w.o.exposure;
    w.ready = true;
  }
}

/* Draw world w as seen at time t by camera cam: { from: [x, y, z], to: [x, y, z], fov (40),
   roll (radians) } into ctx. o: alpha, exposure. Returns the camera, and project([x, y, z]): the
   frame position of a point of the world — to pin an overlay to something in it. */
function view3d(ctx, w, t, cam, o = {}) {
  if (!w.ready) return null;
  const a = o.alpha == null ? 1 : o.alpha;
  if (a <= 0.003) return null;
  if (w.update) w.update(t);
  const c = w.camera, f = cam.from || [0, 1.6, 6], to = cam.to || [0, 1, 0];
  c.position.set(f[0], f[1], f[2]); c.up.set(0, 1, 0);
  c.lookAt(to[0], to[1], to[2]);
  if (cam.roll) c.rotateZ(cam.roll);
  if (c.fov !== (cam.fov || 40)) { c.fov = cam.fov || 40; c.updateProjectionMatrix(); }
  const r = _3.renderer;
  r.toneMappingExposure = o.exposure || w.exposure || 1;
  r.setClearColor(0x000000, 0);
  r.render(w.scene, c);
  ctx.save(); ctx.globalAlpha *= clamp(a);
  ctx.drawImage(_3.canvas, 0, 0, W, H);
  ctx.restore();
  const v = new T3.Vector3();
  return { camera: c, project: (p) => { v.set(p[0], p[1], p[2]).project(c); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H, v.z < 1]; } };
}

/* ---------- camera paths ---------- */
const _lerp3 = (a, b, e) => [lerp(a[0], b[0], e), lerp(a[1], b[1], e), lerp(a[2], b[2], e)];
/* the camera at time t along keys [[time, { from, to, fov }], …]: it holds before the first and
   after the last, and travels between neighbours with o.ease (E.ioSine: a smooth dolly). A key may
   also give its own ease for the move that arrives at it. */
function camPath(t, keys, o = {}) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, A] = keys[i - 1], [t1, B] = keys[i], e = (B.ease || o.ease || E.ioSine)(prog(t, t0, t1));
      return { from: _lerp3(A.from, B.from, e), to: _lerp3(A.to || [0, 1, 0], B.to || [0, 1, 0], e), fov: lerp(A.fov || 40, B.fov || 40, e), roll: lerp(A.roll || 0, B.roll || 0, e) };
    }
  }
  return keys[keys.length - 1][1];
}
/* a camera circling center at radius and height, speed turns per second, from angle start */
function orbit(t, o = {}) {
  const c = o.center || [0, 1, 0], r = o.radius || 6, a = (o.start || 0) + TAU * (o.speed == null ? 0.05 : o.speed) * t;
  return { from: [c[0] + Math.sin(a) * r, o.height == null ? c[1] + 1 : o.height, c[2] + Math.cos(a) * r], to: c, fov: o.fov || 40 };
}
