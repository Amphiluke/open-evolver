"bundle";
(function() {
var define = System.amdDefine;
define("components/store.amd.js", ["exports", "jquery", "./abstract-dialog.amd.js", "../app.amd.js", "../templates.amd.js"], function(exports, _jquery, _abstractDialogAmd, _appAmd, _templatesAmd) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  var _jquery2 = _interopRequireDefault(_jquery);
  var _abstractDialogAmd2 = _interopRequireDefault(_abstractDialogAmd);
  var _appAmd2 = _interopRequireDefault(_appAmd);
  var _templatesAmd2 = _interopRequireDefault(_templatesAmd);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  let store = Object.assign(new _abstractDialogAmd2.default(".oe-store-form"), {
    handleSelect(e) {
      (0, _jquery2.default)(e.delegateTarget).children(".active").removeClass("active");
      (0, _jquery2.default)(e.currentTarget).addClass("active");
    },
    show() {
      if (!this.loaded) {
        let $list = this.$el.find(".oe-store-list");
        $list.addClass("oe-store-list-loading");
        _jquery2.default.getJSON("../store/info.json").done((data) => this.resetHTML(data)).fail(() => this.resetHTML()).always(() => $list.removeClass("oe-store-list-loading"));
        this.loaded = true;
      }
      return super.show();
    },
    apply() {
      let path = this.$el.find(".active[data-path]").data("path");
      if (path) {
        _appAmd2.default.execAction("load", `../store/${path}`);
      }
    },
    resetHTML(data) {
      let hasData = data && data.length,
          html = hasData ? _templatesAmd2.default.get("store")({records: data}) : "<li>Data is empty or couldn't be loaded</li>";
      this.$el.find(".oe-store-list").html(html);
      this.$el.find(".oe-apply").prop("disabled", !hasData);
    }
  });
  store.listen([{
    type: "click",
    owner: ".oe-store-list",
    filter: "li[data-path]",
    handler: "handleSelect"
  }, {
    type: "dblclick",
    owner: ".oe-store-list",
    filter: "li[data-path]",
    handler: "handleApply"
  }]);
  exports.default = store;
  _appAmd2.default.addAction("openStore", {
    get enabled() {
      return true;
    },
    exec() {
      store.show();
    }
  });
});

})();
(function() {
var define = System.amdDefine;
define("components/save.amd.js", ["exports", "jquery", "./abstract-dialog.amd.js", "../file-processing.amd.js", "../app.amd.js", "../structure.amd.js", "../utils.amd.js"], function(exports, _jquery, _abstractDialogAmd, _fileProcessingAmd, _appAmd, _structureAmd, _utilsAmd) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  var _jquery2 = _interopRequireDefault(_jquery);
  var _abstractDialogAmd2 = _interopRequireDefault(_abstractDialogAmd);
  var _fileProcessingAmd2 = _interopRequireDefault(_fileProcessingAmd);
  var _appAmd2 = _interopRequireDefault(_appAmd);
  var _structureAmd2 = _interopRequireDefault(_structureAmd);
  var _utilsAmd2 = _interopRequireDefault(_utilsAmd);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  let save = Object.assign(new _abstractDialogAmd2.default(".oe-save-form"), {
    handleTypeChange(e) {
      this.$el.find(".type-description").addClass("hidden").filter(`[data-type="${e.target.value}"]`).removeClass("hidden");
    },
    handleSave(e) {
      let selected = (0, _jquery2.default)("#oe-file-type").find("option:selected"),
          type = selected.closest("optgroup").data("type"),
          graphType = selected.data("graph"),
          file = _fileProcessingAmd2.default.makeFile(type, graphType);
      if (file) {
        e.target.setAttribute("download", `untitled.${type}`);
        e.target.href = _utilsAmd2.default.getBlobURL(file);
      }
    }
  });
  save.listen([{
    type: "change",
    owner: "#oe-file-type",
    handler: "handleTypeChange"
  }, {
    type: "click",
    filter: ".oe-apply",
    handler: "handleSave"
  }]);
  exports.default = save;
  _appAmd2.default.addAction("save", {
    get enabled() {
      return _structureAmd2.default.structure.atoms.length > 0;
    },
    exec() {
      save.show();
    }
  });
});

})();
(function() {
var define = System.amdDefine;
define("components/save-summary.amd.js", ["exports", "./abstract-dialog.amd.js", "../worker.amd.js", "../utils.amd.js", "../app.amd.js", "../structure.amd.js", "../templates.amd.js"], function(exports, _abstractDialogAmd, _workerAmd, _utilsAmd, _appAmd, _structureAmd, _templatesAmd) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  var _abstractDialogAmd2 = _interopRequireDefault(_abstractDialogAmd);
  var _workerAmd2 = _interopRequireDefault(_workerAmd);
  var _utilsAmd2 = _interopRequireDefault(_utilsAmd);
  var _appAmd2 = _interopRequireDefault(_appAmd);
  var _structureAmd2 = _interopRequireDefault(_structureAmd);
  var _templatesAmd2 = _interopRequireDefault(_templatesAmd);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  let saveSummary = Object.assign(new _abstractDialogAmd2.default(".oe-save-summary-form"), {
    data: null,
    handleCollectStats(data) {
      this.data = data;
      this.show();
    },
    handleSave(e) {
      if (this.data) {
        let type = e.target.getAttribute("data-type"),
            text;
        switch (type) {
          case "text/html":
            text = _templatesAmd2.default.get("summary")(this.data);
            break;
          case "application/json":
            text = JSON.stringify(this.data, null, 2);
            break;
          default:
            text = "TBD";
            break;
        }
        e.target.href = _utilsAmd2.default.getBlobURL(text, type);
        this.hide();
      }
    }
  });
  saveSummary.listen([{
    type: "collectStats",
    owner: _workerAmd2.default,
    handler: "handleCollectStats"
  }, {
    type: "click",
    filter: "a[download]",
    handler: "handleSave"
  }]);
  exports.default = saveSummary;
  _appAmd2.default.addAction("saveSummary", {
    get enabled() {
      return _structureAmd2.default.structure.potentials.size > 0;
    },
    exec() {
      _workerAmd2.default.invoke("collectStats");
    }
  });
});

})();
(function() {
var define = System.amdDefine;
define("components/graph.amd.js", ["exports", "jquery", "./abstract-dialog.amd.js", "../structure.amd.js", "../worker.amd.js", "../app.amd.js", "../templates.amd.js"], function(exports, _jquery, _abstractDialogAmd, _structureAmd, _workerAmd, _appAmd, _templatesAmd) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  var _jquery2 = _interopRequireDefault(_jquery);
  var _abstractDialogAmd2 = _interopRequireDefault(_abstractDialogAmd);
  var _structureAmd2 = _interopRequireDefault(_structureAmd);
  var _workerAmd2 = _interopRequireDefault(_workerAmd);
  var _appAmd2 = _interopRequireDefault(_appAmd);
  var _templatesAmd2 = _interopRequireDefault(_templatesAmd);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  let graph = Object.assign(new _abstractDialogAmd2.default(".oe-graph-form"), {
    handleUpdateStructure(pairsUpdated) {
      if (pairsUpdated) {
        this.resetHTML();
      }
    },
    handlePairSelect(e) {
      let $target = (0, _jquery2.default)(e.target);
      (0, _jquery2.default)(e.delegateTarget).find(".oe-cutoff").not($target).removeClass("active");
      $target.addClass("active");
      let cutoff = $target.text().trim();
      (0, _jquery2.default)("#oe-cutoff-exact").val(cutoff).get(0).select();
      (0, _jquery2.default)(".oe-cutoff-slider").val(this.cutoff2Slider(+cutoff).toFixed(2));
    },
    handleSliderChange(e) {
      let cutoff = this.slider2Cutoff(+e.target.value);
      (0, _jquery2.default)("#oe-cutoff-exact").val(cutoff.toFixed(4)).trigger("input");
      this.updateGraph((0, _jquery2.default)(".oe-cutoff.active").data("pair"), cutoff);
    },
    handleCutoffInput(e) {
      (0, _jquery2.default)(".oe-cutoff.active").text(e.target.value);
    },
    handleCutoffChange(e) {
      if (e.target.checkValidity()) {
        (0, _jquery2.default)(".oe-cutoff-slider").val(this.cutoff2Slider(+e.target.value).toFixed(2));
        this.updateGraph((0, _jquery2.default)(".oe-cutoff.active").data("pair"), +e.target.value);
      }
    },
    cutoff2Slider(cutoff) {
      let slider = (0, _jquery2.default)(".oe-cutoff-slider")[0],
          minBound = +(0, _jquery2.default)("#oe-cutoff-min").val(),
          maxBound = +(0, _jquery2.default)("#oe-cutoff-max").val(),
          min = +slider.min,
          max = +slider.max;
      return min + (cutoff - minBound) * (max - min) / (maxBound - minBound);
    },
    slider2Cutoff(value) {
      let slider = (0, _jquery2.default)(".oe-cutoff-slider")[0],
          minBound = +(0, _jquery2.default)("#oe-cutoff-min").val(),
          maxBound = +(0, _jquery2.default)("#oe-cutoff-max").val(),
          min = +slider.min,
          max = +slider.max;
      return minBound + (value - min) * (maxBound - minBound) / (max - min);
    },
    resetHTML() {
      let pairList = _structureAmd2.default.pairList;
      this.$el.find(".oe-cutoffs").html(_templatesAmd2.default.get("cutoffs")({pairs: pairList.slice(0, pairList.length / 2)})).find(".oe-cutoff").eq(0).addClass("active");
    },
    updateGraph(pair, cutoff) {
      _workerAmd2.default.invoke("reconnectPairs", {
        pair,
        cutoff
      });
    }
  });
  graph.listen([{
    type: "updateStructure",
    owner: _structureAmd2.default,
    handler: "handleUpdateStructure"
  }, {
    type: "click",
    filter: ".oe-cutoffs .oe-cutoff",
    handler: "handlePairSelect"
  }, {
    type: "change",
    filter: ".oe-cutoff-slider",
    handler: "handleSliderChange"
  }, {
    type: "input",
    owner: "#oe-cutoff-exact",
    handler: "handleCutoffInput"
  }, {
    type: "change",
    owner: "#oe-cutoff-exact",
    handler: "handleCutoffChange"
  }]);
  exports.default = graph;
  _appAmd2.default.addAction("alterGraph", {
    get enabled() {
      return _structureAmd2.default.structure.atoms.length > 0;
    },
    exec() {
      graph.show();
    }
  });
});

})();
(function() {
var define = System.amdDefine;
define("components/potentials.amd.js", ["exports", "jquery", "./abstract-dialog.amd.js", "../structure.amd.js", "../utils.amd.js", "../app.amd.js", "../templates.amd.js"], function(exports, _jquery, _abstractDialogAmd, _structureAmd, _utilsAmd, _appAmd, _templatesAmd) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  var _jquery2 = _interopRequireDefault(_jquery);
  var _abstractDialogAmd2 = _interopRequireDefault(_abstractDialogAmd);
  var _structureAmd2 = _interopRequireDefault(_structureAmd);
  var _utilsAmd2 = _interopRequireDefault(_utilsAmd);
  var _appAmd2 = _interopRequireDefault(_appAmd);
  var _templatesAmd2 = _interopRequireDefault(_templatesAmd);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  let potentials = Object.assign(new _abstractDialogAmd2.default(".oe-potential-form"), {
    handleUpdateStructure(pairsUpdated) {
      if (pairsUpdated) {
        this.resetHTML();
      }
    },
    handleLoad(e) {
      _utilsAmd2.default.readFile(e.target.files[0]).then((contents) => {
        let rows = contents.split(/\r?\n/);
        for (let row of rows) {
          let params = row.split("\t");
          this.$el.find(`li[data-pair="${params[0]}"] input`).val((idx) => params[idx + 1] || "");
        }
      });
    },
    handleSave(e) {
      let text = this.$el.find("li[data-pair]").map((idx, row) => {
        let $row = (0, _jquery2.default)(row);
        return $row.data("pair") + "\t" + $row.find("input").map((idx, input) => input.value).get().join("\t");
      }).get().join("\n");
      e.target.href = _utilsAmd2.default.getBlobURL(text);
    },
    handleApply() {
      if (this.$el[0].checkValidity()) {
        return Object.getPrototypeOf(this).handleApply.apply(this, arguments);
      } else {
        window.alert("Please, fix invalid input first");
      }
    },
    resetHTML() {
      this.$el.find("ul.oe-potentials").html(_templatesAmd2.default.get("potentials")({pairs: _structureAmd2.default.pairList}));
    },
    apply() {
      let potentials = new Map();
      this.$el.find("li[data-pair]").each((idx, row) => {
        let params = {};
        row = (0, _jquery2.default)(row);
        row.find("input[data-param]").each((idx, el) => {
          if (el.value) {
            params[(0, _jquery2.default)(el).data("param")] = +el.value;
          } else {
            return params = false;
          }
        });
        if (params) {
          potentials.set(row.data("pair"), params);
        }
      });
      _structureAmd2.default.setPotentials(potentials);
      this.fix();
    },
    discard() {
      this.reset();
    },
    show() {
      let atoms = _structureAmd2.default.structure.atoms,
          pairs = new Set();
      for (let bond of _structureAmd2.default.structure.bonds) {
        let prefix = bond.type === "x" ? "x-" : "";
        let el1 = atoms[bond.iAtm].el;
        let el2 = atoms[bond.jAtm].el;
        pairs.add(prefix + el1 + el2).add(prefix + el2 + el1);
      }
      this.$el.find("li[data-pair]").each((idx, row) => {
        row = (0, _jquery2.default)(row);
        row.toggleClass("missed", !pairs.has(row.data("pair")));
      });
      return Object.getPrototypeOf(this).show.apply(this, arguments);
    }
  });
  potentials.listen([{
    type: "updateStructure",
    owner: _structureAmd2.default,
    handler: "handleUpdateStructure"
  }, {
    type: "change",
    filter: ".load-potentials",
    handler: "handleLoad"
  }, {
    type: "click",
    filter: ".save-potentials",
    handler: "handleSave"
  }]);
  exports.default = potentials;
  _appAmd2.default.addAction("setup", {
    get enabled() {
      return _structureAmd2.default.structure.atoms.length > 0;
    },
    exec() {
      potentials.show();
    }
  });
});

})();
(function() {
var define = System.amdDefine;
define("components/transform.amd.js", ["exports", "jquery", "./abstract-dialog.amd.js", "../app.amd.js", "../structure.amd.js", "../draw.amd.js"], function(exports, _jquery, _abstractDialogAmd, _appAmd, _structureAmd, _drawAmd) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  var _jquery2 = _interopRequireDefault(_jquery);
  var _abstractDialogAmd2 = _interopRequireDefault(_abstractDialogAmd);
  var _appAmd2 = _interopRequireDefault(_appAmd);
  var _structureAmd2 = _interopRequireDefault(_structureAmd);
  var _drawAmd2 = _interopRequireDefault(_drawAmd);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  let transform = Object.assign(new _abstractDialogAmd2.default(".oe-transform-form"), {
    handleAppStateChange(busy) {
      this.$el.find("fieldset").prop("disabled", busy);
    },
    handleTranslate() {
      let $fieldSet = this.$el.find(".oe-translate"),
          x = +$fieldSet.find("[data-axis='x']").val(),
          y = +$fieldSet.find("[data-axis='y']").val(),
          z = +$fieldSet.find("[data-axis='z']").val();
      _structureAmd2.default.translate(x, y, z);
    },
    handleRotate(e) {
      let angle = (0, _jquery2.default)("#oe-rotate-angle").val() * Math.PI / 180,
          axis = e.target.getAttribute("data-axis");
      _structureAmd2.default.rotate(angle, axis);
    },
    show() {
      let center = _structureAmd2.default.getCenterOfMass();
      let $fields = this.$el.find(".oe-translate input[data-axis]");
      $fields.val((idx) => center[$fields.eq(idx).data("axis")].toFixed(5));
      _drawAmd2.default.addAxes();
      return Object.getPrototypeOf(this).show.apply(this, arguments);
    },
    hide() {
      _drawAmd2.default.removeAxes();
      return Object.getPrototypeOf(this).hide.apply(this, arguments);
    }
  });
  transform.listen([{
    type: "app:stateChange",
    owner: _appAmd2.default,
    handler: "handleAppStateChange"
  }, {
    type: "click",
    owner: "#oe-translate-apply",
    handler: "handleTranslate"
  }, {
    type: "click",
    filter: ".oe-rotate [data-axis]",
    handler: "handleRotate"
  }]);
  exports.default = transform;
  _appAmd2.default.addAction("transform", {
    get enabled() {
      return _structureAmd2.default.structure.atoms.length > 0;
    },
    exec() {
      transform.show();
    }
  });
});

})();
(function() {
var define = System.amdDefine;
define("components/report.amd.js", ["exports", "jquery", "./abstract-dialog.amd.js", "../app.amd.js", "../worker.amd.js", "../templates.amd.js"], function(exports, _jquery, _abstractDialogAmd, _appAmd, _workerAmd, _templatesAmd) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  var _jquery2 = _interopRequireDefault(_jquery);
  var _abstractDialogAmd2 = _interopRequireDefault(_abstractDialogAmd);
  var _appAmd2 = _interopRequireDefault(_appAmd);
  var _workerAmd2 = _interopRequireDefault(_workerAmd);
  var _templatesAmd2 = _interopRequireDefault(_templatesAmd);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  let report = Object.assign(new _abstractDialogAmd2.default(".oe-report"), {
    handleGlobalKeyUp: _jquery2.default.noop,
    print(data) {
      this.updateProgress(100);
      (0, _jquery2.default)("#oe-report-data").html(_templatesAmd2.default.get("report")({
        energy: data.energy,
        grad: data.norm
      }));
    },
    updateProgress(value) {
      (0, _jquery2.default)("#oe-report-progress").attr("value", value);
    }
  });
  report.listen([{
    type: "app:structure:loaded",
    owner: _appAmd2.default,
    handler: "hide"
  }, {
    type: "evolve:progress",
    owner: _workerAmd2.default,
    handler: "updateProgress"
  }]);
  exports.default = report;
});

})();
(function() {
var define = System.amdDefine;
define("components/evolve.amd.js", ["exports", "jquery", "./abstract-dialog.amd.js", "../worker.amd.js", "./report.amd.js", "../app.amd.js", "../structure.amd.js"], function(exports, _jquery, _abstractDialogAmd, _workerAmd, _reportAmd, _appAmd, _structureAmd) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  var _jquery2 = _interopRequireDefault(_jquery);
  var _abstractDialogAmd2 = _interopRequireDefault(_abstractDialogAmd);
  var _workerAmd2 = _interopRequireDefault(_workerAmd);
  var _reportAmd2 = _interopRequireDefault(_reportAmd);
  var _appAmd2 = _interopRequireDefault(_appAmd);
  var _structureAmd2 = _interopRequireDefault(_structureAmd);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  let evolve = Object.assign(new _abstractDialogAmd2.default(".oe-evolve-form"), {
    handleEvolveStop(data) {
      _reportAmd2.default.print(data);
    },
    handleApply() {
      if (this.$el[0].checkValidity()) {
        return Object.getPrototypeOf(this).handleApply.apply(this, arguments);
      } else {
        window.alert("Please, fix invalid input first");
      }
    },
    handleKeepLogChange(e) {
      (0, _jquery2.default)("#oe-log-interval").prop("disabled", !e.target.checked).val("0");
    },
    apply() {
      this.fix();
      _workerAmd2.default.invoke("evolve", {
        stepCount: +(0, _jquery2.default)("#oe-step-count").val(),
        temperature: +(0, _jquery2.default)("#oe-temperature").val(),
        stoch: (0, _jquery2.default)("#oe-stoch").prop("checked"),
        logInterval: +(0, _jquery2.default)("#oe-log-interval").val()
      });
      _reportAmd2.default.show();
    },
    discard() {
      this.reset();
    }
  });
  evolve.listen([{
    type: "evolve",
    owner: _workerAmd2.default,
    handler: "handleEvolveStop"
  }, {
    type: "change",
    owner: "#oe-keep-log",
    handler: "handleKeepLogChange"
  }]);
  exports.default = evolve;
  _appAmd2.default.addAction("evolve", {
    get enabled() {
      return _structureAmd2.default.structure.potentials.size > 0;
    },
    exec() {
      evolve.show();
    }
  });
});

})();
(function() {
var define = System.amdDefine;
define("components/save-log.amd.js", ["exports", "./abstract-dialog.amd.js", "../worker.amd.js", "../utils.amd.js"], function(exports, _abstractDialogAmd, _workerAmd, _utilsAmd) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  var _abstractDialogAmd2 = _interopRequireDefault(_abstractDialogAmd);
  var _workerAmd2 = _interopRequireDefault(_workerAmd);
  var _utilsAmd2 = _interopRequireDefault(_utilsAmd);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  let saveLog = Object.assign(new _abstractDialogAmd2.default(".oe-save-log-dialog"), {
    handleEvolveLog(data) {
      this.data = data;
      this.show();
    },
    handleSave(e) {
      let data = this.data,
          E = data.E,
          grad = data.grad,
          dt = data.dt,
          t = 0,
          dl = e.target.getAttribute("data-delimiter"),
          log = `t, ps${dl}E, eV${dl}||grad E||, eV/Å${dl}dt, fs`;
      for (let i = 0,
          len = E.length; i < len; i++) {
        log += "\n" + t.toExponential(4) + dl + E[i].toExponential(4) + dl + grad[i].toExponential(4) + dl + (dt[i] * 1E15).toExponential(4);
        t += dt[i] * 1E12;
      }
      e.target.href = _utilsAmd2.default.getBlobURL(log);
      this.hide();
      this.data = null;
    }
  });
  saveLog.listen([{
    type: "evolve:log",
    owner: _workerAmd2.default,
    handler: "handleEvolveLog"
  }, {
    type: "click",
    filter: "a[download]",
    handler: "handleSave"
  }]);
  exports.default = saveLog;
});

})();
(function() {
var define = System.amdDefine;
define("components/appearance.amd.js", ["exports", "jquery", "./abstract-dialog.amd.js", "../structure.amd.js", "../draw.amd.js", "../app.amd.js"], function(exports, _jquery, _abstractDialogAmd, _structureAmd, _drawAmd, _appAmd) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  var _jquery2 = _interopRequireDefault(_jquery);
  var _abstractDialogAmd2 = _interopRequireDefault(_abstractDialogAmd);
  var _structureAmd2 = _interopRequireDefault(_structureAmd);
  var _drawAmd2 = _interopRequireDefault(_drawAmd);
  var _appAmd2 = _interopRequireDefault(_appAmd);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  let appearance = Object.assign(new _abstractDialogAmd2.default(".oe-appearance-form"), {
    handleUpdateStructure(rescanAtoms) {
      if (rescanAtoms) {
        (0, _jquery2.default)("#oe-appearance-element").html("<option selected>" + _structureAmd2.default.atomList.join("</option><option>") + "</option>");
        this.setCurrElementColor();
      }
    },
    handleColorChange(e) {
      let color = parseInt(e.target.value.slice(1), 16);
      if (isNaN(color)) {
        return;
      }
      if (!this.tmpClrPresets) {
        this.tmpClrPresets = new Map();
      }
      this.tmpClrPresets.set((0, _jquery2.default)("#oe-appearance-element").val(), color);
    },
    apply() {
      _drawAmd2.default.appearance = this.$el.find("input[name='appearance']:checked").data("appearance");
      _drawAmd2.default.setBgColor((0, _jquery2.default)("#oe-bg-color").val());
      if (this.tmpClrPresets) {
        _drawAmd2.default.setAtomColors(this.tmpClrPresets);
        delete this.tmpClrPresets;
      }
      _drawAmd2.default.render();
      this.fix();
    },
    discard() {
      this.reset();
      delete this.tmpClrPresets;
      this.setCurrElementColor();
    },
    setCurrElementColor() {
      let el = (0, _jquery2.default)("#oe-appearance-element").val(),
          color;
      if (this.tmpClrPresets && this.tmpClrPresets.has(el)) {
        color = this.tmpClrPresets.get(el);
      } else {
        color = _drawAmd2.default.getAtomColor(el);
      }
      (0, _jquery2.default)("#oe-appearance-color").val("#" + ("000000" + color.toString(16)).slice(-6));
    }
  });
  appearance.listen([{
    type: "updateStructure",
    owner: _structureAmd2.default,
    handler: "handleUpdateStructure"
  }, {
    type: "change",
    owner: "#oe-appearance-element",
    handler: "setCurrElementColor"
  }, {
    type: "change",
    owner: "#oe-appearance-color",
    handler: "handleColorChange"
  }]);
  exports.default = appearance;
  _appAmd2.default.addAction("alterView", {
    get enabled() {
      return _structureAmd2.default.structure.atoms.length > 0;
    },
    exec() {
      appearance.show();
    }
  });
});

})();
(function() {
var define = System.amdDefine;
define("components/abstract-dialog.amd.js", ["exports", "../eventful.amd.js"], function(exports, _eventfulAmd) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  var _eventfulAmd2 = _interopRequireDefault(_eventfulAmd);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }
  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }});
    if (superClass)
      Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }
  let events = [{
    type: "click",
    filter: ".oe-apply",
    handler(...params) {
      this.handleApply(...params);
    }
  }, {
    type: "click",
    filter: ".oe-discard",
    handler(...params) {
      this.handleDiscard(...params);
    }
  }, {
    type: "keyup",
    owner: document,
    handler(...params) {
      this.handleGlobalKeyUp(...params);
    }
  }];
  let _class = function(_Eventful) {
    _inherits(_class, _Eventful);
    function _class($el) {
      _classCallCheck(this, _class);
      var _this = _possibleConstructorReturn(this, _Eventful.call(this, $el));
      _this.listen(events);
      return _this;
    }
    _class.prototype.handleApply = function handleApply() {
      this.apply();
      this.hide();
    };
    _class.prototype.handleDiscard = function handleDiscard() {
      this.discard();
      this.hide();
    };
    _class.prototype.handleGlobalKeyUp = function handleGlobalKeyUp(e) {
      if (e.which === 27) {
        this.discard();
        this.hide();
      }
    };
    _class.prototype.apply = function apply() {};
    _class.prototype.discard = function discard() {};
    _class.prototype.show = function show() {
      this.$el.removeClass("hidden");
    };
    _class.prototype.hide = function hide() {
      this.$el.addClass("hidden");
    };
    _class.prototype.fix = function fix(fields) {
      if (!fields) {
        fields = this.$el[0].elements;
      }
      for (let field of Array.from(fields)) {
        if (field.type === "checkbox" || field.type === "radio") {
          field.defaultChecked = field.checked;
        } else if (field.nodeName.toUpperCase() === "OPTION") {
          field.defaultSelected = field.selected;
        } else if ("defaultValue" in field) {
          field.defaultValue = field.value;
        } else if (field.options) {
          this.fix(field.options);
        }
      }
    };
    _class.prototype.reset = function reset() {
      this.$el[0].reset();
    };
    return _class;
  }(_eventfulAmd2.default);
  exports.default = _class;
});

})();
(function() {
var define = System.amdDefine;
define("templates.amd.js", ["exports", "./app.amd.js", "./utils.amd.js", "_"], function(exports, _appAmd, _utilsAmd, _2) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  var _appAmd2 = _interopRequireDefault(_appAmd);
  var _utilsAmd2 = _interopRequireDefault(_utilsAmd);
  var _3 = _interopRequireDefault(_2);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  let templates = new Map();
  _appAmd2.default.busy = true;
  _utilsAmd2.default.readFile("tpl/tpl.json").then((json) => {
    let tpls = JSON.parse(json);
    let tplSettings = {variable: "data"};
    for (let name of Object.keys(tpls)) {
      templates.set(name, _3.default.template(tpls[name], tplSettings));
    }
    _appAmd2.default.busy = false;
  });
  exports.default = {get: templates.get.bind(templates)};
});

})();
(function() {
var define = System.amdDefine;
define("components/info.amd.js", ["exports", "./abstract-dialog.amd.js", "../worker.amd.js", "../structure.amd.js", "../app.amd.js", "../templates.amd.js"], function(exports, _abstractDialogAmd, _workerAmd, _structureAmd, _appAmd, _templatesAmd) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  var _abstractDialogAmd2 = _interopRequireDefault(_abstractDialogAmd);
  var _workerAmd2 = _interopRequireDefault(_workerAmd);
  var _structureAmd2 = _interopRequireDefault(_structureAmd);
  var _appAmd2 = _interopRequireDefault(_appAmd);
  var _templatesAmd2 = _interopRequireDefault(_templatesAmd);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  let info = Object.assign(new _abstractDialogAmd2.default(".oe-info-dialog"), {
    handleTotalEnergy(data) {
      this.applyTpl("energy", {
        energy: data,
        bonds: _structureAmd2.default.structure.bonds.length
      });
      this.show();
    },
    handleGradient(data) {
      this.applyTpl("gradient", {grad: data});
      this.show();
    },
    applyTpl(tpl, data) {
      this.$el.find(".oe-info-dialog-text").html(_templatesAmd2.default.get(tpl)(data));
    }
  });
  info.listen([{
    type: "totalEnergy",
    owner: _workerAmd2.default,
    handler: "handleTotalEnergy"
  }, {
    type: "gradient",
    owner: _workerAmd2.default,
    handler: "handleGradient"
  }]);
  exports.default = info;
  _appAmd2.default.addAction("calcEnergy", {
    get enabled() {
      return _structureAmd2.default.structure.potentials.size > 0;
    },
    exec() {
      _workerAmd2.default.invoke("totalEnergy");
    }
  });
  _appAmd2.default.addAction("calcGrad", {
    get enabled() {
      return _structureAmd2.default.structure.potentials.size > 0;
    },
    exec() {
      _workerAmd2.default.invoke("gradient");
    }
  });
});

})();
(function() {
var define = System.amdDefine;
define("file-processing.amd.js", ["exports", "./utils.amd.js", "./structure.amd.js"], function(exports, _utilsAmd, _structureAmd) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  var _utilsAmd2 = _interopRequireDefault(_utilsAmd);
  var _structureAmd2 = _interopRequireDefault(_structureAmd);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  let formats = {};
  formats.hin = {
    parseMolecule(atomRecords, result) {
      let {atoms,
        bonds} = result,
          inc = atoms.length,
          spaceRE = /\s+/;
      for (let i = 0,
          len = atomRecords.length; i < len; i++) {
        let items = atomRecords[i].trim().split(spaceRE);
        atoms.push({
          el: items[3],
          x: +items[7],
          y: +items[8],
          z: +items[9]
        });
        for (let j = 11,
            cn = 2 * items[10] + 11; j < cn; j += 2) {
          if (items[j] - 1 > i) {
            bonds.push({
              iAtm: i + inc,
              jAtm: items[j] - 1 + inc,
              type: items[j + 1]
            });
          }
        }
      }
    },
    parse(fileStr) {
      let molRE = /\n\s*mol\s+(\d+)([\s\S]+)\n\s*endmol\s+\1/g,
          atmRE = /^atom\s+\d+\s+.+$/gm,
          result = {
            atoms: [],
            bonds: []
          },
          mol = molRE.exec(fileStr);
      while (mol) {
        this.parseMolecule(mol[2].match(atmRE), result);
        mol = molRE.exec(fileStr);
      }
      return result;
    }
  };
  formats.ml2 = formats.mol2 = {
    parseMolecule(atomRecords, bondRecords, result) {
      let {atoms,
        bonds} = result,
          inc = atoms.length,
          spaceRE = /\s+/;
      for (let rec of atomRecords) {
        let items = rec.trim().split(spaceRE);
        let dotPos = items[5].indexOf(".");
        atoms.push({
          el: dotPos > -1 ? items[5].slice(0, dotPos) : items[5],
          x: +items[2],
          y: +items[3],
          z: +items[4]
        });
      }
      for (let rec of bondRecords) {
        let items = rec.trim().split(spaceRE);
        bonds.push({
          iAtm: items[1] - 1 + inc,
          jAtm: items[2] - 1 + inc,
          type: items[3]
        });
      }
    },
    parse(fileStr) {
      var result = {
        atoms: [],
        bonds: []
      },
          molChunks = fileStr.split("@<TRIPOS>MOLECULE").slice(1),
          atomRE = /@<TRIPOS>ATOM([\s\S]+?)(?:@<TRIPOS>|$)/,
          bondRE = /@<TRIPOS>BOND([\s\S]+?)(?:@<TRIPOS>|$)/,
          newLineRE = /(?:\r?\n)+/,
          noRec = [];
      for (let chunk of molChunks) {
        let atomSection = chunk.match(atomRE);
        let atomRecords = atomSection && atomSection[1].trim().split(newLineRE) || noRec;
        let bondSection = chunk.match(bondRE);
        let bondRecords = bondSection && bondSection[1].trim().split(newLineRE) || noRec;
        this.parseMolecule(atomRecords, bondRecords, result);
      }
      return result;
    }
  };
  formats.xyz = {
    parseAtomRecord(atomStr) {
      let items = atomStr.trim().split(/\s+/);
      return {
        el: items[0],
        x: +items[1],
        y: +items[2],
        z: +items[3]
      };
    },
    parse(fileStr) {
      let atomRecords = fileStr.split(/(?:\r?\n)+/).slice(2);
      return atomRecords && {
        atoms: atomRecords.map(this.parseAtomRecord, this),
        bonds: []
      };
    }
  };
  exports.default = {
    load(fileRef) {
      return _utilsAmd2.default.readFile(fileRef).then((contents) => {
        let name = fileRef.name || String(fileRef),
            type = name.slice(name.lastIndexOf(".") + 1).toLowerCase(),
            format = formats[type] || formats.hin,
            newStructure = format.parse(contents);
        newStructure.name = name.replace(/.*[\/\\]/, "") || "unknown";
        _structureAmd2.default.overwrite(newStructure);
        return contents;
      });
    },
    makeFile(type, graphType) {
      type = type.toUpperCase();
      if (typeof this[`make${type}`] === "function") {
        return this[`make${type}`](graphType);
      }
      return false;
    },
    makeHIN(graphType) {
      var hin = ";The structure was saved in OpenEvolver\nforcefield mm+\n";
      if (graphType === "empty") {
        let i = 0;
        for (let atom of _structureAmd2.default.structure.atoms) {
          hin += `mol ${++i}
atom 1 - ${atom.el} ** - 0 ${atom.x.toFixed(4)} ${atom.y.toFixed(4)} ${atom.z.toFixed(4)} 0
endmol ${i}
`;
        }
      } else {
        let nbors = new Array(_structureAmd2.default.structure.atoms.length);
        for (let bond of _structureAmd2.default.structure.bonds) {
          if (graphType !== "basic" || bond.type !== "x") {
            (nbors[bond.iAtm] || (nbors[bond.iAtm] = [])).push(`${bond.jAtm + 1} ${bond.type}`);
            (nbors[bond.jAtm] || (nbors[bond.jAtm] = [])).push(`${bond.iAtm + 1} ${bond.type}`);
          }
        }
        hin += "mol 1\n";
        let i = -1;
        for (let atom of _structureAmd2.default.structure.atoms) {
          hin += `atom ${++i + 1} - ${atom.el} ** - 0 ${atom.x.toFixed(4)} ${atom.y.toFixed(4)} ${atom.z.toFixed(4)} ` + (nbors[i] ? `${nbors[i].length} ${nbors[i].join(" ")}` : "0") + "\n";
        }
        hin += "endmol 1";
      }
      return hin;
    },
    makeML2(graphType) {
      let ml2 = `# The structure was saved in OpenEvolver
@<TRIPOS>MOLECULE
****
${_structureAmd2.default.structure.atoms.length} %BOND_COUNT%
SMALL
NO_CHARGES


@<TRIPOS>ATOM
`;
      let i = 0;
      for (let atom of _structureAmd2.default.structure.atoms) {
        ml2 += `${++i} ${atom.el} ${atom.x.toFixed(4)} ${atom.y.toFixed(4)} ${atom.z.toFixed(4)} ${atom.el} 1 **** 0.0000\n`;
      }
      let bondCount = 0;
      if (graphType !== "empty") {
        ml2 += "@<TRIPOS>BOND\n";
        for (let bond of _structureAmd2.default.structure.bonds) {
          if (graphType !== "basic" || bond.type !== "x") {
            bondCount++;
            ml2 += `${bondCount} ${bond.iAtm + 1} ${bond.jAtm + 1} ${bond.type}\n`;
          }
        }
      }
      ml2 += "@<TRIPOS>SUBSTRUCTURE\n1 **** 0";
      ml2 = ml2.replace("%BOND_COUNT%", bondCount.toString());
      return ml2;
    },
    makeXYZ() {
      let xyz = _structureAmd2.default.structure.atoms.length + "\nThe structure was saved in OpenEvolver";
      for (let atom of _structureAmd2.default.structure.atoms) {
        xyz += `\n${atom.el} ${atom.x.toFixed(5)} ${atom.y.toFixed(5)} ${atom.z.toFixed(5)}`;
      }
      return xyz;
    }
  };
});

})();
(function() {
var define = System.amdDefine;
define("components/menu.amd.js", ["exports", "jquery", "../eventful.amd.js", "../app.amd.js", "../file-processing.amd.js"], function(exports, _jquery, _eventfulAmd, _appAmd, _fileProcessingAmd) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  var _jquery2 = _interopRequireDefault(_jquery);
  var _eventfulAmd2 = _interopRequireDefault(_eventfulAmd);
  var _appAmd2 = _interopRequireDefault(_appAmd);
  var _fileProcessingAmd2 = _interopRequireDefault(_fileProcessingAmd);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  let disabled;
  let menu = Object.assign(new _eventfulAmd2.default(".oe-menu"), {
    handleAppStateChange(busy) {
      this.disabled = busy;
    },
    handleGlobalClick(e) {
      if (this.disabled) {
        return;
      }
      let $target = (0, _jquery2.default)(e.target);
      let $popups = this.$el.find("menu.expanded");
      if ($target.is(".oe-menu button[menu]")) {
        let $targetPopup = (0, _jquery2.default)("#" + $target.attr("menu")).toggleClass("expanded");
        if ($targetPopup.hasClass("expanded")) {
          this.setItemStates();
        }
        $popups = $popups.not($targetPopup);
      }
      $popups.removeClass("expanded");
    },
    handleHover(e) {
      if (this.disabled) {
        return;
      }
      let $expandedMenu = this.$el.find("menu.expanded");
      if ($expandedMenu.length) {
        let $targetMenu = (0, _jquery2.default)(e.target).siblings("menu");
        if (!$expandedMenu.is($targetMenu)) {
          $expandedMenu.removeClass("expanded");
          $targetMenu.addClass("expanded");
        }
      }
    },
    handleAction(e) {
      let action = (0, _jquery2.default)(e.target).data("action");
      if (action === "load") {
        (0, _jquery2.default)("#oe-file").trigger("click");
      } else {
        _appAmd2.default.execAction(action);
      }
    },
    handleFile(e) {
      _appAmd2.default.execAction("load", e.target.files[0]);
    },
    setItemStates(action) {
      let $items = this.$el.find("menuitem[data-action]");
      if (action) {
        $items = $items.filter(`[data-action="${action}"]`);
      }
      let actionStates = _appAmd2.default.getActionStates();
      $items.each((idx, item) => {
        let state = actionStates.get(item.getAttribute("data-action")),
            disabled = item.hasAttribute("disabled");
        if (state && disabled) {
          item.removeAttribute("disabled");
        } else if (!state && !disabled) {
          item.setAttribute("disabled", "disabled");
        }
      });
    }
  });
  Object.defineProperty(menu, "disabled", {
    enumerable: true,
    get() {
      return disabled;
    },
    set(state) {
      disabled = !!state;
      this.$el.toggleClass("oe-disabled", !!disabled);
      if (disabled) {
        this.$el.find("menu.expanded").removeClass("expanded");
      }
    }
  });
  menu.listen([{
    type: "app:stateChange",
    owner: _appAmd2.default,
    handler: "handleAppStateChange"
  }, {
    type: "click",
    owner: document,
    handler: "handleGlobalClick"
  }, {
    type: "mouseenter",
    owner: ".oe-menu",
    filter: "button[menu]",
    handler: "handleHover"
  }, {
    type: "click",
    owner: ".oe-menu",
    filter: "menuitem[data-action]",
    handler: "handleAction"
  }, {
    type: "change",
    owner: "#oe-file",
    handler: "handleFile"
  }]);
  menu.disabled = _appAmd2.default.busy;
  exports.default = menu;
  _appAmd2.default.addAction("load", {
    get enabled() {
      return true;
    },
    exec(file) {
      if (file) {
        _fileProcessingAmd2.default.load(file);
      }
    }
  });
});

})();
(function() {
var define = System.amdDefine;
define("eventful.amd.js", ["exports", "./observer.amd.js", "jquery"], function(exports, _observerAmd, _jquery) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  var _observerAmd2 = _interopRequireDefault(_observerAmd);
  var _jquery2 = _interopRequireDefault(_jquery);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function to$(target) {
    return target && target.jquery ? target : (0, _jquery2.default)(target);
  }
  let _class = function() {
    function _class($el) {
      _classCallCheck(this, _class);
      this.$el = to$($el);
    }
    _class.prototype.listen = function listen(config) {
      for (let {type,
        owner,
        filter,
        handler} of config) {
        let handlerFn = typeof handler === "function" ? handler : this[handler];
        if (owner instanceof _observerAmd2.default) {
          owner.on(type, handlerFn.bind(this));
        } else {
          to$(owner || this.$el).on(type, filter || null, handlerFn.bind(this));
        }
      }
    };
    return _class;
  }();
  exports.default = _class;
});

})();
(function() {
var define = System.amdDefine;
define("cacheable.amd.js", ["exports"], function(exports) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  let cacheRegistry = new WeakMap();
  let _class = function() {
    function _class(createFn) {
      _classCallCheck(this, _class);
      Object.defineProperty(this, "create", {
        configurable: true,
        value: createFn
      });
      cacheRegistry.set(this, new Map());
    }
    _class.prototype.get = function get(item) {
      let cache = cacheRegistry.get(this);
      if (!cache.has(item)) {
        cache.set(item, this.create(item));
      }
      return cache.get(item);
    };
    _class.prototype.renew = function renew(item) {
      cacheRegistry.get(this).delete(item);
    };
    return _class;
  }();
  exports.default = _class;
});

})();
(function() {
var define = System.amdDefine;
define("utils.amd.js", ["exports", "./app.amd.js"], function(exports, _appAmd) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  var _appAmd2 = _interopRequireDefault(_appAmd);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  let blobUrl;
  let utils = {
    atomicMasses: {},
    readFile(ref) {
      return new Promise((resolve, reject) => {
        if (typeof ref === "string") {
          let xhr = new XMLHttpRequest();
          xhr.open("GET", ref, true);
          xhr.addEventListener("load", () => {
            if (xhr.status === 200) {
              resolve(xhr.responseText);
            }
          }, false);
          xhr.addEventListener("error", () => reject(xhr.status), false);
          xhr.send(null);
        } else {
          let reader = new FileReader();
          reader.addEventListener("load", () => resolve(reader.result), false);
          reader.addEventListener("error", () => reject(reader.error), false);
          reader.readAsText(ref);
        }
      });
    },
    getBlobURL(data, type) {
      let blob = data instanceof Blob ? data : new Blob([data], {type: type || "text/plain"});
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
      blobUrl = URL.createObjectURL(blob);
      return blobUrl;
    }
  };
  exports.default = utils;
  _appAmd2.default.busy = true;
  utils.readFile("lib.json").then((libText) => {
    let lib = JSON.parse(libText);
    utils.atomicMasses = Object.freeze(lib.atomicMasses);
    _appAmd2.default.busy = false;
  });
});

})();
(function() {
var define = System.amdDefine;
define("observer.amd.js", ["exports"], function(exports) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  let handlerRegistry = new WeakMap();
  let Observer = function() {
    function Observer() {
      _classCallCheck(this, Observer);
      handlerRegistry.set(this, new Map());
    }
    Observer.on = function on(...params) {
      return Observer.prototype.on.apply(Observer, params);
    };
    Observer.off = function off(...params) {
      return Observer.prototype.off.apply(Observer, params);
    };
    Observer.trigger = function trigger(...params) {
      return Observer.prototype.trigger.apply(Observer, params);
    };
    Observer.prototype.on = function on(event, handler) {
      let handlers = handlerRegistry.get(this);
      if (!handlers.has(event)) {
        handlers.set(event, []);
      }
      handlers.get(event).push(handler);
    };
    Observer.prototype.off = function off(event, handler) {
      let handlers = handlerRegistry.get(this);
      if (!handlers.has(event)) {
        return;
      }
      if (handler) {
        let eventHandlers = handlers.get(event);
        let handlerIndex = eventHandlers.indexOf(handler);
        if (handlerIndex > -1) {
          eventHandlers.splice(handlerIndex, 1);
          if (eventHandlers.length === 0) {
            handlers.delete(event);
          }
        }
      } else {
        handlers.get(event).length = 0;
        handlers.delete(event);
      }
    };
    Observer.prototype.trigger = function trigger(event, ...params) {
      let handlers = handlerRegistry.get(this);
      if (handlers.has(event)) {
        for (let handler of handlers.get(event)) {
          handler.apply(null, params);
        }
      }
    };
    return Observer;
  }();
  handlerRegistry.set(Observer, new Map());
  exports.default = Observer;
});

})();
(function() {
var define = System.amdDefine;
define("app.amd.js", ["exports", "./observer.amd.js"], function(exports, _observerAmd) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  var _observerAmd2 = _interopRequireDefault(_observerAmd);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  let actionStore = new Map();
  let app = Object.assign(new _observerAmd2.default(), {
    addAction(name, action) {
      actionStore.set(name, action);
    },
    execAction(name, ...params) {
      if (!this.actionEnabled(name)) {
        throw new Error(`Action "${name}" is disabled and can't be executed`);
      }
      return actionStore.get(name).exec(...params);
    },
    actionEnabled(name) {
      return !this.busy && actionStore.get(name).enabled;
    },
    getActionStates() {
      let busy = this.busy;
      let states = new Map();
      for (let [name, action] of actionStore) {
        states.set(name, !busy && action.enabled);
      }
      return states;
    }
  });
  let busyCount = 0;
  Object.defineProperty(app, "busy", {
    configurable: true,
    enumerable: true,
    get() {
      return busyCount > 0;
    },
    set(value) {
      let busyAnte = this.busy;
      if (busyAnte || value) {
        busyCount += value ? 1 : -1;
        let busy = this.busy;
        if (busyAnte !== busy) {
          this.trigger("app:stateChange", busy);
        }
      }
    }
  });
  exports.default = app;
});

})();
(function() {
var define = System.amdDefine;
define("worker.amd.js", ["exports", "./observer.amd.js", "./app.amd.js"], function(exports, _observerAmd, _appAmd) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  var _observerAmd2 = _interopRequireDefault(_observerAmd);
  var _appAmd2 = _interopRequireDefault(_appAmd);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  let blockingMethod = "ready";
  _appAmd2.default.busy = true;
  let worker = Object.assign(new _observerAmd2.default(), {invoke(method, data) {
      blockingMethod = method;
      _appAmd2.default.busy = true;
      calcWorker.postMessage({
        method,
        data
      });
    }});
  let calcWorker = new Worker("js/calc.js");
  calcWorker.addEventListener("message", (e) => {
    let method = e.data && e.data.method;
    if (method) {
      if (method === blockingMethod) {
        _appAmd2.default.busy = false;
        blockingMethod = null;
      }
      worker.trigger(method, e.data.data);
    }
  });
  calcWorker.addEventListener("error", (e) => {
    throw e;
  });
  exports.default = worker;
});

})();
(function() {
var define = System.amdDefine;
define("structure.amd.js", ["exports", "./observer.amd.js", "./app.amd.js", "./utils.amd.js", "./worker.amd.js"], function(exports, _observerAmd, _appAmd, _utilsAmd, _workerAmd) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  var _observerAmd2 = _interopRequireDefault(_observerAmd);
  var _appAmd2 = _interopRequireDefault(_appAmd);
  var _utilsAmd2 = _interopRequireDefault(_utilsAmd);
  var _workerAmd2 = _interopRequireDefault(_workerAmd);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  let structure = {
    name: "",
    atoms: [],
    bonds: [],
    potentials: new Map()
  };
  let atomList = [];
  let pairList = [];
  let structureUtils = Object.assign(new _observerAmd2.default(), {
    overwrite(newStructure, rescanAtoms = true, fromWorker = false) {
      ({name: structure.name = "",
        atoms: structure.atoms = [],
        bonds: structure.bonds = [],
        potentials: structure.potentials = new Map()} = newStructure);
      if (rescanAtoms !== false) {
        atomList.length = pairList.length = 0;
        for (let {el} of structure.atoms) {
          if (atomList.indexOf(el) === -1) {
            atomList.push(el);
          }
        }
        for (let i = 0,
            len = atomList.length; i < len; i++) {
          for (let j = i; j < len; j++) {
            pairList.push(atomList[i] + atomList[j]);
          }
        }
        pairList.push(...pairList.map((pair) => "x-" + pair));
      }
      this.trigger("updateStructure", rescanAtoms !== false);
      if (fromWorker !== true) {
        _appAmd2.default.trigger("app:structure:loaded");
        syncWorker();
      }
    },
    setPotentials(potentials) {
      structure.potentials = potentials;
      for (let bond of structure.bonds) {
        let prefix = bond.type === "x" ? "x-" : "";
        let atoms = structure.atoms;
        bond.potential = potentials.get(prefix + atoms[bond.iAtm].el + atoms[bond.jAtm].el) || potentials.get(prefix + atoms[bond.jAtm].el + atoms[bond.iAtm].el);
      }
      _appAmd2.default.trigger("app:structure:paramsSet");
      syncWorker();
    },
    getCenterOfMass() {
      let result = {
        x: 0,
        y: 0,
        z: 0
      };
      let mass = 0;
      for (let atom of structure.atoms) {
        const atomicMass = _utilsAmd2.default.atomicMasses[atom.el];
        mass += atomicMass;
        result.x += atomicMass * atom.x;
        result.y += atomicMass * atom.y;
        result.z += atomicMass * atom.z;
      }
      result.x /= mass;
      result.y /= mass;
      result.z /= mass;
      return result;
    },
    translate(x, y, z) {
      let center = this.getCenterOfMass(),
          dx = x - center.x,
          dy = y - center.y,
          dz = z - center.z;
      for (let atom of structure.atoms) {
        atom.x += dx;
        atom.y += dy;
        atom.z += dz;
      }
      this.overwrite(structure, false, false);
    },
    rotate(angle, axis) {
      let axis2 = axis === "x" ? "y" : "x",
          axis3 = axis === "z" ? "y" : "z",
          sine = Math.sin(angle),
          cosine = Math.cos(angle);
      for (let atom of structure.atoms) {
        let coord2 = atom[axis2];
        let coord3 = atom[axis3];
        atom[axis2] = coord2 * cosine + coord3 * sine;
        atom[axis3] = coord3 * cosine - coord2 * sine;
      }
      this.overwrite(structure, false, false);
    }
  });
  Object.defineProperties(structureUtils, {
    structure: {
      enumerable: true,
      get() {
        return structure;
      }
    },
    atomList: {
      enumerable: true,
      get() {
        return atomList.slice(0);
      }
    },
    pairList: {
      enumerable: true,
      get() {
        return pairList.slice(0);
      }
    }
  });
  exports.default = structureUtils;
  function syncWorker() {
    _workerAmd2.default.invoke("setStructure", structureUtils.structure);
  }
  _workerAmd2.default.on("setStructure", (updatedStructure) => {
    structureUtils.overwrite(updatedStructure, false, true);
  });
  _workerAmd2.default.on("updateStructure", (updatedStructure) => {
    structureUtils.overwrite(updatedStructure, false, true);
  });
});

})();
(function() {
var define = System.amdDefine;
define("draw.amd.js", ["exports", "three", "./cacheable.amd.js", "./structure.amd.js"], function(exports, _three, _cacheableAmd, _structureAmd) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  var _three2 = _interopRequireDefault(_three);
  var _cacheableAmd2 = _interopRequireDefault(_cacheableAmd);
  var _structureAmd2 = _interopRequireDefault(_structureAmd);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  let colors = new _cacheableAmd2.default((color) => new _three2.default.Color(color));
  let presets = Object.create({
    get(el) {
      return this.hasOwnProperty(el) ? this[el] : this._def;
    },
    set(el, value) {
      if (this.hasOwnProperty(el)) {
        Object.assign(this[el], value);
      } else {
        this[el] = Object.assign({}, this._def, value);
      }
    }
  }, {_def: {value: Object.freeze({
        color: 0xFFFFFF,
        radius: 1
      })}});
  presets.set("C", {color: 0xFF0000});
  presets.set("H", {radius: 0.7});
  let pointMaterials = new _cacheableAmd2.default((atom) => {
    let preset = presets.get(atom);
    return new _three2.default.PointsMaterial({
      color: preset.color,
      sizeAttenuation: false
    });
  });
  let atomMaterials = new _cacheableAmd2.default((atom) => {
    let preset = presets.get(atom);
    return new _three2.default.MeshLambertMaterial({color: preset.color});
  });
  let atomGeometries = new _cacheableAmd2.default((atom) => {
    let preset = presets.get(atom);
    return new _three2.default.SphereGeometry(preset.radius);
  });
  let bondMaterials = new _cacheableAmd2.default((type) => {
    if (type === "extra") {
      return new _three2.default.LineDashedMaterial({
        dashSize: 0.2,
        gapSize: 0.1,
        vertexColors: _three2.default.VertexColors
      });
    } else {
      return new _three2.default.LineBasicMaterial({vertexColors: _three2.default.VertexColors});
    }
  });
  let canvas = {
    el: null,
    width: 600,
    height: 500
  };
  let assets3 = {
    scene: new _three2.default.Scene(),
    group: new _three2.default.Object3D(),
    camera: new _three2.default.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000),
    spotLight: new _three2.default.SpotLight(0xFFFFFF),
    renderer: new _three2.default.WebGLRenderer()
  };
  assets3.spotLight.position.set(-40, 60, 50);
  assets3.scene.add(assets3.group, assets3.spotLight);
  assets3.camera.position.x = 0;
  assets3.camera.position.y = 0;
  assets3.camera.position.z = 20;
  assets3.camera.lookAt(assets3.scene.position);
  assets3.renderer.setClearColor(0x000000);
  assets3.renderer.setSize(canvas.width, canvas.height);
  assets3.renderer.render(assets3.scene, assets3.camera);
  canvas.el = assets3.renderer.domElement;
  let draw = {
    get canvas() {
      return canvas.el;
    },
    rotation: 0,
    appearance: "graph",
    zoom(delta) {
      assets3.camera.position.z += delta;
      assets3.camera.lookAt(assets3.scene.position);
      this.update();
    },
    render() {
      this.resetScene();
      this.update();
    },
    update() {
      assets3.group.rotation.y += (this.rotation - assets3.group.rotation.y) * 0.05;
      assets3.renderer.render(assets3.scene, assets3.camera);
      if (this.autoUpdate) {
        requestAnimationFrame(() => this.update());
      }
    },
    getAtomColor(el) {
      return presets.get(el).color;
    },
    setAtomColors(colors) {
      for (let [el, color] of colors) {
        if (this.getAtomColor(el) !== color) {
          presets.set(el, {color});
          atomMaterials.renew(el);
          pointMaterials.renew(el);
        }
      }
    },
    setBgColor(color) {
      if (typeof color === "string") {
        color = Number(color.replace("#", "0x"));
      }
      assets3.renderer.setClearColor(color);
    },
    clearScene() {
      let group = assets3.group;
      let child = group.children[0];
      while (child) {
        group.remove(child);
        child = group.children[0];
      }
    },
    resetScene() {
      this.clearScene();
      if (this.appearance === "spheres") {
        this.addSceneAtoms();
      } else if (_structureAmd2.default.structure.bonds.length) {
        this.addSceneBonds();
      } else {
        this.addScenePoints();
      }
    },
    addSceneAtoms() {
      let Mesh = _three2.default.Mesh,
          group = assets3.group;
      for (let atom of _structureAmd2.default.structure.atoms) {
        let atom3 = new Mesh(atomGeometries.get(atom.el), atomMaterials.get(atom.el));
        atom3.position.x = atom.x;
        atom3.position.y = atom.y;
        atom3.position.z = atom.z;
        group.add(atom3);
      }
    },
    addSceneBonds() {
      let Line = _three2.default.Line,
          Vector3 = _three2.default.Vector3,
          group = assets3.group,
          atoms = _structureAmd2.default.structure.atoms,
          bindMap = new Int8Array(atoms.length);
      for (let bond of _structureAmd2.default.structure.bonds) {
        let iAtm = bond.iAtm;
        let jAtm = bond.jAtm;
        bindMap[iAtm] = bindMap[jAtm] = 1;
        let bondGeometry = new _three2.default.Geometry();
        let atom = atoms[iAtm];
        bondGeometry.vertices.push(new Vector3(atom.x, atom.y, atom.z));
        bondGeometry.colors.push(colors.get(presets.get(atom.el).color));
        atom = atoms[jAtm];
        bondGeometry.vertices.push(new Vector3(atom.x, atom.y, atom.z));
        bondGeometry.colors.push(colors.get(presets.get(atom.el).color));
        if (bond.type === "x") {
          bondGeometry.computeLineDistances();
          group.add(new Line(bondGeometry, bondMaterials.get("extra"), _three2.default.LineStrip));
        } else {
          group.add(new Line(bondGeometry, bondMaterials.get("basic")));
        }
      }
      let Points = _three2.default.Points;
      let i = bindMap.indexOf(0);
      while (i !== -1) {
        let pointGeometry = new _three2.default.Geometry();
        let atom = atoms[i];
        pointGeometry.vertices.push(new Vector3(atom.x, atom.y, atom.z));
        group.add(new Points(pointGeometry, pointMaterials.get(atom.el)));
        i = bindMap.indexOf(0, i + 1);
      }
    },
    addScenePoints() {
      let Points = _three2.default.Points,
          Vector3 = _three2.default.Vector3,
          group = assets3.group;
      for (let atom of _structureAmd2.default.structure.atoms) {
        let pointGeometry = new _three2.default.Geometry();
        pointGeometry.vertices.push(new Vector3(atom.x, atom.y, atom.z));
        group.add(new Points(pointGeometry, pointMaterials.get(atom.el)));
      }
    },
    addAxes() {
      if (!this.axes) {
        this.axes = new _three2.default.AxisHelper(20);
        assets3.scene.add(this.axes);
        this.update();
      }
    },
    removeAxes() {
      if (this.axes) {
        assets3.scene.remove(this.axes);
        delete this.axes;
        this.update();
      }
    }
  };
  exports.default = draw;
  _structureAmd2.default.on("updateStructure", draw.render.bind(draw));
});

})();
(function() {
var define = System.amdDefine;
define("components/view.amd.js", ["exports", "../eventful.amd.js", "../app.amd.js", "../draw.amd.js"], function(exports, _eventfulAmd, _appAmd, _drawAmd) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  var _eventfulAmd2 = _interopRequireDefault(_eventfulAmd);
  var _appAmd2 = _interopRequireDefault(_appAmd);
  var _drawAmd2 = _interopRequireDefault(_drawAmd);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  let view = Object.assign(new _eventfulAmd2.default("#oe-view"), {
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
      if (e.target === e.currentTarget) {
        e.target.classList.remove("oe-droppable");
      }
    },
    handleDrop(e) {
      let dt = e.originalEvent.dataTransfer,
          files = dt && dt.files;
      if (files && files.length) {
        e.preventDefault();
        _appAmd2.default.execAction("load", files[0]);
      }
      e.currentTarget.classList.remove("oe-droppable");
    },
    handleWheelZoom(e) {
      _drawAmd2.default.zoom(e.originalEvent.deltaY < 0 ? 5 : -5);
      e.preventDefault();
    },
    handleStartRotate(e) {
      this.rotData.startX = e.pageX;
      this.rotData.startRot = _drawAmd2.default.rotation;
      this.$el.on("mouseup.oeViewRotation mouseleave.oeViewRotation", this.handleStopRotate.bind(this)).on("mousemove.oeViewRotation", this.handleRotate.bind(this));
      _drawAmd2.default.autoUpdate = true;
      _drawAmd2.default.update();
    },
    handleStopRotate() {
      _drawAmd2.default.autoUpdate = false;
      this.$el.off(".oeViewRotation");
    },
    handleRotate(e) {
      _drawAmd2.default.rotation = this.rotData.startRot + (e.pageX - this.rotData.startX) * 0.02;
    }
  });
  view.listen([{
    type: "click",
    owner: ".oe-acknowledgements",
    handler: "handleACKClick"
  }, {
    type: "dragenter dragover",
    handler: "handleDragEnterOver"
  }, {
    type: "dragleave",
    handler: "handleDragLeave"
  }, {
    type: "drop",
    handler: "handleDrop"
  }, {
    type: "wheel",
    handler: "handleWheelZoom"
  }, {
    type: "mousedown",
    handler: "handleStartRotate"
  }]);
  view.$el.append(_drawAmd2.default.canvas);
  exports.default = view;
});

})();
(function() {
var define = System.amdDefine;
define("interface.amd.js", ["./structure.amd.js", "./app.amd.js", "./components/store.amd.js", "./components/save.amd.js", "./components/save-summary.amd.js", "./components/graph.amd.js", "./components/potentials.amd.js", "./components/transform.amd.js", "./components/report.amd.js", "./components/evolve.amd.js", "./components/save-log.amd.js", "./components/appearance.amd.js", "./components/info.amd.js", "./components/menu.amd.js", "./components/view.amd.js"], function(_structureAmd, _appAmd) {
  "use strict";
  var _structureAmd2 = _interopRequireDefault(_structureAmd);
  var _appAmd2 = _interopRequireDefault(_appAmd);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
  }
  _structureAmd2.default.on("app:structure:loaded", () => {
    document.title = `${_structureAmd2.default.structure.name} - Open evolver`;
  });
  _appAmd2.default.on("app:stateChange", (busy) => {
    document.body.classList.toggle("app-busy", busy);
  });
});

})();