'use strict';
// Original diagram. All lengths are illustrative; the vent and gaps are enlarged.
window.makeWindowFilm = function () {
  const T=THREE;
  const cue={look:at('layers','look'),inner:at('layers','inner'),outer:at('layers','outer'),air:at('pressure','air'),gap:at('pressure','gap'),both:at('pressure','both'),normal:at('pressure','normally'),fails:at('backup','fails'),load:at('backup','load'),scratch:at('backup','scratch'),three:at('backup','three')};
  const panes=[], edges=[]; let surround,sky,vent,flow,arrow,model;
  function outline(w,h,r){const s=new T.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
  function geometry(hole=false){const s=outline(1.8,2.65,.5);if(hole){const h=new T.Path();h.absarc(0,-.91,.075,0,Math.PI*2,true);s.holes.push(h);}return new T.ExtrudeGeometry(s,{depth:.055,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2,steps:1,curveSegments:28});}
  const path=new T.CatmullRomCurve3([new T.Vector3(-1.12,-.91,.45),new T.Vector3(-.4,-.91,.25),new T.Vector3(0,-.91,.03),new T.Vector3(0,-.91,-.48),new T.Vector3(.06,-.35,-.48)]);
  const shot=createThreeShot({x:60,y:520,width:960,height:690,
    setup(s){
      model=new T.Group();s.scene.add(model);
      for(let i=0;i<3;i++){
        const mat=new T.MeshStandardMaterial({color:i===0?COL.dim:COL.data,transparent:true,opacity:i===0?.09:.26,roughness:.3,metalness:.1,depthWrite:false,side:T.DoubleSide});
        const mesh=new T.Mesh(geometry(i===1),mat);model.add(mesh);panes.push(mesh);
        const e=new T.LineSegments(new T.EdgesGeometry(mesh.geometry,25),new T.LineBasicMaterial({color:i===0?COL.dim:COL.data,transparent:true,opacity:i===0?.5:.85}));mesh.add(e);edges.push(e);
      }
      const surroundShape=outline(2.5,3.3,.75),cut=new T.Path();cut.add(outline(1.88,2.73,.52));surroundShape.holes.push(cut);
      surround=new T.Mesh(new T.ExtrudeGeometry(surroundShape,{depth:.15,bevelEnabled:true,bevelSize:.06,bevelThickness:.08,bevelSegments:3,curveSegments:28}),new T.MeshStandardMaterial({color:COL.bg0,roughness:.62,transparent:true}));surround.position.z=.35;model.add(surround);
      const skyCanvas=document.createElement('canvas');skyCanvas.width=256;skyCanvas.height=384;const sc=skyCanvas.getContext('2d');const grad=sc.createLinearGradient(0,0,0,384);grad.addColorStop(0,mixHex(COL.data,COL.bg0,.55));grad.addColorStop(1,COL.bg0);sc.fillStyle=grad;sc.fillRect(0,0,256,384);sc.fillStyle=rgba(COL.bg0,.88);for(let i=0;i<7;i++){sc.beginPath();sc.ellipse(20+i*48,260+25*Math.sin(i*1.5),90,24,0,0,TAU);sc.fill();}const tex=new T.CanvasTexture(skyCanvas);tex.colorSpace=T.SRGBColorSpace;sky=new T.Mesh(new T.ShapeGeometry(outline(1.84,2.69,.51)),new T.MeshBasicMaterial({map:tex,color:COL.bg0,transparent:true,opacity:1,side:T.DoubleSide,depthWrite:false}));const uv=sky.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(uv.getX(i)+.92)/1.84,(uv.getY(i)+1.345)/2.69);sky.position.z=-.2;model.add(sky);
      vent=new T.Mesh(new T.TorusGeometry(.075,.013,8,32),new T.MeshBasicMaterial({color:COL.ink}));vent.position.set(0,-.91,.063);model.add(vent);
      const tube=new T.TubeGeometry(path,80,.015,8,false);flow=new T.Mesh(tube,new T.MeshBasicMaterial({color:COL.subject,transparent:true}));model.add(flow);
      arrow=new T.Mesh(new T.ConeGeometry(.075,.16,16),new T.MeshBasicMaterial({color:COL.subject,transparent:true}));model.add(arrow);
    },
    update(s,t){
      const spread=tw(t,cue.look-.5,cue.inner+.3),ret=tw(t,cue.scratch-.1,cue.three+.35),k=spread*(1-ret);
      panes[0].position.z=lerp(.2,1.05,k);panes[1].position.z=0;panes[2].position.z=lerp(-.13,-1.05,k);
      const failure=tw(t,cue.fails,cue.fails+.5)*(1-tw(t,cue.scratch-.2,cue.scratch+.4));
      panes[2].material.opacity=.26*(1-.92*failure);edges[2].material.opacity=.85*(1-.75*failure);
      const angle=lerp(.035,1.20,k)+.045*Math.sin(t*.34),dist=lerp(6.9,7.8,k)-.2*prog(t,0,cue.look);
      s.camera.position.set(Math.sin(angle)*dist,.22,Math.cos(angle)*dist);s.camera.lookAt(0,-.02,0);
      surround.material.opacity=1-k;surround.visible=k<.99;sky.visible=k<.99;sky.material.opacity=1-k;
      const air=tw(t,cue.air-.1,cue.gap+.7)*(1-tw(t,cue.normal-.3,cue.normal+.3));
      flow.visible=air>.001;arrow.visible=air>.001;flow.material.opacity=air;
      const u=prog(t,cue.air,cue.gap+.7);flow.geometry.setDrawRange(0,Math.floor(u*80)*8*6);
      arrow.position.copy(path.getPoint(Math.min(.999,u)));arrow.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),path.getTangent(Math.min(.999,u)));arrow.material.opacity=air;
    }
  });
  function label(ctx,point,x,y,top,bottom,color){const p=shot.project(point);line(ctx,p[0],p[1],x,y+14,rgba(color,.7),2.5);dot(ctx,p[0],p[1],5,color);text(ctx,top,x,y,{align:'center',size:29,weight:800,color});text(ctx,bottom,x,y+32,{align:'center',size:26,weight:600,color:COL.ink});}
  function loadGraphic(ctx,t,backup){
    const pane=backup?panes[1]:panes[2],p=shot.project(new T.Vector3(0,.1,pane.position.z));
    // Load is a separate amber annotation, not a continuation of the air path.
    const ax=p[0]+45,ay=p[1];
    for(let i=-1;i<=1;i++){const yy=ay+i*58;line(ctx,ax-115,yy,ax-12,yy,COL.accent,5);line(ctx,ax-12,yy,ax-31,yy-12,COL.accent,5);line(ctx,ax-12,yy,ax-31,yy+12,COL.accent,5);}
    panel(ctx,180,1080,720,88,{fill:rgba(COL.bg0,.96),r:14});text(ctx,backup?'BACKUP LOAD → INNER':'NORMAL LOAD → OUTER',540,1118,{align:'center',size:31,weight:800,color:COL.accent});text(ctx,'Pressure difference',540,1152,{align:'center',size:26,color:COL.ink});
  }
  return {draw(ctx,t,beat){
    const ret=tw(t,cue.scratch-.1,cue.three+.35);
    const passenger=beat==='hook'||(beat==='backup'&&ret>.75);
    text(ctx,passenger?'A TINY HOLE.':beat==='layers'?'THREE LAYERS.':beat==='pressure'?'AIR IN. LOAD OUT.':'A BACKUP, BUILT IN.',540,438,{align:'center',size:62,weight:800,color:COL.ink});
    text(ctx,passenger?'35,000 ft · an ordinary cruise':'AIRBUS DESIGN · ENLARGED SCHEMATIC',540,483,{align:'center',size:26,weight:600,color:COL.dim});
    shot.draw(ctx,t);
    if(passenger){
      const p=shot.project(new T.Vector3(0,-.91,.063));
      line(ctx,p[0]+12,p[1],790,p[1]-32,COL.subject,3);text(ctx,'BLEED HOLE',795,p[1]-45,{align:'center',size:27,weight:800,color:COL.subject});
      if(beat==='backup')text(ctx,'THREE LAYERS. DIFFERENT JOBS.',540,1190,{align:'center',size:30,weight:800,color:COL.ink});
      else text(ctx,'Seen through the protective pane',540,1190,{align:'center',size:28,color:COL.ink});
    }else{
      label(ctx,new T.Vector3(0,1.31,panes[0].position.z),210,565,'SCRATCH','protector',COL.dim);
      label(ctx,new T.Vector3(0,1.31,0),535,535,'INNER','vent + backup',COL.data);
      label(ctx,new T.Vector3(0,1.31,panes[2].position.z),855,565,'OUTER','normal load',COL.data);
      if(beat==='layers'){
        const p=shot.project(new T.Vector3(0,-.91,.063));line(ctx,p[0],p[1],400,1115,COL.subject,3);text(ctx,'VENT IN INNER PANE',400,1155,{align:'center',size:29,weight:800,color:COL.subject});
      }
      if(beat==='pressure'){
        if(t<cue.normal){text(ctx,t<cue.both?'CABIN AIR → GAP':'CABIN PRESSURE ON BOTH SIDES',540,1135,{align:'center',size:31,weight:800,color:COL.subject});text(ctx,'Air path ends between structural panes',540,1175,{align:'center',size:26,color:COL.ink});}
        else loadGraphic(ctx,t,false);
      }
      if(beat==='backup'){
        text(ctx,'IF THE OUTER PANE FAILS',540,650,{align:'center',size:28,weight:800,color:COL.alert});
        if(t>=cue.load-.8)loadGraphic(ctx,t,true);
      }
    }
  }};
};
