import app from "./app.js";
import utils from "./utils.js";
import _ from "_";

let templates = new Map();

app.busy = true;

utils.readFile("tpl/tpl.json").then(json => {
    let tpls = JSON.parse(json);
    let tplSettings = {variable: "data"};
    for (let name of Object.keys(tpls)) {
        templates.set(name, _.template(tpls[name], tplSettings));
    }
    app.busy = false;
});

export default {
    get: templates.get.bind(templates)
};