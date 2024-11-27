<template>
    <swiper :direction="'vertical'" :slides-per-view="1" :space-between="0" :mousewheel="true" :pagination="{
        clickable: true,
    }" :modules="modules" class="mySwiper" @slideChange="handleSlideChange">
        <swiper-slide>
            <AnimatedSlide :isActive="activeSlide === 0" />
        </swiper-slide>
        <swiper-slide>
            <AnimatedSlide :isActive="activeSlide === 0" />
        </swiper-slide>
        <swiper-slide>
            <h2>Deuxième section</h2>
        </swiper-slide>
        <swiper-slide>
            <h2>Troisième section</h2>
        </swiper-slide>
    </swiper>
</template>

<script setup>
import { ref } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Mousewheel, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

const modules = [Mousewheel, Pagination]
const activeSlide = ref(0)

const handleSlideChange = (swiper) => {
    activeSlide.value = swiper.activeIndex
}
</script>

<style lang="scss" scoped>
body {
    margin: 0;
    padding: 0;
}

.mySwiper {
    height: 100vh;
}

.swiper-slide {
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100vw;

    div {

        width: 100vw;
    }
}
</style>