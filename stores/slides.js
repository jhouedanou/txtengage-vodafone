import { defineStore } from 'pinia'

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
        const response = await fetch('https://bfedition.com/vodafone/wp-json/slides/v1/all')
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
