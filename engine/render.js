#!/usr/bin/env node
/* =====================================================================
   render.js — deterministic frame renderer.

     node engine/render.js <video-dir> meta
     node engine/render.js <video-dir> still [--safe] [--out dir] <frame|12.5s> ...
     node engine/render.js <video-dir> scan
     node engine/render.js <video-dir> lint [--step N]
     node engine/render.js <video-dir> look [--out f.jpg]
     node engine/render.js <video-dir> transitions [--style f.json] [--names a,b] [--all] [--stages 0.3,0.7] [--out f.jpg]
     node engine/render.js <video-dir> bench <frame|time> ...
     node engine/render.js <video-dir> video [--workers N] [--from s] [--to s]
     node engine/render.js <video-dir> preview [--port 4173] [--host 0.0.0.0]

   Serves engine/anim plus the video's own files over HTTP and opens the page
   in headless Chromium.
     meta   exports data/timeline.json (scene boundaries, captions, sound cues, media)
     still  writes single frames as JPEG for review
     scan   draws every 2nd frame without saving and reports script errors
            and blank frames (dark and flat)
     lint   draws every Nth frame (6) and prints, as one JSON line, where every
            piece of scene text lands; engine/lint.py turns it into findings
     look   every picture and film clip the video has taken, through its colour
            grade, with a line of captions on it -> out/look.jpg (works before
            any narration exists)
     video  each frame leaves the page as a JPEG (q 0.97) and is written to
            out/frames/fNNNNN.jpg; work is handed out in 5-second chunks, so a
            changed scene can be re-rendered on its own with --from/--to

   Film clips (useVideo in a scene) are cut into JPEG frames once, by ffmpeg, into
   out/media/<name>/ when the page asks for them (POST /prepare-media); a render
   waits for the frames it needs (renderFrameReady), so output never depends on timing.
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
let STYLE_OVERRIDE = null;      // transitions --style file.json: preview a style other than the video's own
const W = 1080, H = 1920, FPS = 30, CHUNK = 150;
const CLIP_W = 1440;            // film frames are cut to at most this width (room for a pan) at the frame's height
const MIME = { '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.hdr': 'application/octet-stream', '.mp4': 'video/mp4' };

const [projArg, mode, ...rest] = process.argv.slice(2);
if (!projArg || !mode) {
  console.log('usage: node engine/render.js <video-dir> meta | still [--safe] [--out dir] <frame|12.5s>... | scan | lint | look | transitions | bench <frame>... | video [--workers N] [--from s] [--to s] | preview');
  process.exit(1);
}
const PROJECT = path.resolve(projArg);
if (!fs.existsSync(path.join(PROJECT, 'video.json'))) { console.error(`no video.json in ${PROJECT}`); process.exit(1); }
const DATA = path.join(PROJECT, 'data');
const NEEDS_NARRATION = mode !== 'look' && mode !== 'transitions';
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

/* ---------- film clips -> frames ----------
   One ffmpeg run per clip and setting, shared by every page this server serves (the render
   workers ask at the same moment); kept in out/media/<name>/ until the clip or its settings change. */
const { spawn, spawnSync } = require('child_process');
const PREP = new Map();
function prepareClip(spec) {
  const name = String(spec.id || spec.name || '').replace(/[^\w.-]/g, '_'), file = String(spec.file || '');
  const src = path.resolve(PROJECT, 'media', file);
  if (!name || !src.startsWith(path.join(PROJECT, 'media') + path.sep)) return Promise.resolve({ error: 'bad clip name or file' });
  if (!fs.existsSync(src)) return Promise.resolve({ error: `no film media/${file} — take one with: lockstep take, or lockstep media ${path.basename(PROJECT)} restore` });
  const st = fs.statSync(src), from = Math.max(0, +spec.from || 0), to = spec.to == null ? null : +spec.to, fx = spec.focus ? clampN(+spec.focus[0], 0, 1) : 0.5, contain = spec.fit === 'contain';
  const stamp = require('crypto').createHash('sha1').update(JSON.stringify([file, st.size, Math.round(st.mtimeMs), from, to, fx, FPS, H, CLIP_W, contain])).digest('hex').slice(0, 16);
  const key = name + ':' + stamp;
  if (PREP.has(key)) return PREP.get(key);
  const dir = path.join(OUT, 'media', name), infoFile = path.join(dir, 'clip.json');
  const job = (async () => {
    try { const j = JSON.parse(fs.readFileSync(infoFile, 'utf8')); if (j.stamp === stamp && j.frames > 0) return j; } catch (e) { /* not cut yet */ }
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const args = ['-v', 'error', '-y'];
    if (from > 0) args.push('-ss', from.toFixed(3));
    if (to != null) args.push('-t', Math.max(0.1, to - from).toFixed(3));
    /* contain: the whole picture, W wide (old 4:3 film shown as a framed print); otherwise the frame's
       height, cut to at most CLIP_W wide around the focus (room for a pan) */
    const vf = contain ? `fps=${FPS},scale=${W}:-2:flags=lanczos` : `fps=${FPS},scale=-2:${H}:flags=lanczos,crop='min(iw,${CLIP_W})':${H}:'(iw-min(iw,${CLIP_W}))*${fx}':0`;
    args.push('-i', src, '-an', '-vf', vf, '-q:v', '3', path.join(dir, '%05d.jpg'));
    const err = await new Promise((res) => { const p = spawn('ffmpeg', args); let e = ''; p.stderr.on('data', (d) => { e += d; }); p.on('close', (code) => res(code ? e || 'ffmpeg failed' : null)); p.on('error', (x) => res(String(x))); });
    if (err) return { error: String(err).trim().split('\n').slice(-2).join(' ') };
    const frames = fs.readdirSync(dir).filter((f) => /^\d{5}\.jpg$/.test(f)).length;
    if (!frames) return { error: 'no frames came out of ffmpeg (is the clip shorter than from?)' };
    const pr = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', path.join(dir, '00001.jpg')], { encoding: 'utf8' });
    const [w, h] = String(pr.stdout || '').trim().split(',').map(Number);
    const info = { name, file, stamp, frames, w, h, from, to };
    fs.writeFileSync(infoFile, JSON.stringify(info));
    return info;
  })();
  PREP.set(key, job);
  return job;
}
const clampN = (x, a, b) => (x < a ? a : x > b ? b : (x === x ? x : a));

function startServer(opts = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost');
      if (opts.extra && opts.extra(req, res, url, decodeURIComponent(url.pathname))) return;
      if (req.method === 'POST' && url.pathname === '/prepare-media') {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', async () => {
          try {
            const list = JSON.parse(Buffer.concat(chunks).toString('utf8') || '[]'), out = {};
            const res2 = await Promise.all(list.map((sp) => prepareClip(sp)));
            list.forEach((sp, k) => { out[sp.id || sp.name] = res2[k]; });
            res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(out));
          } catch (e) { res.writeHead(500); res.end(String((e && e.message) || e)); }
        });
        return;
      }
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
  if (special && special.look) await page.addInitScript(() => { window.LOOK_MODE = true; });
  if (special && special.transitions) await page.addInitScript(() => { window.TRANS_MODE = true; });
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForFunction(() => window.READY || window.BOOT_ERROR, null, { timeout: 600000 });   // the first boot cuts film clips
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
      const b64 = await page.evaluate(async (f) => { await renderFrameReady(f); return document.getElementById('c').toDataURL('image/jpeg', 0.93).split(',')[1]; }, i);
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
      style: { name: STYLE.name, mode: STYLE.mode, fonts: F, grade: STYLE.grade, post: STYLE.post,
        palette: { bg: STYLE.bg, ink: COL.ink, subject: COL.subject, accent: COL.accent, data: COL.data, alert: COL.alert, good: COL.good },
        captions: { size: CAP.size, weight: CAP.weight, family: CAP.family, y: CAP.cy, lineH: CAP.lineH, maxW: CAP.maxW, highlight: STYLE.captions.highlight, case: STYLE.captions.case, key: STYLE.captions.key }, transition: STYLE.transition },
      scenes: SCENES.map((s) => ({ id: s.id, name: chapterName(s.id), t0: s.t0, t1: s.t1, trans: s.trans })),
      media: [...MEDIA.values()].map((m) => ({ name: m.name, kind: m.kind.toLowerCase(), cutout: !!m.o.cutout, ...(m.kind === 'Video' ? { frames: m.frames } : {}) })),
      worlds: WORLDS.length,
      sfx: SFX,
      caps: CAPS.map((c) => ({ text: c.text, show0: c.show0, show1: c.show1, t0: c.t0, t1: c.t1, lines: c.lines.length, width: Math.max(...c.lines.map((l) => l.w)) * c.scale })),
      ...(CAP_HIDE.length ? { caption_hidden: CAP_HIDE } : {}),          // stretches where the scene's own type says the words
    }));
    fs.writeFileSync(path.join(DATA, 'timeline.json'), JSON.stringify(info, null, 1));
    console.log(`timeline.json: ${info.total} frames, ${info.scenes.length} scenes, ${info.sfx.length} sfx cues, ${info.caps.length} caption phrases`);
  });
}

/* look [--out f.jpg]: every picture and film clip in media/ through the video's grade, each with a
   line of captions, tiled by engine/gallery.py — to judge the grade and the captions before any
   narration exists. Cut-outs are drawn over a mid grey. */
async function look(args) {
  let out = path.join(OUT, 'look.jpg');
  for (let i = 0; i < args.length; i++) if (args[i] === '--out') out = path.resolve(args[++i]);
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'lockstep-look-'));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const rows = [];
  let styleName = '';
  await withPage(false, async (page) => {
    const items = await page.evaluate(() => LOOK_ITEMS.map((x) => [x.name, x.about]));
    styleName = await page.evaluate(() => STYLE.name);
    if (!items.length) throw new Error('no pictures or film in media/ yet: lockstep find <video> photo "…", then lockstep take');
    for (let k = 0; k < items.length; k++) {
      const b64 = await page.evaluate(async (f) => { await renderFrameReady(f); return document.getElementById('c').toDataURL('image/jpeg', 0.9).split(',')[1]; }, Math.round((k * 2 + 1.2) * FPS));
      const f = path.join(dir, `${k}.jpg`);
      fs.writeFileSync(f, Buffer.from(b64, 'base64'));
      rows.push({ name: items[k][0], about: items[k][1], images: [f], stages: [1] });
    }
  }, { look: true });
  const man = path.join(dir, 'manifest.json');
  fs.writeFileSync(man, JSON.stringify({ title: 'lockstep look', style: styleName, rows, crop: null, grid: [Math.min(4, rows.length), 300], unit: 'picture' }));
  const r = spawnSync('python3', [path.join(ENGINE, 'gallery.py'), man, out], { stdio: 'inherit' });
  fs.rmSync(dir, { recursive: true, force: true });
  if (r.status) process.exit(r.status);
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
    const r = await page.evaluate(async () => {
      const errs = [], dark = [], lum = [];
      for (let i = 0; i < window.TOTAL_FRAMES; i += 2) {
        try { await renderFrameReady(i); } catch (e) { errs.push({ frame: i, t: +(i / FPS).toFixed(2), error: String(e.message || e) }); if (errs.length > 12) break; continue; }
        if (i % 6 === 0) {            // a blank frame: dark AND flat (night skies and space are dark, not flat)
          const d = mctx.getImageData(0, 200, W, 1000).data; let s = 0, s2 = 0, n = 0;
          for (let k = 0; k < d.length; k += 4 * 97) { const v = d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11; s += v; s2 += v * v; n++; }
          const m = s / n, sd = Math.sqrt(Math.max(0, s2 / n - m * m)); lum.push([i, m]);
          if (m < 9 && sd < 6) dark.push({ t: +(i / FPS).toFixed(2), mean: +m.toFixed(1), spread: +sd.toFixed(1) });
        }
      }
      const min = lum.reduce((a, x) => (x[1] < a[1] ? x : a), [0, 999]);
      return { errors: errs, dark_frames: dark, darkest: { t: +(min[0] / FPS).toFixed(2), mean: +min[1].toFixed(1) }, sampled: lum.length };
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
        const b64 = await page.evaluate(async ({ type, p }) => {
          SCENES[1].trans = { type };
          if (isGL(type)) glProgram(glFind(type));
          await renderFrameReady((SCENES[1].t0 - TR / 2 + p * TR) * FPS);
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
  const r = spawnSync('python3', [path.join(ENGINE, 'gallery.py'), man, out], { stdio: 'inherit' });
  fs.rmSync(dir, { recursive: true, force: true });
  if (r.status) process.exit(r.status);
}

async function bench(specs) {
  await withPage(false, async (page) => {
    for (const spec of specs) {
      const i = parseFrame(spec);
      const ms = await page.evaluate(async (f) => {
        for (let k = 0; k < 10; k++) await renderFrameReady(f + k);          // film frames loaded first: the time is drawing only
        const t = performance.now(); for (let k = 0; k < 10; k++) { renderFrame(f + k); mctx.getImageData(0, 0, 4, 4); } return (performance.now() - t) / 10;
      }, i);
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
  else if (mode === 'look') await look(rest);
  else if (mode === 'preview') await preview(rest);
  else if (mode === 'scan') await scan();
  else if (mode === 'lint') await lint(rest);
  else if (mode === 'transitions') await transitionSheet(rest);
  else if (mode === 'bench') await bench(rest);
  else if (mode === 'video') await video(rest);
  else { console.error('unknown mode: ' + mode); process.exit(1); }
})().catch((e) => { console.error(String((e && e.message) || e)); process.exit(1); });
