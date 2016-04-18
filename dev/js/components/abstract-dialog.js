import Eventful from "../eventful.js";

// We cannot use methods of AbstractDialog as direct event handlers because instances should have a chance
// to override those methods and implement their custom behavior. Therefore handlers are just anonymous functions
// which call corresponding methods (either inherited or own) on instances
let events = [
    {type: "click", filter: ".oe-apply", handler(...params) { this.handleApply(...params); }},
    {type: "click", filter: ".oe-discard", handler(...params) { this.handleDiscard(...params); }},
    {type: "keyup", owner: document, handler(...params) { this.handleGlobalKeyUp(...params); }}
];

export default class extends Eventful {
    constructor($el) {
        super($el);
        this.listen(events);
    }

    handleApply() {
        this.apply();
        this.hide();
    }

    handleDiscard() {
        this.discard();
        this.hide();
    }

    handleGlobalKeyUp(e) {
        if (e.which === 27) {
            this.discard();
            this.hide();
        }
    }

    apply() {}

    discard() {}

    show() {
        this.$el.removeClass("hidden");
    }

    hide() {
        this.$el.addClass("hidden");
    }

    fix(fields) {
        if (!fields) {
            fields = this.$el[0].elements; // `this.$el` should be a form, otherwise the `fix` method is useless
        }
        for (let field of Array.from(fields)) {
            // Setting the `defaultValue`/`defaultChecked`/`defaultSelected` prop allows using
            // `form.reset()` on possible future discards (see the `reset()` method)
            if (field.type === "checkbox" || field.type === "radio") {
                field.defaultChecked = field.checked;
            } else if (field.nodeName.toUpperCase() === "OPTION") {
                field.defaultSelected = field.selected;
            } else if ("defaultValue" in field) {
                field.defaultValue = field.value;
            } else if (field.options) { // selects
                this.fix(field.options);
            }
        }
    }

    reset() {
        this.$el[0].reset(); // `this.$el` should be a form, otherwise the `reset` method is useless
    }
}