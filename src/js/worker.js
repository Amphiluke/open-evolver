(function (global) {

"use strict";

var OE = global.OE,
    worker = OE.worker = Object.create(OE.observer),
    calcWorker = new global.Worker("src/js/calc.js");


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