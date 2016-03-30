import AbstractDialog from "./abstract-dialog.js";
import worker from "../worker.js";
import structure from "../structure.js";
import app from "../app.js";
import templates from "../templates.js";

let info = Object.assign(new AbstractDialog(".oe-info-dialog"), {
    handleTotalEnergy(data) {
        this.applyTpl("energy", {
            energy: data,
            bonds: structure.structure.bonds.length
        });
        this.show();
    },

    handleGradient(data) {
        this.applyTpl("gradient", {grad: data});
        this.show();
    },

    applyTpl(tpl, data) {
        this.$el.find(".oe-info-dialog-text").html(templates.get(tpl)(data));
    }
});

info.listen([
    {type: "totalEnergy", owner: worker, handler: "handleTotalEnergy"},
    {type: "gradient", owner: worker, handler: "handleGradient"}
]);

export default info;

app.addAction("calcEnergy", {
    get enabled() {
        return structure.structure.potentials.size > 0;
    },
    exec() {
        worker.invoke("totalEnergy");
    }
});

app.addAction("calcGrad", {
    get enabled() {
        return structure.structure.potentials.size > 0;
    },
    exec() {
        worker.invoke("gradient");
    }
});