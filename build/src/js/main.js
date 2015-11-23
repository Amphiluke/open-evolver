!function(e){"use strict";function t(e){var t=e._oid;return r[t]||(t=++o,Object.defineProperty(e,"_oid",{value:t}),r[t]={}),r[t]}var a=e.OE||(e.OE={}),n=a.observer={},r={},o=0;n.on=function(e,a){var n=t(this);n[e]||(n[e]=[]),n[e].push(a)},n.off=function(e,a){var n,r=t(this);r[e]&&(a?(n=r[e].indexOf(a),n>-1&&(r[e].splice(n,1),0===r[e].length&&delete r[e])):(r[e].length=0,delete r[e]))},n.trigger=function(e){var a,n,r,o=t(this);if(o[e])for(a=Array.prototype.slice.call(arguments,1),n=0,r=o[e].length;r>n;n++)o[e][n].apply(null,a)}}(this),function(e){"use strict";var t,a=e.OE||(e.OE={}),n=a.utils={};t={H:1.00794,He:4.002602,Li:6.941,Be:9.01218,B:10.811,C:12.011,N:14.0067,O:15.9994,F:18.998403,Ne:20.179,Na:22.98977,Mg:24.305,Al:26.98154,Si:28.0855,P:30.97376,S:32.066,Cl:35.453,Ar:39.948,K:39.0983,Ca:40.078,Sc:44.95591,Ti:47.88,V:50.9415,Cr:51.9961,Mn:54.938,Fe:55.847,Co:58.9332,Ni:58.69,Cu:63.546,Zn:65.39,Ga:69.723,Ge:72.59,As:74.9216,Se:78.96,Br:79.904,Kr:83.8,Rb:85.4678,Sr:87.62,Y:88.9059,Zr:91.224,Nb:92.9064,Mo:95.94,Tc:97.9072,Ru:101.07,Rh:102.9055,Pd:106.42,Ag:107.8682,Cd:112.41,In:114.82,Sn:118.71,Sb:121.75,Te:127.6,I:126.9045,Xe:131.29,Cs:132.9054,Ba:137.33,La:138.9055,Ce:140.12,Pr:140.9077,Nd:144.24,Pm:144.9128,Sm:150.36,Eu:151.96,Gd:157.25,Tb:158.9254,Dy:162.5,Ho:164.9304,Er:167.26,Tm:168.9342,Yb:173.04,Lu:174.967,Hf:178.49,Ta:180.9479,W:183.85,Re:186.207,Os:190.2,Ir:192.22,Pt:195.08,Au:196.9665,Hg:200.59,Tl:204.383,Pb:207.2,Bi:208.9804,Po:208.9824,At:209.9871,Rn:222.0176,Fr:223.0197,Ra:226.0254,Ac:227.0278,Th:232.0381,Pa:231.0359,U:238.0289,Np:237.0482,Pu:244.0642,Am:243.0614,Cm:247.0703,Bk:247.0703,Cf:251.0796,Es:252.0828,Fm:257.0951,Md:258.0986,No:259.1009,Lr:260.1054,Rf:261,Db:262,Sg:263,Bh:262,Hs:265,Mt:266},n.getAtomicMass=function(e){return t[e]},n.getReducedMass=function(e){var t,a,r=e.match(/[A-Z][^A-Z]*/g);if(!r)throw new Error("Cannot extract element labels from string "+e);return t=n.getAtomicMass(r[0]),a=n.getAtomicMass(r[1]),t*a/(t+a)}}(this),function(e){"use strict";var t,a,n=e._,r=e.OE,o=r.app=Object.create(r.observer),i=o.actions={},s={},l=0;Object.defineProperties(o,{STARTED:{value:Object.freeze({load:!0,save:!1,saveSummary:!1,alterGraph:!1,setup:!1,transform:!1,calcEnergy:!1,calcGrad:!1,evolve:!1,alterView:!1})},STRUCTURE_LOADED:{value:Object.freeze({load:!0,save:!0,saveSummary:!1,alterGraph:!0,setup:!0,transform:!0,calcEnergy:!1,calcGrad:!1,evolve:!1,alterView:!0})},PARAMS_SET:{value:Object.freeze({load:!0,save:!0,saveSummary:!0,alterGraph:!0,setup:!0,transform:!0,calcEnergy:!0,calcGrad:!0,evolve:!0,alterView:!0})},BUSY:{value:Object.freeze({load:!1,save:!1,saveSummary:!1,alterGraph:!1,setup:!1,transform:!1,calcEnergy:!1,calcGrad:!1,evolve:!1,alterView:!1})},IDLE:{value:Object.seal({load:void 0,save:void 0,saveSummary:void 0,alterGraph:void 0,setup:void 0,transform:void 0,calcEnergy:void 0,calcGrad:void 0,evolve:void 0,alterView:void 0})}}),function(e){o._isStatePredefined=function(t){if(t===o.IDLE)return!1;for(var a=e.length-1;a>=0;a--)if(o[e[a]]===t)return!0;return!1}}(Object.getOwnPropertyNames(o)),Object.defineProperty(o,"state",{configurable:!1,enumerable:!0,get:function(){return o._isStatePredefined(t)?t:n.clone(t)},set:function(e){var a;if(e===t)return void(t===o.BUSY&&l++);if(e===o.BUSY){l++;for(a in o.IDLE)o.IDLE.hasOwnProperty(a)&&(o.IDLE[a]=i[a].enabled)}else if(e===o.IDLE){if(t!==o.BUSY||--l>0)return}else if(t===o.BUSY)return;t=o._isStatePredefined(e)?e:n.clone(e),o.trigger("stateChange")}}),o.addAction=function(e,t){i[e]=Object.create(a,{name:{value:e}}),s[e]={exec:t}},a=Object.create(Object.prototype,{enabled:{enumerable:!0,configurable:!0,get:function(){return o.state[this.name]},set:function(e){var t=o.state;e=!!e,t[this.name]!==e&&(t[this.name]=e,o.state=t)}},exec:{configurable:!0,value:function(){var e=s[this.name];e.enabled&&e.exec.apply(this,arguments)}}}),o.addAction("load",function(e){e&&r.fileAPI.load(e,function(){r.ui.report.hide()})}),o.addAction("save",function(){r.ui.save.show()}),o.addAction("saveSummary",function(){r.worker.invoke("collectStats")}),o.addAction("alterGraph",function(){r.ui.graph.show()}),o.addAction("setup",function(){r.ui.potentials.show()}),o.addAction("transform",function(){r.ui.transform.show()}),o.addAction("calcEnergy",function(){r.worker.invoke("totalEnergy")}),o.addAction("calcGrad",function(){r.worker.invoke("gradient")}),o.addAction("evolve",function(){r.ui.evolve.show()}),o.addAction("alterView",function(){r.ui.appearance.show()}),o.on("stateChange",function(){var e,t=o.state;for(e in t)t.hasOwnProperty(e)&&i.hasOwnProperty(e)&&(s[e].enabled=t[e])}),o.state=o.STARTED}(this),function(e){"use strict";var t=e.OE,a=t.app,n=t.worker=Object.create(t.observer),r=new e.Worker("src/js/calc.js"),o=null;n.invoke=function(e,t){o=e,a.state=a.BUSY,r.postMessage({method:e,data:t})},r.addEventListener("error",function(e){throw e}),r.addEventListener("message",function(e){var t=e.data&&e.data.method;t&&(t===o&&(a.state=a.IDLE,o=null),n.trigger(t,e.data.data))})}(this),function(e){"use strict";var t=e._,a=e.OE,n=a.app,r=a.structureUtils=Object.create(a.observer);a.structure={atoms:[],bonds:[],potentials:{}},r.atomList=[],r.pairList=[],r.overwrite=function(e,t,o){var i,s,l,c,d,u;if(a.structure=e,t!==!1){for(s=r.atomList,l=r.pairList,s.length=l.length=0,i=a.structure.atoms,c=0,u=i.length;u>c;c++)-1===s.indexOf(i[c].el)&&s.push(i[c].el);for(c=0,u=s.length;u>c;c++)for(d=c;u>d;d++)l.push(s[c]+s[d]);r.pairList=l.concat(l.map(function(e){return"x-"+e}))}r.trigger("updateStructure",t!==!1),o!==!0&&(n.state=n.STRUCTURE_LOADED,r.syncWorker())},r.setPotentials=function(e){var o,i,s,l=a.structure.atoms,c=a.structure.bonds;for(t.each(e,function(e,t){e.b=e.w0*Math.sqrt(a.utils.getReducedMass(t)/e.D0)*.0013559906}),a.structure.potentials=e,i=0,s=c.length;s>i;i++)o="x"===c[i].type?"x-":"",c[i].potential=e[o+l[c[i].iAtm].el+l[c[i].jAtm].el]||e[o+l[c[i].jAtm].el+l[c[i].iAtm].el];n.state=n.PARAMS_SET,r.syncWorker()},r.getCenterOfMass=function(){var e,t,n,r=a.utils,o=a.structure.atoms,i={x:0,y:0,z:0},s=0;for(t=0,n=o.length;n>t;t++)e=r.getAtomicMass(o[t].el),s+=e,i.x+=e*o[t].x,i.y+=e*o[t].y,i.z+=e*o[t].z;return i.x/=s,i.y/=s,i.z/=s,i},r.translate=function(e,t,n){var o,i,s=a.structure.atoms,l=r.getCenterOfMass(),c=e-l.x,d=t-l.y,u=n-l.z;for(o=0,i=s.length;i>o;o++)s[o].x+=c,s[o].y+=d,s[o].z+=u;r.overwrite(a.structure,!1,!1),a.view.render()},r.rotate=function(e,t){var n,o,i,s,l=a.structure.atoms,c="x"===t?"y":"x",d="z"===t?"y":"z",u=Math.sin(e),p=Math.cos(e);for(i=0,s=l.length;s>i;i++)n=l[i][c],o=l[i][d],l[i][c]=n*p+o*u,l[i][d]=o*p-n*u;r.overwrite(a.structure,!1,!1),a.view.render()},r.syncWorker=function(){a.worker.invoke("setStructure",a.structure)},a.worker.on("setStructure",function(e){r.overwrite(e,!1,!0)}),a.worker.on("updateStructure",function(e){r.overwrite(e,!1,!0),a.view.render()})}(this),function(e){"use strict";var t,a=e.OE||(e.OE={}),n=a.fileAPI={},r={};r.hin={parseMolecule:function(e,t){var a,n,r,o,i,s=t.atoms,l=t.bonds,c=s.length,d=/\s+/;for(n=0,a=e.length;a>n;n++)for(r=e[n].trim().split(d),s.push({el:r[3],x:+r[7],y:+r[8],z:+r[9]}),i=11,o=2*r[10]+11;o>i;i+=2)r[i]-1>n&&l.push({iAtm:n+c,jAtm:r[i]-1+c,type:r[i+1]})},parse:function(e){for(var t,a=/\n\s*mol\s+(\d+)([\s\S]+)\n\s*endmol\s+\1/g,n=/^atom\s+\d+\s+.+$/gm,r={atoms:[],bonds:[]};t=a.exec(e);)this.parseMolecule(t[2].match(n),r);return r}},r.ml2=r.mol2={parseMolecule:function(e,t,a){var n,r,o,i,s=a.atoms,l=a.bonds,c=s.length,d=/\s+/;for(r=0,n=e.length;n>r;r++)o=e[r].trim().split(d),i=o[5].indexOf("."),s.push({el:i>-1?o[5].slice(0,i):o[5],x:+o[2],y:+o[3],z:+o[4]});for(r=0,n=t.length;n>r;r++)o=t[r].trim().split(d),l.push({iAtm:o[1]-1+c,jAtm:o[2]-1+c,type:o[3]})},parse:function(e){var t,a,n,r,o,i,s={atoms:[],bonds:[]},l=e.split("@<TRIPOS>MOLECULE").slice(1),c=/@<TRIPOS>ATOM([\s\S]+?)(?:@<TRIPOS>|$)/,d=/@<TRIPOS>BOND([\s\S]+?)(?:@<TRIPOS>|$)/,u=/(?:\r?\n)+/;for(t=0,a=l.length;a>t;t++)n=l[t].match(c),r=n&&n[1].trim().split(u)||[],o=l[t].match(d),i=o&&o[1].trim().split(u)||[],this.parseMolecule(r,i,s);return s}},r.xyz={parseAtomRecord:function(e){var t=e.trim().split(/\s+/);return{el:t[0],x:+t[1],y:+t[2],z:+t[3]}},parse:function(e){var t=e.split(/(?:\r?\n)+/).slice(2);return t&&{atoms:t.map(this.parseAtomRecord,this),bonds:[]}}},n.load=function(e,t){this.readFile(e,function(n){var o=e.name||"",i=o.slice(o.lastIndexOf(".")+1).toLowerCase(),s=r[i]||r.hin;a.structureUtils.overwrite(s.parse(n)),a.view.render(),"function"==typeof t&&t(n)})},n.makeFile=function(e,t){return e=e.toUpperCase(),"function"==typeof this["make"+e]?this["make"+e](t):!1},n.makeHIN=function(e){var t,n,r,o,i,s,l=";The structure was saved in OpenEvolver\nforcefield mm+\n",c=a.structure.atoms,d=c.length;if("empty"===e)for(s=0;d>s;s++)t=c[s],l+="mol "+(s+1)+"\natom 1 - "+t.el+" ** - 0 "+t.x.toFixed(4)+" "+t.y.toFixed(4)+" "+t.z.toFixed(4)+" 0\nendmol "+(s+1)+"\n";else{for(n=a.structure.bonds,i=new Array(d),s=0,r=n.length;r>s;s++)o=n[s],("basic"!==e||"x"!==o.type)&&((i[o.iAtm]||(i[o.iAtm]=[])).push(o.jAtm+1+" "+o.type),(i[o.jAtm]||(i[o.jAtm]=[])).push(o.iAtm+1+" "+o.type));for(l+="mol 1\n",s=0;d>s;s++)t=c[s],l+="atom "+(s+1)+" - "+t.el+" ** - 0 "+t.x.toFixed(4)+" "+t.y.toFixed(4)+" "+t.z.toFixed(4)+" "+(i[s]?i[s].length+" "+i[s].join(" "):"0")+"\n";l+="endmol 1"}return l},n.makeML2=function(e){var t,n,r,o,i,s,l,c=a.structure.atoms,d=c.length;for(t="# The structure was saved in OpenEvolver\n@<TRIPOS>MOLECULE\n****\n"+d+" %BOND_COUNT%\nSMALL\nNO_CHARGES\n\n\n@<TRIPOS>ATOM\n",n=0,r=c.length;r>n;n++)o=c[n],t+=n+1+" "+o.el+" "+o.x.toFixed(4)+" "+o.y.toFixed(4)+" "+o.z.toFixed(4)+" "+o.el+" 1 **** 0.0000\n";if(i=0,"empty"!==e)for(s=a.structure.bonds,t+="@<TRIPOS>BOND\n",n=0,r=s.length;r>n;n++)l=s[n],("basic"!==e||"x"!==l.type)&&(i++,t+=i+" "+(l.iAtm+1)+" "+(l.jAtm+1)+" "+l.type+"\n");return t+="@<TRIPOS>SUBSTRUCTURE\n1 **** 0",t=t.replace("%BOND_COUNT%",i.toString())},n.makeXYZ=function(){var e,t,n=a.structure.atoms,r=n.length,o=r+"\nThe structure was saved in OpenEvolver";for(e=0;r>e;e++)t=n[e],o+="\n"+t.el+" "+t.x.toFixed(5)+" "+t.y.toFixed(5)+" "+t.z.toFixed(5);return o},n.readFile=function(t,a){var n,r;"string"==typeof t?(n=new XMLHttpRequest,n.open("GET",t,!0),n.addEventListener("load",function(){200===n.status&&a(n.responseText)},!1),n.send(null)):(r=new e.FileReader,r.addEventListener("load",function(){a(r.result)},!1),r.readAsText(t))},n.getBlobURL=function(a,n){var r;return r=a instanceof e.Blob?a:new e.Blob([a],{type:n||"text/plain"}),t&&e.URL.revokeObjectURL(t),t=e.URL.createObjectURL(r)}}(this),function(e){"use strict";var t=e.THREE,a=e.OE||(e.OE={}),n=a.view={},r={el:null,width:600,height:500};n.colors={get:function(e){return this._cache.hasOwnProperty(e)||(this._cache[e]=new t.Color(e)),this._cache[e]}},Object.defineProperty(n.colors,"_cache",{value:{}}),n.presets={C:{color:16711680,radius:1},H:{color:16777215,radius:.7}},Object.defineProperty(n.presets,"_def",{configurable:!0,enumerable:!1,writable:!1,value:Object.freeze(JSON.parse(JSON.stringify(n.presets.H)))}),n.atomMaterials={get:function(e){var a=n.presets[e]||n.presets[e="_def"];return this._cache.hasOwnProperty(e)||(this._cache[e]=new t.MeshLambertMaterial({color:a.color})),this._cache[e]}},Object.defineProperty(n.atomMaterials,"_cache",{value:{}}),n.atomGeometries={get:function(e){var a=n.presets[e]||n.presets[e="_def"];return this._cache.hasOwnProperty(e)||(this._cache[e]=new t.SphereGeometry(a.radius)),this._cache[e]}},Object.defineProperty(n.atomGeometries,"_cache",{value:{}}),n.bondMaterials={basic:new t.LineBasicMaterial({vertexColors:t.VertexColors}),extra:new t.LineDashedMaterial({dashSize:.2,gapSize:.1,vertexColors:t.VertexColors})},n.THREE=function(){var e,a;return e={scene:new t.Scene,group:new t.Object3D,camera:new t.PerspectiveCamera(75,r.width/r.height,.1,1e3),renderer:new t.WebGLRenderer},r.el=e.renderer.domElement,e.scene.add(e.group),a=new t.SpotLight(16777215),a.position.set(-40,60,50),e.scene.add(a,new t.AxisHelper(20)),e.camera.position.x=0,e.camera.position.y=0,e.camera.position.z=20,e.camera.lookAt(e.scene.position),e.renderer.setClearColor(0),e.renderer.setSize(r.width,r.height),e.renderer.render(e.scene,e.camera),document.getElementById("oe-view").appendChild(r.el),e}(),n.zoom=function(e){var t=n.THREE;t.camera.position.z+=e,t.camera.lookAt(t.scene.position),n.update()},n.render=function(){n.resetScene(),n.update()},n.rotation=0,n.update=function(){var e=n.THREE.group;e.rotation.y+=.05*(n.rotation-e.rotation.y),n.THREE.renderer.render(n.THREE.scene,n.THREE.camera),n.autoUpdate&&requestAnimationFrame(n.update)},n.getAtomColor=function(e){return(this.presets[e]||this.presets._def).color},n.setAtomColors=function(e){var t,a=this.presets;for(t in e)e.hasOwnProperty(t)&&this.getAtomColor(t)!==e[t]&&(a[t]||(a[t]=JSON.parse(JSON.stringify(a._def))),a[t].color=e[t],delete this.atomMaterials._cache[t])},n.setBgColor=function(e){"string"==typeof e&&(e=parseInt(e.replace("#",""),16)),this.THREE.renderer.setClearColor(e)},n.clearScene=function(){for(var e,t=n.THREE.group;e=t.children[0];)t.remove(e)},n.appearance="graph",n.resetScene=function(){n.clearScene(),"spheres"===n.appearance?n.addSceneAtoms():n.addSceneBonds()},n.addSceneAtoms=function(){var e,r,o=t.Mesh,i=n.THREE.group,s=n.atomGeometries,l=n.atomMaterials,c=a.structure.atoms,d=c.length;for(e=0;d>e;e++)r=new o(s.get(c[e].el),l.get(c[e].el)),r.position.x=c[e].x,r.position.y=c[e].y,r.position.z=c[e].z,i.add(r)},n.addSceneBonds=function(){var e,r,o,i=t.Line,s=t.Vector3,l=n.THREE.group,c=n.presets,d=n.colors,u=n.bondMaterials,p=a.structure.atoms,h=a.structure.bonds,f=h.length;for(e=0;f>e;e++)o=new t.Geometry,r=p[h[e].iAtm],o.vertices.push(new s(r.x,r.y,r.z)),o.colors.push(d.get((c[r.el]||c._def).color)),r=p[h[e].jAtm],o.vertices.push(new s(r.x,r.y,r.z)),o.colors.push(d.get((c[r.el]||c._def).color)),"x"===h[e].type?(o.computeLineDistances(),l.add(new i(o,u.extra,t.LineStrip))):l.add(new i(o,u.basic))}}(this),function(e){"use strict";var t=e.jQuery,a=e._,n=e.OE,r=n.app,o=r.actions,i=n.ui||(n.ui={}),s=t(document),l=t(document.body);i.$=function(e){return e&&e.jquery?e:t(e)},i.loadTpls=function(){return t.getJSON("src/tpl/tpl.json").done(function(e){i.tpls={},a.each(e,function(e,t){i.tpls[t]=a.template(e,{variable:"data"})})})},i.proto={init:function(){var e=this.events||(this.events={});return a.each(e,function(e){var t="string"==typeof e.handler?this[e.handler]:e.handler;i.$(e.owner||this.$el).on(e.type,e.filter||null,t.bind(this))},this),this}},i.abstractDialog=a.extend(Object.create(i.proto),{init:function(){return this.hasOwnProperty("events")&&(this.events=this.events.concat(i.abstractDialog.events)),i.proto.init.apply(this,arguments)},events:[{type:"click",filter:".oe-apply",handler:"handleApply"},{type:"click",filter:".oe-discard",handler:"handleDiscard"},{type:"keyup",owner:s,handler:"handleGlobalKeyUp"}],handleApply:function(){this.apply(),this.hide()},handleDiscard:function(){this.discard(),this.hide()},handleGlobalKeyUp:function(e){27===e.which&&(this.discard(),this.hide())},apply:t.noop,discard:t.noop,show:function(){this.$el.removeClass("hidden")},hide:function(){this.$el.addClass("hidden")},fix:function(e){var t,a,n;for(e||(e=this.$el[0].elements),t=0,a=e.length;a>t;t++)n=e[t],"checkbox"===n.type||"radio"===n.type?n.defaultChecked=n.checked:"OPTION"===n.nodeName.toUpperCase()?n.defaultSelected=n.selected:"defaultValue"in n?n.defaultValue=n.value:n.options&&this.fix(n.options)},reset:function(){this.$el[0].reset()}}),i.save=a.extend(Object.create(i.abstractDialog),{$el:t(".oe-save-form"),events:[{type:"change",owner:"#oe-file-type",handler:"handleTypeChange"},{type:"click",filter:".oe-apply",handler:"handleSave"}],handleTypeChange:function(e){this.$el.find(".type-description").addClass("hidden").filter("[data-type='"+e.target.value+"']").removeClass("hidden")},handleSave:function(e){var a=t("#oe-file-type").find("option:selected"),r=a.closest("optgroup").data("type"),o=a.data("graph"),i=n.fileAPI.makeFile(r,o);i&&(e.target.setAttribute("download","untitled."+r),e.target.href=n.fileAPI.getBlobURL(i))}}).init(),i.saveSummary=a.extend(Object.create(i.abstractDialog),{$el:t(".oe-save-summary-form"),data:null,events:[{type:"click",filter:"a[download]",handler:"handleSave"}],handleSave:function(t){var a,r;if(this.data){switch(a=t.target.getAttribute("data-type")){case"text/html":r=i.tpls.summary(this.data);break;case"application/json":r=e.JSON.stringify(this.data,null,2);break;default:r="TBD"}t.target.href=n.fileAPI.getBlobURL(r,a),this.hide()}}}).init(),i.graph=a.extend(Object.create(i.abstractDialog),{$el:t(".oe-graph-form"),init:function(){return n.structureUtils.on("updateStructure",function(e){e&&i.graph.resetHTML.call(i.graph)}),i.abstractDialog.init.apply(this,arguments)},events:[{type:"click",filter:".oe-cutoffs .oe-cutoff",handler:"handlePairSelect"},{type:"change",filter:".oe-cutoff-slider",handler:"handleSliderChange"},{type:"input",owner:"#oe-cutoff-exact",handler:"handleCutoffInput"},{type:"change",owner:"#oe-cutoff-exact",handler:"handleCutoffChange"}],handlePairSelect:function(e){var a=t(e.target),n=a.text().trim();t(e.delegateTarget).find(".oe-cutoff").not(a).removeClass("active"),a.addClass("active"),t("#oe-cutoff-exact").val(n).get(0).select(),t(".oe-cutoff-slider").val(this.cutoff2Slider(+n).toFixed(2))},handleSliderChange:function(e){var a=this.slider2Cutoff(+e.target.value);t("#oe-cutoff-exact").val(a.toFixed(4)).trigger("input"),this.updateGraph(t(".oe-cutoff.active").data("pair"),a)},handleCutoffInput:function(e){t(".oe-cutoff.active").text(e.target.value)},handleCutoffChange:function(e){e.target.checkValidity()&&(t(".oe-cutoff-slider").val(this.cutoff2Slider(+e.target.value).toFixed(2)),this.updateGraph(t(".oe-cutoff.active").data("pair"),+e.target.value))},cutoff2Slider:function(e){var a=t(".oe-cutoff-slider")[0],n=+t("#oe-cutoff-min").val(),r=+t("#oe-cutoff-max").val(),o=+a.min,i=+a.max;return o+(e-n)*(i-o)/(r-n)},slider2Cutoff:function(e){var a=t(".oe-cutoff-slider")[0],n=+t("#oe-cutoff-min").val(),r=+t("#oe-cutoff-max").val(),o=+a.min,i=+a.max;return n+(e-o)*(r-n)/(i-o)},resetHTML:function(){this.$el.find(".oe-cutoffs").html(i.tpls.cutoffs({pairs:n.structureUtils.pairList.slice(0,n.structureUtils.pairList.length/2)})).find(".oe-cutoff").eq(0).addClass("active")},updateGraph:function(e,t){n.worker.invoke("reconnectPairs",{pair:e,cutoff:t})}}).init(),i.potentials=a.extend(Object.create(i.abstractDialog),{$el:t(".oe-potential-form"),init:function(){return n.structureUtils.on("updateStructure",function(e){e&&i.potentials.resetHTML.call(i.potentials)}),i.abstractDialog.init.apply(this,arguments)},events:[{type:"change",filter:".load-potentials",handler:"handleLoad"},{type:"click",filter:".save-potentials",handler:"handleSave"}],handleLoad:function(e){n.fileAPI.readFile(e.target.files[0],function(e){var t=e.split(/\r?\n/);a.each(t,function(e){var t=e.split("	");i.potentials.$el.find("li[data-pair='"+t[0]+"'] input").val(function(e){return t[e+1]||""})})})},handleSave:function(e){var a=this.$el.find("li[data-pair]").map(function(){var e=t(this);return e.data("pair")+"	"+e.find("input").map(function(){return this.value}).get().join("	")}).get().join("\n");e.target.href=n.fileAPI.getBlobURL(a)},handleApply:function(){return this.$el[0].checkValidity()?i.abstractDialog.handleApply.apply(this,arguments):void window.alert("Please, fix invalid input first")},resetHTML:function(){this.$el.find("ul.oe-potentials").html(i.tpls.potentials({pairs:n.structureUtils.pairList}))},apply:function(){var e={};this.$el.find("li[data-pair]").each(function(a,n){var r={};n=t(n),n.find("input[data-param]").each(function(e,a){return a.value?void(r[t(a).data("param")]=+a.value):r=!1}),r&&(e[n.data("pair")]=r)}),n.structureUtils.setPotentials(e),this.fix()},discard:function(){this.reset()},show:function(){var e,a,r,o,s=n.structure.atoms,l=n.structure.bonds,c=l.length,d=[];for(o=0;c>o;o++)e="x"===l[o].type?"x-":"",a=s[l[o].iAtm].el,r=s[l[o].jAtm].el,-1===d.indexOf(e+a+r)&&(d.push(e+a+r),a!==r&&d.push(e+r+a));return this.$el.find("li[data-pair]").each(function(e,a){a=t(a),a.toggleClass("missed",-1===d.indexOf(a.data("pair")))}),i.abstractDialog.show.apply(this,arguments)}}).init(),i.transform=a.extend(Object.create(i.abstractDialog),{$el:t(".oe-transform-form"),events:[{type:"click",owner:"#oe-translate-apply",handler:"handleTranslate"},{type:"click",filter:".oe-rotate [data-axis]",handler:"handleRotate"}],handleTranslate:function(){var e=this.$el.find(".oe-translate"),t=+e.find("[data-axis='x']").val(),a=+e.find("[data-axis='y']").val(),r=+e.find("[data-axis='z']").val();n.structureUtils.translate(t,a,r)},handleRotate:function(e){var a=t("#oe-rotate-angle").val()*Math.PI/180,r=e.target.getAttribute("data-axis");n.structureUtils.rotate(a,r)},show:function(){var e=n.structureUtils.getCenterOfMass();return this.$el.find(".oe-translate input[data-axis]").val(function(){return e[t(this).data("axis")].toFixed(5)}),i.abstractDialog.show.apply(this,arguments)}}).init(),i.report=a.extend(Object.create(i.abstractDialog),{$el:t(".oe-report"),handleGlobalKeyUp:t.noop,print:function(e){this.updateProgress(100),t("#oe-report-data").html(i.tpls.report({energy:e.energy,grad:e.norm}))},updateProgress:function(e){t("#oe-report-progress").attr("value",e)}}).init(),i.evolve=a.extend(Object.create(i.abstractDialog),{$el:t(".oe-evolve-form"),events:[{type:"change",owner:"#oe-keep-log",handler:"handleKeepLogChange"}],init:function(){return n.worker.on("evolve",this.handleEvolveStop.bind(this)),n.worker.on("evolve.progress",i.report.updateProgress.bind(i.report)),i.abstractDialog.init.apply(this,arguments)},handleEvolveStop:function(e){i.report.print(e)},handleApply:function(){return this.$el[0].checkValidity()?i.abstractDialog.handleApply.apply(this,arguments):void window.alert("Please, fix invalid input first")},handleKeepLogChange:function(e){t("#oe-log-interval").prop("disabled",!e.target.checked).val("0")},apply:function(){this.fix(),n.worker.invoke("evolve",{stepCount:+t("#oe-step-count").val(),temperature:+t("#oe-temperature").val(),stoch:t("#oe-stoch").prop("checked"),logInterval:+t("#oe-log-interval").val()}),i.report.show()},discard:function(){this.reset()}}).init(),i.saveLog=a.extend(Object.create(i.abstractDialog),{$el:t(".oe-save-log-dialog"),init:function(){return n.worker.on("evolve.log",this.handleEvolveLog.bind(this)),i.abstractDialog.init.apply(this,arguments)},events:[{type:"click",filter:"a[download]",handler:"handleSave"}],handleEvolveLog:function(e){this.data=e,this.show()},handleSave:function(e){var t,a,r,o=this.data,i=o.E,s=o.grad,l=o.dt,c=0,d=e.target.getAttribute("data-delimiter");for(t="t, ps"+d+"E, eV"+d+"||grad E||, eV/Å"+d+"dt, fs",a=0,r=i.length;r>a;a++)t+="\n"+c.toExponential(4)+d+i[a].toExponential(4)+d+s[a].toExponential(4)+d+(1e15*l[a]).toExponential(4),c+=1e12*l[a];e.target.href=n.fileAPI.getBlobURL(t),this.hide(),this.data=null}}).init(),i.appearance=a.extend(Object.create(i.abstractDialog),{$el:t(".oe-appearance-form"),init:function(){return n.structureUtils.on("updateStructure",this.handleUpdateStructure.bind(this)),i.abstractDialog.init.apply(this,arguments)},events:[{type:"change",owner:"#oe-appearance-element",handler:"setCurrElementColor"},{type:"change",owner:"#oe-appearance-color",handler:"handleColorChange"}],handleUpdateStructure:function(e){e&&(t("#oe-appearance-element").html("<option selected>"+n.structureUtils.atomList.join("</option><option>")+"</option>"),this.setCurrElementColor())},handleColorChange:function(e){var a=parseInt(e.target.value.slice(1),16);isNaN(a)||(this.tmpClrPresets||(this.tmpClrPresets={}),this.tmpClrPresets[t("#oe-appearance-element").val()]=a)},apply:function(){n.view.appearance=this.$el.find("input[name='appearance']:checked").data("appearance"),n.view.setBgColor(t("#oe-bg-color").val()),this.tmpClrPresets&&(n.view.setAtomColors(this.tmpClrPresets),delete this.tmpClrPresets),n.view.render(),this.fix()},discard:function(){this.reset(),delete this.tmpClrPresets,this.setCurrElementColor()},setCurrElementColor:function(){var e,a=t("#oe-appearance-element").val();e=this.tmpClrPresets&&a in this.tmpClrPresets?this.tmpClrPresets[a]:n.view.getAtomColor(a),t("#oe-appearance-color").val("#"+("000000"+e.toString(16)).slice(-6))}}).init(),i.info=a.extend(Object.create(i.abstractDialog),{$el:t(".oe-info-dialog"),applyTpl:function(e,t){this.$el.find(".oe-info-dialog-text").html(i.tpls[e](t))}}).init(),i.menu=a.extend(Object.create(i.proto),{$el:t(".oe-menu"),init:function(){return this.setItemStates(),n.app.on("stateChange",this.setItemStates.bind(this)),i.proto.init.apply(this,arguments)},events:[{type:"click.oe",owner:s,handler:"handleGlobalClick"},{type:"mouseenter",owner:".oe-menu",filter:"button[menu]",handler:"handleHover"},{type:"click",owner:".oe-menu",filter:"menuitem[data-action]",handler:"handleAction"},{type:"change",owner:"#oe-file",handler:"handleFile"}],handleGlobalClick:function(e){var a=t(e.target),n=this.$el.find("menu.expanded");a.is(".oe-menu button[menu]")&&(n=n.not(t("#"+a.attr("menu")).toggleClass("expanded"))),n.removeClass("expanded")},handleHover:function(e){var a,n=this.$el.find("menu.expanded");n.length&&(a=t(e.target).siblings("menu"),n.is(a)||(n.removeClass("expanded"),a.addClass("expanded")))},handleAction:function(e){var a=t(e.target).data("action");o[a]&&o[a].exec&&("load"===a?t("#oe-file").trigger("click"):o[a].exec())},handleFile:function(e){o.load.exec(e.target.files[0])},setItemStates:function(e){var a=t("menuitem[data-action]");e&&(a=a.filter("[data-action='"+e+"']")),a.each(function(e,t){var a=o[t.getAttribute("data-action")].enabled,n=t.hasAttribute("disabled");a&&n?t.removeAttribute("disabled"):a||n||t.setAttribute("disabled","disabled")})}}).init(),i.view=a.extend(Object.create(i.proto),{$el:t("#oe-view"),rotData:{startX:0,startRot:0},events:[{type:"click",owner:".oe-acknowledgements",handler:"handleACKClick"},{type:"dragenter dragover",handler:"handleDragEnterOver"},{type:"dragleave",handler:"handleDragLeave"},{type:"drop",handler:"handleDrop"},{type:"wheel",handler:"handleWheelZoom"},{type:"mousedown",handler:"handleStartRotate"}],handleACKClick:function(e){e.target===e.delegateTarget&&(e.target.className+=" hidden")},handleDragEnterOver:function(e){e.preventDefault(),"dragenter"===e.type&&e.currentTarget.classList.add("oe-droppable")},handleDragLeave:function(e){e.preventDefault(),e.target===e.currentTarget&&e.target.classList.remove("oe-droppable")},handleDrop:function(e){var t=e.originalEvent.dataTransfer,a=t&&t.files;a&&a.length&&(e.preventDefault(),o.load.exec(a[0])),e.currentTarget.classList.remove("oe-droppable")},handleWheelZoom:function(e){n.view.zoom(e.originalEvent.deltaY<0?5:-5),e.preventDefault()},handleStartRotate:function(e){var t=this.rotData,a=n.view;t.startX=e.pageX,t.startRot=a.rotation,this.$el.on("mouseup.oeViewRotation mouseleave.oeViewRotation",this.handleStopRotate.bind(this)).on("mousemove.oeViewRotation",this.handleRotate.bind(this)),a.autoUpdate=!0,a.update()},handleStopRotate:function(){n.view.autoUpdate=!1,this.$el.off(".oeViewRotation")},handleRotate:function(e){var t=this.rotData;n.view.rotation=t.startRot+.02*(e.pageX-t.startX)}}).init(),n.worker.on("totalEnergy",function(e){i.info.applyTpl("energy",{energy:e,bonds:n.structure.bonds.length}),i.info.show()}),n.worker.on("gradient",function(e){i.info.applyTpl("gradient",{grad:e}),i.info.show()}),n.worker.on("collectStats",function(e){e.name=t("#oe-file")[0].files[0].name,i.saveSummary.data=e,i.saveSummary.show()}),r.on("stateChange",function(){l.toggleClass("app-busy",r.state===r.BUSY)}),r.state=r.BUSY,i.loadTpls().done(function(){r.state=r.IDLE})}(this),function(e){"use strict";function t(e){var t=s.contentDocument;return t.open(),t.write(e),t.close(),t}function a(e){var t=l.contentDocument;return t.getElementsByTagName("img")[0].src=e,t}var n,r,o,i,s,l;"download"in document.createElement("a")||(n={},r=e.URL,o=r.createObjectURL,i=r.revokeObjectURL,r.createObjectURL=function(t){var a,r=o.apply(this,arguments),i=t.type;return 0===i.indexOf("text/")?(a=new e.FileReader,a.addEventListener("load",function(e){n[r]=e.target.result}),a.readAsText(t)):0===i.indexOf("image/")&&(n[r]="\x00"),r},r.revokeObjectURL=function(e){return n.hasOwnProperty(e)&&delete n[e],i.apply(this,arguments)},s=document.createElement("iframe"),s.src="about:blank",l=document.createElement("iframe"),l.src="src/img/dot.gif",s.style.cssText=l.style.cssText="position: absolute; top: -10000px; left: -10000px;",document.body.appendChild(s),document.body.appendChild(l),document.body.addEventListener("click",function(e){setTimeout(function(){var r,o,i=e.target;if("a"===i.nodeName.toLowerCase()&&i.hasAttribute("download")){if(r=i.getAttribute("href"),0===r.indexOf("blob:")&&n.hasOwnProperty(r))o="\x00"===n[r]?a(r):t(n[r]);else if(0===r.indexOf("data:text/"))o=t(atob(r.replace(/^data:text\/\w+;base64,/,"")));else{if(0!==r.indexOf("data:image/"))return;o=a(r)}setTimeout(function(){o.execCommand("SaveAs",!0,i.getAttribute("download"))},0),e.preventDefault()}},0)},!1))}(this);