/*
 |--------------------------------------------------------------------------
 | Browser-sync config file
 |--------------------------------------------------------------------------
 |
 | For up-to-date information about the options:
 |   http://www.browsersync.io/docs/options/
 |
 */
module.exports = {
    "ui": {
        "port": 3001
    },
    "files": [
        "pages/**/*.vue",
        "components/**/*.vue", 
        "assets/**/*.scss",
        "assets/**/*.css",
        "plugins/**/*.js",
        "composables/**/*.js",
        "utils/**/*.js"
    ],
    "ignore": [
        "dist/**/*",
        ".output/**/*",
        ".nuxt/**/*",
        "txtengage/**/*",
        "node_modules/**/*"
    ],
    "watchEvents": [
        "change"
    ],
    "proxy": "http://localhost:3000", // Proxy vers le serveur de développement Nuxt
    "port": 3333, // Port différent pour éviter les conflits avec Nuxt
    "notify": false,
    "open": "local",
    "ghostMode": {
        "clicks": true,
        "forms": true,
        "scroll": true
    },
    "logLevel": "info",
    "logPrefix": "Vodafone Dev",
    "logConnections": false,
    "reloadDelay": 0,
    "injectChanges": true, // Hot injection des CSS
    "reloadOnRestart": true
};
