<template>
  <div class="custom-scrollbar-container" ref="scrollbarContainer">
    <div class="custom-scrollbar">
      <div 
        class="custom-scrollbar-thumb" 
        ref="scrollThumb"
        :style="{ 
          [isDesktop ? 'height' : 'width']: thumbSize + '%', 
          [isDesktop ? 'top' : 'left']: thumbPosition + '%',
          transform: isDesktop ? 'scale(1.2,1)' : 'scale(1,1.2)'
        }"
        @mousedown="startDrag"
        @touchstart="startTouchDrag"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import gsap from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'

// Enregistrer le plugin ScrollToPlugin si on est côté client
if (process.client) {
  gsap.registerPlugin(ScrollToPlugin)
}

const props = defineProps({
  scrollContainer: {
    type: Object,
    default: null
  },
  activeSection: {
    type: Number,
    default: 0
  },
  totalSections: {
    type: Number,
    default: 0
  }
})

const scrollbarContainer = ref(null)
const scrollThumb = ref(null)
const thumbPosition = ref(0)
const thumbSize = ref(10) // Taille initiale en pourcentage
const isDragging = ref(false)
const startPosition = ref(0)
const startCoord = ref(0)
const isDesktop = ref(true)

// Détecter si on est sur desktop ou mobile
const checkDeviceType = () => {
  // Appliquer un délai pour éviter de multiples changements rapides
  clearTimeout(window.resizeTimer)
  window.resizeTimer = setTimeout(() => {
    const wasDesktop = isDesktop.value
    isDesktop.value = window.innerWidth >= 768
    
    // Si le mode a changé, réinitialiser le curseur pour éviter des problèmes de position
    if (wasDesktop !== isDesktop.value) {
      // Réinitialiser temporairement la position pour aider à l'animation
      thumbPosition.value = 0
      
      // Après un court délai, rétablir la position correcte
      setTimeout(() => {
        updateThumbPosition(props.activeSection)
      }, 100)
    }
  }, 150)
}

// Calcule la position du curseur en fonction de la section active
watch(() => props.activeSection, (newSection) => {
  if (!isDragging.value) {
    updateThumbPosition(newSection)
  }
})

// Met à jour la position du curseur
const updateThumbPosition = (sectionIndex) => {
  if (props.totalSections <= 1) {
    thumbPosition.value = 0
    return
  }
  
  const maxPosition = 100 - thumbSize.value
  thumbPosition.value = (sectionIndex / (props.totalSections - 1)) * maxPosition
}

// Navigation vers une section spécifique
const goToSection = (position) => {
  if (props.totalSections <= 1) return
  
  const maxPosition = 100 - thumbSize.value
  const sectionIndex = Math.round((position / maxPosition) * (props.totalSections - 1))
  
  // Utiliser les fonctions de navigation de ScrollTrigger
  try {
    // Evénement personnalisé pour informer le composant parent qu'on veut changer de section
    const event = new CustomEvent('navigateToSection', { detail: { index: sectionIndex } })
    document.dispatchEvent(event)
    
    // Ou directement sélectionner la section et faire défiler vers elle
    const sections = document.querySelectorAll('.section')
    if (sections && sections[sectionIndex]) {
      // Mettre à jour les classes pour l'animation
      document.querySelectorAll('.section').forEach((section, idx) => {
        section.classList.toggle('active', idx === sectionIndex)
        section.classList.toggle('in-view', idx === sectionIndex)
      })
      
      // Animation pour le défilement
      gsap.to(window, {
        duration: 1,
        scrollTo: { y: sections[sectionIndex], autoKill: true },
        ease: 'power2.inOut'
      })
    }
  } catch (error) {
    console.error('Erreur lors de la navigation vers la section:', error)
    
    // Fallback au défilement natif en cas d'erreur
    const sections = document.querySelectorAll('.section')
    if (sections && sections[sectionIndex]) {
      sections[sectionIndex].scrollIntoView({ behavior: 'smooth' })
    }
  }
}

// Commencer le glissement du curseur avec la souris
const startDrag = (e) => {
  e.preventDefault()
  isDragging.value = true
  startCoord.value = isDesktop.value ? e.clientY : e.clientX
  startPosition.value = thumbPosition.value
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', endDrag)
}

// Commencer le glissement du curseur au toucher
const startTouchDrag = (e) => {
  e.preventDefault()
  isDragging.value = true
  const touch = e.touches[0]
  startCoord.value = isDesktop.value ? touch.clientY : touch.clientX
  startPosition.value = thumbPosition.value
  
  document.addEventListener('touchmove', onTouchDrag)
  document.addEventListener('touchend', endTouchDrag)
}

// Pendant le glissement avec souris
const onDrag = (e) => {
  if (!isDragging.value) return
  
  const containerSize = isDesktop.value 
    ? scrollbarContainer.value.offsetHeight 
    : scrollbarContainer.value.offsetWidth
  
  const delta = isDesktop.value 
    ? e.clientY - startCoord.value 
    : e.clientX - startCoord.value
  
  const deltaPercent = (delta / containerSize) * 100
  
  let newPosition = startPosition.value + deltaPercent
  newPosition = Math.max(0, Math.min(newPosition, 100 - thumbSize.value))
  thumbPosition.value = newPosition
  
  goToSection(newPosition)
}

// Pendant le glissement au toucher
const onTouchDrag = (e) => {
  if (!isDragging.value) return
  
  const touch = e.touches[0]
  const containerSize = isDesktop.value 
    ? scrollbarContainer.value.offsetHeight 
    : scrollbarContainer.value.offsetWidth
  
  const delta = isDesktop.value 
    ? touch.clientY - startCoord.value 
    : touch.clientX - startCoord.value
  
  const deltaPercent = (delta / containerSize) * 100
  
  let newPosition = startPosition.value + deltaPercent
  newPosition = Math.max(0, Math.min(newPosition, 100 - thumbSize.value))
  thumbPosition.value = newPosition
  
  goToSection(newPosition)
}

// Fin du glissement souris
const endDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', endDrag)
}

// Fin du glissement toucher
const endTouchDrag = () => {
  isDragging.value = false
  document.removeEventListener('touchmove', onTouchDrag)
  document.removeEventListener('touchend', endTouchDrag)
}

// Mise à jour lors du montage du composant
onMounted(() => {
  // Vérifier type d'appareil
  checkDeviceType()
  window.addEventListener('resize', checkDeviceType)
  
  // Calculer la taille du curseur en fonction du nombre de sections
  if (props.totalSections > 0) {
    // Plus le nombre de sections est élevé, plus le curseur est petit
    thumbSize.value = Math.max(5, Math.min(20, 100 / props.totalSections))
  }
  
  updateThumbPosition(props.activeSection)
  
  // Ajouter un écouteur de défilement pour mettre à jour la position du curseur
  window.addEventListener('scroll', handleScroll)
})

// Gérer le défilement pour mettre à jour la position du curseur (compatible avec Swiper)
const handleScroll = () => {
  if (isDragging.value) return
  
  // Si Swiper est disponible, utiliser son API
  if (props.swiperRef && props.swiperRef.swiper) {
    // Swiper gère automatiquement le défilement - nous devons juste suivre l'index actif
    updateThumbPosition(props.swiperRef.swiper.activeIndex)
    return
  }
  
  // Fallback: détection manuelle des slides visibles
  const slides = document.querySelectorAll('.swiper-slide')
  const scrollPosition = window.scrollY
  
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]
    const slideTop = slide.offsetTop
    const slideHeight = slide.offsetHeight
    
    // Déterminer si la slide est visible
    if (scrollPosition >= slideTop - window.innerHeight / 2 && 
        scrollPosition < slideTop + slideHeight - window.innerHeight / 2) {
      updateThumbPosition(i)
      break
    }
  }
}

// Nettoyage des écouteurs d'événements
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchmove', onTouchDrag)
  document.removeEventListener('touchend', endTouchDrag)
  window.removeEventListener('resize', checkDeviceType)
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.custom-scrollbar-container {
  position: fixed;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.5s cubic-bezier(0.645, 0.045, 0.355, 1); /* Animation fluide */
}

.custom-scrollbar {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  position: relative;
  backdrop-filter: blur(5px);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  transition: all 0.5s cubic-bezier(0.645, 0.045, 0.355, 1); /* Animation fluide */
}

.custom-scrollbar-thumb {
  background: #e60000; /* Rouge Vodafone */
  border-radius: 2px;
  position: absolute;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1); /* Animation fluide */
}

.custom-scrollbar-thumb:hover,
.custom-scrollbar-thumb:active {
  background: #ff0000;
}

/* Style Desktop (vertical à droite) */
@media (min-width: 768px) {
  .custom-scrollbar-container {
    top: 50%;
    right: 20px;
    transform: translateY(-50%);
    height: 60%;
    max-height: 600px;
    width: 20px;
    transition: all 0.5s cubic-bezier(0.645, 0.045, 0.355, 1);
  }
  
  .custom-scrollbar {
    width: 4px;
    height: 100%;
    transition: all 0.5s cubic-bezier(0.645, 0.045, 0.355, 1);
  }
  
  .custom-scrollbar-thumb {
    width: 100%;
    left: 0;
    transition: all 0.5s cubic-bezier(0.645, 0.045, 0.355, 1);
  }
}

/* Style Mobile (horizontal en bas) */
@media (max-width: 767px) {
  .custom-scrollbar-container {
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 70%;
    max-width: 300px;
    height: 20px;
    transition: all 0.5s cubic-bezier(0.645, 0.045, 0.355, 1);
  }
  
  .custom-scrollbar {
    height: 4px;
    width: 100%;
    transition: all 0.5s cubic-bezier(0.645, 0.045, 0.355, 1);
  }
  
  .custom-scrollbar-thumb {
    height: 100%;
    top: 0;
    transition: all 0.5s cubic-bezier(0.645, 0.045, 0.355, 1);
  }
}
</style>
