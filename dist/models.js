'use strict';
// Pure educational models. These are separate from the 2D numerical Fluid solver.
(function(root,factory){const models=factory();if(typeof module==='object'&&module.exports)module.exports=models;else root.NSModels=models;})(typeof window!=='undefined'?window:this,()=>{
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function field(x,y,mode='river',strength=1){
  if(mode==='vortex')return{u:-(y-.5)*strength*1.8,v:(x-.5)*strength*1.8};
  // A divergence-free widening/narrowing flow: u = 0.35 + 0.65 x, v = -0.65(y-.5).
  return{u:(.35+.65*x)*strength,v:-.65*(y-.5)*strength};
 }
 function impulse(strength,time){return{vx:1+strength*time,vy:0,x:time+.5*strength*time*time};}
 function transport(x,time){return((x+.2*time)%1+1)%1;}
 function channel(widthRatio){const ratio=clamp(widthRatio,.25,1);return{inletArea:1,throatArea:ratio,inletSpeed:1,throatSpeed:1/ratio,flow:1};}
 function coreScale(progress){
  const q=clamp(progress,0,1),h=.005,tau=10**(-4*q);
  // Section 2, p.4: normalized leading-order scales, NOT exact solution values.
  // h is an illustrative allowed exponent (0 < h < .01); constants normalized to 1.
  const radius=tau**.5,height=tau**(.5-h),speed=tau**(-.5-h);
  const volume=radius*radius*height,energy=volume*speed*speed;
  return{tau,time:1-tau,radius,height,speed,volume,energy,aspect:radius/height,h};
 }
 function rotate(point,yaw,pitch){
  const [x,y,z]=point,c=Math.cos(yaw),s=Math.sin(yaw),a=x*c+z*s,b=-x*s+z*c;
  return[a,y*Math.cos(pitch)-b*Math.sin(pitch),y*Math.sin(pitch)+b*Math.cos(pitch)];
 }
 function project(point,yaw,pitch,zoom=1){const [x,y,z]=rotate(point,yaw,pitch),k=zoom*4.8/(4.8+z);return{x:x*k,y:-y*k,depth:z};}
 return{clamp,field,impulse,transport,channel,coreScale,rotate,project};
});
