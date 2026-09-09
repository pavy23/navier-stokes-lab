/* Navier–Stokes Lab · independent educational implementation.
 * Collocated grid, semi-Lagrangian advection, implicit viscosity, pressure projection.
 * Domain: Nx/Ny × 1, equal cell spacing h=1/Ny. Free-slip closed walls.
 * Dye is passive and has an explicit visual fade. It never creates fluid mass.
 */
(function(root){
'use strict';
class Fluid {
  constructor(nx=128,ny=78){
    this.nx=nx;this.ny=ny;this.stride=nx+2;this.size=(nx+2)*(ny+2);this.h=1/ny;
    for(const k of ['u','v','u0','v0','p','div','a','b','a0','b0'])this[k]=new Float32Array(this.size);
    this.viscosity=.00012;this.time=0;
  }
  ix(x,y){return x+this.stride*y;}
  clear(){for(const k of ['u','v','u0','v0','p','div','a','b','a0','b0'])this[k].fill(0);this.time=0;}
  boundary(kind,q){
    const {nx,ny,stride:s}=this;
    for(let y=1;y<=ny;y++){q[s*y]=kind===1?-q[1+s*y]:q[1+s*y];q[nx+1+s*y]=kind===1?-q[nx+s*y]:q[nx+s*y];}
    for(let x=1;x<=nx;x++){q[x]=kind===2?-q[x+s]:q[x+s];q[x+s*(ny+1)]=kind===2?-q[x+s*ny]:q[x+s*ny];}
    q[0]=.5*(q[1]+q[s]);q[nx+1]=.5*(q[nx]+q[nx+1+s]);
    q[s*(ny+1)]=.5*(q[1+s*(ny+1)]+q[s*ny]);q[nx+1+s*(ny+1)]=.5*(q[nx+s*(ny+1)]+q[nx+1+s*ny]);
  }
  linear(kind,q,q0,a,c,iterations=16){
    const {nx,ny,stride:s}=this;
    for(let k=0;k<iterations;k++){
      for(let y=1;y<=ny;y++)for(let x=1;x<=nx;x++){const i=x+s*y;q[i]=(q0[i]+a*(q[i-1]+q[i+1]+q[i-s]+q[i+s]))/c;}
      this.boundary(kind,q);
    }
  }
  diffuse(kind,q,q0,nu,dt){q.set(q0);const a=dt*nu/(this.h*this.h);this.linear(kind,q,q0,a,1+4*a,10);}
  project(u,v){
    const {nx,ny,stride:s,h,p,div}=this;p.fill(0);
    for(let y=1;y<=ny;y++)for(let x=1;x<=nx;x++){const i=x+s*y;div[i]=-.5*h*(u[i+1]-u[i-1]+v[i+s]-v[i-s]);}
    this.boundary(0,div);this.boundary(0,p);this.linear(0,p,div,1,4,32);
    for(let y=1;y<=ny;y++)for(let x=1;x<=nx;x++){const i=x+s*y;u[i]-=.5*(p[i+1]-p[i-1])/h;v[i]-=.5*(p[i+s]-p[i-s])/h;}
    this.boundary(1,u);this.boundary(2,v);
  }
  advect(kind,q,q0,u,v,dt){
    const {nx,ny,stride:s,h}=this,d=dt/h;
    for(let y=1;y<=ny;y++)for(let x=1;x<=nx;x++){
      const i=x+s*y,px=Math.max(.5,Math.min(nx+.5,x-d*u[i])),py=Math.max(.5,Math.min(ny+.5,y-d*v[i]));
      const x0=Math.floor(px),y0=Math.floor(py),sx=px-x0,sy=py-y0;
      q[i]=(1-sx)*((1-sy)*q0[x0+s*y0]+sy*q0[x0+s*(y0+1)])+sx*((1-sy)*q0[x0+1+s*y0]+sy*q0[x0+1+s*(y0+1)]);
    }
    this.boundary(kind,q);
  }
  splat(px,py,fx,fy,ca=0,cb=0,radius=.045){
    const {nx,ny,stride:s}=this,cx=1+px*(nx-1),cy=1+py*(ny-1),r=radius*ny,rr=r*r;
    for(let y=Math.max(1,Math.floor(cy-3*r));y<=Math.min(ny,Math.ceil(cy+3*r));y++)
      for(let x=Math.max(1,Math.floor(cx-3*r));x<=Math.min(nx,Math.ceil(cx+3*r));x++){
        const i=x+s*y,g=Math.exp(-((x-cx)**2+(y-cy)**2)/rr);
        this.u[i]+=fx*g;this.v[i]+=fy*g;this.a[i]=Math.min(4,this.a[i]+ca*g);this.b[i]=Math.min(4,this.b[i]+cb*g);
      }
  }
  swirl(px=.5,py=.5,strength=.45,dye=true){
    const {nx,ny,stride:s}=this,cx=px*nx,cy=py*ny;
    for(let y=1;y<=ny;y++)for(let x=1;x<=nx;x++){
      const dx=(x-cx)/ny,dy=(y-cy)/ny,g=Math.exp(-(dx*dx+dy*dy)/.025),i=x+s*y;
      this.u[i]+=-dy*g*strength*12;this.v[i]+=dx*g*strength*12;
      if(dye){const col=dx>0?'a':'b';this[col][i]=Math.min(4,this[col][i]+g*1.4);}
    }
  }
  step(dt=1/30){
    this.diffuse(1,this.u0,this.u,this.viscosity,dt);this.diffuse(2,this.v0,this.v,this.viscosity,dt);
    this.project(this.u0,this.v0);
    this.advect(1,this.u,this.u0,this.u0,this.v0,dt);this.advect(2,this.v,this.v0,this.u0,this.v0,dt);
    this.project(this.u,this.v);
    this.a0.set(this.a);this.b0.set(this.b);
    this.advect(0,this.a,this.a0,this.u,this.v,dt);this.advect(0,this.b,this.b0,this.u,this.v,dt);
    const fade=Math.exp(-dt*.09);for(let i=0;i<this.size;i++){this.a[i]*=fade;this.b[i]*=fade;}
    this.time+=dt;
  }
  seed(mode){
    this.clear();
    if(mode==='vortex'){this.swirl(.50,.5,.85);this.splat(.36,.49,0,-.1,2,0,.035);this.splat(.64,.51,0,.1,0,2,.035);}
    else {
      // A smooth divergence-free initial circulation gives an immediate, readable flow.
      for(let y=1;y<=this.ny;y++)for(let x=1;x<=this.nx;x++){
        const X=x/this.nx,Y=y/this.ny,i=this.ix(x,y),phase=mode==='collide'?2:1;
        this.u[i]=.33*Math.sin(Math.PI*X)*Math.cos(Math.PI*Y*phase);
        this.v[i]=-.33/phase*this.ny/this.nx*Math.cos(Math.PI*X)*Math.sin(Math.PI*Y*phase);
        const bend=.07*Math.sin(X*9),line1=Math.exp(-(((Y-.39-bend)/.027)**2)),line2=Math.exp(-(((Y-.61+bend)/.025)**2));
        this.a[i]=line1*Math.sin(Math.PI*X)**2*1.4;this.b[i]=line2*Math.sin(Math.PI*X)**2*1.4;
      }
      this.project(this.u,this.v);
    }
  }
}
if(typeof module!=='undefined'&&module.exports)module.exports=Fluid;
root.Fluid=Fluid;
})(typeof window!=='undefined'?window:globalThis);
