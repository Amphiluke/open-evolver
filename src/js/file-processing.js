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
    var reader = new FileReader();
    reader.addEventListener("load", function (e) {
        OE.structureUtils.overwrite(formats.hin.parse(e.target.result));
        OE.view.render();
        if (typeof cb === "function") {
            cb();
        }
    }, false);
    reader.readAsText(fileObj);
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