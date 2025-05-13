import { defineStore } from 'pinia'

// Configuration des URLs de l'API
const API_URLS = {
  local: 'http://localhost/vodafone/wp-json/slides/v1/all', // URL pour WAMP
  production: 'https://bfedition.com/vodafone/wp-json/slides/v1/all'
}

// Choisir l'URL en fonction du mode de développement ou de la configuration
const getApiUrl = () => {
  // Utilisez une variable d'environnement ou un paramètre pour choisir l'environnement
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  return isLocalDev ? API_URLS.local : API_URLS.production
}

export const useSlidesStore = defineStore('slides', {
  state: () => ({
    slides: null,
    loading: true,
    lastFetch: null
  }),
  
  actions: {
    async fetchSlides() {
      // Vérifier le cache localStorage
      const cachedData = localStorage.getItem('slides-cache')
      const cachedTimestamp = localStorage.getItem('slides-timestamp')
      
      // Si les données sont en cache et ont moins de 5 minutes
      if (cachedData && cachedTimestamp) {
        const isValid = Date.now() - parseInt(cachedTimestamp) < 5 * 60 * 1000
        if (isValid) {
          this.slides = JSON.parse(cachedData)
          this.loading = false
          return
        }
      }

      try {
        // Utiliser l'URL appropriée selon l'environnement
        const apiUrl = getApiUrl()
        console.log('Utilisation de l\'API:', apiUrl) // Pour le débogage
        
        const response = await fetch(apiUrl)
        const data = await response.json()
        
        // Mettre à jour le store et le cache
        this.slides = data
        this.lastFetch = Date.now()
        localStorage.setItem('slides-cache', JSON.stringify(data))
        localStorage.setItem('slides-timestamp', Date.now().toString())
      } catch (error) {
        console.error('Erreur de chargement:', error)
      } finally {
        this.loading = false
      }
    },

    startAutoRefresh() {
      // Rafraîchir toutes les 5 minutes
      setInterval(() => {
        this.fetchSlides()
      }, 5 * 60 * 1000)
    }
  },

  getters: {
    sortedSlides: (state) => {
      if (!state.slides) return []
      return [...state.slides].sort((a, b) => a.slide_number - b.slide_number)
    }
  }
})
