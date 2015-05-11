(function (global) {

"use strict";

var fallback = {
        jQuery: "../vendor/jquery.min.js",
        THREE: "../vendor/three.min.js",
        _: "../vendor/underscore-min.js"
    },
    i;

for (i in fallback) {
    if (fallback.hasOwnProperty(i) && !global.hasOwnProperty(i)) {
        global.document.write("<script src='" + fallback[i] + "'><\/script>");
    }
}

})(this);