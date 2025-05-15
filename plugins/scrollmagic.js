export default async ({ app }) => {
  if (process.client) {
    // Import ScrollMagic uniquement côté client
    const ScrollMagic = await import('scrollmagic').then(m => m.default || m)
    
    // Ajouter GSAP plugin pour ScrollMagic si nécessaire
    const ScrollMagicGSAP = await import('scrollmagic/scrollmagic/uncompressed/plugins/animation.gsap')
    
    // Rendre disponible globalement pour l'application
    window.ScrollMagic = ScrollMagic
  }
}