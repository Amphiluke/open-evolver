"use strict";

let gulp = require("gulp"),
    replace = require("gulp-replace"),
    rename = require("gulp-rename"),
    babel = require("gulp-babel"),
    files2JSON = require("gulp-files-to-json"),
    Builder = require("systemjs-builder"),
    fs = require("fs");

gulp.task("dependencies", () => {
    let deps = [
        "node_modules/jquery/dist/jquery.min.js",
        "node_modules/systemjs/dist/system.js",
        "node_modules/three/three.min.js",
        "node_modules/underscore/underscore-min.js",
        "node_modules/normalize.css/normalize.css"
    ];
    return gulp.src(deps).pipe(gulp.dest("vendor"));
});

gulp.task("transpile", () => {
    let importRE = /import\s+(\w+\s+from\s+)?"([\w.\/\-]+).js"/g,
        replacement = "import $1\"$2.amd.js\"";
    return gulp.src(["dev/src/js/**/*.js", "!dev/src/js/**/*.amd.js", "!dev/src/js/calc.js"])
        .pipe(replace(importRE, replacement))
        .pipe(babel())
        .pipe(rename({suffix: ".amd"}))
        .pipe(gulp.dest("dev/src/js"));
});

gulp.task("prepare", ["dependencies", "transpile"]);

gulp.task("html", () => {
    return gulp.src("dev/index.html")
        .pipe(gulp.dest("build/"));
});

gulp.task("tpl", () => {
    return gulp.src("dev/src/tpl/*.html")
        .pipe(files2JSON("tpl.json"))
        .pipe(gulp.dest("dev/src/tpl/"))
        .pipe(gulp.dest("build/src/tpl/"));
});

gulp.task("styles", () => {
    return gulp.src("dev/src/css/main.css")
        .pipe(gulp.dest("build/src/css/"));
});

gulp.task("images", () => {
    return gulp.src("dev/src/img/**/*")
        .pipe(gulp.dest("build/src/img/"));
});

gulp.task("detachedScripts", () => {
    return gulp.src(["dev/src/js/calc.js"])
        .pipe(gulp.dest("build/src/js/"));
});

gulp.task("lib", cb => {
    let lib = require("./dev/src/lib.json");
    let json = JSON.stringify(lib);
    fs.writeFile("build/src/lib.json", json, cb);
});

gulp.task("bundle", ["transpile"], () => {
    let builder = new Builder();
    builder.config({
        baseURL: "dev/src/js",
        meta: {
            jquery: {build: false},
            _: {build: false},
            three: {build: false}
        }
    });
    return builder.bundle("interface.amd.js", "build/src/js/interface.amd.js");
});

gulp.task("build", ["html", "tpl", "styles", "images", "detachedScripts", "lib", "bundle"]);