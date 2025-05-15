<script setup>
import { onMounted, ref, computed, reactive, nextTick, onUnmounted, onBeforeUnmount, watch } from 'vue'
import { useSlidesStore } from '~/stores/slides'
import { useRuntimeConfig } from '#app'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import CustomScrollbar from '~/components/CustomScrollbar.vue'

// Enregistrer les plugins GSAP
if (process.client) {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)
}

// Récupérer les configurations
const config = useRuntimeConfig()

// Références d'instances et états
const containerRef = ref(null)
const sectionsRef = ref([])
const navRef = ref(null)
const currentIndex = ref(0)
const slidesStore = useSlidesStore()
const loading = computed(() => slidesStore.loading)
const showButton = ref(false)
const isAnimating = ref(false)
const scrollDirection = ref(null)

// Tri des slides
const sortedSlides = computed(() => {
  if (!slidesStore.slides) return []
  return [...slidesStore.slides].sort((a, b) => a.order - b.order)
})

// Calcul du nombre de sections
const sectionCount = computed(() => sortedSlides.value.length)

// Variables pour les slides spéciales
const slide73Progress = ref(0)
const slide73AnimationComplete = ref(false)

const slide21Progress = ref(0)
const slide21AnimationComplete = ref(false)

// Responsive design
const isMobile = ref(false)

const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 1025
}

// Navigation mobile
const isMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

// Précharger une image
const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Fonction pour aller à une section spécifique
const goToSection = (index) => {
  if (isAnimating.value) return
  
  isAnimating.value = true
  
  // S'assurer que l'index est dans les limites
  const targetIndex = Math.max(0, Math.min(index, sectionCount.value - 1))
  
  // Mettre à jour l'index courant
  currentIndex.value = targetIndex
  
  // Animer le défilement vers la section cible
  gsap.to(window, {
    duration: 1,
    scrollTo: { y: `#section-slide-${sortedSlides.value[targetIndex].id}`, autoKill: true },
    ease: 'power2.inOut',
    onComplete: () => {
      isAnimating.value = false
      // Mettre à jour la navigation
      updateNavigation(targetIndex)
    }
  })
}

// Mise à jour de la navigation
const updateNavigation = (index) => {
  // Mettre à jour la classe active dans la navigation
  if (navRef.value) {
    const navItems = navRef.value.querySelectorAll('.nav-item')
    navItems.forEach((item, i) => {
      if (i === index) {
        item.classList.add('active')
      } else {
        item.classList.remove('active')
      }
    })
  }
}

// Fonction pour gérer le défilement
const handleWheel = (event) => {
  if (isAnimating.value) {
    event.preventDefault()
    return
  }
  
  const delta = event.deltaY
  scrollDirection.value = delta > 0 ? 'down' : 'up'
  
  // Si nous sommes dans une section spéciale avec animation en cours
  if (currentIndex.value === sortedSlides.value.findIndex(slide => slide.id === 73) && !slide73AnimationComplete.value) {
    event.preventDefault()
    handleSlide73Scroll(delta)
    return
  }
  
  if (currentIndex.value === sortedSlides.value.findIndex(slide => slide.id === 21) && !slide21AnimationComplete.value) {
    event.preventDefault()
    handleSlide21Scroll(delta)
    return
  }
  
  // Sinon, gérer le défilement normal entre sections
  if (delta > 0 && currentIndex.value < sectionCount.value - 1) {
    // Défilement vers le bas
    event.preventDefault()
    goToSection(currentIndex.value + 1)
  } else if (delta < 0 && currentIndex.value > 0) {
    // Défilement vers le haut
    event.preventDefault()
    goToSection(currentIndex.value - 1)
  }
}

// Animation spécifique pour la slide 73
const handleSlide73Scroll = (delta) => {
  if (delta > 0 && !slide73AnimationComplete.value) {
    // Défilement vers le bas
    slide73Progress.value = Math.min(1, slide73Progress.value + 0.08)
  } else if (delta < 0 && slide73Progress.value > 0) {
    // Défilement vers le haut
    slide73Progress.value = Math.max(0, slide73Progress.value - 0.08)
  }
  
  // Mettre à jour les animations
  updateSlide73Animations()
  
  // Si tous les éléments sont visibles, permettre de passer à la section suivante
  if (slide73Progress.value >= 1) {
    slide73AnimationComplete.value = true
  }
}

// Animation spécifique pour la slide 21
const handleSlide21Scroll = (delta) => {
  if (delta > 0 && !slide21AnimationComplete.value) {
    // Défilement vers le bas
    slide21Progress.value = Math.min(1, slide21Progress.value + 0.1)
  } else if (delta < 0 && slide21Progress.value > 0) {
    // Défilement vers le haut
    slide21Progress.value = Math.max(0, slide21Progress.value - 0.1)
  }
  
  // Mettre à jour les animations
  updateSlide21Animations()
  
  // Si tous les éléments sont visibles, permettre de passer à la section suivante
  if (slide21Progress.value >= 1) {
    slide21AnimationComplete.value = true
  }
}

// Fonction pour mettre à jour les animations de la slide 73
const updateSlide73Animations = () => {
  if (!process.client) return
  
  const progress = slide73Progress.value
  console.log('Progression slide 73:', Math.round(progress * 100) + '%')
  
  // Sélectionner et animer les éléments
  const title = document.querySelector('.slide-73-title')
  const content = document.querySelector('.slide-73-content')
  const pointsContainer = document.querySelector('.points-fort')
  const points = document.querySelectorAll('.slide-73-point')
  
  // Animer le titre (0-20% de la progression)
  if (title) {
    const titleProgress = Math.min(1, progress / 0.2)
    gsap.to(title, {
      opacity: titleProgress,
      y: 30 * (1 - titleProgress),
      duration: 0.2,
      ease: 'power2.out'
    })
  }
  
  // Animer le contenu (20-40% de la progression)
  if (content) {
    const contentProgress = progress <= 0.2 ? 0 : Math.min(1, (progress - 0.2) / 0.2)
    gsap.to(content, {
      opacity: contentProgress,
      y: 30 * (1 - contentProgress),
      duration: 0.2,
      ease: 'power2.out'
    })
  }
  
  // Animer le conteneur de points (40-60% de la progression)
  if (pointsContainer) {
    const containerProgress = progress <= 0.4 ? 0 : Math.min(1, (progress - 0.4) / 0.2)
    gsap.to(pointsContainer, {
      opacity: containerProgress,
      y: 30 * (1 - containerProgress),
      duration: 0.2,
      ease: 'power2.out'
    })
  }
  
  // Animer chaque point individuellement (60-100% de la progression)
  if (points.length > 0) {
    const pointsBaseProgress = progress <= 0.6 ? 0 : (progress - 0.6) / 0.4
    
    points.forEach((point, index) => {
      const pointProgress = pointsBaseProgress <= index / points.length ? 0 : 
                          Math.min(1, (pointsBaseProgress - index / points.length) * points.length)
      
      gsap.to(point, {
        opacity: pointProgress,
        y: 30 * (1 - pointProgress),
        duration: 0.2,
        ease: 'power2.out'
      })
    })
  }
}

// Fonction pour mettre à jour les animations de la slide 21
const updateSlide21Animations = () => {
  if (!process.client) return
  
  const progress = slide21Progress.value
  console.log('Progression slide 21:', Math.round(progress * 100) + '%')
  
  // Sélectionner et animer les éléments
  const title = document.querySelector('.slide-21-title')
  const points = document.querySelectorAll('.slide-21-point')
  
  // Animer le titre (0-20% de la progression)
  if (title) {
    const titleProgress = Math.min(1, progress / 0.2)
    gsap.to(title, {
      opacity: titleProgress,
      y: 30 * (1 - titleProgress),
      duration: 0.2,
      ease: 'power2.out'
    })
  }
  
  // Animer chaque point individuellement (20-100% de la progression)
  if (points.length > 0) {
    const pointsBaseProgress = progress <= 0.2 ? 0 : (progress - 0.2) / 0.8
    
    points.forEach((point, index) => {
      const pointProgress = pointsBaseProgress <= index / points.length ? 0 : 
                          Math.min(1, (pointsBaseProgress - index / points.length) * points.length)
      
      gsap.to(point, {
        opacity: pointProgress,
        y: 30 * (1 - pointProgress),
        duration: 0.2,
        ease: 'power2.out'
      })
    })
  }
}

// Initialisation des sections avec ScrollTrigger
const initScrollSections = () => {
  if (!process.client || !containerRef.value) return
  
  // Nettoyer les anciennes instances de ScrollTrigger
  ScrollTrigger.getAll().forEach(trigger => trigger.kill())
  
  // Sélectionner toutes les sections
  const sections = document.querySelectorAll('.section')
  sectionsRef.value = Array.from(sections)
  
  // Configuration de ScrollTrigger pour chaque section
  sectionsRef.value.forEach((section, index) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom top',
      onEnter: () => {
        if (!isAnimating.value) {
          currentIndex.value = index
          updateNavigation(index)
        }
      },
      onEnterBack: () => {
        if (!isAnimating.value) {
          currentIndex.value = index
          updateNavigation(index)
        }
      }
    })
  })
  
  // Ajouter l'écouteur d'événements wheel
  window.addEventListener('wheel', handleWheel, { passive: false })
}

// Initialisation des animations et transitions
const initAnimations = () => {
  // Animation de fond
  const updateBackground = () => {
    if (!sortedSlides.value[currentIndex.value]) return
    
    const bgPrimary = document.querySelector('.background-primary')
    const bgSecondary = document.querySelector('.background-secondary')
    
    if (!bgPrimary || !bgSecondary) return
    
    const currentSlide = sortedSlides.value[currentIndex.value]
    const thumbnailUrl = isMobile.value ? currentSlide.backgroundMobile : currentSlide.thumbnail
    
    if (thumbnailUrl) {
      // Animer le fond
      gsap.to(bgSecondary, {
        opacity: 1,
        duration: 0.5,
        onComplete: () => {
          bgPrimary.style.backgroundImage = `url(${thumbnailUrl})`
          gsap.to(bgSecondary, {
            opacity: 0,
            duration: 0.5
          })
        }
      })
    }
  }
  
  // Observer les changements d'index
  watch(currentIndex, (newIndex, oldIndex) => {
    updateBackground()
    animateSlideElements(newIndex)
  })
}

// Animation des éléments de la slide
const animateSlideElements = (activeIndex) => {
  const timeline = gsap.timeline()
  if (!sortedSlides.value[activeIndex]) return
  
  // Animez uniquement les slides autres que 73 et 21 (qui ont leurs propres animations)
  const currentSlideId = sortedSlides.value[activeIndex]?.id
  if (currentSlideId === 73 || currentSlideId === 21) {
    return
  }
  
  // Sélectionner les éléments à animer
  const slideContainer = document.querySelector(`#slide-${currentSlideId}`)
  if (!slideContainer) return
  
  const textElements = slideContainer.querySelectorAll('.text-element')
  
  // Animation d'entrée
  gsap.fromTo(textElements, 
    { opacity: 0, y: 30 }, 
    { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power2.out' }
  )
}

// Initialisation au chargement de la page
onMounted(async () => {
  // Précharger les images essentielles
  try {
    await preloadImage('/images/nono.webp')
    console.log("Image préchargée avec succès")
  } catch (error) {
    console.error("Erreur lors du préchargement de l'image:", error)
  }
  
  // Récupérer les slides
  await slidesStore.fetchSlides()
  slidesStore.startAutoRefresh()
  
  // Vérifier la taille de l'écran
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
  
  // Initialiser les sections et animations après un court délai
  nextTick(() => {
    setTimeout(() => {
      initScrollSections()
      initAnimations()
    }, 500)
  })
})

// Nettoyage au démontage du composant
onBeforeUnmount(() => {
  if (process.client) {
    slidesStore.stopAutoRefresh()
    window.removeEventListener('resize', checkScreenSize)
    window.removeEventListener('wheel', handleWheel)
    
    // Nettoyer les instances de ScrollTrigger
    ScrollTrigger.getAll().forEach(trigger => trigger.kill())
  }
})

// Navigation
const goToSlide = (index) => {
  goToSection(index)
  if (isMenuOpen.value) {
    isMenuOpen.value = false
  }
}

// Meta tags
useHead({
  title: 'TXT Engage - Vodafone'
})

// Fonctions utilitaires pour extraire les informations des slides
const extractTitle = (html) => {
  if (!html) return ''
  const div = document.createElement('div')
  div.innerHTML = html
  const heading = div.querySelector('h1, h2, h3, h4, h5, h6')
  return heading ? heading.textContent : ''
}

const extractTextContent = (html) => {
  if (!html) return ''
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || ''
}

const extractImage = (html) => {
  if (!html) return ''
  const div = document.createElement('div')
  div.innerHTML = html
  const img = div.querySelector('img')
  return img ? img.src : ''
}
</script>

<template>
  <div id="vodacomwrapper" ref="containerRef" class="smooth-scroll">
    <!-- Couches d'arrière-plan pour transition fluide -->
    <div class="background-layer background-primary"></div>
    <div class="background-layer background-secondary"></div>
    
    <!-- Navigation et en-tête -->
    <header class="header">
      <div class="logo">
        <img src="/images/logovector.svg" alt="Vodafone Logo" />
      </div>
      
      <!-- Navigation pour bureau -->
      <nav class="navigation" ref="navRef">
        <ul>
          <li v-for="(slide, index) in sortedSlides" :key="slide.id" 
              class="nav-item" 
              :class="{ active: index === currentIndex }"
              @click="goToSlide(index)">
            <span class="nav-dot"></span>
          </li>
        </ul>
      </nav>
      
      <!-- Menu hamburger pour mobile -->
      <div class="hamburger" :class="{ open: isMenuOpen }" @click="toggleMenu">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </header>
    
    <!-- Menu mobile -->
    <div class="mobile-menu" :class="{ open: isMenuOpen }">
      <nav>
        <ul>
          <li v-for="(slide, index) in sortedSlides" :key="slide.id" 
              @click="goToSlide(index)"
              :class="{ active: index === currentIndex }">
            <span>{{ index + 1 }}</span>
            <span>{{ extractTitle(slide.wp_content) || slide.title }}</span>
          </li>
        </ul>
      </nav>
    </div>
    
    <!-- Sections principales -->
    <main>
      <!-- Loop through slides -->
      <section v-for="(slide, index) in sortedSlides" :key="slide.id" 
        :class="['section', `section-${index}`]" 
        :id="`section-slide-${slide.id}`"
        :data-index="index">
        
        <div :id="`slide-${slide.id}`" class="slide-container animate__animated animate__fadeIn"
          :style="{ backgroundImage: isMobile ? (slide.backgroundMobile ? `url(${slide.backgroundMobile})` : 'none') : (slide.thumbnail ? `url(${slide.thumbnail})` : 'none') }">
          
          <!-- Slide 73 - Animation séquentielle -->
          <div v-if="slide.id === 73" class="txtintro row m-0 p-0">
            <div class="firstContainer">
              <div class="slapjh">
                <div class="subint" id="subint">
                  <h2 class="text-element slide-73-title" v-html="slide.title"></h2>
                  <p class="text-element slide-73-content" v-html="slide.wp_content"></p>
                </div>
                <div class="points-fort" id="points-fort">
                  <div v-for="(paragraph, idx) in slide.paragraphs" :key="idx"
                    class="text-element slide-73-point" :class="`point-${idx}`" v-html="paragraph">
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Slide 21 - Animation séquentielle -->
          <div v-else-if="slide.id === 21" id="thoiathoing" class="p-0 m-0">
            <div class="cont p-2">
              <div class="row">
                <h3 id="mshill" class="slide-21-title" v-html="slide.wp_content"></h3>
              </div>
              <div class="row flex-row">
                <div v-for="(paragraph, idx) in slide.paragraphs" :key="idx"
                  class="text-element slide-21-point col m-0 p-2" :class="`point-21-${idx}`" v-html="paragraph">
                </div>
              </div>
            </div>
          </div>
          
          <!-- Reach 32 million customers -->
          <div v-else-if="slide.id === 20" id="kiff" class="p-0 m-0">
            <div id="usruu">
              <div id="mzu" class="nusrru">
                <h2 id="slide2a" class="text-element" v-html="slide.wp_title"></h2>
                <h2 id="slide2b" class="text-element" v-html="slide.title"></h2>
                <div id="slide2c" class="apitch" v-html="slide.content"></div>
              </div>
              <div id="guysamuel" class="gee">
                <div v-for="(paragraph, idx) in slide.paragraphs" :key="idx" class="text-element"
                  v-html="paragraph">
                </div>
              </div>
            </div>
          </div>
          
          <!-- Autres slides - Mise en page générique -->
          <div v-else class="slide-content-generic">
            <h2 class="text-element" v-if="slide.title" v-html="slide.title"></h2>
            <div class="text-element" v-if="slide.wp_content" v-html="slide.wp_content"></div>
            <div class="text-element" v-if="slide.content" v-html="slide.content"></div>
            <div class="paragraphs-container" v-if="slide.paragraphs && slide.paragraphs.length">
              <div v-for="(paragraph, idx) in slide.paragraphs" :key="idx" 
                class="text-element paragraph" v-html="paragraph">
              </div>
            </div>
          </div>
          
        </div>
      </section>
    </main>
    
    <!-- Bouton retour en haut -->
    <div class="back-to-top" @click="goToSlide(0)" v-show="currentIndex > 0">
      <span>↑</span>
    </div>
  </div>
</template>

<style lang="scss">
body, html {
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100%;
  font-family: 'Vodafone', Arial, sans-serif;
}

#vodacomwrapper {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.smooth-scroll {
  scroll-behavior: smooth;
}

/* Backgrounds et transitions */
.background-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  transition: opacity 0.5s ease;
  z-index: -1;
}

.background-primary {
  z-index: -2;
}

.background-secondary {
  opacity: 0;
  z-index: -1;
}

/* Navigation */
.header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  z-index: 100;
}

.logo {
  width: 120px;
  img {
    max-width: 100%;
  }
}

.navigation {
  position: fixed;
  top: 50%;
  right: 30px;
  transform: translateY(-50%);
  z-index: 100;
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    
    li {
      margin: 10px 0;
      cursor: pointer;
      
      .nav-dot {
        display: block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.5);
        transition: transform 0.3s ease, background-color 0.3s ease;
      }
      
      &.active .nav-dot {
        background-color: white;
        transform: scale(1.5);
      }
    }
  }
}

/* Menu mobile */
.hamburger {
  display: none;
  flex-direction: column;
  cursor: pointer;
  z-index: 101;
  
  span {
    display: block;
    width: 30px;
    height: 3px;
    margin: 3px 0;
    background-color: white;
    transition: transform 0.3s ease;
  }
  
  &.open {
    span:nth-child(1) {
      transform: translateY(9px) rotate(45deg);
    }
    
    span:nth-child(2) {
      opacity: 0;
    }
    
    span:nth-child(3) {
      transform: translateY(-9px) rotate(-45deg);
    }
  }
}

.mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  z-index: 99;
  transform: translateX(-100%);
  transition: transform 0.5s ease;
  
  &.open {
    transform: translateX(0);
  }
  
  nav {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      
      li {
        margin: 20px 0;
        padding: 10px;
        color: white;
        cursor: pointer;
        transition: background-color 0.3s ease;
        display: flex;
        align-items: center;
        
        span:first-child {
          margin-right: 15px;
          font-weight: bold;
          font-size: 1.2em;
        }
        
        &.active, &:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
      }
    }
  }
}

/* Sections et slides */
.section {
  height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden;
  
  &.active {
    z-index: 1;
  }
}

.slide-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  overflow: hidden;
  color: white;
  position: relative;
}

/* Bouton retour en haut */
.back-to-top {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 40px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 99;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.4);
  }
  
  span {
    color: white;
    font-size: 20px;
  }
}

/* Slides spécifiques */
/* Slide 73 */
#section-slide-73 {
  position: relative;
  overflow: visible !important;
  z-index: 10;
}

#section-slide-73 #points-fort {
  opacity: 0;
}

#section-slide-73 #points-fort .text-element {
  opacity: 0;
  transform: translateY(30px);
  text-align: left;
  align-items: flex-start;
}

/* Slide 21 */
#section-slide-21 {
  position: relative;
  overflow: visible !important;
  z-index: 10;
}

#section-slide-21 .slide-21-title,
#section-slide-21 .slide-21-point {
  opacity: 0;
  transform: translateY(30px);
}

#section-slide-21 .slide-21-point {
  text-align: left;
}

/* Responsive */
@media (max-width: 1024px) {
  .navigation {
    display: none;
  }
  
  .hamburger {
    display: flex;
  }
  
  .slide-container {
    padding: 10px;
  }
}
</style>
