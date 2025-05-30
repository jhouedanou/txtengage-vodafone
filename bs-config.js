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
        {
            match: ["**/*.css", "**/*.scss"],
            fn: function (event, file) {
                if (event === "change") {
                    this.reload("*.css");
                }
            }
        },
        {
            match: ["**/*.html", "**/*.php", "**/*.js", "**/*.vue"],
            fn: function (event, file) {
                if (event === "change") {
                    this.reload();
                }
            }
        }
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
    "reloadDelay": 0,
    "injectChanges": true, // Active l'injection CSS à chaud
    "reloadOnRestart": true,
    "snippetOptions": {
        rule: {
            match: /<\/head>/i,
            fn: function (snippet, match) {
                return snippet + match;
            }
        }
    }
};
