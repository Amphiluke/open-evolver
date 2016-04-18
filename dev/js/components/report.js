import $ from "jquery";
import AbstractDialog from "./abstract-dialog.js";
import app from "../app.js";
import worker from "../worker.js";
import templates from "../templates.js";

let report = Object.assign(new AbstractDialog(".oe-report"), {
    handleGlobalKeyUp: $.noop, // override the inherited behavior hiding the dialog on Esc key press

    print(data) {
        this.updateProgress(100);
        $("#oe-report-data").html(templates.get("report")({energy: data.energy, grad: data.norm}));
    },

    updateProgress(value) {
        $("#oe-report-progress").attr("value", value);
    }
});

report.listen([
    {type: "app:structure:loaded", owner: app, handler: "hide"},
    {type: "evolve:progress", owner: worker, handler: "updateProgress"}
]);

export default report;