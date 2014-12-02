(function (global) {

"use strict";

var $ = global.jQuery,
    _ = global._,
    OE = global.OE,
    ui = OE.ui || (OE.ui = {}),
    $doc = $(document);


ui.$ = function (target) {
    return (target && target.jquery) ? target : $(target);
};

ui.proto = {
    init: function () {
        var events = this.events || (this.events = {});
        _.each(events, function (config) {
            var handler = (typeof config.handler === "string") ? this[config.handler] : config.handler;
            ui.$(config.owner).on(config.type, config.filter || null, handler.bind(this));
        }, this);
        return this;
    }
};

ui.potentials = (_.extend(Object.create(ui.proto), {
    $el: $(".oe-potential-form"),

    tpl: _.template($("#oe-potentials-tpl").html()),

    events: [
        {type: "click", owner: ".oe-discard-potentials", handler: "handleDiscard"},
        {type: "keyup", owner: $doc, handler: "handleGlobalKeyUp"}
    ],

    handleDiscard: function () {
        this.hide();
    },

    handleGlobalKeyUp: function (e) {
        if (e.which === 27) {
            this.hide();
        }
    },

    show: function () {
        this.$el.removeClass("hidden");
    },

    hide: function () {
        this.$el.addClass("hidden");
    },

    setup: function () {
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
        $("ul.oe-potentials").html(ui.potentials.tpl({pairs: pairs}));
    }
})).init();


ui.menu = (_.extend(Object.create(ui.proto), {
    $el: $(".oe-menu"),

    events: [
        {type: "click.oe", owner: $doc, handler: "handleGlobalClick"},
        {type: "click", owner: ".oe-menu", filter: "menuitem[data-action]", handler: "handleAction"},
        {type: "change", owner: "#oe-file", handler: "handleFile"}
    ],

    handleGlobalClick: function (e) {
        var target = $(e.target),
            popups = this.$el.find("menu.expanded");
        if (target.is(".oe-menu button[menu]")) {
            popups = popups.not($("#" + target.attr("menu")).toggleClass("expanded"));
        }
        popups.removeClass("expanded");
    },

    handleAction: function (e) {
        var actionHandler = $(e.target).data("action") + "Action";
        if (typeof this[actionHandler] === "function") {
            this[actionHandler]();
        }
    },

    handleFile: function (e) {
        OE.fileAPI.loadHIN(e.target.files[0], ui.potentials.setup);
    },

    loadAction: function () {
        $("#oe-file").trigger("click");
    },

    saveAction: function () {
        // TODO: implement action
    },

    setupAction: function () {
        ui.potentials.show();
    },

    alterAction: function () {
        // TODO: implement action
    }
})).init();

})(this);