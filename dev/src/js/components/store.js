import $ from "jquery";
import AbstractDialog from "./abstract-dialog.js";
import app from "../app.js";
import templates from "../templates.js";

let store = Object.assign(new AbstractDialog(".oe-store-form"), {
    handleSelect(e) {
        $(e.delegateTarget).children(".active").removeClass("active");
        $(e.currentTarget).addClass("active");
    },

    show() {
        if (!this.loaded) {
            let $list = this.$el.find(".oe-store-list");
            $list.addClass("oe-store-list-loading");
            $.getJSON("../store/info.json")
                .done(data => this.resetHTML(data))
                .fail(() => this.resetHTML())
                .always(() => $list.removeClass("oe-store-list-loading"));
            this.loaded = true;
        }
        return super.show();
    },

    apply() {
        let path = this.$el.find(".active[data-path]").data("path");
        if (path) {
            app.execAction("load", `../store/${path}`);
        }
    },

    resetHTML(data) {
        let hasData = data && data.length,
            html = hasData ? templates.get("store")({records: data}) : "<li>Data is empty or couldn't be loaded</li>";
        this.$el.find(".oe-store-list").html(html);
        this.$el.find(".oe-apply").prop("disabled", !hasData);
    }
});

store.listen([
    {type: "click", owner: ".oe-store-list", filter: "li[data-path]", handler: "handleSelect"},
    {type: "dblclick", owner: ".oe-store-list", filter: "li[data-path]", handler: "handleApply"}
]);

export default store;

app.addAction("openStore", {
    get enabled() {
        return true;
    },
    exec() {
        store.show();
    }
});