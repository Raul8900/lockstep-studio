'use strict';
/* =====================================================================
   components.js — drawing code shared by the scenes of “Why a Torn QR Code Still Scans”.
   The hero object is a REAL QR code: its module matrix, codeword map and damage shapes are
   generated and decode-tested by tools/qr_model.py (segno + reedsolo + zxing-cpp) and pasted
   between the markers below. Everything here is a pure function of its arguments.
   ===================================================================== */

/* QR-MODEL:BEGIN (written by tools/qr_model.py) */
const QRM = {"msg":"STILL HERE","n":21,"sticker":2.0,"matrix":["111111101100001111111","100000100110101000001","101110101100101011101","101110100010001011101","101110101111001011101","100000100011001000001","111111101010101111111","000000001011100000000","000001100001001010101","000111001011000011111","000110111010111100001","100001000110110101100","111101111110111000011","000000001110000001010","111111100010110010010","100000101101001011011","101110100001010011010","101110100110011101100","101110100101100010111","100000100001011001101","111111100011111111100"],"fn":["111111111000011111111","111111111000011111111","111111111000011111111","111111111000011111111","111111111000011111111","111111111000011111111","111111111111111111111","111111111000011111111","111111111000011111111","000000100000000000000","000000100000000000000","000000100000000000000","000000100000000000000","111111111000000000000","111111111000000000000","111111111000000000000","111111111000000000000","111111111000000000000","111111111000000000000","111111111000000000000","111111111000000000000"],"codewords":[[[20,20],[20,19],[19,20],[19,19],[18,20],[18,19],[17,20],[17,19]],[[16,20],[16,19],[15,20],[15,19],[14,20],[14,19],[13,20],[13,19]],[[12,20],[12,19],[11,20],[11,19],[10,20],[10,19],[9,20],[9,19]],[[9,18],[9,17],[10,18],[10,17],[11,18],[11,17],[12,18],[12,17]],[[13,18],[13,17],[14,18],[14,17],[15,18],[15,17],[16,18],[16,17]],[[17,18],[17,17],[18,18],[18,17],[19,18],[19,17],[20,18],[20,17]],[[20,16],[20,15],[19,16],[19,15],[18,16],[18,15],[17,16],[17,15]],[[16,16],[16,15],[15,16],[15,15],[14,16],[14,15],[13,16],[13,15]],[[12,16],[12,15],[11,16],[11,15],[10,16],[10,15],[9,16],[9,15]],[[9,14],[9,13],[10,14],[10,13],[11,14],[11,13],[12,14],[12,13]],[[13,14],[13,13],[14,14],[14,13],[15,14],[15,13],[16,14],[16,13]],[[17,14],[17,13],[18,14],[18,13],[19,14],[19,13],[20,14],[20,13]],[[20,12],[20,11],[19,12],[19,11],[18,12],[18,11],[17,12],[17,11]],[[16,12],[16,11],[15,12],[15,11],[14,12],[14,11],[13,12],[13,11]],[[12,12],[12,11],[11,12],[11,11],[10,12],[10,11],[9,12],[9,11]],[[8,12],[8,11],[7,12],[7,11],[5,12],[5,11],[4,12],[4,11]],[[3,12],[3,11],[2,12],[2,11],[1,12],[1,11],[0,12],[0,11]],[[0,10],[0,9],[1,10],[1,9],[2,10],[2,9],[3,10],[3,9]],[[4,10],[4,9],[5,10],[5,9],[7,10],[7,9],[8,10],[8,9]],[[9,10],[9,9],[10,10],[10,9],[11,10],[11,9],[12,10],[12,9]],[[13,10],[13,9],[14,10],[14,9],[15,10],[15,9],[16,10],[16,9]],[[17,10],[17,9],[18,10],[18,9],[19,10],[19,9],[20,10],[20,9]],[[12,8],[12,7],[11,8],[11,7],[10,8],[10,7],[9,8],[9,7]],[[9,5],[9,4],[10,5],[10,4],[11,5],[11,4],[12,5],[12,4]],[[12,3],[12,2],[11,3],[11,2],[10,3],[10,2],[9,3],[9,2]],[[9,1],[9,0],[10,1],[10,0],[11,1],[11,0],[12,1],[12,0]]],"values":[32,85,9,103,239,85,133,204,208,180,17,255,114,242,67,223,131,176,169,60,253,227,12,153,3,80],"data":9,"ec":17,"edges":[[[[20,21],[21,21]],[[21,20],[21,21]],[[19,21],[20,21]],[[19,20],[19,21]],[[21,19],[21,20]],[[19,19],[19,20]],[[21,18],[21,19]],[[19,18],[19,19]],[[20,17],[21,17]],[[21,17],[21,18]],[[19,17],[20,17]],[[19,17],[19,18]]],[[[20,17],[21,17]],[[21,16],[21,17]],[[19,17],[20,17]],[[19,16],[19,17]],[[21,15],[21,16]],[[19,15],[19,16]],[[21,14],[21,15]],[[19,14],[19,15]],[[20,13],[21,13]],[[21,13],[21,14]],[[19,13],[20,13]],[[19,13],[19,14]]],[[[20,13],[21,13]],[[21,12],[21,13]],[[19,13],[20,13]],[[19,12],[19,13]],[[21,11],[21,12]],[[19,11],[19,12]],[[21,10],[21,11]],[[19,10],[19,11]],[[20,9],[21,9]],[[21,9],[21,10]],[[19,9],[20,9]],[[19,9],[19,10]]],[[[18,9],[19,9]],[[19,9],[19,10]],[[17,9],[18,9]],[[17,9],[17,10]],[[19,10],[19,11]],[[17,10],[17,11]],[[19,11],[19,12]],[[17,11],[17,12]],[[18,13],[19,13]],[[19,12],[19,13]],[[17,13],[18,13]],[[17,12],[17,13]]],[[[18,13],[19,13]],[[19,13],[19,14]],[[17,13],[18,13]],[[17,13],[17,14]],[[19,14],[19,15]],[[17,14],[17,15]],[[19,15],[19,16]],[[17,15],[17,16]],[[18,17],[19,17]],[[19,16],[19,17]],[[17,17],[18,17]],[[17,16],[17,17]]],[[[18,17],[19,17]],[[19,17],[19,18]],[[17,17],[18,17]],[[17,17],[17,18]],[[19,18],[19,19]],[[17,18],[17,19]],[[19,19],[19,20]],[[17,19],[17,20]],[[18,21],[19,21]],[[19,20],[19,21]],[[17,21],[18,21]],[[17,20],[17,21]]],[[[16,21],[17,21]],[[17,20],[17,21]],[[15,21],[16,21]],[[15,20],[15,21]],[[17,19],[17,20]],[[15,19],[15,20]],[[17,18],[17,19]],[[15,18],[15,19]],[[16,17],[17,17]],[[17,17],[17,18]],[[15,17],[16,17]],[[15,17],[15,18]]],[[[16,17],[17,17]],[[17,16],[17,17]],[[15,17],[16,17]],[[15,16],[15,17]],[[17,15],[17,16]],[[15,15],[15,16]],[[17,14],[17,15]],[[15,14],[15,15]],[[16,13],[17,13]],[[17,13],[17,14]],[[15,13],[16,13]],[[15,13],[15,14]]],[[[16,13],[17,13]],[[17,12],[17,13]],[[15,13],[16,13]],[[15,12],[15,13]],[[17,11],[17,12]],[[15,11],[15,12]],[[17,10],[17,11]],[[15,10],[15,11]],[[16,9],[17,9]],[[17,9],[17,10]],[[15,9],[16,9]],[[15,9],[15,10]]],[[[14,9],[15,9]],[[15,9],[15,10]],[[13,9],[14,9]],[[13,9],[13,10]],[[15,10],[15,11]],[[13,10],[13,11]],[[15,11],[15,12]],[[13,11],[13,12]],[[14,13],[15,13]],[[15,12],[15,13]],[[13,13],[14,13]],[[13,12],[13,13]]],[[[14,13],[15,13]],[[15,13],[15,14]],[[13,13],[14,13]],[[13,13],[13,14]],[[15,14],[15,15]],[[13,14],[13,15]],[[15,15],[15,16]],[[13,15],[13,16]],[[14,17],[15,17]],[[15,16],[15,17]],[[13,17],[14,17]],[[13,16],[13,17]]],[[[14,17],[15,17]],[[15,17],[15,18]],[[13,17],[14,17]],[[13,17],[13,18]],[[15,18],[15,19]],[[13,18],[13,19]],[[15,19],[15,20]],[[13,19],[13,20]],[[14,21],[15,21]],[[15,20],[15,21]],[[13,21],[14,21]],[[13,20],[13,21]]],[[[12,21],[13,21]],[[13,20],[13,21]],[[11,21],[12,21]],[[11,20],[11,21]],[[13,19],[13,20]],[[11,19],[11,20]],[[13,18],[13,19]],[[11,18],[11,19]],[[12,17],[13,17]],[[13,17],[13,18]],[[11,17],[12,17]],[[11,17],[11,18]]],[[[12,17],[13,17]],[[13,16],[13,17]],[[11,17],[12,17]],[[11,16],[11,17]],[[13,15],[13,16]],[[11,15],[11,16]],[[13,14],[13,15]],[[11,14],[11,15]],[[12,13],[13,13]],[[13,13],[13,14]],[[11,13],[12,13]],[[11,13],[11,14]]],[[[12,13],[13,13]],[[13,12],[13,13]],[[11,13],[12,13]],[[11,12],[11,13]],[[13,11],[13,12]],[[11,11],[11,12]],[[13,10],[13,11]],[[11,10],[11,11]],[[12,9],[13,9]],[[13,9],[13,10]],[[11,9],[12,9]],[[11,9],[11,10]]],[[[12,9],[13,9]],[[13,8],[13,9]],[[11,9],[12,9]],[[11,8],[11,9]],[[12,7],[13,7]],[[13,7],[13,8]],[[11,7],[12,7]],[[11,7],[11,8]],[[12,6],[13,6]],[[13,5],[13,6]],[[11,6],[12,6]],[[11,5],[11,6]],[[12,4],[13,4]],[[13,4],[13,5]],[[11,4],[12,4]],[[11,4],[11,5]]],[[[12,4],[13,4]],[[13,3],[13,4]],[[11,4],[12,4]],[[11,3],[11,4]],[[13,2],[13,3]],[[11,2],[11,3]],[[13,1],[13,2]],[[11,1],[11,2]],[[12,0],[13,0]],[[13,0],[13,1]],[[11,0],[12,0]],[[11,0],[11,1]]],[[[10,0],[11,0]],[[11,0],[11,1]],[[9,0],[10,0]],[[9,0],[9,1]],[[11,1],[11,2]],[[9,1],[9,2]],[[11,2],[11,3]],[[9,2],[9,3]],[[10,4],[11,4]],[[11,3],[11,4]],[[9,4],[10,4]],[[9,3],[9,4]]],[[[10,4],[11,4]],[[11,4],[11,5]],[[9,4],[10,4]],[[9,4],[9,5]],[[10,6],[11,6]],[[11,5],[11,6]],[[9,6],[10,6]],[[9,5],[9,6]],[[10,7],[11,7]],[[11,7],[11,8]],[[9,7],[10,7]],[[9,7],[9,8]],[[10,9],[11,9]],[[11,8],[11,9]],[[9,9],[10,9]],[[9,8],[9,9]]],[[[10,9],[11,9]],[[11,9],[11,10]],[[9,9],[10,9]],[[9,9],[9,10]],[[11,10],[11,11]],[[9,10],[9,11]],[[11,11],[11,12]],[[9,11],[9,12]],[[10,13],[11,13]],[[11,12],[11,13]],[[9,13],[10,13]],[[9,12],[9,13]]],[[[10,13],[11,13]],[[11,13],[11,14]],[[9,13],[10,13]],[[9,13],[9,14]],[[11,14],[11,15]],[[9,14],[9,15]],[[11,15],[11,16]],[[9,15],[9,16]],[[10,17],[11,17]],[[11,16],[11,17]],[[9,17],[10,17]],[[9,16],[9,17]]],[[[10,17],[11,17]],[[11,17],[11,18]],[[9,17],[10,17]],[[9,17],[9,18]],[[11,18],[11,19]],[[9,18],[9,19]],[[11,19],[11,20]],[[9,19],[9,20]],[[10,21],[11,21]],[[11,20],[11,21]],[[9,21],[10,21]],[[9,20],[9,21]]],[[[8,13],[9,13]],[[9,12],[9,13]],[[7,13],[8,13]],[[7,12],[7,13]],[[9,11],[9,12]],[[7,11],[7,12]],[[9,10],[9,11]],[[7,10],[7,11]],[[8,9],[9,9]],[[9,9],[9,10]],[[7,9],[8,9]],[[7,9],[7,10]]],[[[5,9],[6,9]],[[6,9],[6,10]],[[4,9],[5,9]],[[4,9],[4,10]],[[6,10],[6,11]],[[4,10],[4,11]],[[6,11],[6,12]],[[4,11],[4,12]],[[5,13],[6,13]],[[6,12],[6,13]],[[4,13],[5,13]],[[4,12],[4,13]]],[[[3,13],[4,13]],[[4,12],[4,13]],[[2,13],[3,13]],[[2,12],[2,13]],[[4,11],[4,12]],[[2,11],[2,12]],[[4,10],[4,11]],[[2,10],[2,11]],[[3,9],[4,9]],[[4,9],[4,10]],[[2,9],[3,9]],[[2,9],[2,10]]],[[[1,9],[2,9]],[[2,9],[2,10]],[[0,9],[1,9]],[[0,9],[0,10]],[[2,10],[2,11]],[[0,10],[0,11]],[[2,11],[2,12]],[[0,11],[0,12]],[[1,13],[2,13]],[[2,12],[2,13]],[[0,13],[1,13]],[[0,12],[0,13]]]],"tear":[[10.2,23.0],[11.007,22.384],[11.81,21.766],[12.563,21.096],[13.389,20.5],[13.942,19.631],[14.795,19.062],[14.811,17.656],[15.862,17.284],[16.945,16.945],[17.427,16.005],[18.334,15.49],[18.432,14.166],[19.42,13.731],[19.958,12.847],[20.901,12.367],[21.635,11.68],[21.91,10.532],[23.0,10.2],[23.0,23.0]],"tearEdge":[[10.2,23.0],[11.007,22.384],[11.81,21.766],[12.563,21.096],[13.389,20.5],[13.942,19.631],[14.795,19.062],[14.811,17.656],[15.862,17.284],[16.945,16.945],[17.427,16.005],[18.334,15.49],[18.432,14.166],[19.42,13.731],[19.958,12.847],[20.901,12.367],[21.635,11.68],[21.91,10.532],[23.0,10.2]],"finderTear":[[-2.0,-2.0],[5.2,-2.0],[4.567,-1.193],[3.933,-0.387],[2.965,0.085],[2.532,1.092],[1.582,1.582],[0.946,2.386],[0.379,3.259],[-0.564,3.756],[-1.051,4.709],[-2.0,5.2]],"finderEdge":[[5.2,-2.0],[4.567,-1.193],[3.933,-0.387],[2.965,0.085],[2.532,1.092],[1.582,1.582],[0.946,2.386],[0.379,3.259],[-0.564,3.756],[-1.051,4.709],[-2.0,5.2]],"logo":[[7,7],[14,7],[14,14],[7,14]],"damage":{"tear":{"changed_codewords":[0,1,2,4,5,6,11],"function_modules_hit":0,"area_of_code":0.0858,"modules":[[12,20],[13,19],[13,20],[14,18],[14,19],[14,20],[15,18],[15,19],[15,20],[16,17],[16,18],[16,19],[16,20],[17,15],[17,16],[17,17],[17,18],[17,19],[17,20],[18,15],[18,16],[18,17],[18,18],[18,19],[18,20],[19,14],[19,15],[19,16],[19,17],[19,18],[19,19],[19,20],[20,13],[20,14],[20,15],[20,16],[20,17],[20,18],[20,19],[20,20]]},"logo":{"changed_codewords":[9,14,15,18,19,20,22],"function_modules_hit":8,"area_of_code":0.1143,"modules":[[7,7],[7,8],[7,9],[7,10],[7,11],[7,12],[7,13],[8,7],[8,8],[8,9],[8,10],[8,11],[8,12],[8,13],[9,7],[9,8],[9,9],[9,10],[9,11],[9,12],[9,13],[10,7],[10,8],[10,9],[10,10],[10,11],[10,12],[10,13],[11,7],[11,8],[11,9],[11,10],[11,11],[11,12],[11,13],[12,7],[12,8],[12,9],[12,10],[12,11],[12,12],[12,13],[13,7],[13,8],[13,9],[13,10],[13,11],[13,12],[13,13]]},"finder_tear":{"changed_codewords":[],"function_modules_hit":6,"area_of_code":0.0129,"modules":[[0,0],[0,1],[0,2],[1,0],[1,1],[2,0]]}}};
/* QR-MODEL:END */

/* ---------- the model, parsed once ---------- */
const QN = QRM.n, QS = QRM.sticker, QE = QRM.n + QRM.sticker;
const QDARK = QRM.matrix.map((row) => Array.from(row, (ch) => ch === '1'));
const QFN = QRM.fn.map((row) => Array.from(row, (ch) => ch === '1'));
const QOWNER = (() => {                       // owner[r][c] = codeword index or -1 (function module)
  const o = Array.from({ length: QN }, () => new Array(QN).fill(-1));
  QRM.codewords.forEach((mods, k) => mods.forEach(([r, c]) => { o[r][c] = k; }));
  return o;
})();
const QMSG = (k) => k < QRM.data;            // codewords 0..8 carry the message, 9..25 are check bytes
const QTORN = QRM.damage.tear.changed_codewords;          // codewords the hook's tear changes
const QTORN_MSG = QTORN.filter(QMSG);                     // six of them are message bytes
/* centre of a codeword in module coordinates */
const QCW_C = QRM.codewords.map((mods) => [mods.reduce((s, m) => s + m[1] + 0.5, 0) / 8, mods.reduce((s, m) => s + m[0] + 0.5, 0) / 8]);
/* is a codeword (at least partly) inside the torn-off corner? */
const QIN_PIECE = QRM.codewords.map((mods) => mods.some(([r, c]) => QRM.damage.tear.modules.some((m) => m[0] === r && m[1] === c)));

/* ---------- geometry helpers (module coordinates -> local px) ---------- */
function qPath(ctx, pts, m) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => { const X = (x - QN / 2) * m, Y = (y - QN / 2) * m; if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
  ctx.closePath();
}
/* the sticker outline with optional tears removed (clockwise, module coordinates) */
function qBodyPoly(hero, finder) {
  const pts = [];
  if (finder) pts.push(QRM.finderEdge[0]); else pts.push([-QS, -QS]);
  pts.push([QE, -QS]);
  if (hero) { const e = QRM.tearEdge; for (let i = e.length - 1; i >= 0; i--) pts.push(e[i]); }
  else pts.push([QE, QE]);
  pts.push([-QS, QE]);
  if (finder) { const e = QRM.finderEdge; for (let i = e.length - 1; i >= 0; i--) pts.push(e[i]); }
  return pts;
}
/* a finer ragged edge for drawing: subdivide each segment with small deterministic jitter */
function qFineEdge(edge, seed) {
  const out = [];
  for (let i = 0; i < edge.length - 1; i++) {
    const [x0, y0] = edge[i], [x1, y1] = edge[i + 1];
    for (let k = 0; k < 4; k++) {
      const u = k / 4, j = (hash(seed + i * 7.1 + k * 1.7) - 0.5) * 0.18;
      out.push([lerp(x0, x1, u) + j, lerp(y0, y1, u) - j]);
    }
  }
  out.push(edge[edge.length - 1]);
  return out;
}
const QFINE_TEAR = qFineEdge(QRM.tearEdge, 3);
const QFINE_FINDER = qFineEdge(QRM.finderEdge, 9);
function polyCentroid(pts) { let x = 0, y = 0; pts.forEach((p) => { x += p[0]; y += p[1]; }); return [x / pts.length, y / pts.length]; }
const QPIECE_C = polyCentroid(QRM.tear);
const QFPIECE_C = polyCentroid(QRM.finderTear);

/* torn-paper rim: a white fibrous band along a tear edge (drawn inside the current clip) */
function tornRim(ctx, edge, m, seed) {
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  edge.forEach(([x, y], i) => { const X = (x - QN / 2) * m, Y = (y - QN / 2) * m; if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = Math.max(4, m * 0.32); ctx.stroke();
  ctx.strokeStyle = rgba(COL.ink, 0.10); ctx.lineWidth = 1.4; ctx.stroke();
  /* fibres */
  ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 1.6;
  for (let i = 0; i < edge.length - 1; i++) {
    const [x0, y0] = edge[i], [x1, y1] = edge[i + 1];
    for (let k = 0; k < 2; k++) {
      const u = hash(seed + i * 3.3 + k), X = (lerp(x0, x1, u) - QN / 2) * m, Y = (lerp(y0, y1, u) - QN / 2) * m;
      const a = hash(seed * 2 + i + k * 5) * TAU, L = m * (0.18 + 0.25 * hash(seed + i * 1.9 + k * 2.7));
      ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + Math.cos(a) * L, Y + Math.sin(a) * L); ctx.stroke();
    }
  }
  ctx.restore();
}

/* the modules (and optional brick colouring) of the code, in local px; draw inside a clip */
function qModules(ctx, m, o) {
  const ink = COL.ink, bricks = o.bricks, fnTint = o.fnTint || 0, byteTint = o.byteTint || 0;
  const pad = 0.6;
  for (let r = 0; r < QN; r++) {
    for (let c = 0; c < QN; c++) {
      const X = (c - QN / 2) * m, Y = (r - QN / 2) * m, k = QOWNER[r][c];
      const b = bricks && k >= 0 ? bricks(k) : null;
      if (QDARK[r][c]) {
        let col = ink;
        if (b && b.a > 0) col = mixHex(ink, b.c, clamp(b.a) * 0.92);
        else if (k < 0 && fnTint > 0) col = mixHex(ink, COL.panel, 0.62 * fnTint);
        ctx.fillStyle = col; ctx.fillRect(X - pad / 2, Y - pad / 2, m + pad, m + pad);
      } else if (b && b.a > 0) {
        ctx.fillStyle = rgba(b.c, 0.17 * clamp(b.a)); ctx.fillRect(X, Y, m, m);
      }
      if (k >= 0 && byteTint > 0) { ctx.fillStyle = rgba(COL.subject, 0.13 * byteTint); ctx.fillRect(X, Y, m, m); }
      if (k < 0 && fnTint > 0 && !QDARK[r][c]) { ctx.fillStyle = rgba(COL.dim, 0.16 * fnTint); ctx.fillRect(X, Y, m, m); }
    }
  }
  if (fnTint > 0) {                                   // hatch the non-byte (function) area
    ctx.save();
    ctx.strokeStyle = rgba(COL.dim, 0.5 * fnTint); ctx.lineWidth = 1.5;
    for (let r = 0; r < QN; r++) for (let c = 0; c < QN; c++) {
      if (QOWNER[r][c] >= 0) continue;
      const X = (c - QN / 2) * m, Y = (r - QN / 2) * m;
      ctx.beginPath(); ctx.moveTo(X, Y + m); ctx.lineTo(X + m, Y); ctx.stroke();
    }
    ctx.restore();
  }
  if (bricks) {                                       // outlines of the codewords
    for (let k = 0; k < QRM.codewords.length; k++) {
      const b = bricks(k);
      if (!b || !(b.o > 0)) continue;
      ctx.save();
      ctx.strokeStyle = b.oc || ink; ctx.globalAlpha *= clamp(b.o); ctx.lineWidth = b.ow || 3; ctx.lineCap = 'square';
      if (b.dash) ctx.setLineDash(b.dash);
      ctx.beginPath();
      for (const [[x0, y0], [x1, y1]] of QRM.edges[k]) {
        ctx.moveTo((x0 - QN / 2) * m, (y0 - QN / 2) * m); ctx.lineTo((x1 - QN / 2) * m, (y1 - QN / 2) * m);
      }
      ctx.stroke(); ctx.restore();
    }
  }
}

/* ---------- the sticker ----------
   o: { cx, cy, m, rot, hero (torn corner removed), piece {dx, dy, rot, alpha} (where the torn
   piece is drawn, null = not drawn), finder (finder tear removed), fpiece {dx,dy,rot,alpha},
   bricks(k) -> {c, a, o, oc, ow, dash}, byteTint, fnTint, logo (0..1), logoSee (0..1),
   ghost (0..1 dashed outline of the missing hero piece), ghostBricks(k) -> same as bricks, cut (0..1 dashed tear line) } */
function drawSticker(ctx, o) {
  const m = o.m, sh = STYLE.shape.shadow || { dx: 9, dy: 9 };
  ctx.save();
  ctx.translate(o.cx, o.cy); if (o.rot) ctx.rotate(o.rot);
  const body = qBodyPoly(!!o.hero, !!o.finder);
  /* misregistered blue second ink under the sticker */
  ctx.save(); ctx.translate(sh.dx, sh.dy); qPath(ctx, body, m); ctx.fillStyle = COL.subject; ctx.fill(); ctx.restore();
  qPath(ctx, body, m); ctx.fillStyle = COL.panel; ctx.fill();
  ctx.strokeStyle = rgba(COL.ink, 0.22); ctx.lineWidth = 1.5; ctx.stroke();
  ctx.save(); qPath(ctx, body, m); ctx.clip();
  qModules(ctx, m, o);
  if (o.hero) tornRim(ctx, QFINE_TEAR, m, 11);
  if (o.finder) tornRim(ctx, QFINE_FINDER, m, 23);
  ctx.restore();
  /* a printed "tear here" line on the intact sticker (cover frame) */
  if (o.cut > 0 && !o.hero) {
    ctx.save(); ctx.globalAlpha *= clamp(o.cut);
    ctx.setLineDash([m * 0.55, m * 0.38]); ctx.lineWidth = 4; ctx.strokeStyle = COL.alert; ctx.lineCap = 'round';
    ctx.beginPath(); QRM.tearEdge.forEach(([x, y], i) => { const X = (x - QN / 2) * m, Y = (y - QN / 2) * m; if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
    ctx.stroke(); ctx.restore();
    const [ex, ey] = QRM.tearEdge[QRM.tearEdge.length - 1];
    icon(ctx, 'scissors', (ex - QN / 2) * m - 6, (ey - QN / 2) * m - 34, 46, COL.alert, { lw: 2.2, alpha: clamp(o.cut) });
  }
  /* logo plate: a blank 7 x 7-module square in the middle with a generic cup icon */
  if (o.logo > 0) {
    const L = QRM.logo, x0 = (L[0][0] - QN / 2) * m, y0 = (L[0][1] - QN / 2) * m, s = (L[1][0] - L[0][0]) * m;
    const e = E.outBack(clamp(o.logo)), sc = lerp(1.6, 1, e), a = clamp(o.logo * 2);
    ctx.save(); ctx.translate(x0 + s / 2, y0 + s / 2); ctx.scale(sc, sc); ctx.globalAlpha *= a;
    const see = clamp(o.logoSee || 0);
    fillRR(ctx, -s / 2 + 6, -s / 2 + 6, s, s, 14, rgba(COL.accent, 1 - see * 0.7));
    fillRR(ctx, -s / 2, -s / 2, s, s, 14, rgba(COL.panel, 1 - see * 0.82));
    strokeRR(ctx, -s / 2, -s / 2, s, s, 14, COL.accent, 3);
    icon(ctx, 'coffee', 0, 0, s * 0.56, COL.accent, { lw: 1.6, alpha: 1 - see * 0.85 });
    ctx.restore();
  }
  /* ghost of the missing hero piece */
  if (o.ghost > 0) {
    ctx.save(); ctx.globalAlpha *= clamp(o.ghost);
    if (o.ghostBricks) { ctx.save(); qPath(ctx, QRM.tear, m); ctx.clip(); qGhostBricks(ctx, m, o.ghostBricks); ctx.restore(); }
    ctx.setLineDash([10, 8]); ctx.lineWidth = 3.5; ctx.strokeStyle = COL.alert;
    qPath(ctx, QRM.tear, m); ctx.stroke();
    ctx.restore();
  }
  /* the torn pieces, wherever they are */
  for (const [pc, poly, edge, cen, seed] of [[o.piece, QRM.tear, QFINE_TEAR, QPIECE_C, 11], [o.fpiece, QRM.finderTear, QFINE_FINDER, QFPIECE_C, 23]]) {
    if (!pc || !(pc.alpha > 0)) continue;
    const cxp = (cen[0] - QN / 2) * m, cyp = (cen[1] - QN / 2) * m;
    ctx.save(); ctx.globalAlpha *= clamp(pc.alpha);
    ctx.translate(cxp + (pc.dx || 0), cyp + (pc.dy || 0)); ctx.rotate(pc.rot || 0); ctx.translate(-cxp, -cyp);
    ctx.save(); ctx.translate(sh.dx * 0.8, sh.dy * 0.8); qPath(ctx, poly, m); ctx.fillStyle = COL.subject; ctx.fill(); ctx.restore();
    qPath(ctx, poly, m); ctx.fillStyle = COL.panel; ctx.fill();
    ctx.save(); qPath(ctx, poly, m); ctx.clip(); qModules(ctx, m, {}); tornRim(ctx, edge, m, seed); ctx.restore();
    ctx.restore();
  }
  ctx.restore();
}
/* bricks drawn as ghosts (outline + soft fill) where the paper is missing */
function qGhostBricks(ctx, m, fn) {
  for (let k = 0; k < QRM.codewords.length; k++) {
    const b = fn(k);
    if (!b) continue;
    const f = clamp(b.fill || 0);
    for (const [r, c] of QRM.codewords[k]) {
      const X = (c - QN / 2) * m, Y = (r - QN / 2) * m;
      if (f > 0) {
        if (QDARK[r][c]) { ctx.fillStyle = mixHex(COL.ink, b.c, 0.9, f); ctx.fillRect(X - 0.3, Y - 0.3, m + 0.6, m + 0.6); }
        else { ctx.fillStyle = rgba(b.c, 0.17 * f); ctx.fillRect(X, Y, m, m); }
      }
      ctx.fillStyle = rgba(b.c, 0.12 * clamp(b.a) * (1 - f)); ctx.fillRect(X, Y, m, m);
    }
    ctx.save(); ctx.strokeStyle = b.c; ctx.globalAlpha *= clamp(b.a); ctx.lineWidth = 3; ctx.setLineDash(f >= 1 ? [] : [7, 6]);
    ctx.beginPath();
    for (const [[x0, y0], [x1, y1]] of QRM.edges[k]) { ctx.moveTo((x0 - QN / 2) * m, (y0 - QN / 2) * m); ctx.lineTo((x1 - QN / 2) * m, (y1 - QN / 2) * m); }
    ctx.stroke(); ctx.restore();
  }
}
/* screen position of a module-coordinate point for a sticker drawn with (cx, cy, m) and no rotation */
const qScreen = (cx, cy, m, x, y) => [cx + (x - QN / 2) * m, cy + (y - QN / 2) * m];

/* ---------- the scanner: four corner brackets + an optional sweep ----------
   state colour: 'idle' (subject), 'lock' (good), 'fail' (alert); p = appear; k = how far the
   brackets have snapped in (0 = loose, 1 = tight to the box) */
function brackets(ctx, x0, y0, x1, y1, o = {}) {
  const { p = 1, k = 0, col = COL.subject, lw = 9, arm = 74, loose = 34, jx = 0, jy = 0, alpha = 1 } = o;
  if (p <= 0 || alpha <= 0) return;
  const g = lerp(loose, 0, clamp(k)) + (1 - E.out3(clamp(p))) * 40;
  const X0 = x0 - g + jx, Y0 = y0 - g + jy, X1 = x1 + g + jx, Y1 = y1 + g + jy;
  ctx.save(); ctx.globalAlpha *= clamp(p * 1.6) * alpha;
  ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'square'; ctx.lineJoin = 'miter';
  for (const [x, y, sx, sy] of [[X0, Y0, 1, 1], [X1, Y0, -1, 1], [X1, Y1, -1, -1], [X0, Y1, 1, -1]]) {
    ctx.beginPath(); ctx.moveTo(x, y + sy * arm); ctx.lineTo(x, y); ctx.lineTo(x + sx * arm, y); ctx.stroke();
  }
  ctx.restore();
}
function scanSweep(ctx, x0, y0, x1, y1, u, col = COL.subject) {
  if (u <= 0 || u >= 1) return;
  const y = lerp(y0, y1, u), a = Math.sin(Math.PI * u);
  ctx.save();
  const g = ctx.createLinearGradient(0, y - 60, 0, y);
  g.addColorStop(0, rgba(col, 0)); g.addColorStop(1, rgba(col, 0.22 * a));
  ctx.fillStyle = g; ctx.fillRect(x0, y - 60, x1 - x0, 60);
  ctx.fillStyle = rgba(col, 0.9 * a); ctx.fillRect(x0 - 10, y - 2.5, x1 - x0 + 20, 5);
  ctx.restore();
}
/* readout pill: "✓ STILL HERE" (ok) or "✕ NO CODE FOUND" (fail) */
function readout(ctx, x, y, label, ok, p, o = {}) {
  if (p <= 0) return;
  const e = E.outBack(clamp(p)), size = o.size || 34, h = o.h || 74;
  const tw0 = measure(ctx, label, size, 800, F.ui, 2), w = tw0 + h + 46;
  const bg = ok ? COL.good : COL.alert;
  ctx.save(); ctx.translate(x, y); ctx.scale(lerp(0.6, 1, e), lerp(0.6, 1, e)); ctx.globalAlpha *= clamp(p * 2.5);
  fillRR(ctx, -w / 2 + 7, -h / 2 + 7, w, h, h / 2, rgba(COL.ink, 0.9));
  fillRR(ctx, -w / 2, -h / 2, w, h, h / 2, bg);
  const ix = -w / 2 + h / 2 + 8;
  dot(ctx, ix, 0, h * 0.34, COL.panel);
  if (ok) check(ctx, ix, 2, h * 0.36, bg, clamp(p * 2 - 0.3), 6);
  else cross(ctx, ix, 0, h * 0.13, bg, clamp(p * 2 - 0.3), 6);
  text(ctx, label, ix + h * 0.34 + 18, size * 0.36, { size, weight: 800, family: F.ui, color: COL.panel, ls: 2 });
  ctx.restore();
}

/* ---------- small print-shop pieces ---------- */
/* a label stamped at an angle, with a hard offset shadow */
function stampLabel(ctx, str, x, y, p, o = {}) {
  if (p <= 0) return;
  const { col = COL.alert, size = 40, rot = -0.08, family = F.disp } = o;
  const e = E.outBack(clamp(p)), sc = lerp(1.8, 1, e);
  const w = measure(ctx, str, size, 400, family, 3) + 44, h = size * 1.5;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.globalAlpha *= clamp(p * 3);
  fillRR(ctx, -w / 2, -h / 2, w, h, 6, rgba(COL.panel, 0.92));
  strokeRR(ctx, -w / 2, -h / 2, w, h, 6, col, 5);
  text(ctx, str, 0, size * 0.36, { size, weight: 400, family, color: col, align: 'center', ls: 3 });
  ctx.restore();
}
/* a filled pill tag ("ATTEMPT 1") */
function tagPill(ctx, str, x, y, col, p = 1, o = {}) {
  if (p <= 0) return;
  const e = E.outBack(clamp(p));
  ctx.save(); ctx.translate(x, y); ctx.scale(lerp(0.7, 1, e), lerp(0.7, 1, e));
  pill(ctx, str, 0, 0, { bg: col, color: COL.panel, size: o.size || 28, alpha: clamp(p * 2.5), align: o.align || 'center', ls: 3, r: 6 });
  ctx.restore();
}
/* the 26-byte strip: cells coloured by fn(i) -> {c, a, q} */
function byteStrip(ctx, x0, y, cell, gap, fn) {
  for (let i = 0; i < 26; i++) {
    const s = fn(i);
    if (!s || s.p <= 0) continue;
    const x = x0 + i * (cell + gap), e = E.outBack(clamp(s.p));
    ctx.save(); ctx.translate(x + cell / 2, y); ctx.scale(e, e);
    fillRR(ctx, -cell / 2 + 3, -cell / 2 + 3, cell, cell * 1.3, 3, rgba(COL.ink, 0.85));
    fillRR(ctx, -cell / 2, -cell / 2, cell, cell * 1.3, 3, s.c);
    if (s.q > 0) text(ctx, '?', 0, cell * 0.45, { size: cell * 0.8, weight: 800, family: F.ui, color: COL.panel, align: 'center', alpha: clamp(s.q) });
    ctx.restore();
  }
}

/* ---------- the graph card (attempt 2 and the liar) ---------- */
const GC = { x: 110, y: 492, w: 860, h: 640, xs: [250, 430, 610, 790], y0: 1080, dv: 60 };
const gX = (i) => GC.xs[i];
const gY = (v) => GC.y0 - v * GC.dv;
const gLine = (v0, v1, x) => v0 + (v1 - v0) * (x - GC.xs[0]) / (GC.xs[1] - GC.xs[0]);   // value of the line through dots 0,1
function graphGrid(ctx) {
  ctx.save();
  ctx.fillStyle = rgba(COL.subject, 0.07);
  for (let x = GC.x + 40; x < GC.x + GC.w; x += 60) ctx.fillRect(x, GC.y + 20, 1.5, GC.h - 40);
  for (let y = GC.y0; y > GC.y + 20; y -= 60) ctx.fillRect(GC.x + 20, y, GC.w - 40, 1.5);
  ctx.fillStyle = rgba(COL.ink, 0.35); ctx.fillRect(GC.x + 50, GC.y0 + 10, GC.w - 100, 3);
  ctx.restore();
}
/* a dot with its value label */
function gDot(ctx, x, y, col, p, label, o = {}) {
  if (p <= 0) return;
  const e = E.outBack(clamp(p)), r = (o.r || 24) * e;
  if (o.ghost) {
    ctx.save(); ctx.setLineDash([6, 5]); ring(ctx, x, y, o.r || 24, col, 3.5, clamp(p)); ctx.restore();
  } else {
    dot(ctx, x + 4, y + 4, r, COL.ink, 0.85 * clamp(p * 2));
    dot(ctx, x, y, r, col, clamp(p * 2));
    ring(ctx, x, y, r, COL.ink, 3, clamp(p * 2));
  }
  if (label != null) text(ctx, label, x - 38, y - 30, { size: 40, weight: 700, family: F.mono, color: o.lc || col, align: 'right', alpha: clamp(p * 2) * (o.la == null ? 1 : o.la) });
}
/* the full-width ruler line through value v at x0 = xs[0] with slope s per step */
function gRule(ctx, vA, slope, p, col = COL.subject, o = {}) {
  if (p <= 0) return;
  const xa = GC.x + 40, xb = GC.x + GC.w - 40, step = GC.xs[1] - GC.xs[0];
  const va = vA + slope * (xa - GC.xs[0]) / step, vb = vA + slope * (xb - GC.xs[0]) / step;
  const from = o.from === 'right' ? [[xb, gY(vb)], [xa, gY(va)]] : [[xa, gY(va)], [xb, gY(vb)]];
  polyline(ctx, from, col, o.lw || 7, clamp(p), o.alpha == null ? 1 : o.alpha);
}

/* a vertical strip torn out of a card: returns [left polygon, strip polygon, right polygon] */
function tornStripPolys(x0, y0, x1, y1, a, b, seed) {
  const n = 14, L = [], R = [];
  for (let i = 0; i <= n; i++) {
    const y = lerp(y0, y1, i / n);
    L.push([a + (hash(seed + i * 1.37) - 0.5) * 26 + (i % 2 ? 6 : -6), y]);
    R.push([b + (hash(seed + 50 + i * 2.11) - 0.5) * 26 + (i % 2 ? -6 : 6), y]);
  }
  const left = [[x0, y0], ...L, [x0, y1]];
  const strip = [...L, ...R.slice().reverse()];
  const right = [...R, [x1, y1], [x1, y0]];
  return [left, strip, right];
}
function polyPath(ctx, pts) { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); }
function rimLine(ctx, pts) {
  ctx.save(); ctx.lineJoin = 'round';
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 7; ctx.stroke();
  ctx.strokeStyle = rgba(COL.ink, 0.18); ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
}

/* ---------- copy cards (attempt 1) ---------- */
const CC = { x: 150, w: 780, h: 196, yA: 650, yB: 912 };
/* draws a card with "STILL HERE"; the I of STILL can morph into a red A (morph 0..1) */
function copyCard(ctx, y, label, labelCol, o = {}) {
  const { morph = 0, smudge = 0, shake = 0, alpha = 1, dx = 0 } = o;
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= clamp(alpha); ctx.translate(dx + shake * 9 * Math.sin(shake * 40), 0);
  panel(ctx, CC.x, y, CC.w, CC.h);
  tagPill(ctx, label, CC.x + 40, y, labelCol, 1, { size: 24, align: 'left' });
  const size = 100, fam = F.disp, base = y + CC.h / 2 + size * 0.36 + 10;
  const parts = ['ST', 'I', 'LL HERE'];
  const wA = measure(ctx, 'ST', size, 400, fam, 2), wI = measure(ctx, 'I', size, 400, fam, 2), wAa = measure(ctx, 'A', size, 400, fam, 2), wR = measure(ctx, 'LL HERE', size, 400, fam, 2);
  const wMid = lerp(wI, wAa, E.io3(clamp(morph)));
  const x0 = CX - (wA + wMid + wR) / 2;
  if (smudge > 0) inkSmudge(ctx, x0 + wA + wMid / 2 - 10, base - size * 0.5, smudge);   // under the letters
  text(ctx, parts[0], x0, base, { size, weight: 400, family: fam, color: COL.ink, ls: 2 });
  if (morph < 1) text(ctx, 'I', x0 + wA + (wMid - wI) / 2, base, { size, weight: 400, family: fam, color: COL.ink, ls: 2, alpha: 1 - clamp(morph * 1.6) });
  if (morph > 0) text(ctx, 'A', x0 + wA + (wMid - wAa) / 2, base, { size, weight: 400, family: fam, color: COL.alert, ls: 2, alpha: clamp(morph * 1.6 - 0.4) });
  text(ctx, parts[2], x0 + wA + wMid, base, { size, weight: 400, family: fam, color: COL.ink, ls: 2 });
  ctx.restore();
}
/* an ink smudge: a blot with a smear tail, growing with p */
function inkSmudge(ctx, x, y, p) {
  const e = E.out3(clamp(p)), r = rng(42);
  ctx.save(); ctx.globalAlpha *= 0.26 * clamp(p * 3);
  ctx.fillStyle = COL.ink;
  for (let i = 0; i < 9; i++) {
    const a = r() * TAU, d = r() * 22 * e, rr2 = (12 + r() * 18) * e;
    ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * d + 18 * e * i / 9, y + Math.sin(a) * d * 0.7, rr2 * 1.25, rr2 * 0.8, 0.4, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
