(function (global) {

"use strict";

var OE = global.OE,
    app = OE.app = Object.create(OE.observer),
    actions = app.actions = {},
    actionStore = {},
    isBusy = false,
    actionProto;


/**
 * A set of predefined application states
 */
Object.defineProperties(app, {
    STARTED: {
        value: Object.freeze({
            load: true,
            save: false,
            alterGraph: false,
            setup: false,
            calcEnergy: false,
            calcGrad: false,
            evolve: false,
            alterView: false
        })
    },
    STRUCTURE_LOADED: {
        value: Object.freeze({
            load: true,
            save: true,
            alterGraph: true,
            setup: true,
            calcEnergy: false,
            calcGrad: false,
            evolve: false,
            alterView: true
        })
    },
    PARAMS_SET: {
        value: Object.freeze({
            load: true,
            save: true,
            alterGraph: true,
            setup: true,
            calcEnergy: true,
            calcGrad: true,
            evolve: true,
            alterView: true
        })
    },
    BUSY: {
        value: Object.freeze({
            load: false,
            save: false,
            alterGraph: false,
            setup: false,
            calcEnergy: false,
            calcGrad: false,
            evolve: false,
            alterView: false
        })
    },
    IDLE: {
        value: Object.seal({
            load: undefined,
            save: undefined,
            alterGraph: undefined,
            setup: undefined,
            calcEnergy: undefined,
            calcGrad: undefined,
            evolve: undefined,
            alterView: undefined
        })
    }
});

app.setState = function (actionStates) {
    var action;
    // Returning to idle is only possible if the application is currently busy.
    // And IDLE is the only state the busy application can fall into.
    if (isBusy ^ (actionStates === app.IDLE)) {
        return;
    }
    isBusy = (actionStates === app.BUSY);
    if (isBusy) {
        // Store the current action states to be able to reproduce them on returning to idle
        for (action in app.IDLE) {
            if (app.IDLE.hasOwnProperty(action)) {
                app.IDLE[action] = actions[action].enabled;
            }
        }
        document.body.classList.add("app-busy");
    } else {
        document.body.classList.remove("app-busy");
    }
    for (action in actionStates) {
        if (actionStates.hasOwnProperty(action) && actions.hasOwnProperty(action)) {
            // actions[action].enabled = actionStates[action];
            // Be silent, do not set the `enabled` property directly on an action,
            // since the setter will trigger the "stateChange" event on each action.
            // Instead, we will trigger a single "stateChange" event after setting all the action states
            actionStore[action].enabled = actionStates[action];
        }
    }
    app.trigger("stateChange");
};

/**
 * Create an application-level action
 * @param {String} name The unique name of an action to be created
 * @param {Function} execFn A function to be called when the action is executed
 */
app.addAction = function (name, execFn) {
    actions[name] = Object.create(actionProto, {name: {value: name}});
    actionStore[name] = {exec: execFn};
};

actionProto = Object.create(Object.prototype, {
    enabled: {
        enumerable: true,
        configurable: true,
        get: function () {
            return actionStore[this.name].enabled;
        },
        set: function (state) {
            actionStore[this.name].enabled = state;
            app.trigger("stateChange", this.name, state);
        }
    },
    exec: {
        configurable: true,
        value: function () {
            var action = actionStore[this.name];
            if (action.enabled) {
                action.exec.apply(this, arguments);
            }
        }
    }
});

app.addAction("load", function (file) {
    if (file) {
        OE.fileAPI.loadHIN(file, function () {
            OE.ui.report.hide();
        });
    }
});

app.addAction("save", function () {
    OE.ui.save.show();
});

app.addAction("alterGraph", function () {
    OE.ui.graph.show();
});

app.addAction("setup", function () {
    OE.ui.potentials.show();
});

app.addAction("calcEnergy", function () {
    OE.worker.invoke("totalEnergy");
});

app.addAction("calcGrad", function () {
    OE.worker.invoke("gradient");
});

app.addAction("evolve", function () {
    OE.ui.evolve.show();
});

app.addAction("alterView", function () {
    OE.ui.appearance.show();
});

app.setState(app.STARTED);

})(this);