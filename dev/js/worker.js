import Observer from "./observer.js";
import app from "./app.js";

let worker = new Worker("js/calc.js");
let blockingMethod = "ready";
app.busy = true; // calc worker needs some initialization before it can be used

let workerHelper = Object.assign(new Observer(), {
    invoke(method, data) {
        if (blockingMethod) {
            throw new Error(`Unable to run the method “${method}” as the blocking method “${blockingMethod}” is still running`);
        }
        blockingMethod = method;
        app.busy = true; // note that every worker invocation turns the application into busy state
        worker.postMessage({method, data});
    }
});

worker.addEventListener("message", ({data: {method, data} = {}}) => {
    if (method) {
        if (method === blockingMethod) {
            app.busy = false;
            blockingMethod = null;
        }
        workerHelper.trigger(method, data);
    }
});

worker.addEventListener("error", e => {throw e;});

export default workerHelper;