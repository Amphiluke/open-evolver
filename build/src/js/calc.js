!function(t){"use strict";var r={},o={},n=null,e=0,a={},s={};t.importScripts("utils.js"),r.setStructure=function(t){var r,o,a=t.bonds,s=a.length;for(r=0,o=0;s>r;r++)"x"===a[o].type?a.push(a.splice(o,1)[0]):o++;return e=o,n=t},r.updateStructure=function(){t.postMessage({method:"updateStructure",data:n})},r.totalEnergy=function(){return o.totalEnergy()},r.gradient=function(){return a.alloc(),o.gradient(),a.dispose(),o.norm},r.evolve=function(t){return o.evolve(t.stepCount,t.temperature,t.stoch),r.updateStructure(),{energy:o.totalEnergy(),norm:o.norm}},r.reconnectPairs=function(t){var a,s,i,u,m,c,l=t.pair.match(/[A-Z][^A-Z]*/g),f=t.cutoff*t.cutoff,d=n.atoms,h=d.length,y=n.bonds;for(i=0;h>i;i++){if(d[i].el===l[0])c=l[1];else{if(d[i].el!==l[1])continue;c=l[0]}for(u=i+1;h>u;u++)if(d[u].el===c){for(m=e,a=y[m],s=y.length;s>m&&!(a.iAtm===i&&a.jAtm===u||a.iAtm===u&&a.jAtm===i);a=y[++m]);o.sqrDistance(i,u)>f?a&&y.splice(m,1):a||y.push({iAtm:i,jAtm:u,type:"x"})}}r.updateStructure()},t.onmessage=function(o){var n=o.data&&o.data.method;"function"==typeof r[n]&&t.postMessage({method:n,data:r[n].call(r,o.data.data)})},a.alloc=s.alloc=function(){var t=n.atoms.length;this.x=new Float32Array(t),this.y=new Float32Array(t),this.z=new Float32Array(t)},a.dispose=s.dispose=function(){this.x=this.y=this.z=null},o.sqrDistance=function(t,r){var o=n.atoms[t],e=n.atoms[r],a=o.x-e.x,s=o.y-e.y,i=o.z-e.z;return a*a+s*s+i*i},o.distance=function(t,r){return Math.sqrt(o.sqrDistance(t,r))},o.morse=function(t,r){var o=Math.exp(t.b*(t.R0-r));return t.D0*o*(o-2)},o.derivative=function(t,r){var o=t.D0*Math.exp(2*t.b*t.R0),n=-2*t.b,e=-2*Math.sqrt(t.D0*o),a=Math.exp(-t.b*r);return n*a*(o*a+.5*e)},o.gradComponent=function(t,r,e){var a=o.distance(t,r),s=o.derivative(n.bonds[e].potential,a)/a,i=n.atoms[t],u=n.atoms[r];return{x:s*(i.x-u.x),y:s*(i.y-u.y),z:s*(i.z-u.z)}},o.totalEnergy=function(){var t,r,e=0,a=n.bonds;for(t=0,r=a.length;r>t;t++)e+=o.morse(a[t].potential,o.distance(a[t].iAtm,a[t].jAtm));return e},o.gradient=function(){var r,e,s,i,u,m,c,l=n.atoms,f=l.length,d=n.bonds,h=d.length,y=t.OE.utils;for(o.norm=o.sumSqr=o.rootSumSqr=0,i=0;f>i;i++){for(a.x[i]=a.y[i]=a.z[i]=0,m=0;h>m;m++){if(d[m].iAtm===i)u=d[m].jAtm;else{if(d[m].jAtm!==i)continue;u=d[m].iAtm}r=o.gradComponent(i,u,m),a.x[i]+=r.x,a.y[i]+=r.y,a.z[i]+=r.z}e=a.x[i]*a.x[i]+a.y[i]*a.y[i]+a.z[i]*a.z[i],c=y.getAtomicMass(l[i].el),o.sumSqr+=e/c,o.rootSumSqr+=e/(c*c),o.norm+=e}for(o.rootSumSqr=Math.sqrt(o.rootSumSqr),o.norm=Math.sqrt(o.norm),s=1/o.norm,i=0;f>i;i++)a.x[i]*=s,a.y[i]*=s,a.z[i]*=s;return o.norm},o.stochGradient=function(){var r,e,i,u,m,c,l,f,d,h,y=n.atoms,x=y.length,p=n.bonds,g=p.length,z=t.OE.utils;for(i=o.norm=o.sumSqr=o.rootSumSqr=0,l=0;x>l;l++){for(a.x[l]=a.y[l]=a.z[l]=0,d=0;g>d;d++){if(p[d].iAtm===l)f=p[d].jAtm;else{if(p[d].jAtm!==l)continue;f=p[d].iAtm}r=o.gradComponent(l,f,d),a.x[l]+=r.x,a.y[l]+=r.y,a.z[l]+=r.z}e=a.x[l]*a.x[l]+a.y[l]*a.y[l]+a.z[l]*a.z[l],h=z.getAtomicMass(y[l].el),o.sumSqr+=e/h,o.rootSumSqr+=e/(h*h),o.norm+=e,s.x[l]=50-100*Math.random(),s.y[l]=50-100*Math.random(),s.z[l]=50-100*Math.random(),i+=s.x[l]*s.x[l]+s.y[l]*s.y[l]+s.z[l]*s.z[l]}for(o.rootSumSqr=Math.sqrt(o.rootSumSqr),o.norm=Math.sqrt(o.norm),i=Math.sqrt(i),c=0,u=1/o.norm,m=1/i,l=0;x>l;l++)a.x[l]*=u,a.y[l]*=u,a.z[l]*=u,s.x[l]*=m,s.y[l]*=m,s.z[l]*=m,a.x[l]+=s.x[l],a.y[l]+=s.y[l],a.z[l]+=s.z[l],c+=a.x[l]*a.x[l]+a.y[l]*a.y[l]+a.z[l]*a.z[l];for(c=Math.sqrt(c),u=1/c,l=0;x>l;l++)a.x[l]*=u,a.y[l]*=u,a.z[l]*=u;return o.norm},o.evolve=function(r,e,i){var u,m,c,l=i?o.stochGradient.bind(o):o.gradient.bind(o),f=n.atoms,d=f.length,h=12926e-8*d*e,y=Math.ceil(r/100),x=100/r,p={method:"evolve.progress"};for(a.alloc(),i&&s.alloc(),u=0;r>u;u++){for(l(),m=h*o.rootSumSqr/o.sumSqr,c=0;d>c;c++)f[c].x-=m*a.x[c],f[c].y-=m*a.y[c],f[c].z-=m*a.z[c];u%y===0&&(p.data=u*x,t.postMessage(p))}a.dispose(),i&&s.dispose()}}(this);