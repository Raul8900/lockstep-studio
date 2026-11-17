'use strict';
/* bootstrap.js — load the video's own code, then boot the engine.
   The render server lists components.js and scenes/*.js in project/manifest.json;
   they are loaded in that order before boot(). Shared by index.html (rendering)
   and preview.html (lockstep preview). */
(async function () {
  try {
    const manifest = await fetch('project/manifest.json').then((r) => r.json());
    for (const src of manifest.scripts) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src; s.async = false;
        s.onload = resolve;
        s.onerror = () => reject(new Error('could not load ' + src));
        document.body.appendChild(s);
      });
    }
    window.defineScenes = function () { for (const f of (window.SCENE_DEFS || [])) f(); };
    await boot();
  } catch (e) {
    window.BOOT_ERROR = String((e && e.stack) || e);
    console.error(e);
  }
})();
window.addEventListener('error', (ev) => { if (!window.READY) window.BOOT_ERROR = window.BOOT_ERROR || (ev.message + ' @ ' + ev.filename + ':' + ev.lineno); });
