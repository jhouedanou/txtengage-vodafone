<template>
  <div :id="`slide-${slide.id}`" class="slide-content-wrapper p-5">
    <!-- Contenu spécifique pour Slide 59 -->
    <div class="container text-center">
      <h1 class="text-element slide-59-title" v-html="slide.title"></h1>
      <div class="text-element slide-59-content my-4" v-html="slide.wp_content || slide.content"></div>
      
      <!-- Exemple d'éléments animés séquentiellement -->
      <div id="killer-junior" class="text-element animated-item">
        <p v-if="slide.paragraphs && slide.paragraphs[0]" v-html="slide.paragraphs[0]"></p>
      </div>
      <div id="llass-container" class="animated-item mt-3">
         <img v-if="slide.image_url" :src="slide.image_url" alt="Llass Image" class="img-fluid llass-image">
         <p v-if="slide.paragraphs && slide.paragraphs[1]" v-html="slide.paragraphs[1]"></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, onMounted, ref } from 'vue';
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

const killerJuniorDiv = ref(null);
const llassImgContainer = ref(null);

onMounted(() => {
  // Initialiser l'état d'animation pour la slide 59
  // animationStates['slide-59'] peut représenter l'étape de l'animation (0, 1, etc.)
  if (props.animationStates['slide-59'] === undefined) {
    props.animationStates['slide-59'] = 0; // 0: rien n'est encore joué, 1: tout est joué
  }

  killerJuniorDiv.value = document.querySelector('#killer-junior');
  llassImgContainer.value = document.querySelector('#llass-container');

  // Préparer les éléments pour l'animation
  gsap.set([killerJuniorDiv.value, llassImgContainer.value, '.slide-59-title', '.slide-59-content'], { autoAlpha: 0, y: 30 });

  // Déclencher l'animation d'entrée
  // Cette animation pourrait être plus complexe et contrôlée par le scroll dans la version originale
  // Pour fullpage.js, on la déclenche à l'entrée de la section.
  playFullSequence();
});

const playFullSequence = () => {
  if (props.animationStates['slide-59'] === 1) return; // Déjà jouée

  const tl = gsap.timeline({
    onComplete: () => {
      props.animationStates['slide-59'] = 1; // Marquer comme complètement jouée
    }
  });

  tl.to('.slide-59-title', { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' })
    .to('.slide-59-content', { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, "-=")
    .to(killerJuniorDiv.value, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, "-=")
    .to(llassImgContainer.value, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, "-=");
};

</script>

<style scoped>
.slide-content-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  text-align: center;
  background-color: #f0f0f0; /* Exemple de fond pour la différencier */
  color: #333;
}
.animated-item {
  opacity: 0; /* Géré par GSAP */
}
.llass-image {
  max-width: 300px;
  border-radius: 8px;
  margin-bottom: 10px;
}
</style>
