import AbstractDialog from "./abstract-dialog.js";
import worker from "../worker.js";
import utils from "../utils.js";
import app from "../app.js";
import structure from "../structure.js";
import templates from "../templates.js";

function nodeVisitor(name, node) {
    if (node instanceof Map) {
        let result = Object.create(null);
        for (let [key, value] of node) {
            result[key] = value;
        }
        return result;
    }
    return node;
}

let saveSummary = Object.assign(new AbstractDialog(".oe-save-summary-form"), {
    data: null,

    handleCollectStats(data) {
        this.data = data;
        this.show();
    },

    handleSave(e) {
        if (this.data) {
            let type = e.target.getAttribute("data-type"),
                text;
            switch (type) {
                case "text/html":
                    text = templates.get("summary")(this.data);
                    break;
                case "application/json":
                    text = JSON.stringify(this.data, nodeVisitor, 2);
                    break;
                default:
                    text = "TBD";
                    break;
            }
            e.target.href = utils.getBlobURL(text, type);
            this.hide();
        }
    }
});

saveSummary.listen([
    {type: "collectStats", owner: worker, handler: "handleCollectStats"},
    {type: "click", filter: "a[download]", handler: "handleSave"}
]);

export default saveSummary;

app.addAction("saveSummary", {
    get enabled() {
        return structure.structure.potentials.size > 0;
    },
    exec() {
        worker.invoke("collectStats");
    }
});