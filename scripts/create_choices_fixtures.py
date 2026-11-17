"""Create small reproducible capability productions. No model calls."""
import json, shutil, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'engine'))
from production import dump
from catalogue import items_by_id
catalog=items_by_id()
for slug,ids in [('choices-reel',['native.signal','native.evidence','native.number','native.scale','native.parallax','native.zoom']),('choices-mixed',['native.growth','native.cell','three.rig'])]:
    target=ROOT/'videos'/slug
    if target.exists():
        print('Already exists:',target);continue
    subprocess.run([str(ROOT/'bin/lockstep'),'new',slug,'Production choices laboratory'],check=True)
    shutil.copy2(ROOT/'templates/video/style.json',target/'style.json')
    shutil.copy2(ROOT/'docs/fixtures-brief.md',target/'docs/creative_brief.md')
    step=15/len(ids)
    chapters=[dict(id=f'shot{i}',name=item.upper(),mood='light' if i%2==0 else 'groove',start=i*step) for i,item in enumerate(ids)]
    cfg=dict(title=slug,tag='CAPABILITY LAB',output=slug,max_seconds=20,
             clock=dict(mode='music',duration=15,bpm=120,markers={f'accent{i}':{'frame':round(i*step*30)} for i in range(len(ids))}),
             chapters=chapters,music=dict(bpm=120,kit='pulse' if slug.endswith('reel') else 'soft'),
             choices=dict(shots={f'shot{i}':dict(item=item,inputs={**catalog[item]['inputs'],'duration':step,'cue':{'marker':f'accent{i}'}}) for i,item in enumerate(ids)},narration={'item':'voice.none'},score={'item':'score.synth'},effects={'item':'effects.mixed'}),
             audio=dict(effects='mixed',music_envelopes=[{'from':{'beat':10},'to':{'beat':12},'gain_db':-8,'fade':.12}]))
    dump(target/'video.json',cfg)
    (target/'components.js').write_text('')
    (target/'script.py').write_text('BEATS=[]\n# Explicit music clock, no narration.\n')
    (target/'storyboard.py').unlink()
    for f in (target/'scenes').glob('*.js'):f.unlink()
    for i,item in enumerate(ids):
        code=f"(window.SCENE_DEFS=window.SCENE_DEFS||[]).push(()=>{{const s=prepareChoice('shot{i}');const cue=choiceTime({{marker:'accent{i}'}});"
        if i==1:code+="sfx(cue,'sample',.5,{file:'assets/production/paper.wav'});"
        elif i==2:code+="sfx(cue,'thump',.4);"
        code+=f"addScene('shot{i}',(ctx,t)=>s.draw(ctx,t),{{type:'{'zoomIn' if i==5 else 'fade'}'}});}});\n"
        (target/f'scenes/s{i:02d}.js').write_text(code)
    (target/'docs/sources.md').write_text('# Sources\n\nCapability examples, not factual claims. Cell division is schematic. Original rig and sample provenance: assets/production/README.md. Runtime research: docs/production-choices.md.\n')
    (target/'docs/report_notes.md').write_text('# Review notes\n\nEngineering fixture. Measurements are automated; no human listening judgement is claimed.\n')
    subprocess.run([str(ROOT/'bin/lockstep'),'clock',slug],check=True)
