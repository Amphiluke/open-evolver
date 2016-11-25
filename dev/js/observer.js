let handlerRegistry = new WeakMap();

class Observer {
    constructor() {
        handlerRegistry.set(this, new Map());
    }

    // These static methods make the Observer class itself implement the Observer interface.
    // This may be used for broadcast messaging with the Observer object as a target
    static on(...params) {
        return Observer.prototype.on.apply(Observer, params);
    }

    static off(...params) {
        return Observer.prototype.off.apply(Observer, params);
    }

    static trigger(...params) {
        return Observer.prototype.trigger.apply(Observer, params);
    }

    on(event, handler) {
        let handlers = handlerRegistry.get(this);
        if (!handlers.has(event)) {
            handlers.set(event, []);
        }
        handlers.get(event).push(handler);
    }

    off(event, handler) {
        let handlers = handlerRegistry.get(this);
        if (!handlers.has(event)) {
            return;
        }
        if (handler) {
            let eventHandlers = handlers.get(event);
            let handlerIndex = eventHandlers.indexOf(handler);
            if (handlerIndex > -1) {
                eventHandlers.splice(handlerIndex, 1);
                if (eventHandlers.length === 0) {
                    handlers.delete(event);
                }
            }
        } else {
            handlers.get(event).length = 0;
            handlers.delete(event);
        }
    }

    trigger(event, ...params) {
        let handlers = handlerRegistry.get(this);
        if (handlers.has(event)) {
            for (let handler of handlers.get(event)) {
                handler.apply(null, params);
            }
        }
    }
}

// Observer class itself implements the Observer interface (this is instead of the constructor call)
handlerRegistry.set(Observer, new Map());

export default Observer;