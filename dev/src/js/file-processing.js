(function (global) {

"use strict";

var OE = global.OE || (global.OE = {}),
    fileAPI = OE.fileAPI = {},
    formats = {},
    blobUrl;

formats.hin = {
    /* HIN file syntax defines the atom record as follows:
    atom <at#> <atom-name> <element> <type> <flags> <at-charge> <x> <y> <z> <cn> <nbor# nbor-bond>
     0     1        2          3       4       5         6       7   8   9   10         11... */
    parseAtomRecord: function (atomStr) {
        var items = atomStr.split(/\s+/);
        return {
            el: items[3],
            x: +items[7],
            y: +items[8],
            z: +items[9]
        };
    },

    parseBonds: function (atomRecords) {
        var bonds = [],
            len, i,
            items, cn, j;
        for (i = 0, len = atomRecords.length; i < len; i++) {
            items = atomRecords[i].split(/\s+/);
            for (j = 11, cn = 2 * items[10] + 11; j < cn; j += 2) {
                if (items[j] - 1 > i) {
                    bonds.push({
                        iAtm: i,
                        jAtm: items[j] - 1,
                        type: items[j + 1]
                    });
                }
            }
        }
        return bonds;
    },

    parse: function (fileStr) {
        var atomRecords = fileStr.match(/^atom\s+\d+\s+.+$/gm);
        return atomRecords && {
            atoms: atomRecords.map(this.parseAtomRecord, this),
            bonds: this.parseBonds(atomRecords)
        };
    }
};

fileAPI.loadHIN = function (fileObj, cb) {
    this.readFile(fileObj, function (contents) {
        OE.structureUtils.overwrite(formats.hin.parse(contents));
        OE.view.render();
        if (typeof cb === "function") {
            cb(contents);
        }
    });
};

fileAPI.makeFile = function (type, graphType) {
    type = type.toUpperCase();
    if (typeof this["make" + type] === "function") {
        return this["make" + type](graphType);
    }
    return false;
};

fileAPI.makeHIN = function (graphType) {
    var hin = ";The structure was saved in OpenEvolver\nforcefield mm+\n",
        atoms = OE.structure.atoms,
        atomCount = atoms.length,
        atom,
        bonds, bondCount, bond, nbors,
        i;
    if (graphType === "empty") {
        for (i = 0; i < atomCount; i++) {
            atom = atoms[i];
            hin += "mol " + (i + 1) + "\natom 1 - " + atom.el + " ** - 0 " +
                atom.x.toFixed(4) + " " + atom.y.toFixed(4) + " " + atom.z.toFixed(4) +
                " 0\nendmol " + (i + 1) + "\n";
        }
    } else {
        bonds = OE.structure.bonds;
        nbors = new Array(atomCount);
        for (i = 0, bondCount = bonds.length; i < bondCount; i++) {
            bond = bonds[i];
            if (graphType !== "basic" || bond.type !== "x") {
                (nbors[bond.iAtm] || (nbors[bond.iAtm] = [])).push((bond.jAtm + 1) + " " + bond.type);
                (nbors[bond.jAtm] || (nbors[bond.jAtm] = [])).push((bond.iAtm + 1) + " " + bond.type);
            }
        }
        hin += "mol 1\n"; // multiple molecule cases are not supported in this version
        for (i = 0; i < atomCount; i++) {
            atom = atoms[i];
            hin += "atom " + (i + 1) + " - " + atom.el + " ** - 0 " +
                atom.x.toFixed(4) + " " + atom.y.toFixed(4) + " " + atom.z.toFixed(4) + " " +
                (nbors[i] ? nbors[i].length + " " + nbors[i].join(" ") : "0") + "\n";
        }
        hin += "endmol 1";
    }
    return hin;
};

/**
 * Read a file
 * @param {String|Object} ref File reference - either a path, or a file object (or Blob)
 * @param {Function} cb A callback function to be invoked after the file is read
 */
fileAPI.readFile = function (ref, cb) {
    var xhr, reader;
    if (typeof ref === "string") { // file path was passed
        xhr = new XMLHttpRequest();
        xhr.open("GET", ref, true);
        xhr.addEventListener("load", function () {
            if (xhr.status === 200) {
                cb(xhr.responseText);
            }
        }, false);
        xhr.send(null);
    } else { // file object or blob was passed
        reader = new global.FileReader();
        reader.addEventListener("load", function () {
            cb(reader.result);
        }, false);
        reader.readAsText(ref);
    }
};

fileAPI.getBlobURL = function (data, type) {
    var blob;
    if (data instanceof global.Blob) {
        blob = data;
    } else {
        blob = new global.Blob([data], {type: type || "text/plain"});
    }
    if (blobUrl) {
        // Blob URLs are used only short periods of time (e.g. at the moment a hyperlink is clicked).
        // So, revoke the previous URL before creating the new one.
        global.URL.revokeObjectURL(blobUrl);
    }
    blobUrl = global.URL.createObjectURL(blob);
    return blobUrl;
};

})(this);