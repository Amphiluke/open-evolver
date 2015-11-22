(function (global) {

"use strict";

var blobStore,
    URL, createObjectURL, revokeObjectURL,
    txtFrame, imgFrame;

if ("download" in document.createElement("a")) {
    return;
}


/**
 * Here, we override the native methods `URL.createObjectURL` and `URL.revokeObjectURL` in order
 * to make the `download` attribute work with hyperlinks using blob urls, since it is hardly
 * possible to extract a blob type and contents from the previously constructed blob url string.
 * The `blobStore` is a hash which maps blob urls onto either the text contents of the corresponding
 * blob object, or, if it is an image, onto the string flag "\x00" (image contents makes no odds)
 */
blobStore = {};
URL = global.URL;
createObjectURL = URL.createObjectURL;
revokeObjectURL = URL.revokeObjectURL;
URL.createObjectURL = function (blob) {
    var result = createObjectURL.apply(this, arguments),
        type = blob.type,
        reader;
    if (type.indexOf("text/") === 0) {
        reader = new global.FileReader();
        reader.addEventListener("load", function (e) {
            blobStore[result] = e.target.result;
        });
        reader.readAsText(blob);
    } else if (type.indexOf("image/") === 0) {
        blobStore[result] = "\x00";
    }
    return result;
};
URL.revokeObjectURL = function (url) {
    if (blobStore.hasOwnProperty(url)) {
        delete blobStore[url];
    }
    return revokeObjectURL.apply(this, arguments);
};


/**
 * Helper frame elements are used to invoke the `execCommand` method in context of their
 * document objects. The `txtFrame` element is used to save text data, while the `imgFrame` element
 * is used to save images. A separate frame element special for images is required since it seems
 * that IE can only save a document as an image if the window location is an image file.
 * The contents of the frames is dynamically changed when a hyperlink having the `download` attribute
 * is clicked. Supported URI scheme list includes only "blob:" and "data:"
 */
txtFrame = document.createElement("iframe");
txtFrame.src = "about:blank";
imgFrame = document.createElement("iframe");
imgFrame.src = "src/img/dot.gif";
txtFrame.style.cssText = imgFrame.style.cssText = "position: absolute; top: -10000px; left: -10000px;";
document.body.appendChild(txtFrame);
document.body.appendChild(imgFrame);

function writeTxtDoc(text) {
    var doc = txtFrame.contentDocument;
    doc.open();
    doc.write(text);
    doc.close();
    return doc;
}
function writeImgDoc(src) {
    var doc = imgFrame.contentDocument;
    doc.getElementsByTagName("img")[0].src = src;
    return doc;
}

document.body.addEventListener("click", function (e) {
    // Defer for the case with `href` or `download` attribute changing on click
    setTimeout(function () {
        var target = e.target,
            href, doc;
        if ((target.nodeName.toLowerCase() === "a") && target.hasAttribute("download")) {
            href = target.getAttribute("href");
            if ((href.indexOf("blob:") === 0) && blobStore.hasOwnProperty(href)) {
                doc = (blobStore[href] === "\x00") ? writeImgDoc(href) : writeTxtDoc(blobStore[href]);
            } else if (href.indexOf("data:text/") === 0) {
                doc = writeTxtDoc(atob(href.replace(/^data:text\/\w+;base64,/, "")));
            } else if (href.indexOf("data:image/") === 0) {
                doc = writeImgDoc(href);
            } else {
                return;
            }
            setTimeout(function () {
                doc.execCommand("SaveAs", true, target.getAttribute("download"));
            }, 0);
            e.preventDefault();
        }
    }, 0);
}, false);

})(this);