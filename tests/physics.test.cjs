const {test}=require('node:test');
const assert=require('node:assert/strict');
const Fluid=require('../dist/fluid.js');
const energy=f=>f.u.reduce((s,u,i)=>s+u*u+f.v[i]*f.v[i],0);
function divergence(f){let s=0,n=0;for(let y=2;y<f.ny;y++)for(let x=2;x<f.nx;x++){const i=f.ix(x,y);s+=((f.u[i+1]-f.u[i-1]+f.v[i+f.stride]-f.v[i-f.stride])/(2*f.h))**2;n++;}return Math.sqrt(s/n);}
test('unforced fluid at rest stays at rest',()=>{const f=new Fluid(32,24);for(let i=0;i<8;i++)f.step();assert.equal(energy(f),0);});
test('pressure projection reduces divergence of a localized impulse',()=>{const f=new Fluid(60,40);f.splat(.47,.51,.8,.35);const before=divergence(f);f.project(f.u,f.v);assert.ok(divergence(f)<before*.65,`before=${before}, after=${divergence(f)}`);});
test('higher viscosity dissipates an unforced vortex faster',()=>{const low=new Fluid(60,40),high=new Fluid(60,40);low.seed('vortex');high.seed('vortex');low.viscosity=.0001;high.viscosity=.018;const initial=energy(low);for(let i=0;i<90;i++){low.step();high.step();}assert.ok(energy(low)<initial);assert.ok(energy(high)<energy(low)*.25);});
test('all presets remain finite and dye stays nonnegative under sustained forcing',()=>{for(const mode of ['stream','collide','vortex']){const f=new Fluid(50,32);f.seed(mode);for(let i=0;i<100;i++){f.splat(.18,.4,.12,.015,.1,.04);f.step();}for(const k of ['u','v','a','b'])assert.ok(f[k].every(Number.isFinite),mode+' '+k);assert.ok(f.a.every(x=>x>=0));assert.ok(f.b.every(x=>x>=0));}});
