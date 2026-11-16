'use strict';
/* =====================================================================
   components.js — drawing code shared by several scenes of THIS video
   (a recurring object, a diagram that appears at two zoom levels, ...).
   Loaded after the engine's own components and before the scenes.
   Keep every function a pure function of its arguments: no Math.random(),
   no Date, no state carried from one frame to the next.
   ===================================================================== */

/* dashed "wrong" placeholder with a cross and a label: used twice in scene 2 */
function ghostBox(ctx, cx, cy, w, h, p, label) {
  if (p <= 0) return;
  withAlpha(ctx, clamp(p), () => {
    ctx.save();
    ctx.setLineDash([12, 9]);
    strokeRR(ctx, cx - w / 2, cy - h / 2, w, h, 18, rgba(COL.alert, 0.85), 3);
    ctx.restore();
    cross(ctx, cx, cy, 30, COL.alert, clamp(p * 1.6), 8);
    tag(ctx, label, cx, cy + h / 2 + 40, { align: 'center', color: COL.alert, size: 22 });
  });
}
