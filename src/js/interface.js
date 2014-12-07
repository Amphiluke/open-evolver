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
        {type: "click", owner: ".oe-cutoffs", filter: ".oe-cutoff", handler: "handlePairSelect"},
        {type: "change", owner: ".oe-cutoff-slider", handler: "handleSliderChange"},
        {type: "input", owner: "#oe-cutoff-exact", handler: "handleCutoffInput"},
        {type: "change", owner: "#oe-cutoff-exact", handler: "handleCutoffChange"}
    ],

    handlePairSelect: function (e) {
        var target = $(e.target);
        $(e.delegateTarget).find(".oe-cutoff").not(target).removeClass("active");
        target.addClass("active");
        $("#oe-cutoff-exact").val(target.text().trim()).get(0).select();
    },

    handleSliderChange: function (e) {
        var target = e.target,
            minBound = +$("#oe-cutoff-min").val(),
            maxBound = +$("#oe-cutoff-max").val(),
            min = +target.min,
            max = +target.max,
            cutoff = minBound + (target.value - min) * (maxBound - minBound) / (max - min);
        $("#oe-cutoff-exact").val(cutoff.toFixed(4)).trigger("input");
        this.updateGraph($(".oe-cutoff.active").data("pair"), cutoff);
    },

    handleCutoffInput: function (e) {
        $(".oe-cutoff.active").text(e.target.value);
    },

    handleCutoffChange: function (e) {
        var slider, sliderVal,
            minBound, maxBound, min, max;
        if (e.target.checkValidity()) {
            slider = $(".oe-cutoff-slider");
            minBound = +$("#oe-cutoff-min").val();
            maxBound = +$("#oe-cutoff-max").val();
            min = +slider[0].min;
            max = +slider[0].max;
            sliderVal = min + (e.target.value - minBound) * (max - min) / (maxBound - minBound);
            slider.val(sliderVal.toFixed(2));
            this.updateGraph($(".oe-cutoff.active").data("pair"), +e.target.value);
        }
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
        {type: "change", owner: ".load-potentials", handler: "handleLoad"},
        {type: "mousedown", owner: ".save-potentials", handler: "handleSave"}
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
        OE.structureUtils.setPotentials(potentials);
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
        this.$el.find("script[type='text/template'][data-info]").each(function () {
            var tpl = $(this);
            tpls[tpl.data("info")] = _.template(tpl.html());
        });
        return ui.abstractDialog.init.apply(this, arguments);
    },

    applyTpl: function (tpl, data) {
        this.$el.find(".oe-info-dialog-text").html(this.tpls[tpl](data));
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

})(this);