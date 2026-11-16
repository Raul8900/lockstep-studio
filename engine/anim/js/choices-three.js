import * as THREE from '/optional/three/three/build/three.module.js';
window.THREE = THREE;
CHOICE_LOADED.backends.push('three');

/* One offscreen canvas per shot. Both sides of a transition render into their own
   scene layer immediately. There is never a DOM canvas outside the captured MAIN. */
window.createThreeShot = function ({ width = 900, height = 780, setup, update, x = 90, y = 410 }) {
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(width, height); renderer.setPixelRatio(1);
  renderer.setClearColor(0, 0); renderer.outputColorSpace = THREE.SRGBColorSpace;
  const gl = renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info');
  CHOICE_LOADED.renderers.push(debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, width / height, .05, 100);
  camera.position.set(4, 2.5, 7); camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x536778, 2));
  const key = new THREE.DirectionalLight(0xffffff, 3); key.position.set(3, 4, 6); scene.add(key);
  const mixers = [];
  const shot = { scene, camera, renderer, THREE, width, height, x, y, mixers,
    project(v) { const p = v.clone().project(camera); return [x + (p.x + 1) * width / 2, y + (1 - p.y) * height / 2]; },
    async loadGLB(file, clip = 0) {
      if (!file || /(^\/|\.\.|:)/.test(file)) throw new Error('GLB must be a local asset path');
      const { GLTFLoader } = await import('/optional/three/three/examples/jsm/loaders/GLTFLoader.js');
      const manager = new THREE.LoadingManager();
      manager.setURLModifier(url => {
        if (url.startsWith('data:') || url.startsWith('blob:')) return url;
        if (new URL(url, location.href).origin !== location.origin) throw new Error('GLB dependencies must be local; embed textures/buffers in the GLB');
        return url;
      });
      const loader = new GLTFLoader(manager);
      const gltf = await loader.loadAsync(file.startsWith('assets/production/') ? '/' + file : '/project/' + file);
      scene.add(gltf.scene); CHOICE_LOADED.assets.push(file);
      if (gltf.animations.length) {
        const animation = typeof clip === 'string' ? gltf.animations.find(c => c.name === clip) : gltf.animations[clip];
        if (!animation) throw new Error('GLB has no requested animation clip: ' + clip);
        const mixer = new THREE.AnimationMixer(gltf.scene);
        mixer.clipAction(animation).play(); mixers.push(mixer);
      }
      return gltf;
    },
    draw(ctx, absoluteTime) {
      // Clamp explicitly: transitions can ask for a time before this shot's start.
      for (const mixer of mixers) mixer.setTime(Math.max(0, absoluteTime));
      update?.(shot, absoluteTime);
      scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
      renderer.render(scene, camera);
      ctx.drawImage(canvas, x, y, width, height);
    },
  };
  const ready = setup?.(shot);
  if (ready?.then) CHOICE_PREPARES.push(ready);
  return shot;
};

window.prepareThreeChoice = function (spec, start) {
  let object;
  const rig = spec.item === 'three.rig';
  const shot = createThreeShot({
    async setup(s) {
      if (rig || spec.inputs?.model) {
        const gltf = await s.loadGLB(spec.inputs?.model || 'assets/production/hinge-rig.glb', spec.inputs?.clip || 0);
        gltf.scene.position.y = -1; object = gltf.scene;
      } else {
        object = new THREE.Group(); s.scene.add(object);
        for (let k = 0; k < 3; k++) {
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.4, .15), new THREE.MeshStandardMaterial({ color: [COL.subject, COL.data, COL.accent][k], roughness: .35, metalness: .3 }));
          mesh.position.z = (k - 1) * .9; object.add(mesh);
        }
      }
    },
    update(s, t) {
      const angle = .5 + .18 * Math.sin(t * .5);
      s.camera.position.set(Math.sin(angle) * 7, 2, Math.cos(angle) * 7); s.camera.lookAt(0, 0, 0);
    },
  });
  return { draw(ctx, t) { shot.draw(ctx, Math.max(0, t - start)); text(ctx, rig ? 'ABSOLUTE-TIME SKINNED CLIP' : 'LIT 3D · CAMERA + OCCLUSION', CX, 1170, { align: 'center', size: 28, color: COL.ink }); } };
};
