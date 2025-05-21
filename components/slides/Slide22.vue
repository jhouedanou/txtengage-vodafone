<template>
  <div :id="`slide-${slide.id}`" class="slide-content-wrapper p-5">
    <!-- Contenu spécifique pour Slide 22 -->
    <div :id="`thoiathoing-${slide.id}`" class="thoiathoing-content">
      <h1 class="text-element slide-22-title" v-html="slide.title"></h1>
      <div class="text-element slide-22-content" v-html="slide.wp_content || slide.content"></div>
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
}
</style>
