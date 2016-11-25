import Observer from "./observer.js";
import $ from "jquery";

function to$(target) {
    return (target && target.jquery) ? target : $(target);
}

export default class {
    constructor($el) {
        this.$el = to$($el);
    }

    listen(config) {
        for (let {type, owner, filter, handler} of config) {
            let handlerFn = (typeof handler === "function") ? handler : this[handler];
            if (owner instanceof Observer) {
                // Events triggered on instances of the Observer class
                owner.on(type, handlerFn.bind(this));
            } else {
                // DOM events and custom events processed by jQuery
                to$(owner || this.$el).on(type, filter || null, handlerFn.bind(this));
            }
        }
    }
}