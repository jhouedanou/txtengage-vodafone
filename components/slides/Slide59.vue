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
});


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
