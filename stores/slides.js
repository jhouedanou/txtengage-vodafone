import { defineStore } from 'pinia'

// Configuration de l'URL de l'API
const API_URL = 'https://txtengage.co.za/backend/wp-json/slides/v1/all'

// Données de secours simplifiées en cas d'échec TOTAL de chargement (pas même de fichier fallback)
const MINIMAL_FALLBACK = [
  {
    id: 73,
    title: "Bienvenue sur TXT Engage",
    wp_content: "Chargement des données en cours...",
    slide_number: 1,
    menuTitle: "Accueil"
  }
]

export const useSlidesStore = defineStore('slides', {
  state: () => ({
    slides: null,
    loading: true,
    lastFetch: null,
    error: null,
    usingFallback: false
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
      const tryFetchData = async (url, timeout = 5000) => {
        try {
          console.log('Tentative de connexion à:', url)
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), timeout)
          
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
        // Charger directement depuis l'API de production
        const result = await tryFetchData(API_URL)
        
        if (result.success) {
          // Mettre à jour le store et le cache
          this.slides = result.data
          this.lastFetch = Date.now()
          this.usingFallback = false
          localStorage.setItem('slides-cache', JSON.stringify(result.data))
          localStorage.setItem('slides-timestamp', Date.now().toString())
          console.log('%c✓ Données chargées depuis l\'API', 'background: #4CAF50; color: white; padding: 5px; border-radius: 3px; font-weight: bold;')
        } else {
          // Si le chargement depuis l'API échoue, essayer le fichier fallback.json local
          console.warn('Échec de l\'API, tentative avec le fichier fallback.json')
          const fallbackResult = await tryFetchData('/fallback.json', 3000)
          
          if (fallbackResult.success) {
            // Utiliser les données du fichier fallback
            this.slides = fallbackResult.data
            this.lastFetch = Date.now()
            this.usingFallback = true
            
            // Afficher un message très visible dans la console
            console.log('%c⚠️ FALLBACK.JSON EST UTILISÉ', 'background: #FF9800; color: white; padding: 10px; border-radius: 3px; font-size: 16px; font-weight: bold;')
            console.log('%cLes arrière-plans et certaines fonctionnalités peuvent ne pas s\'afficher correctement', 'color: #FF9800; font-weight: bold;')
            
            // Mettre à jour le cache avec les données de fallback
            localStorage.setItem('slides-cache', JSON.stringify(fallbackResult.data))
            localStorage.setItem('slides-timestamp', Date.now().toString())
            
            // Vérifier et corriger les valeurs manquantes dans les données de fallback
            this.slides = this.verifyAndFixFallbackData(fallbackResult.data)
          } else {
            // Si le chargement du fichier fallback échoue également
            console.error('Impossible de charger les données, utilisation du cache ou du fallback minimal')
            this.error = "Impossible de charger les données depuis le serveur ou le fallback"
            
            // Utiliser les données en cache même si elles sont périmées ou les données de secours minimales
            if (cachedData) {
              this.slides = JSON.parse(cachedData)
              console.log('%c⚠️ Utilisation du CACHE PÉRIMÉ', 'background: #F44336; color: white; padding: 5px; border-radius: 3px; font-weight: bold;')
            } else {
              this.slides = MINIMAL_FALLBACK
              console.error('%c⚠️ Utilisation du FALLBACK MINIMAL', 'background: #F44336; color: white; padding: 5px; border-radius: 3px; font-weight: bold;')
            }
            this.usingFallback = true
          }
        }
      } catch (error) {
        console.error('Erreur critique lors du chargement des slides:', error)
        this.error = "Erreur critique lors du chargement des données"
        
        // Essayer d'utiliser le cache en dernier recours
        if (cachedData) {
          this.slides = JSON.parse(cachedData)
          console.log('%c⚠️ Utilisation du CACHE après erreur critique', 'background: #F44336; color: white; padding: 5px; border-radius: 3px; font-weight: bold;')
        } else {
          this.slides = MINIMAL_FALLBACK
          console.error('%c⚠️ Utilisation du FALLBACK MINIMAL après erreur critique', 'background: #F44336; color: white; padding: 5px; border-radius: 3px; font-weight: bold;')
        }
        this.usingFallback = true
      } finally {
        this.loading = false
      }
    },

    // Nouvelle fonction pour vérifier et corriger les données de fallback
    verifyAndFixFallbackData(data) {
      if (!Array.isArray(data)) {
        console.error('Les données ne sont pas un tableau, utilisation du fallback minimal')
        return MINIMAL_FALLBACK
      }

      return data.map(slide => {
        // Assurons-nous que toutes les propriétés essentielles sont définies
        const fixedSlide = { ...slide }
        
        // Corriger les URLs des images si nécessaires
        if (fixedSlide.thumbnail === false || fixedSlide.thumbnail === null || fixedSlide.thumbnail === 'false') {
          // Attribuer une image par défaut basée sur l'ID du slide
          const defaultBackgrounds = {
            73: '/images/istockphoto_1424819867_1024x1024_1_a18029.webp',
            20: '/images/istock_1181760380_edited_1_ab7579.webp',
            21: '/images/istock_2157255373_red_edit_1_87e490.webp',
            22: '/images/image_5_1_0c47b9.webp',
            23: '/images/bg5.webp',
            59: '/images/iStock-1147284430-1.jpg',
            128: '/images/screenshot_2025_02_12_at_20_42_34_4_b0013c-1.webp',
            60: '/images/contactus_background_1_f98084.webp',
            // Ajouter d'autres ID si nécessaire
          }
          fixedSlide.thumbnail = defaultBackgrounds[fixedSlide.id] || '/images/bg12.webp'
          console.log(`Correction de l'arrière-plan pour la slide ${fixedSlide.id} avec l'image ${fixedSlide.thumbnail}`)
        }
        
        if (fixedSlide.backgroundMobile === false || fixedSlide.backgroundMobile === null || fixedSlide.backgroundMobile === 'false') {
          // Pour mobile, utiliser la même image que pour desktop si aucune n'est spécifiée
          fixedSlide.backgroundMobile = fixedSlide.thumbnail || '/images/bgmbile.webp'
        }
        
        return fixedSlide
      })
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
