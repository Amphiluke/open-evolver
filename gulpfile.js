"use strict";

var gulp = require("gulp"),
    useref = require("gulp-useref"),
    uglify = require("gulp-uglify"),
    files2JSON = require("gulp-files-to-json");

gulp.task("html", function () {
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
    return gulp.src("./dev/src/img/**/*")
        .pipe(gulp.dest("./build/src/img"));
});

gulp.task("tpl", function () {
    return gulp.src("./dev/src/tpl/*.html")
        .pipe(files2JSON("tpl.json"))
        .pipe(gulp.dest("./dev/src/tpl/"))
        .pipe(gulp.dest("./build/src/tpl/"));
});

gulp.task("default", ["html", "detachedScripts", "styles", "images", "tpl"]);