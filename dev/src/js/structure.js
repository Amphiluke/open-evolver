(function (global) {

"use strict";

var _ = global._,
    OE = global.OE,
    app = OE.app,
    structureUtils = OE.structureUtils = Object.create(OE.observer);


OE.structure = {
    name: "",
    atoms: [],
    bonds: [],
    potentials: {}
};


/**
 * A list of all atoms present in the current structure
 * @type {Array}
 */
structureUtils.atomList = [];

/**
 * A list of all possible (chemically bound or not) atomic pairs for the current structure
 * @type {Array}
 */
structureUtils.pairList = [];

/**
 * Completely overwrites the `OE.structure` object. Call this method when a new file is opened,
 * or when the structure needs to be updated according the result of a worker calculations
 * @param {Object} newStructure
 * @param {Boolean} [rescanAtoms] Pass `false` to prevent `structureUtils.atomList` and
 * `structureUtils.pairList` from being updated too. By default they do updated as well
 * @param {Boolean} [fromWorker] For internal use. Pass `true` to prevent notifying the worker
 */
structureUtils.overwrite = function (newStructure, rescanAtoms, fromWorker) {
    var atoms,
        atomList, pairList,
        i, j, len;
    OE.structure = newStructure;
    if (rescanAtoms !== false) {
        atomList = structureUtils.atomList;
        pairList = structureUtils.pairList;
        atomList.length = pairList.length = 0;
        atoms = OE.structure.atoms;
        for (i = 0, len = atoms.length; i < len; i++) {
            if (atomList.indexOf(atoms[i].el) === -1) {
                atomList.push(atoms[i].el);
            }
        }
        for (i = 0, len = atomList.length; i < len; i++) {
            for (j = i; j < len; j++) {
                pairList.push(atomList[i] + atomList[j]);
            }
        }
        // Add extra-graph pairs
        structureUtils.pairList = pairList.concat(pairList.map(function (pair) {
            return "x-" + pair;
        }));
    }
    structureUtils.trigger("updateStructure", (rescanAtoms !== false));
    if (fromWorker !== true) {
        app.state = app.STRUCTURE_LOADED;
        structureUtils.syncWorker();
    }
};

structureUtils.setPotentials = function (potentials) {
    var atoms = OE.structure.atoms,
        bonds = OE.structure.bonds,
        prefix,
        i, len;
    _.each(potentials, function (params, pair) {
        // b{1/Å} = w0{1/cm} * 2*pi*c{cm/s} * sqrt[µ{a.m.u.}*1.6605655E-27 / (2*D0{eV}*1.6021892E-19)] / 1E+10
        // i.e.
        // b{1/Å} = w0{1/cm} * sqrt[µ{a.m.u.} / D0{eV}] * 1.3559906E-3
        params.b = params.w0 * Math.sqrt(OE.utils.getReducedMass(pair) / params.D0) * 1.3559906E-3;
    });
    OE.structure.potentials = potentials;
    for (i = 0, len = bonds.length; i < len; i++) {
        prefix = (bonds[i].type === "x") ? "x-" : "";
        bonds[i].potential =
            potentials[prefix + atoms[bonds[i].iAtm].el + atoms[bonds[i].jAtm].el] ||
            potentials[prefix + atoms[bonds[i].jAtm].el + atoms[bonds[i].iAtm].el];
    }
    app.state = app.PARAMS_SET;
    structureUtils.syncWorker();
};

structureUtils.getCenterOfMass = function () {
    var utils = OE.utils,
        atoms = OE.structure.atoms,
        result = {x: 0, y: 0, z: 0},
        mass = 0,
        atomicMass,
        i, len;
    for (i = 0, len = atoms.length; i < len; i++) {
        atomicMass = utils.getAtomicMass(atoms[i].el);
        mass += atomicMass;
        result.x += atomicMass * atoms[i].x;
        result.y += atomicMass * atoms[i].y;
        result.z += atomicMass * atoms[i].z;
    }
    result.x /= mass;
    result.y /= mass;
    result.z /= mass;
    return result;
};

structureUtils.translate = function (x, y, z) {
    var atoms = OE.structure.atoms,
        center = structureUtils.getCenterOfMass(),
        dx = x - center.x,
        dy = y - center.y,
        dz = z - center.z,
        i, len;
    for (i = 0, len = atoms.length; i < len; i++) {
        atoms[i].x += dx;
        atoms[i].y += dy;
        atoms[i].z += dz;
    }
    structureUtils.overwrite(OE.structure, false, false);
    OE.view.render();
};

structureUtils.rotate = function (angle, axis) {
    var atoms = OE.structure.atoms,
        axis2 = (axis === "x" ? "y" : "x"),
        axis3 = (axis === "z" ? "y" : "z"),
        sine = Math.sin(angle),
        cosine = Math.cos(angle),
        coord2, coord3,
        i, len;
    for (i = 0, len = atoms.length; i < len; i++) {
        coord2 = atoms[i][axis2];
        coord3 = atoms[i][axis3];
        atoms[i][axis2] = coord2 * cosine + coord3 * sine;
        atoms[i][axis3] = coord3 * cosine - coord2 * sine;
    }
    structureUtils.overwrite(OE.structure, false, false);
    OE.view.render();
};

structureUtils.syncWorker = function () {
    OE.worker.invoke("setStructure", OE.structure);
};


OE.worker.on("setStructure", function (updatedStructure) {
    // The worker optimizes structure's bond array. So, do sync
    structureUtils.overwrite(updatedStructure, false, true);
});

OE.worker.on("updateStructure", function (updatedStructure) {
    // No need to rescan atom list, since only coordinates were changed
    structureUtils.overwrite(updatedStructure, false, true);
    OE.view.render();
});

})(this);