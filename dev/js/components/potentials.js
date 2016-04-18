import $ from "jquery";
import AbstractDialog from "./abstract-dialog.js";
import structure from "../structure.js";
import utils from "../utils.js";
import app from "../app.js";
import templates from "../templates.js";

let potentials = Object.assign(new AbstractDialog(".oe-potential-form"), {
    handleUpdateStructure(pairsUpdated) {
        if (pairsUpdated) {
            this.resetHTML();
        }
    },

    handleLoad(e) {
        utils.readFile(e.target.files[0]).then(contents => {
            let rows = contents.split(/\r?\n/);
            for (let row of rows) {
                let params = row.split("\t");
                this.$el.find(`li[data-pair="${params[0]}"] input`).val(idx => params[idx + 1] || "");
            }
        });
    },

    handleSave(e) {
        let text = this.$el.find("li[data-pair]")
            .map((idx, row) => {
                let $row = $(row);
                return $row.data("pair") + "\t" +
                    $row.find("input").map((idx, input) => input.value).get().join("\t");
            }).get().join("\n");
        e.target.href = utils.getBlobURL(text);
    },

    handleApply() {
        if (this.$el[0].checkValidity()) {
            return Object.getPrototypeOf(this).handleApply.apply(this, arguments);
        } else {
            window.alert("Please, fix invalid input first");
        }
    },

    resetHTML() {
        this.$el.find("ul.oe-potentials").html(templates.get("potentials")({pairs: structure.pairList}));
    },

    apply() {
        let potentials = new Map();
        this.$el.find("li[data-pair]").each((idx, row) => {
            let params = {};
            row = $(row);
            row.find("input[data-param]").each((idx, el) => {
                if (el.value) {
                    params[$(el).data("param")] = +el.value;
                } else {
                    return (params = false);
                }
            });
            if (params) {
                potentials.set(row.data("pair"), params);
            }
        });
        structure.setPotentials(potentials);
        this.fix();
    },

    discard() {
        this.reset();
    },

    show() {
        let atoms = structure.structure.atoms,
            pairs = new Set();
        for (let bond of structure.structure.bonds) {
            let prefix = (bond.type === "x") ? "x-" : "";
            let el1 = atoms[bond.iAtm].el;
            let el2 = atoms[bond.jAtm].el;
            // Add both variants AB and BA to simplify further search
            pairs.add(prefix + el1 + el2).add(prefix + el2 + el1);
        }
        this.$el.find("li[data-pair]").each((idx, row) => {
            row = $(row);
            row.toggleClass("missed", !pairs.has(row.data("pair")));
        });
        return Object.getPrototypeOf(this).show.apply(this, arguments);
    }
});

potentials.listen([
    {type: "updateStructure", owner: structure, handler: "handleUpdateStructure"},

    {type: "change", filter: ".load-potentials", handler: "handleLoad"},
    {type: "click", filter: ".save-potentials", handler: "handleSave"}
]);

export default potentials;

app.addAction("setup", {
    get enabled() {
        return structure.structure.atoms.length > 0;
    },
    exec() {
        potentials.show();
    }
});