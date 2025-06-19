import { ref, onMounted } from 'vue'

export function useSlides() {
    const slides = ref(null)
    const loading = ref(true)
    const cache = ref(null)
    const error = ref(null)
    const usingFallback = ref(false)

    const fetchSlides = async () => {
        if (cache.value) {
            slides.value = cache.value
            loading.value = false
            return
        }

        try {
            // Essayer d'abord de charger depuis l'API en ligne
            const response = await fetch('https://txtengage.co.za/backend/wp-json/slides/v1/all', {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                // Ajouter un timeout pour ne pas attendre trop longtemps
                signal: AbortSignal.timeout(5000)
            })
            
            if (!response.ok) {
                throw new Error(`Erreur de réponse API: ${response.status}`)
            }
            
            const data = await response.json()
            cache.value = data
            slides.value = data
            console.log('Slides chargés depuis l\'API en ligne')
        } catch (apiError) {
            console.error('Erreur lors du chargement des slides depuis l\'API:', apiError)
            error.value = apiError.message
            
            try {
                // Utiliser le fichier fallback.json en cas d'échec
                console.log('Tentative de chargement du fichier fallback.json...')
                const fallbackResponse = await fetch('/fallback.json')
                
                if (!fallbackResponse.ok) {
                    throw new Error(`Erreur lors du chargement du fichier fallback: ${fallbackResponse.status}`)
                }
                
                const fallbackData = await fallbackResponse.json()
                cache.value = fallbackData
                slides.value = fallbackData
                usingFallback.value = true
                console.log('Slides chargés depuis le fichier fallback.json')
            } catch (fallbackError) {
                console.error('Erreur lors du chargement du fichier fallback:', fallbackError)
                error.value = `${apiError.message}. Fallback également échoué: ${fallbackError.message}`
            }
        } finally {
            loading.value = false
        }
    }

    // Validation des données pour s'assurer qu'elles sont correctement formatées
    const validateData = (data) => {
        if (!Array.isArray(data)) {
            console.error('Les données des slides ne sont pas un tableau')
            return false
        }
        return data.every(slide => 
            slide && 
            typeof slide === 'object' && 
            'id' in slide && 
            'slide_number' in slide
        )
    }

    return {
        slides,
        loading,
        error,
        usingFallback,
        fetchSlides
    }
}
