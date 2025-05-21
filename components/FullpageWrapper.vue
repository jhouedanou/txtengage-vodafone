<template>
  <div id="fullpage-wrapper">
    <full-page
      ref="fullpage"
      :options="options"
      id="fullpage"
      @after-load="afterLoad"
      @leave="onLeave"
    >
      <div v-for="(slide, index) in slides" :key="slide.id" class="section" :data-slide-id="slide.id">
        <!-- Utilisation des composants dynamiques pour chaque slide -->
        <component 
          :is="getSlideComponent(slide.id)"
          :slide="slide"
          :animationStates="animationStates"
          :isMobile="isMobile"
        />
      </div>
    </full-page>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineProps, reactive, defineExpose } from 'vue';
import { FullPage } from 'vue-fullpage';
import { gsap } from 'gsap';

// Importer tous les composants de slides
import Slide73 from './slides/Slide73.vue';
import Slide20 from './slides/Slide20.vue';
import Slide21 from './slides/Slide21.vue';
import Slide22 from './slides/Slide22.vue';
import Slide23 from './slides/Slide23.vue';
import Slide59 from './slides/Slide59.vue';
import Slide128 from './slides/Slide128.vue';
import Slide60 from './slides/Slide60.vue';
import SlideDefault from './slides/SlideDefault.vue';

const props = defineProps({
  slides: {
    type: Array,
    required: true
  },
  isMobile: {
    type: Boolean,
    default: false
  }
});

const fullpage = ref(null);
const currentSectionIndex = ref(0);

// État partagé des animations entre les composants
const animationStates = reactive({});

// Fonction pour déterminer quel composant charger selon l'ID du slide
const getSlideComponent = (slideId) => {
  const components = {
    73: Slide73,
    20: Slide20,
    21: Slide21,
    22: Slide22,
    23: Slide23,
    59: Slide59,
    128: Slide128,
    60: Slide60
  };
  
  return components[slideId] || SlideDefault;
};

// Options pour fullpage.js
const options = {
  // Utiliser la licence GPL v3 en développement
  licenseKey: 'gplv3-license', // Remplacer par votre licence commerciale en production
  scrollingSpeed: 1000,
  navigation: true,
  navigationPosition: 'right',
  showActiveTooltip: false,
  css3: true, // Utiliser CSS3 lorsque c'est possible
  scrollBar: false,
  responsiveWidth: 768,
  parallax: true,
  parallaxOptions: {
    type: 'reveal',
    percentage: 62,
    property: 'translate'
  },
  
  // Empêcher le défilement auto sur les appareils tactiles
  touchSensitivity: 15, // Ajuster pour macOS
  normalScrollElementTouchThreshold: 5,
  
  // Callbacks pour contrôler les animations
  afterLoad: (origin, destination, direction) => {
    currentSectionIndex.value = destination.index;
    const slideId = destination.item.dataset.slideId;
    
    // Émission d'un événement pour mettre à jour le fond d'écran si nécessaire
    if (slideId === '20' || slideId === '114') {
      document.dispatchEvent(new CustomEvent('updateBackground', { detail: { type: 'special' } }));
    } else {
      document.dispatchEvent(new CustomEvent('updateBackground', { detail: { type: 'default' } }));
    }
    
    // Mise à jour de la scrollbar personnalisée
    document.dispatchEvent(new CustomEvent('updateScrollbar', { 
      detail: { index: destination.index, total: props.slides.length } 
    }));
  },
  
  onLeave: (origin, destination, direction) => {
    const originSlideId = origin.item.dataset.slideId;
    
    // Vérifier si des animations doivent bloquer la navigation
    if (originSlideId === '73' && !animationStates['slide-73']) {
      return false;
    }
    
    if (originSlideId === '23') {
      const perdrixSlidesLength = props.slides.find(s => s.id === 23)?.paragraphs?.length || 0;
      if (animationStates['slide-23'] !== undefined && 
          animationStates['slide-23'] < perdrixSlidesLength) {
        return false;
      }
    }
    
    if (originSlideId === '20' && !animationStates['slide-20-text5Shown'] && direction === 'down') {
      return false;
    }
    
    return true;
  }
};

const afterLoad = (origin, destination, direction) => {
  options.afterLoad(origin, destination, direction);
};

const onLeave = (origin, destination, direction) => {
  return options.onLeave(origin, destination, direction);
};

// Fonction pour naviguer programmatiquement vers une section
const goToSection = (index) => {
  if (fullpage.value) {
    fullpage.value.api.moveTo(index + 1);
  }
};

// Exposer les éléments nécessaires pour les autres composants
defineExpose({
  currentSectionIndex,
  goToSection,
  animationStates
});
</script>

<style>
/* Styles pour le wrapper fullpage.js */
#fullpage-wrapper {
  width: 100%;
  height: 100vh;
}

.section {
  height: 100vh;
  width: 100%;
  position: relative;
}

/* Customize la navigation de fullpage.js */
#fp-nav ul li a span, 
.fp-slidesNav ul li a span {
  background: #e60000; /* Couleur Vodafone */
}</style>