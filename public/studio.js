import * as Tone from 'https://cdn.jsdelivr.net/npm/tone@15.1.22/+esm';
import { Midi } from 'https://cdn.jsdelivr.net/npm/@tonejs/midi@2.0.28/+esm';

const WONDERTOAD = 'https://wondertoad-sample-crate.davidhopejohnstone.workers.dev';
const colors = ['#55c3f4','#b7f34a','#f7ad37','#d080ff','#ff7aa9','#6fe1c1','#ff8c61','#87a7ff'];
const channels = [];
let selectedChannelId = null;
let pendingAudioTarget = null;
let midiChannelId = null;
let selectedNoteIndex = null;
let handoff = null;
let handoffIndex = 0;
let auditionPlayer = null;
let playing = false;
const transport = Tone.getTransport();

const $ = (id) => document.getElementById(id);
const dbText = (n) => Number(n) <= -59.5 ? '−∞ dB' : `${Number(n) >= 0 ? '+' : '−'}${Math.abs(Number(n)).toFixed(1)} dB`;
const panText = (n) => Math.abs(Number(n)) < .04 ? 'C' : Number(n) < 0 ? `L ${Math.round(Math.abs(Number(n))*100)}` : `R ${Math.round(Number(n)*100)}`;
const safe = (s='') => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function toast(msg){
  const t=$('toast');
  t.textContent=msg;
  t.classList.remove('hidden');
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>t.classList.add('hidden'),2600);
}
function setEngineStatus(msg){ $('engineStatus').textContent=msg; }
function setRangePct(input,value,min,max){
  const pct=Math.max(0,Math.min(100,((Number(value)-min)/(max-min))*100));
  input.style.setProperty('--pct',`${pct}%`);
}
function makeToneChannel(volume=-6, pan=0){
  return new Tone.Channel({ volume, pan, mute:false, solo:false }).toDestination();
}

function newChannel(name){
  const id = `ch-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  const ch = {
    id,
    name:name || `Channel ${channels.length+1}`,
    sourceType:'empty',
    sourceName:'EMPTY',
    meta:'Load a file or keep a Wondertoad sample',
    volume:-6,
    pan:0,
    muted:false,
    solo:false,
    loop:true,
    color:colors[channels.length%colors.length],
    node:makeToneChannel(-6,0),
    player:null,
    synth:null,
    part:null,
    objectUrl:null,
    midiNotes:null,
    midiDuration:0,
    midiTrackName:null,
  };
  channels.push(ch);
  if(!selectedChannelId) selectedChannelId=id;
  return ch;
}

function disposeSource(ch){
  try { ch.player?.unsync?.(); ch.player?.stop?.(); ch.player?.dispose?.(); } catch {}
  try { ch.part?.dispose?.(); ch.synth?.dispose?.(); } catch {}
  if(ch.objectUrl) URL.revokeObjectURL(ch.objectUrl);
  ch.player=null;
  ch.part=null;
  ch.synth=null;
  ch.objectUrl=null;
  ch.midiNotes=null;
  ch.midiDuration=0;
  ch.midiTrackName=null;
}
function sourceMeta(ch){
  if(ch.sourceType==='empty') return 'Load a file or keep a Wondertoad sample';
  if(ch.sourceType==='midi') return `${ch.midiNotes?.length||0} notes · ${ch.midiDuration.toFixed(1)} sec`;
  return ch.meta || (ch.sourceType==='wondertoad' ? 'Wondertoad sample' : 'Local audio file');
}

function renderChannels(){
  const host=$('channels');
  host.innerHTML='';
  channels.forEach((ch,index)=>{
    const card=document.createElement('article');
    card.className=`channel${ch.id===selectedChannelId?' selected':''}`;
    card.style.borderTopColor=ch.color;
    card.innerHTML=`
      <div class="channel-top"><div><div class="channel-id">CH ${index+1}</div><div class="channel-name">${safe(ch.name)}</div></div></div>
      <div class="source"><div class="source-label">SOURCE</div><div class="source-name ${ch.sourceType==='empty'?'empty':''}">${safe(ch.sourceName)}</div><div class="source-meta">${safe(sourceMeta(ch))}</div></div>
      <div class="load-row"><button data-action="audio">${ch.sourceType==='empty'?'LOAD AUDIO':'REPLACE AUDIO'}</button><button data-action="midi">LOAD MIDI</button></div>
      <div class="control"><div class="control-head"><span>VOLUME</span><span data-value="volume">${dbText(ch.volume)}</span></div><input data-control="volume" type="range" min="-60" max="6" step="0.5" value="${ch.volume}"></div>
      <div class="control"><div class="control-head"><span>PAN</span><span data-value="pan">${panText(ch.pan)}</span></div><input class="pan" data-control="pan" type="range" min="-1" max="1" step="0.01" value="${ch.pan}"></div>
      <div class="buttons"><button data-action="mute" class="${ch.muted?'active':''}">MUTE</button><button data-action="solo" class="${ch.solo?'active':''}">SOLO</button><button data-action="loop" class="${ch.loop?'active':''}">LOOP</button><button data-action="remove" class="danger">REMOVE</button></div>`;

    card.addEventListener('click',(e)=>{
      selectedChannelId=ch.id;
      const action=e.target.closest('button')?.dataset.action;
      if(action){ e.stopPropagation(); handleChannelAction(ch,action); }
      else renderChannels();
    });

    const volumeInput=card.querySelector('[data-control="volume"]');
    setRangePct(volumeInput,ch.volume,-60,6);
    volumeInput.addEventListener('input',(e)=>{
      ch.volume=Number(e.target.value);
      ch.node.volume.value=ch.volume;
      card.querySelector('[data-value="volume"]').textContent=dbText(ch.volume);
      setRangePct(e.target,ch.volume,-60,6);
    });
    const panInput=card.querySelector('[data-control="pan"]');
    panInput.addEventListener('input',(e)=>{
      ch.pan=Number(e.target.value);
      ch.node.pan.value=ch.pan;
      card.querySelector('[data-value="pan"]').textContent=panText(ch.pan);
    });
    host.appendChild(card);
  });
}

function handleChannelAction(ch,action){
  selectedChannelId=ch.id;
  if(action==='audio'){
    pendingAudioTarget=ch.id;
    $('audioPicker').value='';
    $('audioPicker').click();
    return;
  }
  if(action==='midi'){
    midiChannelId=ch.id;
    $('midiPicker').value='';
    $('midiPicker').click();
    return;
  }
  if(action==='mute'){ ch.muted=!ch.muted; ch.node.mute=ch.muted; }
  if(action==='solo'){ ch.solo=!ch.solo; ch.node.solo=ch.solo; }
  if(action==='loop'){ ch.loop=!ch.loop; if(ch.player) ch.player.loop=ch.loop; }
  if(action==='remove'){
    if(channels.length===1){
      disposeSource(ch);
      ch.sourceType='empty'; ch.sourceName='EMPTY'; ch.meta=''; ch.name='Channel 1';
    } else {
      disposeSource(ch); ch.node.dispose(); channels.splice(channels.indexOf(ch),1);
      if(selectedChannelId===ch.id) selectedChannelId=channels[0]?.id||null;
    }
    if(midiChannelId===ch.id){ midiChannelId=null; selectedNoteIndex=null; renderMidi(); }
  }
  renderChannels();
}

async function loadAudio(ch,url,name,{type='audio',meta='',objectUrl=null}={}){
  stopAll();
  disposeSource(ch);
  setEngineStatus(`Loading ${name}…`);
  const player=new Tone.Player().connect(ch.node);
  await player.load(url);
  player.loop=ch.loop;
  player.sync().start(0);
  ch.player=player;
  ch.objectUrl=objectUrl;
  ch.sourceType=type;
  ch.sourceName=name;
  ch.meta=meta;
  if(ch.name.startsWith('Channel ')) ch.name=name.replace(/\.[^.]+$/,'').slice(0,24);
  renderChannels();
  setEngineStatus(`${name} ready`);
}

function rebuildMidiPart(ch){
  try { ch.part?.dispose?.(); ch.synth?.dispose?.(); } catch {}
  ch.synth=new Tone.PolySynth(Tone.Synth,{
    oscillator:{type:'triangle'},
    envelope:{attack:0.01,decay:0.12,sustain:0.35,release:0.5},
  }).connect(ch.node);
  const events=(ch.midiNotes||[]).map(n=>[Math.max(0,n.time),n]);
  ch.part=new Tone.Part((time,n)=>{
    const note=Tone.Frequency(n.midi,'midi').toNote();
    ch.synth.triggerAttackRelease(note,Math.max(.03,n.duration),time,n.velocity);
  },events);
  ch.part.start(0);
  ch.midiDuration=(ch.midiNotes||[]).reduce((m,n)=>Math.max(m,n.time+n.duration),0);
}
function loadMidiTrackIntoChannel(ch,track,fileName,index){
  stopAll();
  disposeSource(ch);
  ch.sourceType='midi';
  ch.sourceName=fileName;
  ch.midiTrackName=track.name || `Track ${index+1}`;
  ch.name=ch.midiTrackName.slice(0,24);
  ch.midiNotes=track.notes.map(n=>({midi:n.midi,time:n.time,duration:n.duration,velocity:n.velocity,name:n.name}));
  ch.meta=`MIDI · ${ch.midiTrackName}`;
  rebuildMidiPart(ch);
  midiChannelId=ch.id;
  selectedNoteIndex=ch.midiNotes.length?0:null;
}
async function importMidiFile(file,targetId=null){
  const data=await file.arrayBuffer();
  const midi=new Midi(data);
  const tracks=midi.tracks.filter(t=>t.notes.length);
  if(!tracks.length) throw new Error('This MIDI file contains no note tracks');
  $('tempo').value=Math.round(midi.header.tempos?.[0]?.bpm || Number($('tempo').value)||124);
  updateTempo();
  tracks.slice(0,12).forEach((track,i)=>{
    let ch = i===0 && targetId ? channels.find(x=>x.id===targetId) : null;
    if(!ch) ch=channels.find(x=>x.sourceType==='empty');
    if(!ch) ch=newChannel(track.name||`MIDI ${i+1}`);
    loadMidiTrackIntoChannel(ch,track,file.name,i);
  });
  renderChannels();
  renderMidi();
  toast(`Loaded ${tracks.length} MIDI track${tracks.length===1?'':'s'}`);
}

async function playAll(){
  try {
    await Tone.start();
    transport.stop(); transport.position=0;
    transport.bpm.value=Number($('tempo').value)||124;
    transport.start('+0.05');
    playing=true;
    $('play').textContent='❚❚ PAUSE';
    setEngineStatus('Transport playing');
  } catch(e){ toast(`Audio could not start: ${e.message}`); }
}
function pauseAll(){
  transport.pause();
  playing=false;
  $('play').textContent='▶ PLAY';
  setEngineStatus('Transport paused');
}
function stopAll(){
  try{ transport.stop(); transport.position=0; }catch{}
  playing=false;
  $('play').textContent='▶ PLAY';
  setEngineStatus('Transport stopped');
}
function updateTempo(){
  const bpm=Math.max(40,Math.min(240,Number($('tempo').value)||124));
  $('tempo').value=bpm;
  transport.bpm.rampTo(bpm,.05);
}

function midiChannel(){
  return channels.find(c=>c.id===midiChannelId && c.sourceType==='midi') || channels.find(c=>c.sourceType==='midi') || null;
}
function clearInspector(){
  $('noteName').textContent='—'; $('noteStart').textContent='—'; $('noteLength').textContent='—'; $('noteVelocity').textContent='—'; $('velocityValue').textContent='—'; $('velocity').disabled=true; $('deleteNote').disabled=true;
}
function renderInspector(ch){
  const n=ch.midiNotes?.[selectedNoteIndex];
  if(!n){ clearInspector(); return; }
  const name=Tone.Frequency(n.midi,'midi').toNote();
  $('noteName').textContent=name;
  $('noteStart').textContent=`${n.time.toFixed(2)} s`;
  $('noteLength').textContent=`${n.duration.toFixed(2)} s`;
  $('noteVelocity').textContent=String(Math.round(n.velocity*127));
  $('velocity').value=String(Math.round(n.velocity*127));
  $('velocityValue').textContent=String(Math.round(n.velocity*127));
  $('velocity').disabled=false;
  $('deleteNote').disabled=false;
}
function renderMidi(){
  const ch=midiChannel();
  if(ch) midiChannelId=ch.id;
  $('midiEmpty').classList.toggle('hidden',!!ch);
  $('midiBody').classList.toggle('visible',!!ch);
  $('addNote').disabled=!ch;
  if(!ch){ $('midiTitle').textContent='No MIDI loaded'; $('roll').innerHTML=''; clearInspector(); return; }
  $('midiTitle').textContent=`${ch.sourceName} · ${ch.midiTrackName || ch.name}`;
  const notes=ch.midiNotes||[];
  const roll=$('roll'); roll.innerHTML='';
  const duration=Math.max(4,ch.midiDuration||4);
  const pitches=notes.map(n=>n.midi);
  const min=Math.max(24,(pitches.length?Math.min(...pitches):60)-3);
  const max=Math.min(108,(pitches.length?Math.max(...pitches):72)+3);
  const span=Math.max(12,max-min+1);
  notes.forEach((n,i)=>{
    const el=document.createElement('div');
    el.className=`note${i===selectedNoteIndex?' selected':''}`;
    el.style.left=`${Math.min(99,(n.time/duration)*100)}%`;
    el.style.width=`${Math.max(.8,(n.duration/duration)*100)}%`;
    el.style.top=`${((max-n.midi)/span)*100}%`;
    el.title=`${Tone.Frequency(n.midi,'midi').toNote()} · ${n.time.toFixed(2)}s`;
    el.addEventListener('click',(e)=>{ e.stopPropagation(); selectedNoteIndex=i; renderMidi(); });
    roll.appendChild(el);
  });
  roll.dataset.min=String(min); roll.dataset.max=String(max); roll.dataset.duration=String(duration);
  renderInspector(ch);
}
function editSelected(fn){
  const ch=midiChannel();
  const n=ch?.midiNotes?.[selectedNoteIndex];
  if(!ch||!n) return;
  fn(n);
  rebuildMidiPart(ch);
  renderMidi();
  renderChannels();
}

async function loadHandoff(token){
  $('audition').classList.add('visible');
  $('auditionName').textContent='Loading Wondertoad handoff…';
  try {
    const res=await fetch(`/api/wondertoad/handoff/${encodeURIComponent(token)}`);
    const data=await res.json();
    if(!res.ok) throw new Error(data.error||`Handoff ${res.status}`);
    handoff=data;
    handoffIndex=Math.max(0,Math.min(data.candidates.length-1,data.activeIndex||0));
    if(data.context?.bpm){ $('tempo').value=Math.round(data.context.bpm); updateTempo(); }
    renderAudition();
  } catch(e){
    $('auditionName').textContent='Could not open Wondertoad sample';
    $('auditionMeta').textContent=e.message;
    $('auditionPlay').disabled=true;
    $('keepCandidate').disabled=true;
  }
}
function candidate(){ return handoff?.candidates?.[handoffIndex] || null; }
function renderAudition(){
  const c=candidate(); if(!c) return;
  $('auditionName').textContent=c.name;
  $('auditionMeta').textContent=[c.bpm?`${Math.round(c.bpm)} BPM`:null,c.key,c.instrument||c.sampleType,c.genre,`${handoffIndex+1} of ${handoff.candidates.length}`].filter(Boolean).join(' · ');
  $('auditionPlay').disabled=false; $('keepCandidate').disabled=false;
}
async function audition(){
  const c=candidate(); if(!c) return;
  try{
    await Tone.start();
    if(auditionPlayer){ auditionPlayer.stop(); auditionPlayer.dispose(); auditionPlayer=null; }
    auditionPlayer=new Tone.Player().toDestination();
    await auditionPlayer.load(c.streamUrl);
    auditionPlayer.start();
    $('auditionPlay').textContent='■ STOP AUDITION';
  }catch(e){ toast(`Audition failed: ${e.message}`); }
}
async function keepCandidate(){
  const c=candidate(); if(!c) return;
  let ch=channels.find(x=>x.id===selectedChannelId) || channels.find(x=>x.sourceType==='empty');
  if(!ch) ch=newChannel('Wondertoad');
  try{
    await loadAudio(ch,c.streamUrl,c.name,{type:'wondertoad',meta:[c.bpm?`${Math.round(c.bpm)} BPM`:null,c.key,c.instrument||c.sampleType,c.genre].filter(Boolean).join(' · ')});
    selectedChannelId=ch.id;
    renderChannels();
    toast(`Kept ${c.name} in ${ch.name}`);
  }catch(e){ toast(`Could not keep sample: ${e.message}`); }
}

$('play').addEventListener('click',()=> playing ? pauseAll() : playAll());
$('stop').addEventListener('click',stopAll);
$('tempo').addEventListener('change',updateTempo);
$('master').addEventListener('input',(e)=>{
  const v=Number(e.target.value);
  Tone.getDestination().volume.value=v;
  $('masterValue').textContent=dbText(v);
  setRangePct(e.target,v,-36,6);
});
$('addChannel').addEventListener('click',()=>{ const ch=newChannel(); selectedChannelId=ch.id; renderChannels(); });
$('openWondertoad').addEventListener('click',()=>window.open(WONDERTOAD,'_blank','noopener'));
$('topAudio').addEventListener('click',()=>{ pendingAudioTarget=selectedChannelId; $('audioPicker').value=''; $('audioPicker').click(); });
$('topMidi').addEventListener('click',()=>{ midiChannelId=null; $('midiPicker').value=''; $('midiPicker').click(); });
$('importMidi').addEventListener('click',()=>{ midiChannelId=null; $('midiPicker').value=''; $('midiPicker').click(); });
$('audioPicker').addEventListener('change',async(e)=>{
  const file=e.target.files?.[0]; if(!file) return;
  let ch=channels.find(x=>x.id===pendingAudioTarget);
  if(!ch) ch=channels.find(x=>x.sourceType==='empty') || newChannel();
  const url=URL.createObjectURL(file);
  try{
    await loadAudio(ch,url,file.name,{type:'file',meta:`Local file · ${(file.size/1048576).toFixed(1)} MB`,objectUrl:url});
    selectedChannelId=ch.id;
  }catch(err){ URL.revokeObjectURL(url); toast(err.message); }
  pendingAudioTarget=null; renderChannels();
});
$('midiPicker').addEventListener('change',async(e)=>{
  const file=e.target.files?.[0]; if(!file) return;
  try{ await importMidiFile(file,midiChannelId); }catch(err){ toast(err.message); }
});
$('prevCandidate').addEventListener('click',()=>{ if(!handoff)return; handoffIndex=(handoffIndex-1+handoff.candidates.length)%handoff.candidates.length; renderAudition(); });
$('nextCandidate').addEventListener('click',()=>{ if(!handoff)return; handoffIndex=(handoffIndex+1)%handoff.candidates.length; renderAudition(); });
$('auditionPlay').addEventListener('click',()=>{
  if(auditionPlayer?.state==='started'){
    auditionPlayer.stop(); auditionPlayer.dispose(); auditionPlayer=null; $('auditionPlay').textContent='▶ AUDITION';
  } else audition();
});
$('keepCandidate').addEventListener('click',keepCandidate);
document.querySelectorAll('[data-transpose]').forEach(b=>b.addEventListener('click',()=>editSelected(n=>{ n.midi=Math.max(0,Math.min(127,n.midi+Number(b.dataset.transpose))); })));
$('velocity').addEventListener('input',(e)=>{
  const ch=midiChannel(); const n=ch?.midiNotes?.[selectedNoteIndex]; if(!n) return;
  n.velocity=Math.max(1,Math.min(127,Number(e.target.value)))/127;
  $('velocityValue').textContent=String(Math.round(n.velocity*127));
  $('noteVelocity').textContent=String(Math.round(n.velocity*127));
});
$('velocity').addEventListener('change',()=>{ const ch=midiChannel(); if(ch){ rebuildMidiPart(ch); renderChannels(); } });
$('deleteNote').addEventListener('click',()=>{
  const ch=midiChannel(); if(!ch||selectedNoteIndex==null) return;
  ch.midiNotes.splice(selectedNoteIndex,1);
  selectedNoteIndex=Math.min(selectedNoteIndex,ch.midiNotes.length-1);
  if(selectedNoteIndex<0) selectedNoteIndex=null;
  rebuildMidiPart(ch); renderMidi(); renderChannels();
});
$('addNote').addEventListener('click',()=>{
  const ch=midiChannel(); if(!ch) return;
  ch.midiNotes.push({midi:60,time:0,duration:.5,velocity:.8,name:'C4'});
  selectedNoteIndex=ch.midiNotes.length-1;
  rebuildMidiPart(ch); renderMidi(); renderChannels();
});
$('roll').addEventListener('dblclick',(e)=>{
  const ch=midiChannel(); if(!ch) return;
  const rect=e.currentTarget.getBoundingClientRect();
  const x=(e.clientX-rect.left)/rect.width, y=(e.clientY-rect.top)/rect.height;
  const duration=Number(e.currentTarget.dataset.duration)||4, min=Number(e.currentTarget.dataset.min)||48, max=Number(e.currentTarget.dataset.max)||72;
  const time=Math.round((x*duration)*4)/4;
  const midi=Math.round(max-y*(max-min));
  ch.midiNotes.push({midi:Math.max(0,Math.min(127,midi)),time,duration:.25,velocity:.8,name:''});
  selectedNoteIndex=ch.midiNotes.length-1;
  rebuildMidiPart(ch); renderMidi(); renderChannels();
});

['Drums','Bass','Music','Vocal'].forEach(name=>newChannel(name));
Tone.getDestination().volume.value=-3;
setRangePct($('master'),-3,-36,6);
updateTempo(); renderChannels(); renderMidi();
fetch('/api/wondertoad/health')
  .then(r=>r.ok?r.json():Promise.reject())
  .then(()=>{ $('wtDot').classList.add('ok'); $('wtStatus').textContent='Wondertoad connected'; })
  .catch(()=>{ $('wtStatus').textContent='Wondertoad unavailable'; });
const token=new URLSearchParams(location.search).get('token');
if(token) loadHandoff(token);
if('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js').catch(()=>{});
