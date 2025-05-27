import gulp from 'gulp';
import gulpSass from 'gulp-sass';
import * as sass from 'sass';
import sourcemaps from 'gulp-sourcemaps';
import browserSync from 'browser-sync';
import autoprefixer from 'gulp-autoprefixer';
import cleanCSS from 'gulp-clean-css';
import rename from 'gulp-rename';

const sassCompiler = gulpSass(sass);
const { src, dest, watch, series, parallel } = gulp;
const browser = browserSync.create();

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
    return src(paths.scss.main)
        .pipe(sourcemaps.init())
        .pipe(sassCompiler({
            outputStyle: 'expanded',
            precision: 8
        }).on('error', sassCompiler.logError))
        .pipe(autoprefixer({
            cascade: false
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(dest(paths.scss.dest))
        .pipe(browser.stream()); // Injection CSS à chaud
}

// Compilation SCSS minifiée pour production
function compileSassMin() {
    return src(paths.scss.main)
        .pipe(sassCompiler({
            outputStyle: 'compressed'
        }).on('error', sassCompiler.logError))
        .pipe(autoprefixer({
            cascade: false
        }))
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(rename({suffix: '.min'}))
        .pipe(dest(paths.scss.dest))
        .pipe(browser.stream());
}

// Initialisation de BrowserSync
function browserSyncInit() {
    browser.init({
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
    browser.reload();
    done();
}

// Surveillance des fichiers
function watchFiles() {
    watch(paths.scss.src, compileSass);
    watch([paths.html, paths.js], browserSyncReload);
}

// Tâches publiques
const build = series(compileSass);
const buildMin = series(compileSassMin);
const dev = series(compileSass, parallel(browserSyncInit, watchFiles));

// Exports
export { compileSass as sass };
export { compileSassMin as sassMin };
export { build };
export { buildMin };
export { dev };
export { dev as default }; 