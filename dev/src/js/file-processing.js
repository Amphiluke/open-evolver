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
    parseMolecule: function (atomRecords, result) {
        var atoms = result.atoms,
            bonds = result.bonds,
            inc = atoms.length, // total number of atoms added into the structure previously
            spaceRE = /\s+/,
            len, i,
            items, cn, j;
        for (i = 0, len = atomRecords.length; i < len; i++) {
            items = atomRecords[i].trim().split(spaceRE);
            atoms.push({el: items[3], x: +items[7], y: +items[8], z: +items[9]});
            for (j = 11, cn = 2 * items[10] + 11; j < cn; j += 2) {
                if (items[j] - 1 > i) {
                    bonds.push({
                        iAtm: i + inc,
                        jAtm: items[j] - 1 + inc,
                        type: items[j + 1]
                    });
                }
            }
        }
    },

    parse: function (fileStr) {
        var molRE = /\n\s*mol\s+(\d+)([\s\S]+)\n\s*endmol\s+\1\b/g,
            atmRE = /^atom\s+\d+\s+.+$/gm,
            result = {atoms: [], bonds: []},
            mol;
        while (mol = molRE.exec(fileStr)) {
            this.parseMolecule(mol[2].match(atmRE), result);
        }
        return result;
    }
};

formats.ml2 = formats.mol2 = {
    /* MOL2 file syntax defines the atom record as follows:
    atom_id atom_name x y z atom_type [subst_id [subst_name [charge [status_bit]]]]
       0        1     2 3 4     5         6          7         8         9
    MOL2 file syntax defines the bond record as follows:
    bond_id origin_atom_id target_atom_id bond_type [status_bits]
       0          1              2            3           4 */
    parseMolecule: function (atomRecords, bondRecords, result) {
        var atoms = result.atoms,
            bonds = result.bonds,
            inc = atoms.length, // total number of atoms added into the structure previously
            spaceRE = /\s+/,
            len, i,
            items, dotPos;
        for (i = 0, len = atomRecords.length; i < len; i++) {
            items = atomRecords[i].trim().split(spaceRE);
            dotPos = items[5].indexOf("."); // atom_type may look like "C.3"
            atoms.push({
                el: (dotPos > -1) ? items[5].slice(0, dotPos) : items[5],
                x: +items[2],
                y: +items[3],
                z: +items[4]
            });
        }
        for (i = 0, len = bondRecords.length; i < len; i++) {
            items = bondRecords[i].trim().split(spaceRE);
            bonds.push({
                iAtm: items[1] - 1 + inc,
                jAtm: items[2] - 1 + inc,
                type: items[3]
            });
        }
    },

    parse: function (fileStr) {
        var result = {atoms: [], bonds: []},
            molChunks = fileStr.split("@<TRIPOS>MOLECULE").slice(1),
            atomRE = /@<TRIPOS>ATOM([\s\S]+?)(?:@<TRIPOS>|$)/,
            bondRE = /@<TRIPOS>BOND([\s\S]+?)(?:@<TRIPOS>|$)/,
            newLineRE = /(?:\r?\n)+/,
            i, len,
            atomSection, atomRecords,
            bondSection, bondRecords;
        for (i = 0, len = molChunks.length; i < len; i++) {
            atomSection = molChunks[i].match(atomRE);
            atomRecords = (atomSection && atomSection[1].trim().split(newLineRE)) || [];
            bondSection = molChunks[i].match(bondRE);
            bondRecords = (bondSection && bondSection[1].trim().split(newLineRE)) || [];
            this.parseMolecule(atomRecords, bondRecords, result);
        }
        return result;
    }
};

formats.xyz = {
    parseAtomRecord: function (atomStr) {
        var items = atomStr.trim().split(/\s+/);
        return {
            el: items[0],
            x: +items[1],
            y: +items[2],
            z: +items[3]
        };
    },

    parse: function (fileStr) {
        var atomRecords = fileStr.split(/(?:\r?\n)+/).slice(2);
        return atomRecords && {
            atoms: atomRecords.map(this.parseAtomRecord, this),
            bonds: []
        };
    }
};

fileAPI.load = function (fileRef, cb) {
    this.readFile(fileRef, function (contents) {
        var name = fileRef.name || String(fileRef),
            type = name.slice(name.lastIndexOf(".") + 1).toLowerCase(),
            format = formats[type] || formats.hin,
            structure = format.parse(contents);
        structure.name = name.replace(/.*[\/\\]/, "") || "unknown";
        OE.structureUtils.overwrite(structure);
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

fileAPI.makeML2 = function (graphType) {
    var atoms = OE.structure.atoms,
        atomCount = atoms.length,
        ml2,
        i, len,
        atom,
        bondCount, bonds, bond;
    ml2 = "# The structure was saved in OpenEvolver\n@<TRIPOS>MOLECULE\n****\n" + atomCount +
        " %BOND_COUNT%\nSMALL\nNO_CHARGES\n\n\n@<TRIPOS>ATOM\n"; // bond count is TBD later
    for (i = 0, len = atoms.length; i < len; i++) {
        atom = atoms[i];
        ml2 += (i + 1) + " " + atom.el + " " + atom.x.toFixed(4) + " " + atom.y.toFixed(4) + " " + atom.z.toFixed(4) +
            " " + atom.el + " 1 **** 0.0000\n";
    }
    bondCount = 0;
    if (graphType !== "empty") {
        bonds = OE.structure.bonds;
        ml2 += "@<TRIPOS>BOND\n";
        for (i = 0, len = bonds.length; i < len; i++) {
            bond = bonds[i];
            if (graphType !== "basic" || bond.type !== "x") {
                bondCount++;
                ml2 += bondCount + " " + (bond.iAtm + 1) + " " + (bond.jAtm + 1) + " " + bond.type + "\n";
            }
        }
    }
    ml2 += "@<TRIPOS>SUBSTRUCTURE\n1 **** 0";
    ml2 = ml2.replace("%BOND_COUNT%", bondCount.toString());
    return ml2;
};

fileAPI.makeXYZ = function () {
    var atoms = OE.structure.atoms,
        len = atoms.length,
        xyz = len + "\nThe structure was saved in OpenEvolver",
        i, atom;
    for (i = 0; i < len; i++) {
        atom = atoms[i];
        xyz += "\n" + atom.el + " " +  atom.x.toFixed(5) + " " + atom.y.toFixed(5) + " " + atom.z.toFixed(5);
    }
    return xyz;
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