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
        "**/*.html",
        "**/*.php",
        "**/*.js",
        "**/*.vue",
        "**/*.css",
        "**/*.scss"
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
    "logPrefix": "Vodafone",
    "logConnections": false,
    "reloadDelay": 0
};
