#!/usr/bin/env node
/* =====================================================================
   render.js — deterministic frame renderer.

     node engine/render.js <video-dir> meta
     node engine/render.js <video-dir> still [--safe] [--out dir] <frame|12.5s> ...
     node engine/render.js <video-dir> scan
     node engine/render.js <video-dir> lint [--step N]
     node engine/render.js <video-dir> blocks [--style f.json] [--names a,b] [--stages 0.3,1] [--out f.jpg]
     node engine/render.js <video-dir> transitions [--style f.json] [--names a,b] [--all] [--stages 0.3,0.7] [--out f.jpg]
     node engine/render.js <video-dir> bench <frame|time> ...
     node engine/render.js <video-dir> video [--workers N] [--from s] [--to s]

   Serves engine/anim plus the video's own files over HTTP and opens the page
   in headless Chromium.
     meta   exports data/timeline.json (scene boundaries, captions, sound cues)
     still  writes single frames as JPEG for review
     scan   draws every 2nd frame without saving and reports script errors
            and near-black frames
     lint   draws every Nth frame (6) and prints, as one JSON line, where every
            piece of scene text lands; engine/lint.py turns it into findings
     blocks draws the ready-made blocks (js/blocks.js) in the video's look and
            tiles them with engine/gallery.py: every block finished, or with
            --names, each named block's build-in as a strip
     video  each frame leaves the page as a JPEG (q 0.97) and is written to
            out/frames/fNNNNN.jpg; work is handed out in 5-second chunks, so a
            changed scene can be re-rendered on its own with --from/--to
   ===================================================================== */
const http = require('http');
const fs = require('fs');
const path = require('path');

let chromium;
try { ({ chromium } = require('playwright')); } catch (e1) {
  try { ({ chromium } = require(path.join(process.env.NODE_PATH || '/opt/node22/lib/node_modules', 'playwright'))); } catch (e2) {
    console.error('Playwright is not installed. Run scripts/setup.sh, or: npm install playwright && npx playwright install chromium');
    process.exit(1);
  }
}

const ENGINE = __dirname;
const ANIM = path.join(ENGINE, 'anim');
const ASSETS = path.join(ENGINE, '..', 'assets');
let STYLE_OVERRIDE = null;      // tile --style file.json: preview a style other than the video's own
const W = 1080, H = 1920, FPS = 30, CHUNK = 150;
const MIME = { '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

const [projArg, mode, ...rest] = process.argv.slice(2);
if (!projArg || !mode) {
  console.log('usage: node engine/render.js <video-dir> meta | still [--safe] [--out dir] <frame|12.5s>... | scan | bench <frame>... | video [--workers N] [--from s] [--to s]');
  process.exit(1);
}
const PROJECT = path.resolve(projArg);
if (!fs.existsSync(path.join(PROJECT, 'video.json'))) { console.error(`no video.json in ${PROJECT}`); process.exit(1); }
const DATA = path.join(PROJECT, 'data');
const NEEDS_NARRATION = mode !== 'tile' && mode !== 'lottiesheet' && mode !== 'blocks' && mode !== 'transitions';
if (NEEDS_NARRATION && !fs.existsSync(path.join(DATA, 'words.json'))) {
  console.error(`no narration recorded yet for ${path.basename(PROJECT)}: run  bin/lockstep voice ${path.basename(PROJECT)}  first`);
  process.exit(1);
}
if (NEEDS_NARRATION && !fs.existsSync(path.join(PROJECT, 'caption_phrases.json'))) {
  console.error(`no caption_phrases.json: run  bin/lockstep captions ${path.basename(PROJECT)} --draft  and edit the result`);
  process.exit(1);
}
const OUT = path.join(PROJECT, 'out');
const FRAMES = path.join(OUT, 'frames');

function manifest() {
  const scripts = [];
  if (fs.existsSync(path.join(PROJECT, 'components.js'))) scripts.push('project/components.js');
  const dir = path.join(PROJECT, 'scenes');
  const scenes = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort() : [];
  for (const f of scenes) scripts.push('project/scenes/' + f);
  return { scripts };
}

function startServer(opts = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost');
      if (opts.extra && opts.extra(req, res, url, decodeURIComponent(url.pathname))) return;
      if (req.method === 'POST' && url.pathname === '/frame') {
        const i = parseInt(url.searchParams.get('i'), 10);
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => {
          const buf = Buffer.concat(chunks);
          if (!(i >= 0) || buf.length < 1000 || buf[0] !== 0xff || buf[1] !== 0xd8) { res.writeHead(400); res.end('bad frame'); return; }
          fs.writeFile(path.join(FRAMES, `f${String(i).padStart(5, '0')}.jpg`), buf, (err) => { res.writeHead(err ? 500 : 200); res.end(err ? 'write failed' : 'ok'); });
        });
        return;
      }
      let rel = decodeURIComponent(url.pathname);
      if (rel === '/') rel = '/index.html';
      if (rel === '/project/manifest.json') {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify(manifest()));
        return;
      }
      const isProj = rel.startsWith('/project/'), isAsset = rel.startsWith('/assets/');
      const base = isProj ? PROJECT : isAsset ? ASSETS : ANIM;
      let file = path.normalize(path.join(base, isProj ? rel.slice(9) : isAsset ? rel.slice(8) : rel));
      if (rel === '/project/style.json' && STYLE_OVERRIDE) file = STYLE_OVERRIDE;
      if (file !== base && !file.startsWith(base + path.sep) && file !== STYLE_OVERRIDE) { res.writeHead(403); res.end('forbidden'); return; }
      fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); res.end('not found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        res.end(data);
      });
    });
    server.on('error', reject);
    server.listen(opts.port || 0, opts.host || '127.0.0.1', () => resolve(server));
  });
}

async function openPage(browser, port, debugSafe, special) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) console.error('[console]', m.text()); });
  if (debugSafe) await page.addInitScript(() => { window.DEBUG_SAFE = true; });
  if (special && special.tile) await page.addInitScript(() => { window.TILE_MODE = true; });
  if (special && special.lottiesheet) await page.addInitScript((o) => { window.LOTTIESHEET = o; }, special.lottiesheet);
  if (special && special.blocks) await page.addInitScript(() => { window.BLOCKS_MODE = true; });
  if (special && special.transitions) await page.addInitScript(() => { window.TRANS_MODE = true; });
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForFunction(() => window.READY || window.BOOT_ERROR, null, { timeout: 60000 });
  const err = await page.evaluate(() => window.BOOT_ERROR);
  if (err) throw new Error('boot failed: ' + err);
  return page;
}

/* One place to start Chromium. (Forcing SwiftShader with --use-angle=swiftshader made every frame
   about 6x slower — it moves 2D canvases onto the software GPU too — so it is not set: headless
   Chromium already runs WebGL in software where there is no GPU.) */
const launchBrowser = () => chromium.launch();

async function withPage(debugSafe, fn, special) {
  const server = await startServer(); const port = server.address().port;
  const browser = await launchBrowser();
  try { return await fn(await openPage(browser, port, debugSafe, special), browser, port); }
  finally { await browser.close(); server.close(); }
}

const parseFrame = (arg) => (/s$/.test(arg) ? Math.round(parseFloat(arg) * FPS) : parseInt(arg, 10));

async function still(args) {
  const debugSafe = args.includes('--safe');
  let outDir = path.join(OUT, 'stills');
  const specs = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--safe') continue;
    if (args[i] === '--out') { outDir = path.resolve(args[++i]); continue; }
    specs.push(args[i]);
  }
  if (!specs.length) { console.error('still: give at least one frame number or time, e.g. 12.5s'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  await withPage(debugSafe, async (page) => {
    const t0 = Date.now();
    for (const spec of specs) {
      const i = parseFrame(spec);
      const b64 = await page.evaluate((f) => { renderFrame(f); return document.getElementById('c').toDataURL('image/jpeg', 0.93).split(',')[1]; }, i);
      fs.writeFileSync(path.join(outDir, `f${String(i).padStart(5, '0')}_${(i / FPS).toFixed(2)}s.jpg`), Buffer.from(b64, 'base64'));
    }
    console.log(`${specs.length} stills in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${outDir}`);
  });
}

async function meta() {
  fs.mkdirSync(DATA, { recursive: true });
  await withPage(false, async (page) => {
    const info = await page.evaluate(() => ({
      total: window.TOTAL_FRAMES, dur: DATA.dur, fps: FPS, width: W, height: H,
      style: { name: STYLE.name, mode: STYLE.mode, backdrop: typeof window.drawBackdrop === 'function' ? 'custom' : STYLE.backdrop.type, fonts: F,
        palette: { bg: [COL.bgTop, COL.bgMid, COL.bgBot], ink: COL.white, subject: COL.subject, accent: COL.accent, data: COL.data, alert: COL.alert, good: COL.good },
        captions: { size: CAP.size, weight: CAP.weight, family: CAP.family, y: CAP.cy, lineH: CAP.lineH, maxW: CAP.maxW, highlight: STYLE.captions.highlight, case: STYLE.captions.case }, hud: STYLE.hud.type, transition: STYLE.transition },
      scenes: SCENES.map((s) => ({ id: s.id, name: chapterName(s.id), t0: s.t0, t1: s.t1, trans: s.trans })),
      lottie: [...LOT_SPECS.values()].map((s) => ({ name: s.name, dir: s.dir, recolor: s.recolor })),
      sfx: SFX,
      caps: CAPS.map((c) => ({ text: c.text, show0: c.show0, show1: c.show1, t0: c.t0, t1: c.t1, lines: c.lines.length, width: Math.max(...c.lines.map((l) => l.w)) * c.scale })),
      ...(CAP_HIDE.length ? { caption_hidden: CAP_HIDE } : {}),          // stretches where the scene's own type says the words
    }));
    fs.writeFileSync(path.join(DATA, 'timeline.json'), JSON.stringify(info, null, 1));
    console.log(`timeline.json: ${info.total} frames, ${info.scenes.length} scenes, ${info.sfx.length} sfx cues, ${info.caps.length} caption phrases`);
  });
}

/* tile [--style file.json] [--out file.jpg]: one frame showing the style (works before any narration exists) */
async function tile(args) {
  let out = path.join(OUT, 'style_tile.jpg');
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--style') STYLE_OVERRIDE = path.resolve(args[++i]);
    else if (args[i] === '--out') out = path.resolve(args[++i]);
  }
  if (STYLE_OVERRIDE && !fs.existsSync(STYLE_OVERRIDE)) { console.error('no such style file: ' + STYLE_OVERRIDE); process.exit(1); }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await withPage(args.includes('--safe'), async (page) => {
    const b64 = await page.evaluate(() => { renderFrame(66); return document.getElementById('c').toDataURL('image/jpeg', 0.92).split(',')[1]; });
    fs.writeFileSync(out, Buffer.from(b64, 'base64'));
    console.log('style tile -> ' + out);
  }, { tile: true });
}

/* lottiesheet --names a,b [--dir lottie] [--labels "x|y"] [--frames 6] [--crop] [--style f.json] [--out f.jpg]:
   each Lottie file as a filmstrip, recoloured and drawn as this video's look will draw it */
async function lottiesheet(args) {
  let out = path.join(OUT, 'lottie_sheet.jpg');
  const o = { names: [], dir: null, frames: 6, labels: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--names') o.names = args[++i].split(',').filter(Boolean);
    else if (args[i] === '--dir') o.dir = args[++i];
    else if (args[i] === '--labels') o.labels = args[++i].split('|');
    else if (args[i] === '--frames') o.frames = parseInt(args[++i], 10);
    else if (args[i] === '--crop') o.crop = true;
    else if (args[i] === '--style') STYLE_OVERRIDE = path.resolve(args[++i]);
    else if (args[i] === '--out') out = path.resolve(args[++i]);
  }
  if (!o.names.length) { console.error('lottiesheet: --names a,b,c'); process.exit(1); }
  o.names = o.names.slice(0, 10);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await withPage(false, async (page) => {
    const b64 = await page.evaluate(() => { renderFrame(30); return document.getElementById('c').toDataURL('image/jpeg', 0.9).split(',')[1]; });
    fs.writeFileSync(out, Buffer.from(b64, 'base64'));
    console.log(`${o.names.length} Lottie file(s) -> ${out}`);
  }, { lottiesheet: o });
}

/* preview [--port 4173] [--host 0.0.0.0]: serve preview.html, and tell open pages to reload whenever a
   file of the video or of the engine changes (generated output is ignored). On a person's own machine it
   listens on that machine only unless --host 0.0.0.0 (to open it on a phone on the same network); in a
   cloud session's container, which is isolated, on every interface so the app's preview can reach it. */
async function preview(args) {
  let port = 4173, host = process.env.CLAUDE_CODE_REMOTE === 'true' ? '0.0.0.0' : '127.0.0.1';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port') port = parseInt(args[++i], 10);
    else if (args[i] === '--host') host = args[++i];
  }
  const clients = new Set();
  let server;
  try {
    server = await startServer({ port, host, extra: (req, res, url, rel) => {
      if (rel === '/events') {
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
        res.write('retry: 1000\n\n');
        clients.add(res);
        req.on('close', () => clients.delete(res));
        return true;
      }
      if (rel === '/') { res.writeHead(302, { Location: '/preview.html' }); res.end(); return true; }
      return false;
    } });
  } catch (e) {
    console.error(e.code === 'EADDRINUSE' ? `port ${port} is busy: is a preview already running? (or use --port N)` : String(e));
    process.exit(1);
  }
  const IGNORE = /(^|\/)(out|dist|docs|candidates|node_modules|__pycache__|\.git)(\/|$)|(^|\/)data\/(timeline|validation|master_report|audio_stats|asr_check)[^/]*$|(^|\/)audio\/(?!mix_premaster\.wav$|narration_24k\.wav$)|~$|\.swp$/;
  let timer = null;
  const changed = new Set();
  const fire = () => {
    const list = [...changed]; changed.clear();
    for (const c of clients) c.write(`data: ${JSON.stringify(list)}\n\n`);
    console.log(`  ${new Date().toLocaleTimeString()}  reload (${clients.size} page${clients.size === 1 ? '' : 's'}): ${list.join(', ')}`);
  };
  const watch = (dir, label) => fs.watch(dir, { recursive: true }, (ev, f) => {
    if (!f) return;
    const rel = String(f).replace(/\\/g, '/');
    if (IGNORE.test(rel)) return;
    changed.add(label + rel);
    clearTimeout(timer); timer = setTimeout(fire, 250);
  });
  watch(PROJECT, '');
  watch(ANIM, 'engine/anim/');
  setInterval(() => { for (const c of clients) c.write(': ping\n\n'); }, 20000);
  console.log(`preview of ${path.basename(PROJECT)}: http://localhost:${port}/preview.html`);
  if (host === '0.0.0.0' && process.env.CLAUDE_CODE_REMOTE !== 'true') {
    const nets = Object.values(require('os').networkInterfaces()).flat().filter((n) => n && n.family === 'IPv4' && !n.internal);
    for (const n of nets) console.log(`  on this network: http://${n.address}:${port}/preview.html`);
  }
  console.log('live reload is on: save any scene, style or script data and open pages follow. Ctrl-C to stop.');
  await new Promise(() => {});
}

async function scan() {
  await withPage(false, async (page) => {
    const r = await page.evaluate(() => {
      const errs = [], dark = [], lum = [];
      for (let i = 0; i < window.TOTAL_FRAMES; i += 2) {
        try { renderFrame(i); } catch (e) { errs.push({ frame: i, t: +(i / FPS).toFixed(2), error: String(e.message || e) }); if (errs.length > 12) break; continue; }
        if (i % 6 === 0) {            // mean brightness of the diagram zone
          const d = mctx.getImageData(70, 372, 940, 838).data; let s = 0, n = 0;
          for (let k = 0; k < d.length; k += 4 * 97) { s += d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11; n++; }
          const m = s / n; lum.push([i, m]); if (m < 9) dark.push({ t: +(i / FPS).toFixed(2), mean: +m.toFixed(1) });
        }
      }
      const min = lum.reduce((a, x) => (x[1] < a[1] ? x : a), [0, 999]);
      /* Lottie animations drawn more than 12 % wider than their off-screen canvas: soft edges — give them a larger res */
      const soft = [...LOT.values()].filter((L) => L.maxDrawn > L.canvas.width * 1.12).map((L) => ({ name: L.spec.name, res: L.spec.res, drawn_px: Math.round(L.maxDrawn) }));
      return { errors: errs, dark_frames: dark, darkest: { t: +(min[0] / FPS).toFixed(2), mean: +min[1].toFixed(1) }, sampled: lum.length, soft_lottie: soft };
    });
    console.log(JSON.stringify(r, null, 1));
    if (r.errors.length || r.dark_frames.length) process.exitCode = 2;
  });
}

/* lint [--step N]: one JSON line for engine/lint.py — text boxes per sampled frame, frames that
   throw, sound cue types — or {boot_error} when the page does not start */
async function lint(args) {
  let step = 6;
  for (let i = 0; i < args.length; i++) if (args[i] === '--step') step = Math.max(1, parseInt(args[++i], 10) || 6);
  const server = await startServer(); const port = server.address().port;
  const browser = await launchBrowser();
  let out;
  try {
    let page = null;
    try { page = await openPage(browser, port, false); } catch (e) { out = { boot_error: String(e.message || e).replace(/^boot failed: /, '') }; }
    if (page) {
      await page.addScriptTag({ path: path.join(ANIM, 'js', 'lint.js') });
      out = await page.evaluate((s) => lintLayout(s), step);
    }
  } finally { await browser.close(); server.close(); }
  process.stdout.write(JSON.stringify(out) + '\n');
}

/* blocks: every block of js/blocks.js drawn in the video's look (or --style file's), cropped to
   the content zone and tiled by engine/gallery.py — finished, or with --names as build-in strips */
async function blockSheet(args) {
  let names = null, stages = null, out = path.join(OUT, 'blocks.jpg');
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--style') STYLE_OVERRIDE = path.resolve(args[++i]);
    else if (args[i] === '--names') names = args[++i].split(',').filter(Boolean);
    else if (args[i] === '--stages') stages = args[++i].split(',').map(Number);
    else if (args[i] === '--out') out = path.resolve(args[++i]);
  }
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'lockstep-blocks-'));   // frames only live until tiled
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const rows = [];
  let styleName = '';
  await withPage(false, async (page) => {
    const all = await page.evaluate(() => Object.keys(BLOCK_DEMOS).map((k) => [k, BLOCK_DEMOS[k].about]));
    styleName = await page.evaluate(() => STYLE.name);
    const about = new Map(all), want = names || all.map((a) => a[0]);
    const bad = want.filter((n) => !about.has(n));
    if (bad.length) throw new Error(`no block ${bad.join(', ')}; the blocks are: ${all.map((a) => a[0]).join(', ')}`);
    const st = stages || (names ? [0.12, 0.3, 0.5, 0.72, 1] : [1]);
    for (const n of want) {
      const images = [];
      for (let k = 0; k < st.length; k++) {
        const b64 = await page.evaluate(({ n, p }) => { window.BLOCK_NOW = { name: n, p, t: 2 }; renderFrame(60); return document.getElementById('c').toDataURL('image/jpeg', 0.92).split(',')[1]; }, { n, p: st[k] });
        const f = path.join(dir, `${n}_${k}.jpg`);
        fs.writeFileSync(f, Buffer.from(b64, 'base64')); images.push(f);
      }
      rows.push({ name: n, about: about.get(n), images, stages: st });
    }
  }, { blocks: true });
  const man = path.join(dir, 'manifest.json');
  fs.writeFileSync(man, JSON.stringify({ title: 'lockstep blocks', style: styleName, rows, crop: [0, 360, 1080, 1240] }));
  const r = require('child_process').spawnSync('python3', [path.join(ENGINE, 'gallery.py'), man, out], { stdio: 'inherit' });
  fs.rmSync(dir, { recursive: true, force: true });
  if (r.status) process.exit(r.status);
}

/* transitions: the scene transitions in the video's look (or --style file's), each between the
   same two pictures. With --names: strips through each named one. Without: the middle frame of
   the recommended ones (TRANSITION_PICKS in gl.js), or of every one with --all. */
const BUILTIN_ABOUT = {
  fade: 'built in: a cross-fade', cut: 'built in: a hard cut on the boundary', flash: 'built in: the cut hidden under a flash',
  zoomIn: 'built in: dive into the old scene, the new one grows out of that point', zoomOut: 'built in: pull back from the old scene',
  panDown: 'built in: the camera travels down', panUp: 'built in: the camera travels up',
  slideLeft: 'built in: the new scene pushes the old one out to the left', slideRight: 'built in: the new scene pushes the old one out to the right',
};
async function transitionSheet(args) {
  let names = null, stages = null, all = false, out = path.join(OUT, 'transitions.jpg');
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--style') STYLE_OVERRIDE = path.resolve(args[++i]);
    else if (args[i] === '--names') names = args[++i].split(',').filter(Boolean);
    else if (args[i] === '--stages') stages = args[++i].split(',').map(Number);
    else if (args[i] === '--all') all = true;
    else if (args[i] === '--out') out = path.resolve(args[++i]);
  }
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'lockstep-transitions-'));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const rows = [];
  let styleName = '';
  await withPage(false, async (page) => {
    const info = await page.evaluate(async () => {
      await loadGLTransitions();
      return { style: STYLE.name, builtin: TRANSITIONS.slice(), picks: TRANSITION_PICKS, gl: GLT.list.map((x) => [x.name, x.author, x.description || '']) };
    });
    styleName = info.style;
    const known = new Map();
    for (const n of info.builtin) known.set(n.toLowerCase(), { type: n, about: BUILTIN_ABOUT[n] || 'built in' });
    for (const [n, a, d] of info.gl) known.set('gl:' + n.toLowerCase(), { type: 'gl:' + n, about: (d ? d.replace(/\.$/, '') + ' · ' : '') + 'by ' + a });
    const find = (n) => known.get(n.toLowerCase()) || known.get('gl:' + n.toLowerCase().replace(/^gl:/, ''));
    const want = names || (all ? [...known.values()].map((k) => k.type) : [...info.builtin, ...info.picks.map((p) => p.type)]);
    const bad = want.filter((n) => !find(n));
    if (bad.length) throw new Error(`no transition ${bad.join(', ')}; built in: ${info.builtin.join(', ')}; shader ones: gl:<Name> — lockstep transitions --all shows every one`);
    const st = stages || (names ? [0.15, 0.32, 0.5, 0.68, 0.85] : [0.5]);
    const pickAbout = new Map(info.picks.map((p) => [p.type.toLowerCase(), p.for]));
    for (const n of want) {
      const k = find(n), images = [];
      for (let s = 0; s < st.length; s++) {
        const b64 = await page.evaluate(({ type, p }) => {
          SCENES[1].trans = { type };
          if (isGL(type)) glProgram(glFind(type));
          renderFrame((SCENES[1].t0 - TR / 2 + p * TR) * FPS);
          return document.getElementById('c').toDataURL('image/jpeg', 0.9).split(',')[1];
        }, { type: k.type, p: st[s] });
        const f = path.join(dir, `${rows.length}_${s}.jpg`);
        fs.writeFileSync(f, Buffer.from(b64, 'base64')); images.push(f);
      }
      const why = pickAbout.get(k.type.toLowerCase());
      rows.push({ name: k.type, about: why ? `${why} · ${k.about}` : k.about, images, stages: st });
    }
  }, { transitions: true });
  const man = path.join(dir, 'manifest.json');
  fs.writeFileSync(man, JSON.stringify({ title: 'lockstep transitions', style: styleName, rows, crop: null }));
  const r = require('child_process').spawnSync('python3', [path.join(ENGINE, 'gallery.py'), man, out], { stdio: 'inherit' });
  fs.rmSync(dir, { recursive: true, force: true });
  if (r.status) process.exit(r.status);
}

async function bench(specs) {
  await withPage(false, async (page) => {
    for (const spec of specs) {
      const i = parseFrame(spec);
      const ms = await page.evaluate((f) => { const t = performance.now(); for (let k = 0; k < 10; k++) { renderFrame(f + k); mctx.getImageData(0, 0, 4, 4); } return (performance.now() - t) / 10; }, i);
      console.log(`frame ${i} (${(i / FPS).toFixed(1)}s): ${ms.toFixed(1)} ms/frame`);
    }
  });
}

async function video(args) {
  const opts = { workers: 4, from: null, to: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--workers') opts.workers = parseInt(args[++i], 10);
    if (args[i] === '--from') opts.from = parseFloat(args[++i]);
    if (args[i] === '--to') opts.to = parseFloat(args[++i]);
  }
  fs.mkdirSync(FRAMES, { recursive: true });
  const server = await startServer(); const port = server.address().port;
  const browser = await launchBrowser();
  try {
    const probe = await openPage(browser, port, false);
    const total = await probe.evaluate(() => window.TOTAL_FRAMES);
    await probe.close();
    const nChunks = Math.ceil(total / CHUNK);
    const first = opts.from != null ? Math.floor(opts.from * FPS / CHUNK) : 0;
    const last = opts.to != null ? Math.min(nChunks, Math.ceil(opts.to * FPS / CHUNK)) : nChunks;
    const queue = [];
    for (let c = first; c < last; c++) queue.push(c);
    if (opts.from == null && opts.to == null) {       // full render: drop frames left over from a longer earlier cut
      for (const f of fs.readdirSync(FRAMES)) { const m = /^f(\d+)\.jpg$/.exec(f); if (m && parseInt(m[1], 10) >= total) fs.unlinkSync(path.join(FRAMES, f)); }
    }
    console.log(`rendering chunks ${first}..${last - 1} of ${nChunks} (${total} frames total) with ${opts.workers} workers`);
    const t0 = Date.now(); let doneFrames = 0;
    const todo = queue.reduce((s, c) => s + Math.min(CHUNK, total - c * CHUNK), 0);
    async function worker() {
      const page = await openPage(browser, port, false);
      while (queue.length) {
        const c = queue.shift();
        const a = c * CHUNK, b = Math.min(total, a + CHUNK);
        await page.evaluate(([x, y]) => renderRange(x, y), [a, b]);
        doneFrames += b - a;
        const el = (Date.now() - t0) / 1000;
        if (doneFrames % (CHUNK * 4) < CHUNK || !queue.length) console.log(`  ${doneFrames}/${todo} frames  ${(doneFrames / el).toFixed(1)} fps  eta ${((todo - doneFrames) / (doneFrames / el)).toFixed(0)}s`);
      }
      await page.close();
    }
    await Promise.all(Array.from({ length: Math.max(1, Math.min(opts.workers, queue.length)) }, () => worker()));
    console.log(`rendered ${todo} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${FRAMES}`);
  } finally { await browser.close(); server.close(); }
}

(async () => {
  if (mode === 'still') await still(rest);
  else if (mode === 'meta') await meta();
  else if (mode === 'tile') await tile(rest);
  else if (mode === 'preview') await preview(rest);
  else if (mode === 'lottiesheet') await lottiesheet(rest);
  else if (mode === 'scan') await scan();
  else if (mode === 'lint') await lint(rest);
  else if (mode === 'blocks') await blockSheet(rest);
  else if (mode === 'transitions') await transitionSheet(rest);
  else if (mode === 'bench') await bench(rest);
  else if (mode === 'video') await video(rest);
  else { console.error('unknown mode: ' + mode); process.exit(1); }
})().catch((e) => { console.error(String((e && e.message) || e)); process.exit(1); });
