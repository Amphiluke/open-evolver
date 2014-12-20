(function (global) {

"use strict";

var api = {},
    core = {},
    structure = null,
    tightBondCount = 0,
    grad = {};


global.importScripts("utils.js"); // will add `OE.utils` into the global context of the worker

api.setStructure = function (data) {
    var bonds = data.bonds,
        bondCount = bonds.length,
        atomCount = data.atoms.length,
        i, j;
    // Move all existing extra-bonds to the end of a bond array.
    // This allows to speed up iterations through bonds of extra-graph
    for (i = 0, j = 0; i < bondCount; i++) {
        if (bonds[j].type === "x") {
            bonds.push(bonds.splice(j, 1)[0]);
        } else {
            j++;
        }
    }
    tightBondCount = j;
    structure = data;
    grad.x = new Float32Array(atomCount);
    grad.y = new Float32Array(atomCount);
    grad.z = new Float32Array(atomCount);
    return structure;
};

api.updateStructure = function () {
    global.postMessage({method: "updateStructure", data: structure});
};

api.totalEnergy = function () {
    return core.totalEnergy();
};

api.gradient = function () {
    return core.gradient();
};

api.reconnectPairs = function (data) {
    var elements = data.pair.match(/[A-Z][^A-Z]*/g),
        cutoff2 = data.cutoff * data.cutoff,
        atoms = structure.atoms,
        aLen = atoms.length,
        bonds = structure.bonds,
        bond, bLen,
        i, j, k,
        jEl;
    for (i = 0; i < aLen; i++) {
        if (atoms[i].el === elements[0]) {
            jEl = elements[1];
        } else if (atoms[i].el === elements[1]) {
            jEl = elements[0];
        } else {
            continue;
        }
        for (j = i + 1; j < aLen; j++) {
            if (atoms[j].el === jEl) {
                for (k = tightBondCount, bond = bonds[k], bLen = bonds.length; k < bLen; bond = bonds[++k]) {
                    if ((bond.iAtm === i && bond.jAtm === j) || (bond.iAtm === j && bond.jAtm === i)) {
                        break;
                    }
                }
                if (core.sqrDistance(i, j) > cutoff2) {
                    if (bond) {
                        bonds.splice(k, 1); // break x-bond, as the distance is greater than cutoff
                    }
                } else if (!bond) {
                    bonds.push({iAtm: i, jAtm: j, type: "x"}); // create x-bond, as one isn't exist yet
                }
            }
        }
    }
    api.updateStructure();
};


global.onmessage = function (e) {
    var method = e.data && e.data.method;
    if (typeof api[method] === "function") {
        global.postMessage({
            method: method,
            data: api[method].call(api, e.data.data)
        });
    }
};


/**
 * In intensive calculations use this method for comparisons rather than `core.distance`
 */
core.sqrDistance = function (atom1, atom2) {
    var at1 = structure.atoms[atom1],
        at2 = structure.atoms[atom2],
        dx = at1.x - at2.x,
        dy = at1.y - at2.y,
        dz = at1.z - at2.z;
    return dx * dx + dy * dy + dz * dz;
};

core.distance = function (atom1, atom2) {
    return Math.sqrt(core.sqrDistance(atom1, atom2));
};

core.morse = function (params, distance) {
    var exponent = Math.exp(params.b * (params.R0 - distance));
    return params.D0 * exponent * (exponent - 2);
};

core.derivative = function (params, distance) {
    var cA = params.D0 * Math.exp(2 * params.b * params.R0),
        cB = -2 * params.b,
        cC = -2 * Math.sqrt(params.D0 * cA),
        cD = Math.exp(-params.b * distance);
    return cB * cD * (cA * cD + 0.5 * cC);
};

core.gradComponent = function (atom1, atom2, bond) {
    var distance = core.distance(atom1, atom2),
        factor = core.derivative(structure.bonds[bond].potential, distance) / distance,
        at1 = structure.atoms[atom1],
        at2 = structure.atoms[atom2];
    return {
        x: factor * (at1.x - at2.x),
        y: factor * (at1.y - at2.y),
        z: factor * (at1.z - at2.z)
    };
};

core.totalEnergy = function () {
    var energy = 0,
        bonds = structure.bonds,
        i, len;
    for (i = 0, len = bonds.length; i < len; i++) {
        energy += core.morse(bonds[i].potential, core.distance(bonds[i].iAtm, bonds[i].jAtm));
    }
    return energy;
};

core.gradient = function () {
    var atoms = structure.atoms,
        atomCount = atoms.length,
        bonds = structure.bonds,
        bondCount = bonds.length,
        utils = global.OE.utils,
        gradComponent,
        sqrForce, invNorm,
        i, j, b,
        mass;

    core.norm = core.sumSqr = core.rootSumSqr = 0;

    for (i = 0; i < atomCount; i++) {
        grad.x[i] = grad.y[i] = grad.z[i] = 0;
        for (b = 0; b < bondCount; b++) {
            if (bonds[b].iAtm === i) {
                j = bonds[b].jAtm;
            } else if (bonds[b].jAtm === i) {
                j = bonds[b].iAtm;
            } else {
                continue;
            }
            gradComponent = core.gradComponent(i, j, b);
            grad.x[i] += gradComponent.x;
            grad.y[i] += gradComponent.y;
            grad.z[i] += gradComponent.z;
        }

        sqrForce = grad.x[i] * grad.x[i] + grad.y[i] * grad.y[i] + grad.z[i] * grad.z[i];
        mass = utils.getAtomicMass(atoms[i].el);
        core.sumSqr += sqrForce / mass;
        core.rootSumSqr += sqrForce / (mass * mass);
        core.norm += sqrForce;
    }

    core.rootSumSqr = Math.sqrt(core.rootSumSqr);
    core.norm = Math.sqrt(core.norm);

    // Calc unit vector of internal gradient
    invNorm = 1 / core.norm;
    for (i = 0; i < atomCount; i++) {
        grad.x[i] *= invNorm;
        grad.y[i] *= invNorm;
        grad.z[i] *= invNorm;
    }

    return core.norm;
};

})(this);