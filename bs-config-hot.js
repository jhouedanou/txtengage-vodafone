/*
 |--------------------------------------------------------------------------
 | Browser-sync config file - Hot CSS Injection
 |--------------------------------------------------------------------------
 |
 | Configuration optimisée pour l'injection CSS à chaud
 | Utilise l'injection CSS sans rechargement de page
 |
 */
module.exports = {
    "ui": {
        "port": 3001
    },
    "files": [
        {
            // Pour les fichiers CSS/SCSS - injection à chaud
            match: [
                "assets/css/**/*.css",
                "assets/scss/**/*.scss"
            ],
            fn: function (event, file) {
                if (event === "change") {
                    console.log(`🔥 Hot CSS injection: ${file}`);
                    this.reload("*.css"); // Injecte seulement le CSS
                }
            }
        },
        {
            // Pour les autres fichiers - rechargement complet
            match: [
                "**/*.html", 
                "**/*.php", 
                "**/*.js", 
                "**/*.vue",
                "pages/**/*.vue",
                "components/**/*.vue",
                "layouts/**/*.vue"
            ],
            fn: function (event, file) {
                if (event === "change") {
                    console.log(`🔄 Full reload: ${file}`);
                    this.reload(); // Rechargement complet
                }
            }
        }
    ],
    "watchEvents": [
        "change"
    ],
    "proxy": "http://localhost:3000", // Proxy vers le serveur Nuxt
    "port": 3333,
    "notify": {
        styles: {
            top: 'auto',
            bottom: '0',
            borderBottomLeftRadius: '0'
        }
    },
    "open": "local",
    "ghostMode": {
        "clicks": false, // Désactivé pour éviter les conflits avec les SPAs
        "forms": false,
        "scroll": false
    },
    "logLevel": "info",
    "logPrefix": "🚀 Vodafone Hot",
    "logConnections": false,
    "reloadDelay": 200, // Petit délai pour éviter les reloads multiples
    "injectChanges": true, // ✅ Active l'injection CSS à chaud
    "reloadOnRestart": true,
    "snippetOptions": {
        rule: {
            match: /<\/head>/i,
            fn: function (snippet, match) {
                return snippet + match;
            }
        }
    },
    // Options avancées pour l'injection CSS
    "codeSync": false, // Désactivé pour de meilleures performances
    "timestamps": true,
    "injectFileTypes": ['css', 'png', 'jpg', 'jpeg', 'svg', 'gif', 'webp']
}; 