// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  
  // Configuration pour le déploiement sous /txtengage/
  app: {
    baseURL: process.env.NODE_ENV === 'production' ? '/txtengage/' : '/',
    buildAssetsDir: '/txtengage/_nuxt/',
    head: {
      meta: [
        // Dark mode prevention meta tags for Android Samsung
        { name: 'color-scheme', content: 'light' },
        { name: 'supported-color-schemes', content: 'light' },
        { name: 'theme-color', content: '#e60000' },
        { name: 'msapplication-navbutton-color', content: '#e60000' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'light-content' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        // Additional Samsung Internet specific
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'format-detection', content: 'telephone=no' },
        // Viewport meta for proper rendering with landscape orientation for tablets
        { name: 'viewport', content: 'width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover, orientation=landscape' }
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700;800&display=swap'
        },
        // Additional theme color link for browsers
        { rel: 'mask-icon', href: '/favicon.svg', color: '#e60000' }
      ],
      script: [
        {
          src: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'
        },
        // Inline script to prevent dark mode forcing
        {
          innerHTML: `
            // Prevent dark mode forcing on Android Samsung
            (function() {
              if (typeof document !== 'undefined') {
                // Force light color scheme
                document.documentElement.style.setProperty('color-scheme', 'light', 'important');
                document.documentElement.style.setProperty('forced-color-adjust', 'none', 'important');
                
                // Samsung Internet specific detection and prevention
                if (navigator.userAgent.includes('SamsungBrowser')) {
                  document.documentElement.setAttribute('data-samsung-browser', 'true');
                  const style = document.createElement('style');
                  style.textContent = \`
                    * {
                      color-scheme: light !important;
                      forced-color-adjust: none !important;
                      -webkit-forced-color-adjust: none !important;
                    }
                    .split-container ul li {
                      color: #e60000 !important;
                      -webkit-text-fill-color: #e60000 !important;
                    }
                  \`;
                  document.head.appendChild(style);
                }
              }
            })();
          `,
          type: 'text/javascript'
        }
      ]
    }
  },

  // Configuration pour la génération statique Vercel
  nitro: {
    output: {
      dir: '.vercel/static/txtengage',
      publicDir: '.vercel/static/txtengage'
    },
    prerender: {
      failOnError: false,
      crawlLinks: true,
      routes: ['/'],
    }
  },

  // Assets et ressources
  css: [
    '~/assets/scss/style.scss',
    'bootstrap/dist/css/bootstrap.min.css'
  ],

  // Configuration des routes pour SPA
  ssr: false, // Mode SPA pour compatibilité Vercel Static
  target: 'static',

  // Configuration des assets publics
  runtimeConfig: {
    public: {
      apiUrl: process.env.API_URL || 'https://dev-txtengagevodafone.pantheonsite.io/wp-json/wp/v2',
      baseURL: process.env.NODE_ENV === 'production' ? '/txtengage/' : '/'
    }
  },

  // Configuration des assets
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            $asset-base: "${process.env.NODE_ENV === 'production' ? '/txtengage' : ''}";
          `
        }
      }
    },
    build: {
      assetsDir: '_nuxt'
    },
    define: {
      'process.env.DEBUG': false,
    },
    css: {
      devSourcemap: true,
      preprocessorOptions: {
        scss: {
          sourceMap: true,
          outputStyle: 'expanded',
          charset: false
        }
      },
      // Améliorer la précision des sourcemaps pour l'édition dans Chrome
      build: {
        sourcemap: true,
        cssCodeSplit: true
      }
    }
  },

  build: {
    transpile: ['gsap'],
    cssSourceMap: true,
    extractCSS: true
  },
  
  // Ajouter la configuration pour les sourcemaps quand l'environnement le demande
  postcss: {
    sourceMap: process.env.NUXT_PUBLIC_SOURCEMAP === 'true'
  },
  
  modules: ['@pinia/nuxt', '@nuxt/image'],

  // Enregistrer nos plugins
  plugins: [
    // '~/plugins/dark-mode-prevention.client.ts'
  ],

  image: {
    // Configuration spécifique pour le module @nuxt/image
    provider: 'ipx',
    ipx: {
      // Ne pas traiter les SVG
      modifiers: {
        format: {
          // Exclure les SVG du traitement de conversion
          validateFormat(format) {
            if (!format) return false;
            return ['jpeg', 'jpg', 'png', 'webp', 'avif', 'gif'].includes(format.toLowerCase());
          }
        }
      }
    },
    // Options pour les formats d'images
    format: ['webp', 'jpg', 'png', 'jpeg'],
    // Désactiver complètement le traitement des SVG
    dir: 'public',
    // Éviter la conversion des SVG
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536
    },
    // Ajouter cette configuration pour les fichiers statiques
    domains: ['vercel.app'],
    staticFilePath: true
  },
  
  // Configuration publique
  publicRuntimeConfig: {
    // Configuration retirée car fullpage.js n'est plus utilisé
  }
})
