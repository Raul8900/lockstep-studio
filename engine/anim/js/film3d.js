'use strict';
/* =====================================================================
   film3d.js — cinematic rendering for 3D worlds: light, air, surfaces and a
   film camera, all written as shaders. Loaded after world3d.js and kit3d.js.

   A world becomes a film world when it is built with a film camera:

     const field = world3d(async (T, w) => {
       w.atmosphere({ sun: [-0.3, 0.03, -1], sunColor: [9, 3.6, 1.3], zenith: [0.02, 0.05, 0.14],
                      horizon: [0.9, 0.45, 0.3], clouds: 0.5, stars: 0.6, haze: { density: 0.004, falloff: 0.12 } });
       const asphalt = w.surface({ color: '#202124', roughness: 0.8, glsl: { pars: '…', albedo: '…', light: '…' } });
       …
     }, { film: { samples: 16, shutter: 0.5, aperture: 0.03, focus: 60, bloom: 0.06, streak: 0.5, grain: 0.04 } });

   Every frame of a film world is rendered `samples` times and averaged, in floating point:
   each sample moves the time inside the shutter (motion blur), the lens across its aperture
   (true depth of field, sharp at `focus` metres) and the pixel grid by a sub-pixel (anti-aliasing).
   Each sample gets height fog with light scattered from the sky (aerial perspective). The
   average then goes through the lens and film: bloom from every bright pixel, an anamorphic
   streak, halation, chromatic aberration, vignette, AgX tone mapping, a grade, and grain.
   A frame stays a pure function of t: every random number is seeded.

   On w (film worlds or not):
     w.atmosphere(o)   an analytic sky (sun, twilight glow, cloud deck lit from below, stars) as the
                       background, the environment light for every material, and the colour of the haze
     w.surface(o)      a physical material whose colour, roughness, relief and glow come from GLSL
                       written per video (noise library below: hash, noise, fbm, ridged, voronoi)
     w.mirror(o)       a planar reflection (a wet runway, a lake) a surface can sample
     w.lights(list)    point lights as glowing dots that stay visible however far away
     w.puffs(n, o)     soft particles (smoke, steam, dust) placed every frame
     w.lathe(profile)  a smooth body of revolution (fuselages, bottles, nacelles)
     w.wing(o)         a tapered, swept wing with a real aerofoil section (wings, fins, blades)
   Helpers: blackbody(kelvin) → linear RGB; handheld(t, amp, seed) → handheld camera offsets.
   ===================================================================== */

const GLSL = {};

/* ---------- noise: deterministic, no textures ---------- */
GLSL.noise = /* glsl */`
float hash11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float hash13(vec3 p3){ p3 = fract(p3 * 0.1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y); }
float vnoise3(vec3 p){ vec3 i = floor(p), f = fract(p); vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash13(i), hash13(i + vec3(1,0,0)), u.x), mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), u.x), u.y),
             mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), u.x), mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), u.x), u.y), u.z); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 6; i++) { s += a * vnoise(p); p = m * p; a *= 0.5; } return s; }
float fbm4(vec2 p){ float s = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = m * p; a *= 0.5; } return s; }
float fbm3(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vnoise3(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s; }
float ridged(vec2 p){ float s = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 5; i++) { s += a * (1.0 - abs(vnoise(p) * 2.0 - 1.0)); p = m * p; a *= 0.5; } return s; }
/* voronoi: x = distance to the nearest cell point, y = distance to the cell edge, z = the cell's id */
vec3 voronoi(vec2 x){ vec2 n = floor(x), f = fract(x), mg, mr; float md = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(i, j), o = hash22(n + g), r = g + o - f; float d = dot(r, r); if (d < md) { md = d; mr = r; mg = g; } }
  float me = 8.0;
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) { vec2 g = mg + vec2(i, j), o = hash22(n + g), r = g + o - f; if (dot(mr - r, mr - r) > 0.00001) me = min(me, dot(0.5 * (mr + r), normalize(r - mr))); }
  return vec3(sqrt(md), me, hash12(n + mg)); }
float luma(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
`;

/* ---------- the sky: an analytic twilight model in linear HDR ---------- */
GLSL.sky = /* glsl */`
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uGround;
uniform float uSunSize; uniform float uClouds; uniform float uCloudH; uniform float uCloudScale; uniform float uStars; uniform float uSkyT; uniform vec2 uWind;
vec3 skyBase(vec3 rd){
  float y = rd.y, h = clamp(y, 0.0, 1.0);
  vec2 hs = normalize(uSunDir.xz + 1e-5), hr = normalize(rd.xz + 1e-5);
  float az = max(dot(hr, hs), 0.0), mu = dot(rd, uSunDir);
  vec3 col = mix(uHorizon, uZenith, pow(h, 0.32));
  col *= mix(0.55, 1.0, pow(az, 0.6) * 0.6 + 0.4);                          // the sky away from the sun is deeper
  col += uSunCol * 0.03 * pow(az, 5.0) * exp(-max(y, 0.0) * 16.0);          // the twilight glow along the horizon
  col += uSunCol * 0.006 * pow(max(mu, 0.0), 24.0);                         // forward scattering (Mie)
  col += uSunCol * 0.12 * pow(max(mu, 0.0), 400.0);                         // the aureole
  float below = smoothstep(0.0, -0.06, y);
  return mix(col, uGround * (0.4 + 0.6 * az), below);
}
vec3 skyRadiance(vec3 rd){
  vec3 col = skyBase(rd);
  float mu = dot(rd, uSunDir);
  col += uSunCol * 6.0 * smoothstep(cos(uSunSize), cos(uSunSize * 0.85), mu) * smoothstep(-0.004, 0.004, rd.y);   // the disc
  float skyL = luma(col);
  if (uStars > 0.0 && rd.y > 0.0) {
    vec3 sp = rd * 420.0; vec3 cell = floor(sp); float hv = hash13(cell);
    if (hv > 0.9965) { vec3 c = cell + 0.5 + (vec3(hash13(cell + 1.3), hash13(cell + 2.7), hash13(cell + 5.1)) - 0.5) * 0.6;
      float d = length(sp - c); float tw = 0.75 + 0.25 * sin(uSkyT * (2.0 + 6.0 * hash13(cell + 9.0)) + hv * 80.0);
      col += vec3(0.8, 0.88, 1.0) * uStars * tw * smoothstep(0.55, 0.0, d) * (hv - 0.9965) * 900.0 * smoothstep(0.02, 0.35, rd.y) * smoothstep(0.03, 0.006, skyL); }
  }
  if (uClouds > 0.0 && rd.y > 0.003) {
    float t = uCloudH / rd.y; vec2 p = rd.xz * t / uCloudScale + uWind * uSkyT;
    float dist = t / uCloudH;
    float n = fbm(p * 0.5) * 0.65 + fbm(p * 1.9 + 7.0) * 0.35;
    float cover = smoothstep(1.0 - uClouds, 1.0 - uClouds + 0.32, n);
    vec2 ts = normalize(uSunDir.xz + 1e-5) * 0.25;                          // light from the low sun, through the cloud
    float n2 = fbm((p + ts) * 0.5) * 0.65 + fbm((p + ts) * 1.9 + 7.0) * 0.35;
    float thick = clamp((n2 - n) * 3.0 + 0.55, 0.0, 1.0);
    float az = max(dot(normalize(rd.xz + 1e-5), normalize(uSunDir.xz + 1e-5)), 0.0);
    float mu2 = max(dot(rd, uSunDir), 0.0);
    vec3 lit = uSunCol * (0.004 + 0.03 * pow(az, 8.0) * exp(-rd.y * 6.0) + 0.25 * pow(mu2, 24.0)) * (0.3 + 1.0 * thick);
    vec3 shade = uZenith * 0.7 + uHorizon * 0.12;
    vec3 cc = mix(shade, lit, clamp(0.25 + thick * 0.75 * (1.0 - n * 0.4), 0.0, 1.0));
    float fade = exp(-dist * 0.06) * smoothstep(0.003, 0.08, rd.y);
    col = mix(col, cc + skyBase(rd) * 0.25 * dist * 0.01, cover * fade * 0.92);
  }
  return col;
}
`;

/* ---------- fullscreen passes ---------- */
const _FS_VERT = /* glsl */`varying vec2 vUv; void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

/* the fog pass: height fog with light from the sky (aerial perspective), per sample */
const _FOG_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform sampler2D tColor; uniform sampler2D tDepth;
uniform mat4 uInvProj; uniform mat4 uCamWorld; uniform vec3 uCamPos;
uniform float uDensity; uniform float uFalloff; uniform float uFogY; uniform vec3 uTint; uniform float uSunScatter;
uniform float uMirror; uniform float uMirrorY;
${GLSL.noise}
${GLSL.sky}
void main(){
  vec4 c = texture2D(tColor, vUv);
  float z = texture2D(tDepth, vUv).x;
  if (z >= 0.999999 || uDensity <= 0.0) { gl_FragColor = c; return; }
  vec4 vp = uInvProj * vec4(vUv * 2.0 - 1.0, z * 2.0 - 1.0, 1.0); vp /= vp.w;
  vec3 wp = (uCamWorld * vp).xyz;
  vec3 cam = uCamPos;
  if (uMirror > 0.5) { wp.y = 2.0 * uMirrorY - wp.y; cam.y = 2.0 * uMirrorY - cam.y; }
  vec3 d = wp - cam; float dist = length(d); vec3 rd = d / max(dist, 1e-4);
  float b = uFalloff, h0 = cam.y - uFogY;
  float k = abs(rd.y * b) > 1e-4 ? (1.0 - exp(-dist * rd.y * b)) / (rd.y * b) : dist;
  float od = uDensity * exp(-h0 * b) * k;
  float trans = exp(-max(od, 0.0));
  vec3 sd = normalize(vec3(rd.x, max(rd.y, 0.0) * 0.6 + 0.03, rd.z));
  vec3 ins = skyBase(sd) * uTint;
  ins += uSunCol * uSunScatter * pow(max(dot(rd, uSunDir), 0.0), 8.0);
  gl_FragColor = vec4(c.rgb * trans + ins * (1.0 - trans), c.a);
}`;

/* accumulation: add one sample, weighted */
const _ACC_FRAG = /* glsl */`
varying vec2 vUv; uniform sampler2D tIn; uniform float uW;
void main(){ vec3 c = texture2D(tIn, vUv).rgb; c = min(c, vec3(4000.0)); gl_FragColor = vec4(c * uW, uW); }`;

/* bloom: 13-tap downsample (the first one keeps everything, softly thresholded) and a tent upsample */
const _DOWN_FRAG = /* glsl */`
varying vec2 vUv; uniform sampler2D tIn; uniform vec2 uTexel; uniform float uPre; uniform float uThresh; uniform float uKnee;
vec3 s(vec2 o){ return texture2D(tIn, vUv + o * uTexel).rgb; }
void main(){
  vec3 a = s(vec2(-2, 2)), b = s(vec2(0, 2)), c = s(vec2(2, 2)), d = s(vec2(-2, 0)), e = s(vec2(0, 0)), f = s(vec2(2, 0)), g = s(vec2(-2, -2)), h = s(vec2(0, -2)), i = s(vec2(2, -2));
  vec3 j = s(vec2(-1, 1)), k = s(vec2(1, 1)), l = s(vec2(-1, -1)), m = s(vec2(1, -1));
  vec3 col = e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125;
  if (uPre > 0.5) {
    col = min(col, vec3(600.0));
    float br = max(col.r, max(col.g, col.b));
    float rq = clamp(br - uThresh + uKnee, 0.0, 2.0 * uKnee); rq = rq * rq / (4.0 * uKnee + 1e-5);
    col *= max(rq, br - uThresh) / max(br, 1e-5);
  }
  gl_FragColor = vec4(col, 1.0);
}`;
const _UP_FRAG = /* glsl */`
varying vec2 vUv; uniform sampler2D tIn; uniform vec2 uTexel; uniform float uR; uniform float uW;
vec3 s(vec2 o){ return texture2D(tIn, vUv + o * uTexel * uR).rgb; }
void main(){
  vec3 col = s(vec2(0, 0)) * 4.0 + (s(vec2(-1, 0)) + s(vec2(1, 0)) + s(vec2(0, -1)) + s(vec2(0, 1))) * 2.0 + s(vec2(-1, -1)) + s(vec2(1, -1)) + s(vec2(-1, 1)) + s(vec2(1, 1));
  gl_FragColor = vec4(col / 16.0 * uW, 1.0);                // each wider level is added at a lower weight: tight glow, faint veil
}`;
/* the anamorphic streak: a horizontal blur that widens each pass */
const _STREAK_FRAG = /* glsl */`
varying vec2 vUv; uniform sampler2D tIn; uniform vec2 uTexel; uniform float uStep; uniform float uFalloff;
void main(){
  vec3 col = vec3(0.0); float wsum = 0.0;
  for (int i = -3; i <= 3; i++) { float w = pow(uFalloff, abs(float(i))); col += texture2D(tIn, vUv + vec2(float(i) * uStep * uTexel.x, 0.0)).rgb * w; wsum += w; }
  gl_FragColor = vec4(col / wsum, 1.0);
}`;

/* the lens and the film: everything after the light has been averaged */
const _FINAL_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform sampler2D tAcc; uniform sampler2D tBloom; uniform sampler2D tStreak;
uniform float uBloom; uniform float uBloomNorm; uniform float uStreak; uniform vec3 uStreakTint; uniform float uHalation;
uniform float uExposure; uniform float uVig; uniform float uAberr; uniform float uGrain; uniform float uSeed; uniform vec2 uRes;
uniform float uSat; uniform float uContrast; uniform vec3 uLift; uniform vec3 uGamma; uniform vec3 uGain; uniform float uToe;
uniform float uFlare; uniform vec2 uFlarePos; uniform vec3 uFlareCol;
${GLSL.noise}
const mat3 SRGB_2020 = mat3(0.6274, 0.0691, 0.0164, 0.3293, 0.9195, 0.0880, 0.0433, 0.0113, 0.8956);
const mat3 R2020_SRGB = mat3(1.6605, -0.1246, -0.0182, -0.5876, 1.1329, -0.1006, -0.0728, -0.0083, 1.1187);
const mat3 AGX_IN = mat3(0.856627153315983, 0.137318972929847, 0.11189821299995, 0.0951212405381588, 0.761241990602591, 0.0767994186031903, 0.0482516061458583, 0.101439036467562, 0.811302368396859);
const mat3 AGX_OUT = mat3(1.1271005818144368, -0.1413297634984383, -0.14132976349843826, -0.11060664309660323, 1.157823702216272, -0.11060664309660294, -0.016493938717834573, -0.016493938717834257, 1.2519364065950405);
vec3 agxCurve(vec3 x){ vec3 x2 = x * x, x4 = x2 * x2; return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232; }
vec3 agx(vec3 c){
  c = SRGB_2020 * c; c = AGX_IN * c; c = max(c, 1e-10); c = log2(c);
  c = (c + 12.47393) / (4.026069 + 12.47393); c = clamp(c, 0.0, 1.0);
  c = agxCurve(c); c = AGX_OUT * c; c = pow(max(c, 0.0), vec3(2.2)); c = R2020_SRGB * c;
  return clamp(c, 0.0, 1.0);
}
vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
void main(){
  vec2 d = vUv - 0.5;
  vec2 ab = d * uAberr * length(d) * 2.0;
  vec3 c = vec3(texture2D(tAcc, vUv - ab).r, texture2D(tAcc, vUv).g, texture2D(tAcc, vUv + ab).b);
  vec3 bl = texture2D(tBloom, vUv).rgb * uBloomNorm;        // the weighted sum of seven levels, normalised
  c += bl * uBloom;
  c += bl * vec3(1.0, 0.32, 0.12) * uHalation;
  c += texture2D(tStreak, vUv).rgb * uStreakTint * uStreak;
  if (uFlare > 0.0) {                                                      // ghosts of the brightest light, mirrored through the centre
    vec2 fp = uFlarePos - 0.5;
    for (int i = 1; i <= 4; i++) { float k = -0.35 * float(i); vec2 g = 0.5 + fp * k; float r = 0.012 + 0.018 * float(i);
      float dd = length((vUv - g) * vec2(uRes.x / uRes.y, 1.0)); c += uFlareCol * uFlare * smoothstep(r, r * 0.55, dd) * (0.25 / float(i)); }
  }
  c *= uExposure;
  float v = length(d * vec2(uRes.x / uRes.y, 1.0) * 1.25);
  c *= mix(1.0, smoothstep(1.05, 0.15, v), uVig);
  c = agx(c);
  c = pow(max(c, 0.0), 1.0 / uGamma);
  c = c * uGain + uLift * (1.0 - c);
  float L = luma(c);
  c = mix(vec3(L), c, uSat);
  c = toSRGB(c);
  c = mix(c, smoothstep(0.0, 1.0, c), uContrast - 1.0);
  c = max(c - uToe * (1.0 - smoothstep(0.0, 0.25, c)) * 0.04, 0.0);
  vec2 px = vUv * uRes;
  float g = (hash12(px + uSeed * 37.1) + hash12(px * 1.37 + uSeed * 11.7) + hash12(px.yx + uSeed * 3.3)) / 3.0 - 0.5;
  float gl = luma(c);
  c += g * uGrain * (0.55 + 1.6 * gl * (1.0 - gl));
  c += (hash12(px + uSeed) - 0.5) / 255.0;
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

/* ---------- light and colour helpers (JS) ---------- */
/* the colour of a hot body (a glowing brake disc, a filament) at kelvin, as linear RGB with the
   brightest channel 1 — scale it for intensity */
function blackbody(K) {
  const t = K / 100;
  let r, g, b;
  if (t <= 66) { r = 255; g = 99.4708025861 * Math.log(t) - 161.1195681661; b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307; }
  else { r = 329.698727446 * Math.pow(t - 60, -0.1332047592); g = 288.1221695283 * Math.pow(t - 60, -0.0755148492); b = 255; }
  const lin = (v) => { v = Math.max(0, Math.min(255, v)) / 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const c = [lin(r), lin(g), lin(b)], m = Math.max(c[0], c[1], c[2], 1e-6);
  return [c[0] / m, c[1] / m, c[2] / m];
}
/* smooth 1D value noise for the camera (seeded, deterministic) */
function _n1(x, seed) {
  const h = (i) => { const s = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453; return s - Math.floor(s); };
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return h(i) * (1 - u) + h(i + 1) * u;
}
/* handheld camera: offsets [dx, dy, dz] for the camera's target, amp metres, freq Hz */
function handheld(t, amp = 0.05, seed = 1, freq = 0.9) {
  const f = (k) => (_n1(t * freq + k * 13.1, seed + k) - 0.5) * 2 + (_n1(t * freq * 2.7 + k * 7.7, seed + k + 9) - 0.5) * 0.6;
  return [f(1) * amp, f(2) * amp * 0.8, f(3) * amp * 0.5];
}
const _halton = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };

/* ---------- the kit additions, merged into w by world3d.js ---------- */
function film3d(T, w, world) {
  const scene = w.scene;
  const col3 = (c) => (Array.isArray(c) ? new T.Vector3(c[0], c[1], c[2]) : (() => { const x = new T.Color(COL[c] || c); return new T.Vector3(x.r, x.g, x.b); })());
  world.prePasses = world.prePasses || [];
  world.procMats = world.procMats || [];

  const api = {
    /* the camera: o as world3d's film option */
    film(o = {}) { world.o.film = Object.assign({}, world.o.film || {}, o); },

    /* an analytic sky: background, image-based light and the colour of the haze.
       o.sun: direction to the sun; o.sunColor (HDR, linear), o.zenith, o.horizon, o.ground (linear RGB);
       o.sunSize (radians), o.clouds (0..1 cover), o.cloudHeight (m), o.cloudScale, o.wind [x, z] per s,
       o.stars (0..1), o.haze { density, falloff, y, tint, sunScatter }, o.env (environment light strength) */
    async atmosphere(o = {}) {
      const sd = new T.Vector3(...(o.sun || [-0.3, 0.05, -1])).normalize();
      const U = {
        uSunDir: { value: sd }, uSunCol: { value: col3(o.sunColor || [9, 4, 1.6]) },
        uZenith: { value: col3(o.zenith || [0.02, 0.05, 0.14]) }, uHorizon: { value: col3(o.horizon || [0.8, 0.45, 0.32]) }, uGround: { value: col3(o.ground || [0.03, 0.03, 0.035]) },
        uSunSize: { value: o.sunSize || 0.012 }, uClouds: { value: o.clouds == null ? 0.4 : o.clouds }, uCloudH: { value: o.cloudHeight || 2200 },
        uCloudScale: { value: o.cloudScale || 900 }, uStars: { value: o.stars || 0 }, uSkyT: { value: 0 }, uWind: { value: new T.Vector2(...(o.wind || [0.004, 0.001])) },
      };
      world.sky = U;
      const mat = new T.ShaderMaterial({
        uniforms: U, side: T.BackSide, depthWrite: false, depthTest: false,
        vertexShader: `varying vec3 vDir; void main(){ vDir = normalize((modelMatrix * vec4(position, 0.0)).xyz); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
        fragmentShader: `precision highp float; varying vec3 vDir; ${GLSL.noise} ${GLSL.sky} void main(){ gl_FragColor = vec4(skyRadiance(normalize(vDir)), 1.0); }`,
      });
      const dome = new T.Mesh(new T.SphereGeometry(1, 64, 32), mat);
      dome.scale.setScalar(1000); dome.renderOrder = -1000; dome.frustumCulled = false;
      dome.onBeforeRender = (r, s, cam) => { dome.position.copy(cam.position); dome.updateMatrixWorld(); };
      scene.add(dome);
      world.opaque = true;
      /* the same sky lights every material: rendered once into a cube and prefiltered */
      const envScene = new T.Scene(); const envDome = new T.Mesh(new T.SphereGeometry(1, 64, 32), mat.clone());
      envDome.material.uniforms = Object.assign({}, U, { uSunSize: { value: Math.max(0.05, U.uSunSize.value * 4) }, uStars: { value: 0 } });
      envDome.scale.setScalar(100); envScene.add(envDome);
      scene.environment = _3.pmrem.fromScene(envScene, 0.0, 0.1, 400).texture;
      scene.environmentIntensity = o.env == null ? 1 : o.env;
      world.haze = Object.assign({ density: 0.0, falloff: 0.1, y: 0, tint: [1, 1, 1], sunScatter: 0.02 }, o.haze || {});
      return { dome, uniforms: U, sunDir: sd };
    },

    /* a physical material whose look is written in GLSL. o: color, roughness, metalness, clearcoat …
       (MeshPhysicalMaterial settings), uniforms {name: {value}}, bump (relief strength), and glsl:
         pars    declarations and functions
         albedo  sets vec3 base / float rough / float metal / float h (relief, metres) / vec3 emit /
                 float wet, from vec3 P (world position), vec3 L (object position), vec2 UV, vec3 N (world normal)
         light   runs after lighting: may change vec3 outgoingLight (with base, P, N, V = to the camera)
       uniform float uT is the time; the noise and sky libraries are available. */
    surface(o = {}) {
      const g = o.glsl || {};
      const uniforms = Object.assign({ uT: { value: 0 } }, o.uniforms || {});
      const mo = Object.assign({ color: 0xffffff, roughness: 0.5, metalness: 0 }, o);
      delete mo.glsl; delete mo.uniforms; delete mo.bump; delete mo.key;
      if (mo.color != null && !(mo.color instanceof T.Color)) mo.color = new T.Color(COL[mo.color] || mo.color);
      const m = new T.MeshPhysicalMaterial(mo);
      const bump = o.bump == null ? 1 : o.bump;
      const key = 'surf:' + (o.key || (g.pars || '') + (g.albedo || '') + (g.light || '')).length + ':' + _strHash((g.pars || '') + (g.albedo || '') + (g.light || ''));
      m.customProgramCacheKey = () => key;
      m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, uniforms);
        if (world.sky) Object.assign(sh.uniforms, world.sky);
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vPW; varying vec3 vPL; varying vec3 vPN; varying vec2 vPUv;')
          .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n{ vec4 pw = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\n pw = instanceMatrix * pw;\n#endif\n vPW = (modelMatrix * pw).xyz; vPL = position; vPN = normalize(mat3(modelMatrix) * objectNormal); vPUv = uv; }');
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', `#include <common>
varying vec3 vPW; varying vec3 vPL; varying vec3 vPN; varying vec2 vPUv;
uniform float uT;
${Object.keys(o.uniforms || {}).map((k) => `uniform ${_glslType(o.uniforms[k].value, T)} ${k};`).join('\n')}
${world.sky ? GLSL.noise + GLSL.sky : GLSL.noise}
${g.pars || ''}
float _pRough; float _pMetal; float _pH; vec3 _pEmit; float _pWet;
vec3 pPerturb(vec3 sp, vec3 sn, float h, float fd){ vec3 sx = dFdx(sp), sy = dFdy(sp); vec3 r1 = cross(sy, sn), r2 = cross(sn, sx); float det = dot(sx, r1) * fd;
  vec2 dh = vec2(dFdx(h), dFdy(h)); vec3 grad = sign(det) * (dh.x * r1 + dh.y * r2); return normalize(abs(det) * sn - grad); }`)
          .replace('#include <map_fragment>', `#include <map_fragment>
{ vec3 P = vPW; vec3 L = vPL; vec2 UV = vPUv; vec3 N = normalize(vPN); vec3 base = diffuseColor.rgb; float rough = roughness; float metal = metalness; float h = 0.0; vec3 emit = vec3(0.0); float wet = 0.0;
${g.albedo || ''}
diffuseColor.rgb = base; _pRough = rough; _pMetal = metal; _pH = h; _pEmit = emit; _pWet = wet; }`)
          .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = clamp(_pRough, 0.02, 1.0);')
          .replace('#include <metalnessmap_fragment>', 'float metalnessFactor = clamp(_pMetal, 0.0, 1.0);')
          .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\nnormal = pPerturb(-vViewPosition, normal, _pH * ${(+bump).toFixed(4)}, faceDirection);`)
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += _pEmit;')
          .replace('#include <opaque_fragment>', `{ vec3 P = vPW; vec3 N = normal; vec3 V = normalize(cameraPosition - vPW); vec3 base = diffuseColor.rgb; float wet = _pWet;\n${g.light || ''}\n}\n#include <opaque_fragment>`);
      };
      m.uniforms = uniforms;
      world.procMats.push(m);
      return m;
    },

    /* a planar reflection of the world in the plane y (a wet runway, still water). A surface reads it
       with the GLSL function mirror(P, N, rough) → linear HDR colour (put mirror.glsl in its pars and
       mirror.uniforms in its uniforms). o.y, o.res (fraction of the frame, 0.5) */
    mirror(o = {}) {
      const y0 = o.y || 0, res = o.res || 0.5;
      const rw = Math.round(W * res), rh = Math.round(H * res);
      const mk = () => new T.WebGLRenderTarget(rw, rh, { type: T.HalfFloatType, depthTexture: new T.DepthTexture(rw, rh) });
      const rt = mk(), rtF = new T.WebGLRenderTarget(rw, rh, { type: T.HalfFloatType });
      const vcam = new T.PerspectiveCamera(40, W / H, 0.2, 6000);
      const U = { tMirror: { value: rtF.texture }, uMirrorMat: { value: new T.Matrix4() }, uMirrorTexel: { value: new T.Vector2(1 / rw, 1 / rh) } };
      const plane = new T.Plane(new T.Vector3(0, 1, 0), -y0 + 0.005);
      const hidden = [];
      const h = {
        uniforms: U, hide(obj) { hidden.push(obj); return h; },
        glsl: /* glsl */`
vec3 mirror(vec3 P, vec3 N, float rough){
  vec4 rp = uMirrorMat * vec4(P, 1.0); vec2 uv = rp.xy / rp.w * 0.5 + 0.5;
  uv += N.xz * vec2(0.6, 1.0) * 0.08;
  float r = 1.5 + rough * 48.0; vec3 c = vec3(0.0); float ws = 0.0;
  for (int i = 0; i < 12; i++) { float a = float(i) * 2.39996, rr = sqrt((float(i) + 0.5) / 12.0);
    vec2 o = vec2(cos(a), sin(a)) * rr * r * uMirrorTexel * vec2(0.7, 5.0); float w = 1.0 - rr * 0.5;
    c += texture2D(tMirror, clamp(uv + o, 0.001, 0.999)).rgb * w; ws += w; }
  return c / ws;
}`,
      };
      world.prePasses.push((r, cam, t, film) => {
        cam.updateMatrixWorld();
        const p = cam.position, dir = new T.Vector3(); cam.getWorldDirection(dir);
        const tgt = p.clone().add(dir.multiplyScalar(50));
        vcam.position.set(p.x, 2 * y0 - p.y, p.z);
        vcam.up.set(0, 1, 0); vcam.lookAt(tgt.x, 2 * y0 - tgt.y, tgt.z);
        vcam.fov = Math.min(170, cam.fov * 1.2); vcam.aspect = cam.aspect; vcam.near = cam.near; vcam.far = cam.far; vcam.updateProjectionMatrix(); vcam.updateMatrixWorld();
        U.uMirrorMat.value.multiplyMatrices(vcam.projectionMatrix, vcam.matrixWorldInverse);
        const vis = hidden.map((x) => x.visible); hidden.forEach((x) => { x.visible = false; });
        const cp = r.clippingPlanes; r.clippingPlanes = [plane];
        r.setRenderTarget(rt); r.clear(); r.render(scene, vcam);
        r.clippingPlanes = cp; hidden.forEach((x, i) => { x.visible = vis[i]; });
        film.fog(rt, vcam, rtF, { mirror: true, y: y0 });
      });
      return h;
    },

    /* glowing point lights that stay visible at any distance: list of { at: [x, y, z], color: [r, g, b]
       (linear HDR), size (m), blink: { period, on, phase } }. Returns the Points object; its .set(i, …)
       moves one. o.min: smallest size in pixels */
    lights(list, o = {}) {
      const n = list.length, pos = new Float32Array(n * 3), colr = new Float32Array(n * 3), size = new Float32Array(n), blink = new Float32Array(n * 3);
      list.forEach((l, i) => { pos.set(l.at, i * 3); colr.set(l.color || [20, 20, 20], i * 3); size[i] = l.size || 0.2; const b = l.blink; blink.set(b ? [b.period, b.on, b.phase || 0] : [0, 0, 0], i * 3); });
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aColor', new T.BufferAttribute(colr, 3));
      g.setAttribute('aSize', new T.BufferAttribute(size, 1)); g.setAttribute('aBlink', new T.BufferAttribute(blink, 3));
      const U = { uPx: { value: 1000 }, uMin: { value: o.min || 2.2 }, uT: { value: 0 }, uGain: { value: o.gain || 1 } };
      const m = new T.ShaderMaterial({
        uniforms: U, transparent: true, depthWrite: false, blending: T.CustomBlending, blendSrc: T.OneFactor, blendDst: T.OneFactor,
        vertexShader: /* glsl */`
attribute vec3 aColor; attribute float aSize; attribute vec3 aBlink; uniform float uPx; uniform float uMin; uniform float uT; uniform float uGain; varying vec3 vC;
void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); float d = max(-mv.z, 0.01); float px = aSize * uPx / d; float ps = max(px, uMin);
  float on = 1.0; if (aBlink.x > 0.0) { float ph = mod(uT + aBlink.z, aBlink.x); on = ph < aBlink.y ? 1.0 : 0.0; }
  vC = aColor * uGain * on * (px * px) / (ps * ps); gl_PointSize = ps * 2.6; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */`varying vec3 vC; void main(){ vec2 p = gl_PointCoord * 2.0 - 1.0; float r2 = dot(p, p); if (r2 > 1.0) discard;
  float a = exp(-r2 * 7.0) * 2.2 + exp(-r2 * 2.2) * 0.12; gl_FragColor = vec4(vC * a, 1.0); }`,
      });
      const pts = new T.Points(g, m); pts.frustumCulled = false;
      pts.onBeforeRender = (r, s, cam) => { U.uPx.value = H / (2 * Math.tan((cam.fov || 40) * Math.PI / 360)); };
      pts.set = (i, at, c) => { if (at) { pos.set(at, i * 3); g.attributes.position.needsUpdate = true; } if (c) { colr.set(c, i * 3); g.attributes.aColor.needsUpdate = true; } };
      pts.uniforms = U;
      world.procMats.push(m);
      scene.add(pts);
      return pts;
    },

    /* soft particles: n puffs, placed every frame with puffs.set(i, [x, y, z], size, alpha, seed) then
       puffs.commit(). o.lit / o.shade: linear colours of the lit and the shaded side; o.light: direction
       the light comes from; o.glow (linear colour added by a light behind the smoke) */
    puffs(n, o = {}) {
      const base = new T.PlaneGeometry(1, 1);
      const g = new T.InstancedBufferGeometry(); g.index = base.index; g.attributes.position = base.attributes.position; g.attributes.uv = base.attributes.uv;
      const ctr = new Float32Array(n * 3), prm = new Float32Array(n * 4);
      g.setAttribute('aCtr', new T.InstancedBufferAttribute(ctr, 3)); g.setAttribute('aPrm', new T.InstancedBufferAttribute(prm, 4));
      g.instanceCount = n;
      const U = { uLit: { value: col3(o.lit || [0.6, 0.55, 0.5]) }, uShade: { value: col3(o.shade || [0.08, 0.08, 0.1]) }, uLight: { value: new T.Vector3(...(o.light || [0, 1, 0])).normalize() }, uGlow: { value: col3(o.glow || [0, 0, 0]) }, uT: { value: 0 } };
      const m = new T.ShaderMaterial({
        uniforms: U, transparent: true, depthWrite: false, blending: T.CustomBlending, blendSrc: T.OneFactor, blendDst: T.OneMinusSrcAlphaFactor,
        vertexShader: /* glsl */`
attribute vec3 aCtr; attribute vec4 aPrm; varying vec2 vQ; varying vec4 vP; varying vec3 vR; varying vec3 vU;
void main(){ vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]); vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  float a = aPrm.w * 6.2831; mat2 R = mat2(cos(a), sin(a), -sin(a), cos(a)); vec2 q = R * position.xy;
  vec3 wp = aCtr + (right * q.x + up * q.y) * aPrm.x; vQ = position.xy * 2.0; vP = aPrm; vR = right; vU = up;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0); if (aPrm.y <= 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0); }`,
        fragmentShader: /* glsl */`
precision highp float; varying vec2 vQ; varying vec4 vP; varying vec3 vR; varying vec3 vU; uniform vec3 uLit; uniform vec3 uShade; uniform vec3 uLight; uniform vec3 uGlow; uniform float uT;
${GLSL.noise}
void main(){ float r = length(vQ); if (r > 1.0) discard;
  vec2 p = vQ * 1.6 + vP.z * 31.7;
  float n = fbm4(p + vec2(uT * 0.15, -uT * 0.25)) ;
  float den = smoothstep(1.0, 0.15, r) * smoothstep(0.18, 0.65, n + 0.25 * (1.0 - r));
  float a = clamp(den * vP.y, 0.0, 1.0);
  vec3 nrm = normalize(vR * vQ.x + vU * vQ.y + vec3(0.0, 0.0, 0.0) + normalize(cross(vR, vU)) * sqrt(max(0.0, 1.0 - r * r)));
  float lit = clamp(dot(nrm, uLight) * 0.5 + 0.5, 0.0, 1.0) * (0.6 + 0.4 * n);
  vec3 c = mix(uShade, uLit, lit) + uGlow * (1.0 - den) * 1.5;
  gl_FragColor = vec4(c * a, a); }`,
      });
      const mesh = new T.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 10;
      mesh.set = (i, at, s, alpha, seed = i * 0.137) => { ctr.set(at, i * 3); prm.set([Math.max(0.0001, s), alpha, seed, seed * 3.1], i * 4); };
      mesh.commit = () => { g.attributes.aCtr.needsUpdate = true; g.attributes.aPrm.needsUpdate = true; };
      mesh.uniforms = U;
      world.procMats.push(m);
      scene.add(mesh);
      return mesh;
    },

    /* a smooth body of revolution about the z axis: profile [[z, r], …] from one end to the other;
       o.segments, o.sag(z) → a vertical offset at z (a tail that sweeps up), o.squash (height/width) */
    lathe(profile, o = {}) {
      const pts = []; const N = o.samples || 160;
      const curve = new T.SplineCurve(profile.map((p) => new T.Vector2(p[1], p[0])));
      for (let i = 0; i <= N; i++) { const v = curve.getPoint(i / N); pts.push(new T.Vector2(Math.max(0, v.x), v.y)); }
      const geo = new T.LatheGeometry(pts, o.segments || 96);
      geo.rotateX(Math.PI / 2);                     // the axis along z
      const pa = geo.attributes.position, sq = o.squash || 1;
      for (let i = 0; i < pa.count; i++) {
        const z = pa.getZ(i); let y = pa.getY(i) * sq;
        if (o.sag) y += o.sag(z);
        pa.setY(i, y);
      }
      geo.computeVertexNormals();
      return geo;
    },

    /* a wing (or fin, or blade) along +x from its root: o.span, o.root / o.tip (chord, m), o.sweep
       (leading-edge sweep, radians), o.dihedral (radians), o.thick (thickness / chord, 0.12),
       o.camber (0.02), o.twist (tip washout, radians); built in the xz plane, chord along +z
       (leading edge at z = 0 at the root) */
    wing(o = {}) {
      const span = o.span || 10, root = o.root || 4, tip = o.tip || 1.2, sweep = o.sweep || 0.4, dih = o.dihedral || 0, th = o.thick || 0.12, cam = o.camber == null ? 0.02 : o.camber, tw = o.twist || 0;
      const NS = o.spanSegs || 24, NC = o.chordSegs || 40;
      const af = (x) => { // NACA 4-digit, x 0..1: [upper, lower] y / chord
        const yt = 5 * th * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4);
        const p = 0.4, yc = x < p ? cam / (p * p) * (2 * p * x - x * x) : cam / ((1 - p) ** 2) * ((1 - 2 * p) + 2 * p * x - x * x);
        return [yc + yt, yc - yt];
      };
      const pos = [], idx = [], uv = [];
      for (let s = 0; s <= NS; s++) {
        const u = s / NS, x = u * span, c = root + (tip - root) * u, le = Math.tan(sweep) * x, yOff = Math.tan(dih) * x, a = -tw * u;
        for (let k = 0; k <= NC * 2; k++) {
          const side = k <= NC ? 0 : 1, kk = k <= NC ? NC - k : k - NC;
          const xc = 0.5 - 0.5 * Math.cos(Math.PI * kk / NC);
          const yy = af(xc)[side] * c, zz = xc * c;
          const zr = zz * Math.cos(a) - yy * Math.sin(a), yr = zz * Math.sin(a) + yy * Math.cos(a);
          pos.push(x, yOff + yr, -(le + zr)); uv.push(u, k / (NC * 2));
        }
      }
      const row = NC * 2 + 1;
      for (let s = 0; s < NS; s++) for (let k = 0; k < NC * 2; k++) { const a = s * row + k, b = a + row; idx.push(a, a + 1, b, b, a + 1, b + 1); }
      /* the tip cap */
      const tipBase = NS * row;
      for (let k = 1; k < NC; k++) { const up = tipBase + (NC - k), lo = tipBase + (NC + k), up2 = tipBase + (NC - k - 1), lo2 = tipBase + (NC + k + 1); idx.push(up, lo, up2, up2, lo, lo2); }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      g.computeVertexNormals();
      if (o.mirror) g.scale(-1, 1, 1);
      if (o.mirror) { const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const t0 = ix[i]; ix[i] = ix[i + 1]; ix[i + 1] = t0; } g.computeVertexNormals(); }
      return g;
    },
  };
  return api;
}
function _strHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
function _glslType(v, T) {
  if (typeof v === 'number') return 'float';
  if (v && v.isVector2) return 'vec2'; if (v && v.isVector3) return 'vec3'; if (v && v.isVector4) return 'vec4'; if (v && v.isColor) return 'vec3';
  if (v && v.isMatrix4) return 'mat4'; if (v && v.isTexture) return 'sampler2D';
  if (Array.isArray(v)) return ['float', 'float', 'vec2', 'vec3', 'vec4'][v.length] || 'float';
  return 'float';
}

/* ---------- the film pipeline ---------- */
const _F = { ready: false };
const FILM_DEFAULTS = {
  samples: 12, shutter: 0.5, aperture: 0, focus: 20, exposure: 1,
  bloom: 0.8, threshold: 1.2, knee: 0.6, bloomRadius: 1, bloomScatter: 0.7, halation: 0.04, streak: 0, streakTint: [0.55, 0.7, 1.0], streakThreshold: 3,
  vignette: 0.35, aberration: 0.004, grain: 0.035, saturation: 1.0, contrast: 1.0, lift: [0, 0, 0], gamma: [1, 1, 1], gain: [1, 1, 1], toe: 0,
  flare: 0, flareColor: [1, 0.6, 0.35], near: 0.25, far: 6000, jitter: 1,
};

function _filmInit() {
  const T = T3, r = _3.renderer;
  const fsGeo = new T.BufferGeometry();
  fsGeo.setAttribute('position', new T.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const quad = new T.Mesh(fsGeo, null); quad.frustumCulled = false;
  const qs = new T.Scene(); qs.add(quad);
  const qc = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const mat = (frag, U, extra = {}) => new T.ShaderMaterial(Object.assign({ uniforms: U, vertexShader: _FS_VERT, fragmentShader: frag, depthTest: false, depthWrite: false }, extra));
  const rt = (w, h, o = {}) => new T.WebGLRenderTarget(w, h, Object.assign({ type: T.HalfFloatType, minFilter: T.LinearFilter, magFilter: T.LinearFilter }, o));
  const F = _F;
  /* a full-screen pass; clear = false adds on top (accumulation, bloom upsample), so the renderer's own
     autoClear has to be held off for it */
  F.pass = (m, target, clear = true) => { quad.material = m; r.setRenderTarget(target); if (clear) r.clear(); const ac = r.autoClear; r.autoClear = false; r.render(qs, qc); r.autoClear = ac; };
  F.scene = rt(W, H, { depthTexture: new T.DepthTexture(W, H), samples: 0 });
  F.fogged = rt(W, H);
  F.acc = rt(W, H);
  F.levels = []; { let w = W, h = H; for (let i = 0; i < 7; i++) { w = Math.max(2, Math.round(w / 2)); h = Math.max(2, Math.round(h / 2)); F.levels.push(rt(w, h)); } }
  F.sA = rt(Math.round(W / 4), Math.round(H / 4)); F.sB = rt(Math.round(W / 4), Math.round(H / 4));
  F.fogMat = mat(_FOG_FRAG, {
    tColor: { value: null }, tDepth: { value: null }, uInvProj: { value: new T.Matrix4() }, uCamWorld: { value: new T.Matrix4() }, uCamPos: { value: new T.Vector3() },
    uDensity: { value: 0 }, uFalloff: { value: 0.1 }, uFogY: { value: 0 }, uTint: { value: new T.Vector3(1, 1, 1) }, uSunScatter: { value: 0.02 }, uMirror: { value: 0 }, uMirrorY: { value: 0 },
    uSunDir: { value: new T.Vector3(0, 1, 0) }, uSunCol: { value: new T.Vector3() }, uZenith: { value: new T.Vector3() }, uHorizon: { value: new T.Vector3() }, uGround: { value: new T.Vector3() },
    uSunSize: { value: 0.01 }, uClouds: { value: 0 }, uCloudH: { value: 2000 }, uCloudScale: { value: 900 }, uStars: { value: 0 }, uSkyT: { value: 0 }, uWind: { value: new T.Vector2() },
  });
  F.accMat = mat(_ACC_FRAG, { tIn: { value: null }, uW: { value: 1 } }, { blending: T.CustomBlending, blendSrc: T.OneFactor, blendDst: T.OneFactor, blendEquation: T.AddEquation, transparent: true });
  F.downMat = mat(_DOWN_FRAG, { tIn: { value: null }, uTexel: { value: new T.Vector2() }, uPre: { value: 0 }, uThresh: { value: 0 }, uKnee: { value: 1 } });
  F.upMat = mat(_UP_FRAG, { tIn: { value: null }, uTexel: { value: new T.Vector2() }, uR: { value: 1 }, uW: { value: 1 } }, { blending: T.CustomBlending, blendSrc: T.OneFactor, blendDst: T.OneFactor, transparent: true });
  F.streakMat = mat(_STREAK_FRAG, { tIn: { value: null }, uTexel: { value: new T.Vector2() }, uStep: { value: 1 }, uFalloff: { value: 0.85 } });
  F.finalMat = mat(_FINAL_FRAG, {
    tAcc: { value: F.acc.texture }, tBloom: { value: F.levels[0].texture }, tStreak: { value: F.sA.texture },
    uBloom: { value: 0.05 }, uBloomNorm: { value: 1 / 7 }, uStreak: { value: 0 }, uStreakTint: { value: new T.Vector3(0.55, 0.7, 1) }, uHalation: { value: 0 },
    uExposure: { value: 1 }, uVig: { value: 0.3 }, uAberr: { value: 0.003 }, uGrain: { value: 0.03 }, uSeed: { value: 0 }, uRes: { value: new T.Vector2(W, H) },
    uSat: { value: 1 }, uContrast: { value: 1 }, uLift: { value: new T.Vector3() }, uGamma: { value: new T.Vector3(1, 1, 1) }, uGain: { value: new T.Vector3(1, 1, 1) }, uToe: { value: 0 },
    uFlare: { value: 0 }, uFlarePos: { value: new T.Vector2(0.5, 0.5) }, uFlareCol: { value: new T.Vector3(1, 0.6, 0.35) },
  });
  F.fog = (src, cam, dst, mo = {}) => {
    const U = F.fogMat.uniforms, wld = F.world;
    U.tColor.value = src.texture; U.tDepth.value = src.depthTexture;
    U.uInvProj.value.copy(cam.projectionMatrixInverse); U.uCamWorld.value.copy(cam.matrixWorld); U.uCamPos.value.copy(cam.position);
    const hz = Object.assign({ density: 0 }, (wld && wld.haze) || {}, (window.FILM_OVERRIDE || {}).haze || {});
    U.uDensity.value = hz.density || 0; U.uFalloff.value = hz.falloff || 0.1; U.uFogY.value = hz.y || 0; U.uTint.value.set(...(hz.tint || [1, 1, 1])); U.uSunScatter.value = hz.sunScatter == null ? 0.02 : hz.sunScatter;
    U.uMirror.value = mo.mirror ? 1 : 0; U.uMirrorY.value = mo.y || 0;
    if (wld && wld.sky) for (const k of Object.keys(wld.sky)) if (U[k]) U[k].value = wld.sky[k].value;
    F.pass(F.fogMat, dst);
  };
  F.ready = true;
}

/* render world w at time t through the film camera into ctx. cam: an object as view3d takes, or a
   function of time returning one (so the camera moves inside the shutter too) */
function filmRender(ctx, w, t, cam, o = {}) {
  const T = T3, r = _3.renderer;
  if (!_F.ready) _filmInit();
  const F = _F; F.world = w;
  const fo = Object.assign({}, FILM_DEFAULTS, w.o.film === true ? {} : w.o.film, o.film || {}, window.FILM_OVERRIDE || {});
  const N = Math.max(1, Math.round(window.FILM_SAMPLES || fo.samples));
  const c = w.camera, camAt = typeof cam === 'function' ? cam : () => cam;
  const prevTM = r.toneMapping; r.toneMapping = T.NoToneMapping;
  r.setClearColor(0x000000, 1);
  r.setRenderTarget(F.acc); r.setClearColor(0x000000, 0); r.clear(); r.setClearColor(0x000000, 1);
  for (let s = 0; s < N; s++) {
    const u = N === 1 ? 0.5 : (s + 0.5) / N;
    const ts = t + (u - 0.5) * fo.shutter / FPS;
    if (w.update) w.update(ts);
    if (w.sky) w.sky.uSkyT.value = ts;
    for (const m of w.procMats) { const U = m.uniforms; if (U && U.uT) U.uT.value = ts; }
    const k = camAt(ts) || {}, f = k.from || [0, 1.6, 6], to = k.to || [0, 1, 0];
    c.fov = k.fov || 40; c.near = fo.near; c.far = fo.far; c.aspect = W / H;
    c.position.set(f[0], f[1], f[2]); c.up.set(0, 1, 0); c.lookAt(to[0], to[1], to[2]);
    if (k.roll) c.rotateZ(k.roll);
    c.updateMatrixWorld();
    /* the lens: a point on the aperture (golden-angle spiral), the pixel grid jittered */
    const ap = (k.aperture == null ? fo.aperture : k.aperture), focus = k.focus || fo.focus;
    let ox = 0, oy = 0;
    if (N > 1) {
      ox = (_halton(s + 1, 2) - 0.5) * fo.jitter; oy = (_halton(s + 1, 3) - 0.5) * fo.jitter;
      if (ap > 0) {
        const a = s * 2.39996323, rr = Math.sqrt((s + 0.5) / N) * ap;
        const lx = Math.cos(a) * rr, ly = Math.sin(a) * rr;
        const right = new T.Vector3().setFromMatrixColumn(c.matrixWorld, 0), up = new T.Vector3().setFromMatrixColumn(c.matrixWorld, 1);
        c.position.addScaledVector(right, lx).addScaledVector(up, ly); c.updateMatrixWorld();
        const th = Math.tan(c.fov * Math.PI / 360);
        ox += (-lx / focus) / (th * c.aspect) * (W / 2);
        oy += (ly / focus) / th * (H / 2);
      }
    }
    c.setViewOffset(W, H, ox, oy, W, H); c.updateProjectionMatrix();
    for (const pp of w.prePasses || []) pp(r, c, ts, F);
    r.setRenderTarget(F.scene); r.clear(); r.render(w.scene, c);
    F.fog(F.scene, c, F.fogged);
    F.accMat.uniforms.tIn.value = F.fogged.texture; F.accMat.uniforms.uW.value = 1 / N;
    F.pass(F.accMat, F.acc, false);
    c.clearViewOffset();
  }
  /* bloom */
  let src = F.acc;
  F.levels.forEach((L, i) => {
    const U = F.downMat.uniforms; U.tIn.value = src.texture; U.uTexel.value.set(1 / src.width, 1 / src.height);
    U.uPre.value = i === 0 ? 1 : 0; U.uThresh.value = fo.threshold; U.uKnee.value = Math.max(0.001, fo.knee);
    F.pass(F.downMat, L); src = L;
  });
  for (let i = F.levels.length - 2; i >= 0; i--) {
    const U = F.upMat.uniforms, s2 = F.levels[i + 1]; U.tIn.value = s2.texture; U.uTexel.value.set(1 / s2.width, 1 / s2.height); U.uR.value = fo.bloomRadius; U.uW.value = fo.bloomScatter;
    F.pass(F.upMat, F.levels[i], false);
  }
  /* streak: bright parts only, stretched sideways */
  if (fo.streak > 0) {
    const U = F.downMat.uniforms; U.tIn.value = F.acc.texture; U.uTexel.value.set(1 / W, 1 / H); U.uPre.value = 1; U.uThresh.value = fo.streakThreshold; U.uKnee.value = fo.streakThreshold * 0.5;
    F.pass(F.downMat, F.sA);
    let a = F.sA, b = F.sB;
    for (const step of [1, 3, 8, 18]) { const S = F.streakMat.uniforms; S.tIn.value = a.texture; S.uTexel.value.set(1 / a.width, 1 / a.height); S.uStep.value = step; S.uFalloff.value = 0.92; F.pass(F.streakMat, b); [a, b] = [b, a]; }
    F.finalMat.uniforms.tStreak.value = a.texture;
  }
  const U = F.finalMat.uniforms;
  U.uBloom.value = fo.bloom; { let k = 0; for (let i = 0; i < 7; i++) k += Math.pow(fo.bloomScatter, i); U.uBloomNorm.value = 1 / k; } U.uHalation.value = fo.halation; U.uStreak.value = fo.streak; U.uStreakTint.value.set(...fo.streakTint);
  U.uExposure.value = (o.exposure || k_exposure(w, fo)); U.uVig.value = fo.vignette; U.uAberr.value = fo.aberration; U.uGrain.value = fo.grain; U.uSeed.value = Math.round(t * FPS) % 997;
  U.uSat.value = fo.saturation; U.uContrast.value = fo.contrast; U.uLift.value.set(...fo.lift); U.uGamma.value.set(...fo.gamma); U.uGain.value.set(...fo.gain); U.uToe.value = fo.toe;
  U.uFlare.value = 0;
  if (fo.flare > 0 && w.sky) {
    const sp = w.sky.uSunDir.value.clone().multiplyScalar(1000).add(c.position).project(c);
    if (sp.z < 1 && Math.abs(sp.x) < 1.2 && Math.abs(sp.y) < 1.2) { U.uFlare.value = fo.flare; U.uFlarePos.value.set(sp.x * 0.5 + 0.5, sp.y * 0.5 + 0.5); U.uFlareCol.value.set(...fo.flareColor); }
  }
  r.setRenderTarget(null); r.setClearColor(0x000000, 0); r.clear();
  quadRender(F, F.finalMat);
  r.toneMapping = prevTM;
  ctx.save(); ctx.globalAlpha *= clamp(o.alpha == null ? 1 : o.alpha);
  ctx.drawImage(_3.canvas, 0, 0, W, H);
  ctx.restore();
  const v = new T.Vector3();
  return { camera: c, project: (p) => { v.set(p[0], p[1], p[2]).project(c); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H, v.z < 1]; } };
}
function k_exposure(w, fo) { return w.exposure || fo.exposure || 1; }
function quadRender(F, m) { F.pass(m, null, false); }
