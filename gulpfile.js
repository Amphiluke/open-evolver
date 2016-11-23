"use strict";

let gulp = require("gulp"),
    replace = require("gulp-replace"),
    rename = require("gulp-rename"),
    babel = require("gulp-babel"),
    less = require("gulp-less"),
    LessPluginCleanCSS = require("less-plugin-clean-css"),
    files2JSON = require("gulp-files-to-json"),
    Builder = require("systemjs-builder"),
    fs = require("fs");

gulp.task("dependencies", () => {
    let deps = [
        "node_modules/jquery/dist/jquery.min.js",
        "node_modules/systemjs/dist/system.js",
        "node_modules/three/build/three.min.js",
        "node_modules/normalize.css/normalize.css"
    ];
    return gulp.src(deps).pipe(gulp.dest("vendor/"));
});

gulp.task("transpile", () => {
    let importRE = /import\s+(\w+\s+from\s+)?"([\w.\/\-]+).js"/g,
        replacement = "import $1\"$2.amd.js\"";
    return gulp.src(["dev/js/**/*.js", "!dev/js/**/*.amd.js", "!dev/js/calc.js"])
        .pipe(replace(importRE, replacement))
        .pipe(babel())
        .pipe(rename({suffix: ".amd"}))
        .pipe(gulp.dest("dev/js/"));
});

gulp.task("styles-dev", () => {
    let cleanCSS = new LessPluginCleanCSS({advanced: true});
    return gulp.src("dev/css/main.less")
        .pipe(less({plugins: [cleanCSS]}))
        .pipe(gulp.dest("dev/css/"));
});

gulp.task("prepare", ["dependencies", "transpile", "styles-dev"]);

gulp.task("html", () => {
    return gulp.src("dev/index.html")
        .pipe(gulp.dest("build/"));
});

gulp.task("tpl", () => {
    return gulp.src("dev/tpl/*.html")
        .pipe(files2JSON("tpl.json"))
        .pipe(gulp.dest("dev/tpl/"))
        .pipe(gulp.dest("build/tpl/"));
});

gulp.task("styles", () => {
    let cleanCSS = new LessPluginCleanCSS({advanced: true});
    return gulp.src("dev/css/main.less")
        .pipe(less({plugins: [cleanCSS]}))
        .pipe(gulp.dest("build/css/"));
});

gulp.task("images", () => {
    return gulp.src("dev/img/**/*")
        .pipe(gulp.dest("build/img/"));
});

gulp.task("detachedScripts", () => {
    return gulp.src(["dev/js/calc.js"])
        .pipe(gulp.dest("build/js/"));
});

gulp.task("lib", cb => {
    let lib = require("./dev/lib.json");
    let json = JSON.stringify(lib);
    fs.writeFile("build/lib.json", json, cb);
});

gulp.task("bundle", ["transpile"], () => {
    let builder = new Builder();
    builder.config({
        baseURL: "dev/js",
        meta: {
            jquery: {build: false},
            _: {build: false},
            three: {build: false}
        }
    });
    return builder.bundle("interface.amd.js", "build/js/interface.amd.js");
});

gulp.task("build", ["html", "tpl", "styles", "images", "detachedScripts", "lib", "bundle"]);