/**
 * A polyfill for Int8Array.prototype.indexOf() (mainly for IE)
 * The method is used in view.js
 */
(function () {

"use strict";

if ("indexOf" in Int8Array.prototype) {
    return;
}

Object.defineProperty(Int8Array.prototype, "indexOf", {
    configurable: true,
    enumerable: false,
    writable: true,
    value: function (searchElement, fromIndex) {
        var len = this.length;
        if (fromIndex === undefined) {
            fromIndex = 0;
        } else if (fromIndex < 0) {
            fromIndex += len;
        }
        for (; fromIndex < len; fromIndex++) {
            if (this[fromIndex] === searchElement) {
                return fromIndex;
            }
        }
        return -1;
    }
});

})();