const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const rename = require('gulp-rename');

// Chemins des fichiers
const paths = {
    scss: {
        src: 'assets/scss/**/*.scss',
        dest: 'assets/css/',
        main: 'assets/scss/style.scss'
    },
    html: '**/*.{html,vue,php}',
    js: '**/*.js'
};

// Compilation SCSS
function compileSass() {
    return gulp.src(paths.scss.main)
        .pipe(sourcemaps.init())
        .pipe(sass({
            outputStyle: 'expanded',
            precision: 8
        }).on('error', sass.logError))
        .pipe(autoprefixer({
            cascade: false
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.scss.dest))
        .pipe(browserSync.stream()); // Injection CSS à chaud
}

// Compilation SCSS minifiée pour production
function compileSassMin() {
    return gulp.src(paths.scss.main)
        .pipe(sass({
            outputStyle: 'compressed'
        }).on('error', sass.logError))
        .pipe(autoprefixer({
            cascade: false
        }))
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(paths.scss.dest))
        .pipe(browserSync.stream());
}

// Initialisation de BrowserSync
function browserSyncInit() {
    browserSync.init({
        proxy: "http://localhost:3000", // Proxy vers Nuxt
        port: 3333,
        notify: false,
        open: 'local',
        ghostMode: {
            clicks: true,
            forms: true,
            scroll: true
        },
        injectChanges: true, // Injection CSS à chaud
        logLevel: "info",
        logPrefix: "Vodafone"
    });
}

// Rechargement du navigateur
function browserSyncReload(done) {
    browserSync.reload();
    done();
}

// Surveillance des fichiers
function watchFiles() {
    gulp.watch(paths.scss.src, compileSass);
    gulp.watch([paths.html, paths.js], browserSyncReload);
}

// Tâches publiques
const build = gulp.series(compileSass);
const buildMin = gulp.series(compileSassMin);
const dev = gulp.series(compileSass, gulp.parallel(browserSyncInit, watchFiles));

// Exports
exports.sass = compileSass;
exports.sassMin = compileSassMin;
exports.build = build;
exports.buildMin = buildMin;
exports.dev = dev;
exports.default = dev; 