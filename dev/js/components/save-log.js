import AbstractDialog from "./abstract-dialog.js";
import worker from "../worker.js";
import utils from "../utils.js";

let saveLog = Object.assign(new AbstractDialog(".oe-save-log-dialog"), {
    handleEvolveLog(data) {
        this.data = data;
        this.show();
    },

    handleSave(e) {
        let data = this.data,
            E = data.E,
            grad = data.grad,
            dt = data.dt,
            t = 0,
            dl = e.target.getAttribute("data-delimiter"),
            log = `t, ps${dl}E, eV${dl}||grad E||, eV/Å${dl}dt, fs`;
        for (let i = 0, len = E.length; i < len; i++) {
            log += "\n" + t.toExponential(4) + dl + E[i].toExponential(4) + dl +
                grad[i].toExponential(4) + dl + (dt[i] * 1E15).toExponential(4);
            t += dt[i] * 1E12;
        }
        e.target.href = utils.getBlobURL(log);
        this.hide();
        this.data = null;
    }
});

saveLog.listen([
    {type: "evolve:log", owner: worker, handler: "handleEvolveLog"},
    {type: "click", filter: "a[download]", handler: "handleSave"}
]);

export default saveLog;