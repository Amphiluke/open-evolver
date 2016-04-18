import Observer from "./observer.js";

let actionStore = new Map();

let app = Object.assign(new Observer(), {
    addAction(name, action) {
        actionStore.set(name, action);
    },

    execAction(name, ...params) {
        if (!this.actionEnabled(name)) {
            throw new Error(`Action "${name}" is disabled and can't be executed`);
        }
        return actionStore.get(name).exec(...params);
    },

    actionEnabled(name) {
        return !this.busy && actionStore.get(name).enabled;
    },

    getActionStates() {
        let busy = this.busy;
        let states = new Map();
        for (let [name, action] of actionStore) {
            states.set(name, !busy && action.enabled);
        }
        return states;
    }
});

let busyCount = 0;

Object.defineProperty(app, "busy", {
    configurable: true,
    enumerable: true,
    get() {
        return busyCount > 0;
    },
    set(value) {
        let busyAnte = this.busy;
        // There is nothing to do if the value is false and the application is already idle
        if (busyAnte || value) {
            busyCount += value ? 1 : -1;
            let busy = this.busy;
            if (busyAnte !== busy) {
                this.trigger("app:stateChange", busy);
            }
        }
    }
});

export default app;