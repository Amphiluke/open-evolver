"use strict";

let gulp = require("gulp"),
    replace = require("gulp-replace"),
    rename = require("gulp-rename"),
    babel = require("gulp-babel"),
    files2JSON = require("gulp-files-to-json");
    //uglify = require("gulp-uglify"),

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

gulp.task("tpl", function () {
    return gulp.src("dev/src/tpl/*.html")
        .pipe(files2JSON("tpl.json"))
        .pipe(gulp.dest("dev/src/tpl/"));
        //.pipe(gulp.dest("./build/src/tpl/"));
});

gulp.task("prepare", ["dependencies", "transpile"]);



/*gulp.task("html", function () {
    var assets = useref.assets();
    return gulp.src("./dev/index.html")
        .pipe(assets)
        .pipe(uglify())
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest("./build"));
});

gulp.task("detachedScripts", function () {
    return gulp.src(["./dev/src/js/fallback.js", "./dev/src/js/calc.js", "./dev/src/js/utils.js"])
        .pipe(uglify())
        .pipe(gulp.dest("./build/src/js"));
});

gulp.task("styles", function () {
    return gulp.src("./dev/src/css/main.css")
        .pipe(gulp.dest("./build/src/css"));
});

gulp.task("images", function () {
    return gulp.src("./dev/src/img/** /*")
        .pipe(gulp.dest("./build/src/img"));
});

gulp.task("tpl", function () {
    return gulp.src("./dev/src/tpl/*.html")
        .pipe(files2JSON("tpl.json"))
        .pipe(gulp.dest("./dev/src/tpl/"))
        .pipe(gulp.dest("./build/src/tpl/"));
});

gulp.task("default", ["html", "detachedScripts", "styles", "images", "tpl"]);*/