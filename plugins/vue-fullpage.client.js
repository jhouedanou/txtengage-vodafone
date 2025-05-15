import { defineNuxtPlugin } from '#app'
import VueFullPage from 'vue-fullpage.js'
import 'fullpage.js/dist/fullpage.css'

export default defineNuxtPlugin(nuxtApp => {
  // Vue 3 fonctionne avec .use au lieu de Vue.use
  nuxtApp.vueApp.use(VueFullPage)
})
