<script setup>
import { onMounted, ref, computed } from 'vue'
import { useSlidesStore } from '~/stores/slides'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import 'animate.css'

gsap.registerPlugin(ScrollTrigger)

const slidesStore = useSlidesStore()
const loading = computed(() => slidesStore.loading)
const sortedSlides = computed(() => slidesStore.sortedSlides)

// Vérification de l'existence des éléments avant l'animation
const subintElement = document.getElementById('#subint')
const pointsFortElement = document.getElementById('#points-fort')
const initSlideAnimations = () => {
    // Animation fade des sections
    // Animation fade des sections
    gsap.utils.toArray('.section').forEach((section) => {
        gsap.from(section, {
            opacity: 0,
            duration: 1,
            scrollTrigger: {
                trigger: section,
                start: 'top top',
                toggleActions: 'play none none reverse'
            }
        })
    })
    // Pin chaque section
    gsap.utils.toArray('.section').forEach((section, i) => {
        ScrollTrigger.create({
            trigger: section,
            start: 'top top',
            pin: true,
            pinSpacing: false, // Empêche l'espace entre les sections
            markers: true, // Activez temporairement pour debug
            snap: 0
        })
    })

    // Animation spécifique pour la première slide
    let tl = gsap.timeline({
        scrollTrigger: {
            trigger: subintElement,
            start: 'top top',
            end: '+=700vh',
            scrub: 1,
            toggleActions: "play reverse play reverse",
            markers: false,
            snap: 1,
            pin: true

        }
    })

    tl.to('.subint', {
        opacity: 0,
        duration: 5
    })
        .to('.points-fort', {
            opacity: 1,
            y: 0,
            duration: 5
        }, '-=0.3')


    // Animation deuxième slide
    let tl2 = gsap.timeline({
        scrollTrigger: {
            trigger: '#kiff',
            start: 'top top',
            end: '+=1000',
            scrub: 1,
            snap: 0,
            pin: true
        }
    })

    tl2.set(['#mzu', '#guysamuel'], {
        opacity: 0,
        y: 50
    })
        .to('#mzu', {
            opacity: 1,
            y: 0,
            duration: 5
        })
        .to('#guysamuel', {
            opacity: 1,
            y: 0,
            duration: 5,
            stagger: 2
        }, "+=2")

}
// Animation de la 3e slide


onMounted(() => {
    slidesStore.fetchSlides()
    slidesStore.startAutoRefresh()
    nextTick(() => {
        initSlideAnimations()
    })
});
</script>

<template>
    <div id="vodacomwrapper">
        <div v-if="loading" class="loader-container">
            <!-- <div class="spinner"></div> -->
            <nuxt-img src="/images/logovector.svg" class="logo-loader" format="webp" quality="80" alt="Logo" />

        </div>
        <header class="fixed-top">
            <div id="headerpadding" class="p-4 flex-row justify-content-between align-items-center">
                <nuxt-img src="/images/logovector.svg" format="webp" quality="80" alt="Logo" />
            </div>
        </header>
        <div class="sections-container">
            <div class="section" v-for="slide in sortedSlides" :key="slide.id">
                <div :id="`slide-${slide.id}`" class="slide-container animate__animated animate__fadeIn"
                    :style="{ backgroundImage: slide.thumbnail ? `url(${slide.thumbnail})` : 'none' }">
                    <!-- slide1 -->
                    <div v-if="slide.id === 10" class="txtintro row m-0 p-0">
                        <div class="firstContainer">
                            <div class="slapjh">
                                <div class="subint" id="subint">
                                    <h2 class="text-element" v-html="slide.title"></h2>
                                    <p class="text-element" v-html="slide.wp_content"></p>
                                </div>
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
                    <!-- no internet access neeeded -->
                    <div v-else-if="slide.id === 21" id="thoiathoing" class="p-0 m-0">
                        <div class="cont p-2">
                            <div class="row">
                                <h3 id="mshill" v-html="slide.wp_content"></h3>
                            </div>
                            <div class="row flex-row">
                                <div v-for=" (paragraph, index) in slide.paragraphs" :key="index"
                                    class="text-element col m-0 p-2" v-html="paragraph">
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- other advantages    -->
                    <div v-else-if="slide.id === 22" id="thoiathoing" class="p-0 m-0">
                        <div class="cont p-2">
                            <div class="row">
                                <h3 id="mshill" v-html="slide.wp_content"></h3>
                            </div>
                            <div class="row flex-row">
                                <div v-for=" (paragraph, index) in slide.paragraphs" :key="index"
                                    class="text-element col m-0 p-2" v-html="paragraph">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else-if="[22, 23, 59].includes(slide.id)">
                        <div class="container">
                            <h2 class="text-element" v-html="slide.title"></h2>
                            <div v-for="(paragraph, index) in slide.paragraphs" :key="index" class="text-element"
                                v-html="paragraph">
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
            </div>
        </div>
    </div>
</template>
<style scoped>
/* Modifier le conteneur principal */

/* Style pour le body */
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
    overflow-y: scroll;
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
}

/*
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
}*/

.logo-loader {
    width: 150px;
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




.menu-lateral {
    position: fixed;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 1000;
}

.menu-lateral ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.menu-lateral li {
    margin: 10px 0;
}

.menu-anchor {
    display: block;
    width: 10px;
    height: 10px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 50%;
    transition: all 0.3s ease;
    position: relative;
}

.menu-anchor:hover,
.menu-anchor.active {
    background: #fff;
    transform: scale(1.5);
}

.menu-anchor:hover::after {
    content: attr(title);
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    white-space: nowrap;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 5px 10px;
    border-radius: 3px;
    font-size: 12px;
}
</style>
