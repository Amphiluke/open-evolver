import Observer from "./observer.js";
import app from "./app.js";

let blockingMethod = "ready";
app.busy = true; // calc worker needs some initialization before it can be used

let worker = Object.assign(new Observer(), {
    invoke(method, data) {
        blockingMethod = method;
        app.busy = true; // note that every worker invocation turns the application into busy state
        calcWorker.postMessage({method, data});
    }
});

let calcWorker = new Worker("js/calc.js");

calcWorker.addEventListener("message", e => {
    let method = e.data && e.data.method;
    if (method) {
        if (method === blockingMethod) {
            app.busy = false;
            blockingMethod = null;
        }
        worker.trigger(method, e.data.data);
    }
});

calcWorker.addEventListener("error", e => {throw e;});

export default worker;