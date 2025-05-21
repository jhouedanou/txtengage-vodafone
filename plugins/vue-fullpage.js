import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  // Importer fullpage uniquement côté client pour éviter les erreurs SSR
  if (process.client) {
    import('vue-fullpage.js').then((VueFullPage) => {
      nuxtApp.vueApp.use(VueFullPage.default)
      import('fullpage.js/dist/fullpage.css')
    })
  }
})