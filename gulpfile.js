"use strict";

var fs = require("fs"),
    gulp = require("gulp"),
    uglify = require("gulp-uglify"),
    concat = require("gulp-concat"),
    replace = require("gulp-replace"),
    files2JSON = require("gulp-files-to-json");

var scriptList = [];

gulp.task("getScriptList", function (cb) {
    fs.readFile("./dev/index.html", {encoding: "utf-8"}, function (err, data) {
        if (!err) {
            scriptList = data
                .match(/<script src=".+\?concat=1"><\/script>/g)
                .map(function (script) {
                    return "./dev/" + script.replace(/(?:<script src="|\?concat=1"><\/script>)/g, "");
                });
        }
        cb(err);
    });
});

gulp.task("html", function () {
    return gulp.src("./dev/index.html")
        .pipe(replace(/(?:<script src=".+\?concat=1"><\/script>\s*)+/g, "<script src=\"src/js/main.js\"></script>"))
        .pipe(gulp.dest("./build"));
});

gulp.task("scripts", ["getScriptList"], function () {
    return gulp.src(scriptList)
        .pipe(uglify())
        .pipe(concat("main.js", {newLine: "\r\n"}))
        .pipe(gulp.dest("./build/src/js"));
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
    return gulp.src("./dev/src/img/**/*")
        .pipe(gulp.dest("./build/src/img"));
});

gulp.task("tpl", function () {
    return gulp.src("./dev/src/tpl/*.html")
        .pipe(files2JSON("tpl.json"))
        .pipe(gulp.dest("./dev/src/tpl/"))
        .pipe(gulp.dest("./build/src/tpl/"));
});

gulp.task("default", ["html", "scripts", "detachedScripts", "styles", "images", "tpl"]);