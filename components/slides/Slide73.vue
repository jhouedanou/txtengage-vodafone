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
    <div class="txtintro row m-0 p-0 slide">
      <div class="firstContainer">
        <div class="slapjh">
          <div class="subint">
            <h2 class="text-element slide-73-title" v-html="slide.title"></h2>
            <p
              class="text-element slide-73-content"
              v-html="slide.wp_content"
            ></p>
          </div>
          <div id="points-fort" class="points-fort">
            <div
              v-for="(paragraph, idx) in slide.paragraphs"
              :key="idx"
              class="text-element slide-73-point"
              :class="`point-${idx}`"
              v-html="paragraph"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, defineProps } from 'vue';
import { gsap } from 'gsap';
const props = defineProps({
  slide:       { type: Object, required: true },
  animationStates: { type: Object, required: true },
  isMobile:    { type: Boolean, default: false },
});
onMounted(()=>{


})
</script>

<style scoped>
.points-fort {
  /* Position initiale contrôlée par GSAP */
  opacity: 1;
  visibility: visible;
  overflow: hidden;
}

.slides-container {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition: background-position 0.5s ease;
}
</style>