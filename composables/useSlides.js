import { ref, onMounted } from 'vue'

export function useSlides() {
    const slides = ref(null)
    const loading = ref(true)
    const cache = ref(null)

    const fetchSlides = async () => {
        if (cache.value) {
            slides.value = cache.value
            loading.value = false
            return
        }

        try {
            const response = await fetch('https://bfedition.com/vodafone/wp-json/slides/v1/all')
            const data = await response.json()
            cache.value = data
            slides.value = data
        } catch (error) {
            console.error('Erreur lors du chargement des slides:', error)
        } finally {
            loading.value = false
        }
    }

    return {
        slides,
        loading,
        fetchSlides
    }
}
