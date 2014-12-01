(function (global) {

"use strict";

var $ = global.jQuery,
    _ = global._,
    OE = global.OE,
    ui = OE.ui || (OE.ui = {}),
    $doc = $(document);


//(function () {
//    var ids = [];
//    ui.lock = function (id) {
//        if (!ids.length) {
//            // do lock
//        }
//        ids.push(id);
//    };
//    ui.unlock = function (id) {
//        var index = ids.indexOf(id);
//        if (index > -1) {
//            ids.splice(index, 1);
//            if (!ids.length) {
//                // do unlock
//            }
//        }
//    };
//})();

ui.potentialTpl = _.template($("#oe-potentials-tpl").html());

ui.setupPotentialGrid = function () {
    var atoms = OE.structure.atoms,
        atomList = [],
        pairs = [],
        i, j, len;
    for (i = 0, len = atoms.length; i < len; i++) {
        if (atomList.indexOf(atoms[i].el) === -1) {
            atomList.push(atoms[i].el);
        }
    }
    for (i = 0, len = atomList.length; i < len; i++) {
        for (j = i; j < len; j++) {
            pairs.push(atomList[i] + atomList[j]);
        }
    }
    $("ul.oe-potentials").html(ui.potentialTpl({pairs: pairs}));
};


$doc.on("click.oe", function (e) {
    var target = $(e.target),
        popups = $("menu.oe-menu menu.expanded");
    if (target.is("menu.oe-menu button[menu]")) {
        popups = popups.not($("#" + target.attr("menu")).toggleClass("expanded"));
    }
    popups.removeClass("expanded");
});

$("#oe-file").on("change", function () {
    OE.fileAPI.loadHIN(this.files[0], ui.setupPotentialGrid);
});

})(this);