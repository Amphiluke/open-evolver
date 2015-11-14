(function (global) {

"use strict";

var $ = global.jQuery,
    _ = global._,
    OE = global.OE,
    app = OE.app,
    actions = app.actions,
    ui = OE.ui || (OE.ui = {}),
    $doc = $(document),
    $body = $(document.body);


ui.$ = function (target) {
    return (target && target.jquery) ? target : $(target);
};

ui.loadTpls = function () {
    return $.getJSON("src/tpl/tpl.json").done(function (tpls) {
        ui.tpls = {};
        _.each(tpls, function (tpl, name) {
            ui.tpls[name] = _.template(tpl, {variable: "data"});
        });
    });
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
    },

    fix: function (fields) {
        var i, len,
            field;
        if (!fields) {
            fields = this.$el[0].elements; // `this.$el` should be a form, otherwise the `fix` method is useless
        }
        for (i = 0, len = fields.length; i < len; i++) {
            field = fields[i];
            // Setting the `defaultValue`/`defaultChecked`/`defaultSelected` prop allows using
            // `form.reset()` on possible future discards (see the `reset()` method)
            if (field.type === "checkbox" || field.type === "radio") {
                field.defaultChecked = field.checked;
            } else if (field.nodeName.toUpperCase() === "OPTION") {
                field.defaultSelected = field.selected;
            } else if ("defaultValue" in field) {
                field.defaultValue = field.value;
            } else if (field.options) { // selects
                this.fix(field.options);
            }
        }
    },

    reset: function () {
        this.$el[0].reset(); // `this.$el` should be a form, otherwise the `reset` method is useless
    }
});


ui.save = (_.extend(Object.create(ui.abstractDialog), {
    $el: $(".oe-save-form"),

    events: [
        {type: "change", owner: "#oe-file-type", handler: "handleTypeChange"},
        {type: "mousedown", filter: ".oe-apply", handler: "handleSave"}
    ],

    handleTypeChange: function (e) {
        this.$el.find(".type-description")
            .addClass("hidden")
            .filter("[data-type='" + e.target.value + "']").removeClass("hidden");
    },

    handleSave: function (e) {
        var selected = $("#oe-file-type").find("option:selected"),
            type = selected.closest("optgroup").data("type"),
            graphType = selected.data("graph"),
            file = OE.fileAPI.makeFile(type, graphType);
        if (file) {
            e.target.setAttribute("download", "untitled." + type);
            e.target.href = OE.fileAPI.getBlobURL(file);
        }
    }
})).init();


ui.saveSummary = (_.extend(Object.create(ui.abstractDialog), {
    $el: $(".oe-save-summary-form"),

    data: null,

    events: [
        {type: "mousedown", filter: "a[download]", handler: "handleSave"},
        {type: "click", filter: "a[download]", handler: "hide"}
    ],

    handleSave: function (e) {
        var type, text;
        if (this.data) {
            type = e.target.getAttribute("data-type");
            switch (type) {
                case "text/html":
                    text = ui.tpls.summary(this.data);
                    break;
                case "application/json":
                    text = global.JSON.stringify(this.data, null, 2);
                    break;
                default:
                    text = "TBD";
                    break;
            }
            e.target.href = OE.fileAPI.getBlobURL(text, type);
        }
    }
})).init();


ui.graph = (_.extend(Object.create(ui.abstractDialog), {
    $el: $(".oe-graph-form"),

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
            .html(ui.tpls.cutoffs({
                pairs: OE.structureUtils.pairList.slice(0, OE.structureUtils.pairList.length / 2)
            }))
            .find(".oe-cutoff").eq(0).addClass("active");
    },

    updateGraph: function (pair, cutoff) {
        OE.worker.invoke("reconnectPairs", {pair: pair, cutoff: cutoff});
    }
})).init();


ui.potentials = (_.extend(Object.create(ui.abstractDialog), {
    $el: $(".oe-potential-form"),

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
        OE.fileAPI.readFile(e.target.files[0], function (contents) {
            var rows = contents.split(/\r?\n/);
            _.each(rows, function (row) {
                var params = row.split("\t");
                ui.potentials.$el.find("li[data-pair='" + params[0] + "'] input").val(function (index) {
                    return params[index + 1] || "";
                });
            });
        });
    },

    handleSave: function (e) {
        var text = this.$el.find("li[data-pair]")
            .map(function () {
                var row = $(this);
                return row.data("pair") + "\t" + row.find("input").map(function () {
                    return this.value;
                }).get().join("\t");
            }).get().join("\r\n");
        e.target.href = OE.fileAPI.getBlobURL(text);
    },

    handleApply: function () {
        if (this.$el[0].checkValidity()) {
            return ui.abstractDialog.handleApply.apply(this, arguments);
        } else {
            window.alert("Please, fix invalid input first");
        }
    },

    resetHTML: function () {
        this.$el.find("ul.oe-potentials").html(ui.tpls.potentials({pairs: OE.structureUtils.pairList}));
    },

    apply: function () {
        var potentials = {};
        this.$el.find("li[data-pair]").each(function (idx, row) {
            var params = {};
            row = $(row);
            row.find("input[data-param]").each(function (idx, el) {
                if (el.value) {
                    params[$(el).data("param")] = +el.value;
                } else {
                    return (params = false);
                }
            });
            if (params) {
                potentials[row.data("pair")] = params;
            }
        });
        OE.structureUtils.setPotentials(potentials);
        this.fix();
    },

    discard: function () {
        this.reset();
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


ui.transform = (_.extend(Object.create(ui.abstractDialog), {
    $el: $(".oe-transform-form"),

    events: [
        {type: "click", owner: "#oe-translate-apply", handler: "handleTranslate"},
        {type: "click", filter: ".oe-rotate [data-axis]", handler: "handleRotate"}
    ],

    handleTranslate: function () {
        var fieldSet = this.$el.find(".oe-translate"),
            x = +fieldSet.find("[data-axis='x']").val(),
            y = +fieldSet.find("[data-axis='y']").val(),
            z = +fieldSet.find("[data-axis='z']").val();
        OE.structureUtils.translate(x, y, z);
    },

    handleRotate: function (e) {
        var angle = $("#oe-rotate-angle").val() * Math.PI / 180,
            axis = e.target.getAttribute("data-axis");
        OE.structureUtils.rotate(angle, axis);
    },

    show: function () {
        var center = OE.structureUtils.getCenterOfMass();
        this.$el.find(".oe-translate input[data-axis]").val(function () {
            return center[$(this).data("axis")].toFixed(5);
        });
        return ui.abstractDialog.show.apply(this, arguments);
    }
})).init();


ui.report = (_.extend(Object.create(ui.abstractDialog), {
    $el: $(".oe-report"),

    handleGlobalKeyUp: $.noop, // override the inherited behavior hiding the dialog on Esc key press

    print: function (data) {
        this.updateProgress(100);
        $("#oe-report-data").html(ui.tpls.report({energy: data.energy, grad: data.norm}));
    },

    updateProgress: function (value) {
        $("#oe-report-progress").attr("value", value);
    }
})).init();


ui.evolve = (_.extend(Object.create(ui.abstractDialog), {
    $el: $(".oe-evolve-form"),

    events: [
        {type: "change", owner: "#oe-keep-log", handler: "handleKeepLogChange"}
    ],

    init: function () {
        OE.worker.on("evolve", this.handleEvolveStop.bind(this));
        OE.worker.on("evolve.progress", ui.report.updateProgress.bind(ui.report));
        OE.worker.on("evolve.log", this.handleEvolveLog.bind(this));
        return ui.abstractDialog.init.apply(this, arguments);
    },

    handleEvolveStop: function (data) {
        ui.report.print(data);
    },

    handleEvolveLog: function (data) {
        var E = data.E,
            grad = data.grad,
            dt = data.dt,
            t = 0,
            log, i, len;
        log = "t, ps\tE, eV\t||grad E||, eV/Å\tdt, fs\n";
        for (i = 0, len = E.length; i < len; i++) {
            log += t.toExponential(4) + "\t" + E[i].toExponential(4) + "\t" +
                grad[i].toExponential(4) + "\t" + (dt[i] * 1E15).toExponential(4) + "\n";
            t += dt[i] * 1E12;
        }
        ui.info.applyTpl("save-log", {url: OE.fileAPI.getBlobURL(log)});
        ui.info.show();
    },

    handleApply: function () {
        if (this.$el[0].checkValidity()) {
            return ui.abstractDialog.handleApply.apply(this, arguments);
        } else {
            window.alert("Please, fix invalid input first");
        }
    },

    handleKeepLogChange: function (e) {
        $("#oe-log-interval").prop("disabled", !e.target.checked).val("0");
    },

    apply: function () {
        this.fix();
        OE.worker.invoke("evolve", {
            stepCount: +$("#oe-step-count").val(),
            temperature: +$("#oe-temperature").val(),
            stoch: $("#oe-stoch").prop("checked"),
            logInterval: +$("#oe-log-interval").val()
        });
        ui.report.show();
    },

    discard: function () {
        this.reset();
    }
})).init();


ui.appearance = (_.extend(Object.create(ui.abstractDialog), {
    $el: $(".oe-appearance-form"),

    init: function () {
        OE.structureUtils.on("updateStructure", this.handleUpdateStructure.bind(this));
        return ui.abstractDialog.init.apply(this, arguments);
    },

    events: [
        {type: "change", owner: "#oe-appearance-element", handler: "setCurrElementColor"},
        {type: "change", owner: "#oe-appearance-color", handler: "handleColorChange"}
    ],

    handleUpdateStructure: function (rescanAtoms) {
        if (rescanAtoms) {
            $("#oe-appearance-element")
                .html("<option selected>" + OE.structureUtils.atomList.join("</option><option>") + "</option>");
            this.setCurrElementColor();
        }
    },

    handleColorChange: function (e) {
        var color = parseInt(e.target.value.slice(1), 16); // skip the leading # sign
        if (isNaN(color)) {
            return;
        }
        if (!this.tmpClrPresets) {
            this.tmpClrPresets = {};
        }
        // Store the value in a temporal object (it will be copied to `OE.view.presets` if the dialog won't be discarded)
        this.tmpClrPresets[$("#oe-appearance-element").val()] = color;
    },

    apply: function () {
        OE.view.appearance = this.$el.find("input[name='appearance']:checked").data("appearance");
        OE.view.setBgColor($("#oe-bg-color").val());
        if (this.tmpClrPresets) {
            OE.view.setAtomColors(this.tmpClrPresets);
            delete this.tmpClrPresets;
        }
        OE.view.render();
        this.fix();
    },

    discard: function () {
        this.reset();
        delete this.tmpClrPresets;
        this.setCurrElementColor();
    },

    setCurrElementColor: function () {
        var el = $("#oe-appearance-element").val(),
            color;
        if (this.tmpClrPresets && (el in this.tmpClrPresets)) {
            color = this.tmpClrPresets[el];
        } else {
            color = OE.view.getAtomColor(el);
        }
        $("#oe-appearance-color").val("#" + ("000000" + color.toString(16)).slice(-6));
    }
})).init();


ui.info = (_.extend(Object.create(ui.abstractDialog), {
    $el: $(".oe-info-dialog"),

    applyTpl: function (tpl, data) {
        this.$el.find(".oe-info-dialog-text").html(ui.tpls[tpl](data));
    }
})).init();


ui.menu = (_.extend(Object.create(ui.proto), {
    $el: $(".oe-menu"),

    init: function () {
        this.setItemStates();
        OE.app.on("stateChange", this.setItemStates.bind(this));
        return ui.proto.init.apply(this, arguments);
    },

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
        var action = $(e.target).data("action");
        if (actions[action] && actions[action].exec) {
            if (action === "load") { // the action "load" requires a file to be specified
                $("#oe-file").trigger("click");
            } else {
                actions[action].exec();
            }
        }
    },

    handleFile: function (e) {
        actions.load.exec(e.target.files[0]);
    },

    setItemStates: function (action) {
        var items = $("menuitem[data-action]");
        if (action) {
            items = items.filter("[data-action='" + action + "']");
        }
        items.each(function (idx, item) {
            var state = actions[item.getAttribute("data-action")].enabled,
                disabled = item.hasAttribute("disabled");
            if (state && disabled) {
                item.removeAttribute("disabled");
            } else if (!state && !disabled) {
                item.setAttribute("disabled", "disabled");
            }
        });
    }
})).init();

ui.misc = (_.extend(Object.create(ui.proto), {
    events: [
        {type: "click", owner: ".oe-acknowledgements", handler: "handleACKClick"},

        {type: "dragenter dragover", owner: "#oe-view", handler: "handleDragEnterOver"},
        {type: "dragleave", owner: "#oe-view", handler: "handleDragLeave"},
        {type: "drop", owner: "#oe-view", handler: "handleDrop"}
    ],

    handleACKClick: function (e) {
        if (e.target === e.delegateTarget) {
            e.target.className += " hidden";
        }
    },

    handleDragEnterOver: function (e) {
        e.preventDefault();
        if (e.type === "dragenter") {
            e.currentTarget.classList.add("oe-droppable");
        }
    },

    handleDragLeave: function (e) {
        e.preventDefault();
        if (e.target === e.currentTarget) { // skip event when fired by children
            e.target.classList.remove("oe-droppable");
        }
    },

    handleDrop: function (e) {
        var dt = e.originalEvent.dataTransfer,
            files = dt && dt.files;
        if (files && files.length) {
            e.preventDefault();
            actions.load.exec(files[0]);
        }
        e.currentTarget.classList.remove("oe-droppable");
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

OE.worker.on("collectStats", function (data) {
    data.name = $("#oe-file")[0].files[0].name;
    ui.saveSummary.data = data;
    ui.saveSummary.show();
});


app.on("stateChange", function () {
    $body.toggleClass("app-busy", (app.state === app.BUSY));
});

app.state = app.BUSY;
ui.loadTpls().done(function () {
    app.state = app.IDLE;
});

})(this);