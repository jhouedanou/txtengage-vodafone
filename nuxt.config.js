// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  css: [
    'bootstrap/dist/css/bootstrap.min.css',
    '@/assets/scss/style.scss'
  ],
  
  vite: {
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
  
  nitro: {
    preset: 'vercel',
    prerender: {
      failOnError: false,
      crawlLinks: true,
      routes: ['/'],
    }
  },
  ssr: false,
  target: 'static',  
  app: {
    head: {
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700;800&display=swap'
        }
      ],
      script: [
        {
          src: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'
        }
      ]
    }
  },

  modules: ['@pinia/nuxt', '@nuxt/image'],

  // Enregistrer nos plugins
  plugins: [
    { src: '~/plugins/scrollmagic.js', mode: 'client' }
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