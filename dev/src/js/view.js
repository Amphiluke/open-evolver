import THREE from "three";
import Cacheable from "./cacheable.js";

let view = {},
    canvas = {
        el: null,
        width: 600,
        height: 500
    };


view.colors = new Cacheable(color => new THREE.Color(color));

view.presets = Object.create({
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

view.presets.set("C", {color: 0xFF0000});
view.presets.set("H", {radius: 0.7});


view.pointMaterials = new Cacheable(atom => {
    let preset = view.presets.get(atom);
    return new THREE.PointsMaterial({color: preset.color, sizeAttenuation: false});
});

view.atomMaterials = new Cacheable(atom => {
    let preset = view.presets.get(atom);
    return new THREE.MeshLambertMaterial({color: preset.color});
});

view.atomGeometries = new Cacheable(atom => {
    let preset = view.presets.get(atom);
    return new THREE.SphereGeometry(preset.radius);
});

view.bondMaterials = new Cacheable(type => {
    // There are only 2 graph types: "basic" and "extra", however construction of bond materials through `Cacheable`
    // has an advantage of lazy instantiation of complex objects (instances will be created only on actual need)
    if (type === "extra") {
        return new THREE.LineDashedMaterial({dashSize: 0.2, gapSize: 0.1, vertexColors: THREE.VertexColors});
    } else { // type === "basic"
        return new THREE.LineBasicMaterial({vertexColors: THREE.VertexColors});
    }
});


view.THREE = (function () {
    var three, spotLight;
    three = {
        scene: new THREE.Scene(),
        group: new THREE.Object3D(),
        camera: new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000),
        renderer: new THREE.WebGLRenderer()
    };
    canvas.el = three.renderer.domElement;

    three.scene.add(three.group);

    spotLight = new THREE.SpotLight(0xFFFFFF);
    spotLight.position.set(-40, 60, 50);
    three.scene.add(spotLight);

    three.camera.position.x = 0;
    three.camera.position.y = 0;
    three.camera.position.z = 20;
    three.camera.lookAt(three.scene.position);

    three.renderer.setClearColor(0x000000);
    three.renderer.setSize(canvas.width, canvas.height);
    three.renderer.render(three.scene, three.camera);

    document.getElementById("oe-view").appendChild(canvas.el); // TODO!
    return three;
})();

view.zoom = function (delta) {
    let three = view.THREE;
    three.camera.position.z += delta;
    three.camera.lookAt(three.scene.position);
    view.update();
};

view.render = function () {
    view.resetScene();
    view.update();
};

view.rotation = 0;

view.update = function () {
    let three = view.THREE,
        group = three.group;
    group.rotation.y += (view.rotation - group.rotation.y) * 0.05;
    three.renderer.render(three.scene, three.camera);
    if (view.autoUpdate) {
        requestAnimationFrame(view.update);
    }
};

view.getAtomColor = function (el) {
    return view.presets.get(el).color;
};

view.setAtomColors = function (colors) {
    let presets = view.presets;
    for (let el of Object.keys(colors)) {
        if (view.getAtomColor(el) !== colors[el]) {
            presets.set(el, {color: colors[el]});
            // Sphere and point materials (and colors) are cached. Forces colors to update
            view.atomMaterials.renew(el);
            view.pointMaterials.renew(el);
        }
    }
};

view.setBgColor = function (color) {
    if (typeof color === "string") {
        color = parseInt(color.replace("#", ""), 16);
    }
    view.THREE.renderer.setClearColor(color);
};

view.clearScene = function () {
    let group = view.THREE.group,
        child;
    while (child = group.children[0]) {
        group.remove(child);
    }
};

view.appearance = "graph";

view.resetScene = function () {
    view.clearScene();
    if (view.appearance === "spheres") {
        view.addSceneAtoms();
    } else if (OE.structure.bonds.length) {
        view.addSceneBonds();
    } else {
        view.addScenePoints();
    }
};

view.addSceneAtoms = function () {
    var Mesh = THREE.Mesh,
        group = view.THREE.group,
        atomGeometries = view.atomGeometries,
        atomMaterials = view.atomMaterials,
        atoms = OE.structure.atoms,
        i, atomCount, atom;
    for (i = 0, atomCount = atoms.length; i < atomCount; i++) {
        atom = new Mesh(atomGeometries.get(atoms[i].el), atomMaterials.get(atoms[i].el));
        atom.position.x = atoms[i].x;
        atom.position.y = atoms[i].y;
        atom.position.z = atoms[i].z;
        group.add(atom);
    }
};

view.addSceneBonds = function () {
    var Line = THREE.Line,
        Points = THREE.Points,
        Vector3 = THREE.Vector3,
        group = view.THREE.group,
        presets = view.presets,
        colors = view.colors,
        bondMaterials = view.bondMaterials,
        pointMaterials = view.pointMaterials,
        atoms = OE.structure.atoms,
        bonds = OE.structure.bonds,
        bindMap = new Int8Array(atoms.length),
        i, bondCount, iAtm, jAtm, atom,
        bondGeometry, pointGeometry;
    for (i = 0, bondCount = bonds.length; i < bondCount; i++) {
        iAtm = bonds[i].iAtm;
        jAtm = bonds[i].jAtm;
        bindMap[iAtm] = bindMap[jAtm] = 1;
        bondGeometry = new THREE.Geometry();
        atom = atoms[iAtm];
        bondGeometry.vertices.push(new Vector3(atom.x, atom.y, atom.z));
        bondGeometry.colors.push(colors.get(presets.get(atom.el).color));
        atom = atoms[jAtm];
        bondGeometry.vertices.push(new Vector3(atom.x, atom.y, atom.z));
        bondGeometry.colors.push(colors.get(presets.get(atom.el).color));
        if (bonds[i].type === "x") {
            bondGeometry.computeLineDistances();
            group.add(new Line(bondGeometry, bondMaterials.get("extra"), THREE.LineStrip));
        } else {
            group.add(new Line(bondGeometry, bondMaterials.get("basic")));
        }
    }

    // Draw points for unbound atoms (if any)
    i = bindMap.indexOf(0);
    while (i !== -1) {
        pointGeometry = new THREE.Geometry();
        atom = atoms[i];
        pointGeometry.vertices.push(new Vector3(atom.x, atom.y, atom.z));
        group.add(new Points(pointGeometry, pointMaterials.get(atom.el)));
        i = bindMap.indexOf(0, i + 1);
    }
};

view.addScenePoints = function () {
    var Points = THREE.Points,
        Vector3 = THREE.Vector3,
        group = view.THREE.group,
        pointMaterials = view.pointMaterials,
        atoms = OE.structure.atoms,
        pointGeometry,
        i, atomCount, atom;
    for (i = 0, atomCount = atoms.length; i < atomCount; i++) {
        pointGeometry = new THREE.Geometry();
        atom = atoms[i];
        pointGeometry.vertices.push(new Vector3(atom.x, atom.y, atom.z));
        group.add(new Points(pointGeometry, pointMaterials.get(atom.el)));
    }
};

view.addAxes = function () {
    if (!view.axes) {
        view.axes = new THREE.AxisHelper(20);
        view.THREE.scene.add(view.axes);
        view.update();
    }
};

view.removeAxes = function () {
    if (view.axes) {
        view.THREE.scene.remove(view.axes);
        delete view.axes;
        view.update();
    }
};