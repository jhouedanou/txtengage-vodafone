<script setup>
import { onMounted, ref, computed } from 'vue'
import { useSlidesStore } from '~/stores/slides'
import gsap from 'gsap'
import 'fullpage.js/dist/fullpage.min.css'
import fullpage from 'fullpage.js'

const showButton = ref(false)
const slidesStore = useSlidesStore()
const loading = computed(() => slidesStore.loading)
const sortedSlides = computed(() => slidesStore.sortedSlides)
const activeSlideIndex = ref(0)
const activeIndex = ref(null)
const activeImage = ref(null)
const isMobile = ref(false)

const toggleAccordion = (slideId, index) => {
    const currentSlide = sortedSlides.value.find(s => s.id === slideId)
    if (!currentSlide) return

    activeIndex.value = activeIndex.value === index ? null : index
    const imgSrc = currentSlide.paragraphs?.[index]?.match(/src="([^"]*)"/)?.[1]
    activeImage.value = imgSrc
}


const initFullPage = () => {
    nextTick(() => {
        if (document.getElementById('fullpage')) {
            new fullpage('#fullpage', {
                scrollingSpeed: 800,
                onLeave: (origin, destination) => {
                    activeSlideIndex.value = destination.index
                    animateSlideElements(destination.index)
                },
                scrollOverflow: true,
                scrollOverflowReset: true,
                touchSensitivity: 15,
                //normalScrollElements: '#slide-21 .cont, #slide-22 .cont'
            })
        }
    })
}


const animateSlideElements = (activeIndex) => {
    const timeline = gsap.timeline()

    if (activeIndex === 2) {
        timeline
            .fromTo('#slide2a', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
            .fromTo('#slide2b', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
            .fromTo('#slide2c', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
            .fromTo('#guysamuel .text-element', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.2 })
    }
    else if (activeIndex === 3) {
        if (window.innerWidth > 1024) {
            timeline
                .fromTo('#mshill', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
                .fromTo('.text-element', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.2 })
        }
        else {
            timeline
                .fromTo('#mshill', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
                .fromTo('.text-element', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.2 })
        }
    }
    else if (activeIndex === 4) {
        timeline
            .fromTo('#mshill', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
            .fromTo('#thoiathoing .text-element', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.2 })
    }
    else if (activeIndex === 6) {
        timeline
            .fromTo('#killerjunior h2', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
            .fromTo('#killerjunior p', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
            .fromTo('.lemouds', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.2 })
    }
    else if (activeIndex === 7) {
        timeline
            .fromTo('.lopere', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
            .fromTo('.ditocard', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
            .fromTo('.contact-form', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
    }
}

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
            alertMessage.value = 'Message envoyé avec succès !'
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

const checkScreenSize = () => {
    isMobile.value = window.innerWidth < 1025
}
onMounted(async () => {
    await slidesStore.fetchSlides()
    initFullPage()
})
// onMounted(() => {
//     //slidesStore.fetchSlides()
//     slidesStore.startAutoRefresh()
//     activeIndex.value = 0
//     const firstSlide = sortedSlides.value.find(s => s.id === 23)
//     if (firstSlide?.paragraphs?.[0]) {
//         activeImage.value = firstSlide.paragraphs[0].match(/src="([^"]*)"/)?.[1]
//     }
//     checkScreenSize()
//     window.addEventListener('resize', checkScreenSize)
//     // initFullPage()
// })
onMounted(async () => {
    await slidesStore.fetchSlides()
    activeIndex.value = 0
    const firstSlide = sortedSlides.value.find(s => s.id === 23)
    if (firstSlide?.paragraphs?.[0]) {
        activeImage.value = firstSlide.paragraphs[0].match(/src="([^"]*)"/)?.[1]
    }
    initFullPage()
})
onUnmounted(() => {
    window.removeEventListener('resize', checkScreenSize)
});
</script><template>
    <div id="vodacomwrapper">
        <div v-if="loading" class="loader-container">
            <nuxt-img src="/images/logovector.svg" class="logo-loader" format="webp" quality="80" alt="Logo" />
        </div>

        <header class="fixed-top">
            <div id="headerpadding" class="p-4 flex-row justify-content-between align-items-center">
                <nuxt-img src="/images/logovector.svg" format="webp" quality="80" alt="Logo" />
            </div>
        </header>

        <div id="fullpage">
            <div v-for="(slide, index) in sortedSlides" :key="slide.id" class="section"
                :class="{ 'fp-scrollable': [21, 22].includes(slide.id) }">
                <div :id="`slide-${slide.id}`" class="slide-container animate__animated animate__fadeIn"
                    :style="{ backgroundImage: slide.thumbnail ? `url(${slide.thumbnail})` : 'none' }">

                    <!-- Première slide -->
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

                    <!-- Slide 1 -->
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

                    <!-- Reach 32 million customers -->
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

                    <!-- No internet access needed -->
                    <div v-else-if="slide.id === 21" id="thoiathoing" class="p-0 m-0">
                        <div class="cont p-2">
                            <div class="row header-row">
                                <h3 id="mshill" v-html="slide.wp_content"></h3>
                            </div>
                            <div class="row flex-row content-row">
                                <div v-for="(paragraph, index) in slide.paragraphs" :key="index"
                                    class="text-element col-sm-12 col-md-3 m-0 p-2" v-html="paragraph">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Other advantages -->
                    <div v-else-if="slide.id === 22" id="thoiathoing" class="p-0 m-0">
                        <div class="cont p-2">
                            <div class="row header-row">
                                <h3 id="mshill" v-html="slide.wp_content"></h3>
                            </div>
                            <div class="row flex-row content-row">
                                <div v-for="(paragraph, index) in slide.paragraphs" :key="index"
                                    class="text-element col-sm-12 col-md-3 m-0 p-2" v-html="paragraph">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Slide 23 -->
                    <div v-else-if="slide.id === 23" id="bygone-bip" class="p-0 m-0">
                        <div class="container">
                            <div class="row">
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

                    <!-- Slide 59 -->
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

                    <!-- Slide 60 - Form -->
                    <div v-else-if="slide.id === 60" id="lemof">
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
                                        <div class="col-md-12">
                                            <button type="submit" class="btn btn-primary" :disabled="loading">
                                                {{ loading ? 'Sending...' : 'Submit' }}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>
</template>


<style lang="scss">
@use 'fullpage.js/dist/fullpage.min.css';

:root {
    overflow: hidden;
}

#vodacomwrapper {
    height: 100vh;
    position: fixed;
    width: 100%;
    background: url(/images/bg1.jpg) no-repeat center center fixed;
    -webkit-background-size: cover;
    -moz-background-size: cover;
    -o-background-size: cover;
    background-size: cover;
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
    background: white !important;
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

.text-element {
    margin: 20px 0;
    white-space: pre-line;
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

// Styles pour fullPage.js
#fullpage {
    .section {
        transition: all 0.7s ease;

        &.active {
            .slide-container {
                animation: fadeIn 0.8s ease-in-out;
            }
        }
    }
}

// Styles pour le scroll des slides 21 et 22
.scroll-container {
    height: 100vh;
    overflow: hidden;

    .cont {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .header-row {
        padding: 2em 0;
    }

    .content-row {
        flex: 1;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
    }
}

// Styles du formulaire
.contact-form {

    input[type="submit"],
    button.btn.btn-primary {
        background: #e60000;
        color: white;
        border: none;
        padding: 12px 30px;
        border-radius: 25px;
        cursor: pointer;
        font-family: "Vodafone";
        font-size: 30px;
        width: 100%;
    }

    .row {
        padding: 0em 2em;
    }

    input {
        flex-grow: 0;
        margin: 15px 0;
        border-radius: 25px;
        border: solid 2px #fff;
        background: rgba(255, 255, 255, 0) !important;
        color: white;
        font-family: "Vodafone";
        font-size: 30px;

        &:focus {
            border-color: #e60000;
            outline: none;
            color: #fff;
        }

        &::placeholder {
            color: white;
        }
    }
}

@media screen and (max-width: 1024px) {
    .scroll-container {
        .header-row {
            position: sticky;
            top: 0;
            background: inherit;
            z-index: 1;
            padding: 1em;
        }

        .content-row {
            padding: 1em;

            .text-element {
                margin: 1em 0;
            }
        }
    }

    .contact-form {

        input,
        button {
            font-size: 20px;
        }
    }
}
</style>