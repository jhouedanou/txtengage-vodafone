import { defineStore } from 'pinia'

// Configuration des URLs de l'API
const API_URLS = {
  local: 'http://localhost/vodafone/wp-json/slides/v1/all', // URL pour WAMP
  production: 'https://bfedition.com/vodafone/wp-json/slides/v1/all'
}

// Données de secours par défaut en cas d'échec total de chargement
const FALLBACK_SLIDES = [
  // Ajoutez ici quelques slides de base pour éviter une page vide
  {
    id: 73,
    title: "Bienvenue sur TXT Engage",
    wp_content: "Chargement des données en cours...",
    slide_number: 1,
    menuTitle: "Accueil"
  },
  // Ajoutez d'autres slides de base selon vos besoins
]

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
    lastFetch: null,
    error: null
  }),
  
  actions: {
    async fetchSlides() {
      this.loading = true
      this.error = null
      
      // Vérifier le cache localStorage
      const cachedData = localStorage.getItem('slides-cache')
      const cachedTimestamp = localStorage.getItem('slides-timestamp')
      
      // Si les données sont en cache et ont moins de 5 minutes
      if (cachedData && cachedTimestamp) {
        const isValid = Date.now() - parseInt(cachedTimestamp) < 5 * 60 * 1000
        if (isValid) {
          try {
            this.slides = JSON.parse(cachedData)
            this.loading = false
            return
          } catch (e) {
            console.warn('Cache corrompu, rechargement des données')
            localStorage.removeItem('slides-cache')
            localStorage.removeItem('slides-timestamp')
          }
        }
      }

      // Fonction pour tenter de charger depuis une URL spécifique
      const tryFetchFromUrl = async (url) => {
        try {
          console.log('Tentative de connexion à:', url)
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000) // Timeout de 5 secondes
          
          const response = await fetch(url, { signal: controller.signal })
          clearTimeout(timeoutId)
          
          if (!response.ok) {
            throw new Error(`Réponse HTTP non valide: ${response.status}`)
          }
          
          const data = await response.json()
          return { success: true, data }
        } catch (error) {
          console.warn(`Échec de chargement depuis ${url}:`, error)
          return { success: false, error }
        }
      }

      try {
        // Déterminer si nous sommes en environnement local
        const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        
        // Essayer d'abord l'URL appropriée selon l'environnement
        const primaryUrl = isLocalDev ? API_URLS.local : API_URLS.production
        let result = await tryFetchFromUrl(primaryUrl)
        
        // Si en local et que ça échoue, essayer l'URL de production comme fallback
        if (!result.success && isLocalDev) {
          console.log('Échec du chargement local, tentative avec l\'URL de production')
          result = await tryFetchFromUrl(API_URLS.production)
        }
        
        if (result.success) {
          // Mettre à jour le store et le cache
          this.slides = result.data
          this.lastFetch = Date.now()
          localStorage.setItem('slides-cache', JSON.stringify(result.data))
          localStorage.setItem('slides-timestamp', Date.now().toString())
        } else {
          // Si le chargement échoue complètement, utiliser les données de secours
          console.error('Impossible de charger les données, utilisation du fallback')
          this.error = "Impossible de charger les données depuis le serveur"
          
          // Utiliser les données en cache même si elles sont périmées ou les données de secours
          if (cachedData) {
            this.slides = JSON.parse(cachedData)
          } else {
            this.slides = FALLBACK_SLIDES
          }
        }
      } catch (error) {
        console.error('Erreur critique lors du chargement des slides:', error)
        this.error = "Erreur critique lors du chargement des données"
        this.slides = FALLBACK_SLIDES
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
