'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../dist/models.js');
const close=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);

test('the sample velocity fields preserve incompressibility away from boundaries',()=>{
 const d=1e-5;
 for(const mode of ['river','vortex'])for(const [x,y] of [[.2,.3],[.5,.5],[.8,.7]]){
  const ux=(M.field(x+d,y,mode,1.7).u-M.field(x-d,y,mode,1.7).u)/(2*d);
  const vy=(M.field(x,y+d,mode,1.7).v-M.field(x,y-d,mode,1.7).v)/(2*d);
  close(ux+vy,0);
 }
});
test('zero force preserves motion, opposing force slows it, impulse matches displacement',()=>{
 close(M.impulse(0,1).vx,1);close(M.impulse(0,1).x,1);
 assert.ok(M.impulse(-.7,1).vx<M.impulse(0,1).vx);
 assert.ok(M.impulse(.7,1).x>M.impulse(0,1).x);
 close(M.impulse(.7,1).x,(1+M.impulse(.7,1).vx)/2);
});
test('narrowing the channel increases speed while preserving volume flux',()=>{
 for(const width of [.25,.4,.5,.75,1]){const c=M.channel(width);close(c.inletArea*c.inletSpeed,c.throatArea*c.throatSpeed);assert.ok(c.throatSpeed>=c.inletSpeed);}
 close(M.channel(.25).throatSpeed,4);
});
test('the inner core shrinks in both dimensions as speed grows and core energy decreases',()=>{
 let previous=M.coreScale(0);
 for(let i=1;i<=100;i++){
  const s=M.coreScale(i/100);
  for(const value of Object.values(s))assert.ok(Number.isFinite(value));
  assert.ok(s.radius<previous.radius);assert.ok(s.height<previous.height);assert.ok(s.aspect<previous.aspect);
  assert.ok(s.speed>previous.speed);assert.ok(s.energy<previous.energy);assert.ok(s.time<1);
  close(s.energy,s.tau**(.5-3*s.h));
  previous=s;
 }
 close(previous.radius,.01);assert.ok(previous.height>previous.radius);assert.ok(previous.speed>100);
});
test('3D camera rotates geometry without changing lengths and projects every supported view finitely',()=>{
 const points=[[0,0,0],[1.5,-1.38,1.5],[-1.5,-1.38,-1.5],[0,1.92,0],[.65,1.08,.65]];
 for(const p of points)for(const pitch of [-1.12,-.27,0,1.12])for(const yaw of [-Math.PI,0,.62,Math.PI]){
  close(Math.hypot(...M.rotate(p,yaw,pitch)),Math.hypot(...p));
  const v=M.project(p,yaw,pitch,2.3);assert.ok(Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.depth));
 }
 const a=M.project([1,0,0],0,0),b=M.project([1,0,0],Math.PI/2,0);assert.ok(Math.abs(a.x-b.x)>.5);
});
test('periodic tracer motion stays in its domain after many time steps',()=>{
 for(let k=0;k<=1000;k++){const x=M.transport(.1,k*.37);assert.ok(x>=0&&x<1);}
 close(M.transport(.1,5),.1);
});
