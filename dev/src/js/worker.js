import Observer from "./observer.js";
import app from "./app.js";

const calcWorker = new Worker("src/js/calc.js");

let blockingMethod = null;

const worker = Object.defineProperties(new Observer(), {
    invoke: {
        value(method, data) {
            blockingMethod = method;
            app.busy = true; // note that every worker invocation turns the application into busy state
            calcWorker.postMessage({method, data});
        }
    }
});

calcWorker.addEventListener("error", e => {throw e;});

calcWorker.addEventListener("message", e => {
    const method = e.data && e.data.method;
    if (method) {
        if (method === blockingMethod) {
            app.busy = false;
            blockingMethod = null;
        }
        worker.trigger(method, e.data.data);
    }
});

export default worker;