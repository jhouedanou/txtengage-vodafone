<script setup>
import { useSlidesStore } from '~/stores/slides'

const slidesStore = useSlidesStore()

onMounted(() => {
    slidesStore.fetchSlides()
    slidesStore.startAutoRefresh()
})

// Utiliser directement le getter du store
const sortedSlides = computed(() => slidesStore.sortedSlides)
const loading = computed(() => slidesStore.loading);
</script>

<template>
    <div id="vodacomwrapper">
        <div v-if="loading" class="loader-container">
            <div class="spinner"></div>
        </div>

        <div v-else data-scroll-container>
            <div v-for="slide in sortedSlides" :key="slide.id" :id="`slide-${slide.id}`" class="slide-container"
                :style="{ backgroundImage: slide.thumbnail ? `url(${slide.thumbnail})` : 'none' }">
                <!--slide 1-->
                <div v-if="slide.id === 10" class="txtintro row m-0 p-0">
                    <div class="subint col-6">
                        <h2 class="text-element" v-html="slide.title"></h2>
                        <p class="text-element" v-html="slide.wp_content"></p>

                    </div>
                    <div class="points-fort col-6">
                        <div v-for="(paragraph, index) in slide.paragraphs" :key="index" class="text-element"
                            v-html="paragraph">
                        </div>
                    </div>
                </div>

                <div v-else class="text-container">
                    <h2 class="text-element" v-html="slide.title"></h2>
                    <div v-for="(paragraph, index) in slide.paragraphs" :key="index" class="text-element"
                        v-html="paragraph">
                    </div>
                </div>
            </div>
        </div>
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

#vodacomwrapper {}

.slide-container {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;


    -webkit-background-size: cover;
    -moz-background-size: cover;
    -o-background-size: cover;
    background-size: cover;
    filter: progid:DXImageTransform.Microsoft.AlphaImageLoader(src='.myBackground.jpg', sizingMethod='scale');
    -ms-filter: "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='myBackground.jpg', sizingMethod='scale')";
}

#slide-0 {}

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

.slide-container {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.text-container {
    color: white;
    text-align: center;
}

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
</style>
