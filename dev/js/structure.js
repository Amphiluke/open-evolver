import Observer from "./observer.js";
import app from "./app.js";
import utils from "./utils.js";
import worker from "./worker.js";

let structure = {
    name: "",
    atoms: [],
    bonds: [],
    potentials: new Map()
};

let atomList = [];
let pairList = [];

let structureUtils = Object.assign(new Observer(), {
    /**
     * Completely overwrites the `structure` object. Call this method when a new file is opened,
     * or when the structure needs to be updated according the result of a worker calculations
     * @param {Object} newStructure
     * @param {Boolean} [rescanAtoms] Pass `false` to prevent `atomList` and `pairList` update.
     * By default they are updated as well
     * @param {Boolean} [fromWorker] For internal use. Pass `true` to prevent notifying the worker
     */
    overwrite(newStructure, rescanAtoms = true, fromWorker = false) {
        ({name: structure.name = "", atoms: structure.atoms = [], bonds: structure.bonds = [],
            potentials: structure.potentials = new Map()} = newStructure);
        if (rescanAtoms !== false) {
            atomList.length = pairList.length = 0;
            for (let {el} of structure.atoms) {
                if (atomList.indexOf(el) === -1) {
                    // Using Set instead of Array would probably be better but it would also increase
                    // complexity of further processing as well as complexity of pair list construction
                    atomList.push(el);
                }
            }
            for (let i = 0, len = atomList.length; i < len; i++) {
                for (let j = i; j < len; j++) {
                    pairList.push(atomList[i] + atomList[j]);
                }
            }
            // Add extra-graph pairs
            pairList.push(...pairList.map(pair => `x-${pair}`));
        }
        this.trigger("updateStructure", rescanAtoms !== false);
        if (fromWorker !== true) {
            app.trigger("app:structure:loaded");
            syncWorker();
        }
    },

    setPotentials(potentials) {
        structure.potentials = potentials;
        for (let bond of structure.bonds) {
            let prefix = (bond.type === "x") ? "x-" : "";
            let atoms = structure.atoms;
            bond.potential =
                potentials.get(prefix + atoms[bond.iAtm].el + atoms[bond.jAtm].el) ||
                potentials.get(prefix + atoms[bond.jAtm].el + atoms[bond.iAtm].el);
        }
        app.trigger("app:structure:paramsSet");
        syncWorker();
    },

    getCenterOfMass() {
        let result = {x: 0, y: 0, z: 0};
        let mass = 0;
        for (let {el, x, y, z} of structure.atoms) {
            const atomicMass = utils.atomicMasses[el];
            mass += atomicMass;
            result.x += atomicMass * x;
            result.y += atomicMass * y;
            result.z += atomicMass * z;
        }
        result.x /= mass;
        result.y /= mass;
        result.z /= mass;
        return result;
    },

    translate(x, y, z) {
        let center = this.getCenterOfMass(),
            dx = x - center.x,
            dy = y - center.y,
            dz = z - center.z;
        for (let atom of structure.atoms) {
            atom.x += dx;
            atom.y += dy;
            atom.z += dz;
        }
        this.overwrite(structure, false, false);
    },

    rotate(angle, axis) {
        let axis2 = (axis === "x") ? "y" : "x",
            axis3 = (axis === "z") ? "y" : "z",
            sine = Math.sin(angle),
            cosine = Math.cos(angle);
        for (let atom of structure.atoms) {
            let coord2 = atom[axis2];
            let coord3 = atom[axis3];
            atom[axis2] = coord2 * cosine + coord3 * sine;
            atom[axis3] = coord3 * cosine - coord2 * sine;
        }
        this.overwrite(structure, false, false);
    }
});

Object.defineProperties(structureUtils, {
    structure: {
        enumerable: true,
        get() {
            return structure; // not safe but fast… Freezing would result in performance degradation
        }
    },

    /**
     * A list of all atom types present in the current structure
     * @type {Array}
     */
    atomList: {
        enumerable: true,
        get() {
            return atomList.slice(0);
        }
    },

    /**
     * A list of all possible (chemically bound or not) atomic pairs for the current structure
     * @type {Array}
     */
    pairList: {
        enumerable: true,
        get() {
            return pairList.slice(0);
        }
    }
});

export default structureUtils;


function syncWorker() {
    worker.invoke("setStructure", structureUtils.structure);
}

worker.on("setStructure", updatedStructure => {
    // The worker optimizes structure's bond array. So, do sync
    structureUtils.overwrite(updatedStructure, false, true);
});

worker.on("updateStructure", updatedStructure => {
    // No need to rescan atom list, since only coordinates were changed
    structureUtils.overwrite(updatedStructure, false, true);
});