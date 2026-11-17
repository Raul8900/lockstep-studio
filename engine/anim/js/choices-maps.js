'use strict';
CHOICE_LOADED.backends.push('maps');
window.prepareMapChoice = function (spec, start) {
  let world;
  if (spec.item === 'map.mercator') {
    CHOICE_PREPARES.push(fetch('/assets/production/countries.geojson').then(r => { if (!r.ok) throw new Error('missing Natural Earth geometry'); return r.json(); }).then(d => { world = d; CHOICE_LOADED.assets.push('assets/production/countries.geojson'); }));
  }
  return { draw(ctx, t) {
    const o = spec.inputs || {};
    if (world) {
      const projection = d3.geoMercator().scale(140).translate([540, 820]);
      const path = d3.geoPath(projection, ctx);
      ctx.save(); ctx.beginPath(); ctx.rect(90, 500, 900, 650); ctx.clip();
      for (const feature of world.features) {
        ctx.beginPath(); path(feature); ctx.fillStyle = feature.properties.name === (o.highlight || 'Greenland') ? COL.accent : COL.subject;
        ctx.fill(); ctx.strokeStyle = COL.panel; ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.restore();
      text(ctx, 'MERCATOR · NATURAL EARTH', CX, 1200, { align: 'center', size: 28, color: COL.ink });
    } else if (spec.item === 'chart.line') {
      const values = o.values || [2,3,1,5,7], max = Math.max(...values, 1);
      const points = values.map((v, i) => [160 + i * 760 / Math.max(1, values.length - 1), 1050 - v / max * 450]);
      line(ctx, 160, 550, 160, 1050, COL.dim, 3); line(ctx, 160, 1050, 940, 1050, COL.dim, 3);
      ctx.save(); ctx.beginPath(); ctx.rect(150, 540, 800 * prog(t, start, start + 2), 550); ctx.clip();
      ctx.beginPath(); d3.line().context(ctx)(points); ctx.strokeStyle = COL.subject; ctx.lineWidth = 7; ctx.stroke();
      points.forEach((p, i) => { dot(ctx, ...p, 10, COL.accent); text(ctx, String(values[i]), p[0], p[1] - 28, { align: 'center', size: 28, color: COL.ink }); });
      ctx.restore();
    }
  }};
};
