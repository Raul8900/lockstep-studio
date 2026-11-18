'use strict';
/* =====================================================================
   preview.js — `lockstep preview <video>`: play, scrub and inspect a video
   in the browser while editing it. The page draws frames with the same
   engine as the renderer, so what plays here is what will render.

   Keys: Space play/pause · ←/→ one frame · Shift+←/→ one second ·
         [ / ] previous/next scene · Home/End · S safe zones · L loop scene ·
         M audio · 1–4 speed (¼, ½, 1, 2)
   Saving any file of the video (or of the engine) reloads the page at the
   same moment.
   ===================================================================== */
(function () {
  const $ = (id) => document.getElementById(id);
  const css = `
    html, body { background: #0b0d11; color: #d9e2ee; font: 13px/1.35 system-ui, -apple-system, "Segoe UI", sans-serif; overflow: hidden; height: 100%; }
    #c { display: block; margin: 8px auto 0; width: auto; height: auto; max-height: calc(100vh - 168px); max-width: calc(100vw - 16px);
         border-radius: 10px; box-shadow: 0 6px 30px rgba(0,0,0,.6); }
    #pv-bar { position: fixed; left: 0; right: 0; bottom: 0; padding: 6px 12px 8px; background: #12161d; border-top: 1px solid #222a35; }
    #pv-tl { display: block; width: 100%; height: 46px; cursor: pointer; border-radius: 6px; }
    #pv-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; margin-top: 6px; }
    #pv-row button { background: #1d2430; color: #e8eef7; border: 1px solid #2c3646; border-radius: 6px; padding: 4px 10px; font-size: 15px; cursor: pointer; }
    #pv-row button:hover { background: #263042; }
    #pv-row select { background: #1d2430; color: #e8eef7; border: 1px solid #2c3646; border-radius: 6px; padding: 3px; }
    #pv-row label { display: inline-flex; align-items: center; gap: 4px; cursor: pointer; user-select: none; }
    #pv-time { font: 600 14px ui-monospace, "JetBrains Mono", monospace; min-width: 210px; }
    #pv-info { color: #8fa0b6; margin-left: auto; font-size: 12px; }
    #pv-say { margin-top: 4px; color: #8fa0b6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-height: 17px; }
    #pv-say b { color: #fff; }
    #pv-err { position: fixed; left: 50%; top: 24px; transform: translateX(-50%); width: min(720px, calc(100vw - 32px)); max-height: 60vh; overflow: auto;
              background: #2a0f14; border: 1px solid #ff5f70; border-radius: 10px; padding: 14px 16px; color: #ffd9de; font: 13px/1.45 ui-monospace, monospace;
              white-space: pre-wrap; box-shadow: 0 8px 40px rgba(0,0,0,.7); z-index: 10; }
    #pv-err b { color: #fff; font-family: system-ui, sans-serif; }
    #pv-toast { position: fixed; right: 14px; top: 12px; background: #1d2430; border: 1px solid #2c3646; border-radius: 8px; padding: 6px 10px;
                color: #b9f5d8; opacity: 0; transition: opacity .4s; pointer-events: none; }`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  document.body.insertAdjacentHTML('beforeend', `
    <div id="pv-err" hidden></div><div id="pv-toast"></div>
    <div id="pv-bar">
      <canvas id="pv-tl"></canvas>
      <div id="pv-row">
        <button id="pv-prev" title="previous scene  [">⏮</button><button id="pv-play" title="play / pause  Space">▶</button><button id="pv-next" title="next scene  ]">⏭</button>
        <span id="pv-time">loading…</span>
        <select id="pv-speed" title="speed  1–4"><option value="0.25">¼×</option><option value="0.5">½×</option><option value="1" selected>1×</option><option value="2">2×</option></select>
        <label title="S"><input type="checkbox" id="pv-safe"> safe zones</label>
        <label title="L"><input type="checkbox" id="pv-loop"> loop scene</label>
        <label title="M"><input type="checkbox" id="pv-audio" checked> audio</label>
        <span id="pv-info"></span>
      </div>
      <div id="pv-say"></div>
    </div>`);

  /* ---------- state (kept in the URL, so a reload returns to the same moment) ---------- */
  const hs = new URLSearchParams(location.hash.slice(1));
  const S = { t: parseFloat(hs.get('t')) || 0, playing: false, speed: parseFloat(hs.get('speed')) || 1, loop: hs.get('loop') === '1',
    audioOn: hs.get('audio') !== '0', frame: -1, ms: 0, anchorT: 0, anchorClock: 0, clock: 'perf', dragging: false, hover: null, dirty: true, ui: true };
  window.DEBUG_SAFE = hs.get('safe') === '1';
  $('pv-safe').checked = window.DEBUG_SAFE; $('pv-loop').checked = S.loop; $('pv-audio').checked = S.audioOn; $('pv-speed').value = String(S.speed);
  const saveHash = () => history.replaceState(null, '', `#t=${S.t.toFixed(3)}&speed=${S.speed}&loop=${S.loop ? 1 : 0}&safe=${window.DEBUG_SAFE ? 1 : 0}&audio=${S.audioOn ? 1 : 0}`);

  /* ---------- errors ---------- */
  function showError(msg) {
    const e = $('pv-err');
    e.hidden = false;
    e.innerHTML = '<b>The video cannot be drawn</b>\n\n' + String(msg).replace(/[<&]/g, (c) => (c === '<' ? '&lt;' : '&amp;')) +
      '\n\n<b>Fix the file and save it: this page reloads by itself.</b>';
    pause();
  }
  window.addEventListener('error', (ev) => { if (window.READY) showError(ev.message + (ev.filename ? `\n  at ${ev.filename.replace(location.origin + '/', '')}:${ev.lineno}` : '')); });
  window.addEventListener('unhandledrejection', (ev) => showError((ev.reason && (ev.reason.stack || ev.reason.message)) || ev.reason));

  /* ---------- live reload ---------- */
  function toast(msg) { const t = $('pv-toast'); t.textContent = msg; t.style.opacity = 1; clearTimeout(toast.h); toast.h = setTimeout(() => { t.style.opacity = 0; }, 2200); }
  try {
    const es = new EventSource('/events');
    es.onmessage = (ev) => { saveHash(); sessionStorage.setItem('pv-changed', ev.data); location.reload(); };
  } catch (e) { /* no live reload without the preview server */ }
  const changed = sessionStorage.getItem('pv-changed');
  if (changed) { sessionStorage.removeItem('pv-changed'); try { setTimeout(() => toast('reloaded: ' + JSON.parse(changed).join(', ')), 300); } catch (e) { /* ignore */ } }

  /* ---------- audio: the full mix if built, else the narration ---------- */
  let AC = null, BUF = null, SRC = null, audioLabel = 'no audio';
  async function loadAudio() {
    for (const [file, label] of [['project/audio/mix_premaster.wav', 'full mix'], ['project/audio/narration_24k.wav', 'narration only']]) {
      try {
        const r = await fetch(file);
        if (!r.ok) continue;
        AC = AC || new (window.AudioContext || window.webkitAudioContext)();
        BUF = await AC.decodeAudioData(await r.arrayBuffer());
        audioLabel = label;
        return;
      } catch (e) { /* try the next file */ }
    }
  }
  function stopAudio() { if (SRC) { try { SRC.stop(); } catch (e) { /* already stopped */ } SRC.disconnect(); SRC = null; } }
  function startAudio(t) {
    stopAudio();
    if (!S.audioOn || !BUF || !AC) return false;
    AC.resume();
    SRC = AC.createBufferSource();
    SRC.buffer = BUF; SRC.playbackRate.value = S.speed;
    SRC.connect(AC.destination);
    SRC.start(0, Math.max(0, Math.min(t, BUF.duration - 0.01)));
    return true;
  }

  /* ---------- transport ---------- */
  /* the clock is whichever source playback started on: the audio hardware when audio plays, else the system */
  const clockNow = () => (S.clock === 'audio' ? AC.currentTime : performance.now() / 1000);
  function anchor() { S.clock = startAudio(S.t) ? 'audio' : 'perf'; S.anchorT = S.t; S.anchorClock = clockNow(); }
  function play() {
    if (!window.READY || S.playing) return;
    if (S.t >= DATA.dur - 1 / FPS) S.t = 0;
    S.playing = true;
    anchor();
    $('pv-play').textContent = '⏸';
  }
  function pause() {
    if (!S.playing) return;
    S.playing = false; stopAudio();
    $('pv-play').textContent = '▶';
    saveHash();
  }
  function seek(t) {
    S.t = clamp(t, 0, DATA.dur - 1 / FPS);
    if (S.playing) anchor();
    S.dirty = true; saveHash();
  }
  const sceneAt = (t) => { let k = 0; for (let i = 0; i < SCENES.length; i++) if (t >= SCENES[i].t0) k = i; return k; };
  /* like a media player: "previous" first returns to the start of the current scene */
  function stepScene(d) {
    const k = sceneAt(S.t);
    seek(SCENES[d < 0 && S.t - SCENES[k].t0 > 0.6 ? k : clamp(k + d, 0, SCENES.length - 1)].t0);
  }

  /* ---------- timeline ---------- */
  const tl = $('pv-tl');
  function drawTimeline() {
    const dpr = window.devicePixelRatio || 1, w = tl.clientWidth, h = tl.clientHeight;
    if (tl.width !== Math.round(w * dpr)) { tl.width = Math.round(w * dpr); tl.height = Math.round(h * dpr); }
    const g = tl.getContext('2d'), X = (t) => (t / DATA.dur) * w;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#0d1117'; g.fillRect(0, 0, w, h);
    const cur = sceneAt(S.t);
    SCENES.forEach((s, i) => {
      g.fillStyle = i === cur ? (S.loop ? '#20344a' : '#1b2533') : (i % 2 ? '#141b25' : '#111720');
      g.fillRect(X(s.t0), 0, X(s.t1) - X(s.t0) - 1, h);
      const name = `${i + 1} ${chapterName(s.id)}`;
      g.fillStyle = i === cur ? '#e8eef7' : '#7d8ca1'; g.font = '600 11px system-ui, sans-serif';
      if (X(s.t1) - X(s.t0) > 44) g.fillText(name, X(s.t0) + 5, 13, X(s.t1) - X(s.t0) - 10);
    });
    g.fillStyle = '#5d7a9c';
    for (const wd of DATA.words) g.fillRect(X(wd.t0), h - 12, 1, 9);                       // spoken words
    g.fillStyle = '#e8a33a';
    for (const s of SFX) g.fillRect(X(s.t) - 1, 20, 2, 5);                                  // sound cues
    if (S.hover != null) { g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(X(S.hover), 0, 1, h); }
    g.fillStyle = '#ffffff'; g.fillRect(Math.round(X(S.t)) - 1, 0, 2, h);
  }
  const tAtEvent = (ev) => { const r = tl.getBoundingClientRect(); return clamp((ev.clientX - r.left) / r.width) * DATA.dur; };
  tl.addEventListener('pointerdown', (ev) => { S.dragging = true; tl.setPointerCapture(ev.pointerId); seek(tAtEvent(ev)); });
  tl.addEventListener('pointermove', (ev) => { S.hover = tAtEvent(ev); if (S.dragging) seek(S.hover); else S.ui = true; });
  tl.addEventListener('pointerup', () => { S.dragging = false; });
  tl.addEventListener('pointerleave', () => { S.hover = null; S.ui = true; });

  /* ---------- read-outs ---------- */
  const fmtT = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(2).padStart(5, '0')}`;
  const esc = (s) => String(s).replace(/[<&>]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  function wordAt(t) { let w = null; for (const x of DATA.words) { if (x.t0 <= t + 0.02) w = x; else break; } return w && t <= w.t1 + 0.25 ? w : null; }
  function updateReadouts() {
    $('pv-time').textContent = `${fmtT(S.t)} / ${fmtT(DATA.dur)} · f ${S.frame}`;
    const k = sceneAt(S.t), ht = S.hover != null ? `   hover ${fmtT(S.hover)} ${chapterName(SCENES[sceneAt(S.hover)].id)}` : '';
    $('pv-info').textContent = `${chapterName(SCENES[k].id)} · ${S.ms.toFixed(0)} ms/frame · ${audioLabel}${ht}`;
    const take = DATA.takes.find((x) => S.t >= x.t0 - 0.3 && S.t <= x.t1 + x.pause_after);
    if (!take) { $('pv-say').textContent = ''; return; }
    const w = wordAt(S.t);
    $('pv-say').innerHTML = DATA.words.filter((x) => x.take === take.take)
      .map((x) => (x === w ? `<b>${esc(x.w)}</b>` : esc(x.w))).join(' ');
  }

  /* ---------- main loop ---------- */
  function tick() {
    if (window.READY && $('pv-err').hidden) {
      if (S.playing) {
        S.t = S.anchorT + (clockNow() - S.anchorClock) * S.speed;
        const sc = SCENES[sceneAt(S.anchorT)];
        if (S.loop && S.t >= sc.t1) seek(sc.t0);
        else if (S.t >= DATA.dur - 1 / FPS) { S.t = DATA.dur - 1 / FPS; pause(); }
      }
      const f = Math.min(window.TOTAL_FRAMES - 1, Math.floor(S.t * FPS + 1e-6));
      if (f !== S.frame || S.dirty) {
        const t0 = performance.now();
        try {
          CUR_FRAME = f; VMISS = [];
          renderFrame(f);
          /* film frames not loaded yet: fetch them (and the next few), then draw this frame again */
          const miss = VMISS.slice(), ahead = [];
          for (const m of MEDIA.values()) if (m.kind === 'Video' && m.lastFrameAt === f) for (let k = 1; k <= 8; k++) if (m.last + k < m.frames) ahead.push([m, m.last + k]);
          if (miss.length) _loadFrames(miss).then(() => { S.dirty = true; }).catch(() => {});
          if (ahead.length) _loadFrames(ahead).catch(() => {});
        } catch (e) { showError(`at ${fmtT(f / FPS)} (frame ${f}):\n${e.stack || e}`); }
        S.ms = S.ms ? S.ms * 0.8 + (performance.now() - t0) * 0.2 : performance.now() - t0;
        S.frame = f; S.dirty = false; S.ui = true;
      }
      if (S.ui) { drawTimeline(); updateReadouts(); S.ui = false; }
    }
    requestAnimationFrame(tick);
  }

  /* ---------- controls ---------- */
  $('pv-play').onclick = () => (S.playing ? pause() : play());
  $('pv-prev').onclick = () => stepScene(-1);
  $('pv-next').onclick = () => stepScene(1);
  $('pv-speed').onchange = (e) => { S.speed = parseFloat(e.target.value); if (S.playing) { pause(); play(); } saveHash(); };
  $('pv-safe').onchange = (e) => { window.DEBUG_SAFE = e.target.checked; S.dirty = true; saveHash(); };
  $('pv-loop').onchange = (e) => { S.loop = e.target.checked; S.ui = true; if (S.playing) anchor(); saveHash(); };
  $('pv-audio').onchange = (e) => { S.audioOn = e.target.checked; if (S.playing) { pause(); play(); } saveHash(); };
  window.addEventListener('keydown', (ev) => {
    if (!window.READY || ev.target.tagName === 'SELECT') return;
    const k = ev.key, step = ev.shiftKey ? 1 : 1 / FPS;
    if (k === ' ') { ev.preventDefault(); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); S.playing ? pause() : play(); }
    else if (k === 'ArrowRight') { pause(); seek(S.t + step); }
    else if (k === 'ArrowLeft') { pause(); seek(S.t - step); }
    else if (k === ']') stepScene(1);
    else if (k === '[') stepScene(-1);
    else if (k === 'Home') seek(0);
    else if (k === 'End') seek(DATA.dur);
    else if (k === 's' || k === 'S') $('pv-safe').click();
    else if (k === 'l' || k === 'L') $('pv-loop').click();
    else if (k === 'm' || k === 'M') $('pv-audio').click();
    else if ('1234'.includes(k)) { $('pv-speed').value = ['0.25', '0.5', '1', '2'][+k - 1]; $('pv-speed').onchange({ target: $('pv-speed') }); }
  });
  window.addEventListener('resize', () => { S.ui = true; });

  /* ---------- start once the engine has booted ---------- */
  const wait = setInterval(() => {
    if (window.BOOT_ERROR) { clearInterval(wait); showError(window.BOOT_ERROR); $('pv-time').textContent = 'not running'; return; }
    if (!window.READY) return;
    clearInterval(wait);
    S.t = clamp(S.t, 0, DATA.dur - 1 / FPS);
    loadAudio().then(() => { S.dirty = true; });
    document.title = `${VIDEO.title || 'video'} · preview`;
    requestAnimationFrame(tick);
  }, 40);
})();
