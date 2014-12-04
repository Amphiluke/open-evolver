(function (global) {

"use strict";

var OE = global.OE || (global.OE = {}),
    worker = OE.worker = {},
    messageHandlers = {},
    calcWorker = new global.Worker("src/js/calc.js");


worker.on = function (message, handler) {
    if (!messageHandlers[message]) {
        messageHandlers[message] = [];
    }
    messageHandlers[message].push(handler);
};

worker.off = function (message, handler) {
    var handlers = messageHandlers[message],
        handlerIndex;
    if (!handlers) {
        return;
    }
    if (handler) {
        handlerIndex = handlers.indexOf(handler);
        if (handlerIndex > -1) {
            handlers.splice(handlerIndex, 1);
            if (handlers.length === 0) {
                delete messageHandlers[message];
            }
        }
    } else {
        handlers.length = 0;
        delete messageHandlers[message];
    }
};

worker.trigger = function (message, data) {
    var handlers = messageHandlers[message],
        i, len;
    if (!handlers) {
        return;
    }
    for (i = 0, len = handlers.length; i < len; i++) {
        handlers[i](data);
    }
};

worker.invoke = function (method, data) {
    calcWorker.postMessage({method: method, data: data});
};


calcWorker.addEventListener("error", function (e) {
    throw e;
});

calcWorker.addEventListener("message", function (e) {
    var method = e.data && e.data.method;
    if (method) {
        worker.trigger(method, e.data.data);
    }
});

})(this);