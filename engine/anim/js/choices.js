'use strict';
/* Loaded only by opted-in productions. Assets are declared during setup, ready before frame 0. */
const CHOICE_PREPARES = [];
const CHOICE_LOADED = { backends: ['native'], assets: [], renderers: [], cues: [] };
const CHOICE_IMAGES = new Map();
let CHOICES_READY = false;

function prepareChoices() {
  return Promise.all(CHOICE_PREPARES).then(() => { CHOICES_READY = true; });
}

function choiceTime(spec, fallback = 0) {
  if (spec == null) return fallback;
  if (typeof spec === 'number') return spec;
  if (spec.word) return at(spec.chapter, spec.word, spec.nth || 1, spec.edge || 't0') + (spec.offset || 0);
  if (spec.marker) {
    const marker = (VIDEO.clock || {}).markers?.[spec.marker];
    if (!marker) throw new Error('unknown clock marker ' + spec.marker);
    return choiceTime(marker) + (spec.offset || 0);
  }
  if (spec.frame != null) return spec.frame / FPS;
  if (spec.beat != null) return spec.beat * 60 / (VIDEO.clock?.bpm || VIDEO.music?.bpm || 100);
  if (spec.seconds != null) return spec.seconds;
  throw new Error('cue needs word, marker, frame, beat or seconds');
}

function projectImage(file) {
  if (CHOICES_READY) throw new Error('declare projectImage in scene setup, before frames');
  if (!file || /(^\/|\.\.|:)/.test(file)) throw new Error('art needs a local project or assets/ path');
  if (CHOICE_IMAGES.has(file)) return CHOICE_IMAGES.get(file);
  const handle = { file, image: null };
  CHOICE_IMAGES.set(file, handle);
  CHOICE_PREPARES.push(new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => { handle.image = image; CHOICE_LOADED.assets.push(file); resolve(); };
    image.onerror = () => reject(new Error('missing image ' + file + '; put it in the project and update the selected inputs'));
    image.src = file.startsWith('assets/production/') ? file : 'project/' + file;
  }));
  return handle;
}

function drawProjectImage(ctx, handle, x, y, width, { pivot = [0.5, 0.5], rotation = 0, alpha = 1, scale = 1 } = {}) {
  const img = handle.image;
  if (!img) throw new Error('image not preloaded: ' + handle.file);
  const height = width * img.naturalHeight / img.naturalWidth;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.scale(scale, scale); ctx.globalAlpha *= alpha;
  ctx.drawImage(img, -width * pivot[0], -height * pivot[1], width, height); ctx.restore();
}

function prepareChoice(sceneId) {
  const spec = VIDEO.choices?.shots?.[sceneId];
  if (!spec) throw new Error('no shot choice for ' + sceneId + '; run lockstep choose <video> shot ' + sceneId + ' <item>');
  const o = spec.inputs || {}, start = choiceTime(o.cue, beatOf(sceneId).t0), duration = o.duration || 3;
  CHOICE_LOADED.cues.push({ scene: sceneId, item: spec.item, t: start, source: o.cue || 'chapter start' });
  if (spec.item.startsWith('three.')) return prepareThreeChoice(spec, start);
  if (spec.item.startsWith('map.') || spec.item.startsWith('chart.')) return prepareMapChoice(spec, start);
  const art = spec.item === 'art.local' ? projectImage(o.asset) : null;
  return { draw(ctx, t) {
    const p = prog(t, start, start + duration), phase = t - start;
    const label = o.label;
    if (label) text(ctx, label, CX, 460, { align: 'center', size: 40, weight: 700, color: COL.ink });
    switch (spec.item) {
      case 'native.signal': {
        const points = o.points || [[180,800],[540,800],[540,620],[900,620]];
        const u = ((phase / duration) % 1 + 1) % 1;
        polySeg(ctx, points, COL.lineHi, 12, 0, 1);
        polySeg(ctx, points, COL.subject, 12, Math.max(0, u - .22), u);
        const point = polyAt(points, polyLen(points) * u);
        dot(ctx, point[0], point[1], 19, COL.accent);
        dot(ctx, points[0][0], points[0][1], 28, COL.subject);
        ring(ctx, points.at(-1)[0], points.at(-1)[1], 34, COL.subject, 5);
        break;
      }
      case 'native.evidence':
        panel(ctx, 170, 610, 740, 400);
        highlighter(ctx, 220, 715, 640, 68, COL.accent, E.out3(p));
        text(ctx, o.text || 'THE EVIDENCE', CX, 770, { align: 'center', size: 52, weight: 800, color: COL.ink });
        text(ctx, o.detail || 'A detail worth looking at.', CX, 900, { align: 'center', size: 27, color: COL.text });
        line(ctx, 780, 785, 850, 870, COL.subject, 5, p);
        break;
      case 'native.number':
        bigWord(ctx, String(Math.round((o.value ?? 42) * E.out3(p))), CX, 830, E.outBackSoft(prog(t, start, start + .35)), { size: 180, color: COL.accent });
        text(ctx, o.unit || 'UNITS', CX, 970, { align: 'center', size: 38, color: COL.ink });
        break;
      case 'native.scale': {
        const values = o.values || [1, 3], max = Math.max(...values);
        if (values.some(v => !Number.isFinite(v) || v < 0) || max <= 0) throw new Error('equal-scale values must be nonnegative, with a positive maximum');
        values.forEach((v, i) => {
          const y = 680 + i * 150;
          fillRR(ctx, 200, y, 660 * v / max * E.out3(p), 75, 8, i % 2 ? COL.accent : COL.subject);
          text(ctx, `${(o.labels || [])[i] || i + 1}  ·  ${v}`, 200, y - 18, { size: 30, color: COL.ink });
        });
        text(ctx, o.unit || 'SAME LINEAR SCALE', CX, 1100, { align: 'center', size: 28, color: COL.dim });
        break;
      }
      case 'native.parallax':
      case 'native.growth': {
        for (let z = 0; z < 3; z++) {
          const speed = o.speed ?? .18, drift = Math.sin(t * speed) * (18 + z * 38);
          const col = [COL.lineHi, COL.data, COL.subject][z];
          for (let k = 0; k < 7; k++) {
            const x = 100 + k * 160 + drift, height = (130 + hash(k + z * 11) * 180) * (spec.item === 'native.growth' ? E.out3(prog(p, k * .04, .6 + k * .04)) : 1);
            const base = 850 + z * 115;
            line(ctx, x, base, x + Math.sin(t * .5 + k) * (z + 1) * 7, base - height, col, 6 + z * 2);
            for (let leaf = 0; leaf < 3; leaf++) {
              ctx.save(); ctx.translate(x, base - height * (.35 + leaf * .2)); ctx.rotate((leaf % 2 ? -1 : 1) * (.6 + .06 * Math.sin(t + k)));
              ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(20, -8, 43 * height / 300, 15, -.3, 0, TAU); ctx.fill(); ctx.restore();
            }
          }
        }
        break;
      }
      case 'native.cell': {
        const split = E.io3(p), r = 125;
        for (const sign of [-1, 1]) {
          const x = CX + sign * split * 170;
          ctx.save(); ctx.translate(x, 820); ctx.scale(1 - .18 * Math.sin(p * Math.PI), 1 + .15 * Math.sin(p * Math.PI));
          dot(ctx, 0, 0, r, rgba(COL.subject, .25)); ring(ctx, 0, 0, r, COL.subject, 6);
          dot(ctx, sign * 22, 0, 34, COL.data);
          for (let k = 0; k < 8; k++) dot(ctx, 85 * Math.cos(k * TAU / 8 + t * .08), 85 * Math.sin(k * TAU / 8 + t * .08), 7, COL.accent);
          ctx.restore();
        }
        text(ctx, 'CELL DIVISION · SCHEMATIC', CX, 1090, { size: 30, align: 'center', color: COL.ink });
        break;
      }
      case 'native.zoom':
        withCam(ctx, { fx: CX, fy: 810, zoom: lerp(.6, 1.5, E.io3(p)) }, () => {
          ring(ctx, CX, 810, 220, COL.subject, 8);
          for (let k = 0; k < 8; k++) dot(ctx, CX + Math.cos(k * TAU / 8) * 140, 810 + Math.sin(k * TAU / 8) * 140, 22, COL.data);
          dot(ctx, CX, 810, 42, COL.accent);
        });
        break;
      case 'art.local':
        drawProjectImage(ctx, art, o.x ?? CX, o.y ?? 1050, o.width || 420, { pivot: o.pivot || [.5, 1], rotation: Math.sin(t * .8) * .06, scale: .85 + .15 * E.out3(p) });
        break;
      default: throw new Error('no visual recipe for ' + spec.item);
    }
  }};
}
