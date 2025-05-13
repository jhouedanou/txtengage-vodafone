<script setup>
import { onMounted, ref, computed, reactive } from 'vue'
import { useSlidesStore } from '~/stores/slides'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Mousewheel, Scrollbar, Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/scrollbar'
import 'animate.css'
import gsap from 'gsap'


const swiperInstance = ref(null)
const showButton = ref(false)
const slidesStore = useSlidesStore()
const loading = computed(() => slidesStore.loading)
const sortedSlides = computed(() => slidesStore.sortedSlides)
const activeSlideIndex = ref(0)
const horizontalSwiperModules = [Navigation, Pagination, Autoplay]
//back to top btn

//slide 23

const activeIndex = ref(null)
const activeImage = ref(null)

const toggleAccordion = (slideId, index) => {
    const currentSlide = slidesStore.sortedSlides.find(s => s.id === slideId)
    if (!currentSlide) return

    activeIndex.value = activeIndex.value === index ? null : index
    const imgSrc = currentSlide.paragraphs?.[index]?.match(/src="([^"]*)"/)?.[1]
    activeImage.value = imgSrc
}

const isFirstSlideActive = ref(true)
const swiper = ref(null)
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
    onSwiper: (instance) => {
        swiper.value = instance
    },
    on: {
        slideChange: (swiper) => {
            activeSlideIndex.value = swiper.activeIndex
            updateFirstSlideStatus()
        }
    },
    onSlideChange: (swiper) => {
        animateSlideElements(swiper.activeIndex)
    }
}
//animations 

const animateSlideElements = (activeIndex) => {
    const timeline = gsap.timeline()

    // Slide 20 - Reach 32 million customers
    if (activeIndex === 2) {
        timeline
            .fromTo('#slide2a', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
            .fromTo('#slide2b', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
            .fromTo('#slide2c', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
            .fromTo('#guysamuel .text-element', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.2 })
    }

    // Slide 21 - No internet access needed
    else if (activeIndex === 3) {

        // Version Desktop
        if (window.innerWidth > 1024) {
            timeline
                .fromTo('#mshill', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
                .fromTo('.desktop-version .text-element',
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.5, stagger: 0.2 }
                )
        }
        // Version Mobile
        else {
            timeline
                .fromTo('.mobile-slide-part:first-child #mshill',
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.5 }
                )
                .fromTo('.mobile-slide-part:last-child .text-element',
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.5, stagger: 0.2 }
                )
        }

    }

    // Slide 22 - Other advantages
    else if (activeIndex === 4) {
        timeline
            .fromTo('#mshill', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
            .fromTo('#thoiathoing .text-element', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.2 })
    }

    // Slide 23 - Accordion
    else if (activeIndex === 5) {
        // timeline
        //     .fromTo('#naci .accordion-item', { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.2 })
        //     .fromTo('#lephone img', { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.5 })
    }

    // Slide 59
    else if (activeIndex === 6) {
        timeline
            .fromTo('#killerjunior h2', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
            .fromTo('#killerjunior p', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
            .fromTo('.lemouds', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.2 })
    }

    // Slide 60 - Form
    else if (activeIndex === 7) {
        timeline
            .fromTo('.lopere', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
            .fromTo('.ditocard', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
            .fromTo('.contact-form', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
    }
}
const updateFirstSlideStatus = () => {
    if (swiper.value) {
        isFirstSlideActive.value = swiper.value.activeIndex === 0
        console.log(isFirstSlideActive.value)
    }
}
const goToFirstSlide = () => {
    if (swiper.value) {
        swiper.value.slideTo(0)
    } else {
        console.error('Swiper instance is not available')
    }
}
//fin, des mérhode liées à swiper 
const autoPlayAccordion = () => {
    const currentSlide = sortedSlides.value?.find(s => s.id === 23)
    if (!currentSlide?.paragraphs) return

    const totalItems = currentSlide.paragraphs.length
    let currentIndex = 0

    setInterval(() => {
        toggleAccordion(currentSlide.id, currentIndex)
        currentIndex = (currentIndex + 1) % totalItems
    }, 50000)
}



//autoplay toutes les 10 secondes
// let autoplayInterval = null

// const startAutoplay = () => {
//     const currentSlide = sortedSlides.value.find(s => s.id === 23)
//     const totalItems = currentSlide.paragraphs.length
//     let currentIndex = 0

//     autoplayInterval = setInterval(() => {
//         toggleAccordion(currentSlide.id, currentIndex)
//         currentIndex = (currentIndex + 1) % totalItems
//     }, 50000)
// }

// const stopAutoplay = () => {
//     clearInterval(autoplayInterval)
// }


const formData = ref({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: ''
})

const showAlert = ref(false)
const alertType = ref('')
const alertMessage = ref('')

const submitForm = async () => {
    loading.value = true
    try {
        const response = await fetch('https://public.herotofu.com/v1/f69a2860-b0b2-11ef-b6f4-4774a3a77de8', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                name: `${formData.value.firstName} ${formData.value.lastName}`,
                email: formData.value.email,
                company: formData.value.company,
                phone: formData.value.phone,
            })
        })

        if (response.ok) {
            alertType.value = 'alert-success'
            alertMessage.value = 'Message envoyé avec succès !',
                formData.value = {
                    firstName: '',
                    lastName: '',
                    email: '',
                    company: '',
                    phone: ''
                }
        }
    } catch (error) {
        alertType.value = 'alert-danger'
        alertMessage.value = 'Une erreur est survenue. Veuillez réessayer.'
    } finally {
        showAlert.value = true
        loading.value = false
        setTimeout(() => {
            showAlert.value = false
        }, 5000)
    }
}
//back to top 

onMounted(() => {
    slidesStore.fetchSlides()
    slidesStore.startAutoRefresh()
    //Afficher local relevance en tant que première slide dans la sldie 23
    activeIndex.value = 0
    //changement automatique de l'image dans la slide 23
    const firstSlide = sortedSlides.value.find(s => s.id === 23)
    if (firstSlide?.paragraphs?.[0]) {
        activeImage.value = firstSlide.paragraphs[0].match(/src="([^"]*)"/)?.[1]
    }    //auto play sur le clic sur l'image 
    //autoPlayAccordion()
    // startAutoplay()

});

const isMobile = ref(false)

const checkScreenSize = () => {
    isMobile.value = window.innerWidth < 1025
}

const isMenuOpen = ref(false)


const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value
}

const goToSlide = (index) => {
    if (swiper.value && swiper.value.slideTo) {
        swiper.value.slideTo(index)
        isMenuOpen.value = false
    }
}


onMounted(() => {
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
})

onUnmounted(() => {
    window.removeEventListener('resize', checkScreenSize)
});

useHead({
    title: 'TXT Engage - Vodafone'
});
</script>

<template>
    <div id="vodacomwrapper">
        <div v-if="loading" class="loader-container">
            <nuxt-img src="/images/logovector.svg" class="logo-loader" alt="Logo" />
        </div>
        
        <div v-if="!loading && slidesStore.error" class="error-container">
            <div class="error-message">
                <p>{{ slidesStore.error }}</p>
                <button @click="slidesStore.fetchSlides()" class="retry-button">Réessayer</button>
            </div>
        </div>

        <header class="fixed-top">
            <div id="headerpadding" class="p-4 flex-row justify-content-between align-items-center">
                <nuxt-img src="/images/logovector.svg" alt="Logo" />
                <div class="menu-container">
                    <button class="hamburger" @click="toggleMenu" :class="{ 'is-active': isMenuOpen }">
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                    <nav class="slide-menu" :class="{ 'is-open': isMenuOpen }">
                        <ul>
                            <li v-for="(slide, index) in sortedSlides" :key="slide.id"
                                :class="{ active: activeSlideIndex === index }" @click="goToSlide(index)">
                                <span class="slide-label">{{ slide.menuTitle }}</span>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </header>

        <Swiper v-bind="swiperOptions" class="sections-container">
            <div class="swiper-scrollbar"></div>
            <SwiperSlide v-for="(slide, index) in sortedSlides" :key="slide.id"
                :class="{ 'slide-active': index === activeSlideIndex }">
                <div :id="`slide-${slide.id}`" class="slide-container animate__animated animate__fadeIn"
                    :style="{ backgroundImage: isMobile ? (slide.backgroundMobile ? `url(${slide.backgroundMobile})` : 'none') : (slide.thumbnail ? `url(${slide.thumbnail})` : 'none') }">
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
                    <!-- no internet access needed -->
                    <div v-else-if="slide.id === 21" id="thoiathoing" class="p-0 m-0">
                        <!-- Version Desktop -->
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

                   
                    <!-- other advantages -->
                    <div v-else-if="slide.id === 22" id="thoiathoing" class="p-0 m-0">
                        <!-- Version Desktop -->
                        <div class="cont p-2">
                            <div class="row">
                                <h3 id="mshill" v-html="slide.wp_content"></h3>
                            </div>
                            <div class="row flex-row align-content-center align-items-center juustify-content-center">>
                                <div v-for="(paragraph, index) in slide.paragraphs" :key="index"
                                    class="text-element col m-0 p-2" v-html="paragraph">
                                </div>
                            </div>
                        </div>


                    </div>

                    <div v-else-if="slide.id === 23" id="bygone-bip" class="p-0 m-0">
                        <div class="container">

                            <div class="row">
                                <!-- Colonne de gauche pour les images -->
                                <div id="naci" class="col-md-5 col-sm-12">
                                    <div :id="`letexte-${index}`" v-for="(paragraph, index) in slide.paragraphs"
                                        :key="index" class="accordion-item">
                                        <div class="accordion-header" @click="toggleAccordion(slide.id, index)"
                                            :class="{ 'active-header': activeIndex === index }">
                                            <div v-html="paragraph.split('</h3>')[0] + '</h3>'"
                                                :class="{ 'active-title': activeIndex === index }"></div>
                                        </div>
                                        <div class="accordion-content" :class="{ active: activeIndex === index }">
                                            <p v-html="paragraph.split('</h3>')[1].split('<p>')[1].split('</p>')[0]">
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div id="lephone" class="col-md-7 col-sm-12">
                                    <img v-if="activeImage" :src="activeImage"
                                        :class="['slide-image', { visible: activeImage }]" alt="Slide image">
                                </div>
                            </div>
                        </div>
                    </div>


                    <div v-else-if="slide.id === 59">
                        <div id="killerjunior" class="ouh">
                            <div class="row">
                                <div class="col-md-7">
                                    <h2 class="text-element aya" v-html="slide.title"></h2>
                                    <p v-html="slide.wp_content"></p>
                                </div>
                                <div class="col-md-5">
                                    <div v-for="(paragraph, index) in slide.paragraphs" :key="index" class="lemouds"
                                        v-html="paragraph">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="lemof" v-else-if="slide.id === 60">
                        <div id="lafill" class="container">
                            <h2 class="text-element lopere" v-html="slide.title"></h2>
                            <div v-for="(paragraph, index) in slide.paragraphs" :key="index"
                                class="text-element ditocard" v-html="paragraph">
                            </div>
                            <div class="form-container">
                                <div v-if="showAlert" :class="['alert', alertType]" role="alert">
                                    {{ alertMessage }}
                                </div>
                                <form @submit.prevent="submitForm" class="contact-form">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <input v-model="formData.firstName" type="text" class="form-control"
                                                placeholder="First Name" required>
                                        </div>
                                        <div class="col-md-6 col-sm-12">
                                            <input v-model="formData.lastName" type="text" class="form-control"
                                                placeholder="Last Name" required>
                                        </div>
                                    </div>

                                    <div class="row">
                                        <div class="col-md-12">

                                            <input v-model="formData.email" type="email" class="form-control"
                                                placeholder="Email Address" required>
                                        </div>
                                    </div>

                                    <div class="row">
                                        <div class="col-md-12">

                                            <input v-model="formData.company" type="text" class="form-control"
                                                placeholder="Company Name" required>
                                        </div>
                                    </div>

                                    <div class="row">
                                        <div class="col-md-12">
                                            <input v-model="formData.phone" type="tel" class="form-control"
                                                placeholder="Contact Number" required>
                                        </div>

                                    </div>

                                    <div class="row submit-row">
                                        <div class="col-md-">

                                            <button type="submit" class="btn btn-primary" :disabled="loading">
                                                {{ loading ? 'Sending...' : 'Submit' }}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div id="yenamarre" class="d-flex align-items-center justify-content-center m-4">
                                <!-- back to top btn-->
                                <a @click="goToFirstSlide" class="back-to-top" :class="{ 'show': showButton }">
                                    <NuxtImg src="/images/backToTop.svg" alt="Back to Top" />
                                </a>
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
    background-color: rgba(255, 255, 255, 0.1);
    background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
    background-size: 20px 20px;
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


/* Styles pour la slide 15 avec effet de recouvrement */
#overlay-slide {
  position: relative;
  z-index: 10;
}

.overlay-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  opacity: 0;
  transition: opacity 0.8s ease-in-out;
  z-index: 20;
  
  &.active {
    opacity: 1;
  }
}

.blur-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(10px);
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 1;
}

.content-container {
  position: relative;
  z-index: 2;
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.overlay-title {
  font-size: 4rem;
  margin-bottom: 2rem;
  text-align: center;
  font-weight: 800;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  
  @media screen and (max-width: 1024px) {
    font-size: 2.8rem;
  }
}

.overlay-text {
  font-size: 1.8rem;
  max-width: 800px;
  text-align: center;
  margin-bottom: 2rem;
  line-height: 1.5;
  
  @media screen and (max-width: 1024px) {
    font-size: 1.4rem;
  }
}

.paragraphs-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2rem;
  width: 100%;
}

.overlay-paragraph {
  flex: 1 1 300px;
  max-width: 400px;
  text-align: center;
  padding: 1.5rem;
  background-color: rgba(230, 0, 0, 0.2);
  border-radius: 10px;
  backdrop-filter: blur(5px);
  transition: transform 0.3s ease-in-out;
  
  &:hover {
    transform: translateY(-10px);
    background-color: rgba(230, 0, 0, 0.3);
  }
  
  h3 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
    color: white;
  }
  
  p {
    font-size: 1.2rem;
    line-height: 1.4;
  }
}

.swiper-slide {
    height: 100vh;
    transition: all 0.5s ease;

    &.swiper-slide-active {
        .overlay-content {
            &.active {
                opacity: 1;
            }
        }
    }
}



.alert {
    margin-bottom: 1rem;
    padding: 1rem;
    border-radius: 4px;
    animation: fadeIn 0.3s ease;
}

.alert-success {
    background-color: #d4edda;
    border-color: #c3e6cb;
    color: #155724;
}

.alert-danger {
    background-color: #f8d7da;
    border-color: #f5c6cb;
    color: #721c24;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

#yenamarre {
    a {
        &:hover {
            cursor: pointer;
        }
    }
}

.back-to-top {
    width: 128px;
    height: 80px;
    position: fixed;
    margin: auto;
    right: 0;
    bottom: 1em;
    left: 0;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 1000;
}

.back-to-top:hover {
    transform: scale(1.1);
}


@media screen and (max-width: 1024px) {

    #slide-21,
    #slide-22 {
        .row {
            height: auto;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;

            &:nth-of-type(1) {
                margin-bottom: 2em;
            }

            &:nth-of-type(2) {
                .text-element {
                    min-height: auto;
                    margin: 1em 0;

                    p {
                        min-height: auto;
                        line-height: 0.7 !important;
                        padding: 0em;
                    }
                }
            }
        }

        .cont {
            height: 100%;
            display: flex;
            flex-direction: column;
        }
    }
}

//menuy



.menu-container {
    position: relative;
}

.hamburger {
    width: 30px;
    height: 25px;
    position: relative;
    background: none;
    border: none;
    cursor: pointer;
    z-index: 101;

    span {
        display: block;
        position: absolute;
        height: 3px;
        width: 100%;
        background: #e60000;
        transition: 0.3s ease;

        &:nth-child(1) {
            top: 0;
        }

        &:nth-child(2) {
            top: 50%;
            transform: translateY(-50%);
        }

        &:nth-child(3) {
            bottom: 0;
        }
    }

    &.is-active {
        span {
            &:nth-child(1) {
                transform: rotate(45deg);
                top: 11px;
            }

            &:nth-child(2) {
                opacity: 0;
            }

            &:nth-child(3) {
                transform: rotate(-45deg);
                bottom: 11px;
            }
        }
    }
}

.slide-menu {
    position: fixed;
    top: 0;
    right: -300px;
    width: 300px;
    height: 100vh;
    background: rgba(0, 0, 0, 0.9);
    padding: 80px 20px;
    transition: 0.3s ease;
    z-index: 100;

    &.is-open {
        right: 0;
    }

    ul {
        list-style: none;
        padding: 0;
    }

    li {
        padding: 15px 0;
        color: white;
        cursor: pointer;
        transition: 0.3s ease;

        &:hover {
            color: #e60000;
        }

        &.active {
            color: #e60000;
        }
    }
}

.menu-container {
    position: fixed;
    right: 31px;
    color: white;
    top: 29px;

    .hamburger {
        span {
            background-color: white;
        }
    }
}
</style>
