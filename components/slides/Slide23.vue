<template>
  <div :id="`slide-${slide.id}`" class="slide-content-wrapper p-0 m-0">
    <div class="row w-100 h-100">
      <div class="col-md-6 d-flex flex-column justify-content-center align-items-start p-5 order-md-1 order-2">
        <div v-for="(paragraph, index) in slide.paragraphs" :key="index" 
             class="accordion-item w-100 mb-3" 
             :class="{ active: activeAccordionIndex === index }">
          <div class="accordion-header p-3" @click="toggleAccordion(index)">
            <h3 class="text-element mb-0" v-html="extractTitle(paragraph)"></h3>
          </div>
          <div class="accordion-content p-3" v-show="activeAccordionIndex === index">
            <p class="text-element" v-html="extractTextContent(paragraph)"></p>
          </div>
        </div>
      </div>
      <div class="col-md-6 d-flex justify-content-center align-items-center p-0 order-md-2 order-1 perdrix-image-container">
        <img v-if="activeAccordionImage" :src="activeAccordionImage" alt="Image de l'accordéon" class="img-fluid perdrix-image">
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, onMounted, watch } from 'vue';
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

const activeAccordionIndex = ref(0);
const activeAccordionImage = ref(null);

const extractTitle = (html) => {
  const match = html.match(/<h3>(.*?)<\/h3>/);
  return match ? match[1] : '';
};

const extractTextContent = (html) => {
  let content = html.replace(/<h3>.*?<\/h3>/, '');
  content = content.replace(/<img.*?>/g, ''); // Supprime les balises img
  return content;
};

const extractImageSrc = (html) => {
  const match = html.match(/src="(.*?)"/);
  return match ? match[1] : null;
};

const toggleAccordion = (index) => {
  activeAccordionIndex.value = activeAccordionIndex.value === index ? null : index;
  if (activeAccordionIndex.value !== null && props.slide.paragraphs) {
    activeAccordionImage.value = extractImageSrc(props.slide.paragraphs[activeAccordionIndex.value]);
  }
  // Marquer l'étape d'animation pour le contrôle de la navigation
  props.animationStates['slide-23'] = activeAccordionIndex.value ?? -1; // ou une autre logique pour indiquer la progression
};

onMounted(() => {
  // Initialiser l'état d'animation pour la slide 23
  // animationStates['slide-23'] pourrait représenter l'index de la perdrix active ou un compteur
  if (props.animationStates['slide-23'] === undefined) {
    props.animationStates['slide-23'] = -1; // -1 signifie qu'aucune perdrix n'est sélectionnée initialement
  }
  
  if (props.slide.paragraphs && props.slide.paragraphs.length > 0) {
    activeAccordionImage.value = extractImageSrc(props.slide.paragraphs[0]);
    props.animationStates['slide-23'] = 0; // Première perdrix active
  }

  // Animation d'entrée pour le composant si nécessaire
  gsap.fromTo(`#slide-${props.slide.id}`, 
    { autoAlpha: 0, y: 50 }, 
    { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }
  );
});

watch(activeAccordionImage, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    gsap.fromTo('.perdrix-image', 
      { autoAlpha: 0, scale: 0.95 }, 
      { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power2.out' }
    );
  }
});

</script>

<style scoped>
.slide-content-wrapper {
  height: 100%;
  width: 100%;
  overflow: hidden;
}
.accordion-item {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-bottom: 10px;
  transition: background-color 0.3s ease;
}
.accordion-item.active {
  background-color: rgba(255, 255, 255, 0.2);
}
.accordion-header {
  cursor: pointer;
  color: white;
}
.accordion-header h3 {
  font-size: 1.2rem;
  color: white;
}
.accordion-content {
  color: #f0f0f0;
}
.perdrix-image-container {
  height: 100%;
}
.perdrix-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}
</style>
