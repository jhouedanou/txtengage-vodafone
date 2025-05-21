<template>
  <div :id="`slide-${slide.id}`" class="slide-content-wrapper p-5">
    <!-- Contenu spécifique pour Slide 21 -->
    <div :id="`thoiathoing-${slide.id}`" class="thoiathoing-content">
      <h1 class="text-element slide-21-title" v-html="slide.title"></h1>
      <div class="text-element slide-21-content" v-html="slide.wp_content || slide.content"></div>
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
  // Initialiser l'état d'animation si non défini
  if (props.animationStates[`slide-${props.slide.id}-played`] === undefined) {
    props.animationStates[`slide-${props.slide.id}-played`] = false;
  }

  // Ne jouer l'animation que si elle n'a pas encore été jouée
  if (!props.animationStates[`slide-${props.slide.id}-played`]) {
    const thoiathoingDiv = document.querySelector(`#thoiathoing-${props.slide.id}`);
    if (thoiathoingDiv) {
      gsap.set(thoiathoingDiv, { autoAlpha: 0, y: 50 });
      gsap.to(thoiathoingDiv, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => {
          props.animationStates[`slide-${props.slide.id}-played`] = true;
        }
      });
    } else {
      // Si l'élément n'est pas trouvé, marquer comme joué pour éviter des blocages
      props.animationStates[`slide-${props.slide.id}-played`] = true;
    }
  }
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
.thoiathoing-content {
  /* Styles pour le conteneur spécifique si nécessaire */
}
</style>
