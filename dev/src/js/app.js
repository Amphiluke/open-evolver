import Observer from "./observer.js";

const actionStore = new Map();
let busyCount = 0;

export default Object.defineProperties(new Observer(), {
    busy: {
        enumerable: true,
        get() {
            return busyCount > 0;
        },
        set(value) {
            let busy = this.busy;
            // There is nothing to do if the value is false and the application is already idle
            if (busy || value) {
                busyCount += value ? 1 : -1;
                if (busy !== this.busy) {
                    this.trigger("app:stateChange", busyCount > 0);
                }
            }
        }
    },

    addAction: {
        value({name, exec, enabled}) {
            actionStore.set(name, {exec, enabled});
        }
    },

    execAction: {
        value(name, ...params) {
            if (!this.actionEnabled(name)) {
                throw new Error(`Action "${name}" is disabled and can't be executed`);
            }
            return actionStore.get(name).exec(...params);
        }
    },

    actionEnabled: {
        value(name) {
            return !this.busy && actionStore.get(name).enabled();
        }
    },

    getActionStates: {
        value() {
            let busy = this.busy;
            let states = new Map();
            for (let {name, action} of actionStore) {
                states.set(name, !busy && action.enabled());
            }
            return states;
        }
    }
});


//let OE = global.OE,
//    app = OE.app = Object.create(OE.observer),
//    actions = app.actions = {},
//    actionStore = {},
//    busyCount = 0,
//    appState,
//    actionProto;


///**
// * A set of predefined application states
// * Important: do not add any properties into the `app` object until all the predefined states
// * are declared. Once the states are created, their names will be kept in the `predefinedStateNames`
// * variable
// */
//Object.defineProperties(app, {
//    STARTED: {
//        value: Object.freeze({
//            openStore: true,
//            load: true,
//            save: false,
//            saveSummary: false,
//            alterGraph: false,
//            setup: false,
//            transform: false,
//            calcEnergy: false,
//            calcGrad: false,
//            evolve: false,
//            alterView: false
//        })
//    },
//    STRUCTURE_LOADED: {
//        value: Object.freeze({
//            openStore: true,
//            load: true,
//            save: true,
//            saveSummary: false,
//            alterGraph: true,
//            setup: true,
//            transform: true,
//            calcEnergy: false,
//            calcGrad: false,
//            evolve: false,
//            alterView: true
//        })
//    },
//    PARAMS_SET: {
//        value: Object.freeze({
//            openStore: true,
//            load: true,
//            save: true,
//            saveSummary: true,
//            alterGraph: true,
//            setup: true,
//            transform: true,
//            calcEnergy: true,
//            calcGrad: true,
//            evolve: true,
//            alterView: true
//        })
//    },
//    BUSY: {
//        value: Object.freeze({
//            openStore: false,
//            load: false,
//            save: false,
//            saveSummary: false,
//            alterGraph: false,
//            setup: false,
//            transform: false,
//            calcEnergy: false,
//            calcGrad: false,
//            evolve: false,
//            alterView: false
//        })
//    },
//    IDLE: {
//        value: Object.seal({
//            openStore: undefined,
//            load: undefined,
//            save: undefined,
//            saveSummary: undefined,
//            alterGraph: undefined,
//            setup: undefined,
//            transform: undefined,
//            calcEnergy: undefined,
//            calcGrad: undefined,
//            evolve: undefined,
//            alterView: undefined
//        })
//    }
//});
//
//// There should be no other own properties except predefined state objects at this point!
//(function (predefinedStateNames) {
//    app._isStatePredefined = function (state) {
//        if (state === app.IDLE) { // IDLE is a special case since it can mutate
//            return false;
//        }
//        for (let prop of predefinedStateNames) {
//            if (app[prop] === state) {
//                return true;
//            }
//        }
//        return false;
//    };
//})(Object.getOwnPropertyNames(app));
//
//Object.defineProperty(app, "state", {
//    configurable: false,
//    enumerable: true,
//    get() {
//        return app._isStatePredefined(appState) ? appState : Object.assign({}, appState);
//    },
//    set(actionStates) {
//        if (actionStates === appState) {
//            if (appState === app.BUSY) {
//                busyCount++;
//            }
//            return;
//        }
//        if (actionStates === app.BUSY) {
//            busyCount++;
//            // Store the current action states to be able to reproduce them on returning to idle
//            for (let action of Object.keys(app.IDLE)) {
//                app.IDLE[action] = actions[action].enabled;
//            }
//        } else if (actionStates === app.IDLE) {
//            // It's not possible to fall into idle if not currently busy.
//            // And if busyCount stays positive after decrementing then the app remains busy so far
//            if ((appState !== app.BUSY) || (--busyCount > 0)) {
//                return;
//            }
//        } else if (appState === app.BUSY) {
//            return; // IDLE is the only state the busy application can fall into
//        }
//        // If `actionStates` is one of the predefined state objects then assign it to appState
//        // directly (as is), else clone `actionStates`
//        appState = app._isStatePredefined(actionStates) ? actionStates : Object.assign({}, actionStates);
//        app.trigger("stateChange");
//    }
//});
//
///**
// * Create an application-level action
// * @param {String} name The unique name of an action to be created
// * @param {Function} execFn A function to be called when the action is executed
// */
//app.addAction = function (name, execFn) {
//    actions[name] = Object.create(actionProto, {name: {value: name}});
//    actionStore[name] = {exec: execFn};
//};
//
//actionProto = Object.create(Object.prototype, {
//    enabled: {
//        enumerable: true,
//        configurable: true,
//        get() {
//            return app.state[this.name];
//        },
//        set(state) {
//            let actionStates = app.state;
//            state = !!state;
//            if (actionStates[this.name] !== state) {
//                actionStates[this.name] = state;
//                app.state = actionStates;
//            }
//        }
//    },
//    exec: {
//        configurable: true,
//        value(...args) {
//            let action = actionStore[this.name];
//            if (action.enabled) {
//                action.exec.apply(this, args);
//            }
//        }
//    }
//});
//
//app.addAction("openStore", function () {
//    OE.ui.store.show();
//});
//
//app.addAction("load", function (file) {
//    if (file) {
//        OE.fileAPI.load(file, () => OE.ui.report.hide());
//    }
//});
//
//app.addAction("save", function () {
//    OE.ui.save.show();
//});
//
//app.addAction("saveSummary", function () {
//    OE.worker.invoke("collectStats");
//});
//
//app.addAction("alterGraph", function () {
//    OE.ui.graph.show();
//});
//
//app.addAction("setup", function () {
//    OE.ui.potentials.show();
//});
//
//app.addAction("transform", function () {
//    OE.ui.transform.show();
//});
//
//app.addAction("calcEnergy", function () {
//    OE.worker.invoke("totalEnergy");
//});
//
//app.addAction("calcGrad", function () {
//    OE.worker.invoke("gradient");
//});
//
//app.addAction("evolve", function () {
//    OE.ui.evolve.show();
//});
//
//app.addAction("alterView", function () {
//    OE.ui.appearance.show();
//});
//
//app.on("stateChange", function () {
//    let actionStates = app.state,
//        action;
//    for (action in actionStates) {
//        if (actionStates.hasOwnProperty(action) && actions.hasOwnProperty(action)) {
//            actionStore[action].enabled = actionStates[action];
//        }
//    }
//});
//
//app.state = app.STARTED;
