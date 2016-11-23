import Observer from "./observer.js";
import app from "./app.js";
import utils from "./utils.js";
import worker from "./worker.js";

/**
 * An atom record in a structure
 * @typedef {Object} Atom
 * @property {String} el - Element
 * @property {Number} x - X-coordinate of an atom
 * @property {Number} y - Y-coordinate of an atom
 * @property {Number} z - Z-coordinate of an atom
 */

/**
 * A bond record in a structure's bond registry
 * @typedef {Object} Bond
 * @property {Number} iAtm - The bond's first atom index in the `atoms` array
 * @property {Number} jAtm - The bond's second atom index in the `atoms` array
 * @property {String} type - Bond type (e.g. "s" for single bond, "a" for aromatic, "x" for extra)
 * @property {Object} potential - A reference to the Potential record for this bond
 */

/**
 * A bond potential parameters
 * @typedef {Object} Potential
 * @property {Number} D0 - Dissociation energy (in eV)
 * @property {Number} R0 - Equilibrium bond distance (in Å)
 * @property {Number} w0 - Vibration frequency (in 1/cm)
 * @property {Number} b - Potential stiffness coefficient (in 1/Å)
 */

/**
 * Current structure data
 * @typedef {Object} Structure
 * @property {String} name - The name of a structure
 * @property {Array.<Atom>} atoms - Atom list
 * @property {Array.<Bond>} bonds - Bond list
 * @property {Map.<Potential>} potentials - Maps atom pair strings onto potential data objects
 */

/**
 * @type {Structure}
 */
let structure = {
    name: "",
    atoms: [],
    bonds: [],
    potentials: new Map()
};

let atomSet = new Set();
let pairSet = new Set();

let structureUtils = Object.assign(new Observer(), {
    /**
     * Get a list of all possible (chemically bound or not) atomic pairs for the current structure
     * @param {String} [type] Pairs of which graph type to return: basic, extra, or both
     * @returns {Array}
     */
    getPairList(type) {
        switch (type) {
            case "basic":
                return [...pairSet].filter(pair => !pair.startsWith("x-"));
            case "extra":
                return [...pairSet].filter(pair => pair.startsWith("x-"));
            default:
                return [...pairSet];
        }
    },

    getPairSet(type) {
        return new Set(this.getPairList(type));
    },

    /**
     * Get a list of all chemical elements present in the current structure
     * @returns {Array}
     */
    getAtomList() {
        return [...atomSet];
    },

    getAtomSet() {
        return new Set(this.getAtomList());
    },

    /**
     * Completely overwrites the `structure` object. Call this method when a new file is opened,
     * or when the structure needs to be updated according the result of a worker calculations
     * @param {Object} newStructure
     * @param {Boolean} [rescanAtoms] Pass `false` to prevent `atomSet` and `pairSet` update.
     * By default they are updated as well
     * @param {Boolean} [fromWorker] For internal use. Pass `true` to prevent notifying the worker
     */
    overwrite(newStructure, rescanAtoms = true, fromWorker = false) {
        ({name: structure.name = "", atoms: structure.atoms = [], bonds: structure.bonds = [],
            potentials: structure.potentials = new Map()} = newStructure);
        if (rescanAtoms !== false) {
            atomSet = new Set(structure.atoms.map(atom => atom.el));
            let atomList = this.getAtomList();
            let pairList = [];
            for (let [i, el] of atomList.entries()) {
                pairList.push(...atomList.slice(i).map(elem => el + elem));
            }
            // Add extra-graph pairs
            pairList.push(...pairList.map(pair => `x-${pair}`));
            pairSet = new Set(pairList);
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

Object.defineProperty(structureUtils, "structure", {
    enumerable: true,
    get() {
        return structure; // not safe but fast… Freezing would result in performance degradation
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