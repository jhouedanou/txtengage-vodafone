<script setup>
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination, Navigation, Mousewheel } from 'swiper/modules'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import 'animate.css'
import { useSlidesStore } from '~/stores/slides'

gsap.registerPlugin(ScrollTrigger)

const slidesStore = useSlidesStore()

onMounted(() => {
    slidesStore.fetchSlides()
    slidesStore.startAutoRefresh()

})

const sortedSlides = computed(() => slidesStore.sortedSlides)
const loading = computed(() => slidesStore.loading)

const swiperOptions = {
    modules: [Autoplay, Pagination, Navigation, Mousewheel],
    direction: 'vertical',
    mousewheel: true,
    pagination: {
        clickable: true,
        type: 'progressbar'
    },
    navigation: true,
    autoplay: { delay: 10000 },
    speed: 800,
    loop: true,
    allowTouchMove: true,
    spaceBetween: 0,
    navigation: false, slidesPerView: 1,
    on: {
        slideChange: (swiper) => {
            document.querySelectorAll('.slide-container').forEach(slide => {
                slide.classList.remove('animate__animated', 'animate__fadeIn')
            })

            const activeSlide = document.querySelector(`.slide-container:nth-child(${swiper.activeIndex + 1})`)
            if (activeSlide) {
                activeSlide.classList.add('animate__animated', 'animate__fadeIn')
            }
        }
    }
};
</script>

<template>
    <div id="vodacomwrapper">
        <div v-if="loading" class="loader-container">
            <div class="spinner"></div>
        </div>

        <swiper v-else v-bind="swiperOptions" class="mySwiper">
            <swiper-slide v-for="slide in sortedSlides" :key="slide.id">
                <div :id="`slide-${slide.id}`" class="slide-container animate__animated"
                    :style="{ backgroundImage: slide.thumbnail ? `url(${slide.thumbnail})` : 'none' }">

                    <div v-if="slide.id === 10" class="txtintro row m-0 p-0">
                        <div class="container-full">
                            <div class="row">
                                <div class="subint col-6">
                                    <h2 class="text-element" v-html="slide.title"></h2>
                                    <p class="text-element" v-html="slide.wp_content"></p>
                                </div>
                                <div class="points-fort col-6">
                                    <div v-for="(paragraph, index) in slide.paragraphs" :key="index"
                                        class="text-element" v-html="paragraph">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-else-if="slide.id === 20">
                        <h2 class="text-element" v-html="slide.title"></h2>
                        <div v-for="(paragraph, index) in slide.paragraphs" :key="index" class="text-element"
                            v-html="paragraph">
                        </div>
                    </div>

                    <div v-else-if="[21, 22, 23, 59].includes(slide.id)">
                        <div class="container">
                            <h2 class="text-element" v-html="slide.title"></h2>
                            <div v-for="(paragraph, index) in slide.paragraphs" :key="index" class="text-element"
                                v-html="paragraph">
                            </div>
                        </div>
                    </div>

                    <div v-else-if="slide.id === 60">
                        <div class="container">
                            <div class="container">
                                <h2 class="text-element" v-html="slide.title"></h2>
                                <div v-for="(paragraph, index) in slide.paragraphs" :key="index" class="text-element"
                                    v-html="paragraph">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </swiper-slide>
        </swiper>
    </div>
</template>

<style scoped>
.loader-container {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 5px solid #f3f3f3;
    border-top: 5px solid #e60000;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.slide-container {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-size: cover;
}

.swiper {
    height: 100vh;
    width: 100%;
}

.swiper-slide {
    height: 100vh;
}

:deep(.swiper-pagination-progressbar) {
    width: 4px !important;
    height: 100% !important;
    left: auto !important;
    right: 10px;
}

:deep(.swiper-pagination-progressbar-fill) {
    background: #e60000 !important;
}

:deep(.swiper-button-next),
:deep(.swiper-button-prev) {
    color: #fff;
}

.animate__animated {
    --animate-duration: 1s;
}

.subint,
.points-fort {}

.text-element {
    margin: 20px 0;
}

h2 {
    font-size: 3rem;
    font-weight: bold;
}

p {
    font-size: 1.5rem;
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
