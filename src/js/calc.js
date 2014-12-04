(function (global) {

"use strict";

var api = {},
    core = {},
    structure = null;


api.setStructure = function (data) {
    structure = data;
    return true;
};

api.totalEnergy = function () {
    return core.totalEnergy();
};

api.updateStructure = function () {
    global.postMessage({method: "updateStructure", data: structure});
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


core.distance = function (atom1, atom2) {
    var at1 = structure.atoms[atom1],
        at2 = structure.atoms[atom2],
        dx = at1.x - at2.x,
        dy = at1.y - at2.y,
        dz = at1.z - at2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
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