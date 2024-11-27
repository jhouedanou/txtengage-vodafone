// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  css: [
    'bootstrap/dist/css/bootstrap.min.css',
    '@/assets/css/style.scss'
  ],
  
  vite: {
    define: {
      'process.env.DEBUG': false,
    },
  },

  build: {
    transpile: ['gsap']
  },

  app: {
    head: {
      script: [
        {
          src: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'
        }
      ]
    }
  }
})
