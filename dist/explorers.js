'use strict';
(() => {
 const $=id=>document.getElementById(id),all=s=>Array.from(document.querySelectorAll(s));
 const M=window.NSModels,media=window.matchMedia('(prefers-reduced-motion: reduce)');
 const C={mint:'#77efd2',orange:'#ffab82',muted:'#a9c0cd',white:'#f2f8fb',line:'#2a4251',blue:'#83b7ff'};
 let stopped=media.matches,clock=0,last=0;const surfaces=[];
 function text(ctx,s,x,y,color=C.muted,size=14,align='left'){ctx.fillStyle=color;ctx.font=`${size}px Arial, "Apple SD Gothic Neo", sans-serif`;ctx.textAlign=align;ctx.fillText(s,x,y);ctx.textAlign='left';}
 function line(ctx,x,y,X,Y,color=C.line,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(X,Y);ctx.stroke();}
 function arrow(ctx,x,y,dx,dy,color=C.mint,width=2){const a=Math.atan2(dy,dx),len=Math.hypot(dx,dy);if(len<.6){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,2,0,7);ctx.fill();return;}line(ctx,x,y,x+dx,y+dy,color,width);line(ctx,x+dx,y+dy,x+dx-5*Math.cos(a-.5),y+dy-5*Math.sin(a-.5),color,width);line(ctx,x+dx,y+dy,x+dx-5*Math.cos(a+.5),y+dy-5*Math.sin(a+.5),color,width);}
 function dot(ctx,x,y,r,color=C.mint){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
 function surface(id,draw,animate=true){
  const canvas=$(id);if(!canvas)return null;const ctx=canvas.getContext('2d');if(!ctx){canvas.insertAdjacentHTML('afterend','<p class="visual-note">이 브라우저에서는 그림을 표시할 수 없어요. 조절값과 아래 설명으로 결과를 확인하세요.</p>');return null;}
  const s={canvas,ctx,draw,animate,visible:false,w:400,h:240};
  s.render=()=>{ctx.setTransform(s.dpr,0,0,s.dpr,0,0);ctx.clearRect(0,0,s.w,s.h);ctx.fillStyle='#0b1a24';ctx.fillRect(0,0,s.w,s.h);draw(ctx,s.w,s.h,clock);};
  s.resize=()=>{const rect=canvas.getBoundingClientRect();if(rect.width<1||rect.height<1)return;s.w=rect.width;s.h=rect.height;s.dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(s.w*s.dpr);canvas.height=Math.round(s.h*s.dpr);s.render();};
  surfaces.push(s);if('ResizeObserver'in window)new ResizeObserver(s.resize).observe(canvas);else window.addEventListener('resize',s.resize);
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{s.visible=entries[0].isIntersecting;if(s.visible)s.resize();},{rootMargin:'80px'}).observe(canvas);else s.visible=true;
  s.resize();return s;
 }
 function repaint(){surfaces.forEach(s=>{if(s.visible)s.render();});}
 function motionButton(){$('lesson-motion').textContent=stopped?'설명 그림 재생':'설명 그림 일시정지';$('lesson-motion').setAttribute('aria-pressed',String(stopped));}
 $('lesson-motion').addEventListener('click',()=>{stopped=!stopped;motionButton();document.dispatchEvent(new CustomEvent('ns:motion',{detail:stopped}));repaint();});
 media.addEventListener('change',e=>{stopped=e.matches;motionButton();document.dispatchEvent(new CustomEvent('ns:motion',{detail:stopped}));repaint();});motionButton();
 let fieldMode='river',strength=1,probe={x:.52,y:.5};
 function fieldRead(){const v=M.field(probe.x,probe.y,fieldMode,strength),speed=Math.hypot(v.u,v.v);$('field-strength-value').textContent=strength.toFixed(1)+'배';$('field-readout').textContent=`선택한 자리: ${Math.abs(v.u)<.02?'좌우 이동 거의 없음':v.u>0?'오른쪽':'왼쪽'} · ${Math.abs(v.v)<.02?'상하 이동 거의 없음':v.v>0?'아래쪽':'위쪽'} / 빠르기 ${speed.toFixed(2)} (비교값)`;}
 const field=surface('field-demo',(ctx,w,h,t)=>{
  const left=22,top=35,W=w-44,H=h-65;
  text(ctx,'한 자리를 골라보세요',18,22,C.muted,13);
  for(let row=0;row<5;row++)for(let col=0;col<7;col++){
   const x=(col+.5)/7,y=(row+.5)/5,v=M.field(x,y,fieldMode,strength),scale=Math.min(28,W/9);
   arrow(ctx,left+x*W-v.u*scale/2,top+y*H-v.v*scale/2,v.u*scale,v.v*scale,C.mint,1.6);
  }
  for(let k=0;k<16;k++){
   let x,y;if(fieldMode==='vortex'){const a=k*2.4+t*.45,r=.1+(k%4)*.1;x=.5+Math.cos(a)*r;y=.5+Math.sin(a)*r;}else{x=((k*.618+t*.09*strength)%1);y=.15+(k%5)*.16;}
   dot(ctx,left+x*W,top+y*H,2,'#d3fff55c');
  }
  const v=M.field(probe.x,probe.y,fieldMode,strength),x=left+probe.x*W,y=top+probe.y*H;
  ctx.strokeStyle=C.white;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,13,0,7);ctx.stroke();arrow(ctx,x,y,v.u*32,v.v*32,C.orange,3);
 });
 function probeEvent(e){const r=$('field-demo').getBoundingClientRect();probe={x:M.clamp((e.clientX-r.left-22)/(r.width-44),0,1),y:M.clamp((e.clientY-r.top-35)/(r.height-65),0,1)};fieldRead();field?.render();}
 $('field-demo').addEventListener('pointerdown',probeEvent);
 $('field-demo').addEventListener('pointermove',e=>{if(e.pointerType==='mouse')probeEvent(e);});
 $('field-demo').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();probe.x=M.clamp(probe.x+(e.key==='ArrowRight'?.08:e.key==='ArrowLeft'?-.08:0),0,1);probe.y=M.clamp(probe.y+(e.key==='ArrowDown'?.08:e.key==='ArrowUp'?-.08:0),0,1);fieldRead();field?.render();});
 all('[data-field]').forEach(b=>b.addEventListener('click',()=>{fieldMode=b.dataset.field;all('[data-field]').forEach(k=>k.setAttribute('aria-pressed',String(k===b)));fieldRead();field?.render();}));
 $('field-strength').addEventListener('input',e=>{strength=+e.target.value/100;fieldRead();field?.render();});fieldRead();
 let push=.5,pushTime=1,pushRunning=false;
 function pushRead(){const now=M.impulse(push,pushTime);$('push-value').textContent=push===0?'힘 없음':`${push>0?'앞으로':'뒤로'} ${push.toFixed(1)}`;$('push-result').textContent=`${pushTime.toFixed(1)}초 뒤 빠르기: 힘 없음 1.00 / 힘 받음 ${now.vx.toFixed(2)}. ${push<0?'뒤로 미는 힘은 앞으로 가던 움직임을 늦춰요.':push===0?'외력이 0이어도 원래 속도는 남아요.':'앞으로 미는 힘은 속도를 높여요.'}`;}
 const force=surface('force-demo',(ctx,w,h)=>{
  const L=25,R=w-38,scale=(R-L)/2;
  for(let i=0;i<2;i++){const y=76+i*89;line(ctx,L,y,R,y);text(ctx,i?'같은 시작 + 외력':'원래 속도 유지',L,y-28,i?C.orange:C.mint,14);const state=M.impulse(i?push:0,pushTime),x=L+state.x*scale;dot(ctx,x,y,9,i?C.orange:C.mint);arrow(ctx,x,y+21,state.vx*Math.min(34,w/12),0,i?C.orange:C.mint);}
  text(ctx,`${pushTime.toFixed(1)}초`,w-18,24,C.white,14,'right');
 });
 $('push-strength').addEventListener('input',e=>{push=+e.target.value/100;pushRunning=false;pushTime=1;pushRead();force?.render();});
 $('push-start').addEventListener('click',()=>{pushTime=stopped?1:0;pushRunning=!stopped;pushRead();force?.render();});pushRead();
 let stepTime=0,stepCount=0,stepSize=.25;
 const step=surface('step-demo',(ctx,w,h)=>{
  text(ctx,'같은 방향으로 일정하게 흐르는 물',18,25,C.muted,13);
  const y=h*.49,L=20,W=w-40;
  for(let i=0;i<6;i++)arrow(ctx,L+(i+.4)/6*W,y-35,18,0,'#77efd26b',1.5);
  line(ctx,L,y,W+L,y,C.line,2);
  for(let k=0;k<6;k++){const x=M.transport(.07+k*.15,stepTime);dot(ctx,L+x*W,y,7,k===0?C.orange:C.mint);}
  text(ctx,'주황 점도 물을 따라 이동해요',w/2,h-32,C.orange,13,'center');
 },false);
 $('step-size').addEventListener('input',e=>{stepSize=+e.target.value/100;$('step-size-value').textContent=stepSize.toFixed(2)+'초';});
 function stepRead(){$('step-readout').textContent=`${stepCount}번 계산 · ${stepTime.toFixed(2)}초 / 오른쪽으로 나간 점은 왼쪽에서 다시 들어와요.`;step?.render();}
 $('step-forward').addEventListener('click',()=>{stepTime+=stepSize;stepCount++;stepRead();});$('step-reset').addEventListener('click',()=>{stepTime=0;stepCount=0;stepRead();});
 const termDefs={
  time:{label:'관찰할 시간',value:q=>`${(q*2).toFixed(1)}초`,result:q=>`같은 자리의 오른쪽 속도가 ${(0.3+q*.8).toFixed(2)}로 바뀌었어요. 위치는 그대로 두고 시간을 비교합니다.`},
  advection:{label:'따라가는 물 조각의 위치',value:q=>`${Math.round(q*100)}%`,result:q=>`지금 만나는 속도는 ${(0.35+q*.65).toFixed(2)}. 오른쪽으로 갈수록 빠른 곳을 만나요. 각 자리의 속도 자체는 시간에 따라 바뀌지 않습니다.`},
  pressure:{label:'압력 차이의 방향과 크기',value:q=>Math.abs(q-.5)<.01?'같은 압력':q>.5?'왼쪽이 더 높음':'오른쪽이 더 높음',result:q=>Math.abs(q-.5)<.01?'압력 차이가 0이라 이 항이 만드는 가속도도 0이에요.':`압력의 힘은 ${q>.5?'오른쪽':'왼쪽'}으로 작용해요. 압력 차이가 클수록 더 세게 밀어요.`},
  viscosity:{label:'같은 시간 동안의 점성 효과',value:q=>`${Math.round(q*100)}%`,result:q=>`이웃 사이의 최대 속도 차이: ${(1.3*Math.exp(-3*q)).toFixed(2)}. 차이는 줄지만 평균 속도 1은 남아 있어요.`},
  force:{label:'위아래로 미는 외력',value:q=>Math.abs(q-.5)<.01?'힘 없음':`${q>.5?'아래로':'위로'} ${Math.abs(2*q-1).toFixed(1)}`,result:q=>Math.abs(q-.5)<.01?'외력이 0이어도 원래 오른쪽 속도는 남아요.':`원래 오른쪽 속도에 ${q>.5?'아래쪽':'위쪽'} 가속도가 더해져요. 주황은 힘, 청록은 1초 뒤 속도입니다.`}
 };
 let termName='time',termValue=.5;
 function termRead(){const d=termDefs[termName];$('term-control-label').textContent=d.label;$('term-amount-value').textContent=d.value(termValue);$('term-result').textContent=d.result(termValue);$('term-canvas').setAttribute('aria-label',$('term-title').textContent+' '+d.result(termValue));}
 const term=surface('term-canvas',(ctx,w,h,t)=>{
  const q=termValue,L=26,W=w-52,mid=h*.52;
  if(termName==='time'){
   text(ctx,'고정한 관찰 위치',L,29,C.muted,14);
   for(let y=66;y<h-35;y+=40)for(let x=L;x<w-25;x+=W/7)arrow(ctx,x,y,(.3+.8*q)*Math.min(31,W/9),0,C.mint);
   ctx.strokeStyle=C.orange;ctx.lineWidth=2;ctx.strokeRect(w/2-19,mid-23,38,46);text(ctx,`${(q*2).toFixed(1)}초`,w-20,29,C.white,14,'right');
  }else if(termName==='advection'){
   text(ctx,'느린 곳',L,29,C.muted);text(ctx,'빠른 곳',w-24,29,C.muted,14,'right');
   for(let y=72;y<h-35;y+=40)for(let i=0;i<7;i++){const x=(i+.4)/7;arrow(ctx,L+x*W,y,(.35+.65*x)*Math.min(33,W/8),0,'#77efd287');}
   const x=L+q*W;dot(ctx,x,mid,9,C.orange);line(ctx,x,mid-24,x,mid+24,C.orange,1);text(ctx,'물 조각을 따라가요',w/2,h-17,C.orange,14,'center');
  }else if(termName==='pressure'){
   const a=2*q-1,g=ctx.createLinearGradient(L,0,w-L,0);g.addColorStop(0,a>0?'#923f45':a<0?'#123745':'#254954');g.addColorStop(1,a>0?'#123745':a<0?'#923f45':'#254954');ctx.fillStyle=g;ctx.fillRect(L,55,W,h-102);
   text(ctx,a===0?'같음':a>0?'높음':'낮음',L,32,C.white);text(ctx,a===0?'같음':a>0?'낮음':'높음',w-L,32,C.white,14,'right');
   for(let k=1;k<6;k++)arrow(ctx,L+k*W/6,mid,a*Math.min(35,W/7),0,C.white,2);text(ctx,'압력에 의한 힘',w/2,h-18,C.white,14,'center');
  }else if(termName==='viscosity'){
   text(ctx,'속도 차이를 고르게 해요',L,29,C.muted);
   for(let i=0;i<5;i++){const y=63+i*(h-103)/4,v=1+.65*Math.exp(-3*q)*Math.cos(i*Math.PI/2),before=1+.65*Math.cos(i*Math.PI/2);text(ctx,v.toFixed(2),w-22,y+5,C.white,13,'right');for(let k=0;k<4;k++){const x=L+k*(W-40)/4;line(ctx,x,y,x+before*25,y,'#69808d70',5);arrow(ctx,x,y,v*25,0,i===0||i===4?C.orange:C.mint,2.5);}}
  }else{
   const a=2*q-1;text(ctx,'주황: 힘 / 청록: 1초 뒤 속도',L,29,C.muted,13);
   for(let k=0;k<5;k++){const x=L+(k+.3)*W/5;dot(ctx,x,mid,3,C.white);arrow(ctx,x,mid,0,a*42,C.orange,3);arrow(ctx,x,mid,Math.min(35,W/7),a*32,C.mint,2);}
  }
 },false);
 document.addEventListener('ns:term',e=>{termName=e.detail;termValue=.5;$('term-amount').value=50;termRead();term?.render();});
 $('term-amount').addEventListener('input',e=>{termValue=+e.target.value/100;termRead();term?.render();});termRead();
 let widthRatio=.5;
 function sectionArea(x){return 1-(1-widthRatio)*Math.exp(-(((x-.5)/.19)**4));}
 let travel=[],travelTotal=0;
 function channelRead(){const d=M.channel(widthRatio);$('channel-width-value').textContent=Math.round(widthRatio*100)+'%';$('channel-result').textContent=`입구: 1 × 1 = 1 / 좁은 곳: ${d.throatArea.toFixed(2)} × ${d.throatSpeed.toFixed(2)} = 1. 같은 양이 지나가려면 ${d.throatSpeed.toFixed(1)}배 빨라져야 해요.`;travel=[0];for(let i=1;i<=240;i++)travel[i]=travel[i-1]+sectionArea((i-.5)/240)/240;travelTotal=travel[240];}
 channelRead();
 const channel=surface('channel-demo',(ctx,w,h,t)=>{
  const L=20,W=w-40,mid=h/2,H=Math.min(68,h*.26),top=[],bottom=[];
  for(let k=0;k<=100;k++){const x=k/100,A=sectionArea(x);top.push([L+x*W,mid-A*H]);bottom.push([L+x*W,mid+A*H]);}
  ctx.fillStyle='#15303c';ctx.beginPath();top.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));bottom.reverse().forEach(([x,y])=>ctx.lineTo(x,y));ctx.closePath();ctx.fill();ctx.strokeStyle='#4d8290';ctx.lineWidth=2;ctx.stroke();
  for(let k=0;k<45;k++){const distance=((k/45+t*.09)%1)*travelTotal;let i=1;while(i<240&&travel[i]<distance)i++;const x=(i-1+(distance-travel[i-1])/(travel[i]-travel[i-1]))/240,vertical=((k%5)-2)/2*.7;dot(ctx,L+x*W,mid+vertical*sectionArea(x)*H,2.8,k%3===0?C.orange:C.mint);}
  text(ctx,'폭 100%',L,29,C.muted);text(ctx,`폭 ${Math.round(widthRatio*100)}%`,w/2,29,C.muted,14,'center');
  text(ctx,'속도 1배',L,h-24,C.mint);text(ctx,`속도 ${(1/widthRatio).toFixed(1)}배`,w/2,h-24,C.orange,14,'center');
 });
 $('channel-width').addEventListener('input',e=>{widthRatio=+e.target.value/100;channelRead();channel?.render();});
 let resolution=8;
 const grid=surface('grid-demo',(ctx,w,h)=>{const L=25,W=w-50,top=28,H=h-52,n=resolution;for(let row=0;row<n;row++)for(let col=0;col<n;col++){const x=(col+.5)/n,y=(row+.5)/n,v=M.field(x,y,'vortex');ctx.strokeStyle='#284452';ctx.lineWidth=.5;ctx.strokeRect(L+col*W/n,top+row*H/n,W/n,H/n);arrow(ctx,L+x*W,top+y*H,v.u*W/n*.65,v.v*H/n*.65,C.mint,1);}text(ctx,`${n*n}개 구역에서 값을 계산`,L,19,C.white,13);},false);
 $('grid-resolution').addEventListener('input',e=>{resolution=+e.target.value;$('grid-value').textContent=`${resolution} × ${resolution} = ${resolution*resolution}개`;grid?.render();});
 all('[data-scope]').forEach(b=>b.addEventListener('click',()=>{const forced=b.dataset.scope==='forced';all('[data-scope]').forEach(k=>k.setAttribute('aria-pressed',String(k===b)));$('scope-force').textContent=forced?'매끄러운 외력':'외력 없음';$('scope-outcome').textContent=forced?'특이점 구성 발표':'이번 발표의 결론 아님';$('scope-visual').classList.toggle('unforced',!forced);$('scope-text').textContent=forced?'외력이 허용되는 조건에서 매끄러움이 깨지는 사례를 구성했다는 발표입니다. 모든 외력이 특이점을 만든다는 뜻은 아니에요.':'A·B는 외력이 없는 경우에 관한 질문입니다. 외력을 사용한 C·D 구성만으로 A·B의 답이 따라오지는 않아요.';}));
 let aiMode='search';
 const aiCopy={search:'점들은 여러 탐색 작업을 대표하는 도식입니다. OpenAI는 약 1만 에이전트, 약 88시간의 해법 탐색을 보고했습니다.',lean:'논리 단계를 형식 언어로 옮겨 검사합니다. OpenAI가 보고한 Lean 형식화·검증 시간은 추가 17시간입니다.',review:'형식 검증은 명시된 정의와 명제의 논리를 확인합니다. 그 명제가 원래 문제의 조건을 정확히 다루는지도 독립적으로 살펴봐야 해요.'};
 const ai=surface('ai-demo',(ctx,w,h,t)=>{
  if(aiMode==='search'){
   const cols=10,dx=(w*.52-35)/cols,dy=(h-56)/10;for(let j=0;j<10;j++)for(let i=0;i<10;i++){const pulse=.45+.45*Math.sin(t*1.4+i+j);dot(ctx,22+i*dx,35+j*dy,2.2+pulse,C.mint);}
   arrow(ctx,w*.54,h*.5,w*.12,0,C.mint,2);ctx.strokeStyle=C.mint;ctx.lineWidth=1.5;ctx.strokeRect(w*.72,h*.33,w*.22,h*.32);text(ctx,'해법 후보',w*.83,h*.5+5,C.white,Math.min(14,w*.035),'center');
  }else if(aiMode==='lean'){
   const blocks=4;for(let k=0;k<blocks;k++){const y=32+k*41;ctx.fillStyle='#17313d';ctx.fillRect(24,y,w-48,29);dot(ctx,39,y+14,4,C.mint);text(ctx,['정의와 가정','작은 보조정리','정리 사이의 연결','최종 명제'][k],56,y+20,C.white,14);text(ctx,'논리 점검',w-35,y+20,C.mint,13,'right');}
  }else{
   const names=['문제의 조건','논문의 논리','형식화의 의미'];names.forEach((name,k)=>{const x=22+k*(w-44)/3;ctx.strokeStyle=C.blue;ctx.strokeRect(x,55,(w-60)/3,h-100);text(ctx,name,x+(w-60)/6,h/2+4,C.white,Math.min(14,w*.038),'center');});text(ctx,'여러 관점에서 다시 확인',w/2,h-19,C.muted,14,'center');
  }
 });
 all('[data-ai]').forEach(b=>b.addEventListener('click',()=>{aiMode=b.dataset.ai;all('[data-ai]').forEach(k=>k.setAttribute('aria-pressed',String(k===b)));$('ai-readout').textContent=aiCopy[aiMode];ai?.render();}));
 const recognitionCopy=[
  '2026.09.08 OpenAI가 논문과 Lean 코드를 공개했습니다. 발표 자료를 누구나 살펴볼 수 있는 단계이며 공식 인정과는 별개입니다.',
  '매끄러운 외력·초기 조건·점성·정의역 등 원래 문제의 조건을 충족하는지, 논리와 형식화가 타당한지를 독립적으로 살펴보는 과정입니다. 이 단계가 완료됐다고 표시하는 것은 아닙니다.',
  '2026.09.09 확인한 Clay 페이지는 Unsolved로 표시합니다. 규정에는 적격 출판물 게재 후 최소 2년과 수학계의 일반적인 수용 등이 포함됩니다. OpenAI는 상금을 청구할 의사가 없다고 밝혔습니다.'
 ];
 all('[data-recognition]').forEach(b=>b.addEventListener('click',()=>{all('[data-recognition]').forEach(k=>k.setAttribute('aria-pressed',String(k===b)));$('recognition-detail').textContent=recognitionCopy[+b.dataset.recognition];}));
 let quizIndex=0;
 const hints=['화살표는 각 위치의 물이 움직이는 방향과 빠르기를 뜻해요. 물 분자 하나를 그린 것은 아닙니다.','빙글빙글 도는 유한한 속도의 흐름도 얼마든지 있어요. 회전한다는 사실만으로 특이점이라고 말할 수 없어요.','외력이 있는 3D 조건이 이번 발표의 핵심입니다. 조건을 빼거나 2D 실험만 보고 같은 결론을 내릴 수는 없어요.'];
 const quiz=surface('quiz-demo',(ctx,w,h,t)=>{
  if(quizIndex<2){for(let j=0;j<4;j++)for(let i=0;i<8;i++){const x=(i+.5)/8,y=(j+.5)/4,v=M.field(x,y,quizIndex?'vortex':'river');arrow(ctx,20+x*(w-40),25+y*(h-62),v.u*26,v.v*26,C.mint,1.5);}text(ctx,quizIndex?'회전하는 흐름':'위치마다 방향과 빠르기',w/2,h-12,C.muted,14,'center');}
  else{const pts=[[0,.25,0],[0,-.25,0],[.5,0,0],[-.5,0,0],[0,0,.5],[0,0,-.5]];for(let i=0;i<6;i++){const p=M.project(pts[i],t*.18+.5,-.2);line(ctx,w*.28,h*.48,w*.28+p.x*80,h*.48+p.y*100,C.mint,2);}arrow(ctx,w*.45,h*.5,w*.15,0,C.orange,2);text(ctx,'3D + 외력',w*.74,h*.5+6,C.white,17,'center');text(ctx,'이번 발표가 다룬 조건',w/2,h-15,C.muted,14,'center');}
 });
 function quizRead(){quizIndex=Math.max(0,Math.min(2,Number(($('quiz-count').textContent.match(/질문 (\d)/)||[])[1]||1)-1));$('quiz-hint').textContent=hints[quizIndex];$('quiz-hint').hidden=true;$('quiz-hint-toggle').textContent='그림 힌트 펼치기 ＋';$('quiz-hint-toggle').setAttribute('aria-expanded','false');$('quiz-demo').setAttribute('aria-label',['위치별 속도 화살표로 표현한 유체','유한한 속도로 회전하는 화살표','3차원 흐름에 외력이 더해지는 조건 도식'][quizIndex]);quiz?.render();}
 new MutationObserver(quizRead).observe($('quiz-count'),{childList:true,characterData:true,subtree:true});quizRead();
 $('quiz-hint-toggle').addEventListener('click',()=>{const open=$('quiz-hint').hidden;$('quiz-hint').hidden=!open;$('quiz-hint-toggle').setAttribute('aria-expanded',String(open));$('quiz-hint-toggle').textContent=open?'그림 힌트 접기 −':'그림 힌트 펼치기 ＋';});
 function frame(now){requestAnimationFrame(frame);if(!last){last=now;return;}if(now-last<40)return;const dt=Math.min(.06,(now-last)/1000);last=now;if(document.hidden||stopped)return;clock+=dt;if(pushRunning&&force?.visible){pushTime=Math.min(1,pushTime+dt*.65);if(pushTime===1){pushRunning=false;pushRead();}}surfaces.forEach(s=>{if(s.visible&&s.animate)s.render();});}
 requestAnimationFrame(frame);
})();
