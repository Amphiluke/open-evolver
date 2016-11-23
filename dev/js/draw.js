import * as THREE from "three"; // http://stackoverflow.com/a/40251527
import Cacheable from "./cacheable.js";
import structure from "./structure.js";

let colors = new Cacheable(color => new THREE.Color(color));

let presets = Object.create({
    get(el) {
        return this.hasOwnProperty(el) ? this[el] : this._def;
    },
    set(el, value) {
        if (this.hasOwnProperty(el)) {
            Object.assign(this[el], value);
        } else {
            this[el] = Object.assign({}, this._def, value);
        }
    }
}, {
    _def: {value: Object.freeze({color: 0xFFFFFF, radius: 1})}
});

presets.set("C", {color: 0xFF0000});
presets.set("H", {radius: 0.7});


let pointMaterials = new Cacheable(atom => {
    let preset = presets.get(atom);
    return new THREE.PointsMaterial({color: preset.color, sizeAttenuation: false});
});

let atomMaterials = new Cacheable(atom => {
    let preset = presets.get(atom);
    return new THREE.MeshLambertMaterial({color: preset.color});
});

let atomGeometries = new Cacheable(atom => {
    let preset = presets.get(atom);
    return new THREE.SphereGeometry(preset.radius);
});

let bondMaterials = new Cacheable(type => {
    // There are only 2 graph types: "basic" and "extra", however construction of bond materials through `Cacheable`
    // has an advantage of lazy instantiation of complex objects (instances will be created only on actual need)
    if (type === "extra") {
        return new THREE.LineDashedMaterial({dashSize: 0.2, gapSize: 0.1, vertexColors: THREE.VertexColors});
    } else { // type === "basic"
        return new THREE.LineBasicMaterial({vertexColors: THREE.VertexColors});
    }
});

let canvas;
let assets3;

let rotation = 0;

let draw = {
    setup(canvasEl) {
        canvas = {el: canvasEl, width: canvasEl.offsetWidth, height: canvasEl.offsetHeight};
        assets3 = {
            scene: new THREE.Scene(),
            group: new THREE.Object3D(),
            camera: new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000),
            spotLight: new THREE.SpotLight(0xFFFFFF),
            renderer: new THREE.WebGLRenderer({canvas: canvasEl})
        };
        assets3.spotLight.position.set(-40, 60, 50);
        assets3.scene.add(assets3.group, assets3.spotLight);
        assets3.camera.position.x = 0;
        assets3.camera.position.y = 0;
        assets3.camera.position.z = 20;
        assets3.camera.lookAt(assets3.scene.position);
        assets3.renderer.setClearColor(0x000000);
        assets3.renderer.setSize(canvas.width, canvas.height);
        assets3.renderer.render(assets3.scene, assets3.camera);
    },

    get canvas() {
        return canvas.el;
    },

    get rotation() {
        return rotation;
    },
    set rotation(value) {
        if (value !== rotation && Number.isFinite(value)) {
            rotation = value;
            assets3.group.rotation.y += (rotation - assets3.group.rotation.y) * 0.05;
        }
    },

    appearance: "graph",

    zoom(delta) {
        assets3.camera.position.z += delta;
        assets3.camera.lookAt(assets3.scene.position);
        this.update();
    },

    resize(width = canvas.el.offsetWidth, height = canvas.el.offsetHeight) {
        if (width > 0 && height > 0 && (width !== canvas.width || height !== canvas.height)) {
            assets3.camera.aspect = width / height;
            assets3.camera.updateProjectionMatrix();
            assets3.renderer.setSize(width, height, false);
            canvas.width = width;
            canvas.height = height;
            this.update();
        }
    },

    render() {
        this.resetScene();
        this.update();
    },

    update() {
        assets3.renderer.render(assets3.scene, assets3.camera);
        if (this.autoUpdate) {
            requestAnimationFrame(() => this.update());
        }
    },

    getAtomColor(el) {
        return presets.get(el).color;
    },

    setAtomColors(colors) {
        for (let [el, color] of colors) {
            if (this.getAtomColor(el) !== color) {
                presets.set(el, {color});
                // Sphere and point materials (and colors) are cached. Forces colors to update
                atomMaterials.renew(el);
                pointMaterials.renew(el);
            }
        }
    },

    setBgColor(color) {
        if (typeof color === "string") {
            color = Number(color.replace("#", "0x"));
        }
        assets3.renderer.setClearColor(color);
    },

    clearScene() {
        let group = assets3.group;
        let child = group.children[0];
        while (child) {
            group.remove(child);
            child = group.children[0];
        }
    },

    resetScene() {
        this.clearScene();
        if (this.appearance === "spheres") {
            this.addSceneAtoms();
        } else if (structure.structure.bonds.length) {
            this.addSceneBonds();
        } else {
            this.addScenePoints();
        }
    },

    addSceneAtoms() {
        let Mesh = THREE.Mesh,
            group = assets3.group;
        for (let {el, x, y, z} of structure.structure.atoms) {
            let atom3 = new Mesh(atomGeometries.get(el), atomMaterials.get(el));
            atom3.position.x = x;
            atom3.position.y = y;
            atom3.position.z = z;
            group.add(atom3);
        }
    },

    addSceneBonds() {
        let Line = THREE.Line,
            Vector3 = THREE.Vector3,
            group = assets3.group,
            atoms = structure.structure.atoms,
            bindMap = new Int8Array(atoms.length);
        for (let {type, iAtm, jAtm} of structure.structure.bonds) {
            bindMap[iAtm] = bindMap[jAtm] = 1;
            let bondGeometry = new THREE.Geometry();
            let atom = atoms[iAtm];
            bondGeometry.vertices.push(new Vector3(atom.x, atom.y, atom.z));
            bondGeometry.colors.push(colors.get(presets.get(atom.el).color));
            atom = atoms[jAtm];
            bondGeometry.vertices.push(new Vector3(atom.x, atom.y, atom.z));
            bondGeometry.colors.push(colors.get(presets.get(atom.el).color));
            if (type === "x") {
                bondGeometry.computeLineDistances();
                group.add(new Line(bondGeometry, bondMaterials.get("extra"), THREE.LineStrip));
            } else {
                group.add(new Line(bondGeometry, bondMaterials.get("basic")));
            }
        }

        let Points = THREE.Points;
        // Draw points for unbound atoms (if any)
        let i = bindMap.indexOf(0);
        while (i !== -1) {
            let pointGeometry = new THREE.Geometry();
            let atom = atoms[i];
            pointGeometry.vertices.push(new Vector3(atom.x, atom.y, atom.z));
            group.add(new Points(pointGeometry, pointMaterials.get(atom.el)));
            i = bindMap.indexOf(0, i + 1);
        }
    },

    addScenePoints() {
        let Points = THREE.Points,
            Vector3 = THREE.Vector3,
            group = assets3.group;
        for (let {el, x, y, z} of structure.structure.atoms) {
            let pointGeometry = new THREE.Geometry();
            pointGeometry.vertices.push(new Vector3(x, y, z));
            group.add(new Points(pointGeometry, pointMaterials.get(el)));
        }
    },

    addAxes() {
        if (!this.axes) {
            this.axes = new THREE.AxisHelper(20);
            assets3.scene.add(this.axes);
            this.update();
        }
    },

    removeAxes() {
        if (this.axes) {
            assets3.scene.remove(this.axes);
            this.axes = undefined;
            this.update();
        }
    }
};

export default draw;

structure.on("updateStructure", draw.render.bind(draw));