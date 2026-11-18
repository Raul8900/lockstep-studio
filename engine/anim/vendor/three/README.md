# three.js r187 (MIT)

`three.bundle.min.js` is three.js 0.187.0 (https://threejs.org, MIT licence, see `LICENSE`) bundled with
the add-ons the engine uses — `GLTFLoader`, `HDRLoader`, `RoomEnvironment`, `SkeletonUtils`,
`BufferGeometryUtils` — into one ES module, minified with esbuild 0.24.2. It is loaded only when a
video builds a 3D world (`engine/anim/js/world3d.js`).

To rebuild (from an empty folder):

    npm pack three@0.187.0 && tar xzf three-0.187.0.tgz
    mkdir -p node_modules && ln -s ../package node_modules/three
    cat > entry.js <<'JS'
    export * from './package/build/three.module.js';
    export { GLTFLoader } from './package/examples/jsm/loaders/GLTFLoader.js';
    export { HDRLoader } from './package/examples/jsm/loaders/HDRLoader.js';
    export { RoomEnvironment } from './package/examples/jsm/environments/RoomEnvironment.js';
    export * as SkeletonUtils from './package/examples/jsm/utils/SkeletonUtils.js';
    export * as BufferGeometryUtils from './package/examples/jsm/utils/BufferGeometryUtils.js';
    JS
    npx esbuild@0.24.2 entry.js --bundle --format=esm --minify --legal-comments=none --outfile=three.bundle.min.js
