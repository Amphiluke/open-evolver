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


ui.abstractDialog = _.extend(Object.create(ui.proto), {
    init: function () {
        if (this.hasOwnProperty("events")) {
            this.events = this.events.concat(ui.abstractDialog.events);
        }
        return ui.proto.init.apply(this, arguments);
    },

    events: [
        {type: "click", owner: ".oe-apply", handler: "handleApply"},
        {type: "click", owner: ".oe-discard", handler: "handleDiscard"},
        {type: "keyup", owner: $doc, handler: "handleGlobalKeyUp"}
    ],

    handleApply: function () {
        this.apply();
        this.hide();
    },

    handleDiscard: function () {
        this.discard();
        this.hide();
    },

    handleGlobalKeyUp: function (e) {
        if (e.which === 27) {
            this.discard();
            this.hide();
        }
    },

    apply: $.noop,

    discard: $.noop,

    show: function () {
        this.$el.removeClass("hidden");
    },

    hide: function () {
        this.$el.addClass("hidden");
    }
});


ui.potentials = (_.extend(Object.create(ui.abstractDialog), {
    $el: $(".oe-potential-form"),

    tpl: _.template($("#oe-potentials-tpl").html()),

    handleApply: function () {
        if (this.$el[0].checkValidity()) {
            return Object.getPrototypeOf(this).handleApply.apply(this, arguments);
        } else {
            window.alert("Please, fix invalid input first");
        }
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
        // Add extra-graph pairs
        pairs = pairs.concat(pairs.map(function (pair) {
            return "x-" + pair;
        }));
        $("ul.oe-potentials").html(ui.potentials.tpl({pairs: pairs}));
    },

    apply: function () {
        var potentials = OE.structure.potentials = {};
        this.$el.find("li[data-pair]").each(function () {
            var row = $(this),
                params = {};
            row.find("input[data-param]").each(function () {
                if (this.value) {
                    params[$(this).data("param")] = +this.value;
                    // Setting the defaultValue allows using form.reset() on possible future discards
                    this.defaultValue = this.value;
                } else {
                    return (params = false);
                }
            });
            if (params) {
                potentials[row.data("pair")] = params;
            }
        });
    },

    discard: function () {
        this.$el[0].reset();
    }
})).init();


ui.appearance = (_.extend(Object.create(ui.abstractDialog), {
    $el: $(".oe-appearance-form"),

    apply: function () {
        var appearance = this.$el.find("input[name='appearance']").filter(":checked").data("appearance");
        if (appearance !== OE.view.appearance) {
            OE.view.appearance = appearance;
            OE.view.render();
        }
    },

    discard: function () {
        this.$el.find("input[data-appearance='" + OE.view.appearance + "']").prop("checked", true);
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
        ui.appearance.show();
    }
})).init();

})(this);