import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(nuxtApp => {
  if (process.client) {
    // Import ScrollMagic uniquement côté client
    const scrollMagicPromise = import('scrollmagic').then(m => m.default || m)
    
    // Ajouter GSAP plugin pour ScrollMagic si nécessaire
    const scrollMagicGSAPPromise = import('scrollmagic-plugin-gsap')
    
    // Exécuter les promesses
    Promise.all([scrollMagicPromise, scrollMagicGSAPPromise]).then(([ScrollMagic]) => {
      // Rendre disponible globalement pour l'application
      window.ScrollMagic = ScrollMagic
      
      // En mode développement, ajouter les plugins de débogage pour ScrollMagic
      if (process.env.NODE_ENV !== 'production') {
        import('scrollmagic/scrollmagic/uncompressed/plugins/debug.addIndicators')
          .catch(error => console.warn('Impossible de charger les indicateurs de débogage ScrollMagic:', error))
      }
    })
  }
})