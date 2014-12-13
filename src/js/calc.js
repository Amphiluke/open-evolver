(function (global) {

"use strict";

var api = {},
    core = {},
    structure = null,
    tightBondCount = 0;


api.setStructure = function (data) {
    // Move all existing extra-bonds to the end of a bond array.
    // This allows to speed up iterations through bonds of extra-graph
    for (var bonds = data.bonds, i = 0, j = 0, len = bonds.length; i < len; i++) {
        if (bonds[j].type === "x") {
            bonds.push(bonds.splice(j, 1)[0]);
        } else {
            j++;
        }
    }
    tightBondCount = j;
    structure = data;
    return structure;
};

api.updateStructure = function () {
    global.postMessage({method: "updateStructure", data: structure});
};

api.totalEnergy = function () {
    return core.totalEnergy();
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

core.totalEnergy = function () {
    var energy = 0,
        bonds = structure.bonds,
        i, len;
    for (i = 0, len = bonds.length; i < len; i++) {
        energy += core.morse(bonds[i].potential, core.distance(bonds[i].iAtm, bonds[i].jAtm));
    }
    return energy;
};

})(this);