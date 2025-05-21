<template>
  <div :id="`slide-${slide.id}`" class="slide-content-wrapper p-0 m-0">
    <div class="container-fluid h-100">
      <div class="row h-100">
        <div class="col-lg-4 col-md-5 d-flex flex-column justify-content-center p-4 case-study-nav">
          <h2 class="text-element mb-4" v-html="slide.title"></h2>
          <div v-for="(item, index) in caseStudyItems" :key="index" 
               class="case-study-nav-item p-3 mb-2" 
               :class="{ active: activeCaseStudyIndex === index }"
               @click="activateCaseStudyItem(index)">
            <h5 class="text-element mb-1" v-html="item.title"></h5>
            <p class="text-element small" v-html="item.previewContent"></p>
          </div>
        </div>
        <div class="col-lg-8 col-md-7 d-flex justify-content-center align-items-center p-4 case-study-content-area">
          <div v-if="activeCaseStudyItemData" class="case-study-content">
            <img v-if="activeCaseStudyItemData.image" :src="activeCaseStudyItemData.image" alt="Case Study Image" class="img-fluid mb-3 case-study-image">
            <h3 class="text-element mb-3" v-html="activeCaseStudyItemData.title"></h3>
            <div class="text-element" v-html="activeCaseStudyItemData.fullContent"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, onMounted, computed } from 'vue';
import { gsap } from 'gsap';

const props = defineProps({
  slide: {
    type: Object,
    required: true
  },
  animationStates: {
    type: Object,
    required: true
  },
  isMobile: {
    type: Boolean,
    default: false
  }
});

const activeCaseStudyIndex = ref(0);

// Simuler la structure des données d'étude de cas à partir des paragraphes de la slide
// Chaque paragraphe pourrait représenter un item d'étude de cas.
const caseStudyItems = computed(() => {
  if (!props.slide.paragraphs) return [];
  return props.slide.paragraphs.map(p => {
    // Extraire le titre (ex: contenu d'un <h4>)
    const titleMatch = p.match(/<h4>(.*?)<\/h4>/);
    const title = titleMatch ? titleMatch[1] : 'Sans titre';
    // Extraire l'image (ex: première balise <img>)
    const imageMatch = p.match(/<img.*?src="(.*?)".*?>/);
    const image = imageMatch ? imageMatch[1] : null;
    // Contenu complet (tout le paragraphe)
    const fullContent = p;
    // Aperçu (ex: les 100 premiers caractères du contenu sans HTML)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = p;
    const previewContent = (tempDiv.textContent || tempDiv.innerText || "").substring(0, 100) + '...';
    return { title, image, fullContent, previewContent };
  });
});

const activeCaseStudyItemData = computed(() => {
  return caseStudyItems.value[activeCaseStudyIndex.value] || null;
});

const activateCaseStudyItem = (index) => {
  if (activeCaseStudyIndex.value === index) return;
  
  const oldContent = document.querySelector('.case-study-content');
  if (oldContent) {
    gsap.to(oldContent, {
      autoAlpha: 0, 
      y: 20, 
      duration: 0.3, 
      ease: 'power2.in',
      onComplete: () => {
        activeCaseStudyIndex.value = index;
        // Attendre que Vue mette à jour le DOM, puis animer le nouveau contenu
        nextTick(() => {
          const newContent = document.querySelector('.case-study-content');
          if (newContent) {
            gsap.fromTo(newContent, 
              { autoAlpha: 0, y: -20 }, 
              { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }
            );
          }
        });
      }
    });
  } else {
    activeCaseStudyIndex.value = index;
    nextTick(() => {
      const newContent = document.querySelector('.case-study-content');
      if (newContent) {
        gsap.fromTo(newContent, 
          { autoAlpha: 0, y: -20 }, 
          { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }
        );
      }
    });
  }
  // Marquer l'état pour le contrôle de la navigation si nécessaire
  // props.animationStates['slide-128'] = index; 
};

import { nextTick } from 'vue'; // Assurez-vous que nextTick est importé

onMounted(() => {
});

</script>

<style scoped>
.slide-content-wrapper {
  height: 100%;
  width: 100%;
  background-color: #333; /* Fond sombre pour l'étude de cas */
  color: white;
}
.case-study-nav {
  background-color: rgba(0,0,0,0.2);
  overflow-y: auto;
  height: 100%;
}
.case-study-nav-item {
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}
.case-study-nav-item:hover, .case-study-nav-item.active {
  background-color: #e60000; /* Couleur Vodafone */
}
.case-study-content-area {
  background-color: rgba(255,255,255,0.05);
  height: 100%;
  overflow-y: auto;
}
.case-study-image {
  max-height: 300px;
  width: auto;
  border-radius: 8px;
  margin: 0 auto 1.5rem auto;
  display: block;
}
.case-study-content {
  opacity: 0; /* Géré par GSAP */
}
</style>
