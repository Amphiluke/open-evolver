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
            ui.$(config.owner || this.$el).on(config.type, config.filter || null, handler.bind(this));
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
        {type: "click", filter: ".oe-apply", handler: "handleApply"},
        {type: "click", filter: ".oe-discard", handler: "handleDiscard"},
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


ui.graph = (_.extend(Object.create(ui.abstractDialog), {
    $el: $(".oe-graph-form"),

    tpl: _.template($("#oe-cutoffs-tpl").html()),

    init: function () {
        OE.structureUtils.on("updateStructure", function (pairsUpdated) {
            if (pairsUpdated) {
                ui.graph.resetHTML.call(ui.graph);
            }
        });
        return ui.abstractDialog.init.apply(this, arguments);
    },

    events: [
        {type: "click", filter: ".oe-cutoffs .oe-cutoff", handler: "handlePairSelect"},
        {type: "change", filter: ".oe-cutoff-slider", handler: "handleSliderChange"},
        {type: "input", owner: "#oe-cutoff-exact", handler: "handleCutoffInput"},
        {type: "change", owner: "#oe-cutoff-exact", handler: "handleCutoffChange"}
    ],

    handlePairSelect: function (e) {
        var target = $(e.target),
            cutoff = target.text().trim();
        $(e.delegateTarget).find(".oe-cutoff").not(target).removeClass("active");
        target.addClass("active");
        $("#oe-cutoff-exact").val(cutoff).get(0).select();
        $(".oe-cutoff-slider").val(this.cutoff2Slider(+cutoff).toFixed(2));
    },

    handleSliderChange: function (e) {
        var cutoff = this.slider2Cutoff(+e.target.value);
        $("#oe-cutoff-exact").val(cutoff.toFixed(4)).trigger("input");
        this.updateGraph($(".oe-cutoff.active").data("pair"), cutoff);
    },

    handleCutoffInput: function (e) {
        $(".oe-cutoff.active").text(e.target.value);
    },

    handleCutoffChange: function (e) {
        if (e.target.checkValidity()) {
            $(".oe-cutoff-slider").val(this.cutoff2Slider(+e.target.value).toFixed(2));
            this.updateGraph($(".oe-cutoff.active").data("pair"), +e.target.value);
        }
    },

    cutoff2Slider: function (cutoff) {
        var slider = $(".oe-cutoff-slider")[0],
            minBound = +$("#oe-cutoff-min").val(),
            maxBound = +$("#oe-cutoff-max").val(),
            min = +slider.min,
            max = +slider.max;
        return min + (cutoff - minBound) * (max - min) / (maxBound - minBound);
    },

    slider2Cutoff: function (value) {
        var slider = $(".oe-cutoff-slider")[0],
            minBound = +$("#oe-cutoff-min").val(),
            maxBound = +$("#oe-cutoff-max").val(),
            min = +slider.min,
            max = +slider.max;
        return minBound + (value - min) * (maxBound - minBound) / (max - min);
    },

    resetHTML: function () {
        this.$el.find(".oe-cutoffs")
            .html(this.tpl({
                pairs: OE.structureUtils.pairList.slice(0, OE.structureUtils.pairList.length / 2)
            }))
            .find(".oe-cutoff").eq(0).addClass("active");
    },

    updateGraph: function (pair, cutoff) {
        // TODO: set busy flag
        OE.worker.invoke("reconnectPairs", {pair: pair, cutoff: cutoff});
    }
})).init();


ui.potentials = (_.extend(Object.create(ui.abstractDialog), {
    $el: $(".oe-potential-form"),

    tpl: _.template($("#oe-potentials-tpl").html()),

    init: function () {
        OE.structureUtils.on("updateStructure", function (pairsUpdated) {
            if (pairsUpdated) {
                ui.potentials.resetHTML.call(ui.potentials);
            }
        });
        return ui.abstractDialog.init.apply(this, arguments);
    },

    events: [
        {type: "change", filter: ".load-potentials", handler: "handleLoad"},
        {type: "mousedown", filter: ".save-potentials", handler: "handleSave"}
    ],

    handleLoad: function (e) {
        var reader = new FileReader();
        reader.addEventListener("load", function () {
            var rows = reader.result.split(/\r?\n/);
            _.each(rows, function (row) {
                var params = row.split("\t");
                ui.potentials.$el.find("li[data-pair='" + params[0] + "'] input").val(function (index) {
                    return params[index + 1] || "";
                });
            });
        }, false);
        reader.readAsText(e.target.files[0]);
    },

    handleSave: function (e) {
        var text = this.$el.find("li[data-pair]")
            .map(function () {
                var row = $(this);
                return row.data("pair") + "\t" + row.find("input").map(function () {
                    return this.value;
                }).get().join("\t");
            }).get().join("\r\n");
        e.target.href = "data:text/plain;base64," + btoa(text);
    },

    handleApply: function () {
        if (this.$el[0].checkValidity()) {
            return ui.abstractDialog.handleApply.apply(this, arguments);
        } else {
            window.alert("Please, fix invalid input first");
        }
    },

    resetHTML: function () {
        this.$el.find("ul.oe-potentials").html(this.tpl({pairs: OE.structureUtils.pairList}));
    },

    apply: function () {
        var potentials = {};
        this.$el.find("li[data-pair]").each(function (idx, row) {
            var params = {};
            row = $(row);
            row.find("input[data-param]").each(function (idx, el) {
                if (el.value) {
                    params[$(el).data("param")] = +el.value;
                    // Setting the defaultValue allows using form.reset() on possible future discards
                    el.defaultValue = el.value;
                } else {
                    return (params = false);
                }
            });
            if (params) {
                potentials[row.data("pair")] = params;
            }
        });
        OE.structureUtils.setPotentials(potentials);
    },

    discard: function () {
        this.$el[0].reset();
    },

    show: function () {
        var atoms = OE.structure.atoms,
            bonds = OE.structure.bonds,
            len = bonds.length,
            pairs = [],
            prefix, el1, el2,
            i;
        for (i = 0; i < len; i++) {
            prefix = (bonds[i].type === "x") ? "x-" : "";
            el1 = atoms[bonds[i].iAtm].el;
            el2 = atoms[bonds[i].jAtm].el;
            if (pairs.indexOf(prefix + el1 + el2) === -1) {
                pairs.push(prefix + el1 + el2);
                if (el1 !== el2) {
                    // Write both variants AB and BA to simplify further search
                    pairs.push(prefix + el2 + el1);
                }
            }
        }
        this.$el.find("li[data-pair]").each(function (idx, row) {
            row = $(row);
            row.toggleClass("missed", pairs.indexOf(row.data("pair")) === -1);
        });
        return ui.abstractDialog.show.apply(this, arguments);
    }
})).init();


ui.evolve = (_.extend(Object.create(ui.abstractDialog), {
    $el: $(".oe-evolve-form"),

    handleApply: function () {
        if (this.$el[0].checkValidity()) {
            return ui.abstractDialog.handleApply.apply(this, arguments);
        } else {
            window.alert("Please, fix invalid input first");
        }
    },

    apply: function () {
        this.$el.find("input[type='text']").each(function (idx, el) {
            el.defaultValue = el.value;
        });
        this.$el.find("input[type='checkbox']").each(function (idx, el) {
            el.defaultChecked = el.checked;
        });
        OE.worker.invoke("evolve", {
            stepCount: +$("#oe-step-count").val(),
            temperature: +$("#oe-temperature").val(),
            stoch: $("#oe-stoch").prop("checked")
        });
        ui.report.show();
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


ui.info = (_.extend(Object.create(ui.abstractDialog), {
    $el: $(".oe-info-dialog"),

    init: function () {
        var tpls = this.tpls = {};
        this.$el.find("script[type='text/template'][data-info]").each(function (idx, tpl) {
            tpl = $(tpl);
            tpls[tpl.data("info")] = _.template(tpl.html());
        });
        return ui.abstractDialog.init.apply(this, arguments);
    },

    applyTpl: function (tpl, data) {
        this.$el.find(".oe-info-dialog-text").html(this.tpls[tpl](data));
    }
})).init();


ui.report = (_.extend(Object.create(ui.abstractDialog), {
    $el: $(".oe-report"),

    tpl: _.template($("#oe-report-tpl").html()),

    init: function () {
        OE.worker.on("evolve", this.print.bind(this));
        OE.worker.on("evolve.progress", this.updateProgress.bind(this));
        return ui.abstractDialog.init.apply(this, arguments);
    },

    handleGlobalKeyUp: $.noop, // override the inherited behavior hiding the dialog on Esc key press

    print: function (data) {
        this.updateProgress(100);
        $("#oe-report-data").html(this.tpl({energy: data.energy, grad: data.norm}));
    },

    updateProgress: function (value) {
        $("#oe-report-progress").attr("value", value);
    }
})).init();


ui.menu = (_.extend(Object.create(ui.proto), {
    $el: $(".oe-menu"),

    events: [
        {type: "click.oe", owner: $doc, handler: "handleGlobalClick"},
        {type: "mouseenter", owner: ".oe-menu", filter: "button[menu]", handler: "handleHover"},
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

    handleHover: function (e) {
        var expandedMenu = this.$el.find("menu.expanded"),
            targetMenu;
        if (expandedMenu.length) {
            targetMenu = $(e.target).siblings("menu");
            if (!expandedMenu.is(targetMenu)) {
                expandedMenu.removeClass("expanded");
                targetMenu.addClass("expanded");
            }
        }
    },

    handleAction: function (e) {
        var actionHandler = $(e.target).data("action") + "Action";
        if (typeof this[actionHandler] === "function") {
            this[actionHandler]();
        }
    },

    handleFile: function (e) {
        OE.fileAPI.loadHIN(e.target.files[0]);
    },

    loadAction: function () {
        $("#oe-file").trigger("click");
    },

    saveAction: function () {
        // TODO: implement action
    },

    alterGraphAction: function () {
        ui.graph.show();
    },

    setupAction: function () {
        ui.potentials.show();
    },

    calcEnergyAction: function () {
        OE.worker.invoke("totalEnergy");
    },

    calcGradAction: function () {
        OE.worker.invoke("gradient");
    },

    evolveAction: function () {
        ui.evolve.show();
    },

    alterViewAction: function () {
        ui.appearance.show();
    }
})).init();


OE.worker.on("totalEnergy", function (data) {
    ui.info.applyTpl("energy", {
        energy: data,
        bonds: OE.structure.bonds.length
    });
    ui.info.show();
});

OE.worker.on("gradient", function (data) {
    ui.info.applyTpl("gradient", {grad: data});
    ui.info.show();
});

})(this);