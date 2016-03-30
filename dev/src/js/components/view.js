import Eventful from "../eventful.js";
import app from "../app.js";
import draw from "../draw.js";

let view = Object.assign(new Eventful("#oe-view"), {
    rotData: {
        startX: 0,
        startRot: 0
    },

    handleACKClick(e) {
        if (e.target === e.delegateTarget) {
            e.target.className += " hidden";
        }
    },

    handleDragEnterOver(e) {
        e.preventDefault();
        if (e.type === "dragenter") {
            e.currentTarget.classList.add("oe-droppable");
        }
    },

    handleDragLeave(e) {
        e.preventDefault();
        if (e.target === e.currentTarget) { // skip event when fired by children
            e.target.classList.remove("oe-droppable");
        }
    },

    handleDrop(e) {
        let dt = e.originalEvent.dataTransfer,
            files = dt && dt.files;
        if (files && files.length) {
            e.preventDefault();
            app.execAction("load", files[0]);
        }
        e.currentTarget.classList.remove("oe-droppable");
    },

    handleWheelZoom(e) {
        draw.zoom((e.originalEvent.deltaY) < 0 ? 5 : -5);
        e.preventDefault();
    },

    handleStartRotate(e) {
        this.rotData.startX = e.pageX;
        this.rotData.startRot = draw.rotation;
        this.$el
            .on("mouseup.oeViewRotation mouseleave.oeViewRotation", this.handleStopRotate.bind(this))
            .on("mousemove.oeViewRotation", this.handleRotate.bind(this));
        draw.autoUpdate = true;
        draw.update();
    },

    handleStopRotate() {
        draw.autoUpdate = false;
        this.$el.off(".oeViewRotation");
    },

    handleRotate(e) {
        draw.rotation = this.rotData.startRot + (e.pageX - this.rotData.startX) * 0.02;
    }
});

view.listen([
    {type: "click", owner: ".oe-acknowledgements", handler: "handleACKClick"},
    {type: "dragenter dragover", handler: "handleDragEnterOver"},
    {type: "dragleave", handler: "handleDragLeave"},
    {type: "drop", handler: "handleDrop"},
    {type: "wheel", handler: "handleWheelZoom"},
    {type: "mousedown", handler: "handleStartRotate"}
]);

view.$el.append(draw.canvas);

export default view;