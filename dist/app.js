'use strict';
(() => {
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const canvas = $('#fluid');
const context = canvas.getContext('2d', {alpha:false});
const coarse = window.matchMedia('(pointer: coarse)').matches;
const initialBounds=canvas.getBoundingClientRect();
const gridHeight=coarse?68:82;
const sim=new Fluid(Math.max(48,Math.min(176,Math.round(gridHeight*initialBounds.width/Math.max(1,initialBounds.height)))),gridHeight);
let preset='stream',view='dye',paused=reduced.matches,visible=true,force=.5,vectors=false,emit=true;
let pointer=null,cursor={x:.5,y:.5},keyFocus=false,drawWidth=0,drawHeight=0;
const buffer=document.createElement('canvas');buffer.width=sim.nx;buffer.height=sim.ny;
const bctx=buffer.getContext('2d');const pixels=bctx.createImageData(sim.nx,sim.ny);
const observations={
 stream:'색 잉크가 <strong>그 자리의 물이 움직이는 방향</strong>으로 이동해요. 색이 달라도 같은 성질의 유체입니다.',
 collide:'엇갈린 두 흐름이 만나며 휘어져요. <strong>소용돌이가 보인다고 바로 수학적인 특이점은 아니에요.</strong>',
 vortex:'회전하는 흐름을 만들었어요. 잉크 넣기를 끄고 점성을 높이면 <strong>주변 물과의 속도 차이가 더 빨리 줄어들어요.</strong>'
};
const notes={
 stream:'흐름을 손으로 저은 뒤, 점성을 높여보세요. 작은 구불거림이 더 빨리 잦아드나요?',
 collide:'미는 힘을 높여보세요. 같은 점성에서 만나는 두 흐름이 어떻게 달라지나요?',
 vortex:'‘계속 흐름·잉크 넣기’를 끄고 관찰하세요. 점성을 바꿀 때마다 ‘처음부터’를 눌러 비교해보세요.'
};
function source(dt){
 const t=sim.time,f=force*dt*9;
 if(preset==='stream'){
  sim.splat(.12,.37+Math.sin(t*.8)*.055,f,.08*f*Math.cos(t),dt*4,0,.037);
  sim.splat(.12,.64+Math.sin(t*.73)*.055,f,-.08*f,0,dt*4,.037);
 }else if(preset==='collide'){
  sim.splat(.16,.43+Math.sin(t)*.035,f,0,dt*5,0,.046);
  sim.splat(.84,.57+Math.sin(t*.8)*.035,-f,0,0,dt*5,.046);
 }else{
  sim.swirl(.5,.5,dt*force*.22,false);
  sim.splat(.38,.5,0,-.06*f,dt*3,0,.023);
  sim.splat(.62,.5,0,.06*f,0,dt*3,.023);
 }
}
function resize(){
 if(!context)return;
 const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,1.8);
 drawWidth=rect.width;drawHeight=rect.height;canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));
 context.setTransform(dpr,0,0,dpr,0,0);render();
}
function arrow(ctx,x,y,vx,vy,color,scale=1){
 const m=Math.hypot(vx,vy);if(m<.001)return;
 const len=Math.min(25,m*scale),dx=vx/m*len,dy=vy/m*len,ang=Math.atan2(dy,dx);
 ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(x-dx*.5,y-dy*.5);ctx.lineTo(x+dx*.5,y+dy*.5);
 ctx.lineTo(x+dx*.5-4*Math.cos(ang-.5),y+dy*.5-4*Math.sin(ang-.5));ctx.moveTo(x+dx*.5,y+dy*.5);ctx.lineTo(x+dx*.5-4*Math.cos(ang+.5),y+dy*.5-4*Math.sin(ang+.5));ctx.stroke();
}
function render(){
 if(!context)return;
 const {nx,ny,stride:s}=sim,d=pixels.data;
 for(let y=1;y<=ny;y++)for(let x=1;x<=nx;x++){
  const i=x+s*y,j=((y-1)*nx+x-1)*4;
  let r=7,g=19,b=28;
  if(view==='dye'){
   const a=1-Math.exp(-sim.a[i]*1.5),c=1-Math.exp(-sim.b[i]*1.5);
   r+=72*a+240*c;g+=215*a+103*c;b+=200*a+98*c;
  }else if(view==='speed'){
   const z=Math.min(1,Math.hypot(sim.u[i],sim.v[i])*2.2);
   r+=z*z*240;g+=z*200;b+=Math.sin(z*Math.PI*.8)*170;
  }else{
   // Canvas y points down: positive signed curl is visually clockwise.
   const omega=(sim.v[i+1]-sim.v[i-1]-sim.u[i+s]+sim.u[i-s])/(2*sim.h),z=1-Math.exp(-Math.abs(omega)*.18);
   if(omega>=0){r+=240*z;g+=100*z;b+=95*z;}else{r+=82*z;g+=220*z;b+=195*z;}
  }
  d[j]=Math.min(255,r);d[j+1]=Math.min(255,g);d[j+2]=Math.min(255,b);d[j+3]=255;
 }
 bctx.putImageData(pixels,0,0);context.imageSmoothingEnabled=true;context.drawImage(buffer,0,0,drawWidth,drawHeight);
 context.strokeStyle='#b0ebf50b';context.lineWidth=.5;
 for(let x=32;x<drawWidth;x+=40){context.beginPath();context.moveTo(x,0);context.lineTo(x,drawHeight);context.stroke();}
 for(let y=32;y<drawHeight;y+=40){context.beginPath();context.moveTo(0,y);context.lineTo(drawWidth,y);context.stroke();}
 if(vectors){context.lineWidth=1;for(let y=6;y<ny;y+=8)for(let x=6;x<nx;x+=8){const i=x+s*y;arrow(context,x/nx*drawWidth,y/ny*drawHeight,sim.u[i],sim.v[i],'#eafcffb0',70);}}
 if(keyFocus){context.strokeStyle='#ffffff';context.lineWidth=1.5;context.beginPath();context.arc(cursor.x*drawWidth,cursor.y*drawHeight,12,0,Math.PI*2);context.stroke();}
}
function updatePause(){
 $('#pause').innerHTML=paused?'▶ <span>계속하기</span>':'Ⅱ <span>일시정지</span>';
 $('#pause').setAttribute('aria-pressed',String(paused));$('#pause').setAttribute('aria-label',paused?'시뮬레이션 계속하기':'시뮬레이션 일시정지');
}
function updateViscosity(){const value=Number($('#viscosity').value);sim.viscosity=.00004+.018*(value/100)**3;$('#visc-label').textContent=value<34?'작음':value<68?'중간':'큼';$('#viscosity').setAttribute('aria-valuetext',`${value}%, 점성 ${$('#visc-label').textContent}`);}
$$('[data-preset]').forEach(button=>button.addEventListener('click',()=>{
 preset=button.dataset.preset;$$('[data-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 $('#observation').innerHTML=observations[preset];$('#try-note').textContent=notes[preset];sim.seed(preset);render();
}));
$$('[data-view]').forEach(button=>button.addEventListener('click',()=>{
 view=button.dataset.view;$$('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 const legend={dye:'<i class="ink-dot cyan"></i><i class="ink-dot coral"></i> 색은 물을 따라 이동하는 잉크예요',speed:'어두움 = 느림 · 밝은 노랑 = 빠름 (고정 색 기준)',curl:'<i class="ink-dot cyan"></i> 반시계 · <i class="ink-dot coral"></i> 시계 회전'};
 $('#view-legend').innerHTML=legend[view];render();
}));
$('#viscosity').addEventListener('input',updateViscosity);
$('#force').addEventListener('input',()=>{force=Number($('#force').value)/100;$('#force-label').textContent=force<.34?'약함':force<.68?'보통':'강함';$('#force').setAttribute('aria-valuetext',`${Math.round(force*100)}%, 미는 힘 ${$('#force-label').textContent}`);});
$('#vectors').addEventListener('change',e=>{vectors=e.target.checked;render();});
$('#emit').addEventListener('change',e=>{emit=e.target.checked;});
$('#pause').addEventListener('click',()=>{paused=!paused;updatePause();});
$('#reset').addEventListener('click',()=>{sim.seed(preset);render();});
function pos(e){const r=canvas.getBoundingClientRect();return{x:Math.max(.02,Math.min(.98,(e.clientX-r.left)/r.width)),y:Math.max(.02,Math.min(.98,(e.clientY-r.top)/r.height))};}
canvas.addEventListener('pointerdown',e=>{e.preventDefault();if(pointer!==null)return;canvas.setPointerCapture(e.pointerId);pointer={...pos(e),id:e.pointerId};sim.splat(pointer.x,pointer.y,0,0,.8,.15);$('#canvas-hint').classList.add('dismissed');render();});
canvas.addEventListener('pointermove',e=>{
 if(!pointer||e.pointerId!==pointer.id)return;
 const p=pos(e),dx=p.x-pointer.x,dy=p.y-pointer.y;
 // Bound drag impulses so a fast touch gesture cannot inject an extreme speed.
 sim.splat(p.x,p.y,Math.max(-1,Math.min(1,dx*13)),Math.max(-1,Math.min(1,dy*13)),.26,.09,.045);
 pointer={...p,id:e.pointerId};if(paused)render();
});
function release(e){if(pointer?.id===e.pointerId)pointer=null;}
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
canvas.addEventListener('focus',()=>{keyFocus=true;render();});canvas.addEventListener('blur',()=>{keyFocus=false;render();});
canvas.addEventListener('keydown',e=>{
 if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))return;e.preventDefault();
 if(e.key===' ')sim.swirl(cursor.x,cursor.y,.5);else{const dx=e.key==='ArrowLeft'?-.05:e.key==='ArrowRight'?.05:0,dy=e.key==='ArrowUp'?-.05:e.key==='ArrowDown'?.05:0;cursor.x=Math.max(.06,Math.min(.94,cursor.x+dx));cursor.y=Math.max(.06,Math.min(.94,cursor.y+dy));sim.splat(cursor.x,cursor.y,dx*3,dy*3,.6,.1);}
 $('#canvas-hint').classList.add('dismissed');render();
});
let labVisible=true;
if('IntersectionObserver' in window){const obs=new IntersectionObserver(entries=>{labVisible=entries[0].isIntersecting;},{rootMargin:'150px'});obs.observe(canvas);}
document.addEventListener('visibilitychange',()=>{visible=!document.hidden;});
if('ResizeObserver'in window)new ResizeObserver(resize).observe(canvas.parentElement);else window.addEventListener('resize',resize);
sim.seed(preset);updateViscosity();updatePause();resize();
if(!context)$('#canvas-error').hidden=false;
let last=0;function frame(now){requestAnimationFrame(frame);if(!visible||!labVisible||paused||!context){last=now;return;}if(now-last<32)return;last=now;if(emit)source(1/30);sim.step(1/30);render();}requestAnimationFrame(frame);

const termData={
 time:{en:'LOCAL ACCELERATION',title:'같은 자리에서, 흐름이 변해요.',desc:'다리 위에서 강물을 보고 있다고 생각해보세요. 아까보다 물살이 빨라지거나 방향이 바뀌면, 그 자리의 속도가 시간에 따라 변한 거예요.',take:'∂는 ‘아주 조금 바뀔 때’를 다루는 기호예요.'},
 advection:{en:'ADVECTION',title:'물을 따라가니, 빠르기가 달라져요.',desc:'물 위의 나뭇잎을 따라가 볼까요? 천천히 흐르는 곳에서 빠른 곳으로 들어가면 나뭇잎도 빨라져요. 한 자리의 흐름이 그대로여도, 이동하는 물은 다른 속도를 만날 수 있어요.',take:'속도 u가 자기 자신의 이동에도 영향을 줘요. 이 비선형성이 문제를 어렵게 합니다.'},
 pressure:{en:'PRESSURE GRADIENT',title:'압력 차이가 물을 밀어요.',desc:'유체는 주변에서 누르는 힘을 받아요. 한쪽이 더 세게 누르면, 압력에 의한 힘은 덜 누르는 쪽으로 향해요. 그림은 압력의 효과만 떼어 보여줘요.',take:'−∇p는 압력이 낮아지는 방향. 실제 흐름은 다른 힘과 원래 속도도 함께 결정해요.'},
 viscosity:{en:'VISCOUS DIFFUSION',title:'옆의 물과, 움직임을 맞춰요.',desc:'빠른 물 옆에 느린 물이 있으면 서로 영향을 줘요. 점성은 이런 속도 차이를 줄이는 쪽으로 작용합니다. 위 실험에서 점성을 키우면 작은 흐름의 요철이 더 쉽게 잦아들어요.',take:'점성은 모든 물을 무조건 멈추는 마찰이 아니라, 이웃 사이의 속도 차이를 고르게 하는 효과예요.'},
 force:{en:'EXTERNAL FORCE',title:'바깥에서 힘을 주면, 흐름이 바뀌어요.',desc:'중력이 물을 아래로 당기거나, 펌프가 흐름을 만들 수 있어요. 위 실험에서는 손가락으로 미는 동작을 국소적인 힘으로 흉내 냈어요.',take:'이 식의 f는 단위 질량당 힘. 실제 손·벽과 접촉하는 현상은 더 복잡한 경계 조건으로 다룹니다.'}
};
let selectedTerm='time',termVisible=false,termClock=0;
$$('[data-term]').forEach(button=>button.addEventListener('click',()=>{
 selectedTerm=button.dataset.term;const d=termData[selectedTerm];$$('[data-term]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});
 $('#term-en').textContent=d.en;$('#term-title').textContent=d.title;$('#term-desc').textContent=d.desc;$('#term-takeaway').textContent=d.take;$('#term-canvas').setAttribute('aria-label',d.title+' '+d.desc);drawTerm(termClock);
}));
const tc=$('#term-canvas'),tx=tc.getContext('2d');
function drawTerm(t){
 if(!tx)return;const w=500,h=240;tx.clearRect(0,0,w,h);tx.fillStyle='#0c1a24';tx.fillRect(0,0,w,h);
 tx.font='14px Arial, sans-serif';tx.lineWidth=1.5;
 if(selectedTerm==='time'){
  tx.fillStyle='#a0b4bf';tx.fillText('같은 자리의 물을 관찰해요',27,32);
  for(let y=75;y<190;y+=42)for(let x=45;x<470;x+=50)arrow(tx,x,y,1,Math.sin(t*.7+x*.007)*.2,'#77efd2',13+10*Math.sin(t*1.3));
  tx.strokeStyle='#ff927f';tx.strokeRect(228,99,44,40);tx.fillStyle='#ffb8a8';tx.fillText('관찰하는 자리',210,200);
 }else if(selectedTerm==='advection'){
  tx.fillStyle='#a0b4bf';tx.fillText('느린 곳',27,34);tx.fillText('빠른 곳',400,34);
  for(let y=78;y<195;y+=38)for(let x=45;x<470;x+=48)arrow(tx,x,y,1,0,'#77efd26a',7+x*.042);
  const x=30+((Math.exp((t%6)/6)-1)/(Math.E-1))*435;
  tx.fillStyle='#ff927f';tx.beginPath();tx.arc(x,118,7,0,Math.PI*2);tx.fill();tx.fillStyle='#ffb8a8';tx.fillText('따라가는 물 조각',190,205);
 }else if(selectedTerm==='pressure'){
  const gradient=tx.createLinearGradient(35,0,465,0);gradient.addColorStop(0,'#854749');gradient.addColorStop(1,'#123444');tx.fillStyle=gradient;tx.fillRect(30,55,440,115);
  tx.fillStyle='#ffb7a8';tx.fillText('압력 높음',33,35);tx.fillStyle='#8cead7';tx.fillText('압력 낮음',391,35);
  for(let x=70;x<445;x+=63)arrow(tx,x,110,1,0,'#ffffff',25);
  tx.fillStyle='#c4d8df';tx.fillText('압력에 의한 힘의 방향',172,203);
 }else if(selectedTerm==='viscosity'){
  tx.fillStyle='#a0b4bf';tx.fillText('서로 다른 빠르기가 점점 비슷해져요',27,32);
  const relax=(Math.sin(t*.7)+1)*.5;
  for(let y=75;y<=185;y+=26){const before=y===127?1:.22,v=before*(1-relax)+.45*relax;for(let x=55;x<460;x+=55)arrow(tx,x,y,v,0,y===127?'#ff927f':'#77efd2',40);}
 }else{
  tx.fillStyle='#a0b4bf';tx.fillText('밖에서 아래로 미는 힘',27,32);
  for(let x=65;x<460;x+=60){arrow(tx,x,80,0,1,'#ff927f',24);for(let y=135;y<195;y+=34)arrow(tx,x,y,.9,.3+.2*Math.sin(t),'#77efd2',23);}
 }
}
if('IntersectionObserver'in window)new IntersectionObserver(e=>{termVisible=e[0].isIntersecting;}).observe(tc);else termVisible=true;
drawTerm(0);let termLast=0;function termFrame(now){requestAnimationFrame(termFrame);if(!visible||!termVisible||reduced.matches||now-termLast<50)return;termLast=now;termClock=now/1000;drawTerm(termClock);}requestAnimationFrame(termFrame);

const chartSlider=$('#proof-time');
if(chartSlider){
 let bounded='',blowup='';for(let k=0;k<=198;k++){const t=k/200,x=55+t*390;bounded+=(k?'L':'M')+x.toFixed(2)+','+(225-(1+.4*Math.sin(4*t))*18).toFixed(2);blowup+=(k?'L':'M')+x.toFixed(2)+','+(225-18/(1-t)).toFixed(2);}
 $('#bounded-path').setAttribute('d',bounded);$('#blowup-path').setAttribute('d',blowup);
 function chart(){
  const t=Number(chartSlider.value)/100,y=1/(1-t),x=55+t*390,Y=225-y*18;
  $('#proof-marker').setAttribute('cx',String(x));$('#proof-marker').setAttribute('cy',String(Y));
  $('#proof-guide').setAttribute('x1',String(x));$('#proof-guide').setAttribute('x2',String(x));$('#proof-guide').setAttribute('y1',String(Y));
  $('#proof-value').textContent=`t = ${t.toFixed(2)} → ${y.toFixed(1)}`;
  $('#proof-status').textContent=t<.65?'아직은 유한한 값이에요. 시간을 1에 가깝게 옮겨보세요.':t<.9?'시간은 1보다 작은데, 값은 점점 가파르게 커져요.':'1에 가까워질수록 어떤 상한도 넘을 수 있어요. 화면 밖에서도 계속 커집니다.';
 }
 chartSlider.addEventListener('input',chart);chart();
}
const questions=[
 {q:'Navier–Stokes 방정식은 무엇을 설명할까요?',answers:['물과 공기처럼 흐르는 물질의 움직임','물 분자 하나하나의 정확한 위치','모든 물이 반드시 멈추는 시각'],correct:0,why:'각 위치의 속도가 압력·점성·외력과 흐름의 이동으로 어떻게 변하는지를 설명해요. 개별 분자를 추적하는 식은 아닙니다.'},
 {q:'소용돌이가 보이면 수학적인 특이점일까요?',answers:['네, 모든 소용돌이는 특이점이에요','아니요, 유한한 빠르기의 소용돌이도 많아요','색 잉크가 섞이면 특이점이에요'],correct:1,why:'소용돌이·난류와 특이점은 다른 개념이에요. 여기서 특이점은 매끄러운 해가 더 이상 유지되지 않는 상황이며, 발표에서는 속도가 유한 시간에 한없이 커지는 경우를 다룹니다.'},
 {q:'2026년 9월 OpenAI 발표에 맞는 설명은?',answers:['외력이 없는 모든 경우도 해결됐어요','브라우저의 2D 실험으로 수학적 증명을 했어요','매끄러운 외력이 있는 3D 흐름의 특이점 구성을 발표했어요'],correct:2,why:'OpenAI는 공식 문제의 C·D에 해당하는 결과와 Lean 형식화를 공개했어요. 외력이 없는 A·B의 결론이나 Clay의 상금 인정 절차와 구분해야 합니다.'}
];
let questionIndex=0,answered=false;
function showQuestion(){
 answered=false;const q=questions[questionIndex];$('#quiz-count').textContent=`질문 ${questionIndex+1} / ${questions.length}`;$('#quiz-question').textContent=q.q;$('#quiz-feedback').textContent='';$('#quiz-next').hidden=true;$('#quiz-options').replaceChildren();
 q.answers.forEach((a,index)=>{const b=document.createElement('button');b.type='button';b.textContent=a;b.addEventListener('click',()=>{
  if(answered)return;answered=true;const buttons=$$('#quiz-options button');buttons[q.correct].classList.add('correct');if(index!==q.correct)b.classList.add('wrong');
  buttons.forEach((button,i)=>button.setAttribute('aria-disabled','true'));$('#quiz-feedback').textContent=(index===q.correct?'맞아요! ':'함께 다시 생각해봐요. ')+q.why;$('#quiz-next').textContent=questionIndex===questions.length-1?'처음부터 다시 풀기 ↺':'다음 질문 →';$('#quiz-next').hidden=false;
 });$('#quiz-options').append(b);});
}
$('#quiz-next').addEventListener('click',()=>{questionIndex=(questionIndex+1)%questions.length;showQuestion();$('#quiz-options button').focus();});showQuestion();
if('IntersectionObserver'in window){const links=$$('.header nav a');new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){links.forEach(a=>a.classList.toggle('active',a.hash==='#'+e.target.id));}},{rootMargin:'-10% 0px -60% 0px',threshold:0}).observe($('#lab'));for(const id of ['equation','millennium']){const section=$('#'+id);if(section)new IntersectionObserver(es=>{if(es[0].isIntersecting)links.forEach(a=>a.classList.toggle('active',a.hash==='#'+id));},{rootMargin:'-10% 0px -60% 0px'}).observe(section);}}
})();
