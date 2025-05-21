<template>
  <div id="fullpage-wrapper">
    <client-only>
      <full-page
        ref="fullpage"
        :options="options"
        id="fullpage"
        @after-load="afterLoad"
        @leave="onLeave"
      >
        <section 
          :id="`slide-${slide.id}`" 
          v-for="(slide, index) in slides" 
          :key="slide.id" 
          class="section fp-section" 
          :data-slide-id="slide.id"
        >
          <!-- Utilisation des composants dynamiques pour chaque slide -->
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
import { ref, reactive, onMounted, defineProps, defineExpose, nextTick } from 'vue';
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
  scrollingSpeed: 700,
  scrollBar: false,
  scrollOverflow: false,
  responsiveWidth: 768,
  
  // Callbacks synchronisés avec notre système d'animation
  afterLoad: function(origin, destination, direction) {
    currentSectionIndex.value = destination.index;
    
    // Vous pouvez déclencher ici des animations, mais ne jamais bloquer le scroll
  },
  
  onLeave: function(origin, destination, direction) {
   // Si on est sur la slide 73 et que l'animation n'est pas jouée
    if (origin.item.getAttribute('data-slide-id') === '73' && !animationStates['slide-73-points-fort']) {
      // Lancer l'animation GSAP (via un event ou une méthode exposée)
      // Bloquer le scroll
      return false;
    }
    // dansles autres cas cas, ne jamais bloquer la navigation, laisser fullpage gérer le scroll normalement
    return true;
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
  // Attendre que le DOM soit complètement chargé
  await nextTick();
  
  // S'assurer que l'API fullpage est disponible globalement
  if (process.client && fullpage.value && fullpage.value.api) {
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
  }
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
}
</style>