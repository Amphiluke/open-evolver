import $ from "jquery";
import AbstractDialog from "./abstract-dialog.js";
import fileAPI from "../file-processing.js";
import app from "../app.js";
import structure from "../structure.js";
import utils from "../utils.js";

let save = Object.assign(new AbstractDialog(".oe-save-form"), {
    handleTypeChange(e) {
        this.$el.find(".type-description")
            .addClass("hidden")
            .filter(`[data-type="${e.target.value}"]`).removeClass("hidden");
    },

    handleSave(e) {
        let selected = $("#oe-file-type").find("option:selected"),
            type = selected.closest("optgroup").data("type"),
            graphType = selected.data("graph"),
            file = fileAPI.makeFile(type, graphType);
        if (file) {
            e.target.setAttribute("download", `untitled.${type}`);
            e.target.href = utils.getBlobURL(file);
        }
    }
});

save.listen([
    {type: "change", owner: "#oe-file-type", handler: "handleTypeChange"},
    {type: "click", filter: ".oe-apply", handler: "handleSave"}
]);

export default save;

app.addAction("save", {
    get enabled() {
        return structure.structure.atoms.length > 0;
    },
    exec() {
        save.show();
    }
});