import structure from "./structure.js";
import app from "./app.js";
import "./components/store.js";
import "./components/save.js";
import "./components/save-summary.js";
import "./components/graph.js";
import "./components/potentials.js";
import "./components/transform.js";
import "./components/report.js";
import "./components/evolve.js";
import "./components/save-log.js";
import "./components/appearance.js";
import "./components/info.js";
import "./components/menu.js";
import "./components/view.js";


structure.on("app:structure:loaded", () => {
    document.title = `${structure.structure.name} - Open evolver`;
});

app.on("app:stateChange", busy => {
    document.body.classList.toggle("app-busy", busy);
});