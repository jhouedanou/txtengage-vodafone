<template>
  <div id="fullpage-wrapper" v-if="!isInitialized">
    <client-only>
      <full-page
        ref="fullpage"
        :options="options"
        id="fullpage"
        @after-load="afterLoad"
        @leave="onLeave"
        style="height: 100vh; width: 100vw;"
      >
        <section 
          :id="`slide-${slide.id}`" 
          v-for="(slide, index) in slides" 
          :key="slide.id" 
          class="section fp-section" 
          :data-slide-id="slide.id"
          style="height: 100vh; overflow: hidden;"
        >
          <component 
            :is="getSlideComponent(slide.id)"
            :slide="slide"
            :animationStates="animationStates"
          />
        </section>
      </full-page>
    </client-only>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, defineProps, defineExpose, nextTick, watch, onUnmounted } from 'vue';
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

if (process.client && window.fullpage_api) {
  window.fullpage_api.destroy();
  window.fullpage_api = null;
}

const isInitialized = ref(false);

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

// Fonction pour gérer l'animation du slide 20
const handleSlide20Animation = () => {
  // Implémentez ici l'animation pour le slide 20
  animationStates['slide-20-initialAnimPlayed'] = true;
  // Exemple d'animation avec GSAP
  // gsap.to(...);
};

// Fonction pour gérer l'animation du slide 23
const handleSlide23Animation = () => {
  // Implémentez ici l'animation pour le slide 23
};

// Fonction pour gérer l'animation du slide 59
const handleSlide59Animation = () => {
  // Implémentez ici l'animation pour le slide 59
};

// Options pour fullpage.js
const options = {
  licenseKey: 'gplv3-license', // Remplacer par votre licence commerciale en production
  navigation: true,
  navigationPosition: 'right',
  showActiveTooltip: false,
  css3: true,
  autoScrolling: true,
  fitToSection: true,
  fitToSectionDelay: 400,
  scrollingSpeed: 700,
  scrollBar: false,
  scrollOverflow: false,
  responsiveWidth: 768,
  verticalCentered: false,
  paddingTop: '0',
  paddingBottom: '0',
  touchSensitivity: 15,
  normalScrollElementTouchThreshold: 5,
  bigSectionsDestination: 'top',

  afterLoad: function(origin, destination, direction) {
    currentSectionIndex.value = destination.index;
    setTimeout(() => fullpage.value.api.reBuild(), 100);
  },

  onLeave: function(origin, destination, direction) {
    const slideId = origin.item.getAttribute('data-slide-id');
    return animationStates[`slide-${slideId}-completed`] !== true;
  }
};

const afterLoad = (origin, destination, direction) => {
  // Déléguer au callback des options
  options.afterLoad(origin, destination, direction);
};

const onLeave = (origin, destination, direction) => {
  // Déléguer au callback des options
  return options.onLeave(origin, destination, direction);
};

// Fonction pour naviguer programmatiquement vers une section
const goToSection = (index) => {
  if (fullpage.value && fullpage.value.api) {
    fullpage.value.api.moveTo(index + 1);
  }
};

// Exposer les éléments nécessaires pour les autres composants
defineExpose({
  currentSectionIndex,
  goToSection,
  animationStates
});

onMounted(async () => {
  if (isInitialized.value) return;

  await nextTick();
  
  if (process.client && fullpage.value && fullpage.value.api && !window.fullpage_api) {
    window.fullpage_api = {
      setAllowScrolling: (allow) => {
        fullpage.value.api.setAllowScrolling(allow);
      },
      setKeyboardScrolling: (allow) => {
        fullpage.value.api.setKeyboardScrolling(allow);
      },
      moveTo: (index) => {
        fullpage.value.api.moveTo(index);
      },
      // Ajouter d'autres méthodes si nécessaire
    };
    
    // Initialiser les animations après la création complète de fullpage
    const sections = document.querySelectorAll('.section');
    if (sections.length > 0) {
      // Initialiser les animations si nécessaire
    }
    isInitialized.value = true;
  }
});

onUnmounted(() => {
  if (fullpage.value?.api) {
    fullpage.value.api.destroy();
    window.fullpage_api = null;
  }
  isInitialized.value = false;
});

watch(currentSectionIndex, (newVal) => {
  nextTick(() => {
    const sections = document.querySelectorAll('.section');
    if (sections[newVal]) {
      sections[newVal].style.height = '100vh';
      sections[newVal].style.overflow = 'hidden';
    }
  });
});
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

#fullpage-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.section {
  height: 100vh !important;
  width: 100% !important;
}

.fp-tableCell {
  height: 100vh !important;
  display: block !important;
}

/* Correction macOS */
.fp-section {
  -webkit-overflow-scrolling: auto !important;
}

body {
  overscroll-behavior: none;
}

#fp-nav ul li a span,
.fp-slidesNav ul li a span {
  background: #e60000;
}
</style>