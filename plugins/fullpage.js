import { defineNuxtPlugin } from '#app'
import 'fullpage.js/dist/fullpage.css'

export default defineNuxtPlugin(async (nuxtApp) => {
  if (process.client) {
    try {
      // Importer fullpage.js et attendre sa résolution
      const fullpageModule = await import('fullpage.js')
      const fullpage = fullpageModule.default || fullpageModule
      
      // Exposer fullpage globalement pour les scripts qui s'attendent à le trouver sur window
      window.fullpage = (selector, options) => {
        // Vérifier que l'élément existe avant de tenter d'initialiser
        const element = typeof selector === 'string' ? document.querySelector(selector) : selector
        
        if (!element) {
          console.error(`L'élément DOM pour fullpage.js n'existe pas: ${selector}`)
          return null
        }
        
        // Vérifier que les sections existent avant d'initialiser
        const sections = element.querySelectorAll('.section')
        if (!sections || sections.length === 0) {
          console.error('Aucune section trouvée pour fullpage.js')
          return null
        }
        
        console.log(`Initialisation de fullpage.js avec ${sections.length} sections`)
        return new fullpage(selector, options)
      }
      
      // Exposer également via l'API de Nuxt
      nuxtApp.provide('fullpage', fullpage)
    } catch (error) {
      console.error('Erreur lors du chargement de fullpage.js:', error)
    }
  }
})