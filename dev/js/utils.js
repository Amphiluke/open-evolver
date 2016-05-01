import app from "./app.js";

let blobUrl;

let utils = {
    atomicMasses: {},

    /**
     * Read a file
     * @param {String|Object} ref File reference - either a path, or a file object (or Blob)
     * @returns {Promise}
     */
    readFile(ref) {
        return new Promise((resolve, reject) => {
            if (typeof ref === "string") { // file path was passed
                let xhr = new XMLHttpRequest();
                xhr.open("GET", ref, true);
                xhr.addEventListener("load", () => {
                    if (xhr.status === 200) {
                        resolve(xhr.responseText);
                    }
                });
                xhr.addEventListener("error", () => reject(xhr.status));
                xhr.send(null);
            } else { // file object or blob was passed
                let reader = new FileReader();
                reader.addEventListener("load", () => resolve(reader.result));
                reader.addEventListener("error", () => reject(reader.error));
                reader.readAsText(ref);
            }
        });
    },

    getBlobURL(data, type = "text/plain") {
        let blob = (data instanceof Blob) ? data : new Blob([data], {type});
        if (blobUrl) {
            // Blob URLs are used only short periods of time (e.g. at the moment a hyperlink is clicked).
            // So, revoke the previous URL before creating the new one.
            URL.revokeObjectURL(blobUrl);
        }
        blobUrl = URL.createObjectURL(blob);
        return blobUrl;
    }
};

export default utils;

app.busy = true;
utils.readFile("lib.json").then(libText => {
    let lib = JSON.parse(libText);
    utils.atomicMasses = Object.freeze(lib.atomicMasses);
    app.busy = false;
});