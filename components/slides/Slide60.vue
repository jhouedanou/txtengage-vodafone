<template>
  <div :id="`slide-${slide.id}`" class="slide-content-wrapper p-5">
    <!-- Contenu spécifique pour Slide 60 -->
    <div class="container text-center">
      <h1 class="text-element slide-60-title" v-html="slide.title"></h1>
      <div class="text-element slide-60-content my-4" v-html="slide.wp_content || slide.content"></div>
      
      <!-- Affichage des paragraphes s'ils existent -->
      <div v-if="slide.paragraphs && slide.paragraphs.length > 0" class="paragraphs-container mt-4">
        <div v-for="(paragraph, index) in slide.paragraphs" :key="index" 
             class="text-element slide-60-paragraph mb-3" v-html="paragraph">
        </div>
      </div>
      
      <!-- Affichage de l'image si elle existe -->
      <img v-if="slide.image_url" :src="slide.image_url" alt="Slide Image" class="img-fluid slide-60-image mt-3">

    </div>
  </div>
</template>

<script setup>
import { defineProps, onMounted } from 'vue';
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
  background-color: #eaeaea; /* Un fond légèrement différent pour la distinguer */
  color: #333;
}
.slide-60-image {
  max-width: 80%;
  max-height: 300px;
  border-radius: 8px;
  object-fit: contain;
}
.paragraphs-container {
  max-width: 800px;
  margin: 0 auto;
}
</style>
