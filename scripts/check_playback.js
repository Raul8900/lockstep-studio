#!/usr/bin/env node
/* Exercise continuous HTML video playback, without seeking. A clean FFmpeg
 * decode alone does not prove a browser keeps presenting frames to the end. */
const fs = require('fs');
const http = require('http');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(path.join(process.env.NODE_PATH || '/opt/node22/lib/node_modules', 'playwright'))); }

const file = path.resolve(process.argv[2] || '');
const out = path.resolve(process.argv[3] || 'work/playback-check');
if (!fs.statSync(file).isFile()) throw new Error('usage: node scripts/check_playback.js <mp4> <new-evidence-folder>');
fs.mkdirSync(out, { recursive: true });
const stat = fs.statSync(file);
const server = http.createServer((req, res) => {
  if (req.url !== '/film.mp4') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<!doctype html><meta charset="utf-8"><video muted playsinline preload="auto" src="/film.mp4" style="height:90vh"></video>');
    return;
  }
  const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
  const start = range ? Number(range[1]) : 0;
  const end = range && range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1;
  if (start > end || start >= stat.size) { res.writeHead(416); res.end(); return; }
  const headers = { 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Cache-Control': 'no-store' };
  if (range) headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
  res.writeHead(range ? 206 : 200, headers);
  fs.createReadStream(file, { start, end }).pipe(res);
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    const options = { headless: true, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] };
    if (process.env.LOCKSTEP_CHROMIUM) options.executablePath = process.env.LOCKSTEP_CHROMIUM;
    browser = await chromium.launch(options);
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    const result = await page.evaluate(async () => {
      const video = document.querySelector('video');
      await new Promise((resolve, reject) => {
        if (video.readyState >= 1) resolve();
        else { video.onloadedmetadata = resolve; video.onerror = () => reject(new Error('metadata: ' + video.error?.message)); }
      });
      const duration = video.duration, checkpoints = [2, 8, 13.4, 18, 26.7, 33, duration - 1];
      const canvas = document.createElement('canvas'); canvas.width = 270; canvas.height = 480;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const samples = [], pictures = [], events = [];
      let callbacks = 0, lastMediaTime = -1, lastWall = 0, maxWallGapMs = 0, nextSecond = 0;
      for (const name of ['waiting', 'stalled', 'error', 'ended']) video.addEventListener(name, () => events.push({ name, time: video.currentTime, error: video.error?.message }));
      const start = performance.now();
      return await new Promise(async (resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(`continuous playback timed out at video ${video.currentTime}, last presented frame ${lastMediaTime}`)), (duration + 25) * 1000);
        function onFrame(now, metadata) {
          callbacks++; lastMediaTime = metadata.mediaTime;
          if (lastWall) maxWallGapMs = Math.max(maxWallGapMs, now - lastWall);
          lastWall = now;
          if (metadata.mediaTime >= nextSecond || checkpoints.length && metadata.mediaTime >= checkpoints[0]) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            let hash = 2166136261;
            for (let i = 0; i < pixels.length; i++) hash = Math.imul(hash ^ pixels[i], 16777619) >>> 0;
            if (metadata.mediaTime >= nextSecond) { samples.push({ mediaTime: metadata.mediaTime, pixelHash: hash.toString(16), presentedFrames: metadata.presentedFrames }); nextSecond++; }
            if (checkpoints.length && metadata.mediaTime >= checkpoints[0]) {
              pictures.push({ requestedTime: checkpoints.shift(), mediaTime: metadata.mediaTime, png: canvas.toDataURL('image/png').split(',')[1] });
            }
          }
          video.requestVideoFrameCallback(onFrame);
        }
        video.requestVideoFrameCallback(onFrame);
        video.onerror = () => { clearTimeout(timeout); reject(new Error(video.error?.message || 'video playback error')); };
        video.onended = () => {
          clearTimeout(timeout);
          resolve({ duration, currentTime: video.currentTime, lastPresentedMediaTime: lastMediaTime,
            frameCallbacks: callbacks, maxWallGapMs, elapsedMs: performance.now() - start,
            quality: video.getVideoPlaybackQuality().toJSON?.() || (() => { const q = video.getVideoPlaybackQuality(); return { totalVideoFrames: q.totalVideoFrames, droppedVideoFrames: q.droppedVideoFrames, corruptedVideoFrames: q.corruptedVideoFrames }; })(),
            samples, events, pictures });
        };
        try { await video.play(); } catch (error) { clearTimeout(timeout); reject(error); }
      });
    });
    result.browserVersion = browser.version(); result.file = file;
    result.method = 'Continuous HTMLVideoElement playback at 1x over a local HTTP server with byte-range support; no seeking.';
    for (let i = 0; i < result.pictures.length; i++) {
      const picture = result.pictures[i], name = `playback-${i + 1}-${picture.mediaTime.toFixed(2)}s.png`;
      fs.writeFileSync(path.join(out, name), Buffer.from(picture.png, 'base64')); delete picture.png; picture.file = name;
    }
    result.reachedEnd = result.currentTime >= result.duration - .1 && result.lastPresentedMediaTime >= result.duration - .15;
    result.pictureChangedAfter4s = new Set(result.samples.filter(s => s.mediaTime > 4).map(s => s.pixelHash)).size > 10;
    fs.writeFileSync(path.join(out, 'playback.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify({ reachedEnd: result.reachedEnd, pictureChangedAfter4s: result.pictureChangedAfter4s,
      duration: result.duration, lastPresentedMediaTime: result.lastPresentedMediaTime, frameCallbacks: result.frameCallbacks,
      quality: result.quality, maxWallGapMs: result.maxWallGapMs, report: path.join(out, 'playback.json') }, null, 2));
    if (!result.reachedEnd || !result.pictureChangedAfter4s) process.exitCode = 1;
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
