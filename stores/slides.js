import { defineStore } from 'pinia'

// Configuration de l'URL de l'API
const API_URL = 'https://bfedition.com/vodafone/wp-json/slides/v1/all'

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

      // Fonction pour tenter de charger depuis l'API
      const tryFetchData = async () => {
        try {
          console.log('Tentative de connexion à:', API_URL)
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000) // Timeout de 5 secondes
          
          const response = await fetch(API_URL, { signal: controller.signal })
          clearTimeout(timeoutId)
          
          if (!response.ok) {
            throw new Error(`Réponse HTTP non valide: ${response.status}`)
          }
          
          const data = await response.json()
          return { success: true, data }
        } catch (error) {
          console.warn(`Échec de chargement depuis ${API_URL}:`, error)
          return { success: false, error }
        }
      }

      try {
        // Charger directement depuis l'API de production
        const result = await tryFetchData()
        
        if (result.success) {
          // Mettre à jour le store et le cache
          this.slides = result.data
          this.lastFetch = Date.now()
          localStorage.setItem('slides-cache', JSON.stringify(result.data))
          localStorage.setItem('slides-timestamp', Date.now().toString())
        } else {
          // Si le chargement échoue, utiliser les données de secours
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
      
      // Trier les slides par numéro
      const sortedArray = [...state.slides].sort((a, b) => a.slide_number - b.slide_number)
      
      // Trouver l'index de la slide avec ID 114 (si elle existe)
      const slide114Index = sortedArray.findIndex(slide => slide.id === 114)
      
      // Si la slide 114 existe, la déplacer juste après la slide avec ID 20
      if (slide114Index !== -1) {
        const slide114 = sortedArray.splice(slide114Index, 1)[0]
        const slide20Index = sortedArray.findIndex(slide => slide.id === 20)
        
        if (slide20Index !== -1) {
          // Insérer après la slide 20
          sortedArray.splice(slide20Index + 1, 0, slide114)
        } else {
          // Si slide 20 n'est pas trouvée, remettre à sa position d'origine
          sortedArray.push(slide114)
        }
      }
      
      return sortedArray
    }
  }
})
