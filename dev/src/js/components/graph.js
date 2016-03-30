import $ from "jquery";
import AbstractDialog from "./abstract-dialog.js";
import structure from "../structure.js";
import worker from "../worker.js";
import app from "../app.js";
import templates from "../templates.js";

let graph = Object.assign(new AbstractDialog(".oe-graph-form"), {
    handleUpdateStructure(pairsUpdated) {
        if (pairsUpdated) {
            this.resetHTML();
        }
    },

    handlePairSelect(e) {
        let $target = $(e.target);
        $(e.delegateTarget).find(".oe-cutoff").not($target).removeClass("active");
        $target.addClass("active");
        let cutoff = $target.text().trim();
        $("#oe-cutoff-exact").val(cutoff).get(0).select();
        $(".oe-cutoff-slider").val(this.cutoff2Slider(+cutoff).toFixed(2));
    },

    handleSliderChange(e) {
        let cutoff = this.slider2Cutoff(+e.target.value);
        $("#oe-cutoff-exact").val(cutoff.toFixed(4)).trigger("input");
        this.updateGraph($(".oe-cutoff.active").data("pair"), cutoff);
    },

    handleCutoffInput(e) {
        $(".oe-cutoff.active").text(e.target.value);
    },

    handleCutoffChange(e) {
        if (e.target.checkValidity()) {
            $(".oe-cutoff-slider").val(this.cutoff2Slider(+e.target.value).toFixed(2));
            this.updateGraph($(".oe-cutoff.active").data("pair"), +e.target.value);
        }
    },

    cutoff2Slider(cutoff) {
        let slider = $(".oe-cutoff-slider")[0],
            minBound = +$("#oe-cutoff-min").val(),
            maxBound = +$("#oe-cutoff-max").val(),
            min = +slider.min,
            max = +slider.max;
        return min + (cutoff - minBound) * (max - min) / (maxBound - minBound);
    },

    slider2Cutoff(value) {
        let slider = $(".oe-cutoff-slider")[0],
            minBound = +$("#oe-cutoff-min").val(),
            maxBound = +$("#oe-cutoff-max").val(),
            min = +slider.min,
            max = +slider.max;
        return minBound + (value - min) * (maxBound - minBound) / (max - min);
    },

    resetHTML() {
        let pairList = structure.pairList;
        this.$el.find(".oe-cutoffs")
            .html(templates.get("cutoffs")({pairs: pairList.slice(0, pairList.length / 2)}))
            .find(".oe-cutoff").eq(0).addClass("active");
    },

    updateGraph(pair, cutoff) {
        worker.invoke("reconnectPairs", {pair, cutoff});
    }
});

graph.listen([
    {type: "updateStructure", owner: structure, handler: "handleUpdateStructure"},

    {type: "click", filter: ".oe-cutoffs .oe-cutoff", handler: "handlePairSelect"},
    {type: "change", filter: ".oe-cutoff-slider", handler: "handleSliderChange"},
    {type: "input", owner: "#oe-cutoff-exact", handler: "handleCutoffInput"},
    {type: "change", owner: "#oe-cutoff-exact", handler: "handleCutoffChange"}
]);

export default graph;

app.addAction("alterGraph", {
    get enabled() {
        return structure.structure.atoms.length > 0;
    },
    exec() {
        graph.show();
    }
});