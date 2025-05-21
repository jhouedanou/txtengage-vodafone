<script setup>
import { onMounted, ref, computed, watch, onBeforeUnmount } from 'vue';
import { useSlidesStore } from '~/stores/slides';
import { useRuntimeConfig } from '#app';
import FullpageWrapper from '~/components/FullpageWrapper.vue';

const config = useRuntimeConfig();
const slidesStore = useSlidesStore();
const loading = computed(() => slidesStore.loading);
const sortedSlides = computed(() => slidesStore.sortedSlides);
const isMobile = ref(false);
const fullpageWrapper = ref(null);
const scrollCursor = ref(null);
const isMenuOpen = ref(false);

// Référence au slide actif
const activeSlideIndex = computed(() => {
  if (fullpageWrapper.value) {
    return fullpageWrapper.value.currentSectionIndex;
  }
  return 0;
});

// Fonction pour naviguer vers un slide
const goToSlide = (index) => {
  if (fullpageWrapper.value) {
    fullpageWrapper.value.goToSection(index);
    isMenuOpen.value = false;
  }
};

const updateScrollbarCursor = (index, total) => {
  if (!scrollCursor.value) return;
  
  // Calculer la position du curseur en fonction du slide actif
  const percentage = index / (total - 1);
  const trackHeight = scrollCursor.value.parentElement.offsetHeight - 20;
  const topPosition = percentage * trackHeight;
  scrollCursor.value.style.top = `${topPosition}px`;
};

const defaultBackground = ref('url(/images/bg12.webp)');
const specialBackground = ref('url(/images/nono.webp)');

const updateBackground = (type) => {
  const wrapper = document.getElementById('vodacomwrapper');
  if (!wrapper) return;
  
  wrapper.style.backgroundImage = type === 'special' ? specialBackground.value : defaultBackground.value;
  wrapper.style.backgroundSize = 'cover';
  wrapper.style.backgroundPosition = 'center center';
  wrapper.style.backgroundRepeat = 'no-repeat';
};

const handleResize = () => {
  isMobile.value = window.innerWidth <= 768;
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

onMounted(async () => {
  await slidesStore.fetchSlides(config.public.apiUrl);
  
  // Précharger les images de fond
  const preloadImage = (src) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src.replace('url(', '').replace(')', '');
      img.onload = resolve;
    });
  };
  
  await Promise.all([
    preloadImage(defaultBackground.value),
    preloadImage(specialBackground.value)
  ]);
  
  // Utiliser le fond par défaut initialement
  updateBackground('default');
  
  // Configurer les écouteurs d'événements pour les mises à jour
  document.addEventListener('updateBackground', (e) => updateBackground(e.detail.type));
  document.addEventListener('updateScrollbar', (e) => updateScrollbarCursor(e.detail.index, e.detail.total));
  
  window.addEventListener('resize', handleResize);
  handleResize();
  
  // Initialiser la scrollbar
  if (fullpageWrapper.value && scrollCursor.value) {
    updateScrollbarCursor(0, sortedSlides.value.length);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('updateBackground', updateBackground);
  document.removeEventListener('updateScrollbar', updateScrollbarCursor);
  window.removeEventListener('resize', handleResize);
});

// En-tête meta
useHead({ title: 'TXT Engage - Vodafone' });
</script>

<template>
  <div id="vodacomwrapper">
    <div v-if="loading" class="loader-container">
      <img src="/images/logovector.svg" class="logo-loader" alt="Logo" />
    </div>

    <header class="fixed-top">
      <div id="headerpadding" class="p-4 flex-row justify-content-between align-items-center">
        <img src="/images/logovector.svg" alt="Logo" />
        <div class="menu-container">
          <button class="hamburger" @click="toggleMenu" :class="{ 'is-active': isMenuOpen }">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <nav id="menu" class="slide-menu" :class="{ 'is-open': isMenuOpen }">
            <ul>
              <li v-for="(slide, index) in sortedSlides" :key="slide.id"
                :class="{ active: activeSlideIndex === index }" @click="goToSlide(index)">
                <span class="slide-label">{{ slide.menuTitle }}</span>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>

    <!-- Remplacer le contenu scrollable par FullpageWrapper -->
    <FullpageWrapper
      v-if="!loading && !slidesStore.error"
      :slides="sortedSlides"
      :isMobile="isMobile"
      ref="fullpageWrapper"
    />
    
    <div v-if="!loading && slidesStore.error" class="error-container">
      <div class="error-message">
        <p>{{ slidesStore.error }}</p>
        <button @click="slidesStore.fetchSlides()" class="retry-button">Réessayer</button>
      </div>
    </div>

    <!-- Custom scrollbar indicator -->
    <div class="custom-scrollbar">
      <div class="scrollbar-track"></div>
      <div class="scrollbar-cursor" ref="scrollCursor"></div>
    </div>
  </div>
</template>

<style>
/* Les styles existants peuvent être conservés */
/* Ajout des styles pour fullPage.js */
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

#vodacomwrapper {
  transition: background-image 0.5s ease-in-out;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* Ajouter les autres styles existants... */
</style>