<template>
  <div :id="`slide-${slide.id}`" class="p-0 m-0 slide">
    <img id="turtlebeach" src="/images/hs.png" alt="">
    <div id="ozaru" class="row">
      <div id="mzu" class="nusrru col-md-5">
        <h2 id="slide2a" class="text-element" v-html="slide.wp_title"></h2>
        <h2 id="slide2b" class="text-element" v-html="slide.title"></h2>
        <h2 id="slide2c" class="text-element" v-html="slide.wp_content"></h2>
      </div>
      <div id="guysamuel" class="gee col-md-7">
        <div 
          v-for="(paragraph, idx) in slide.paragraphs" 
          :key="idx" 
          class="text-element"
          :id="`text-element-${idx}`"
          v-html="paragraph">
        </div>
      </div>
    </div>
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
  // Initialiser les états d'animation
  if (props.animationStates['slide-20-initialAnimPlayed'] === undefined) {
    props.animationStates['slide-20-initialAnimPlayed'] = false;
  }
  if (props.animationStates['slide-20-text5Shown'] === undefined) {
    props.animationStates['slide-20-text5Shown'] = false;
  }
  
  // Démarrer l'animation initiale
  playInitialAnimation();
});

const playInitialAnimation = () => {
  // Préparation des éléments
  gsap.set('#slide2a, #slide2b, #slide2c', { autoAlpha: 0, y: 50 });
  gsap.set('#guysamuel .text-element', { autoAlpha: 0, y: 20 });
  
  // Animation des titres
  gsap.to('#slide2a, #slide2b, #slide2c', {
    autoAlpha: 1,
    y: 0,
    duration: 0.8,
    stagger: 0.3,
    ease: 'power2.out',
    onComplete: () => {
      // Animation des 4 premiers éléments de texte
      const textElements = document.querySelectorAll('#guysamuel .text-element');
      for (let i = 0; i < Math.min(4, textElements.length); i++) {
        gsap.to(textElements[i], {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          delay: i * 0.2,
          ease: 'power2.out',
          onComplete: () => {
            if (i === Math.min(3, textElements.length - 1)) {
              props.animationStates['slide-20-initialAnimPlayed'] = true;
            }
          }
        });
      }
    }
  });
};

// Fonction pour animer le 5ème élément de texte (appelée par le parent via callback)
const playText5Animation = () => {
  const textElement5 = document.getElementById('text-element-4');
  if (textElement5 && !props.animationStates['slide-20-text5Shown']) {
    gsap.to(textElement5, {
      autoAlpha: 1,
      y: 0,
      duration: 0.8,
      ease: 'power2.out',
      onComplete: () => {
        props.animationStates['slide-20-text5Shown'] = true;
      }
    });
  }
};

// Exposer la fonction pour qu'elle puisse être appelée par le parent
defineExpose({ playText5Animation });
</script>