(function (global) {

"use strict";

var THREE = global.THREE,
    OE = global.OE || (global.OE = {}),
    view = OE.view = {},
    canvas = {
        el: null,
        width: 600,
        height: 500
    };


view.colors = {
    get: function (color) {
        // Create an instance only on actual need (when requested for the first time) and then cache it
        if (!this._cache.hasOwnProperty(color)) {
            this._cache[color] = new THREE.Color(color);
        }
        return this._cache[color];
    }
};
Object.defineProperty(view.colors, "_cache", {value: {}});

view.presets = {
    C: {color: 0xFF0000, radius: 1},
    H: {color: 0xFFFFFF, radius: 0.7}
};
Object.defineProperty(view.presets, "_def", {
    configurable: true,
    enumerable: false,
    writable: false,
    value: Object.freeze(JSON.parse(JSON.stringify(view.presets.H)))
});

view.atomMaterials = {
    get: function (atom) {
        var preset = view.presets[atom] || view.presets[atom = "_def"];
        // Create an instance only on actual need (when requested for the first time) and then cache it
        if (!this._cache.hasOwnProperty(atom)) {
            this._cache[atom] = new THREE.MeshLambertMaterial({color: preset.color});
        }
        return this._cache[atom];
    }
};
Object.defineProperty(view.atomMaterials, "_cache", {value: {}});

view.atomGeometries = {
    get: function (atom) {
        var preset = view.presets[atom] || view.presets[atom = "_def"];
        // Create an instance only on actual need (when requested for the first time) and then cache it
        if (!this._cache.hasOwnProperty(atom)) {
            this._cache[atom] = new THREE.SphereGeometry(preset.radius);
        }
        return this._cache[atom];
    }
};
Object.defineProperty(view.atomGeometries, "_cache", {value: {}});

view.bondMaterials = {
    basic: new THREE.LineBasicMaterial({
        vertexColors: THREE.VertexColors
    }),
    extra: new THREE.LineDashedMaterial({
        dashSize: 0.2,
        gapSize: 0.1,
        vertexColors: THREE.VertexColors
    })
};

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
    three.scene.add(spotLight, new THREE.AxisHelper(20));

    three.camera.position.x = 0;
    three.camera.position.y = 0;
    three.camera.position.z = 20;
    three.camera.lookAt(three.scene.position);

    three.renderer.setClearColor(0x000000);
    three.renderer.setSize(canvas.width, canvas.height);
    three.renderer.render(three.scene, three.camera);

    document.getElementById("oe-view").appendChild(canvas.el);
    return three;
})();

view.zoom = function (delta) {
    var three = view.THREE;
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
    var group = view.THREE.group;
    group.rotation.y += (view.rotation - group.rotation.y) * 0.05;
    view.THREE.renderer.render(view.THREE.scene, view.THREE.camera);
    if (view.autoUpdate) {
        requestAnimationFrame(view.update);
    }
};

view.getAtomColor = function (el) {
    return (this.presets[el] || this.presets._def).color;
};

view.setAtomColors = function (colors) {
    var presets = this.presets,
        el;
    for (el in colors) {
        if (colors.hasOwnProperty(el) && (this.getAtomColor(el) !== colors[el])) {
            if (!presets[el]) {
                presets[el] = JSON.parse(JSON.stringify(presets._def));
            }
            presets[el].color = colors[el];
            // Sphere materials (and colors) are cached. Clearing cache forces colors to update
            delete this.atomMaterials._cache[el];
        }
    }
};

view.setBgColor = function (color) {
    if (typeof color === "string") {
        color = parseInt(color.replace("#", ""), 16);
    }
    this.THREE.renderer.setClearColor(color);
};

view.clearScene = function () {
    var group = view.THREE.group,
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
    } else {
        view.addSceneBonds();
    }
};

view.addSceneAtoms = function () {
    var Mesh = THREE.Mesh,
        group = view.THREE.group,
        atomGeometries = view.atomGeometries,
        atomMaterials = view.atomMaterials,
        atoms = OE.structure.atoms,
        atomCount = atoms.length,
        i, atom;
    for (i = 0; i < atomCount; i++) {
        atom = new Mesh(atomGeometries.get(atoms[i].el), atomMaterials.get(atoms[i].el));
        atom.position.x = atoms[i].x;
        atom.position.y = atoms[i].y;
        atom.position.z = atoms[i].z;
        group.add(atom);
    }
};

view.addSceneBonds = function () {
    var Line = THREE.Line,
        Vector3 = THREE.Vector3,
        group = view.THREE.group,
        presets = view.presets,
        colors = view.colors,
        bondMaterials = view.bondMaterials,
        atoms = OE.structure.atoms,
        bonds = OE.structure.bonds,
        bondCount = bonds.length,
        i, atom, bondGeometry;
    for (i = 0; i < bondCount; i++) {
        bondGeometry = new THREE.Geometry();
        atom = atoms[bonds[i].iAtm];
        bondGeometry.vertices.push(new Vector3(atom.x, atom.y, atom.z));
        bondGeometry.colors.push(colors.get((presets[atom.el] || presets._def).color));
        atom = atoms[bonds[i].jAtm];
        bondGeometry.vertices.push(new Vector3(atom.x, atom.y, atom.z));
        bondGeometry.colors.push(colors.get((presets[atom.el] || presets._def).color));
        if (bonds[i].type === "x") {
            bondGeometry.computeLineDistances();
            group.add(new Line(bondGeometry, bondMaterials.extra, THREE.LineStrip));
        } else {
            group.add(new Line(bondGeometry, bondMaterials.basic));
        }
    }
};

})(this);