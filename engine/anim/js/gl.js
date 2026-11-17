'use strict';
/* =====================================================================
   gl.js — shader transitions between scenes: addScene(id, draw, { type: 'gl:CrossZoom' }).

   The 223 transitions are gl-transitions (MIT; vendor/gl-transitions/, each
   with its author). A transition is a GLSL function of progress that mixes
   the outgoing picture and the incoming one. Both are whole frames — the
   backdrop with the scene on it — so the whole frame takes part; captions,
   the progress bar and the finish (bloom, vignette, grain) are drawn after,
   untouched.

   The renderer runs WebGL in software (SwiftShader), so a frame comes out the
   same on every render. The shader file is loaded only by videos that use one;
   `lockstep transitions` shows them in the video's look.
   ===================================================================== */
const GLT = { list: null, byKey: null };
const _gl = { ctx: null, canvas: null, vbuf: null, tex: [], full: [], progs: {} };

const isGL = (type) => typeof type === 'string' && type.slice(0, 3) === 'gl:';

/* the shader file, read once */
async function loadGLTransitions() {
  if (GLT.list) return GLT.list;
  const r = await fetch('vendor/gl-transitions/transitions.json');
  if (!r.ok) throw new Error('vendor/gl-transitions/transitions.json is missing');
  GLT.list = (await r.json()).transitions;
  GLT.byKey = new Map(GLT.list.map((x) => [x.name.toLowerCase(), x]));
  return GLT.list;
}
/* 'gl:crosszoom' → its entry (names match without regard to case), or undefined */
function glFind(type) { return GLT.byKey ? GLT.byKey.get(String(type).slice(3).toLowerCase()) : undefined; }

function _glSetup() {
  const canvas = makeCanvas(W, H);
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: true });
  if (!gl) throw new Error('WebGL is not available in this browser, and gl: transitions need it');
  const vbuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  const tex = [0, 1].map(() => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  });
  Object.assign(_gl, { ctx: gl, canvas, vbuf, tex, full: [makeCanvas(W, H), makeCanvas(W, H)] });
}

const _GL_VS = 'attribute vec2 _p; varying vec2 _uv; void main(){ gl_Position = vec4(_p, 0.0, 1.0); _uv = 0.5 * (_p + 1.0); }';
const _GL_HEAD = 'precision highp float;\nvarying vec2 _uv;\nuniform sampler2D _from, _to;\nuniform float progress, ratio;\n'
  + 'vec4 getFromColor(vec2 uv){ return texture2D(_from, uv); }\nvec4 getToColor(vec2 uv){ return texture2D(_to, uv); }\n';

/* the compiled program of a transition (compiled once, at boot for the ones a video uses) */
function glProgram(entry) {
  if (_gl.progs[entry.name]) return _gl.progs[entry.name];
  if (!_gl.ctx) _glSetup();
  const gl = _gl.ctx;
  const shader = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`gl:${entry.name} does not compile: ${gl.getShaderInfoLog(s)}`);
    return s;
  };
  const pr = gl.createProgram();
  gl.attachShader(pr, shader(gl.VERTEX_SHADER, _GL_VS));
  gl.attachShader(pr, shader(gl.FRAGMENT_SHADER, _GL_HEAD + entry.glsl + '\nvoid main(){ gl_FragColor = transition(_uv); }'));
  gl.bindAttribLocation(pr, 0, '_p'); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(`gl:${entry.name} does not link: ${gl.getProgramInfoLog(pr)}`);
  return (_gl.progs[entry.name] = pr);
}

/* Colour parameters with an unambiguous name follow the look unless the scene sets them (or sets
   look: false): the ground (paper, background, panel …) takes the backdrop's colour, ink and borders
   the ink, a shadow ink the darker of ink and ground, color1–3 and accent the accent, subject
   and data colours. Others keep their author's
   colour — "color" alone means a smoke, a light or a blank screen depending on the shader. Any
   colour parameter can be given as a role ('accent'), a COL key or '#rrggbb'. */
const _GL_LOOK = {
  bg: ['backcolor', 'background', 'bgcolor', 'paper', 'card', 'panel', 'hole', 'holecolor', 'separator', 'guttercolor', 'filmcolor'],
  ink: ['ink', 'linecolor', 'bordercolor', 'border_color'],
  dark: ['shadowink'],
  accent: ['accent', 'color1', 'barcolor', 'highlightink'],
  subject: ['color2'], data: ['color3'],
};
function _glLookColour(name) {
  const k = name.toLowerCase();
  for (const role in _GL_LOOK) {
    if (!_GL_LOOK[role].includes(k)) continue;
    if (role === 'bg') return COL.bgMid;
    if (role === 'dark') return luminance(COL.ink) < luminance(COL.bgMid) ? COL.ink : COL.bgMid;
    return COL[role];
  }
  return null;
}
function _glParams(entry, tr) {
  const out = {}, given = tr.params || {}, defs = entry.defaultParams || {};
  for (const k in entry.paramsTypes || {}) {
    const type = entry.paramsTypes[k], def = defs[k];
    let v = given[k] != null ? given[k] : def;
    if (type === 'vec3' || type === 'vec4') {
      if (given[k] == null && tr.look !== false) v = _glLookColour(k) || v;
      if (typeof v === 'string') {
        const c = hexRGB(COL[v] || v).map((x) => x / 255);
        v = type === 'vec4' ? [c[0], c[1], c[2], Array.isArray(def) && def.length > 3 ? def[3] : 1] : c;
      }
    }
    out[k] = v;
  }
  return out;
}

function _glUniform(gl, pr, name, type, v) {
  const loc = gl.getUniformLocation(pr, name);
  if (!loc || v == null) return;
  if (type === 'float') gl.uniform1f(loc, +v);
  else if (type === 'int') gl.uniform1i(loc, Math.round(v));
  else if (type === 'bool') gl.uniform1i(loc, v ? 1 : 0);
  else if (type === 'vec2') gl.uniform2fv(loc, v);
  else if (type === 'vec3') gl.uniform3fv(loc, v);
  else if (type === 'vec4') gl.uniform4fv(loc, v);
  else if (type === 'ivec2') gl.uniform2iv(loc, v.map(Math.round));
}

/* The transition from layer A to layer B at progress p (0..1), drawn over the whole of ctx,
   whose canvas holds the backdrop at this moment. tr: { type: 'gl:Name', params, ease } —
   params override the shader's own defaults; ease names an easing from E (default: linear,
   as the shaders are written for). */
function drawGLTransition(ctx, A, B, p, tr) {
  const entry = glFind(tr.type);
  if (!entry) throw new Error(`unknown transition "${tr.type}" (lockstep transitions lists them)`);
  const pr = glProgram(entry), gl = _gl.ctx;
  for (let i = 0; i < 2; i++) {
    const f = _gl.full[i].getContext('2d');
    f.globalAlpha = 1; f.globalCompositeOperation = 'copy'; f.drawImage(ctx.canvas, 0, 0);
    f.globalCompositeOperation = 'source-over'; f.drawImage(i ? B : A, 0, 0);
    gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, _gl.tex[i]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, _gl.full[i]);
  }
  gl.viewport(0, 0, W, H); gl.useProgram(pr);
  gl.uniform1i(gl.getUniformLocation(pr, '_from'), 0); gl.uniform1i(gl.getUniformLocation(pr, '_to'), 1);
  const ease = tr.ease && E[tr.ease] ? E[tr.ease] : (x) => x;
  gl.uniform1f(gl.getUniformLocation(pr, 'progress'), clamp(ease(clamp(p))));
  gl.uniform1f(gl.getUniformLocation(pr, 'ratio'), W / H);
  const params = _glParams(entry, tr);
  for (const k in entry.paramsTypes || {}) _glUniform(gl, pr, k, entry.paramsTypes[k], params[k]);
  gl.bindBuffer(gl.ARRAY_BUFFER, _gl.vbuf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(_gl.canvas, 0, 0); ctx.restore();
}

/* After the scenes are registered: load and compile the shader transitions they use, so a
   misspelt name or a shader the browser cannot compile stops the boot, not frame 2,000. */
async function prepareGLTransitions() {
  const used = SCENES.filter((s) => isGL((s.trans || {}).type));
  if (!used.length) return;
  await loadGLTransitions();
  for (const s of used) {
    const entry = glFind(s.trans.type);
    if (!entry) {
      const want = s.trans.type.slice(3).toLowerCase(), near = GLT.list.map((x) => x.name).filter((n) => n.toLowerCase().includes(want.slice(0, 4))).slice(0, 5);
      throw new Error(`scene ${s.id}: unknown transition "${s.trans.type}"${near.length ? ' — near: ' + near.map((n) => 'gl:' + n).join(', ') : ''} (lockstep transitions lists them)`);
    }
    glProgram(entry);
  }
}

/* `render.js <video> transitions` boots the page in this mode: two scenes in the video's look
   (two block demos) with the transition under test between them; the cut sits at 2 s */
function setupTransitionSheet() {
  DATA.words = []; DATA.takes = []; DATA.meta = { duration: 4 }; DATA.dur = 4; CAPS = [];
  DATA.beats = [{ id: 'from', title: 'From', t0: 0, t1: 2.4 }, { id: 'to', title: 'To', t0: 2.5, t1: 4 }];
  addScene('from', (ctx, t) => BLOCK_DEMOS.barChart.demo(ctx, 1, t));
  addScene('to', (ctx, t) => BLOCK_DEMOS.donutChart.demo(ctx, 1, t), { type: 'fade' });
}

/* The shortlist `lockstep transitions` shows by default, by the kind of look it suits. The other
   180-odd are there too (`lockstep transitions --all`); many are novelties — choose with the brief. */
const TRANSITION_PICKS = [
  /* calm, editorial: any look */
  { type: 'gl:FilmDissolve', family: 'calm', for: 'a dissolve with the warmth of film' },
  { type: 'gl:DefocusBlur', family: 'calm', for: 'out of focus and back: a change of subject' },
  { type: 'gl:Dreamy', family: 'calm', for: 'a gentle wave: memory, imagination' },
  { type: 'gl:SimpleZoomOut', family: 'calm', for: 'the next scene settles in from close' },
  { type: 'gl:CircleOpen', family: 'calm', for: 'an iris opens: a reveal' },
  { type: 'gl:LightWipe', family: 'calm', for: 'a glint sweeps across: polished, product-like' },
  { type: 'gl:SpotlightWipe', family: 'calm', for: 'lights down, a spotlight: stage and dark editorial looks' },
  /* energetic, poster */
  { type: 'gl:CrossZoom', family: 'energetic', for: 'zoom blur: going deeper, speed' },
  { type: 'gl:WhipPan', family: 'energetic', for: 'a fast pan: lists, momentum' },
  { type: 'gl:WhipSpin', family: 'energetic', for: 'a spin: a twist, a surprise' },
  { type: 'gl:StretchSlide', family: 'energetic', for: 'an elastic slide: playful' },
  { type: 'gl:PopIn', family: 'energetic', for: 'the next scene pops in as a card: friendly' },
  { type: 'gl:ComicPanels', family: 'poster', for: 'comic panels: myths, rankings, attitude' },
  { type: 'gl:ColorPanelWipe', family: 'poster', for: 'panels in the look\'s colours sweep across' },
  { type: 'gl:GeometricCollage', family: 'poster', for: 'a geometric poster collage: bold graphic looks' },
  { type: 'gl:Halftone', family: 'poster', for: 'printed dots: riso, comic, pop' },
  { type: 'gl:DuotoneFade', family: 'poster', for: 'printed in two inks: riso, poster' },
  /* hand-drawn, paper */
  { type: 'gl:SketchDissolve', family: 'paper', for: 'redrawn in pencil: notebook, chalk, how-to' },
  { type: 'gl:PaperTear', family: 'paper', for: 'torn in two: before and after, myth and fact' },
  { type: 'gl:PaperFold', family: 'paper', for: 'folded away: the next page of a notebook' },
  { type: 'gl:Crumple', family: 'paper', for: 'crumpled up: a wrong idea thrown away' },
  { type: 'gl:BookFlip', family: 'paper', for: 'a page turns: history, story' },
  { type: 'gl:BrushWipe', family: 'paper', for: 'brush strokes: art, craft' },
  { type: 'gl:InkBleed', family: 'paper', for: 'ink spreads: biology, nature, history' },
  { type: 'gl:StopMotion', family: 'paper', for: 'a cut-paper card jerks away: crafty' },
  /* technical, neon, digital */
  { type: 'gl:GlitchDisplace', family: 'technical', for: 'a glitch: digital, hacking, errors' },
  { type: 'gl:Pixelize', family: 'technical', for: 'pixels: computing, games' },
  { type: 'gl:DitherDissolve', family: 'technical', for: 'an ordered dither: retro computing' },
  { type: 'gl:LedWall', family: 'technical', for: 'a wall of LEDs: screens, displays' },
  { type: 'gl:CodeRain', family: 'technical', for: 'code rains down: software' },
  { type: 'gl:WarpSpeed', family: 'technical', for: 'light speed: space, the future' },
  { type: 'gl:BloomDissolve', family: 'technical', for: 'highlights bloom into the next scene: neon' },
  /* process, cards */
  { type: 'gl:CardDeal', family: 'cards', for: 'the next scene dealt as cards: steps, options' },
  { type: 'gl:LayoutGrid', family: 'cards', for: 'a magazine grid opens: editorial process' },
  { type: 'gl:BlockSlide', family: 'cards', for: 'blocks slide out in turn: building up' },
  { type: 'gl:GridFlip', family: 'cards', for: 'tiles flip over: a change of state' },
  { type: 'gl:Cube', family: 'cards', for: 'a box turns: the other side of a thing (dark looks)' },
  /* nature, science */
  { type: 'gl:Ripple', family: 'nature', for: 'ripples: water, sound, waves' },
  { type: 'gl:WaterDrop', family: 'nature', for: 'a drop in still water: calm science' },
  { type: 'gl:LiquidFill', family: 'nature', for: 'liquid rises: filling, levels' },
  { type: 'gl:CellDissolve', family: 'nature', for: 'cells: biology, materials' },
  { type: 'gl:SmokeDissolve', family: 'nature', for: 'smoke drifts in: fire, mystery' },
  /* film, retro */
  { type: 'gl:FilmBurn', family: 'retro', for: 'light leaks: film, memories' },
  { type: 'gl:TvTurnOff', family: 'retro', for: 'an old TV switches off: endings, the past' },
];
