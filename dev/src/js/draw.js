import THREE from "three";
import Cacheable from "./cacheable.js";
import structure from "./structure.js";

const colors = new Cacheable(color => new THREE.Color(color));

const presets = Object.create({
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


const pointMaterials = new Cacheable(atom => {
    let preset = presets.get(atom);
    return new THREE.PointsMaterial({color: preset.color, sizeAttenuation: false});
});

const atomMaterials = new Cacheable(atom => {
    let preset = presets.get(atom);
    return new THREE.MeshLambertMaterial({color: preset.color});
});

const atomGeometries = new Cacheable(atom => {
    let preset = presets.get(atom);
    return new THREE.SphereGeometry(preset.radius);
});

const bondMaterials = new Cacheable(type => {
    // There are only 2 graph types: "basic" and "extra", however construction of bond materials through `Cacheable`
    // has an advantage of lazy instantiation of complex objects (instances will be created only on actual need)
    if (type === "extra") {
        return new THREE.LineDashedMaterial({dashSize: 0.2, gapSize: 0.1, vertexColors: THREE.VertexColors});
    } else { // type === "basic"
        return new THREE.LineBasicMaterial({vertexColors: THREE.VertexColors});
    }
});

const canvas = {el: null, width: 600, height: 500};

const assets3 = {
    scene: new THREE.Scene(),
    group: new THREE.Object3D(),
    camera: new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000),
    spotLight: new THREE.SpotLight(0xFFFFFF),
    renderer: new THREE.WebGLRenderer()
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

canvas.el = assets3.renderer.domElement;


const draw = {
    get canvas() {
        return canvas.el;
    },

    rotation: 0,

    appearance: "graph",

    zoom(delta) {
        assets3.camera.position.z += delta;
        assets3.camera.lookAt(assets3.scene.position);
        this.update();
    },

    render() {
        this.resetScene();
        this.update();
    },

    update() {
        assets3.group.rotation.y += (this.rotation - assets3.group.rotation.y) * 0.05;
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
        const group = assets3.group;
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
        for (let atom of structure.structure.atoms) {
            let atom3 = new Mesh(atomGeometries.get(atom.el), atomMaterials.get(atom.el));
            atom3.position.x = atom.x;
            atom3.position.y = atom.y;
            atom3.position.z = atom.z;
            group.add(atom3);
        }
    },

    addSceneBonds() {
        let Line = THREE.Line,
            Vector3 = THREE.Vector3,
            group = assets3.group,
            atoms = structure.structure.atoms,
            bindMap = new Int8Array(atoms.length);
        for (let bond of structure.structure.bonds) {
            let iAtm = bond.iAtm;
            let jAtm = bond.jAtm;
            bindMap[iAtm] = bindMap[jAtm] = 1;
            let bondGeometry = new THREE.Geometry();
            let atom = atoms[iAtm];
            bondGeometry.vertices.push(new Vector3(atom.x, atom.y, atom.z));
            bondGeometry.colors.push(colors.get(presets.get(atom.el).color));
            atom = atoms[jAtm];
            bondGeometry.vertices.push(new Vector3(atom.x, atom.y, atom.z));
            bondGeometry.colors.push(colors.get(presets.get(atom.el).color));
            if (bond.type === "x") {
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
        for (let atom of structure.structure.atoms) {
            let pointGeometry = new THREE.Geometry();
            pointGeometry.vertices.push(new Vector3(atom.x, atom.y, atom.z));
            group.add(new Points(pointGeometry, pointMaterials.get(atom.el)));
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
            delete this.axes;
            this.update();
        }
    }
};

export default draw;

structure.on("updateStructure", draw.render.bind(draw));