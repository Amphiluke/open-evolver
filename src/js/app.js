(function (global) {

"use strict";

var OE = global.OE,
    actions = OE.actions = Object.create(OE.observer),
    actionStore = {},
    actionProto,
    app;

/**
 * Create an application-level action
 * @param {String} name The unique name of an action to be created
 * @param {Function} execFn A function to be called when the action is executed
 */
function addAction(name, execFn) {
    actions[name] = Object.create(actionProto, {name: {value: name}});
    actionStore[name] = {exec: execFn};
}

actionProto = Object.create(Object.prototype, {
    enabled: {
        enumerable: true,
        configurable: true,
        get: function () {
            return actionStore[this.name].enabled;
        },
        set: function (state) {
            actionStore[this.name].enabled = state;
            actions.trigger("stateChange", this.name, state);
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

addAction("load", function (file) {
    if (file) {
        OE.fileAPI.loadHIN(file, function () {
            app.setState(app.STRUCTURE_LOADED);
        });
    }
});

addAction("save", function () {
    // TODO: implement action
});

addAction("alterGraph", function () {
    OE.ui.graph.show();
});

addAction("setup", function () {
    OE.ui.potentials.show();
});

addAction("calcEnergy", function () {
    OE.worker.invoke("totalEnergy");
});

addAction("calcGrad", function () {
    OE.worker.invoke("gradient");
});

addAction("evolve", function () {
    OE.ui.evolve.show();
});

addAction("alterView", function () {
    OE.ui.appearance.show();
});


app = OE.app = {
    // A set of predefined application states
    STARTED: Object.freeze({
        load: true,
        save: false,
        alterGraph: false,
        setup: false,
        calcEnergy: false,
        calcGrad: false,
        evolve: false,
        alterView: false
    }),
    STRUCTURE_LOADED: Object.freeze({
        load: true,
        save: true,
        alterGraph: true,
        setup: true,
        calcEnergy: false,
        calcGrad: false,
        evolve: false,
        alterView: true
    }),
    PARAMS_SET: Object.freeze({
        load: true,
        save: true,
        alterGraph: true,
        setup: true,
        calcEnergy: true,
        calcGrad: true,
        evolve: true,
        alterView: true
    }),
    BUSY: Object.freeze({
        load: false,
        save: false,
        alterGraph: false,
        setup: false,
        calcEnergy: false,
        calcGrad: false,
        evolve: false,
        alterView: false
    }),
    IDLE: Object.seal({
        load: undefined,
        save: undefined,
        alterGraph: undefined,
        setup: undefined,
        calcEnergy: undefined,
        calcGrad: undefined,
        evolve: undefined,
        alterView: undefined
    }),

    setState: function (actionStates) {
        var action;
        if (actionStates === app.BUSY) {
            // Store the current action states to be able to reproduce them on returning to idle
            for (action in app.IDLE) {
                if (app.IDLE.hasOwnProperty(action)) {
                    app.IDLE[action] = actions[action].enabled;
                }
            }
        }
        for (action in actionStates) {
            if (actionStates.hasOwnProperty(action) && actions.hasOwnProperty(action)) {
                actions[action].enabled = actionStates[action];
            }
        }
    }
};

app.setState(app.STARTED);

})(this);