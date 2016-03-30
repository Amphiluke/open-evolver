import $ from "jquery";
import Eventful from "../eventful.js";
import app from "../app.js";
import fileAPI from "../file-processing.js";

let disabled;

let menu = Object.assign(new Eventful(".oe-menu"), {
    handleAppStateChange(busy) {
        this.disabled = busy;
    },

    handleGlobalClick(e) {
        if (this.disabled) {
            return;
        }
        let $target = $(e.target);
        let $popups = this.$el.find("menu.expanded");
        if ($target.is(".oe-menu button[menu]")) {
            let $targetPopup = $("#" + $target.attr("menu")).toggleClass("expanded");
            if ($targetPopup.hasClass("expanded")) {
                this.setItemStates();
            }
            $popups = $popups.not($targetPopup);
        }
        $popups.removeClass("expanded");
    },

    handleHover(e) {
        if (this.disabled) {
            return;
        }
        let $expandedMenu = this.$el.find("menu.expanded");
        if ($expandedMenu.length) {
            let $targetMenu = $(e.target).siblings("menu");
            if (!$expandedMenu.is($targetMenu)) {
                $expandedMenu.removeClass("expanded");
                $targetMenu.addClass("expanded");
            }
        }
    },

    handleAction(e) {
        let action = $(e.target).data("action");
        if (action === "load") { // the action "load" requires a file to be specified
            $("#oe-file").trigger("click");
        } else {
            app.execAction(action);
        }
    },

    handleFile(e) {
        app.execAction("load", e.target.files[0]);
    },

    setItemStates(action) {
        let $items = this.$el.find("menuitem[data-action]");
        if (action) {
            $items = $items.filter(`[data-action="${action}"]`);
        }
        let actionStates = app.getActionStates();
        $items.each((idx, item) => {
            let state = actionStates.get(item.getAttribute("data-action")),
                disabled = item.hasAttribute("disabled");
            if (state && disabled) {
                item.removeAttribute("disabled");
            } else if (!state && !disabled) {
                item.setAttribute("disabled", "disabled");
            }
        });
    }
});

Object.defineProperty(menu, "disabled", {
    enumerable: true,
    get() {
        return disabled;
    },
    set(state) {
        disabled = !!state;
        this.$el.toggleClass("oe-disabled", !!disabled);
        if (disabled) {
            this.$el.find("menu.expanded").removeClass("expanded");
        }
    }
});

menu.listen([
    {type: "app:stateChange", owner: app, handler: "handleAppStateChange"},

    {type: "click", owner: document, handler: "handleGlobalClick"},
    {type: "mouseenter", owner: ".oe-menu", filter: "button[menu]", handler: "handleHover"},
    {type: "click", owner: ".oe-menu", filter: "menuitem[data-action]", handler: "handleAction"},
    {type: "change", owner: "#oe-file", handler: "handleFile"}
]);

menu.disabled = app.busy;

export default menu;

app.addAction("load", {
    get enabled() {
        return true;
    },
    exec(file) {
        if (file) {
            fileAPI.load(file);
        }
    }
});