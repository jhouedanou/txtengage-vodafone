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
          outputStyle: 'expanded'
        }
      }
    }
  },

  build: {
    transpile: ['gsap'],
    cssSourceMap: true
  },
  nitro: {
    preset: 'vercel',
    prerender: {
      failOnError: true
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

  modules: ['@pinia/nuxt', '@nuxt/image']
})