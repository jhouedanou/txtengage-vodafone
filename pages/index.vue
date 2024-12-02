<script setup>
import { onMounted, ref, computed } from 'vue'
import { useSlidesStore } from '~/stores/slides'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Mousewheel, Scrollbar } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/scrollbar'
import 'animate.css'

const slidesStore = useSlidesStore()
const loading = computed(() => slidesStore.loading)
const sortedSlides = computed(() => slidesStore.sortedSlides)
const activeSlideIndex = ref(0)

const swiperOptions = {
    modules: [Mousewheel, Scrollbar],
    direction: 'vertical',
    slidesPerView: 1,
    mousewheel: true,
    speed: 800,
    scrollbar: {
        el: '.swiper-scrollbar',
        draggable: true,
        hide: false,
    },
    on: {
        slideChange: (swiper) => {
            activeSlideIndex.value = swiper.activeIndex
        }
    }
}

onMounted(() => {
    slidesStore.fetchSlides()
    slidesStore.startAutoRefresh()
});
</script>

<template>
    <div id="vodacomwrapper">
        <div v-if="loading" class="loader-container">
            <nuxt-img src="/images/logovector.svg" class="logo-loader" format="webp" quality="80" alt="Logo" />
        </div>

        <header class="fixed-top">
            <div id="headerpadding" class="p-4 flex-row justify-content-between align-items-center">
                <nuxt-img src="/images/logovector.svg" format="webp" quality="80" alt="Logo" />
            </div>
        </header>

        <Swiper v-bind="swiperOptions" class="sections-container">
            <div class="swiper-scrollbar"></div>
            <SwiperSlide v-for="(slide, index) in sortedSlides" :key="slide.id"
                :class="{ 'slide-active': index === activeSlideIndex }">
                <div :id="`slide-${slide.id}`" class="slide-container animate__animated animate__fadeIn"
                    :style="{ backgroundImage: slide.thumbnail ? `url(${slide.thumbnail})` : 'none' }">
                    <!-- premiere slide  -->
                    <div v-if="slide.id === 73" class="txtintro row m-0 p-0">
                        <div class="firstContainer">
                            <div class="slapjh">
                                <div class="subint" id="subint">
                                    <h2 class="text-element" v-html="slide.title"></h2>
                                    <p class="text-element" v-html="slide.wp_content"></p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- slide1 -->
                    <div v-if="slide.id === 10" class="txtintro row m-0 p-0">
                        <div class="firstContainer">
                            <div class="slapjh">

                                <div class="points-fort" id="points-fort">
                                    <div v-for="(paragraph, index) in slide.paragraphs" :key="index"
                                        class="text-element" v-html="paragraph">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- reach 32 million customers -->
                    <div v-else-if="slide.id === 20" id="kiff" class="p-0 m-0">
                        <div id="usruu">
                            <div id="mzu" class="nusrru">
                                <h2 id="slide2a" class="text-element" v-html="slide.wp_title"></h2>
                                <h2 id="slide2b" class="text-element" v-html="slide.title"></h2>
                                <div id="slide2c" class="apitch" v-html="slide.content"></div>
                            </div>
                            <div id="guysamuel" class="gee">
                                <div v-for="(paragraph, index) in slide.paragraphs" :key="index" class="text-element"
                                    v-html="paragraph">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- no internet access needed -->
                    <div v-else-if="slide.id === 21" id="thoiathoing" class="p-0 m-0">
                        <div class="cont p-2">
                            <div class="row">
                                <h3 id="mshill" v-html="slide.wp_content"></h3>
                            </div>
                            <div class="row flex-row">
                                <div v-for="(paragraph, index) in slide.paragraphs" :key="index"
                                    class="text-element col m-0 p-2" v-html="paragraph">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- other advantages -->
                    <div v-else-if="slide.id === 22" id="thoiathoing" class="p-0 m-0">
                        <div class="cont p-2">
                            <div class="row">
                                <h3 id="mshill" v-html="slide.wp_content"></h3>
                            </div>
                            <div class="row flex-row">
                                <div v-for="(paragraph, index) in slide.paragraphs" :key="index"
                                    class="text-element col m-0 p-2" v-html="paragraph">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-else-if="slide.id === 23" id="bygone" class="p-0 m-0">
                        <div class="greenegs">
                            <h2 class="text-element" v-html="slide.title"></h2>
                            <div v-for="(paragraph, index) in slide.paragraphs" :key="index" class="text-element"
                                v-html="paragraph">
                            </div>
                        </div>
                    </div>

                    <div v-else-if="slide.id === 59">
                        <div id="killerjunior" class="ouh">
                            <div class="row">
                                <div class="col-md-7">
                                    <h2 class="text-element" v-html="slide.title"></h2>
                                    <p v-html="slide.wp_content"></p>
                                </div>
                                <div class="col-md-5">
                                    <div v-for="(paragraph, index) in slide.paragraphs" :key="index"
                                        class="text-element" v-html="paragraph">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-else-if="slide.id === 60">
                        <div class="container">
                            <h2 class="text-element" v-html="slide.title"></h2>
                            <div v-for="(paragraph, index) in slide.paragraphs" :key="index" class="text-element"
                                v-html="paragraph">
                            </div>
                        </div>
                    </div>

                </div>
            </SwiperSlide>
        </Swiper>
    </div>
</template>

<style lang="scss">
@use 'swiper/css';
@use 'swiper/css/scrollbar';


:root {
    overflow: hidden;
}

#vodacomwrapper {
    height: 100vh;
    position: fixed;
    width: 100%;
}

.sections-container {
    height: 100vh;
    scroll-behavior: smooth;
}

.section {
    height: 100vh;
    width: 100%;
    position: relative;
}

.loader-container {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: white !important
}

.logo-loader {
    width: 50px;
    animation: logoAnimation 2s infinite;
}

@keyframes logoAnimation {
    0% {
        transform: scale(1);
        opacity: 1;
    }

    50% {
        transform: scale(1.2);
        opacity: 0.7;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

.slide-container {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-size: cover;
    background-position: 50% 50%;
}

.swiper {
    width: 100%;
    height: 100vh;
}

.swiper-slide {
    height: 100vh;
    opacity: 0.5;
    transform: scale(0.9);
    transition: all 0.5s ease;

    &.swiper-slide-active {
        opacity: 1;
        transform: scale(1);
    }
}



.swiper-scrollbar {
    width: 5px !important;
    right: 5px !important;
    opacity: 0.8;
    background-color: rgba(255, 255, 255, 0.2);
}

.swiper-scrollbar-drag {
    background: #e60000;
    border-radius: 10px;
    width: 5px;
}

.text-element {
    margin: 20px 0;
}


.container-full {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 15px;
}

.txtintro {
    width: 100%;
    height: 100%;
}

#slide-1 {
    background: rgba(0, 0, 0, 0);
}

#slide-2 {
    background: linear-gradient(45deg, #1a75ff, #4da6ff);
}

#slide-3 {
    background: linear-gradient(45deg, #1aff66, #66ff99);
}

#slide-4 {
    background: linear-gradient(45deg, #ffcc00, #ffdd4d);
}
</style>
