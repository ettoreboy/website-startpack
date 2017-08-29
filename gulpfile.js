'use strict';
/**
* Automate task for development thanks to Gulp
* @author: Ettore Ciprian
*
**/
var gulp = require('gulp');
var path = require('path');
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var clean = require('gulp-clean');
var sass = require('gulp-sass');
var minify = require('gulp-uglify');
var browserSync = require('browser-sync').create();
var htmlv = require('gulp-html-validator');
var fs = require('fs');
var validatecss = require('gulp-w3c-css');
var argv = require('yargs').argv;
var prettyjson = require('prettyjson');


//Constants for src and output paths
const css_src_dir = path.join(".", "sass");
const css_out_dir = path.join(".", "build", "css");
const js_src_dir = path.join(".", "js");
const js_out_dir = path.join(".", "build", "js");
const build_dir = path.join(".", "build")

//Clean the js build folder
gulp.task('clean-js', () => {
    return gulp.src(path.join(js_out_dir, '*.js'), {read: false})
    .pipe(clean());
});

//Clean the css build folder
gulp.task('clean-css', () => {
    return gulp.src(path.join(css_out_dir, '*.css'), {read: false})
    .pipe(clean());
});

//Clean the build folder
gulp.task('clean', ['clean-js', 'clean-css']);

//Build css files with gulp-sass, compress and add a sourcemap
gulp.task('build-css', () => {
    return gulp.src(path.join(css_src_dir, '*.scss'))
    .pipe(sourcemaps.init())
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(concat('style.min.css'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(css_out_dir))
    .pipe(browserSync.stream());
});

//Build css files with gulp-sass, do not compress
gulp.task('build-css-source', () => {
    return gulp.src(path.join(css_src_dir, '*.scss'))
    .pipe(sass().on('error', sass.logError))
    .pipe(concat('style.css'))
    .pipe(gulp.dest(css_out_dir));
});

//Build js files - in this project just compress them.
//https://www.npmjs.com/package/gulp-minify
gulp.task('build-js', () => {
    return gulp.src(path.join(js_src_dir, '*.js'))
    .pipe(sourcemaps.init())
    .pipe(minify({
        warnings: true

    }))
    .pipe(rename(function (path) {
        path.basename += ".min";
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(js_out_dir))
    .pipe(browserSync.stream());
});

//Build task for css and js
gulp.task('build', ['build-js', 'build-css']);

// Static Server and watch js/scss/html files for live rebuild
gulp.task('serve:dev', ['build'], () => {
    browserSync.init({
        server: "./",
        port: 3000
    });

    gulp.watch(path.join(css_src_dir, '*.scss'), ['build-css']);
    gulp.watch(path.join(js_src_dir, '*.js'), ['build-js']);
    gulp.watch(path.join(".", "*.html")).on('change', browserSync.reload);
});

// Simply serve the project
gulp.task('serve', ['build'], () => {
    browserSync.init({
        server: "./",
        port: 3000
    });
});

// Check index.html against w3.org
// https://github.com/hoobdeebla/gulp-html-validator
gulp.task('valid-html', () => {
    return gulp.src(path.join(".", "index.html"))
    .pipe(htmlv())
    .pipe(rename("w3-html.json"))
    .pipe(gulp.dest(build_dir))
    .on("end", () => {
        printJSON(path.join(build_dir, "w3-html.json"));
    });
});

//Validate css against w3c with selected profile
// @param --profile - Use the selected profile when node run is executed, default is css3.
//https://github.com/gchudnov/gulp-w3c-css
gulp.task('valid-css', ['build-css-source'], () => {
    var profile = argv.profile || "css3";
    return gulp.src(path.join(css_out_dir, "style.css"))
    .pipe(validatecss({
        profile: profile,
        sleep: 1500
    }))
    .pipe(rename("w3-css.json"))
    .pipe(gulp.dest(build_dir))
    .on("end", () => {
        printJSON(path.join(build_dir, "w3-css.json"));
    });
});

//Pretty print a JSON file to console
function printJSON(path) {
    var json = JSON.parse(fs.readFileSync(path));
    return console.log(prettyjson.render(json));
}
