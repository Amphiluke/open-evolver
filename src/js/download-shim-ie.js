(function () {

"use strict";

var txtFrame,
    imgFrame;

if ("download" in document.createElement("a")) {
    return;
}

txtFrame = document.createElement("iframe");
txtFrame.src = "about:blank";
imgFrame = document.createElement("iframe");
imgFrame.src = "src/img/dot.gif";
txtFrame.style.cssText = imgFrame.style.cssText = "position: absolute; top: -10000px; left: -10000px;";
document.body.appendChild(txtFrame);
document.body.appendChild(imgFrame);

document.body.addEventListener("click", function (e) {
    var target = e.target,
        href, doc;
    if ((target.nodeName.toLowerCase() === "a") && target.hasAttribute("download")) {
        href = target.getAttribute("href");
        if (href.indexOf("data:text/plain;base64,") === 0) {
            doc = txtFrame.contentDocument;
            doc.write(atob(href.slice(23)));
        } else if (href.indexOf("data:image/") === 0) {
            doc = imgFrame.contentDocument;
            doc.getElementsByTagName("img")[0].src = href;
        } else {
            return;
        }
        setTimeout(function () {
            doc.execCommand("SaveAs", true, target.getAttribute("download"));
        }, 0);
        e.preventDefault();
    }
}, false);

})();