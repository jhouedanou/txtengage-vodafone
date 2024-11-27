<script setup>
const loading = ref(true)
const slides = ref(null)

onMounted(async () => {
    const response = await fetch('https://bfedition.com/vodafone/wp-json/slides/v1/all')
    slides.value = await response.json()
    loading.value = false
})

const sortedSlides = computed(() => {
    if (!slides.value) return []
    return [...slides.value].sort((a, b) => a.id - b.id)
});
</script>

<template>
    <div id="vodacomwrapper">
        <div v-if="loading" class="loader-container">
            <div class="spinner"></div>
        </div>

        <div v-else data-scroll-container>
            <div v-for="slide in sortedSlides" :key="slide.id" :id="`slide-${slide.id}`" class="slide-container">
                <div class="text-container">
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

#vodacomwrapper {

    background: url(images/bg1.jpg) center center no-repeat fixed;

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
