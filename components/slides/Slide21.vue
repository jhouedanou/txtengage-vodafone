<template>
  <div
    :id="`background-${slide.id}`"
    class="slides-container"
    :style="{
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundImage: isMobile.value
        ? slide.backgroundMobile
          ? `url(${slide.backgroundMobile})`
          : 'none'
        : slide.thumbnail
        ? `url(${slide.thumbnail})`
        : 'none',
    }"
  >
  <div class="cont p-2">
              <div class="row">
                <h3 id="mshill" class="slide-21-title" v-html="slide.wp_content"></h3>
              </div>
              <div class="row flex-row">
                <div v-for="(paragraph, idx) in slide.paragraphs" :key="idx"
                  class="text-element slide-21-point col m-0 p-2" :class="`point-21-${idx}`" v-html="paragraph">
                </div>
              </div>
            </div>
  </div>
</template>

<script setup>
import { defineProps, onMounted } from "vue";
import { gsap } from "gsap";

const props = defineProps({
  slide: {
    type: Object,
    required: true,
  },
  animationStates: {
    type: Object,
    required: true,
  },
  isMobile: {
    type: Boolean,
    default: false,
  },
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
.thoiathoing-content {
  /* Styles pour le conteneur spécifique si nécessaire */
}
</style>
