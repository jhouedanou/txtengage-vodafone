<script setup>
import { onMounted, ref, computed } from 'vue'
import { useSlidesStore } from '~/stores/slides'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Mousewheel, Scrollbar, Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/scrollbar'
import 'animate.css'

const slidesStore = useSlidesStore()
const loading = computed(() => slidesStore.loading)
const sortedSlides = computed(() => slidesStore.sortedSlides)
const activeSlideIndex = ref(0)
const horizontalSwiperModules = [Navigation, Pagination, Autoplay]
//slide 23

const activeIndex = ref(null)
const activeImage = ref(null)
const toggleAccordion = (slideId, index) => {
    activeIndex.value = activeIndex.value === index ? null : index
    const currentSlide = sortedSlides.value.find(s => s.id === slideId)
    const imgSrc = currentSlide.paragraphs[index].match(/src="([^"]*)"/)?.[1]
    activeImage.value = imgSrc
}

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
    //Afficher local relevance en tant que première slide dans la sldie 23
    activeIndex.value = 0
    const firstSlide = sortedSlides.value.find(s => s.id === 23)
    activeImage.value = firstSlide.paragraphs[0].match(/src="([^"]*)"/)?.[1]

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

                    <div v-else-if="slide.id === 23" id="bygone-bip" class="p-0 m-0">
                        <div class="row">
                            <!-- Colonne de gauche pour les images -->
                            <div class="col-md-5 col-sm-12">
                                <div :id="`letexte-${index}`" v-for="(paragraph, index) in slide.paragraphs"
                                    :key="index" class="accordion-item">
                                    <div class="accordion-header" @click="toggleAccordion(slide.id, index)"
                                        :class="{ 'active-header': activeIndex === index }">
                                        <h3 v-html="paragraph.split('</h3>')[0] + '</h3>'"
                                            :class="{ 'active-title': activeIndex === index }"></h3>
                                    </div>
                                    <div class="accordion-content" :class="{ active: activeIndex === index }">
                                        <p v-html="paragraph.split('</h3>')[1].split('<p>')[1].split('</p>')[0]"></p>
                                    </div>
                                </div>
                            </div>
                            <div id="lephone" class="col-md-7 col-sm-12">
                                <img v-if="activeImage" :src="activeImage"
                                    :class="['slide-image', { visible: activeImage }]" alt="Slide image">
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
    transition: all 0.5s ease;

    &.swiper-slide-active {}
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

//carousel horizontal avec les téléphones 
.horizontal-carousel {
    width: 100%;
    height: 100%;
}

.horizontal-carousel .swiper-slide {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
}

.horizontal-carousel .swiper-button-next,
.horizontal-carousel .swiper-button-prev {
    color: #e60000;
}

.horizontal-carousel .swiper-pagination-bullet-active {
    background: #e60000;
}

#slide-23 {

    .fade-slide {
        transition: opacity 0.3s ease;
    }

    .slide-content {
        animation-duration: 0.5s;
    }

    .horizontal-carousel {
        width: 100%;
        height: 100%;
    }

    .swiper-slide-active .text-element {
        opacity: 1;
    }

    .swiper-slide:not(.swiper-slide-active) .text-element {
        opacity: 0.5;
    }

    .columns-container {
        display: flex;
        width: 100%;
    }

    .left-column,
    .right-column {}

    .accordion-item {
        margin-bottom: 10px;
    }

    .accordion-header {
        cursor: pointer;
        padding: 10px;
    }

    .accordion-content {
        height: 0;
        overflow: hidden;
        transition: height 0.3s ease;
    }

    .accordion-content.active {
        height: auto;
    }

    .slide-image {
        width: 100%;
        height: auto;
    }

    .accordion-content {
        max-height: 0;
        opacity: 0;
        transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .accordion-content.active {
        max-height: 500px;
        opacity: 1;
    }

    .slide-image {
        opacity: 0;
        transform: translateX(-20px);
        transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .slide-image.visible {
        opacity: 1;
        transform: translateX(0);
    }

}
</style>
