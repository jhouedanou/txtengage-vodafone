<template>
  <div :id="`slide-${slide.id}`" class="txtintro row m-0 p-0 slide">
    <div class="firstContainer">
      <div class="slapjh">
        <div class="subint">
          <h2 class="text-element slide-73-title" v-html="slide.title"></h2>
          <p class="text-element slide-73-content" v-html="slide.wp_content"></p>
        </div>
        <div class="points-fort">
          <div 
            v-for="(paragraph, idx) in slide.paragraphs" 
            :key="idx"
            class="text-element slide-73-point" 
            :class="`point-${idx}`" 
            v-html="paragraph">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch, defineProps } from 'vue';
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
  initAnimation();
});

const initAnimation = () => {
  // Réinitialiser l'état de l'animation
  if (props.animationStates['slide-73'] === undefined) {
    props.animationStates['slide-73'] = false;
  }

  // Préparation des éléments (masqués initialement)
  gsap.set('.slide-73-title, .slide-73-content, .slide-73-point', { 
    autoAlpha: 0, 
    y: 50 
  });

  // Animation du titre et contenu
  gsap.to('.slide-73-title, .slide-73-content', {
    autoAlpha: 1,
    y: 0,
    duration: 0.8,
    stagger: 0.3,
    ease: 'power2.out',
    onComplete: () => {
      // Animation des points forts
      gsap.to('.slide-73-point', {
        autoAlpha: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.2,
        ease: 'power2.out',
        onComplete: () => {
          // Marquer l'animation comme terminée
          props.animationStates['slide-73'] = true;
        }
      });
    }
  });
};
</script>