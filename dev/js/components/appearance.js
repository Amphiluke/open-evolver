import $ from "jquery";
import AbstractDialog from "./abstract-dialog.js";
import structure from "../structure.js";
import draw from "../draw.js";
import app from "../app.js";

let appearance = Object.assign(new AbstractDialog(".oe-appearance-form"), {
    handleUpdateStructure(rescanAtoms) {
        if (rescanAtoms) {
            $("#oe-appearance-element")
                .html("<option selected>" + structure.getAtomList().join("</option><option>") + "</option>");
            this.setCurrElementColor();
        }
    },

    handleColorChange(e) {
        let color = parseInt(e.target.value.slice(1), 16); // skip the leading # sign
        if (isNaN(color)) {
            return;
        }
        if (!this.tmpClrPresets) {
            this.tmpClrPresets = new Map();
        }
        // Store the value in a temporal map (it will be copied to view's presets if the dialog won't be discarded)
        this.tmpClrPresets.set($("#oe-appearance-element").val(), color);
    },

    apply() {
        draw.appearance = this.$el.find("input[name='appearance']:checked").data("appearance");
        draw.setBgColor($("#oe-bg-color").val());
        if (this.tmpClrPresets) {
            draw.setAtomColors(this.tmpClrPresets);
            this.tmpClrPresets = undefined;
        }
        draw.render();
        this.fix();
    },

    discard() {
        this.reset();
        this.tmpClrPresets = undefined;
        this.setCurrElementColor();
    },

    setCurrElementColor() {
        let el = $("#oe-appearance-element").val(),
            color;
        if (this.tmpClrPresets && (this.tmpClrPresets.has(el))) {
            color = this.tmpClrPresets.get(el);
        } else {
            color = draw.getAtomColor(el);
        }
        $("#oe-appearance-color").val("#" + ("000000" + color.toString(16)).slice(-6));
    }
});

appearance.listen([
    {type: "updateStructure", owner: structure, handler: "handleUpdateStructure"},

    {type: "change", owner: "#oe-appearance-element", handler: "setCurrElementColor"},
    {type: "change", owner: "#oe-appearance-color", handler: "handleColorChange"}
]);

export default appearance;

app.addAction("alterView", {
    get enabled() {
        return structure.structure.atoms.length > 0;
    },
    exec() {
        appearance.show();
    }
});