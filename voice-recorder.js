const icons = {
  mic: '<rect x="9" y="3" width="6" height="12" rx="3" fill="currentColor" stroke="none"/><path d="M6 10v2a6 6 0 0 0 12 0v-2M12 18v3M8.5 21h7"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  check: '<path d="m5 12 5 6 9-13"/>',
  send: '<path d="m21 3-6.2 18-4-7.8L3 9.2 21 3Z" fill="currentColor" stroke-linejoin="round"/><path d="m10.8 13.2 7-7" stroke="white" stroke-width="1.2"/>',
  play: '<path d="M7 4.5 20 12 7 19.5Z" fill="currentColor" stroke="none"/>',
  stop: '<rect x="5.5" y="5.5" width="13" height="13" rx="1.2" fill="currentColor" stroke="none"/>'
};
const svg = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">${icons[name]}</svg>`;

class VoiceRecorder extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode:'open'});
    this.state='idle'; this.token=0; this.duration=0; this.url=null;
    this.shadowRoot.innerHTML=`
      <style>
        :host{display:inline-block;--red:#e51d3b;--ink:#272b2b;font-family:Arial,Helvetica,sans-serif;color:var(--ink)}
        *{box-sizing:border-box}.wrap{position:relative;width:200px;height:48px}
        button{font:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;border:1px solid #e9e9e9;background:#fff;box-shadow:0 1px 2px #00000004;display:grid;place-items:center;padding:0;outline:none}
        button:focus-visible{outline:3px solid #f3a2af;outline-offset:4px}button:disabled{cursor:wait}svg{width:22px;height:22px;display:block}
        .side{position:absolute;top:0;left:76px;width:48px;height:48px;border-radius:50%;opacity:0;transform:scale(.7);pointer-events:none;transition: left 440ms cubic-bezier(.22,1.35,.36,1),transform 400ms cubic-bezier(.22,1.35,.36,1),opacity 160ms,background 160ms}
        .expanded .side{opacity:1;transform:scale(1);pointer-events:auto}.expanded .cancel{left:0}.expanded .confirm{left:152px}
        .side:hover{background:#fafafa}.side:active{transform:scale(.9)}
        .center{position:absolute;z-index:2;left:50%;top:0;transform:translateX(-50%);width:48px;height:48px;border-radius:26px;overflow:hidden;isolation:isolate;transition:width 440ms cubic-bezier(.22,1.35,.36,1),background 250ms,border-color 250ms,box-shadow 160ms}
        .expanded .center{width:92px}.center:hover{box-shadow:0 2px 6px #00000007}.center:active .content{scale:.9}
        .glow{position:absolute;inset:-12px;background:radial-gradient(ellipse at 25% 35%,#fff9e9 0,transparent 42%),radial-gradient(ellipse at 75% 70%,#fac9d0 0,#fbe2e5 55%,#fce9eb 100%);opacity:0;transition:opacity 280ms;z-index:-1}
        .recording .glow{opacity:1;animation:glow 2.8s ease-in-out infinite alternate}.recording .center{border-color:#f0dfe1;color:var(--red)}
        .content{display:flex;align-items:center;justify-content:center;gap:3px;white-space:nowrap;transition:scale 150ms;width:100%;height:100%}
        .content.change{animation:resolve 300ms ease-out}.bars{display:flex;align-items:center;justify-content:center;gap:4px;height:25px}.bar{width:4px;height:18px;background:var(--red);border-radius:4px;transition:height 100ms linear}
        .progress{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0;transition:opacity 200ms}.recording .progress{opacity:1}.progress path{fill:none;stroke:var(--red);stroke-width:2;stroke-linecap:round;stroke-dasharray:0 100}
        .playing .center{color:var(--red)}.play-icon{width:19px;height:19px;display:grid;place-items:center}.play-icon svg{width:20px;height:20px}.time{display:flex;font-weight:600;font-size:17px;letter-spacing:-.45px;font-variant-numeric:tabular-nums;line-height:22px}.digit{position:relative;display:inline-block;width:9.5px;height:22px;overflow:hidden}.digit span{display:block}.digit .new{animation:digit-in 220ms ease}.digit .old{position:absolute;inset:0;animation:digit-out 220ms ease forwards}
        .status{position:absolute;top:64px;left:50%;transform:translateX(-50%);width:min(300px,calc(100vw - 40px));font-size:12px;line-height:1.6;text-align:center;color:#787878;margin:0}.status:empty{display:none}.pending .content{animation:pending 900ms ease-in-out infinite}.sending .confirm svg{animation:send 380ms ease-in forwards}
        @keyframes resolve{0%{opacity:.15;filter:blur(5px);transform:scale(.78)}100%{opacity:1;filter:blur(0);transform:scale(1)}}
        @keyframes glow{to{transform:translateX(14px) rotate(15deg);filter:hue-rotate(-8deg)}}
        @keyframes digit-in{from{transform:translateY(90%);opacity:0;filter:blur(2px)}}@keyframes digit-out{to{transform:translateY(-90%);opacity:0;filter:blur(2px)}}
        @keyframes pending{50%{opacity:.35}}@keyframes send{to{transform:translate(22px,-22px);opacity:0}}
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
      </style>
      <div class="wrap">
        <button class="side cancel" aria-label="Discard recording" title="Discard recording" tabindex="-1">${svg('close')}</button>
        <button class="center" aria-label="Start recording" title="Start recording"><span class="glow"></span><span class="content">${svg('mic')}</span><svg class="progress" viewBox="0 0 92 48" aria-hidden="true"><path pathLength="100" d="M91 24a23 23 0 0 1-23 23H24a23 23 0 0 1 0-46h44a23 23 0 0 1 23 23"/></svg></button>
        <button class="side confirm" aria-label="Finish recording" title="Finish recording" tabindex="-1">${svg('check')}</button>
        <p class="status" role="status" aria-live="polite"></p>
      </div>`;
    this.$=selector=>this.shadowRoot.querySelector(selector);
    this.$('.center').addEventListener('click',()=>this.primary());
    this.$('.cancel').addEventListener('click',()=>this.reset());
    this.$('.confirm').addEventListener('click',()=>this.state==='recording'?this.finish():this.save());
    this.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();this.reset();}});
  }
  disconnectedCallback(){this.reset(false);}
  message(text){clearTimeout(this.messageTimer);this.$('.status').textContent=text;}
  render(state){
    this.state=state;
    const expanded=['recording','ready','playing','finishing','sending'].includes(state);
    this.$('.wrap').className=`wrap ${expanded?'expanded ':''}${state}`;
    for(const el of this.shadowRoot.querySelectorAll('.side')){el.tabIndex=expanded?0:-1;el.disabled=!expanded||state==='finishing'||state==='sending';}
    const center=this.$('.center');
    center.disabled=['pending','finishing','sending'].includes(state);
    const label=({idle:'Start recording',pending:'Waiting for microphone',recording:'Finish recording',ready:'Play recording',playing:'Stop playback',finishing:'Preparing recording',sending:'Saving recording'})[state];
    center.setAttribute('aria-label',label);center.title=label;
    const content=this.$('.content');
    if(state==='idle'||state==='pending')content.innerHTML=svg('mic');
    else if(state==='recording')content.innerHTML='<span class="bars" aria-hidden="true">'+Array.from({length:5},()=>'<span class="bar"></span>').join('')+'</span>';
    else content.innerHTML=`<span class="play-icon">${svg(state==='playing'?'stop':'play')}</span><span class="time" aria-hidden="true"></span>`;
    content.classList.remove('change');void content.offsetWidth;content.classList.add('change');
    this.$('.confirm').innerHTML=svg(state==='recording'?'check':'send');
    const confirmLabel=state==='recording'?'Finish recording':'Save recording';
    this.$('.confirm').setAttribute('aria-label',confirmLabel);this.$('.confirm').title=confirmLabel;
    if(expanded&&state!=='recording')this.showTime(this.duration);
  }
  async primary(){
    if(this.state==='idle')await this.start();
    else if(this.state==='recording')this.finish();
    else if(this.state==='ready')await this.play();
    else if(this.state==='playing')this.stopPlayback();
  }
  async start(){
    this.message('');this.render('pending');const token=++this.token;
    try{
      if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw new Error('unsupported');
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      if(token!==this.token){stream.getTracks().forEach(t=>t.stop());return;}
      this.stream=stream;this.chunks=[];
      this.recorder=new MediaRecorder(stream);
      this.recorder.ondataavailable=e=>{if(e.data.size)this.chunks.push(e.data);};
      this.recorder.onerror=()=>{this.reset();this.message('Recording interrupted. Please try again.');};
      this.recorder.onstop=()=>{
        if(token!==this.token)return;
        this.blob=new Blob(this.chunks,{type:this.recorder.mimeType||'audio/webm'});
        if(!this.blob.size){this.reset();this.message('No audio captured. Please try again.');return;}
        this.url=URL.createObjectURL(this.blob);this.audio=new Audio(this.url);
        this.audio.onended=()=>this.stopPlayback();
        this.render('ready');this.$('.center').focus({preventScroll:true});
      };
      this.recorder.start();this.startedAt=performance.now();this.render('recording');
      try{
        this.context=new AudioContext();this.analyser=this.context.createAnalyser();this.analyser.fftSize=256;
        this.source=this.context.createMediaStreamSource(stream);this.source.connect(this.analyser);
        this.samples=new Uint8Array(this.analyser.frequencyBinCount);
      }catch{/* Recording remains usable when the visualizer is unavailable. */}
      this.tick();
    }catch(error){
      if(token!==this.token)return;
      this.releaseMicrophone();this.render('idle');
      this.message(error.name==='NotAllowedError'?'Microphone access is blocked. Allow it in your browser and try again.':error.name==='NotFoundError'?'No microphone found. Connect one and try again.':error.message==='unsupported'?'Recording needs a supported browser on localhost or HTTPS.':'Could not start recording. Check your microphone and try again.');
    }
  }
  tick(){
    cancelAnimationFrame(this.frame);
    if(this.state==='recording'){
      const elapsed=(performance.now()-this.startedAt)/1000;
      this.$('.progress path').style.strokeDasharray=`${Math.min(100,elapsed/10*100)} 100`;
      this.analyser?.getByteFrequencyData(this.samples);
      this.shadowRoot.querySelectorAll('.bar').forEach((bar,i)=>{
        const level=this.samples?this.samples.slice(i*12,(i+1)*12).reduce((a,b)=>a+b,0)/(12*255):0;
        const idle=(Math.sin(elapsed*9+i*1.8)+1)*2;
        bar.style.height=`${Math.min(24,4+idle+level*35)}px`;
      });
      if(elapsed>=60){this.finish();return;}
    }else if(this.state==='playing')this.showTime(Math.max(0,this.duration-this.audio.currentTime));
    else return;
    this.frame=requestAnimationFrame(()=>this.tick());
  }
  releaseMicrophone(){
    this.stream?.getTracks().forEach(track=>track.stop());this.stream=null;
    this.source?.disconnect();this.source=null;
    this.context?.close().catch(()=>{});this.context=null;this.analyser=null;this.samples=null;
  }
  finish(){
    if(this.state!=='recording')return;
    this.duration=(performance.now()-this.startedAt)/1000;
    cancelAnimationFrame(this.frame);this.render('finishing');
    this.recorder.stop();this.releaseMicrophone();
  }
  showTime(seconds){
    const time=this.$('.time');if(!time)return;
    const value=String(Math.ceil(seconds)).padStart(2,'0');
    if(!time.children.length){time.innerHTML='<span class="digit"></span><span class="digit"></span><span>s</span>';}
    [...value].forEach((digit,i)=>{
      const slot=time.children[i];if(slot.dataset.value===digit)return;
      const previous=slot.dataset.value;slot.dataset.value=digit;
      slot.innerHTML=`${previous===undefined?'':`<span class="old">${previous}</span>`}<span class="new">${digit}</span>`;
    });
  }
  async play(){
    const token=this.token;this.audio.currentTime=0;
    try{await this.audio.play();if(token!==this.token)return;this.render('playing');this.tick();}
    catch{if(token===this.token)this.message('Playback could not start. Please try again.');}
  }
  stopPlayback(){this.audio?.pause();if(this.audio)this.audio.currentTime=0;cancelAnimationFrame(this.frame);this.render('ready');}
  save(){
    if(!['ready','playing'].includes(this.state))return;
    this.audio?.pause();cancelAnimationFrame(this.frame);
    const extension=this.blob.type.includes('mp4')?'m4a':this.blob.type.includes('ogg')?'ogg':'webm';
    const filename=`voice-${new Date().toISOString().replace(/[:.]/g,'-')}.${extension}`;
    // Hosts can prevent the default download and handle the Blob themselves.
    const event=new CustomEvent('voice-send',{detail:{blob:this.blob,duration:this.duration,filename},bubbles:true,composed:true,cancelable:true});
    if(this.dispatchEvent(event)){
      const link=document.createElement('a');link.href=this.url;link.download=filename;link.click();
    }
    this.render('sending');this.saveTimer=setTimeout(()=>{this.reset();this.message('Recording saved.');this.messageTimer=setTimeout(()=>this.message(''),2400);},400);
  }
  reset(focus=true){
    ++this.token;clearTimeout(this.saveTimer);cancelAnimationFrame(this.frame);
    if(this.recorder?.state==='recording')this.recorder.stop();
    this.releaseMicrophone();this.audio?.pause();this.audio=null;
    if(this.url)URL.revokeObjectURL(this.url);this.url=null;this.blob=null;this.chunks=[];
    this.message('');this.render('idle');
    this.$('.progress path').style.strokeDasharray='0 100';
    if(focus)this.$('.center').focus({preventScroll:true});
  }
}
customElements.define('voice-recorder',VoiceRecorder);
