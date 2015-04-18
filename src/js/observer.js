(function (global) {

"use strict";

var OE = global.OE || (global.OE = {}),
    observer = OE.observer = {},
    handlers = {},
    uid = 0;

function getObserverHandlers(instance) {
    var id = instance._oid;
    if (!handlers[id]) {
        id = ++uid;
        Object.defineProperty(instance, "_oid", {value: id});
        handlers[id] = {};
    }
    return handlers[id];
}

observer.on = function (event, handler) {
    var handlers = getObserverHandlers(this);
    if (!handlers[event]) {
        handlers[event] = [];
    }
    handlers[event].push(handler);
};

observer.off = function (event, handler) {
    var handlers = getObserverHandlers(this),
        handlerIndex;
    if (!handlers[event]) {
        return;
    }
    if (handler) {
        handlerIndex = handlers[event].indexOf(handler);
        if (handlerIndex > -1) {
            handlers[event].splice(handlerIndex, 1);
            if (handlers[event].length === 0) {
                delete handlers[event];
            }
        }
    } else {
        handlers[event].length = 0;
        delete handlers[event];
    }
};

observer.trigger = function (event) {
    var handlers = getObserverHandlers(this),
        args,
        i, len;
    if (!handlers[event]) {
        return;
    }
    args = Array.prototype.slice.call(arguments, 1);
    for (i = 0, len = handlers[event].length; i < len; i++) {
        handlers[event][i].apply(null, args);
    }
};

})(this);