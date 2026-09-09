'use strict';
(() => {
 const $=id=>document.getElementById(id),M=window.NSModels,canvas=$('core-canvas'),ctx=canvas.getContext('2d');
 const media=window.matchMedia('(prefers-reduced-motion: reduce)'),coarse=window.matchMedia('(pointer: coarse)').matches;
 let w=800,h=570,dpr=1,yaw=.62,pitch=-.27,zoom=1,q=0,playing=false,focus=false,streams=true,pulses=false,visible=false,quiet=media.matches,phase=0,last=0,lastUI=0,drag=null;
 const mint='#77efd2',orange='#ffab82',white='#e5f3fa',muted='#aac4d2';
 const stories=[
  ['가운데로 들어오고, 위아래로 나가요.','물은 안쪽으로 회전하며 들어옵니다. 가운데 쌓이지 않도록 축을 따라 양쪽으로 빠져나가요.'],
  ['물의 양이 아니라, 강한 흐름의 영역이 줄어요.','반지름과 높이가 모두 작아집니다. 물이 사라지는 것이 아니라, 빠른 흐름이 집중되는 공간이 작아지는 거예요.'],
  ['작은 영역에서, 더 큰 속도가 나타나요.','속도는 증가하지만 핵심 영역의 부피는 더 빠르게 줄어, 그 영역의 에너지 척도는 감소할 수 있어요.'],
  ['화면의 끝은 무한대가 아니에요.','지금도 t는 1보다 작고 모든 표시값은 유한합니다. 논문의 결론은 t가 1에 가까워질 때 속도에 어떤 유한한 상한도 둘 수 없다는 것이에요.']
 ];
 let selectedStage=0;
 function stageFor(value){return value<.2?0:value<.55?1:value<.87?2:3;}
 function setStory(stage){selectedStage=stage;document.querySelectorAll('[data-core-stage]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.coreStage===stage)));$('core-step-label').textContent=`STEP 0${stage+1}`;$('core-story-title').textContent=stories[stage][0];$('core-story').textContent=stories[stage][1];}
 function playLabel(){$('core-play').textContent=playing?'시간 멈추기 Ⅱ':q>=1?'시간 다시 보기 ↻':'시간 진행 ▶';$('core-play').setAttribute('aria-pressed',String(playing));}
 function updateUI(){
  const s=M.coreScale(q);$('core-time').value=String(Math.round(q*100));$('core-time-value').textContent=`t = ${s.time.toFixed(4)}`;
  $('core-time').setAttribute('aria-valuetext',`시간 ${s.time.toFixed(4)}, 특이점 시간 1보다 작음`);
  $('core-radius').textContent=(s.radius*100).toFixed(1)+'%';$('core-height').textContent=(s.height*100).toFixed(1)+'%';$('core-speed').textContent=s.speed.toFixed(1)+'배';$('core-energy').textContent=(s.energy*100).toFixed(1)+'%';$('core-radius-meter').value=s.radius;$('core-height-meter').value=s.height;
  const stage=stageFor(q);if(stage!==selectedStage)setStory(stage);
  $('core-view-label').textContent=focus?'핵심 영역 확대 · 크기는 막대에서 비교':'공간 전체 보기 · 점선은 시작 크기';
  canvas.setAttribute('aria-label',`3차원 집중 흐름의 개념 모형. 시간 ${s.time.toFixed(4)}. 시작 대비 반지름 ${(s.radius*100).toFixed(1)}%, 높이 ${(s.height*100).toFixed(1)}%, 대표 속도 ${s.speed.toFixed(1)}배. ${focus?'핵심 영역을 확대해 보고 있습니다.':'시작 크기와 같은 눈금으로 비교합니다.'}`);
 }
 for(const id of ['core-time-value','core-radius','core-height','core-speed','core-energy'])$(id).setAttribute('aria-live','off');
 function resize(){const r=canvas.getBoundingClientRect();if(r.width<1)return;w=r.width;h=r.height;dpr=Math.min(window.devicePixelRatio||1,coarse?1.5:1.8);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);draw();}
 function draw(){
  if(!ctx)return;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const bg=ctx.createRadialGradient(w*.46,h*.43,0,w*.5,h*.5,w*.85);bg.addColorStop(0,'#143344');bg.addColorStop(.55,'#0b202c');bg.addColorStop(1,'#07141e');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  const scale=M.coreScale(q),unit=Math.min(w*.285,h*.27)*zoom,center={x:w*.49,y:h*.47},display=focus?1/scale.height:1,R=.65*scale.radius*display,H=1.08*scale.height*display;
  const primitives=[];
  function project(p){const a=M.project(p,yaw,pitch);return{x:center.x+a.x*unit,y:center.y+a.y*unit,depth:a.depth};}
  function path(points,color,width=1,fill=null,close=false,dash=[]){const p=points.map(project);primitives.push({type:'path',p,color,width,fill,close,dash,depth:p.reduce((sum,k)=>sum+k.depth,0)/p.length});}
  function particle(p,r,color){const a=project(p);primitives.push({type:'dot',...a,r,color});}
  function ring(radius,y,n=48){return Array.from({length:n+1},(_,k)=>{const a=k/n*Math.PI*2;return[radius*Math.cos(a),y,radius*Math.sin(a)];});}
  // Reference planes and coordinate axes. These indicate orientation, not a physical container.
  for(let k=-4;k<=4;k++){const n=k*.35;path([[-1.5,-1.38,n],[1.5,-1.38,n]],'#46718930');path([[n,-1.38,-1.5],[n,-1.38,1.5]],'#46718930');}
  const axes=[[[0,-1.38,0],[1.5,-1.38,0],'x'],[[0,-1.38,0],[0,-1.38,1.5],'y'],[[0,-1.38,0],[0,1.55,0],'z']];
  axes.forEach(([a,b])=>path([a,b],'#7d9dab55',1));
  if(!focus&&q>.008){
   for(const y of [-1.08,0,1.08])path(ring(.65,y),'#cfebf056',1,null,false,[4,5]);
   for(let k=0;k<4;k++){const a=k*Math.PI/2;path([[.65*Math.cos(a),-1.08,.65*Math.sin(a)],[.65*Math.cos(a),1.08,.65*Math.sin(a)]],'#cfebf040',1,null,false,[4,5]);}
  }
  const seg=coarse?24:36;
  // Depth-sorted translucent cylinder: a geometric marker for the inner region.
  for(let k=0;k<seg;k++){
   const a=k/seg*Math.PI*2,b=(k+1)/seg*Math.PI*2,light=.12+.1*(Math.cos(a-yaw)+1)/2;
   path([[R*Math.cos(a),-H,R*Math.sin(a)],[R*Math.cos(b),-H,R*Math.sin(b)],[R*Math.cos(b),H,R*Math.sin(b)],[R*Math.cos(a),H,R*Math.sin(a)]],null,0,`rgba(${Math.round(64+q*155)},${Math.round(191-q*52)},${Math.round(185-q*59)},${light})`,true);
  }
  for(let j=-2;j<=2;j++)path(ring(R,j*H/2),q>.55?'#ffb28e80':'#8decdba0',1.2);
  for(let k=0;k<6;k++){const a=k*Math.PI/3;path([[R*Math.cos(a),-H,R*Math.sin(a)],[R*Math.cos(a),H,R*Math.sin(a)]],'#a5eade32',1);}
  // Schematic stream curves: inward spiral near the middle, then axial outflow.
  // These curves are NOT computed trajectories of the paper's velocity field.
  function curve(u,angle,sign){const rad=R*(1.65*(1-u)**1.7+.16),a=angle+u*Math.PI*3.6;return[rad*Math.cos(a),sign*H*(.04+u**2.1*1.78),rad*Math.sin(a)];}
  if(streams){
   const lines=coarse?4:6,steps=coarse?32:46;
   for(const sign of [-1,1])for(let k=0;k<lines;k++){
    const a=k*Math.PI*2/lines;
    for(let j=0;j<steps;j++){const u=j/steps;path([curve(u,a,sign),curve((j+1)/steps,a,sign)],u<.53?'#77efd24b':'#ffab8260',1.2);}
    for(let j=0;j<4;j++){
     const u=(j/4+phase*.14+k*.083)%1,color=u<.53?mint:orange;
     const tail=[];for(let n=0;n<5;n++)tail.push(curve(Math.max(0,u-.055+n*.01375),a,sign));path(tail,color,2.2);particle(curve(u,a,sign),Math.max(1.2,2.5*(focus?1:Math.max(.4,Math.sqrt(scale.radius)))),color);
    }
   }
   for(let k=0;k<4;k++){
    const a=k*Math.PI/2,outer=[R*1.85*Math.cos(a),0,R*1.85*Math.sin(a)],inner=[R*1.27*Math.cos(a),0,R*1.27*Math.sin(a)];path([outer,inner],mint,2);
   }
  }
  if(pulses){
   for(let j=-2;j<=2;j++){
    const pts=[];for(let k=0;k<=72;k++){const a=k/72*Math.PI*2,r=R*(1.4+.1*Math.sin(12*a+phase*3+j));pts.push([r*Math.cos(a),j*H*.34,r*Math.sin(a)]);}path(pts,'#bba3ffc0',1.5);
   }
  }
  primitives.sort((a,b)=>b.depth-a.depth);
  for(const p of primitives){
   if(p.type==='dot'){ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();continue;}
   ctx.beginPath();p.p.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));if(p.close)ctx.closePath();if(p.fill){ctx.fillStyle=p.fill;ctx.fill();}if(p.color){ctx.strokeStyle=p.color;ctx.lineWidth=p.width;ctx.setLineDash(p.dash);ctx.stroke();ctx.setLineDash([]);}
  }
  function label(txt,x,y,color=muted,align='left',size=13){ctx.fillStyle=color;ctx.font=`${size}px Arial,"Apple SD Gothic Neo",sans-serif`;ctx.textAlign=align;ctx.fillText(txt,x,y);ctx.textAlign='left';}
  axes.forEach(([,b,name])=>{const p=project(b);label(name,p.x+7,p.y+3,'#9abcd0', 'left',14);});
  const top=project([0,H*1.92,0]),bottom=project([0,-H*1.92,0]);
  if(streams&&(focus||q<.62)){label('위로 유출',top.x+12,Math.max(22,top.y),orange);label('아래로 유출',bottom.x+12,Math.min(h-67,bottom.y),orange);const inward=project([-R*2.0,0,0]);label('안쪽으로',Math.max(10,inward.x-10),inward.y-15,mint,'left');}
  if(!focus&&q>.62){label('핵심 영역이 이만큼 작아졌어요',w/2,h-68,white,'center',w<380?13:15);label('「핵심 영역을 확대해서 보기」를 켜보세요',w/2,h-44,mint,'center',12);}
  else if(focus){label('확대 관찰 중 · 실제 크기는 수치 막대에서 비교',w/2,h-29,muted,'center',12);}
  if(pulses)label('보라색 고리 = 주변 보정 흐름의 도식',w/2,28,'#cab8ff','center',12);
  // A separate side-on size comparison stays at a fixed scale during focus mode.
  const insetW=w<400?112:148,insetH=88,ix=w-insetW-12,iy=h-insetH-8;
  if(focus){
   ctx.fillStyle='#081722ed';ctx.fillRect(ix,iy,insetW,insetH);ctx.strokeStyle='#345364';ctx.strokeRect(ix,iy,insetW,insetH);label('실제 크기 비교',ix+10,iy+17,muted,'left',12);
   ctx.strokeStyle='#c9e6ed83';ctx.setLineDash([3,3]);ctx.strokeRect(ix+14,iy+29,26,46);ctx.setLineDash([]);ctx.fillStyle=mint;const cw=26*scale.radius,ch=46*scale.height;ctx.fillRect(ix+insetW*.69-cw/2,iy+52-ch/2,Math.max(1,cw),Math.max(1,ch));label('시작',ix+15,iy+85,muted,'left',12);label('지금',ix+insetW*.69,iy+85,mint,'center',12);
  }
 }
 if(!ctx){canvas.insertAdjacentHTML('afterend','<p class="important">3D 그림을 표시할 수 없어요. 시간 조절에 따른 수치와 단계별 설명은 그대로 사용할 수 있습니다.</p>');}
 document.querySelectorAll('[data-core-stage]').forEach(b=>b.addEventListener('click',()=>{const stage=+b.dataset.coreStage;q=[0,.4,.72,1][stage];playing=false;setStory(stage);updateUI();playLabel();draw();}));
 $('core-time').addEventListener('input',e=>{q=+e.target.value/100;playing=false;updateUI();playLabel();draw();});
 $('core-play').addEventListener('click',()=>{if(q>=1)q=0;playing=!playing;updateUI();playLabel();draw();});
 $('core-reset').addEventListener('click',()=>{q=0;playing=false;updateUI();playLabel();draw();});
 $('core-focus').addEventListener('change',e=>{focus=e.target.checked;updateUI();draw();});
 $('core-streams').addEventListener('change',e=>{streams=e.target.checked;draw();});
 $('core-pulses').addEventListener('change',e=>{pulses=e.target.checked;$('core-pulse-note').hidden=!pulses;draw();});
 $('core-zoom-in').addEventListener('click',()=>{zoom=M.clamp(zoom*1.18,.6,2.3);draw();});$('core-zoom-out').addEventListener('click',()=>{zoom=M.clamp(zoom/1.18,.6,2.3);draw();});
 $('core-camera-reset').addEventListener('click',()=>{yaw=.62;pitch=-.27;zoom=1;draw();});
 canvas.addEventListener('pointerdown',e=>{if(drag||e.button>0)return;e.preventDefault();drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');});
 canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;yaw+=(e.clientX-drag.x)*.009;pitch=M.clamp(pitch+(e.clientY-drag.y)*.007,-1.12,1.12);drag={id:e.pointerId,x:e.clientX,y:e.clientY};draw();});
 function release(e){if(drag?.id===e.pointerId){drag=null;canvas.classList.remove('dragging');}}
 ['pointerup','pointercancel','lostpointercapture'].forEach(n=>canvas.addEventListener(n,release));
 canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home'){yaw=.62;pitch=-.27;zoom=1;}else if(e.key==='+')zoom=M.clamp(zoom*1.15,.6,2.3);else if(e.key==='-')zoom=M.clamp(zoom/1.15,.6,2.3);else{yaw+=e.key==='ArrowLeft'?-.14:e.key==='ArrowRight'?.14:0;pitch=M.clamp(pitch+(e.key==='ArrowUp'?-.1:e.key==='ArrowDown'?.1:0),-1.12,1.12);}draw();});
 document.addEventListener('ns:motion',e=>{quiet=e.detail;if(quiet){playing=false;playLabel();}draw();});media.addEventListener('change',e=>{quiet=e.matches;});
 if('ResizeObserver'in window)new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize);
 if('IntersectionObserver'in window)new IntersectionObserver(e=>{visible=e[0].isIntersecting;if(visible)resize();},{rootMargin:'100px'}).observe(canvas);else visible=true;
 updateUI();playLabel();resize();
 function frame(now){requestAnimationFrame(frame);if(!last){last=now;return;}if(now-last<36)return;const dt=Math.min(.08,(now-last)/1000);last=now;if(document.hidden||!visible||!ctx)return;
  if(!quiet)phase+=dt*(.42+Math.min(1.8,Math.log1p(M.coreScale(q).speed)*.25));
  // Time moves only after the explicit Play action, including reduced-motion users.
  const moving=playing;if(playing){q=Math.min(1,q+dt/24);if(now-lastUI>140||q===1){lastUI=now;updateUI();}if(q===1){playing=false;playLabel();}}
  if(!quiet||moving)draw();
 }
 requestAnimationFrame(frame);
})();
