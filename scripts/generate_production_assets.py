"""Original CC0 WAV palette and tiny skinned GLB. Offline, deterministic."""
import json, struct
from pathlib import Path
import numpy as np
from scipy import signal
import soundfile as sf
ROOT=Path(__file__).resolve().parents[1]/'assets/production'
ROOT.mkdir(exist_ok=True)
sr=24000
rng=np.random.default_rng(2217)
for name,dur in [('ack',.28),('paper',.55),('contact',.4),('ambience',4)]:
    t=np.arange(round(sr*dur))/sr
    if name=='ack':
        f=np.where(t<.12,660,880); y=np.sin(2*np.pi*np.cumsum(f)/sr)*np.exp(-t*10)*.25
    elif name=='paper':
        y=signal.sosfilt(signal.butter(2,[600,6200],btype='band',fs=sr,output='sos'),rng.normal(0,.15,len(t)))*np.sin(np.pi*t/dur)**2*(.5+.5*np.cos(2*np.pi*18*t)**2)
    elif name=='contact':
        y=(np.sin(2*np.pi*110*t)+.4*np.sin(2*np.pi*233*t))*np.exp(-t*22)*.35
    else:
        # Exactly periodic band-limited air: seamless loop, no imported recording.
        freq=np.fft.rfftfreq(len(t),1/sr); spec=np.fft.rfft(rng.normal(size=len(t)))
        spec*=np.exp(-(freq/750)**2)*(1-np.exp(-(freq/90)**2)); y=np.fft.irfft(spec,len(t)); y*=.08/np.std(y)
    if name!='ambience':
        fade=min(240,len(y)//2); y[:fade]*=np.linspace(0,1,fade); y[-fade:]*=np.linspace(1,0,fade)
    sf.write(ROOT/f'{name}.wav',y,sr,subtype='PCM_16')
# Two-joint ribbon; all vertices above the hinge bend with the second joint.
vertices=np.array([[-.45,0,0],[.45,0,0],[-.45,1,0],[.45,1,0],[-.45,2,0],[.45,2,0]],'<f4')
indices=np.array([0,1,2,1,3,2,2,3,4,3,5,4],'<u2')
joints=np.array([[0,0,0,0]]*2+[[1,0,0,0]]*4,'<u2')
weights=np.array([[1,0,0,0]]*6,'<f4')
ibm=np.array([np.eye(4),np.eye(4)],'<f4'); ibm[1,3,1]=-1
q=[]
for angle in [0,.8,0,-.8,0]: q.append([0,0,np.sin(angle/2),np.cos(angle/2)])
arrays=[vertices,indices,joints,weights,ibm,np.array([0,1,2,3,4],'<f4'),np.array(q,'<f4')]
blob=b''; views=[]
for arr in arrays:
    blob+=b'\0'*((-len(blob))%4); views.append({'buffer':0,'byteOffset':len(blob),'byteLength':arr.nbytes}); blob+=arr.tobytes()
accessors=[]
for i,(typ,component,count) in enumerate([('VEC3',5126,6),('SCALAR',5123,12),('VEC4',5123,6),('VEC4',5126,6),('MAT4',5126,2),('SCALAR',5126,5),('VEC4',5126,5)]):
    a={'bufferView':i,'componentType':component,'count':count,'type':typ}
    if i==0:a.update(min=[-.45,0,0],max=[.45,2,0])
    if i==5:a.update(min=[0],max=[4])
    accessors.append(a)
gltf={'asset':{'version':'2.0','generator':'Lockstep original CC0 hinge fixture'},'scene':0,'scenes':[{'nodes':[0,3]}],
'nodes':[{'name':'root','children':[1]},{'name':'hinge','translation':[0,1,0],'children':[2]},{'name':'tip','translation':[0,1,0]},{'mesh':0,'skin':0}],
'skins':[{'joints':[0,1],'inverseBindMatrices':4,'skeleton':0}],
'meshes':[{'primitives':[{'attributes':{'POSITION':0,'JOINTS_0':2,'WEIGHTS_0':3},'indices':1,'material':0}]}],
'materials':[{'doubleSided':True,'pbrMetallicRoughness':{'baseColorFactor':[.2,.7,.6,1],'metallicFactor':.1,'roughnessFactor':.5}}],
'animations':[{'name':'sway','samplers':[{'input':5,'output':6,'interpolation':'LINEAR'}],'channels':[{'sampler':0,'target':{'node':1,'path':'rotation'}}]}],
'buffers':[{'byteLength':len(blob)}],'bufferViews':views,'accessors':accessors}
j=json.dumps(gltf,separators=(',',':')).encode(); j+=b' '*((-len(j))%4); blob+=b'\0'*((-len(blob))%4)
(ROOT/'hinge-rig.glb').write_bytes(struct.pack('<III',0x46546c67,2,12+8+len(j)+8+len(blob))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(blob),0x004e4942)+blob)
print('Generated original CC0 sample palette and animated skin fixture')
