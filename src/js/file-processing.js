(function (global) {

"use strict";

var OE = global.OE || (global.OE = {}),
    fileAPI = OE.fileAPI = {},
    formats = {};

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
    var reader = new FileReader();
    reader.addEventListener("load", function () {
        OE.structure = formats.hin.parse(reader.result);
        OE.view.render();
        if (typeof cb === "function") {
            cb();
        }
    }, false);
    reader.readAsText(fileObj);
};

})(this);