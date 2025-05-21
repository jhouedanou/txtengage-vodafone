<template>
  <div :id="`slide-${slide.id}`" class="default-slide-content p-5 slide">
    <h1 class="text-element" v-html="slide.title"></h1>
    <div class="text-element" v-html="slide.content || slide.wp_content"></div>
    <div v-for="(paragraph, idx) in slide.paragraphs" :key="idx" class="text-element" v-html="paragraph"></div>
  </div>
</template>

<script setup>
import { onMounted, defineProps } from 'vue';
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
  // Animation simple pour les slides par défaut
  const elements = document.querySelectorAll('.default-slide-content .text-element');
  
  gsap.set(elements, { autoAlpha: 0, y: 20 });
  
  gsap.to(elements, {
    autoAlpha: 1,
    y: 0,
    duration: 0.6,
    stagger: 0.2,
    ease: 'power2.out'
  });
});
</script>