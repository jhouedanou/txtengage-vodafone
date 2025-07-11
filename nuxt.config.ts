// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  
  // Development configuration to prevent service worker caching issues
  ...(process.env.NODE_ENV === 'development' && {
    devServer: {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
  }),
  
  // Configuration pour le déploiement
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
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
        // Viewport meta for proper rendering - CORRIGÉ (sans orientation)
        { name: 'viewport', content: 'width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover' }
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700;800&display=swap'
        },
        { rel: 'mask-icon', href: '/favicon.svg', color: '#e60000' }
      ],
      script: [
        {
          src: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'
        }
      ]
    }
  },

  // Configuration simplifiée pour éviter les erreurs
  nitro: {
    prerender: {
      failOnError: false,
      crawlLinks: false,
      routes: ['/']
    }
  },

  // Assets et ressources
  css: [
    '~/assets/scss/style.scss',
    'bootstrap/dist/css/bootstrap.min.css'
  ],

  // Configuration pour la génération statique (SSG)
  ssr: true,
  
  // Configuration des assets publics
  runtimeConfig: {
    public: {
      apiUrl: process.env.API_URL || 'https://dev-txtengagevodafone.pantheonsite.io/wp-json/wp/v2',
      baseURL: process.env.NUXT_APP_BASE_URL || '/'
    }
  },

  build: {
    transpile: ['gsap']
  },
  
  modules: [
    '@pinia/nuxt'
  ],

  plugins: []
}) 