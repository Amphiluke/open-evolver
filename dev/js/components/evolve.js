import $ from "jquery";
import AbstractDialog from "./abstract-dialog.js";
import worker from "../worker.js";
import report from "./report.js";
import app from "../app.js";
import structure from "../structure.js";

let evolve = Object.assign(new AbstractDialog(".oe-evolve-form"), {
    handleEvolveStop(data) {
        report.print(data);
    },

    handleApply() {
        if (this.$el[0].checkValidity()) {
            return Object.getPrototypeOf(this).handleApply.apply(this, arguments);
        } else {
            window.alert("Please, fix invalid input first");
        }
    },

    handleKeepLogChange(e) {
        $("#oe-log-interval").prop("disabled", !e.target.checked).val("0");
    },

    apply() {
        this.fix();
        worker.invoke("evolve", {
            stepCount: +$("#oe-step-count").val(),
            temperature: +$("#oe-temperature").val(),
            stoch: $("#oe-stoch").prop("checked"),
            logInterval: +$("#oe-log-interval").val()
        });
        report.show();
    },

    discard() {
        this.reset();
    }
});

evolve.listen([
    {type: "evolve", owner: worker, handler: "handleEvolveStop"},
    {type: "change", owner: "#oe-keep-log", handler: "handleKeepLogChange"}
]);

export default evolve;

app.addAction("evolve", {
    get enabled() {
        return structure.structure.potentials.size > 0;
    },
    exec() {
        evolve.show();
    }
});