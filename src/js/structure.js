(function (global) {

"use strict";

var _ = global._,
    OE = global.OE,
    structureUtils = OE.structureUtils = {};


OE.structure = {
    atoms: [],
    bonds: [],
    potentials: {}
};


structureUtils.syncWorker = function () {
    OE.worker.invoke("setStructure", OE.structure);
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
    structureUtils.syncWorker();
};


OE.worker.on("updateStructure", function (updatedStructure) {
    OE.structure = updatedStructure;
    OE.view.render();
});

})(this);