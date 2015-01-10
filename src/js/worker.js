(function (global) {

"use strict";

var OE = global.OE,
    app = OE.app,
    worker = OE.worker = Object.create(OE.observer),
    calcWorker = new global.Worker("src/js/calc.js"),
    blockingMethod = null;


worker.invoke = function (method, data) {
    blockingMethod = method;
    // Note that every worker invocation turns the application into busy state, so be sure to
    // set the desired application state either just before the worker invocation, or after
    // the invoked worker method finishes, but not between these two events
    app.setState(app.BUSY);
    calcWorker.postMessage({method: method, data: data});
};


calcWorker.addEventListener("error", function (e) {
    throw e;
});

calcWorker.addEventListener("message", function (e) {
    var method = e.data && e.data.method;
    if (method) {
        if (method === blockingMethod) {
            app.setState(app.IDLE);
            blockingMethod = null;
        }
        worker.trigger(method, e.data.data);
    }
});

})(this);