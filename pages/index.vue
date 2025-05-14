<script setup>
import { onMounted, ref, computed, reactive, nextTick } from 'vue'
import { useSlidesStore } from '~/stores/slides'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Mousewheel, Scrollbar, Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/scrollbar'
import 'swiper/css/effect-fade'
import 'animate.css'
import gsap from 'gsap'


const swiperInstance = ref(null)
const showButton = ref(false)
const slidesStore = useSlidesStore()
const loading = computed(() => slidesStore.loading)
const sortedSlides = computed(() => slidesStore.sortedSlides)
const activeSlideIndex = ref(0)
const activeSlideId = ref(null)
const horizontalSwiperModules = [Navigation, Pagination, Autoplay]
const defaultBackground = ref('url(/images/bg12.webp)')
const specialBackground = ref('url(/images/nono.webp)')
const currentBackground = ref(defaultBackground.value)

// Fonction pour précharger l'image
const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = src
    img.onload = () => resolve(img)
    img.onerror = reject
  })
}

// Précharger les images
onMounted(async () => {
  try {
    await preloadImage('/images/nono.webp')
    await preloadImage('/images/bg12.webp')
  } catch (error) {
    // Ignorer les erreurs
  }
})

// Mettre à jour l'arrière-plan en fonction de la slide active
const updateBackground = () => {
  // S'assurer que la fonction s'exécute seulement après le montage du composant
  nextTick(() => {
    const wrapper = document.getElementById('vodacomwrapper');
    
    if (wrapper) {
      // Vérifier si l'une des slides spéciales est active en utilisant la classe swiper-slide-active
      const slide20Active = document.querySelector('#swiper-slide-20.swiper-slide-active');
      const slide114Active = document.querySelector('#swiper-slide-114.swiper-slide-active');
      
      if (slide20Active || slide114Active) {
        wrapper.style.backgroundImage = 'url(/images/nono.webp)';
        wrapper.style.backgroundSize = 'cover';
        wrapper.style.backgroundPosition = 'center center';
        wrapper.style.backgroundRepeat = 'no-repeat';
      } else {
        wrapper.style.backgroundImage = 'url(/images/bg12.webp)';
        wrapper.style.backgroundSize = 'cover';
        wrapper.style.backgroundPosition = 'center center';
        wrapper.style.backgroundRepeat = 'no-repeat';
      }
    }
  });
}

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
            // Récupérer l'ID de la slide active pour changer l'arrière-plan
            const activeSlide = sortedSlides.value[swiper.activeIndex]
            if (activeSlide) {
                activeSlideId.value = activeSlide.id
                updateBackground()
            }
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
        // Vérifier si les éléments existent avant d'animer
        const slide2a = document.getElementById('slide2a')
        const slide2b = document.getElementById('slide2b')
        const slide2c = document.getElementById('slide2c')
        const guysamuelElements = document.querySelectorAll('#guysamuel .text-element')
        
        if (slide2a) timeline.fromTo(slide2a, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
        if (slide2b) timeline.fromTo(slide2b, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
        if (slide2c) timeline.fromTo(slide2c, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
        if (guysamuelElements.length > 0) {
            timeline.fromTo(guysamuelElements, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.2 })
        }
    }

    // Slide 21 - No internet access needed
    else if (activeIndex === 3) {
        const mshill = document.getElementById('mshill')
        
        // Version Desktop
        if (window.innerWidth > 1024) {
            if (mshill) timeline.fromTo(mshill, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
            
            // Utiliser un sélecteur qui existe réellement
            const textElements = document.querySelectorAll('#thoiathoing .text-element')
            if (textElements.length > 0) {
                timeline.fromTo(textElements, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.2 })
            }
        }
        // Version Mobile
        else {
            if (mshill) timeline.fromTo(mshill, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
            
            // Utiliser un sélecteur qui existe réellement sur mobile
            const textElements = document.querySelectorAll('#thoiathoing .text-element')
            if (textElements.length > 0) {
                timeline.fromTo(textElements, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.2 })
            }
        }
    }

    // Slide 22 - Other advantages
    else if (activeIndex === 4) {
        const mshill = document.getElementById('mshill')
        const textElements = document.querySelectorAll('#thoiathoing .text-element')
        
        if (mshill) timeline.fromTo(mshill, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
        if (textElements.length > 0) {
            timeline.fromTo(textElements, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.2 })
        }
    }

    // Slide 59
    else if (activeIndex === 6) {
        const h2Element = document.querySelector('#killerjunior h2')
        const pElement = document.querySelector('#killerjunior p')
        const lemoudsElements = document.querySelectorAll('.lemouds')
        
        if (h2Element) timeline.fromTo(h2Element, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
        if (pElement) timeline.fromTo(pElement, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
        if (lemoudsElements.length > 0) {
            timeline.fromTo(lemoudsElements, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.2 })
        }
    }

    // Slide 60 - Form
    else if (activeIndex === 7) {
        const lopere = document.querySelector('.lopere')
        const ditocard = document.querySelectorAll('.ditocard')
        const contactForm = document.querySelector('.contact-form')
        
        if (lopere) timeline.fromTo(lopere, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
        if (ditocard.length > 0) timeline.fromTo(ditocard, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
        if (contactForm) timeline.fromTo(contactForm, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
    }
}
const updateFirstSlideStatus = () => {
    if (swiper.value) {
        isFirstSlideActive.value = swiper.value.activeIndex === 0
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

// Fonction pour vérifier directement quelle slide est active et gérer la transition d'arrière-plan
const checkActiveSlide = () => {
  // Chercher la slide active via la classe ajoutée par Swiper
  const activeSlideElement = document.querySelector('.swiper-slide-active');
  if (activeSlideElement) {
    const slideId = activeSlideElement.id;

    // Variables pour suivre la dernière slide active pour le crossfade spécial entre slides 20 et 114
    const lastSlideId = ref(null);

    // Récupérer les couches d'arrière-plan
    const primaryLayer = document.querySelector('.background-layer.background-primary');
    const secondaryLayer = document.querySelector('.background-layer.background-secondary');

    if (!primaryLayer || !secondaryLayer) return;

    // Vérifier si c'est une des slides spéciales
    if (slideId === 'swiper-slide-20' || slideId === 'swiper-slide-114') {
      // Transition spéciale entre slides 20 et 114
      if (lastSlideId.value === 'swiper-slide-20' && slideId === 'swiper-slide-114') {
        primaryLayer.style.transition = 'opacity 0.3s ease-in-out';
        primaryLayer.style.opacity = '0';
        secondaryLayer.style.transition = 'opacity 0.3s ease-in-out';
        secondaryLayer.style.opacity = '1';
      } else if (lastSlideId.value === 'swiper-slide-114' && slideId === 'swiper-slide-20') {
        primaryLayer.style.transition = 'opacity 0.3s ease-in-out';
        primaryLayer.style.opacity = '1';
        secondaryLayer.style.transition = 'opacity 0.3s ease-in-out';
        secondaryLayer.style.opacity = '0';
      } else {
        // Transition normale pour les autres cas
        secondaryLayer.style.transition = 'opacity 0.2s ease-in-out';
        secondaryLayer.style.opacity = '1';
      }

      // Stocker la slide active pour détecter le passage entre slides 20 et 114
      lastSlideId.value = slideId;
    } else {
      // Transition vers l'arrière-plan par défaut (bg12.webp)
      secondaryLayer.style.transition = 'opacity 0.2s ease-in-out';
      secondaryLayer.style.opacity = '0';

      // Réinitialiser l'ID de la dernière slide si on n'est plus sur une slide spéciale
      lastSlideId.value = null;
    }
  }
}

// Ajouter un intervalle pour vérifier régulièrement la slide active
onMounted(() => {
  // Précharger les images pour un changement fluide
  preloadImage('/images/nono.webp');
  preloadImage('/images/bg12.webp');
  
  // Vérifier périodiquement quelle slide est active
  const checkInterval = setInterval(checkActiveSlide, 500);
  
  // Nettoyage à l'unmont
  onUnmounted(() => {
    clearInterval(checkInterval);
  });
  
  // ...existing onMounted code...
});

// Définir des modules pour le swiper horizontal de Perdrix
const perdrixSwiperModules = [Mousewheel, Scrollbar, Pagination, Navigation, Autoplay, EffectFade]
const perdrixSwiperOptions = {
    modules: perdrixSwiperModules,
    direction: 'horizontal',
    slidesPerView: 1,
    mousewheel: true,
    speed: 800,
    spaceBetween: 30,
    // Activation explicite du défilement tactile
    touchRatio: 1,
    touchAngle: 45,
    touchMoveStopPropagation: true,
    grabCursor: true, // Change le curseur en main pour indiquer que l'élément est glissable
    // Ajout de l'effet fade
    effect: 'fade',
    fadeEffect: {
        crossFade: true
    },
    // Ajout de l'autoplay
    autoplay: {
        delay: 5000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
    },
    navigation: {
        nextEl: '.perdrix-swiper-button-next',
        prevEl: '.perdrix-swiper-button-prev',
    },
    pagination: {
        el: '.perdrix-swiper-pagination',
        clickable: true,
        type: 'bullets',
        dynamicBullets: true,
        dynamicMainBullets: 1
    },
    scrollbar: {
        el: '.perdrix-swiper-scrollbar',
        draggable: true,
        hide: false,
    },
}

// Fonctions pour extraire le titre, le texte et l'image du HTML des paragraphes
const extractTitle = (html) => {
  const match = html.match(/<h3>(.*?)<\/h3>/);
  return match ? match[1] : '';
}

const extractTextContent = (html) => {
  // Extraire le contenu texte (paragraphes et listes) en excluant les images
  let content = html.replace(/<h3>.*?<\/h3>/, ''); // Enlever le titre
  content = content.replace(/<img.*?\/?>/g, ''); // Enlever les balises img
  return content;
}

const extractImage = (html) => {
  const match = html.match(/src="([^"]*?)"/);
  return match ? match[1] : '';
};

// Fonction pour gérer l'accordéon de la section #casestudy
const caseStudyActiveIndex = ref(0)

const initCaseStudyAccordion = () => {
  // Afficher par défaut le premier élément
  caseStudyActiveIndex.value = 0
}

const toggleCaseStudySection = (index) => {
  caseStudyActiveIndex.value = index
};
</script>

<template>
    <div id="vodacomwrapper">
        <!-- Couches d'arrière-plan pour transition fluide -->
        <div class="background-layer background-primary"></div>
        <div class="background-layer background-secondary"></div>
        
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
                <img src="/images/logovector.svg" alt="Logo" />
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
                :class="{ 'slide-active': index === activeSlideIndex }"
                :id="`swiper-slide-${slide.id}`">
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
                      <!-- reach 32 million customers part deux-->
                      <div v-else-if="slide.id === 114" id="kiffyu" class="p-0 m-0">
                        <div id="tchoffo">
                            <div id="deffp" class="preme">
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
                            <div class="row flex-row align-content-center align-items-center juustify-content-center">
                                <div v-for="(paragraph, index) in slide.paragraphs" :key="index"
                                    class="text-element col m-0 p-2" v-html="paragraph">
                                </div>
                            </div>
                        </div>


                    </div>

                    <div v-else-if="slide.id === 23" id="bygone-bip" class="p-0 m-0">
                        <div class="container">
                            <div id="perdrix" class="row">
                                <!-- Swiper horizontal pour les text-elements avec effet fade -->
                                <Swiper
                                    class="perdrix-swiper"
                                    :modules="perdrixSwiperModules"
                                    direction="horizontal"
                                    effect="fade"
                                    :mousewheel="true"
                                    :scrollbar="{ draggable: true, hide: false, el: '.perdrix-swiper-scrollbar' }"
                                    :pagination="{ 
                                        clickable: true, 
                                        el: '.perdrix-swiper-pagination',
                                        type: 'bullets',
                                        dynamicBullets: true,
                                        dynamicMainBullets: 1
                                    }"
                                    :navigation="{
                                        nextEl: '.perdrix-swiper-button-next',
                                        prevEl: '.perdrix-swiper-button-prev'
                                    }"
                                    :autoplay="{
                                        delay: 3000,
                                        disableOnInteraction: false,
                                        pauseOnMouseEnter: false
                                    }"
                                    :slides-per-view="1"
                                    :space-between="30"
                                    :speed="800"
                                >
                                    <div class="perdrix-swiper-scrollbar"></div>
                                    <div class="perdrix-swiper-pagination"></div>
                                    <div class="perdrix-swiper-button-prev"></div>
                                    <div class="perdrix-swiper-button-next"></div>
                                    <SwiperSlide v-for="(paragraph, index) in slide.paragraphs" :key="index" class="perdrix-slide">
                                        <div class="split-container">
                                            <div class="text-container">
                                                <!-- Extraction du titre et du texte -->
                                                <h3 v-if="extractTitle(paragraph)">{{ extractTitle(paragraph) }}</h3>
                                                <div class="text-content" v-html="extractTextContent(paragraph)"></div>
                                            </div>
                                            <div class="image-container">
                                                <!-- Extraction de l'image -->
                                                <img v-if="extractImage(paragraph)" :src="extractImage(paragraph)" alt="Feature illustration" class="feature-image" />
                                            </div>
                                        </div>
                                    </SwiperSlide>
                                </Swiper>
                            </div>
                        </div>
                    </div>


                    <div v-else-if="slide.id === 59">
                        <div id="killerjunior" class="ouh">
                            <div class="row">
                                <div class="col-md-5 leporc">
                                    <h2 class="text-element aya" v-html="slide.title"></h2>
                                    <p v-html="slide.wp_content"></p>
                                </div>
                                <div class="col-md-7 kankan">
                                    <div v-for="(paragraph, index) in slide.paragraphs" :key="index" class="lemouds"
                                        v-html="paragraph">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-else-if="slide.id === 128">
                        <div id="killerwu" class="ouh">
                            <div class="case-study-container">
                                <div class="row">

                                    <div class="col-md-7">
                                        <div id="casestudy">
                                            <div id="dec">  
                                                <h2 class="text-element aya" v-html="slide.title"></h2>

                                                <div v-for="(paragraph, index) in slide.paragraphs" :key="index"
                                                    class="text-element col m-0 p-2" 
                                                    :class="{'case-study-active': index === caseStudyActiveIndex, 'case-study-item': true}">
                                                    <h3 @click="toggleCaseStudySection(index)" class="case-study-header">
                                                        {{ extractTitle(paragraph) }}
                                                        <span class="case-study-indicator">{{ index === caseStudyActiveIndex ? '−' : '+' }}</span>
                                                    </h3>
                                                    <div class="case-study-content" :class="{'case-study-content-visible': index === caseStudyActiveIndex}">
                                                        <div v-html="extractTextContent(paragraph)"></div>
                                                    </div>
                                                </div>
                                            </div>
                                                                                
                                </div>
                                    </div>
                                    <div class="col-md-5">
                                        <div class="case-study-image">
                                    <img v-if="slide.thumbnail" :src="slide.thumbnail" alt="Case Study Image" class="img-fluid">
                                </div>
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
                                    <img src="/images/backToTop.svg" alt="Back to Top" />
                                </a>
                            </div>
                        </div>
                    </div>

              
                </div>
            </SwiperSlide>
        </Swiper>

        <!-- Swiper spécifique pour la slide 23 (Perdrix) -->
        <div v-if="sortedSlides[activeSlideIndex]?.id === 23" class="perdrix-swiper-container">
            <Swiper v-bind="perdrixSwiperOptions" class="perdrix-swiper">
                <div class="perdrix-swiper-scrollbar"></div>
                <div class="perdrix-swiper-pagination"></div>
                <SwiperSlide v-for="(paragraph, index) in sortedSlides[activeSlideIndex].paragraphs" :key="index"
                    class="perdrix-slide">
                    <div class="text-element" v-html="paragraph"></div>
                </SwiperSlide>
            </Swiper>
        </div>
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


/* Style personnalisé pour les points de pagination */
.perdrix-swiper-pagination {
    position: absolute;
    bottom: 20px;
    left: 0;
    right: 0;
    text-align: center;
    z-index: 10;
    
    .swiper-pagination-bullet {
        width: 12px;
        height: 12px;
        background: rgba(255, 255, 255, 0.6);
        opacity: 0.6;
        margin: 0 5px;
        transition: all 0.3s ease;
        
        &-active {
            background: #ffffff;
            opacity: 1;
            width: 14px;
            height: 14px;
            transform: scale(1.2);
        }
    }
    
    /* Style pour les bullets dynamiques */
    .swiper-pagination-bullet-active-main {
        transform: scale(1.4);
        background: #ffffff;
        opacity: 1;
    }
    
    .swiper-pagination-bullet-active-prev,
    .swiper-pagination-bullet-active-next {
        transform: scale(1.1);
        background: rgba(255, 255, 255, 0.8);
    }
    
    .swiper-pagination-bullet-active-prev-prev,
    .swiper-pagination-bullet-active-next-next {
        transform: scale(0.9);
        background: rgba(255, 255, 255, 0.5);
    }
}

.perdrix-swiper-scrollbar {
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    bottom: 5px;
    
    .swiper-scrollbar-drag {
        background: #e60000;
        border-radius: 4px;
    }
}

/* Structure en deux colonnes pour les slides Perdrix */
.perdrix-swiper-container {
    position: relative;
    width: 100%;
    height: 80vh;
    margin: 0 auto;
    max-width: 90%;
}

.perdrix-swiper {
    width: 100%;
    height: 100%;
    margin: 0 auto;
}

.perdrix-slide {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0px;
    box-sizing: border-box;
    height: auto;
}

.split-container {
    display: flex;
    width: 100%;
    height: 100%;
    border-radius: 15px;
    overflow: hidden;
}

.text-container {
    flex: 1;
    padding: 40px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.text-container h3 {
    color: #fff;
    font-size: 2rem;
    margin-bottom: 20px;
    font-weight: 700;
}

.text-content {
    color: #fff;
    font-size: 1.1rem;
    line-height: 1.6;
}

.text-content ul {
    padding-left: 20px;
    margin: 15px 0;
}

.text-content li {
    margin-bottom: 8px;
}

.image-container {
    flex: 1;
    display: flex;
    align-items: flex-end;
    justify-content:center;
    overflow: hidden;
}

.feature-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    transition: transform 0.3s ease;
}

.feature-image:hover {
    transform: scale(1.05);
}

.perdrix-swiper-button-next,
.perdrix-swiper-button-prev {
    color: #ffffff !important;
    background-color: rgba(255, 255, 255, 0.7);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:after {
        font-size: 18px;
    }
    
    &:hover {
        background-color: rgba(255, 255, 255, 0.9);
    }
}

/* Styles spécifiques pour l'effet fade */
.swiper-fade.swiper-free-mode .swiper-slide {
    transition-timing-function: ease-out;
}

.swiper-fade .swiper-slide {
    pointer-events: none;
    transition-property: opacity;
}

.swiper-fade .swiper-slide .swiper-slide {
    pointer-events: none;
}

.swiper-fade .swiper-slide-active,
.swiper-fade .swiper-slide-active .swiper-slide-active {
    pointer-events: auto;
}

/* Assurez-vous que les slides ont une position absolue pour l'effet fade */
.perdrix-swiper.swiper-fade .swiper-slide {
    opacity: 0 !important;
    transition: opacity 0.8s ease;
    position: absolute !important;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
}

.perdrix-swiper.swiper-fade .swiper-slide-active {
    opacity: 1 !important;
    position: relative !important;
    z-index: 5;
}

/* Responsive */
@media screen and (max-width: 992px) {
    .split-container {
        flex-direction: column;
    }
    
    .text-container, .image-container {
        flex: none;
        width: 100%;
    }
    
    .text-container {
        padding: 30px;
    }
    
    .image-container {
        height: 250px;
    }
}

/* Styles pour le case study accordéon */
#casestudy {
    padding: 0;
  margin: 20px 0 !important;
  width: 100%;
  margin: 0 auto;
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
  max-width: 100% !important;
    }

#casestudy .text-element {
  margin: 0;
  padding: 0;
  width: 100%;
}

.case-study-item {
  margin-bottom: 0px; /* Éliminer la marge entre les éléments */
  border-radius: 0px; /* Éliminer les coins arrondis pour un design plus compact */
  overflow: hidden;
  width: 100%;
}
.case-study-container{
    .col-md-6{
        &:nth-of-type(1) {
            display: flex;align-items:center;justify-content: center;flex-direction: column;
            #casestudy{

                
            }
        }
    }
}
#dec{
}
#casestudy{
    height:100vh;
.aya{
    font-family: Vodafone;
    font-size: 102px;
    font-weight: bold;
    font-stretch: normal;
    font-style: normal;
    line-height: 1;
    letter-spacing: normal;
    text-align: left;
    color: #f00;
    padding-bottom:30px;
    display:flex;
    justify-content: center;
    align-items: flex-start;
}
    .case-study-header {  
        width:100%;
        display:block;
    justify-content: center;
    align-items: flex-start;
    opacity: 0.27;
  font-family: Vodafone;
  font-size: 48px;
  font-weight: bold;
  font-stretch: normal;
  font-style: normal;
  line-height: 0.83;
  letter-spacing: normal;
  text-align: left;
  color: #231f20;
&:hover{
    cursor: pointer;
    opacity: 1;
    color:#ff0000;
  }

}

.case-study-active{
    h3{
        cursor: pointer;
    opacity: 1;
    color:#ff0000;
  }
  }
}
.case-study-indicator {
    display:none;
  font-size: 24px;
  font-weight: bold;
  transition: transform 0.3s ease;
}

.case-study-active .case-study-indicator {
  transform: rotate(180deg);
}

.case-study-content {
  max-height: 0;
  display:block;
  width:100%;
  overflow: hidden;
  transition: max-height 0.3s ease, padding 0.2s ease; /* Transition plus rapide */
  padding: 0;
  opacity: 0;
  transform: translateY(-10px);
  ul{
    list-style: none;
    display: flex;align-items:center;justify-content: flex-start;flex-direction: row;
    li{
        display: flex;align-items:center;justify-content: center;flex-direction: column;
        margin-right: 4em;
        font-family: Raleway;
  font-size: 23px;
  font-weight: normal;
  font-stretch: normal;
  font-style: normal;
  line-height: 1.44;
  letter-spacing: normal;
  text-align: left;
  color: #000;
        strong{

            width: 94px;
  height: 94px;
  flex-grow: 0;
  display: flex;align-items:center;justify-content: center;flex-direction: column;
  background-color: #f00;
  border-radius:100%;
  font-family: Vodafone;
  font-size: 50px;
  font-weight: bold;
  font-stretch: normal;
  font-style: normal;
  line-height: 0.8;
  letter-spacing: normal;
  text-align: center;
  color: #fff;
  span{
    font-size:21px;
  }
        }
    }
  }
}

.case-study-content-visible {
  max-height: 500px;
  padding: 00px;
  opacity: 1;
  transform: translateY(0);
  transition: max-height 0.4s ease, padding 0.2s ease, opacity 0.3s ease, transform 0.3s ease; /* Toutes les transitions en même temps */
}

/* Style des éléments à l'intérieur de l'accordéon */
.case-study-content ul {
  padding-left: 20px;
  margin: 10px 0;
}

.case-study-content strong {
  color: #e60000;
  font-size: 1.2em;
}

/* Ajout des styles CSS pour la disposition en deux colonnes (accordéon et image) dans la section case study */
.case-study-container {
  display: flex;
  width: 100%;
  gap: 30px;
  align-items: flex-start;
  margin-top: 20px;
  background-color: #d9d9d9;

}

#casestudy {
  flex: 1;
  max-width: 60%;
}

.case-study-image {
}

.case-study-image img {
}

.case-study-image img:hover {
  transform: scale(1.05);
}

/* Responsive design pour les appareils mobiles */
@media screen and (max-width: 992px) {
  .case-study-container {
    flex-direction: column;
  }
  
  #casestudy, .case-study-image {
    max-width: 100%;
  }
  
  .case-study-image {
    margin-top: 20px;
    order: -1; /* Afficher l'image avant l'accordéon sur mobile */
  }
}
</style>
