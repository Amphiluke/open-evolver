"use strict";

var fs = require("fs"),
    gulp = require("gulp"),
    uglify = require("gulp-uglify"),
    concat = require("gulp-concat"),
    replace = require("gulp-replace");

var scriptList = [];

gulp.task("getScriptList", function (cb) {
    fs.readFile("./index.html", {encoding: "utf-8"}, function (err, data) {
        if (!err) {
            scriptList = data
                .match(/<script src=".+\?concat=1"><\/script>/g)
                .map(function (script) {
                    return script.replace(/(?:<script src="|\?concat=1"><\/script>)/g, "");
                });
        }
        cb(err);
    });
});

gulp.task("html", function () {
    return gulp.src("./index.html")
        .pipe(replace(/(?:<script src=".+\?concat=1"><\/script>\s*)+/g, "<script src=\"src/js/main.js\"></script>"))
        .pipe(gulp.dest("build"));
});

gulp.task("scripts", ["getScriptList"], function () {
    return gulp.src(scriptList)
        .pipe(uglify())
        .pipe(concat("main.js", {newLine: "\r\n"}))
        .pipe(gulp.dest("build/src/js"));
});

gulp.task("detachedScripts", function () {
    return gulp.src(["./src/js/fallback.js", "./src/js/calc.js"])
        .pipe(uglify())
        .pipe(gulp.dest("build/src/js"));
});

gulp.task("styles", function () {
    return gulp.src("./src/css/main.css")
        .pipe(gulp.dest("build/src/css"));
});

gulp.task("default", ["html", "scripts", "detachedScripts", "styles"]);